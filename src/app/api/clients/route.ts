import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import {
  getAllClientLogos,
  createClientLogo,
  updateClientLogo,
  deleteClientLogo,
} from '@/lib/db/clientLogos'
import { errorResponse } from '@/lib/http/errors'
import { z } from 'zod'

/** Local path (`/brand/…`, `/uploads/…`) or an absolute https URL. */
const logoUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL logo wajib diisi.')
  .max(1000, 'URL logo terlalu panjang.')
  .refine((v) => (v.startsWith('/') && !v.startsWith('//')) || /^https:\/\/[^\s]+$/i.test(v), {
    message: 'URL logo harus path lokal (diawali "/") atau URL https.',
  })

const clientLogoInputSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, 'Nama klien wajib diisi.').max(120, 'Nama klien maksimal 120 karakter.'),
  logoUrl: logoUrlSchema,
  altText: z.string().trim().max(200, 'Alt text maksimal 200 karakter.').nullish(),
  order: z.number().int().min(0, 'Urutan tidak boleh negatif.').max(10000).nullish(),
  isActive: z.boolean().nullish(),
})

const idParamSchema = z.coerce.number().int().positive()

/** Edit the logo strip: same roles as the other content catalogs. */
const EDIT_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'] as const
const DELETE_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN'] as const

/** Logos render on the home page partner strip (src/app/page.tsx via getCorePartners). */
function revalidatePublic(): void {
  try {
    revalidatePath('/')
  } catch (err) {
    console.warn('[api/clients] revalidatePath failed:', err)
  }
}

const actorOf = (user: { email?: string; name: string }) => user.email ?? user.name

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const data = await getAllClientLogos()
    return NextResponse.json({ data })
  } catch (err) {
    return errorResponse('api/clients:list', err, 'Gagal memuat logo klien.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, [...EDIT_ROLES])
  if (auth.error) return auth.error
  const actor = actorOf(auth.user)

  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.warn('[api/clients] invalid JSON body:', err)
    return NextResponse.json({ error: 'Body permintaan harus JSON yang valid.' }, { status: 400 })
  }

  const parsed = clientLogoInputSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ field: i.path.map(String).join('.'), message: i.message }))
    return NextResponse.json(
      { error: issues.map((i) => i.message).join(' '), issues },
      { status: 422 }
    )
  }

  const { id, name, logoUrl, altText, order, isActive } = parsed.data
  const input = {
    name,
    logoUrl,
    altText: altText ?? undefined,
    order: order ?? undefined,
    isActive: isActive ?? undefined,
  }

  try {
    const result = id ? await updateClientLogo(id, input, actor) : await createClientLogo(input, actor)
    revalidatePublic()
    return NextResponse.json({
      success: true,
      data: result,
      message: `Logo klien "${name}" berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`,
    })
  } catch (err) {
    return errorResponse('api/clients:save', err, 'Gagal menyimpan logo klien.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, [...DELETE_ROLES])
  if (auth.error) return auth.error

  const id = idParamSchema.safeParse(request.nextUrl.searchParams.get('id'))
  if (!id.success) {
    return NextResponse.json({ error: 'Parameter id tidak valid.' }, { status: 400 })
  }

  try {
    const deleted = await deleteClientLogo(id.data, actorOf(auth.user))
    revalidatePublic()
    return NextResponse.json({
      success: true,
      message: `Logo klien "${deleted.name}" berhasil dihapus.`,
    })
  } catch (err) {
    return errorResponse('api/clients:delete', err, 'Gagal menghapus logo klien.')
  }
}
