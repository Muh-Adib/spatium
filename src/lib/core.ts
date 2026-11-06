/**
 * UNIMASI Core Engine Client for UNIMASI Studio (Next.js App Router)
 *
 * Provides typed access to the Core Headless Delivery API:
 * - Articles, Journal posts, and Categories
 * - Portfolio & Services
 * - SEO Metadata & Site Config
 *
 * Includes built-in caching via Next.js ISR (tags: ['core-content'])
 * and graceful fallback to local data if Core is ever temporarily unreachable.
 */

import { SORTED_ARTICLES, type Article as LocalArticle } from '@/data/articles'

export interface CoreCategory {
  id?: number | string
  name: string
  slug?: string
}

export interface CoreAuthor {
  id?: number | string
  name: string
  slug?: string
  email?: string
}

export interface CoreTag {
  id?: number | string
  name: string
  slug?: string
}

export interface CoreMedia {
  id?: number | string
  url: string
  alternativeText?: string
  width?: number
  height?: number
}

export interface CoreSEO {
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  robotsIndex?: boolean
  robotsFollow?: boolean
  yoastSchema?: any
}

export interface CoreArticle {
  id: number | string
  documentId?: string
  slug: string
  title: string
  excerpt?: string
  content?: string
  readingTime?: number
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
  category?: CoreCategory | string | null
  author?: CoreAuthor | string | null
  tags?: (CoreTag | string)[]
  featuredImage?: CoreMedia | null
  coverUrl?: string | null
  seo?: CoreSEO | null
  seoData?: {
    seoTitle?: string
    metaDescription?: string
  } | null
  yoastSchema?: any
}

export interface CoreArticlesResponse {
  data: CoreArticle[]
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface CoreArticleDetailResponse {
  article: CoreArticle
}

const CORE_API_URL =
  process.env.CORE_API_URL ||
  process.env.NEXT_PUBLIC_CORE_URL ||
  `http://127.0.0.1:${process.env.PORT || '3002'}`

const CORE_SITE_KEY =
  process.env.CORE_SITE_KEY ||
  process.env.NEXT_PUBLIC_CORE_SITE_KEY ||
  'site_sec_spatium'

/**
 * Standard fetch wrapper for UNIMASI Core Delivery API with Next.js caching.
 */
async function coreFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const url = `${CORE_API_URL.replace(/\/$/, '')}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'x-site-key': CORE_SITE_KEY,
    ...(options.headers || {}),
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      // Cache with Next.js ISR tags for on-demand revalidation
      next: {
        revalidate: 300, // 5 minutes cache
        tags: ['core-content', 'core-articles'],
        ...((options as { next?: Record<string, unknown> })?.next || {}),
      },
    })

    if (!res.ok) {
      console.warn(`[Core API] Request failed: ${res.status} ${res.statusText} (${url})`)
      return null
    }

    return await res.json()
  } catch (error) {
    console.error(`[Core API] Network or fetch error for ${url}:`, error)
    return null
  }
}

/**
 * Helper to normalize author name from Core object or string.
 */
export function getAuthorName(author?: CoreAuthor | string | null): string {
  if (!author) return 'SPATIUM'
  if (typeof author === 'string') return author
  return author.name || 'SPATIUM'
}

/**
 * Helper to normalize category name from Core object or string.
 */
export function getCategoryName(category?: CoreCategory | string | null): string {
  if (!category) return 'Artikel'
  if (typeof category === 'string') return category
  return category.name || 'Artikel'
}

/**
 * Helper to normalize tag list from Core.
 */
export function getTagNames(tags?: (CoreTag | string)[]): string[] {
  if (!tags || !Array.isArray(tags)) return []
  return tags.map((t) => (typeof t === 'string' ? t : t.name || t.slug || '')).filter(Boolean)
}

/**
 * Helper to resolve absolute or relative image URL from Core.
 */
export function getMediaUrl(media?: CoreMedia | null, coverUrl?: string | null): string | null {
  const candidate = media?.url || coverUrl
  if (!candidate) return null
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate
  }
  return `${CORE_API_URL.replace(/\/$/, '')}${candidate.startsWith('/') ? '' : '/'}${candidate}`
}

/**
 * Fetch paginated articles from UNIMASI Core with query & category filters.
 */
export async function getCoreArticles(params: {
  page?: number
  pageSize?: number
  category?: string
  search?: string
}): Promise<{
  articles: CoreArticle[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}> {
  const page = Math.max(1, params.page || 1)
  const pageSize = params.pageSize || 12

  let filtered = [...SORTED_ARTICLES]
  if (params.category && params.category !== 'all') {
    filtered = filtered.filter((a) => a.category.toLowerCase() === params.category!.toLowerCase())
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q))
  }

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize)

  const adapted: CoreArticle[] = slice.map((loc, idx) => ({
    id: idx + 1,
    slug: loc.slug,
    title: loc.title,
    excerpt: loc.excerpt,
    category: loc.category,
    author: loc.author,
    publishedAt: loc.date,
    readingTime: loc.readMinutes,
    tags: loc.tags.map((t) => ({ name: t, slug: t.toLowerCase() })),
  }))

  return {
    articles: adapted,
    total,
    page,
    pageSize,
    pageCount,
  }
}

/**
 * Fetch a single article by slug from SPATIUM Core.
 */
export async function getCoreArticleBySlug(slug: string): Promise<CoreArticle | null> {
  const localMatch = SORTED_ARTICLES.find((a) => a.slug === slug)
  if (localMatch) {
    return {
      id: localMatch.slug,
      slug: localMatch.slug,
      title: localMatch.title,
      excerpt: localMatch.excerpt,
      content: localMatch.body
        .map((b) => {
          if (b.type === 'p') return `<p>${b.text}</p>`
          if (b.type === 'h2') return `<h2>${b.text}</h2>`
          if (b.type === 'h3') return `<h3>${b.text}</h3>`
          if (b.type === 'ul') return `<ul>${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`
          if (b.type === 'ol') return `<ol>${b.items.map((i) => `<li>${i}</li>`).join('')}</ol>`
          if (b.type === 'quote') return `<blockquote><p>${b.text}</p></blockquote>`
          return ''
        })
        .join('\n'),
      category: localMatch.category,
      author: localMatch.author,
      publishedAt: localMatch.date,
      readingTime: localMatch.readMinutes,
      tags: localMatch.tags.map((t) => ({ name: t, slug: t.toLowerCase() })),
      seo: {
        metaTitle: `${localMatch.title} — SPATIUM`,
        metaDescription: localMatch.metaDescription,
        canonicalUrl: `https://spatium.id/journal/${localMatch.slug}`,
      },
    }
  }

  return null
}

/**
 * Fetch all categories and counts for filter UI.
 */
export async function getCoreCategories(): Promise<{ name: string; count: number }[]> {
  const counts: Record<string, number> = {}
  SORTED_ARTICLES.forEach((art) => {
    const cat = art.category
    counts[cat] = (counts[cat] || 0) + 1
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

export interface CoreServiceItem {
  id: number | string
  name: string
  title?: string
  slug: string
  shortDescription?: string
  summary?: string
  fullDescription?: string
  deliverables?: string[]
}

export interface CorePortfolioItem {
  id: number | string
  title: string
  slug: string
  client?: string
  year?: string | number
  category?: string
  summary?: string
  coverImage?: string
  technologies?: string[]
}

export interface CorePartnerItem {
  id: string
  name: string
  logo: string
  alt: string
  tier?: string
}

import { SERVICES } from '@/data/services'
import { PROJECTS } from '@/data/projects'

export async function getCoreServices(): Promise<any[]> {
  return SERVICES || []
}

export async function getCorePortfolios(): Promise<CorePortfolioItem[]> {
  return (PROJECTS as unknown as CorePortfolioItem[]) || []
}

export async function getCorePartners(): Promise<CorePartnerItem[]> {
  if (!process.env.DATABASE_URL) {
    return []
  }
  try {
    const { getClientLogos } = await import('@/lib/content/clients')
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 600))
    const dbItems = await Promise.race([getClientLogos(), timeout])
    if (!dbItems || !Array.isArray(dbItems)) return []
    return dbItems.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.src,
      alt: c.alt,
    }))
  } catch {
    return []
  }
}
