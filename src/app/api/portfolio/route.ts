import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'
import { portfolioMutationSchema, validateBody } from '@/lib/validation/api-schemas'
import { validateCatalogPublication } from '@/lib/blocks/publication-gate'

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
      // Unknown capture year / category stay empty — never invented (AGENTS.md §3.3).
      year: year ? parseInt(String(year), 10) : null,
      category: category || null,
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
      // Default to DRAFT; publishing must pass the publication gate below (AGENTS.md §3.5).
      status: rawBody.status || 'draft',
    }

    if (payload.status === 'published') {
      const seo = typeof rawBody.seoData === 'string' ? safeJson(rawBody.seoData) : rawBody.seoData
      const gate = validateCatalogPublication({
        title: payload.title,
        slug: payload.slug,
        metaTitle: payload.metaTitle ?? undefined,
        metaDescription: payload.metaDescription ?? undefined,
        heroImage: payload.heroImage ?? undefined,
        heroImageAlt: typeof seo?.coverAlt === 'string' ? seo.coverAlt : undefined,
        blocks: Array.isArray(blocks) ? blocks : undefined,
      })
      if (!gate.canPublish) {
        return NextResponse.json(
          { success: false, error: 'Publikasi ditolak: syarat gerbang publikasi belum terpenuhi.', issues: gate.issues, warnings: gate.warnings },
          { status: 422 },
        )
      }
    }

    const existing = await prisma.orm.public.Portfolio.where({ slug: payload.slug }).first()

    if (existing) {
      await prisma.orm.public.Portfolio.where({ slug: payload.slug }).update(payload)
    } else {
      await prisma.orm.public.Portfolio.create(payload)
    }

    try {
      revalidatePath('/', 'layout')
      revalidatePath('/portfolio')
      revalidatePath(`/portfolio/${payload.slug}`)
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      message: 'Portofolio berhasil disimpan dan disinkronkan.',
      slug: payload.slug,
    })
  } catch (error) {
    console.error('[API portfolio] save failed:', error)
    return NextResponse.json({ success: false, error: 'Gagal menyimpan portofolio.' }, { status: 500 })
  }
}

function safeJson(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch (err) {
    console.warn('[API portfolio] seoData is not valid JSON:', err)
    return null
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
      revalidatePath('/portfolio')
      if (slugParam) revalidatePath(`/portfolio/${slugParam}`)
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({ success: true, message: 'Portofolio berhasil dihapus.' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus portofolio.' },
      { status: 500 }
    )
  }
}
