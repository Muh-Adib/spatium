import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSolutions } from '@/lib/db/solutions'
import { requireCan } from '@/lib/auth/capabilities'
import { parseBlocks } from '@/lib/blocks/schema'
import { revalidateCatalog } from '@/lib/cache/revalidate'

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB

export async function GET() {
  try {
    const list = await getSolutions()
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

  const auth = await requireCan(request, 'solution:update')
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
      category,
      shortDescription,
      description,
      heroImage,
      blocks,
      keyBenefits,
      technologies,
      order,
      featured,
      status,
      metaTitle,
      metaDescription,
      focusKeyphrase,
      relatedKeyphrases,
      portfolioIds,
    } = body

    if (!slug || !title) {
      return NextResponse.json({ success: false, error: 'Slug dan Judul Solusi wajib diisi.' }, { status: 400 })
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

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-')

    const payload: any = {
      slug: cleanSlug,
      title,
      category: category || 'taxonomy',
      shortDescription: shortDescription || null,
      description: description || shortDescription || null,
      heroImage: heroImage || null,
      blocks: blocks ? (typeof blocks === 'string' ? blocks : JSON.stringify(blocks)) : null,
      keyBenefits: keyBenefits ? (typeof keyBenefits === 'string' ? keyBenefits : JSON.stringify(keyBenefits)) : null,
      technologies: technologies ? (typeof technologies === 'string' ? technologies : JSON.stringify(technologies)) : null,
      order: order ? parseInt(String(order), 10) : 0,
      featured: Boolean(featured),
      status: status || 'published',
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeyphrase: focusKeyphrase || null,
      relatedKeyphrases: relatedKeyphrases ? (typeof relatedKeyphrases === 'string' ? relatedKeyphrases : JSON.stringify(relatedKeyphrases)) : null,
      updatedAt: new Date().toISOString(),
    }

    let solutionId: number

    if (id) {
      await prisma.orm.public.Solution.where({ id: Number(id) }).update(payload)
      solutionId = Number(id)
    } else {
      const existing = await prisma.orm.public.Solution.where({ slug: cleanSlug }).first()
      if (existing) {
        await prisma.orm.public.Solution.where({ slug: cleanSlug }).update(payload)
        solutionId = existing.id
      } else {
        const inserted = await prisma.orm.public.Solution.create(payload)
        solutionId = inserted.id
      }
    }

    // Update relasi solution_portfolios jika ada
    if (portfolioIds && Array.isArray(portfolioIds)) {
      const existingLinks = await prisma.orm.public.SolutionPortfolio.where({ solutionId }).all()
      for (const link of existingLinks) {
        await prisma.orm.public.SolutionPortfolio.where({ solutionId: link.solutionId, portfolioId: link.portfolioId }).delete()
      }
      let pOrder = 1
      for (const pId of portfolioIds) {
        await prisma.orm.public.SolutionPortfolio.create({
            solutionId,
            portfolioId: Number(pId),
            displayOrder: pOrder++,
          })
      }
    }

    await revalidateCatalog('solution', cleanSlug)

    return NextResponse.json({
      success: true,
      message: 'Solusi berhasil disimpan ke database.',
      id: solutionId,
      slug: cleanSlug,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'solution:delete')
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib disertakan.' }, { status: 400 })
    }

    const existing = await prisma.orm.public.Solution.where({ id: Number(id) }).first()
    await prisma.orm.public.Solution.where({ id: Number(id) }).delete()

    if (existing?.slug) {
      await revalidateCatalog('solution', existing.slug)
    }

    return NextResponse.json({ success: true, message: 'Solusi berhasil dihapus.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
