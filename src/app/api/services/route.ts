import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { requireCan } from '@/lib/auth/capabilities'
import { parseBlocks } from '@/lib/blocks/schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    let query = prisma.orm.public.Service.orderBy((s: any) => s.order.asc())
    if (categoryId) {
      query = query.where({ categoryId: Number(categoryId) })
    }

    const rows = await query.all()
    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data layanan.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 1024 * 1024) {
    return NextResponse.json({ success: false, error: 'Ukuran payload melebihi batas 1MB.' }, { status: 413 })
  }

  try {
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const auth = await requireCan(request, rawBody.id ? 'service:update' : 'service:create')
    if (auth.error) return auth.error

    const {
      id,
      name,
      slug,
      categoryId,
      indexNumber,
      categoryBadge,
      highlightWord,
      shortDescription,
      longDescription,
      description,
      whatsappPrompt,
      primaryMedia,
      metrics,
      blocks,
      status,
      icon,
      heroImage,
      features,
      technologies,
      faq,
      order,
      featured,
      metaTitle,
      metaDescription,
      focusKeyphrase,
      relatedKeyphrases,
      portfolioIds,
    } = rawBody

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Nama dan slug layanan wajib diisi.' },
        { status: 400 }
      )
    }

    let parsedBlocksJson: string | null = null
    if (blocks) {
      const parsed = parseBlocks(blocks)
      if (!parsed.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validasi blok katalog gagal.',
            issues: parsed.issues,
          },
          { status: 422 }
        )
      }
      parsedBlocksJson = JSON.stringify(parsed.blocks)
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-')

    const payload: any = {
      name,
      slug: cleanSlug,
      categoryId: categoryId ? Number(categoryId) : null,
      indexNumber: indexNumber || null,
      categoryBadge: categoryBadge || null,
      highlightWord: highlightWord || null,
      shortDescription: shortDescription || null,
      longDescription: longDescription || null,
      description: description || longDescription || shortDescription || null,
      whatsappPrompt: whatsappPrompt || null,
      primaryMedia: primaryMedia ? (typeof primaryMedia === 'string' ? primaryMedia : JSON.stringify(primaryMedia)) : null,
      metrics: metrics ? (typeof metrics === 'string' ? metrics : JSON.stringify(metrics)) : null,
      blocks: parsedBlocksJson,
      status: status || 'published',
      icon: icon || null,
      heroImage: heroImage || null,
      features: features ? (typeof features === 'string' ? features : JSON.stringify(features)) : null,
      technologies: technologies ? (typeof technologies === 'string' ? technologies : JSON.stringify(technologies)) : null,
      faq: faq ? (typeof faq === 'string' ? faq : JSON.stringify(faq)) : null,
      order: order ? parseInt(String(order), 10) : 0,
      featured: Boolean(featured),
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeyphrase: focusKeyphrase || null,
      relatedKeyphrases: relatedKeyphrases ? (typeof relatedKeyphrases === 'string' ? relatedKeyphrases : JSON.stringify(relatedKeyphrases)) : null,
      updatedAt: new Date().toISOString(),
    }

    let serviceId: number

    if (id) {
      await prisma.orm.public.Service.where({ id: Number(id) }).update(payload)
      serviceId = Number(id)
    } else {
      const existing = await prisma.orm.public.Service.where({ slug: cleanSlug }).first()
      if (existing) {
        await prisma.orm.public.Service.where({ slug: cleanSlug }).update(payload)
        serviceId = existing.id
      } else {
        const inserted = await prisma.orm.public.Service.create(payload)
        serviceId = inserted.id
      }
    }

    // Update relasi service_portfolios jika ada
    if (portfolioIds && Array.isArray(portfolioIds)) {
      const existingLinks = await prisma.orm.public.ServicePortfolio.where({ serviceId }).all()
      for (const link of existingLinks) {
        await prisma.orm.public.ServicePortfolio.where({ serviceId: link.serviceId, portfolioId: link.portfolioId }).delete()
      }
      let pOrder = 1
      for (const pId of portfolioIds) {
        await prisma.orm.public.ServicePortfolio.create({
            serviceId,
            portfolioId: Number(pId),
            displayOrder: pOrder++,
          })
      }
    }

    await revalidateCatalog('service', cleanSlug)

    return NextResponse.json({
      success: true,
      message: 'Layanan berhasil disimpan ke database.',
      id: serviceId,
      slug: cleanSlug,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan layanan.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'service:delete')
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib disertakan.' }, { status: 400 })
    }

    const existing = await prisma.orm.public.Service.where({ id: Number(id) }).first()
    await prisma.orm.public.Service.where({ id: Number(id) }).delete()

    if (existing?.slug) {
      await revalidateCatalog('service', existing.slug)
    }

    return NextResponse.json({ success: true, message: 'Layanan berhasil dihapus.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
