import { NextRequest, NextResponse } from 'next/server'
import { analyzeContentSeo } from '@/lib/seo/analyzer'
import { prisma } from '@/lib/db/prisma'
import { Locale } from '@/lib/seo/schema'
import { requireUser } from '@/lib/auth/rbac'
import { checkVoiceMatch } from '@/lib/voice/checker'

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const {
      title = '',
      seoTitle = '',
      metaDescription = '',
      slug = '',
      content = '',
      focusKeyphrase = '',
      relatedKeyphrases = [],
      locale = 'id',
      isCornerstone = false,
      images = [],
    } = body

    // Fetch existing keyphrases in the same locale to check for cannibalization
    const existing = await prisma.orm.public.Article
      .where({ locale: locale as Locale })
      .all()

    const otherKws = existing
      .filter((r: any) => Boolean(r.focusKeyphrase))
      .map((r: any) => ({
        title: r.title,
        slug: r.slug,
        keyphrase: r.focusKeyphrase!,
      }))

    const result = analyzeContentSeo({
      title,
      seoTitle,
      metaDescription,
      slug,
      content,
      focusKeyphrase,
      relatedKeyphrases,
      locale: locale as Locale,
      isCornerstone,
      images,
      otherContentKeyphrases: otherKws,
    })

    let voiceMatch = null
    if (content && typeof content === 'string' && content.trim().length > 20) {
      try {
        voiceMatch = await checkVoiceMatch(content)
      } catch (voiceErr: any) {
        console.warn('[seo:analyze] Voice check skipped:', voiceErr.message)
      }
    }

    return NextResponse.json({
      data: {
        ...result,
        voiceMatch,
      },
      errors: [],
      warnings: [],
      meta: {
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        data: null,
        errors: [err.message || 'Gagal menganalisis SEO konten.'],
        warnings: [],
      },
      { status: 500 }
    )
  }
}
