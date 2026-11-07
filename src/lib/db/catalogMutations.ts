import 'server-only'
import { NextResponse } from 'next/server'
import { prisma } from './prisma'
import type { AuthenticatedUser } from '@/lib/auth/rbac'
import { validateCatalogPublication, type PublicationGateInput } from '@/lib/blocks/publication-gate'
import { validateBlockListFor } from '@/lib/blocks/catalog'
import type { EntityTarget } from '@/lib/blocks/define'
import { buildPreset } from '@/blocks/presets'
import { PublicError } from '@/lib/http/errors'

/**
 * Shared helpers for the catalog mutation routes (portfolio, service, service
 * category).
 *
 * History rows are written inside the same transaction as the data change so the
 * revision trail and audit log never drift from the row (AGENTS.md §3.6).
 */
export type CatalogTx = Parameters<Parameters<typeof prisma.transaction>[0]>[0]

export type CatalogHistoryEntity = 'portfolio' | 'service' | 'service_category'

/** Glossary names (docs/EDITORS.md) used in user-facing messages. */
export const CATALOG_LABEL: Record<CatalogHistoryEntity, { one: string; title: string }> = {
  portfolio: { one: 'portofolio', title: 'Portofolio' },
  service: { one: 'layanan', title: 'Layanan' },
  service_category: { one: 'kategori layanan', title: 'Kategori layanan' },
}

/** 413 for a body over the route limit. */
export function payloadTooLargeResponse(limitMb: number): NextResponse {
  return NextResponse.json(
    { success: false, code: 'too_large', error: `Data terlalu besar (maksimal ${limitMb} MB). Kurangi isi blok lalu simpan lagi.` },
    { status: 413 },
  )
}

/** Reads a JSON object body; 400 with a readable message otherwise. */
export async function readCatalogBody(
  request: Request,
  context: string,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  let raw: unknown = null
  try {
    raw = await request.json()
  } catch (err) {
    console.warn(`[${context}] invalid JSON body:`, err)
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: 'invalid', error: 'Data yang dikirim tidak terbaca. Muat ulang halaman lalu coba lagi.' },
        { status: 400 },
      ),
    }
  }
  return { ok: true, body: raw as Record<string, unknown> }
}

/** 404 thrown inside a catalog handler when the row is gone. */
export function catalogNotFound(entity: CatalogHistoryEntity): PublicError {
  return new PublicError(`${CATALOG_LABEL[entity].title} ini tidak ditemukan. Mungkin sudah dihapus; kembali ke daftar lalu muat ulang.`, 404, {
    code: 'not_found',
  })
}

/** 409 when the slug belongs to another row of the same entity. */
export function catalogSlugTaken(entity: CatalogHistoryEntity, slug: string): PublicError {
  return new PublicError(`Slug "${slug}" sudah dipakai ${CATALOG_LABEL[entity].one} lain. Pilih slug lain.`, 409, { code: 'slug_taken' })
}

/**
 * Optimistic concurrency for catalog updates. Call inside the transaction on
 * the row read with `forUpdate()`: throws 404 when it is gone and 409
 * (`code: 'conflict'`, `currentUpdatedAt`) when `expectedUpdatedAt` was sent
 * and the row changed since. Without `expectedUpdatedAt` the save proceeds
 * (older clients, scripts).
 */
export function assertCatalogFresh<T extends { updatedAt: string }>(
  entity: CatalogHistoryEntity,
  current: T | null,
  expectedUpdatedAt: string | null | undefined,
): T {
  if (!current) throw catalogNotFound(entity)
  if (expectedUpdatedAt && expectedUpdatedAt !== current.updatedAt) {
    throw new PublicError(
      `${CATALOG_LABEL[entity].title} ini sudah diubah orang lain sejak Anda membukanya. Muat versi terbaru, atau timpa dengan perubahan Anda.`,
      409,
      { code: 'conflict', details: { currentUpdatedAt: current.updatedAt } },
    )
  }
  return current
}

export function actorOf(user: AuthenticatedUser): string {
  return user.email || user.name || user.id
}

export async function recordCatalogHistory(
  tx: CatalogTx,
  entityType: CatalogHistoryEntity,
  entityId: number | string,
  actor: string,
  action: string,
  snapshot: unknown,
  diff?: Record<string, unknown>,
): Promise<void> {
  await tx.orm.public.ContentRevision.create({
    entityType,
    entityId: String(entityId),
    actor,
    action,
    snapshot: JSON.stringify(snapshot ?? null),
  })
  await tx.orm.public.SeoAuditLog.create({
    entityType,
    entityId: String(entityId),
    actor,
    action,
    diff: diff ? JSON.stringify(diff) : null,
  })
}

/** `title-Like This` → `title-like-this`; empty when nothing usable remains. */
export function normalizeCatalogSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stores structured values as JSON text; strings pass through, empty values become null. */
export function jsonColumn(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  return typeof value === 'string' ? value : JSON.stringify(value)
}

/** Parses a JSON object column/input; `null` when absent or malformed. */
export function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch (err) {
    console.warn('[catalog] JSON object column is malformed:', err)
    return null
  }
}

/** Parses a JSON array column/input; `undefined` when absent or malformed. */
export function parseJsonArray(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : undefined
  } catch (err) {
    console.warn('[catalog] JSON array column is malformed:', err)
    return undefined
  }
}

/** Cover alt text stored in `seoData.coverAlt` (the field the gate checks). */
export function coverAltFrom(seoData: unknown): string | undefined {
  const seo = parseJsonObject(seoData)
  const alt = seo?.coverAlt
  return typeof alt === 'string' && alt.trim() ? alt.trim() : undefined
}

export function toIntOrDefault(value: string | number | null | undefined, fallback: number): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = typeof value === 'number' ? value : parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Runs the catalog publication gate (AGENTS.md §3.5). Returns a 422 response
 * listing the unmet requirements, or `null` when the item may go live.
 */
export function catalogGateResponse(input: PublicationGateInput): NextResponse | null {
  const gate = validateCatalogPublication(input)
  if (gate.canPublish) return null
  return NextResponse.json(
    {
      success: false,
      code: 'gate',
      error: 'Belum bisa diterbitkan. Lengkapi syarat publikasi yang ditandai lalu terbitkan lagi.',
      issues: gate.issues,
      warnings: gate.warnings,
    },
    { status: 422 },
  )
}

/**
 * Validates the `blocks` of a catalog save against its target (unknown or
 * misplaced types → 422 with per-block issues) and returns the column value:
 * `undefined` = leave unchanged, `null` = clear (the page then renders its
 * preset), a JSON string otherwise. Creating without blocks (absent, null or
 * `[]`) stores the target's preset, so new entries start from the default page.
 */
export function catalogBlocksColumn(
  target: EntityTarget,
  raw: unknown,
  mode: 'create' | 'update',
): { ok: true; value: string | null | undefined } | { ok: false; response: NextResponse } {
  const preset = () => JSON.stringify(buildPreset(target, { ids: 'fresh' }))
  if (raw === undefined) return { ok: true, value: mode === 'create' ? preset() : undefined }
  if (raw === null || raw === '') return { ok: true, value: mode === 'create' ? preset() : null }
  const list = parseJsonArray(raw)
  if (list === undefined) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: 'invalid', error: 'Format blok tidak valid: blok harus dikirim sebagai daftar. Muat ulang editor lalu simpan lagi.' },
        { status: 400 },
      ),
    }
  }
  const check = validateBlockListFor(target, list)
  if (!check.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          code: 'invalid',
          error:
            check.issues.length === 1
              ? 'Ada 1 masalah pada blok. Perbaiki blok yang ditandai lalu simpan lagi.'
              : `Ada ${check.issues.length} masalah pada blok. Perbaiki blok yang ditandai lalu simpan lagi.`,
          issues: check.issues.map((i) => (i.index >= 0 ? `Blok ${i.index + 1}${i.type ? ` (${i.type})` : ''}: ${i.message}` : i.message)),
          blockIssues: check.issues,
        },
        { status: 422 },
      ),
    }
  }
  if (check.blocks.length === 0) return { ok: true, value: mode === 'create' ? preset() : null }
  return { ok: true, value: JSON.stringify(check.blocks) }
}

type DefinedKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T]
type MaybeKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? K : never }[keyof T]
export type WithoutUndefined<T> = { [K in DefinedKeys<T>]: T[K] } & { [K in MaybeKeys<T>]?: Exclude<T[K], undefined> }

/** Drops `undefined` values so an update only writes the fields the request carried. */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): WithoutUndefined<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out as WithoutUndefined<T>
}

/**
 * When a published item's slug changes, keep the old public URL working with a
 * 301 (same rule the dynamic pages follow). No-op for drafts or unchanged slugs.
 */
export async function redirectRenamedSlug(
  tx: CatalogTx,
  basePath: '/portfolio' | '/services',
  previous: { slug: string; status: string | null },
  nextSlug: string,
): Promise<void> {
  if (previous.slug === nextSlug || previous.status !== 'published') return
  const sourcePath = `${basePath}/${previous.slug}`
  const destinationPath = `${basePath}/${nextSlug}`
  await tx.orm.public.Redirect.upsert({
    conflictOn: { sourcePath },
    create: { sourcePath, destinationPath, statusCode: 301, reason: 'Catalog slug renamed', active: true },
    update: { destinationPath, active: true },
  })
}

/**
 * Merges an incoming `seoData` object into the stored one so editors that only
 * send `coverAlt` do not wipe other SEO keys. A string replaces the value as-is.
 */
export function mergeSeoData(stored: unknown, incoming: unknown): string | null {
  if (incoming === null || incoming === '') return null
  if (typeof incoming === 'string') return incoming
  const next = parseJsonObject(incoming)
  if (!next) return null
  return JSON.stringify({ ...(parseJsonObject(stored) ?? {}), ...next })
}
