import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { DraftError, EDITABLE_STATUSES } from '../tool-kit'

/**
 * Transaction helpers shared by the MCP portfolio and service draft
 * repositories (pages and articles use their own Studio repositories).
 */

export type Tx = Parameters<Parameters<typeof prisma.transaction>[0]>[0]

/** ContentRevision snapshot + SeoAuditLog entry, inside the caller's transaction. */
export async function recordHistory(
  tx: Tx,
  entityType: string,
  row: { id: number },
  actor: string,
  action: string,
  diff?: Record<string, unknown>,
): Promise<void> {
  await tx.orm.public.ContentRevision.create({
    entityType,
    entityId: String(row.id),
    actor,
    action,
    snapshot: JSON.stringify(row),
  })
  await tx.orm.public.SeoAuditLog.create({
    entityType,
    entityId: String(row.id),
    action,
    actor,
    diff: diff ? JSON.stringify(diff) : null,
  })
}

/** Throws unless the locked row is still a draft/in_review and unchanged since `expectedUpdatedAt`. */
export function assertEditable(
  label: string,
  row: { status: string | null; updatedAt: string } | null,
  expectedUpdatedAt: string,
): asserts row is { status: string | null; updatedAt: string } {
  if (!row) throw new DraftError('not_found', `${label} not found.`)
  // A missing status column value means the database default ("published").
  const status = row.status ?? 'published'
  if (!EDITABLE_STATUSES.includes(status)) {
    throw new DraftError('forbidden', `${label} is ${status}; MCP clients can only edit draft or in_review entries.`, { status })
  }
  if (row.updatedAt !== expectedUpdatedAt) {
    throw new DraftError('conflict', `${label} changed since you last read it. Nothing was saved.`, { currentUpdatedAt: row.updatedAt })
  }
}

export function parseJson(raw: string | null | undefined, context: string): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.warn(`[mcp] invalid JSON in ${context}:`, err)
    return null
  }
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
