import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'
import { settingsMutationSchema, validateBody } from '@/lib/validation/api-schemas'

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
          socialLinks: row.socialLinks ? JSON.parse(row.socialLinks) : {},
        },
      })
    }
    return NextResponse.json({
      success: true,
      data: {
        name: 'UNIMASI Studio',
        tagline: 'We Make Ideas Move — 2D & 3D Animation, Motion Graphics & Videotron',
        description: 'UNIMASI adalah studio animasi 2D, 3D, motion graphics, dan visual production untuk edukasi, industri, dan brands.',
        url: 'https://unimasi.studio',
        whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '',
        email: 'hello@unimasi.studio',
        phone: process.env.NEXT_PUBLIC_PHONE || '',
        address: 'Yogyakarta, Indonesia',
        logoUrl: '/logo/unimasi-coloured.webp',
        faviconUrl: '/favicon.svg',
        socialLinks: {
          instagram: 'https://instagram.com/unimasi.studio',
          linkedin: 'https://linkedin.com/company/unimasi',
          github: 'https://github.com/unimasi',
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat pengaturan.' },
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
      name: String(bodyRecord.siteName || body.name || 'UNIMASI Studio'),
      tagline: body.tagline || null,
      description: body.metaDescription || (typeof bodyRecord.description === 'string' ? bodyRecord.description : null),
      url: String(bodyRecord.canonicalUrl || bodyRecord.url || 'https://www.unimasi.com'),
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
    } catch {
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
      revalidatePath('/kontak')
      revalidatePath('/tentang')
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan situs berhasil diperbarui ke database dan cache revalidasi aktif.',
    })
  } catch (error: any) {
    console.error('Error saving site settings:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan pengaturan situs.' },
      { status: 500 }
    )
  }
}
