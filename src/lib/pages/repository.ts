import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { validateBlockList, type BlockIssue } from '@/lib/blocks/catalog'
import { computePageGate } from './gate'
import {
  pageInputSchema,
  pagePatchSchema,
  type PageInput,
  type PagePatch,
  type PageStatus,
  PAGE_STATUSES,
} from './page-schema'

/**
 * Data access for dynamic pages (`Page` rows rendered at `/<slug>`).
 * Every mutation runs in a transaction together with its `ContentRevision`
 * snapshot and `SeoAuditLog` entry, so history and audit never drift from data.
 */

export type PageRecord = {
  id: number
  slug: string
  title: string
  status: PageStatus
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  ogImageAlt: string | null
  robots: string
  blocks: unknown[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export type PageSummary = Pick<PageRecord, 'id' | 'slug' | 'title' | 'status' | 'updatedAt' | 'publishedAt'> & {
  blockCount: number
}

export type PageErrorCode = 'not_found' | 'conflict' | 'slug_taken' | 'invalid' | 'gate' | 'forbidden'

export class PageError extends Error {
  constructor(
    readonly code: PageErrorCode,
    message: string,
    readonly details: { issues?: string[]; blockIssues?: BlockIssue[] } = {},
  ) {
    super(message)
    this.name = 'PageError'
  }
}

type PageRow = {
  id: number
  slug: string
  title: string
  status: string
  metaTitle: string | null
  metaDescription: string | null
  seoData: string | null
  robots: string | null
  blocks: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

function isStatus(value: string): value is PageStatus {
  return (PAGE_STATUSES as readonly string[]).includes(value)
}

function parseJsonObject(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
  } catch (err) {
    console.warn('[pages] invalid JSON in seoData:', err)
    return {}
  }
}

function parseJsonArray(raw: string | null): unknown[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('[pages] invalid JSON in blocks:', err)
    return []
  }
}

function toRecord(row: PageRow): PageRecord {
  const seo = parseJsonObject(row.seoData)
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: isStatus(row.status) ? row.status : 'draft',
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: typeof seo.ogImage === 'string' ? seo.ogImage : null,
    ogImageAlt: typeof seo.ogImageAlt === 'string' ? seo.ogImageAlt : null,
    robots: row.robots ?? 'index, follow',
    blocks: parseJsonArray(row.blocks),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  }
}

function zodIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.map(String).join('.')}: ${i.message}` : i.message))
}

function serializeBlocks(raw: unknown[]): string {
  const result = validateBlockList(raw)
  if (!result.ok) {
    throw new PageError('invalid', 'Ada blok yang tidak valid.', { blockIssues: result.issues })
  }
  return JSON.stringify(result.blocks)
}

type Tx = Parameters<Parameters<typeof prisma.transaction>[0]>[0]

async function recordHistory(tx: Tx, page: PageRow, actor: string, action: string, diff?: Record<string, unknown>) {
  await tx.orm.public.ContentRevision.create({
    entityType: 'page',
    entityId: String(page.id),
    actor,
    action,
    snapshot: JSON.stringify(page),
  })
  await tx.orm.public.SeoAuditLog.create({
    entityType: 'page',
    entityId: String(page.id),
    action,
    actor,
    diff: diff ? JSON.stringify(diff) : null,
  })
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function listPages(options: { status?: PageStatus } = {}): Promise<PageSummary[]> {
  const base = prisma.orm.public.Page
  const query = options.status ? base.where({ status: options.status }) : base
  const rows = (await query.orderBy((p) => p.updatedAt.desc()).all()) as PageRow[]
  return rows.map((r) => {
    const rec = toRecord(r)
    return {
      id: rec.id,
      slug: rec.slug,
      title: rec.title,
      status: rec.status,
      updatedAt: rec.updatedAt,
      publishedAt: rec.publishedAt,
      blockCount: rec.blocks.length,
    }
  })
}

export async function getPageById(id: number): Promise<PageRecord | null> {
  const row = (await prisma.orm.public.Page.where({ id }).first()) as PageRow | null
  return row ? toRecord(row) : null
}

export async function getPageBySlug(slug: string): Promise<PageRecord | null> {
  const row = (await prisma.orm.public.Page.where({ slug }).first()) as PageRow | null
  return row ? toRecord(row) : null
}

/** Published page for the public route; null on miss or DB failure (logged). */
export async function getPublishedPage(slug: string): Promise<PageRecord | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const row = (await prisma.orm.public.Page.where({ slug, status: 'published' }).first()) as PageRow | null
    return row ? toRecord(row) : null
  } catch (err) {
    console.error('[pages] getPublishedPage failed:', err)
    return null
  }
}

export async function listPublishedSlugs(): Promise<{ slug: string; updatedAt: string; robots: string }[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const rows = (await prisma.orm.public.Page.where({ status: 'published' }).all()) as PageRow[]
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt, robots: r.robots ?? 'index, follow' }))
  } catch (err) {
    console.error('[pages] listPublishedSlugs failed:', err)
    return []
  }
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function createPage(input: PageInput, actor: string): Promise<PageRecord> {
  const parsed = pageInputSchema.safeParse(input)
  if (!parsed.success) throw new PageError('invalid', 'Data halaman tidak valid.', { issues: zodIssues(parsed.error) })
  const data = parsed.data
  const blocks = serializeBlocks(data.blocks)

  return prisma.transaction(async (tx) => {
    const clash = await tx.orm.public.Page.where({ slug: data.slug }).first()
    if (clash) throw new PageError('slug_taken', `Slug "${data.slug}" sudah dipakai halaman lain.`)
    const created = (await tx.orm.public.Page.create({
      documentId: `page-${data.slug}`,
      slug: data.slug,
      title: data.title,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      robots: data.robots ?? 'index, follow',
      seoData: JSON.stringify({ ogImage: data.ogImage ?? null, ogImageAlt: data.ogImageAlt ?? null }),
      blocks,
      kind: 'blocks',
      status: 'draft',
    })) as PageRow
    await recordHistory(tx, created, actor, 'create')
    return toRecord(created)
  })
}

export async function updatePage(id: number, patch: PagePatch, actor: string): Promise<PageRecord> {
  const parsed = pagePatchSchema.safeParse(patch)
  if (!parsed.success) throw new PageError('invalid', 'Data halaman tidak valid.', { issues: zodIssues(parsed.error) })
  const data = parsed.data

  return prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.Page.where({ id }).forUpdate().first()) as PageRow | null
    if (!current) throw new PageError('not_found', 'Halaman tidak ditemukan.')
    if (data.expectedUpdatedAt && data.expectedUpdatedAt !== current.updatedAt) {
      throw new PageError('conflict', 'Halaman sudah diubah orang lain sejak Anda membukanya. Muat ulang untuk melihat versi terbaru.')
    }
    if (data.slug && data.slug !== current.slug) {
      const clash = await tx.orm.public.Page.where({ slug: data.slug }).first()
      if (clash) throw new PageError('slug_taken', `Slug "${data.slug}" sudah dipakai halaman lain.`)
    }

    const seo = parseJsonObject(current.seoData)
    const values: Record<string, unknown> = {}
    if (data.title !== undefined) values.title = data.title
    if (data.slug !== undefined) values.slug = data.slug
    if (data.metaTitle !== undefined) values.metaTitle = data.metaTitle
    if (data.metaDescription !== undefined) values.metaDescription = data.metaDescription
    if (data.robots !== undefined) values.robots = data.robots
    if (data.ogImage !== undefined || data.ogImageAlt !== undefined) {
      values.seoData = JSON.stringify({
        ...seo,
        ...(data.ogImage !== undefined ? { ogImage: data.ogImage } : {}),
        ...(data.ogImageAlt !== undefined ? { ogImageAlt: data.ogImageAlt } : {}),
      })
    }
    if (data.blocks !== undefined) values.blocks = serializeBlocks(data.blocks)

    const updated = (await tx.orm.public.Page.where({ id }).update(values)) as PageRow | PageRow[] | null
    const row = (Array.isArray(updated) ? updated[0] : updated) ?? ((await tx.orm.public.Page.where({ id }).first()) as PageRow)
    await recordHistory(tx, current, actor, 'update', { fields: Object.keys(values) })
    // A slug change on a published page keeps the old URL working.
    if (data.slug && data.slug !== current.slug && current.status === 'published') {
      await tx.orm.public.Redirect.upsert({
        conflictOn: { sourcePath: `/${current.slug}` },
        create: { sourcePath: `/${current.slug}`, destinationPath: `/${data.slug}`, statusCode: 301, reason: 'Page slug renamed', active: true },
        update: { destinationPath: `/${data.slug}`, active: true },
      })
    }
    return toRecord(row)
  })
}

/** Issues that block publishing; empty when the page may go live. */
export function publicationIssues(page: PageRecord): { issues: string[]; warnings: string[]; blockIssues: BlockIssue[] } {
  return computePageGate(page)
}

export async function setPageStatus(id: number, status: PageStatus, actor: string): Promise<PageRecord> {
  return prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.Page.where({ id }).forUpdate().first()) as PageRow | null
    if (!current) throw new PageError('not_found', 'Halaman tidak ditemukan.')
    if (status === 'published') {
      const check = publicationIssues(toRecord(current))
      if (check.issues.length > 0 || check.blockIssues.length > 0) {
        throw new PageError('gate', 'Halaman belum memenuhi syarat publikasi.', {
          issues: check.issues,
          blockIssues: check.blockIssues,
        })
      }
    }
    const values: Record<string, unknown> = { status }
    if (status === 'published' && !current.publishedAt) values.publishedAt = new Date().toISOString()
    await tx.orm.public.Page.where({ id }).update(values)
    const row = (await tx.orm.public.Page.where({ id }).first()) as PageRow
    await recordHistory(tx, current, actor, `status:${status}`, { from: current.status, to: status })
    return toRecord(row)
  })
}

export async function deletePage(id: number, actor: string): Promise<void> {
  await prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.Page.where({ id }).forUpdate().first()) as PageRow | null
    if (!current) throw new PageError('not_found', 'Halaman tidak ditemukan.')
    await recordHistory(tx, current, actor, 'delete')
    await tx.orm.public.Page.where({ id }).delete()
  })
}

/** Snapshot history for the editor's "Riwayat" panel (newest first). */
export async function listPageRevisions(id: number, limit = 20): Promise<{ id: number; actor: string; action: string; createdAt: string }[]> {
  const rows = await prisma.orm.public.ContentRevision.where({ entityType: 'page', entityId: String(id) })
    .orderBy((r) => r.id.desc())
    .limit(limit)
    .all()
  return rows.map((r) => ({ id: r.id, actor: r.actor, action: r.action, createdAt: r.createdAt }))
}
