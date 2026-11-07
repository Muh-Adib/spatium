import { describe, expect, it } from 'vitest'
import { actorKindOf, buildCatalogHistory, changedColumns, type RevisionRow } from '../src/lib/catalog/history'
import { changedFieldLabels, formFromSnapshot, historyActionLabel, rowToForm, toSavePayload, type EntityRow } from '../src/components/studio/entity/model'

/** Revision rows as the writers store them: `create` = after, everything else = before. */
const v1 = { id: 7, slug: 'museum', title: 'Museum v1', summary: 'Ringkasan satu', status: 'draft', updatedAt: '2026-11-01T10:00:00Z', blocks: '[]' }
const v2 = { ...v1, title: 'Museum v2', updatedAt: '2026-11-02T10:00:00Z' }
const v3 = { ...v2, summary: 'Ringkasan tiga', status: 'published', updatedAt: '2026-11-03T10:00:00Z' }

const rev = (id: number, action: string, actor: string, snapshot: unknown, createdAt: string): RevisionRow => ({
  id,
  action,
  actor,
  createdAt,
  snapshot: JSON.stringify(snapshot),
})

describe('catalog history', () => {
  // Newest first: v1 created, then v1 → v2 by MCP, then v2 → v3 by a Studio user.
  const rows = [
    rev(3, 'update', 'editor@spatium.test', v2, '2026-11-03T10:00:00Z'),
    rev(2, 'update', 'mcp:writer-key', v1, '2026-11-02T10:00:00Z'),
    rev(1, 'create', 'editor@spatium.test', v1, '2026-11-01T10:00:00Z'),
  ]

  it('gives each change the content it produced, newest first', () => {
    const history = buildCatalogHistory(rows, v3, true)
    expect(history.map((e) => e.id)).toEqual([3, 2, 1])
    expect(history[0]).toMatchObject({ isCurrent: true, version: v3, statusChange: { from: 'draft', to: 'published' } })
    expect(history[0].changedFields).toEqual(['summary'])
    expect(history[1]).toMatchObject({ isCurrent: false, version: v2, changedFields: ['title'], statusChange: null })
    expect(history[2]).toMatchObject({ action: 'create', version: v1, isCurrent: false, changedFields: [] })
  })

  it('keeps MCP actors visible and labelled', () => {
    const history = buildCatalogHistory(rows, v3, true)
    expect(history[1]).toMatchObject({ actor: 'mcp:writer-key', actorKind: 'mcp' })
    expect(actorKindOf('editor@spatium.test')).toBe('user')
    expect(actorKindOf('scheduler')).toBe('system')
  })

  it('offers the oldest stored content when the first change is not a create (seeded rows)', () => {
    const history = buildCatalogHistory(rows.slice(0, 2), v3, true)
    expect(history.at(-1)).toMatchObject({ kind: 'baseline', action: 'baseline', version: v1, createdAt: v1.updatedAt })
    expect(buildCatalogHistory(rows.slice(0, 2), v3, false).some((e) => e.kind === 'baseline')).toBe(false)
  })

  it('ignores bookkeeping columns and tolerates broken snapshots', () => {
    expect(changedColumns({ id: 1, updatedAt: 'a', title: 'x' }, { id: 2, updatedAt: 'b', title: 'x' })).toEqual([])
    const broken = buildCatalogHistory([{ id: 9, action: 'update', actor: 'a@b.c', createdAt: 'now', snapshot: '{oops' }], v3, true)
    expect(broken).toHaveLength(1)
    expect(broken[0]).toMatchObject({ version: v3, changedFields: [] })
  })

  it('labels actions and columns in Indonesian', () => {
    expect(historyActionLabel('update:tour-upload')).toBe('Tur diunggah ulang')
    expect(changedFieldLabels(['longDescription', 'description', 'blocks'])).toEqual(['Deskripsi lengkap', 'Blok'])
  })
})

describe('restore a version (snapshot → form)', () => {
  const stored: EntityRow = {
    id: 7,
    slug: 'museum-baru',
    title: 'Museum terbaru',
    summary: 'Ringkasan terbaru',
    metaTitle: 'Meta terbaru',
    status: 'published',
    seoData: '{"coverAlt":"Alt terbaru"}',
    metrics: '[{"label":"pointCount","value":"2 miliar"}]',
    blocks: JSON.stringify([{ id: 'p1', type: 'paragraph', text: 'Baru' }]),
  }
  const snapshot = {
    id: 7,
    slug: 'museum',
    title: 'Museum lama',
    summary: 'Ringkasan lama',
    metaTitle: 'Meta lama',
    status: 'draft',
    seoData: '{"coverAlt":"Alt lama"}',
    metrics: '[{"label":"pointCount","value":"1 miliar"}]',
    blocks: JSON.stringify([{ id: 'p0', type: 'paragraph', text: 'Lama' }]),
  }

  it('loads fields and blocks, keeps slug, and leaves status to the server', () => {
    const current = rowToForm('portfolio', stored)
    const restored = formFromSnapshot('portfolio', snapshot, current)
    expect(restored.kind).toBe('portfolio')
    if (restored.kind !== 'portfolio') return
    expect(restored).toMatchObject({ title: 'Museum lama', summary: 'Ringkasan lama', metaTitle: 'Meta lama', coverAlt: 'Alt lama', pointCount: '1 miliar' })
    expect(restored.slug).toBe('museum-baru')
    expect(restored.blocks.map((b) => b.id)).toEqual(['p0'])
    // Saving it sends the restored fields as changes, never a status.
    const payload = toSavePayload(restored, current, stored, { expectedUpdatedAt: '2026-11-03T10:00:00Z' })
    expect(payload).toMatchObject({ id: 7, slug: 'museum-baru', title: 'Museum lama', summary: 'Ringkasan lama', expectedUpdatedAt: '2026-11-03T10:00:00Z' })
    expect(payload).not.toHaveProperty('status')
  })

  it('keeps a service’s linked portfolios (not in snapshots)', () => {
    const current = rowToForm('service', { id: 3, slug: 'scan', name: 'Scan', categoryId: 1, portfolioIds: [4, 5] })
    const restored = formFromSnapshot('service', { id: 3, slug: 'scan-lama', name: 'Scan lama', categoryId: 2 }, current)
    expect(restored).toMatchObject({ kind: 'service', name: 'Scan lama', categoryId: 2, slug: 'scan', portfolioIds: [4, 5] })
  })
})
