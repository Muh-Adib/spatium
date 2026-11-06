import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCtaPresets, getCtaPreset, createCtaPreset, updateCtaPreset, deleteCtaPreset } from '@/lib/db/cta'
import { CtaContentSchema, CtaPresetSchema, LocaleSchema } from '@/lib/seo/schema'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import { PublicError } from '@/lib/http/errors'

/** Same roles as capability `cta:manage`. */
const CTA_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'] as const
/** Deleting follows the other catalogs: admins only. */
const CTA_DELETE_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN'] as const

/** Internal path, https URL, mailto: or tel: — never javascript: or protocol-relative. */
const ctaHrefSchema = z
  .string()
  .trim()
  .min(1, 'Tautan tombol utama wajib diisi.')
  .max(1000)
  .refine(
    (v) => (v.startsWith('/') && !v.startsWith('//')) || v.startsWith('#') || /^(https:\/\/|mailto:|tel:)\S+$/i.test(v),
    { message: 'Tautan harus path internal (diawali "/"), URL https, mailto:, atau tel:.' },
  )

/** Full preset body (create and update both send the whole preset). */
const ctaBodySchema = CtaPresetSchema.extend({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, 'Nama preset wajib diisi.').max(120, 'Nama preset maksimal 120 karakter.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug minimal 2 karakter.')
    .max(80, 'Slug maksimal 80 karakter.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya huruf kecil, angka, dan tanda hubung.'),
  content: CtaContentSchema.extend({
    title: z.string().trim().min(1, 'Judul CTA wajib diisi.').max(200, 'Judul CTA maksimal 200 karakter.'),
    description: z.string().trim().max(600, 'Deskripsi maksimal 600 karakter.').default(''),
    primary: CtaContentSchema.shape.primary.extend({
      label: z.string().trim().min(1, 'Label tombol utama wajib diisi.').max(60, 'Label tombol maksimal 60 karakter.'),
      href: ctaHrefSchema,
    }),
  }),
})

function errors(messages: string[], status: number, fields?: { field: string; message: string }[]) {
  return NextResponse.json({ data: null, errors: messages, ...(fields ? { issues: fields } : {}) }, { status })
}

function fail(context: string, err: unknown, fallback: string) {
  if (err instanceof PublicError) return errors([err.message], err.status)
  console.error(`[api/cta] ${context} failed:`, err)
  return errors([fallback], 500)
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')
    const locale = LocaleSchema.safeParse(searchParams.get('locale') || 'id')
    if (!locale.success) return errors(['Locale tidak valid. Gunakan id atau en.'], 400)

    if (slug || id) {
      const numericId = id ? Number(id) : null
      if (numericId !== null && (!Number.isInteger(numericId) || numericId <= 0)) {
        return errors(['ID preset tidak valid.'], 400)
      }
      const preset = await getCtaPreset(slug || numericId || 0)
      if (!preset) {
        return NextResponse.json({ data: null, errors: ['Preset CTA tidak ditemukan.'] }, { status: 404 })
      }
      return NextResponse.json({ data: preset, errors: [], warnings: [] })
    }

    const presets = await getCtaPresets(locale.data)
    return NextResponse.json({
      data: presets,
      errors: [],
      warnings: [],
    })
  } catch (err) {
    return fail('list', err, 'Gagal memuat preset CTA.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, [...CTA_ROLES])
  if (auth.error) return auth.error
  const actor = auth.user.email ?? auth.user.name

  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.warn('[api/cta] invalid JSON body:', err)
    return errors(['Body permintaan harus JSON yang valid.'], 400)
  }

  const parsed = ctaBodySchema.safeParse(body)
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => ({ field: i.path.map(String).join('.'), message: i.message }))
    return errors(fields.map((f) => f.message), 422, fields)
  }

  try {
    const { id, ...data } = parsed.data
    if (id) {
      const updated = await updateCtaPreset(id, data, actor)
      return NextResponse.json({
        data: updated,
        message: 'Preset CTA berhasil diperbarui.',
        errors: [],
        warnings: [],
      })
    }

    const created = await createCtaPreset(data, actor)
    return NextResponse.json({
      data: created,
      message: 'Preset CTA baru berhasil disimpan.',
      errors: [],
      warnings: [],
    })
  } catch (err) {
    return fail('save', err, 'Gagal menyimpan preset CTA.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, [...CTA_DELETE_ROLES])
  if (auth.error) return auth.error

  const id = z.coerce.number().int().positive().safeParse(request.nextUrl.searchParams.get('id'))
  if (!id.success) return errors(['ID preset tidak valid.'], 400)

  try {
    const deleted = await deleteCtaPreset(id.data, auth.user.email ?? auth.user.name)
    return NextResponse.json({ data: { id: id.data }, message: `Preset CTA "${deleted.name}" dihapus.`, errors: [], warnings: [] })
  } catch (err) {
    return fail('delete', err, 'Gagal menghapus preset CTA.')
  }
}
