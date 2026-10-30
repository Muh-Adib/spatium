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
        name: 'SegiaTech',
        tagline: 'Rekayasa Pengalaman Digital, Website Performa Tinggi & Sistem Terintegrasi',
        description: 'Studio rekayasa digital terdepan di Indonesia.',
        url: 'https://www.segiatech.com',
        whatsapp: '6285227702811',
        email: 'contact@segiatech.com',
        phone: '+62 852-2770-2811',
        address: 'Yogyakarta, Indonesia',
        logoUrl: '/images/logo.png',
        faviconUrl: '/favicon.ico',
        socialLinks: {
          instagram: 'https://instagram.com/segiatech',
          linkedin: 'https://linkedin.com/company/segiatech',
          github: 'https://github.com/segiatech',
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

    const existing = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()

    const payload = {
      name: String((body as any).siteName || body.name || 'SegiaTech'),
      tagline: body.tagline || null,
      description: body.metaDescription || (body as any).description || null,
      url: String((body as any).canonicalUrl || (body as any).url || 'https://www.segiatech.com'),
      whatsapp: body.whatsapp || null,
      email: body.contactEmail || (body as any).email || null,
      phone: (body as any).phone ? String((body as any).phone) : null,
      address: body.address || null,
      logoUrl: (body as any).logoUrl || null,
      faviconUrl: (body as any).faviconUrl || null,
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
    } catch {}

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
