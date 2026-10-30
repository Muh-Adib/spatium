import 'server-only'
import { prisma } from './prisma'
import { CtaPreset, Locale } from '../seo/schema'

/**
 * Get all active CTA presets for a locale
 */
export async function getCtaPresets(locale: Locale = 'id'): Promise<CtaPreset[]> {
  try {
    const rows = await prisma.orm.public.CtaPreset
      .where({ locale, active: true })
      .orderBy((c: any) => c.createdAt.desc())
      .all()

    return rows.map((r: any) => {
      let contentObj = { title: '', description: '', primary: { label: '', href: '', rel: '', target: '_self' }, tracking: { eventId: 'cta_click', utm: {} } }
      let styleObj = { variant: 'banner' as const, bg: 'token:brand-600', text: '#ffffff', button: 'token:brand-accent', radius: 'lg' as const, align: 'center' as const, padding: 'standard' as const, darkMode: true }
      let placementObj = { mode: 'after-paragraph' as const, index: 3 }

      try {
        if (r.content) contentObj = JSON.parse(r.content)
        if (r.style) styleObj = JSON.parse(r.style)
        if (r.placement) placementObj = JSON.parse(r.placement)
      } catch {}

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        locale: r.locale as Locale,
        content: contentObj,
        style: styleObj,
        placement: placementObj,
        active: Boolean(r.active),
      }
    })
  } catch (err) {
    console.error('Failed to get CTA presets:', err)
    return []
  }
}

/**
 * Get single CTA preset by slug or ID
 */
export async function getCtaPreset(slugOrId: string | number): Promise<CtaPreset | null> {
  try {
    const row = typeof slugOrId === 'number'
      ? await prisma.orm.public.CtaPreset.where({ id: slugOrId }).first()
      : await prisma.orm.public.CtaPreset.where({ slug: slugOrId }).first()

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      locale: row.locale as Locale,
      content: JSON.parse(row.content),
      style: JSON.parse(row.style),
      placement: row.placement ? JSON.parse(row.placement) : undefined,
      active: Boolean(row.active),
    }
  } catch (err) {
    console.error('Failed to get CTA preset:', err)
    return null
  }
}

/**
 * Create a new CTA preset
 */
export async function createCtaPreset(data: CtaPreset): Promise<CtaPreset> {
  const created = await prisma.orm.public.CtaPreset.create({
      name: data.name,
      slug: data.slug,
      locale: data.locale || 'id',
      content: JSON.stringify(data.content),
      style: JSON.stringify(data.style),
      placement: data.placement ? JSON.stringify(data.placement) : null,
      active: data.active ?? true,
    })

  return getCtaPreset(created.id) as Promise<CtaPreset>
}

/**
 * Update an existing CTA preset
 */
export async function updateCtaPreset(id: number, data: Partial<CtaPreset>): Promise<CtaPreset | null> {
  const updatePayload: Record<string, any> = {}
  if (data.name !== undefined) updatePayload.name = data.name
  if (data.slug !== undefined) updatePayload.slug = data.slug
  if (data.locale !== undefined) updatePayload.locale = data.locale
  if (data.content !== undefined) updatePayload.content = JSON.stringify(data.content)
  if (data.style !== undefined) updatePayload.style = JSON.stringify(data.style)
  if (data.placement !== undefined) updatePayload.placement = JSON.stringify(data.placement)
  if (data.active !== undefined) updatePayload.active = data.active

  await prisma.orm.public.CtaPreset.where({ id }).update(updatePayload)
  return getCtaPreset(id)
}
