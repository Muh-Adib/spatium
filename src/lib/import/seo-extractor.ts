import { parseRobots } from '@/lib/seo/robots'
import { articleCanonical } from '@/lib/seo/canonical'

export interface ExtractedWordPressSeo {
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  robots: {
    index: boolean
    follow: boolean
    noarchive?: boolean
    nosnippet?: boolean
  }
  robotsDirectives: string
  ogImage: string | null
  openGraph: {
    title: string
    description: string
    image: string | null
    imageAlt?: string
    type?: string
    locale?: string
  }
  twitter: {
    card: 'summary' | 'summary_large_image'
    title: string
    description: string
    image: string | null
  }
  focusKeyphrase: string | null
  relatedKeyphrases: string[]
  isCornerstone: boolean
  breadcrumbTitle: string | null
  schema: any
  seoData: string
}

function getMetaString(val: unknown): string | null {
  if (Array.isArray(val)) {
    return getMetaString(val[0])
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim()
  }
  if (typeof val === 'number') {
    return String(val)
  }
  return null
}

function extractKeywordsFromSchema(schema: any): string[] {
  if (!schema) return []
  const list: string[] = []
  const graph = Array.isArray(schema['@graph']) ? schema['@graph'] : [schema]
  for (const item of graph) {
    if (item && typeof item === 'object') {
      const type = item['@type']
      if (type === 'Article' || type === 'BlogPosting' || type === 'WebPage' || type === 'NewsArticle') {
        if (Array.isArray(item.keywords)) {
          for (const k of item.keywords) {
            if (typeof k === 'string' && k.trim()) list.push(k.trim())
          }
        } else if (typeof item.keywords === 'string' && item.keywords.trim()) {
          for (const k of item.keywords.split(',')) {
            if (k.trim()) list.push(k.trim())
          }
        }
      }
    }
  }
  return list
}

export function extractWordPressSeo(
  post: Record<string, any>,
  title: string,
  excerpt: string,
  coverUrl: string | null = null,
  siteUrl: string = 'https://www.segiatech.com',
  options: { imageAlt?: string; fallbackTags?: string[] } = {}
): ExtractedWordPressSeo {
  const yoast = post.yoast_head_json || {}
  const meta = {
    ...(post.webshift_source?.postmeta || {}),
    ...(post.meta || {}),
  }

  // 1. Title
  const metaTitle =
    yoast.title ||
    getMetaString(meta._yoast_wpseo_title) ||
    getMetaString(meta.rank_math_title) ||
    getMetaString(meta._aioseo_title) ||
    `${title} — SegiaTech`

  // 2. Description
  const metaDescription =
    yoast.description ||
    getMetaString(meta._yoast_wpseo_metadesc) ||
    getMetaString(meta.rank_math_description) ||
    getMetaString(meta._aioseo_description) ||
    excerpt ||
    title

  // 3. Schema & Keywords from Schema
  const schema = yoast.schema || null
  const schemaKeywords = extractKeywordsFromSchema(schema)

  // 4. Focus Keyphrase (Yoast, Rank Math, AIOSEO, Schema Graph, or Tag fallback)
  const yoastKw = getMetaString(meta._yoast_wpseo_focuskw)
  const rmRaw = getMetaString(meta.rank_math_focus_keyword)
  const rmKw = rmRaw ? rmRaw.split(',')[0].trim() : null
  const aioseoRaw = getMetaString(meta._aioseo_keywords) || getMetaString(meta.aioseo_keywords)
  const aioseoKw = aioseoRaw ? aioseoRaw.split(',')[0].trim() : null
  const directYoastKw = getMetaString(yoast.focus_keyword) || getMetaString(yoast.focuskw)

  let focusKeyphrase: string | null =
    yoastKw ||
    rmKw ||
    aioseoKw ||
    directYoastKw ||
    (schemaKeywords.length > 0 ? schemaKeywords[0] : null) ||
    (options.fallbackTags && options.fallbackTags.length > 0 ? options.fallbackTags[0] : null) ||
    null

  // 5. Related Keyphrases (Yoast, Rank Math, Schema)
  const relatedSet = new Set<string>()

  // Yoast Related Keyphrases
  const rawYoastRel = meta._yoast_wpseo_focuskeywords
  if (Array.isArray(rawYoastRel)) {
    for (const item of rawYoastRel) {
      const kw = typeof item === 'string' ? item : item?.keyword
      if (typeof kw === 'string' && kw.trim()) relatedSet.add(kw.trim())
    }
  } else if (typeof rawYoastRel === 'string' && rawYoastRel.trim()) {
    try {
      const parsed = JSON.parse(rawYoastRel)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const kw = typeof item === 'string' ? item : item?.keyword
          if (typeof kw === 'string' && kw.trim()) relatedSet.add(kw.trim())
        }
      }
    } catch {
      for (const part of rawYoastRel.split(',')) {
        if (part.trim()) relatedSet.add(part.trim())
      }
    }
  }

  // Rank Math secondary keywords from comma-separated string
  if (rmRaw && rmRaw.includes(',')) {
    for (const part of rmRaw.split(',').slice(1)) {
      if (part.trim()) relatedSet.add(part.trim())
    }
  }

  // Schema keywords
  for (const sk of schemaKeywords.slice(1)) {
    if (sk.trim()) relatedSet.add(sk.trim())
  }

  // Ensure focus keyphrase itself is not duplicated in relatedKeyphrases
  if (focusKeyphrase) {
    relatedSet.delete(focusKeyphrase)
  }

  const relatedKeyphrases = Array.from(relatedSet).slice(0, 5)

  // 6. Canonical URL
  const rawCanonical =
    yoast.canonical ||
    getMetaString(meta._yoast_wpseo_canonical) ||
    getMetaString(meta.rank_math_canonical_url) ||
    post.link ||
    null

  const canonicalUrl = articleCanonical(
    { slug: post.slug, canonicalUrl: rawCanonical, wpSourceUrl: post.link },
    siteUrl
  )

  // 7. Robots Directives
  const rawNoindex = meta['_yoast_wpseo_meta-robots-noindex'] || meta.rank_math_robots
  const isNoindex =
    String(Array.isArray(rawNoindex) ? rawNoindex[0] : rawNoindex).includes('noindex') ||
    String(Array.isArray(rawNoindex) ? rawNoindex[0] : rawNoindex) === '1'

  const rawNofollow = meta['_yoast_wpseo_meta-robots-nofollow']
  const isNofollow =
    String(Array.isArray(rawNofollow) ? rawNofollow[0] : rawNofollow).includes('nofollow') ||
    String(Array.isArray(rawNofollow) ? rawNofollow[0] : rawNofollow) === '1'

  const robots = parseRobots(
    yoast.robots || {
      index: isNoindex ? 'noindex' : 'index',
      follow: isNofollow ? 'nofollow' : 'follow',
      advanced: getMetaString(meta['_yoast_wpseo_meta-robots-adv']) || '',
    }
  )

  const directivesList: string[] = []
  directivesList.push(robots.index ? 'index' : 'noindex')
  directivesList.push(robots.follow ? 'follow' : 'nofollow')
  if (robots.noarchive) directivesList.push('noarchive')
  if (robots.nosnippet) directivesList.push('nosnippet')
  const robotsDirectives = directivesList.join(', ')

  // 8. Cornerstone Content
  const rawCornerstone = meta._yoast_wpseo_is_cornerstone || meta.rank_math_pillar_content
  const isCornerstone = [true, 1, '1', 'true'].includes(
    Array.isArray(rawCornerstone) ? rawCornerstone[0] : rawCornerstone
  )

  // 9. Breadcrumb Title
  const breadcrumbTitle =
    getMetaString(meta._yoast_wpseo_bctitle) ||
    getMetaString(meta.rank_math_breadcrumb_title) ||
    title

  // 10. OpenGraph & Twitter
  const ogImage =
    yoast.og_image?.[0]?.url ||
    getMetaString(meta['_yoast_wpseo_opengraph-image']) ||
    getMetaString(meta.rank_math_facebook_image) ||
    coverUrl ||
    null

  const imageAlt =
    options.imageAlt ||
    post._embedded?.['wp:featuredmedia']?.[0]?.alt_text ||
    yoast.og_image?.[0]?.alt ||
    ''

  const openGraph = {
    title:
      yoast.og_title ||
      getMetaString(meta['_yoast_wpseo_opengraph-title']) ||
      getMetaString(meta.rank_math_facebook_title) ||
      metaTitle,
    description:
      yoast.og_description ||
      getMetaString(meta['_yoast_wpseo_opengraph-description']) ||
      getMetaString(meta.rank_math_facebook_description) ||
      metaDescription,
    image: ogImage,
    imageAlt,
    type: yoast.og_type || 'article',
    locale: yoast.og_locale || 'id_ID',
  }

  const twitter = {
    card: (yoast.twitter_card || 'summary_large_image') as 'summary' | 'summary_large_image',
    title:
      yoast.twitter_title ||
      getMetaString(meta['_yoast_wpseo_twitter-title']) ||
      getMetaString(meta.rank_math_twitter_title) ||
      metaTitle,
    description:
      yoast.twitter_description ||
      getMetaString(meta['_yoast_wpseo_twitter-description']) ||
      getMetaString(meta.rank_math_twitter_description) ||
      metaDescription,
    image:
      yoast.twitter_image ||
      getMetaString(meta['_yoast_wpseo_twitter-image']) ||
      getMetaString(meta.rank_math_twitter_image) ||
      ogImage,
  }

  // 11. Full Serialized SEO Data
  const seoData = JSON.stringify({
    seoTitle: metaTitle,
    metaDescription,
    canonicalUrl,
    robots,
    openGraph,
    twitter,
    schema,
    breadcrumbTitle,
    focusKeyphrase,
    relatedKeyphrases,
    isCornerstone,
    sourceOriginalUrl: post.link || null,
    sourceYoast: yoast,
    sourceYoastHead: post.yoast_head || null,
    sourceMeta: meta,
  })

  return {
    metaTitle,
    metaDescription,
    canonicalUrl,
    robots,
    robotsDirectives,
    ogImage,
    openGraph,
    twitter,
    focusKeyphrase,
    relatedKeyphrases,
    isCornerstone,
    breadcrumbTitle,
    schema,
    seoData,
  }
}
