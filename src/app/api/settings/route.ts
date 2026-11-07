import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'
import { settingsMutationSchema, validateBody } from '@/lib/validation/api-schemas'

function parseSocialLinks(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) out[key] = value
    }
    return out
  } catch (error: unknown) {
    console.warn('[api/settings] SiteConfig.socialLinks is not valid JSON:', error)
    return {}
  }
}


export async function GET() {
  try {
    const row = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
    if (row) {
      return NextResponse.json({
        success: true,
        data: {
          name: row.name,
          tagline: row.tagline || '',
          description: row.description || '',
          url: row.url,
          whatsapp: row.whatsapp || '',
          email: row.email || '',
          phone: row.phone || '',
          address: row.address || '',
          logoUrl: row.logoUrl || '',
          faviconUrl: row.faviconUrl || '',
          socialLinks: parseSocialLinks(row.socialLinks),
        },
      })
    }
    return NextResponse.json({
      success: true,
      data: {
        name: 'SPATIUM',
        tagline: 'Real places. New perspectives.',
        description:
          'SPATIUM adalah studio teknologi spasial: laser scan, point cloud, geometri 3D, dan 3D Gaussian Splat untuk digital twin industri kreatif.',
        url: 'https://spatium.id',
        whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '',
        // AGENTS.md §3.3: public contact comes from env and stays empty when unset.
        email: process.env.NEXT_PUBLIC_STUDIO_EMAIL || '',
        phone: process.env.NEXT_PUBLIC_PHONE || '',
        address: '',
        logoUrl: '/brand/mark-spatium.svg',
        faviconUrl: '/favicon.svg',
        socialLinks: {},
      },
    })
  } catch (error: unknown) {
    console.error('[api/settings] GET failed:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pengaturan.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const rawBody: unknown = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const validation = validateBody(settingsMutationSchema, rawBody)
    if (!validation.success) {
      return validation.response
    }
    const body = validation.data

    const existing = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()

    // Partial update: only keys present in the request are written; '' clears a field.
    const nullable = (value: string | null | undefined) => (value === undefined ? undefined : value?.trim() || null)
    const payload: Partial<{
      name: string
      tagline: string | null
      description: string | null
      url: string
      whatsapp: string | null
      email: string | null
      phone: string | null
      address: string | null
      logoUrl: string | null
      faviconUrl: string | null
      socialLinks: string | null
    }> = {}
    if (body.name !== undefined) payload.name = body.name
    if (body.tagline !== undefined) payload.tagline = nullable(body.tagline)
    if (body.description !== undefined) payload.description = nullable(body.description)
    if (body.whatsapp !== undefined) payload.whatsapp = nullable(body.whatsapp)
    if (body.email !== undefined) payload.email = nullable(body.email)
    if (body.phone !== undefined) payload.phone = nullable(body.phone)
    if (body.address !== undefined) payload.address = nullable(body.address)
    if (body.logoUrl !== undefined) payload.logoUrl = nullable(body.logoUrl)
    if (body.faviconUrl !== undefined) payload.faviconUrl = nullable(body.faviconUrl)
    if (body.socialLinks !== undefined) {
      const links = Object.fromEntries(Object.entries(body.socialLinks).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0))
      payload.socialLinks = Object.keys(links).length ? JSON.stringify(links) : null
    }

    if (body.url !== undefined) {
      try {
        const siteUrl = new URL(body.url)
        if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password || siteUrl.search || siteUrl.hash) throw new Error('invalid')
        payload.url = siteUrl.href.replace(/\/$/, '')
      } catch (urlError: unknown) {
        console.warn('[api/settings] Rejected invalid site URL:', urlError)
        return NextResponse.json({ success: false, error: 'URL website harus berupa HTTP/HTTPS tanpa kredensial, query, atau fragmen.' }, { status: 400 })
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan untuk disimpan.' }, { status: 400 })
    }

    await prisma.transaction(async (tx) => {
      if (existing) {
        await tx.orm.public.SiteConfig.where({ id: 1 }).update(payload)
      } else {
        await tx.orm.public.SiteConfig.create({ id: 1, name: payload.name ?? 'SPATIUM', url: payload.url ?? 'https://spatium.id', ...payload })
      }
      await tx.orm.public.ContentRevision.create({
        entityType: 'site_config',
        entityId: '1',
        actor: auth.user.id,
        action: existing ? 'update' : 'create',
        snapshot: JSON.stringify({ before: existing ?? null, changes: payload }),
      })
      await tx.orm.public.SeoAuditLog.create({
        entityType: 'site_config',
        entityId: '1',
        actor: auth.user.id,
        action: 'UPDATE_SITE_SETTINGS',
        diff: JSON.stringify(Object.keys(payload)),
      })
    })

    // Site name, contact and social links render in the shared layout on every page.
    try {
      revalidatePath('/', 'layout')
      revalidatePath('/contact')
      revalidatePath('/about')
      revalidatePath('/sitemap.xml')
    } catch (err) {
      console.warn('[api/settings] revalidatePath failed:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan situs tersimpan.',
    })
  } catch (error: unknown) {
    console.error('[api/settings] POST failed:', error)
    return NextResponse.json({ success: false, error: 'Gagal menyimpan pengaturan situs.' }, { status: 500 })
  }
}
