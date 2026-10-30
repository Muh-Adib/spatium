import { wordpressDate } from '@/lib/import/wp-client'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { NextRequest, NextResponse } from 'next/server'
import { cleanWpHtml, stripHtml, calculateReadingTime } from '@/lib/import/transform'
import { downloadAndOptimizeImage, localizeAndOptimizeContentImages } from '@/lib/import/media-storage'
import { contentToBlocks } from '@/lib/articles/blockEditor'
import { extractWordPressSeo } from '@/lib/import/seo-extractor'
import { requireRole } from '@/lib/auth/rbac'
import { safeFetch } from '@/lib/security/ssrf'

/**
 * API Endpoint: /api/import/wp-single
 * Mengambil satu artikel dari WordPress secara langsung berdasarkan URL Post atau Domain + Slug.
 * Mengonversi konten HTML WordPress ke format Content Blocks SegiaTech yang aman,
 * mengekstrak seluruh metadata Yoast SEO / Rank Math secara lengkap (termasuk kata kunci target).
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { url, siteUrl, slug, username, applicationPassword } = body

    let targetEndpoint = ''
    const authenticated = Boolean(username && applicationPassword)

    if (url && typeof url === 'string') {
      try {
        const parsed = new URL(url.trim())
        const pathSegments = parsed.pathname.split('/').filter(Boolean)
        const postSlug = pathSegments[pathSegments.length - 1]
        const origin = parsed.origin

        if (!postSlug) {
          return NextResponse.json(
            { error: 'URL tidak valid atau tidak memiliki slug artikel.' },
            { status: 400 }
          )
        }

        const query = new URLSearchParams({ slug: postSlug, _embed: 'true' })
        if (authenticated) query.set('context', 'edit')
        targetEndpoint = `${origin}/wp-json/wp/v2/posts?${query.toString()}`
      } catch {
        return NextResponse.json({ error: 'Format URL WordPress tidak valid.' }, { status: 400 })
      }
    } else if (siteUrl && slug) {
      const origin = siteUrl.replace(/\/+$/, '')
      const query = new URLSearchParams({ slug: slug.trim(), _embed: 'true' })
      if (authenticated) query.set('context', 'edit')
      targetEndpoint = `${origin}/wp-json/wp/v2/posts?${query.toString()}`
    } else {
      return NextResponse.json(
        { error: 'Harap berikan URL artikel WordPress atau pasangan siteUrl dan slug.' },
        { status: 400 }
      )
    }

    console.log(`[WP Single Import] Fetching from: ${targetEndpoint}`)

    const headers: Record<string, string> = {
      'User-Agent': 'SegiaTech-Importer/2.0',
      Accept: 'application/json',
    }

    if (authenticated) {
      headers['Authorization'] = `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString('base64')}`
    }

    const res = await safeFetch(targetEndpoint, {
      headers,
      maxRedirects: authenticated ? 0 : 3,
      timeoutMs: 30_000,
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Gagal mengakses WordPress REST API (HTTP ${res.status}: ${res.statusText}). Pastikan REST API aktif di target.`,
        },
        { status: 502 }
      )
    }

    const posts = await res.json()
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        {
          error: 'Artikel tidak ditemukan di WordPress target. Periksa kembali slug atau URL postingan.',
        },
        { status: 404 }
      )
    }

    const wpPost = posts[0]

    // 1. Ekstraksi Judul & Konten
    const rawTitle = wpPost.title?.rendered || wpPost.title?.raw || ''
    const cleanTitle = stripHtml(rawTitle)
    const rawContent = wpPost.content?.rendered || wpPost.content?.raw || ''
    const sanitizedHtml = cleanWpHtml(rawContent)
    const localizedHtml = await localizeAndOptimizeContentImages(sanitizedHtml, 'articles')

    // 2. Konversi ke Blok Editor SegiaTech
    const blocks = contentToBlocks(localizedHtml)

    // 3. Ekstraksi Excerpt / Ringkasan
    let cleanExcerpt = ''
    if (wpPost.excerpt?.rendered || wpPost.excerpt?.raw) {
      cleanExcerpt = stripHtml(wpPost.excerpt.rendered || wpPost.excerpt.raw).slice(0, 260)
    }
    if (!cleanExcerpt) {
      cleanExcerpt = stripHtml(rawContent).slice(0, 180)
    }

    // 4. Ekstraksi Featured Image Media & Download/Compress Lokal
    let coverUrl = '/images/articles/web-architecture.jpg'
    const embeddedMedia = wpPost._embedded?.['wp:featuredmedia']?.[0]
    if (embeddedMedia?.source_url) {
      const local = await downloadAndOptimizeImage(embeddedMedia.source_url, 'articles')
      coverUrl = local || embeddedMedia.source_url
    }

    // 5. Ekstraksi Kategori
    let category = 'Website Development'
    const embeddedTerms = wpPost._embedded?.['wp:term']?.[0]
    if (Array.isArray(embeddedTerms) && embeddedTerms.length > 0) {
      category = embeddedTerms[0].name || category
    }

    // 6. Ekstraksi Tag WordPress
    const tags: string[] = []
    const embeddedTags = wpPost._embedded?.['wp:term']?.[1]
    if (Array.isArray(embeddedTags)) {
      for (const t of embeddedTags) {
        if (t?.name) tags.push(stripHtml(t.name))
      }
    }

    // 7. Ekstraksi Penulis
    let author = 'Tim SegiaTech'
    const embeddedAuthor = wpPost._embedded?.author?.[0]
    if (embeddedAuthor?.name) {
      author = embeddedAuthor.name
    }

    // 8. Ekstraksi Lengkap SEO Metadata (Yoast / RankMath / Standar)
    const site = await getSiteProfile()
    const seo = extractWordPressSeo(
      wpPost,
      cleanTitle,
      cleanExcerpt,
      coverUrl,
      site.url,
      {
        imageAlt: embeddedMedia?.alt_text || '',
        fallbackTags: tags,
      }
    )

    const readingTime = calculateReadingTime(sanitizedHtml)

    return NextResponse.json({
      success: true,
      message: 'Artikel beserta metadata SEO Yoast berhasil dimuat ke editor!',
      data: {
        title: cleanTitle,
        slug: wpPost.slug,
        excerpt: cleanExcerpt,
        contentHtml: localizedHtml,
        blocks,
        coverUrl,
        coverAlt: embeddedMedia?.alt_text || '',
        category,
        tags,
        author,
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        canonicalUrl: seo.canonicalUrl,
        focusKeyphrase: seo.focusKeyphrase,
        relatedKeyphrases: seo.relatedKeyphrases,
        isCornerstone: seo.isCornerstone,
        breadcrumbTitle: seo.breadcrumbTitle,
        robots: seo.robots,
        robotsDirectives: seo.robotsDirectives,
        socialOg: seo.openGraph,
        socialTwitter: seo.twitter,
        seoData: JSON.parse(seo.seoData),
        readingTime,
        originalUrl: wpPost.link || null,
        publishedAt: wordpressDate(wpPost.date_gmt, wpPost.date),
      },
    })
  } catch (error: any) {
    console.error('[WP Single Import Error]:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat menarik data WordPress.' },
      { status: 500 }
    )
  }
}
