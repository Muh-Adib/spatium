import { prisma } from '@/lib/db/prisma'
import { getGscOverview, getGscTopQueries } from '../gsc/queries'
import { generateArticleDraft } from './draft'
import { getArticleBySlug, updateArticle } from '@/lib/db/articles'
import { analyzeContentSeo } from '@/lib/seo/analyzer'
import { checkPublicationGate } from '@/lib/seo/validation'
import { extractContentImages } from '@/lib/publishing/validation'
import { mergeEditorialSeo } from '@/lib/articles/editorialSeo'
import { findLinkTargets } from '@/lib/graph/search'
import type { StudioAiArticleContext } from '@/components/studio/StudioAiSidebar'

import {
  ToolDefinition,
  ToolCallExecution,
  UNIMASI_TOOLS_CATALOG,
  SEGIA_TOOLS_CATALOG,
} from './tool-definitions'

export {
  type ToolDefinition,
  type ToolCallExecution,
  UNIMASI_TOOLS_CATALOG,
  SEGIA_TOOLS_CATALOG,
}

export async function handleInspectArticleSeo(input: {
  slug?: string
  title?: string
  content?: string
  focusKeyphrase?: string
  metaTitle?: string
  metaDescription?: string
  coverAlt?: string
}) {
  const dbArticle = input.slug ? await getArticleBySlug(input.slug) : null

  const title = (input.title ?? dbArticle?.title ?? '').trim()
  const content = input.content ?? dbArticle?.content ?? ''
  const focusKeyphrase = (input.focusKeyphrase ?? dbArticle?.focusKeyphrase ?? dbArticle?.seo?.focusTopic ?? '').trim()
  const metaTitle = (input.metaTitle ?? dbArticle?.seo?.metaTitle ?? title).trim()
  const metaDescription = (input.metaDescription ?? dbArticle?.seo?.metaDescription ?? dbArticle?.excerpt ?? '').trim()
  const coverAlt = (input.coverAlt ?? dbArticle?.featuredImage?.alternativeText ?? (dbArticle as unknown as { seoData?: { openGraph?: { imageAlt?: string } } })?.seoData?.openGraph?.imageAlt ?? '').trim()
  const coverUrl = dbArticle?.coverUrl ?? dbArticle?.featuredImage?.url ?? ''
  const slug = input.slug || dbArticle?.slug || 'draf-artikel'
  const locale: 'id' | 'en' = dbArticle?.locale === 'en' ? 'en' : 'id'

  if (!title && !content) {
    throw new Error('Parameter slug atau konten artikel wajib diisi untuk melakukan inspeksi SEO.')
  }

  // Extract content images from HTML and Markdown
  const htmlImages = extractContentImages(content)
  const mdMatches = [...content.matchAll(/!\[(.*?)\]\((.*?)\)/g)].map((m) => ({
    url: m[2],
    altText: m[1],
    decorative: false,
  }))
  const contentImages = [...htmlImages, ...mdMatches]

  // Build images list for SEO analyzer
  const allImages: Array<{ url: string; alt?: string; decorative?: boolean }> = []
  if (coverUrl) {
    allImages.push({ url: coverUrl, alt: coverAlt, decorative: false })
  }
  for (const img of contentImages) {
    allImages.push({ url: img.url, alt: img.altText, decorative: img.decorative })
  }

  // 1. Run Comprehensive Yoast-parity SEO & Readability Analysis
  const analysis = analyzeContentSeo({
    title,
    seoTitle: metaTitle,
    metaDescription,
    slug,
    content,
    focusKeyphrase,
    relatedKeyphrases: dbArticle?.relatedKeyphrases || [],
    locale,
    isCornerstone: Boolean(dbArticle?.isCornerstone),
    images: allImages,
  })

  // 2. Run Publication Gate Validation
  const gateResult = checkPublicationGate({
    locale,
    title,
    slug,
    metaDescription,
    seoTitle: metaTitle,
    existingSlugs: [],
    images: contentImages,
    heroVisual: coverUrl ? { url: coverUrl, altText: coverAlt, decorative: false } : null,
  })

  const problems = analysis.indicators.filter((i) => i.status === 'problem')
  const improvements = analysis.indicators.filter((i) => i.status === 'ok')
  const good = analysis.indicators.filter((i) => i.status === 'good')

  const readabilityProblems = analysis.readabilityIndicators.filter((i) => i.status === 'problem')
  const readabilityImprovements = analysis.readabilityIndicators.filter((i) => i.status === 'ok')
  const readabilityGood = analysis.readabilityIndicators.filter((i) => i.status === 'good')

  const summary = `SEO Score: ${analysis.seoScore}/100, Readability: ${analysis.readabilityScore}/100. Status: ${analysis.overallStatus.toUpperCase()}. Gerbang Publikasi: ${gateResult.canPublish ? 'LOLOS' : 'TERBLOKIR (' + gateResult.violations.length + ' pelanggaran)'}. Masalah utama: ${problems.map((p) => p.label).join(', ') || 'Nihil'}.`

  return {
    seoScore: analysis.seoScore,
    readabilityScore: analysis.readabilityScore,
    overallStatus: analysis.overallStatus,
    gateStatus: {
      canPublish: gateResult.canPublish,
      violationsCount: gateResult.violations.length,
      warningsCount: gateResult.warnings.length,
      violations: gateResult.violations,
      warnings: gateResult.warnings,
    },
    problems,
    improvements,
    good,
    readabilityProblems,
    readabilityImprovements,
    readabilityGood,
    metrics: analysis.metrics,
    summary,
  }
}

export async function handleUpdateArticleContent(
  input: {
    slug: string
    title?: string
    excerpt?: string
    content?: string
    focusKeyphrase?: string
    metaTitle?: string
    metaDescription?: string
    coverAlt?: string
    tags?: string[]
    category?: string
    status?: 'draft' | 'in_review'
  },
  context?: { actor?: string; actorRole?: string }
) {
  const { slug, status } = input

  if (!slug) {
    throw new Error('Parameter "slug" artikel wajib diisi untuk memperbarui konten.')
  }

  // Rule 8 Enforcement: Agents cannot publish
  if ((status as string) === 'published') {
    throw new Error(`Akses ditolak: Agen dilarang mengubah status artikel menjadi 'published' (ADR-0011 Rule 8 & §4). Gunakan status 'draft' atau 'in_review'.`)
  }

  const previous = await getArticleBySlug(slug)
  if (!previous) {
    throw new Error(`Artikel dengan slug "${slug}" tidak ditemukan di basis data.`)
  }

  const updatedFields: string[] = []
  const diffSummary: Record<string, { before: any; after: any }> = {}
  const updatePayload: Record<string, any> = {
    actor: context?.actor || 'Studio AI Assistant',
  }

  if (input.title !== undefined) {
    updatePayload.title = input.title
    if (input.title !== previous.title) {
      updatedFields.push('title')
      diffSummary.title = { before: previous.title, after: input.title }
    }
  }

  if (input.excerpt !== undefined) {
    updatePayload.excerpt = input.excerpt
    if (input.excerpt !== previous.excerpt) {
      updatedFields.push('excerpt')
      diffSummary.excerpt = { before: previous.excerpt, after: input.excerpt }
    }
  }

  if (input.content !== undefined) {
    updatePayload.content = input.content
    const wordCount = input.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
    updatePayload.readingTime = Math.max(1, Math.ceil(wordCount / 180))
    if (input.content !== previous.content) {
      updatedFields.push('content')
      diffSummary.content = {
        before: `${(previous.content || '').length} karakter`,
        after: `${input.content.length} karakter (${wordCount} kata)`,
      }
    }
  }

  if (input.focusKeyphrase !== undefined) {
    updatePayload.focusKeyphrase = input.focusKeyphrase
    if (input.focusKeyphrase !== previous.focusKeyphrase) {
      updatedFields.push('focusKeyphrase')
      diffSummary.focusKeyphrase = { before: previous.focusKeyphrase || '', after: input.focusKeyphrase }
    }
  }

  if (input.metaTitle !== undefined) {
    updatePayload.metaTitle = input.metaTitle
    if (input.metaTitle !== previous.seo?.metaTitle) {
      updatedFields.push('metaTitle')
      diffSummary.metaTitle = { before: previous.seo?.metaTitle || '', after: input.metaTitle }
    }
  }

  if (input.metaDescription !== undefined) {
    updatePayload.metaDescription = input.metaDescription
    if (input.metaDescription !== previous.seo?.metaDescription) {
      updatedFields.push('metaDescription')
      diffSummary.metaDescription = { before: previous.seo?.metaDescription || '', after: input.metaDescription }
    }
  }

  if (input.coverAlt !== undefined) {
    const prevAlt = previous.featuredImage?.alternativeText || (previous as unknown as { seoData?: { openGraph?: { imageAlt?: string } } }).seoData?.openGraph?.imageAlt || ''
    if (input.coverAlt !== prevAlt) {
      updatedFields.push('coverAlt')
      diffSummary.coverAlt = { before: prevAlt, after: input.coverAlt }
    }
    // Update imageMetadata without assigning updatePayload.coverAlt
    let existingMeta: Record<string, any> = {}
    try {
      const rawArt = await prisma.orm.public.Article.where({ slug }).first()
      if (rawArt?.imageMetadata) {
        existingMeta = JSON.parse(rawArt.imageMetadata)
      }
    } catch (err) { console.warn("[observable error]:", err) }
    updatePayload.imageMetadata = JSON.stringify({ ...existingMeta, coverAlt: input.coverAlt })
  }

  // Merge editorial SEO into seoData
  if (input.metaTitle !== undefined || input.metaDescription !== undefined || input.coverAlt !== undefined) {
    let prevSeoData: any = undefined
    try {
      const rawArt = await prisma.orm.public.Article.where({ slug }).first()
      if (rawArt?.seoData) {
        prevSeoData = JSON.parse(rawArt.seoData)
      }
    } catch (err) { console.warn("[observable error]:", err) }

    updatePayload.seoData = mergeEditorialSeo(prevSeoData, undefined, {
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      coverAlt: input.coverAlt,
    })
  }

  // Upsert Category if provided as a string
  if (input.category && input.category.trim() && input.category !== previous.category?.name) {
    const catTrim = input.category.trim()
    const catSlug = catTrim.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
    const savedCat = await prisma.orm.public.Category.upsert({
      conflictOn: { slug: catSlug },
      create: { name: catTrim, slug: catSlug },
      update: { name: catTrim },
    })
    updatePayload.categoryId = savedCat.id
    updatePayload.primaryCategory = catTrim
    updatedFields.push('category')
    diffSummary.category = { before: previous.category?.name || '', after: catTrim }
  }

  if (input.tags !== undefined) {
    updatePayload.tags = input.tags
    const prevTags = previous.tags?.map((t: any) => t.name) || []
    updatedFields.push('tags')
    diffSummary.tags = { before: prevTags, after: input.tags }
  }

  if (input.status !== undefined && input.status !== previous.status) {
    updatePayload.status = input.status
    updatedFields.push('status')
    diffSummary.status = { before: previous.status, after: input.status }
  }

  const updated = await updateArticle(slug, updatePayload)
  if (!updated) {
    throw new Error(`Artikel dengan slug "${slug}" gagal diperbarui di basis data.`)
  }

  const changes: Partial<StudioAiArticleContext> = {
    title: input.title ?? previous.title,
    slug: updated.slug,
    content: input.content ?? previous.content,
    focusKeyphrase: input.focusKeyphrase ?? previous.focusKeyphrase,
    targetKeyword: input.focusKeyphrase ?? previous.focusKeyphrase,
    seoTitle: input.metaTitle ?? previous.seo?.metaTitle ?? previous.title,
    metaDescription: input.metaDescription ?? previous.seo?.metaDescription ?? previous.excerpt,
    coverAlt: input.coverAlt ?? (previous.featuredImage?.alternativeText ?? undefined),
    category: input.category ?? previous.category?.name,
    tagInput: input.tags ? input.tags.join(', ') : undefined,
  }

  return {
    success: true,
    slug: updated.slug,
    title: updated.title,
    status: updated.status,
    updatedFields,
    diffSummary,
    changes,
    message: updatedFields.length > 0
      ? `Berhasil memperbarui ${updatedFields.length} bidang artikel (${updatedFields.join(', ')}).`
      : 'Tidak ada perubahan yang dilakukan pada artikel.',
    updatedAt: updated.updatedAt || new Date().toISOString(),
  }
}

export async function handleSuggestInternalLinks(input: {
  topic?: string
  limit?: number
  excludeSlug?: string
}) {
  const topic = (input.topic || '').trim()
  const rawLimit = Number(input.limit) || 5
  const limit = Math.max(1, Math.min(20, rawLimit))
  const excludeSlug = (input.excludeSlug || '').trim()

  const results: Array<{
    title: string
    url: string
    type: 'service' | 'portfolio' | 'article' | 'solution' | 'landing'
    relevance: string
    score: number
    suggestedAnchors: string[]
    markdownSnippet: string
  }> = []

  const seenUrls = new Set<string>()
  if (excludeSlug) {
    seenUrls.add(`/artikel/${excludeSlug}`)
    seenUrls.add(`/${excludeSlug}`)
  }

  // 1. Primary Recommendation: Query Content Graph via findLinkTargets
  try {
    const graphTargets = await findLinkTargets({
      text: topic,
      limit: limit * 2,
    })

    for (const t of graphTargets) {
      if (seenUrls.has(t.url)) continue
      seenUrls.add(t.url)

      const anchors = t.suggestedAnchors.length > 0 ? t.suggestedAnchors : [t.title]
      const primaryAnchor = anchors[0]

      results.push({
        title: t.title,
        url: t.url,
        type: (t.type === 'page' ? 'landing' : t.type) as 'service' | 'portfolio' | 'article' | 'solution' | 'landing',
        relevance: t.reason || `Kecocokan semantik konten (${t.score})`,
        score: t.score,
        suggestedAnchors: anchors,
        markdownSnippet: `[${primaryAnchor}](${t.url})`,
      })
    }
  } catch (err) {
    console.warn('[suggest_internal_links] Content graph search warning:', err)
  }

  // 2. Resilient Fallback: If results < limit, query Services & Portfolio directly from PostgreSQL
  if (results.length < limit) {
    try {
      const dbClient = prisma as unknown as {
        orm?: {
          public?: {
            Service?: { all: () => Promise<Array<{ name: string; slug: string }>> }
            Portfolio?: { all: () => Promise<Array<{ title: string; slug: string; client?: string }>> }
          }
        }
      }
      if (typeof dbClient.orm?.public?.Service?.all === 'function') {
        const services = await dbClient.orm.public.Service.all()
        const matchedServices = topic
          ? services.filter((s) => s.name?.toLowerCase().includes(topic.toLowerCase()) || s.slug?.includes(topic.toLowerCase()))
          : services.slice(0, 5)

        for (const s of matchedServices) {
          const url = `/layanan/${s.slug}`
          if (seenUrls.has(url)) continue
          seenUrls.add(url)
          results.push({
            title: s.name,
            url,
            type: 'service',
            relevance: 'Layanan kapabilitas digital inti UNIMASI',
            score: 0.85,
            suggestedAnchors: [s.name, `layanan ${s.name.toLowerCase()}`],
            markdownSnippet: `[layanan ${s.name.toLowerCase()}](${url})`,
          })
          if (results.length >= limit) break
        }
      }

      if (results.length < limit && typeof dbClient.orm?.public?.Portfolio?.all === 'function') {
        const portfolios = await dbClient.orm.public.Portfolio.all()
        const matchedPortfolios = topic
          ? portfolios.filter((p) => p.title?.toLowerCase().includes(topic.toLowerCase()) || (p.client && p.client.toLowerCase().includes(topic.toLowerCase())))
          : portfolios.slice(0, 5)

        for (const p of matchedPortfolios) {
          const url = `/portofolio/${p.slug}`
          if (seenUrls.has(url)) continue
          seenUrls.add(url)
          results.push({
            title: p.title,
            url,
            type: 'portfolio',
            relevance: 'Studi kasus bukti rekayasa nyata (proof layer)',
            score: 0.80,
            suggestedAnchors: [p.title, `studi kasus ${p.title}`],
            markdownSnippet: `[studi kasus ${p.title}](${url})`,
          })
          if (results.length >= limit) break
        }
      }
    } catch (dbErr) {
      console.warn('[suggest_internal_links] Database fallback warning:', dbErr)
    }
  }

  // 3. Guaranteed Curated Fallback
  if (results.length === 0) {
    const curated = [
      { title: 'Interactive Web Experience', slug: 'interactive-web-experience', type: 'service' as const },
      { title: 'Fullstack Web Engineering', slug: 'fullstack-web-engineering', type: 'service' as const },
      { title: 'Creative Technology & 3D WebGL', slug: 'creative-technology-webgl', type: 'service' as const },
    ]
    for (const c of curated) {
      const url = `/layanan/${c.slug}`
      if (seenUrls.has(url)) continue
      results.push({
        title: c.title,
        url,
        type: c.type,
        relevance: 'Layanan digital terverifikasi UNIMASI',
        score: 0.75,
        suggestedAnchors: [c.title, `layanan ${c.title.toLowerCase()}`],
        markdownSnippet: `[${c.title}](${url})`,
      })
      if (results.length >= limit) break
    }
  }

  const finalSuggestions = results.slice(0, limit)

  return {
    topic: topic || 'Umum (Layanan & Studi Kasus)',
    totalFound: finalSuggestions.length,
    suggestions: finalSuggestions,
    contextualTip: 'Sesuai panduan internal linking (AGENTS.md §9.1), sisipkan 3–5 tautan internal secara kontekstual di dalam paragraf artikel dengan anchor text natural, bukan link dump.',
  }
}


function makeToolCallId(suffix: string): string {
  return `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${suffix}`
}

export async function executeUnimasiTool(
  toolId: string,
  params: Record<string, any> = {}
): Promise<ToolCallExecution> {
  const t0 = Date.now()
  const def = (UNIMASI_TOOLS_CATALOG || SEGIA_TOOLS_CATALOG).find((t) => t.id === toolId)
  const label = def?.label || toolId
  const category = def?.category || 'system'

  try {
    switch (toolId) {
      case 'db_articles_query':
      case 'sqlite_articles_query': {
        const action = params.action || 'count'
        const limit = Number(params.limit) || 5
        const statusFilter = params.status || 'all'
        const keyword = params.keyword ? String(params.keyword).trim() : ''
        const slug = params.slug ? String(params.slug).trim() : ''

        if (action === 'get') {
          const targetSlug = slug || keyword
          if (!targetSlug) throw new Error('Parameter "slug" atau "keyword" dibutuhkan untuk mengambil artikel.')
          const art = await getArticleBySlug(targetSlug)
          if (!art) {
            return {
              id: makeToolCallId('art'),
              toolName: toolId,
              label: `${label}: Tidak Ditemukan`,
              category,
              input: params,
              output: { found: false, message: `Artikel dengan slug "${targetSlug}" tidak ditemukan di database.` },
              durationMs: Date.now() - t0,
              status: 'warning',
            }
          }
          return {
            id: makeToolCallId('art'),
            toolName: toolId,
            label: `${label}: "${art.title}"`,
            category,
            input: params,
            output: {
              found: true,
              id: art.id,
              title: art.title,
              slug: art.slug,
              status: art.status,
              category: art.category?.name || 'Umum',
              excerpt: art.excerpt,
              content: art.content,
              focusKeyphrase: art.focusKeyphrase || art.seo?.focusTopic,
              metaTitle: art.seo?.metaTitle || art.title,
              metaDescription: art.seo?.metaDescription || art.excerpt,
              coverUrl: art.coverUrl,
              coverAlt: art.featuredImage?.alternativeText || '',
              readingTime: art.readingTime,
            },
            durationMs: Date.now() - t0,
            status: 'success',
          }
        }

        const [totalRes, draftRes, pubRes] = await Promise.all([
          prisma.orm.public.Article.aggregate((a: any) => ({ count: a.count() })),
          prisma.orm.public.Article.where({ status: 'draft' }).aggregate((a: any) => ({ count: a.count() })),
          prisma.orm.public.Article.where({ status: 'published' }).aggregate((a: any) => ({ count: a.count() })),
        ])

        const total = totalRes?.count || 0
        const drafts = draftRes?.count || 0
        const published = pubRes?.count || 0

        let items: any[] = []
        if (action === 'search' && keyword) {
          const all = await prisma.orm.public.Article.include('category').all()
          items = all
            .filter((a: any) =>
              (a.title && a.title.toLowerCase().includes(keyword.toLowerCase())) ||
              (a.slug && a.slug.toLowerCase().includes(keyword.toLowerCase())) ||
              (a.primaryKeyword && a.primaryKeyword.toLowerCase().includes(keyword.toLowerCase()))
            )
            .slice(0, limit)
            .map((a: any) => ({
              id: a.id,
              title: a.title,
              slug: a.slug,
              status: a.status,
              category: a.category?.name || 'Umum',
              excerpt: a.excerpt ? a.excerpt.slice(0, 100) + '...' : '',
              readingTime: a.readingTime,
              publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : undefined,
            }))
        } else if (action === 'list' || action === 'search') {
          let rows: any[]
          if (statusFilter === 'draft' || statusFilter === 'published') {
            const filtered = await prisma.orm.public.Article.where({ status: statusFilter }).include('category').all()
            rows = filtered.slice(0, limit)
          } else {
            const all = await prisma.orm.public.Article.include('category').all()
            rows = all.slice(0, limit)
          }
          items = rows.map((a: any) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            status: a.status,
            category: a.category?.name || 'Umum',
            excerpt: a.excerpt ? a.excerpt.slice(0, 100) + '...' : '',
            readingTime: a.readingTime,
            publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : undefined,
          }))
        }

        return {
          id: makeToolCallId('art'),
          toolName: toolId,
          label: `${label}: ${total} Artikel`,
          category,
          input: params,
          output: {
            totalArticles: total,
            publishedCount: published,
            draftCount: drafts,
            matchedItems: items,
          },
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'inspect_article_seo': {
        const output = await handleInspectArticleSeo(params)
        return {
          id: makeToolCallId('insp_seo'),
          toolName: toolId,
          label: `${label}: SEO ${output.seoScore}/100, Readability ${output.readabilityScore}/100`,
          category,
          input: params,
          output,
          durationMs: Date.now() - t0,
          status: output.overallStatus === 'problem' ? 'warning' : 'success',
        }
      }

      case 'suggest_internal_links': {
        const output = await handleSuggestInternalLinks(params)
        return {
          id: makeToolCallId('links'),
          toolName: toolId,
          label: `${label}: ${output.totalFound} Rekomendasi`,
          category,
          input: params,
          output,
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'update_article_content': {
        const output = await handleUpdateArticleContent(params as Parameters<typeof handleUpdateArticleContent>[0])
        return {
          id: makeToolCallId('upd_art'),
          toolName: toolId,
          label: `${label}: Draf "${output.title}" Diperbarui (${output.updatedFields.length} bidang)`,
          category,
          input: params,
          output,
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'db_portfolio_query':
      case 'sqlite_portfolio_query': {
        const limit = Number(params.limit) || 5
        const keyword = params.keyword ? String(params.keyword).trim() : ''

        const totRes = await prisma.orm.public.Portfolio.aggregate((a: any) => ({ count: a.count() }))
        const total = totRes?.count || 0

        let items: any[] = []
        if (keyword) {
          const all = await prisma.orm.public.Portfolio.all()
          items = all
            .filter((p: any) =>
              (p.title && p.title.toLowerCase().includes(keyword.toLowerCase())) ||
              (p.client && p.client.toLowerCase().includes(keyword.toLowerCase()))
            )
            .slice(0, limit)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              client: p.client,
              year: p.year,
            }))
        } else {
          const rows = await prisma.orm.public.Portfolio.all()
          items = rows.slice(0, limit).map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            client: p.client,
            year: p.year,
          }))
        }

        return {
          id: makeToolCallId('port'),
          toolName: toolId,
          label: `${label}: ${total} Studi Kasus`,
          category,
          input: params,
          output: {
            totalPortfolios: total,
            items,
          },
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'db_services_query':
      case 'sqlite_services_query': {
        const limit = Number(params.limit) || 5
        const keyword = params.keyword ? String(params.keyword).trim() : ''

        const totRes = await prisma.orm.public.Service.aggregate((a: any) => ({ count: a.count() }))
        const total = totRes?.count || 0

        let items: any[] = []
        if (keyword) {
          const all = await prisma.orm.public.Service.all()
          items = all
            .filter((s: any) => s.name && s.name.toLowerCase().includes(keyword.toLowerCase()))
            .slice(0, limit)
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
            }))
        } else {
          const rows = await prisma.orm.public.Service.all()
          items = rows.slice(0, limit).map((s: any) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
          }))
        }

        return {
          id: makeToolCallId('svc'),
          toolName: toolId,
          label: `${label}: ${total} Layanan`,
          category,
          input: params,
          output: {
            totalServices: total,
            items,
          },
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'gsc_keyword_intelligence': {
        const limit = Number(params.limit) || 5
        const overviewResult = await getGscOverview()
        const topQueriesResult = await getGscTopQueries(limit * 2)

        if (!overviewResult.connected) {
          return {
            id: makeToolCallId('gsc'),
            toolName: toolId,
            label,
            category,
            input: params,
            output: {
              connected: false,
              reason: overviewResult.reason,
              howToConnect: overviewResult.howToConnect,
            },
            durationMs: Date.now() - t0,
            status: 'error',
          }
        }

        const overview = overviewResult.data
        const queriesList = topQueriesResult.connected ? topQueriesResult.data : []
        const filtered = params.opportunityFilter
          ? queriesList.filter((q) => q.position >= 8 && q.position <= 20)
          : queriesList.slice(0, limit)

        return {
          id: makeToolCallId('gsc'),
          toolName: toolId,
          label: `${label} (Posisi Rata-rata: ${overview.averagePosition})`,
          category,
          input: params,
          output: {
            overview: {
              totalClicks: overview.totalClicks,
              totalImpressions: overview.totalImpressions,
              averageCtr: `${overview.averageCtr}%`,
              averagePosition: overview.averagePosition,
            },
            topQueries: filtered,
          },
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'technical_seo_audit': {
        const limit = Number(params.limit) || 5
        const allArticles = await prisma.orm.public.Article.all()
        const missingMeta = allArticles
          .filter((a: any) => !a.metaDescription)
          .slice(0, limit)
          .map((a: any) => ({ id: a.id, title: a.title, slug: a.slug }))

        const total = allArticles.length
        const isHealthy = missingMeta.length === 0

        return {
          id: makeToolCallId('seo'),
          toolName: toolId,
          label: `${label}: ${isHealthy ? '100% Valid' : `${missingMeta.length} Isu Ditemukan`}`,
          category,
          input: params,
          output: {
            totalArticlesInspected: total,
            missingMetaDescriptionCount: missingMeta.length,
            missingMetaSample: missingMeta,
            recommendation: isHealthy
              ? 'Metadata on-page lengkap dan terindeks dengan baik.'
              : 'Disarankan melengkapi meta description pada artikel sampel di atas.',
          },
          durationMs: Date.now() - t0,
          status: isHealthy ? 'success' : 'warning',
        }
      }

      case 'redirect_301_inspector': {
        const path = params.path ? String(params.path).trim() : ''
        const limit = Number(params.limit) || 5

        const totRes = await prisma.orm.public.Redirect.aggregate((a: any) => ({ count: a.count() }))
        const total = totRes?.count || 0

        let match: any = null
        if (path) {
          match = await prisma.orm.public.Redirect.where({ sourcePath: path }).first()
        }

        const sample = await prisma.orm.public.Redirect.limit(limit).all()

        return {
          id: makeToolCallId('redir'),
          toolName: toolId,
          label: `${label}: ${total} Aturan Aktif`,
          category,
          input: params,
          output: {
            totalRedirectRules: total,
            targetPath: path || null,
            matchedRule: match,
            sampleRules: sample,
          },
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'create_article_draft': {
        const topic = params.topic || 'Inovasi Digital Experience Platform'
        const targetKeyword = params.targetKeyword || topic
        const audience = params.audience || 'Pengembang Web & CTO'

        const draftResult = await generateArticleDraft({
          topic,
          targetKeyword,
          audience,
          aiConfig: params.aiConfig,
        })

        const article = draftResult.article
        return {
          id: makeToolCallId('draft'),
          toolName: toolId,
          label: `${label}: Draf "${article.title}" Tersimpan`,
          category,
          input: params,
          output: {
            articleId: article.id,
            title: article.title,
            slug: article.slug,
            status: article.status,
            readingTime: article.readingTime,
            compliance: 'Rule 8 Enforced: Otomatis berstatus DRAFT, aman tanpa auto-publish.',
          },
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      case 'system_health_inspector': {
        const pingStart = Date.now()
        await prisma.orm.public.Article.limit(1).all()
        const dbLatencyMs = Date.now() - pingStart

        return {
          id: makeToolCallId('sys'),
          toolName: toolId,
          label: `${label}: Latensi ${dbLatencyMs}ms (Online)`,
          category,
          input: params,
          output: {
            database: 'PostgreSQL lokal via Prisma 8 (@prisma/orm-postgres)',
            dbLatencyMs,
            engine: 'Next.js 16.3.6 App Router (Turbopack) + React 19',
            mode: 'Zero-Downtime, High-Performance ORM',
            status: 'Optimal',
          },
          durationMs: Date.now() - t0,
          status: 'success',
        }
      }

      default:
        throw new Error(`Tool "${toolId}" tidak dikenali dalam katalog UNIMASI.`)
    }
  } catch (err: any) {
    return {
      id: makeToolCallId('err'),
      toolName: toolId,
      label: `${label} (Gagal)`,
      category,
      input: params,
      output: { error: err.message || 'Internal error' },
      durationMs: Date.now() - t0,
      status: 'error',
    }
  }
}

export const executeSegiaTool = executeUnimasiTool

