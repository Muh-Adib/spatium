import { NextRequest, NextResponse } from 'next/server'
import {
  getAllCategoriesWithCounts,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/db/articles'
import { requireUser, ROLE_PERMISSIONS } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// --- GET: List All Categories with Live Article Counts ------------------------
export async function GET(request: NextRequest) {
  try {
    const list = await getAllCategoriesWithCounts()
    return NextResponse.json({ success: true, data: list })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// --- POST: Create a New Category ---------------------------------------------
export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  const permissions = ROLE_PERMISSIONS[user.role]
  if (!permissions?.canCreateArticle) {
    return NextResponse.json(
      { error: `Peran '${user.role}' tidak memiliki izin membuat kategori.` },
      { status: 403 }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 })
    }

    const category = await createCategory({
      name: body.name.trim(),
      slug: typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      actor: user.id,
    })

    try {
      revalidatePath('/journal')
      revalidatePath('/admin')
    } catch (err) {
      console.warn('[revalidatePath error in /api/categories]:', err)
    }

    return NextResponse.json({
      success: true,
      data: category,
      message: `Kategori "${category.name}" berhasil dibuat.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat kategori.' }, { status: 400 })
  }
}

// --- PATCH / PUT: Update an Existing Category --------------------------------
export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  const permissions = ROLE_PERMISSIONS[user.role]
  if (!permissions?.canEditAnyDraft && user.role !== 'SUPER_ADMIN' && user.role !== 'CONTENT_ADMIN') {
    return NextResponse.json(
      { error: `Peran '${user.role}' tidak memiliki izin mengubah kategori.` },
      { status: 403 }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    const id = Number(body?.id)
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 })
    }

    const updated = await updateCategory(id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      description: body.description !== undefined ? (typeof body.description === 'string' ? body.description : null) : undefined,
      actor: user.id,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 })
    }

    try {
      revalidatePath('/journal')
      revalidatePath('/admin')
    } catch (err) {
      console.warn('[revalidatePath error in /api/categories]:', err)
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Kategori "${updated.name}" berhasil diperbarui.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui kategori.' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request)
}

// --- DELETE: Safely Delete Category (With Safe Article Reassignment) ---------
export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  const permissions = ROLE_PERMISSIONS[user.role]
  if (!permissions?.canDeleteArticle && user.role !== 'SUPER_ADMIN' && user.role !== 'CONTENT_ADMIN') {
    return NextResponse.json(
      { error: `Akses ditolak: Peran '${user.role}' tidak berwenang menghapus kategori.` },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryId = searchParams.get('id')
    const queryReassign = searchParams.get('reassignToId')

    let id = queryId ? Number(queryId) : null
    let reassignToId = queryReassign ? Number(queryReassign) : undefined

    if (!id) {
      const body = await request.json().catch(() => ({}))
      if (body?.id) id = Number(body.id)
      if (body?.reassignToId) reassignToId = Number(body.reassignToId)
    }

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID kategori yang akan dihapus wajib disertakan.' }, { status: 400 })
    }

    const result = await deleteCategory(id, {
      reassignToId: reassignToId && !Number.isNaN(reassignToId) ? reassignToId : undefined,
      actor: user.id,
    })

    try {
      revalidatePath('/journal')
      revalidatePath('/admin')
    } catch (err) {
      console.warn('[revalidatePath error in /api/categories]:', err)
    }

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus kategori.' }, { status: 400 })
  }
}
