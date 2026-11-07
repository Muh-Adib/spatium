import { NextRequest, NextResponse } from 'next/server'
import {
  getAllCategoriesWithCounts,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/db/articles'
import { requireCan } from '@/lib/auth/capabilities'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { errorResponse } from '@/lib/http/errors'
import { validateBody } from '@/lib/validation/api-schemas'

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi.').max(100, 'Nama kategori maksimal 100 karakter.'),
  slug: z.string().trim().max(120, 'Slug maksimal 120 karakter.').optional(),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter.').nullish(),
})
const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.coerce.number().int().positive('ID kategori wajib disertakan.'),
})
const idParam = z.coerce.number().int().positive()

function revalidateCategoryPaths() {
  try {
    revalidatePath('/journal')
    revalidatePath('/sitemap.xml')
    revalidatePath('/admin')
  } catch (err) {
    console.warn('[revalidatePath error in /api/categories]:', err)
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

// --- GET: List All Categories with Live Article Counts ------------------------
export async function GET(request: NextRequest) {
  try {
    const list = await getAllCategoriesWithCounts()
    return NextResponse.json({ success: true, data: list })
  } catch (err: unknown) {
    return errorResponse('api/categories GET', err, 'Gagal memuat kategori.')
  }
}

// --- POST: Create a New Category ---------------------------------------------
export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'article-category:create')
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const parsed = validateBody(categoryCreateSchema, await request.json().catch(() => null))
    if (!parsed.success) return parsed.response
    const body = parsed.data

    const category = await createCategory({
      name: body.name,
      slug: body.slug || undefined,
      description: body.description ?? undefined,
      actor: user.id,
    })

    revalidateCategoryPaths()

    return NextResponse.json({
      success: true,
      data: category,
      message: `Kategori "${category.name}" berhasil dibuat.`,
    })
  } catch (err: unknown) {
    return errorResponse('api/categories POST', err, 'Gagal membuat kategori.')
  }
}

// --- PATCH / PUT: Update an Existing Category --------------------------------
export async function PATCH(request: NextRequest) {
  const auth = await requireCan(request, 'article-category:update')
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const parsed = validateBody(categoryUpdateSchema, await request.json().catch(() => null))
    if (!parsed.success) return parsed.response
    const body = parsed.data

    const updated = await updateCategory(body.id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      actor: user.id,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 })
    }

    revalidateCategoryPaths()

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Kategori "${updated.name}" berhasil diperbarui.`,
    })
  } catch (err: unknown) {
    return errorResponse('api/categories PATCH', err, 'Gagal memperbarui kategori.')
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request)
}

// --- DELETE: Safely Delete Category (With Safe Article Reassignment) ---------
export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'article-category:delete')
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const { searchParams } = new URL(request.url)
    const queryId = searchParams.get('id')
    const queryReassign = searchParams.get('reassignToId')

    const idResult = idParam.safeParse(queryId)
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID kategori yang akan dihapus wajib disertakan.' }, { status: 400 })
    }
    const reassignResult = queryReassign ? idParam.safeParse(queryReassign) : null
    if (reassignResult && !reassignResult.success) {
      return NextResponse.json({ error: 'ID kategori tujuan tidak valid.' }, { status: 400 })
    }

    const result = await deleteCategory(idResult.data, {
      reassignToId: reassignResult?.data,
      actor: user.id,
    })

    revalidateCategoryPaths()

    const reassignMsg = result.destinationCategory
      ? `${result.reassignedCount} artikel telah dialihkan dengan aman ke kategori "${result.destinationCategory.name}".`
      : result.reassignedCount > 0
      ? `${result.reassignedCount} artikel telah diatur ke kategori umum.`
      : 'Tidak ada artikel yang terpengaruh.'

    return NextResponse.json({
      success: true,
      data: result,
      message: `Kategori "${result.deletedCategory.name}" berhasil dihapus. ${reassignMsg}`,
    })
  } catch (err: unknown) {
    return errorResponse('api/categories DELETE', err, 'Gagal menghapus kategori.')
  }
}
