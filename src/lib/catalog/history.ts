/**
 * Version history of a catalog entity (service category, service, portfolio)
 * from its `ContentRevision` rows. Pure and client-safe: the revisions route
 * builds the list, the editor's Riwayat tab renders it, tests cover it
 * (tests/catalog-history.test.ts).
 *
 * Every catalog writer (Studio routes, tour upload, MCP draft tools) stores
 * the row as it was **after** a `create…` and **before** any other change
 * (`update…`, `delete`). So the content a change produced is the snapshot of
 * the next newer revision, and for the newest one the current row.
 */

export type RevisionRow = { id: number; actor: string; action: string; createdAt: string; snapshot: string | null }

export type CatalogHistoryEntry = {
  /** Revision id; the baseline entry reuses the id of the revision whose snapshot it shows. */
  id: number
  /** `change`: a recorded save. `baseline`: the oldest stored content, before the first recorded change. */
  kind: 'change' | 'baseline'
  /** `user@example.test`, `mcp:<key>`, … as recorded. Empty for the baseline. */
  actor: string
  actorKind: 'user' | 'mcp' | 'system'
  /** Raw action (`create`, `update`, `update:tour-upload`, `create:tour-upload`, …). */
  action: string
  createdAt: string
  /** Columns that differ between the content before and after this change (status excluded). */
  changedFields: string[]
  statusChange: { from: string | null; to: string | null } | null
  /** The row as it was right after this change; `null` when it is not known. */
  version: Record<string, unknown> | null
  /** True for the newest entry: its version is what is stored now. */
  isCurrent: boolean
}

/** Bookkeeping columns: never shown as "changed" and never restored. */
const IGNORED = new Set(['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt', 'status', 'locale', 'translationGroupId'])

export function parseSnapshot(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
  } catch (err) {
    console.warn('[catalog-history] malformed revision snapshot:', err)
    return null
  }
}

const isCreate = (action: string) => action === 'create' || action.startsWith('create:')

export function actorKindOf(actor: string): CatalogHistoryEntry['actorKind'] {
  if (actor.startsWith('mcp:')) return 'mcp'
  if (actor.includes('@')) return 'user'
  return 'system'
}

/** Columns whose stored value differs (JSON-equal values count as the same). */
export function changedColumns(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  if (!before || !after) return []
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const out: string[] = []
  for (const key of keys) {
    if (IGNORED.has(key)) continue
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) out.push(key)
  }
  return out.sort()
}

const statusOf = (row: Record<string, unknown> | null): string | null => (row && typeof row.status === 'string' ? row.status : null)

/**
 * Newest-first history. `rows` are the newest revisions, newest first (the
 * route may cap them); `current` is the stored row now; `complete` says
 * whether `rows` reaches back to the first revision (then the oldest stored
 * content before it is offered as a baseline entry, e.g. for seeded rows).
 */
export function buildCatalogHistory(
  rows: readonly RevisionRow[],
  current: Record<string, unknown> | null,
  complete: boolean,
): CatalogHistoryEntry[] {
  const entries: CatalogHistoryEntry[] = []
  rows.forEach((row, i) => {
    const snapshot = parseSnapshot(row.snapshot)
    const newer = i > 0 ? rows[i - 1] : undefined
    const before = isCreate(row.action) ? null : snapshot
    let after: Record<string, unknown> | null
    if (row.action === 'delete') after = null
    else if (!newer && current) after = current
    else if (isCreate(row.action)) after = snapshot
    else if (!newer) after = null
    else after = isCreate(newer.action) ? null : parseSnapshot(newer.snapshot)

    const from = statusOf(before)
    const to = statusOf(after)
    entries.push({
      id: row.id,
      kind: 'change',
      actor: row.actor,
      actorKind: actorKindOf(row.actor),
      action: row.action,
      createdAt: row.createdAt,
      changedFields: changedColumns(before, after),
      statusChange: before && after && from !== to ? { from, to } : null,
      version: after,
      isCurrent: !newer && current !== null && after === current,
    })
  })

  const oldest = rows[rows.length - 1]
  if (complete && oldest && !isCreate(oldest.action)) {
    const snapshot = parseSnapshot(oldest.snapshot)
    if (snapshot) {
      entries.push({
        id: oldest.id,
        kind: 'baseline',
        actor: '',
        actorKind: 'system',
        action: 'baseline',
        createdAt: typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : oldest.createdAt,
        changedFields: [],
        statusChange: null,
        version: snapshot,
        isCurrent: false,
      })
    }
  }
  return entries
}
