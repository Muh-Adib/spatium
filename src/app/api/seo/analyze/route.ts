import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeContentSeo } from '@/lib/seo/analyzer'
import { prisma } from '@/lib/db/prisma'
import { requireUser } from '@/lib/auth/rbac'
import { publicMessage } from '@/lib/http/errors'

const analyzeSchema = z.object({
  title: z.string().max(500).default(''),
  seoTitle: z.string().max(500).default(''),
  metaDescription: z.string().max(2000).default(''),
  slug: z.string().max(500).default(''),
  content: z.string().max(2_000_000).default(''),
  focusKeyphrase: z.string().max(200).default(''),
  relatedKeyphrases: z.array(z.string().max(200)).max(20).default([]),
  locale: z.enum(['id', 'en']).default('id'),
  isCornerstone: z.boolean().default(false),
  images: z
    .array(z.object({ url: z.string().max(2000), alt: z.string().max(1000).optional(), decorative: z.boolean().optional() }))
    .max(500)
    .default([]),
})

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const raw = await request.json().catch(() => null)
  const parsed = analyzeSchema.safeParse(raw ?? {})
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, errors: parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`), warnings: [] },
      { status: 400 }
    )
  }

  try {
    const input = parsed.data

    // Existing keyphrases in the same locale, to check for cannibalization
    const existing = await prisma.orm.public.Article.where({ locale: input.locale }).all()

    const otherKws = existing.flatMap((r) =>
      r.focusKeyphrase ? [{ title: r.title, slug: r.slug, keyphrase: r.focusKeyphrase }] : []
    )

    const result = analyzeContentSeo({ ...input, otherContentKeyphrases: otherKws })

    return NextResponse.json({
      data: result,
      errors: [],
      warnings: [],
      meta: {
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[seo/analyze] Analysis failed', err)
    return NextResponse.json(
      {
        data: null,
        errors: [publicMessage(err, 'Gagal menganalisis SEO konten.')],
        warnings: [],
      },
      { status: 500 }
    )
  }
}
