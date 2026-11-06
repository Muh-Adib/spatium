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

function publicErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === 'production') return fallback
  return error instanceof Error && error.message ? error.message : fallback
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
        faviconUrl: '/brand/mark-spatium.svg',
        socialLinks: {},
      },
    })
  } catch (error: unknown) {
    console.error('[api/settings] GET failed:', error)
    return NextResponse.json(
      { success: false, error: publicErrorMessage(error, 'Gagal memuat pengaturan.') },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const validation = validateBody(settingsMutationSchema, rawBody)
    if (!validation.success) {
      return validation.response
    }

    const body = validation.data
    const bodyRecord = body as Record<string, unknown>

    const existing = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()

    const payload = {
      name: String(bodyRecord.siteName || body.name || 'SPATIUM'),
      tagline: body.tagline || null,
      description: body.metaDescription || (typeof bodyRecord.description === 'string' ? bodyRecord.description : null),
      url: String(bodyRecord.canonicalUrl || bodyRecord.url || 'https://spatium.id'),
      whatsapp: body.whatsapp || null,
      email: body.contactEmail || (typeof bodyRecord.email === 'string' ? bodyRecord.email : null),
      phone: bodyRecord.phone ? String(bodyRecord.phone) : (body.contactPhone || null),
      address: body.address || null,
      logoUrl: typeof bodyRecord.logoUrl === 'string' ? bodyRecord.logoUrl : null,
      faviconUrl: typeof bodyRecord.faviconUrl === 'string' ? bodyRecord.faviconUrl : null,
      socialLinks: body.socialLinks ? JSON.stringify(body.socialLinks) : null,
    }

    try {
      const siteUrl = new URL(payload.url)
      if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password || siteUrl.search || siteUrl.hash) throw new Error('invalid')
      payload.url = siteUrl.href.replace(/\/$/, '')
    } catch (urlError: unknown) {
      console.warn('[api/settings] Rejected invalid site URL:', urlError)
      return NextResponse.json({ success: false, error: 'URL website harus berupa HTTP/HTTPS tanpa kredensial, query, atau fragmen.' }, { status: 400 })
    }

    if (existing) {
      await prisma.orm.public.SiteConfig.where({ id: 1 }).update(payload)
    } else {
      await prisma.orm.public.SiteConfig.create({
          id: 1,
          ...payload,
        })
    }

    // Trigger instant ISR revalidation for layout and landing pages
    try {
      revalidatePath('/', 'layout')
      revalidatePath('/contact')
      revalidatePath('/about')
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan situs berhasil diperbarui ke database dan cache revalidasi aktif.',
    })
  } catch (error: unknown) {
    console.error('[api/settings] POST failed:', error)
    return NextResponse.json(
      { success: false, error: publicErrorMessage(error, 'Gagal menyimpan pengaturan situs.') },
      { status: 500 }
    )
  }
}
