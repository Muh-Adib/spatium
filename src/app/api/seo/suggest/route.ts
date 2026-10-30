import { NextRequest, NextResponse } from 'next/server'
import { suggestSeoWithAi } from '@/lib/seo/ai-assistant'
import { prisma } from '@/lib/db/prisma'
import { Locale } from '@/lib/seo/schema'
import { getGscTopQueries } from '@/lib/gsc/queries'
import { requireUser } from '@/lib/auth/rbac'

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const {
      field,
      title = '',
      content = '',
      excerpt = '',
      focusKeyphrase = '',
      locale = 'id',
      extraParams = {},
      aiConfig,
    } = body

    if (!field) {
      return NextResponse.json(
        { data: null, errors: ['Field yang diminta wajib ditentukan (seoTitle, metaDescription, slug, focusKeyphrase, relatedKeyphrases, altText).'] },
        { status: 400 }
      )
    }

    // Load existing titles, slugs, and GSC queries for context
    const existingRows = await prisma.orm.public.Article
      .where({ locale: locale as Locale })
      .limit(200)
      .all()

    const existingTitles = existingRows.map((r: any) => r.metaTitle || r.title)
    const existingSlugs = existingRows.map((r: any) => r.slug)
    const gscResult = await getGscTopQueries(10).catch(() => null)
    const gscQueries = gscResult && gscResult.connected ? gscResult.data : []
    const hasKey = Boolean(aiConfig?.apiKey?.trim())

    const seoContext = {
      title,
      content,
      excerpt,
      focusKeyphrase,
      locale: locale as Locale,
      existingTitles,
      existingSlugs,
      gscTopQueries: gscQueries.map((q) => q.query),
      aiConfig,
    }

    if (field === 'all') {
      const [titleRes, descRes, slugRes] = await Promise.all([
        suggestSeoWithAi('seoTitle', seoContext, extraParams),
        suggestSeoWithAi('metaDescription', seoContext, extraParams),
        suggestSeoWithAi('slug', seoContext, extraParams),
      ])

      return NextResponse.json({
        data: {
          seoTitle: titleRes.value,
          metaDescription: descRes.value,
          slug: slugRes.value,
        },
        seoTitle: titleRes.value,
        metaDescription: descRes.value,
        slug: slugRes.value,
        needsKey: !hasKey,
        errors: [...titleRes.validation.errors, ...descRes.validation.errors, ...slugRes.validation.errors],
        warnings: [...titleRes.validation.warnings, ...descRes.validation.warnings, ...slugRes.validation.warnings],
        meta: {
          source: titleRes.source,
          attempts: titleRes.attempts,
          model: titleRes.modelUsed,
          timestamp: new Date().toISOString(),
        },
      })
    }

    const normalizedField = field === 'title' ? 'seoTitle' : field
    const result = await suggestSeoWithAi(normalizedField, seoContext, extraParams)

    return NextResponse.json({
      data: result,
      value: result.value,
      seoTitle: normalizedField === 'seoTitle' ? result.value : undefined,
      metaDescription: normalizedField === 'metaDescription' ? result.value : undefined,
      slug: normalizedField === 'slug' ? result.value : undefined,
      altText: normalizedField === 'altText' ? result.value : undefined,
      needsKey: !hasKey,
      errors: result.validation.errors,
      warnings: result.validation.warnings,
      meta: {
        source: result.source,
        attempts: result.attempts,
        model: result.modelUsed,
        timestamp: result.generatedAt,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        data: null,
        errors: [err.message || 'Gagal menghasilkan saran SEO.'],
        warnings: [],
      },
      { status: 500 }
    )
  }
}
