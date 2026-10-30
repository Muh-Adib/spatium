import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServiceCategories, mapCategoryRow } from '@/lib/db/serviceCategories'
import { requireCan } from '@/lib/auth/capabilities'
import { parseBlocks } from '@/lib/blocks/schema'
import { revalidateCatalog } from '@/lib/cache/revalidate'

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB

export async function GET() {
  try {
    const list = await getServiceCategories()
    return NextResponse.json({ success: true, data: list })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Check payload size
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Ukuran payload melebihi batas 1MB.' },
      { status: 413 }
    )
  }

  const auth = await requireCan(request, 'category:update')
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const {
      id,
      slug,
      title,
      tag,
      shortDescription,
      heroImage,
      themePreset,
      keyOutcomes,
      blocks,
      order,
      status,
      showInNav,
      metaTitle,
      metaDescription,
      focusKeyphrase,
      relatedKeyphrases,
    } = body

    if (!slug || !title) {
      return NextResponse.json({ success: false, error: 'Slug dan Judul Departemen wajib diisi.' }, { status: 400 })
    }

    // Validate blocks with K-2 Block Schema
    if (blocks !== undefined && blocks !== null) {
      const parsedBlocks = parseBlocks(blocks)
      if (!parsedBlocks.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validasi blok katalog gagal.',
            issues: parsedBlocks.issues,
          },
          { status: 422 }
        )
      }
    }

    const payload: any = {
      slug,
      title,
      tag: tag || null,
      shortDescription: shortDescription || null,
      heroImage: heroImage || null,
      themePreset: themePreset || 'charcoal',
      keyOutcomes: typeof keyOutcomes === 'string' ? keyOutcomes : JSON.stringify(keyOutcomes || []),
      blocks: typeof blocks === 'string' ? blocks : JSON.stringify(blocks || []),
      order: Number(order) || 0,
      status: status || 'published',
      showInNav: showInNav !== undefined ? Boolean(showInNav) : true,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeyphrase: focusKeyphrase || null,
      relatedKeyphrases: typeof relatedKeyphrases === 'string' ? relatedKeyphrases : JSON.stringify(relatedKeyphrases || []),
      updatedAt: new Date().toISOString(),
    }

    let resultCategory: any = null

    if (id) {
      await prisma.orm.public.ServiceCategory.where({ id: Number(id) }).update(payload)
      const updated = await prisma.orm.public.ServiceCategory.where({ id: Number(id) }).first()
      resultCategory = updated ? mapCategoryRow(updated) : null
    } else {
      const inserted = await prisma.orm.public.ServiceCategory.create(payload)
      resultCategory = inserted ? mapCategoryRow(inserted) : null
    }

    await revalidateCatalog('category', slug)

    return NextResponse.json({ success: true, data: resultCategory })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'category:delete')
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib disertakan.' }, { status: 400 })
    }

    const existing = await prisma.orm.public.ServiceCategory.where({ id: Number(id) }).first()
    await prisma.orm.public.ServiceCategory.where({ id: Number(id) }).delete()

    if (existing?.slug) {
      await revalidateCatalog('category', existing.slug)
    }

    return NextResponse.json({ success: true, message: 'Departemen berhasil dihapus.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
