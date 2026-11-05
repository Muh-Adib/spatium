import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'
import { portfolioMutationSchema, validateBody } from '@/lib/validation/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    let query = prisma.orm.public.Portfolio.orderBy((p: any) => p.year.desc())
    if (limit) query = query.limit(limit)
    const rows = await query.all()

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data portofolio.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  try {
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const validation = validateBody(portfolioMutationSchema, rawBody)
    if (!validation.success) {
      return validation.response
    }

    const {
      title,
      slug,
      client,
      year,
      category,
      summary,
      challenge,
      approach,
      solution,
      process,
      result,
      heroImage,
      liveUrl,
      featured,
      metrics,
      technologies,
      blocks,
      metaTitle,
      metaDescription,
      focusKeyphrase,
      relatedKeyphrases,
    } = rawBody

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: 'Judul dan slug portofolio wajib diisi.' },
        { status: 400 }
      )
    }

    const payload = {
      title,
      slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
      client: client || null,
      year: year ? parseInt(String(year), 10) : new Date().getFullYear(),
      category: category || 'Digital Product',
      summary: summary || null,
      challenge: challenge || null,
      approach: approach || null,
      solution: solution || null,
      process: process || null,
      result: result || null,
      heroImage: heroImage || null,
      liveUrl: liveUrl || null,
      featured: Boolean(featured),
      metrics: metrics ? (typeof metrics === 'string' ? metrics : JSON.stringify(metrics)) : null,
      technologies: technologies ? (typeof technologies === 'string' ? technologies : JSON.stringify(technologies)) : null,
      blocks: blocks ? (typeof blocks === 'string' ? blocks : JSON.stringify(blocks)) : null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeyphrase: focusKeyphrase || null,
      relatedKeyphrases: relatedKeyphrases ? (typeof relatedKeyphrases === 'string' ? relatedKeyphrases : JSON.stringify(relatedKeyphrases)) : null,
      seoData: rawBody.seoData ? (typeof rawBody.seoData === 'string' ? rawBody.seoData : JSON.stringify(rawBody.seoData)) : null,
      status: rawBody.status || 'published',
    }

    const existing = await prisma.orm.public.Portfolio.where({ slug: payload.slug }).first()

    if (existing) {
      await prisma.orm.public.Portfolio.where({ slug: payload.slug }).update(payload)
    } else {
      await prisma.orm.public.Portfolio.create(payload)
    }

    try {
      revalidatePath('/', 'layout')
      revalidatePath('/portofolio')
      revalidatePath(`/portofolio/${payload.slug}`)
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      message: 'Portofolio berhasil disimpan dan disinkronkan.',
      slug: payload.slug,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan portofolio.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    const slugParam = searchParams.get('slug')

    if (!idParam && !slugParam) {
      return NextResponse.json({ success: false, error: 'ID atau slug portofolio wajib disertakan.' }, { status: 400 })
    }

    if (idParam) {
      const id = parseInt(idParam, 10)
      await prisma.orm.public.Portfolio.where({ id }).delete()
    } else if (slugParam) {
      await prisma.orm.public.Portfolio.where({ slug: slugParam }).delete()
    }

    try {
      revalidatePath('/', 'layout')
      revalidatePath('/portofolio')
      if (slugParam) revalidatePath(`/portofolio/${slugParam}`)
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({ success: true, message: 'Portofolio berhasil dihapus.' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus portofolio.' },
      { status: 500 }
    )
  }
}
