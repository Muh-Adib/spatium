import { NextRequest, NextResponse } from 'next/server'
import { getCtaPresets, getCtaPreset, createCtaPreset, updateCtaPreset } from '@/lib/db/cta'
import { Locale } from '@/lib/seo/schema'
import { requireUser, requireRole } from '@/lib/auth/rbac'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')
    const locale = (searchParams.get('locale') || 'id') as Locale

    if (slug || id) {
      const preset = await getCtaPreset(slug || parseInt(id!, 10))
      if (!preset) {
        return NextResponse.json({ data: null, errors: ['Preset CTA tidak ditemukan.'] }, { status: 404 })
      }
      return NextResponse.json({ data: preset, errors: [], warnings: [] })
    }

    const presets = await getCtaPresets(locale)
    return NextResponse.json({
      data: presets,
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal memuat preset CTA.'] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { id, ...data } = body

    if (id) {
      const updated = await updateCtaPreset(id, data)
      return NextResponse.json({
        data: updated,
        message: 'Preset CTA berhasil diperbarui.',
        errors: [],
        warnings: [],
      })
    }

    if (!data.name || !data.slug || !data.content) {
      return NextResponse.json(
        { data: null, errors: ['Nama, slug, dan konten CTA wajib diisi.'] },
        { status: 400 }
      )
    }

    const created = await createCtaPreset(data)
    return NextResponse.json({
      data: created,
      message: 'Preset CTA baru berhasil disimpan.',
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal menyimpan preset CTA.'] },
      { status: 500 }
    )
  }
}
