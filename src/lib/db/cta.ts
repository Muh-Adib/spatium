import 'server-only'
import { prisma } from './prisma'
import { CtaPreset, Locale } from '../seo/schema'
import { PublicError } from '@/lib/http/errors'

/**
 * CTA presets (Studio > CTA). Not rendered on the public site yet, so changes
 * need no revalidation. Every write runs in a transaction with its
 * ContentRevision snapshot and SeoAuditLog entry.
 */

type CtaRow = {
  id: number
  name: string
  slug: string
  locale: string
  content: string
  style: string
  placement: string | null
  active: boolean | null
  createdAt: string
  updatedAt: string
}

type Tx = Parameters<Parameters<typeof prisma.transaction>[0]>[0]

const EMPTY_CONTENT: CtaPreset['content'] = {
  title: '',
  description: '',
  primary: { label: '', href: '', rel: '', target: '_self' },
  tracking: { eventId: 'cta_click', utm: {} },
}
const DEFAULT_STYLE: CtaPreset['style'] = {
  variant: 'banner',
  bg: 'token:brand-600',
  text: '#ffffff',
  button: 'token:brand-accent',
  radius: 'lg',
  align: 'center',
  padding: 'standard',
  darkMode: true,
}

function parseJson<T>(raw: string | null, fallback: T, field: string, id: number): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[cta] invalid ${field} JSON on preset ${id}:`, err)
    return fallback
  }
}

function toPreset(r: CtaRow): CtaPreset {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    locale: r.locale === 'en' ? 'en' : 'id',
    content: parseJson(r.content, EMPTY_CONTENT, 'content', r.id),
    style: parseJson(r.style, DEFAULT_STYLE, 'style', r.id),
    placement: parseJson<CtaPreset['placement']>(r.placement, undefined, 'placement', r.id),
    active: Boolean(r.active),
  }
}

async function recordHistory(tx: Tx, row: CtaRow, actor: string, action: string, diff?: Record<string, unknown>) {
  await tx.orm.public.ContentRevision.create({
    entityType: 'cta_preset',
    entityId: String(row.id),
    actor,
    action,
    snapshot: JSON.stringify(row),
  })
  await tx.orm.public.SeoAuditLog.create({
    entityType: 'cta_preset',
    entityId: String(row.id),
    action,
    actor,
    diff: diff ? JSON.stringify(diff) : null,
  })
}

/**
 * Get all active CTA presets for a locale (throws on DB failure so the Studio can say so).
 */
export async function getCtaPresets(locale: Locale = 'id'): Promise<CtaPreset[]> {
  const rows = (await prisma.orm.public.CtaPreset
    .where({ locale, active: true })
    .orderBy((c) => c.createdAt.desc())
    .all()) as CtaRow[]
  return rows.map(toPreset)
}

/**
 * Get single CTA preset by slug or ID
 */
export async function getCtaPreset(slugOrId: string | number): Promise<CtaPreset | null> {
  const row = (typeof slugOrId === 'number'
    ? await prisma.orm.public.CtaPreset.where({ id: slugOrId }).first()
    : await prisma.orm.public.CtaPreset.where({ slug: slugOrId }).first()) as CtaRow | null
  return row ? toPreset(row) : null
}

/**
 * Create a new CTA preset
 */
export async function createCtaPreset(data: CtaPreset, actor: string): Promise<CtaPreset> {
  return prisma.transaction(async (tx) => {
    const clash = await tx.orm.public.CtaPreset.where({ slug: data.slug }).first()
    if (clash) throw new PublicError(`Slug "${data.slug}" sudah dipakai preset lain.`, 409)
    const row = (await tx.orm.public.CtaPreset.create({
      name: data.name,
      slug: data.slug,
      locale: data.locale || 'id',
      content: JSON.stringify(data.content),
      style: JSON.stringify(data.style),
      placement: data.placement ? JSON.stringify(data.placement) : null,
      active: data.active ?? true,
    })) as CtaRow
    await recordHistory(tx, row, actor, 'CREATE_CTA_PRESET', { slug: data.slug })
    return toPreset(row)
  })
}

/**
 * Update an existing CTA preset
 */
export async function updateCtaPreset(id: number, data: Partial<CtaPreset>, actor: string): Promise<CtaPreset> {
  return prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.CtaPreset.where({ id }).forUpdate().first()) as CtaRow | null
    if (!current) throw new PublicError('Preset CTA tidak ditemukan.', 404)
    if (data.slug !== undefined && data.slug !== current.slug) {
      const clash = await tx.orm.public.CtaPreset.where({ slug: data.slug }).first()
      if (clash) throw new PublicError(`Slug "${data.slug}" sudah dipakai preset lain.`, 409)
    }

    const values: Record<string, unknown> = {}
    if (data.name !== undefined) values.name = data.name
    if (data.slug !== undefined) values.slug = data.slug
    if (data.locale !== undefined) values.locale = data.locale
    if (data.content !== undefined) values.content = JSON.stringify(data.content)
    if (data.style !== undefined) values.style = JSON.stringify(data.style)
    if (data.placement !== undefined) values.placement = JSON.stringify(data.placement)
    if (data.active !== undefined) values.active = data.active

    if (Object.keys(values).length > 0) {
      await tx.orm.public.CtaPreset.where({ id }).update(values)
      // Snapshot is the state before the change.
      await recordHistory(tx, current, actor, 'UPDATE_CTA_PRESET', { fields: Object.keys(values) })
    }
    const updated = (await tx.orm.public.CtaPreset.where({ id }).first()) as CtaRow
    return toPreset(updated)
  })
}

/** Deletes a preset; its last snapshot stays in ContentRevision. */
export async function deleteCtaPreset(id: number, actor: string): Promise<CtaPreset> {
  return prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.CtaPreset.where({ id }).forUpdate().first()) as CtaRow | null
    if (!current) throw new PublicError('Preset CTA tidak ditemukan.', 404)
    await recordHistory(tx, current, actor, 'DELETE_CTA_PRESET')
    await tx.orm.public.CtaPreset.where({ id }).delete()
    return toPreset(current)
  })
}
