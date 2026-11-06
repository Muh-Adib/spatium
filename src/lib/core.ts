/**
 * SPATIUM content facade for public pages.
 *
 * Every function here reads PostgreSQL (via `src/lib/db/*` and
 * `src/lib/content/spatium.ts`). There is no static or seed fallback: on a
 * database error the functions log via console.error and return an honest
 * empty result (`[]` / `null`), per AGENTS.md §3.3.
 */

import 'server-only'
import { getArticleBySlug, getArticles } from '@/lib/db/articles'
import { getProjects, getUseCases } from '@/lib/content/spatium'
import type { Article as CmsArticle } from '@/lib/content/types'
import type { Project, Service } from '@/lib/content/spatium-types'

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
  yoastSchema?: unknown
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
  yoastSchema?: unknown
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
  if (candidate.startsWith('http://') || candidate.startsWith('https://') || candidate.startsWith('/')) {
    return candidate
  }
  return `/${candidate}`
}

function toCoreArticle(a: CmsArticle): CoreArticle {
  return {
    id: a.id,
    documentId: a.documentId,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    readingTime: a.readingTime,
    publishedAt: a.publishedAt ?? undefined,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    category: a.category ? { id: a.category.id, name: a.category.name, slug: a.category.slug } : null,
    author: a.author ? { id: a.author.id, name: a.author.name, slug: a.author.slug } : null,
    tags: (a.tags ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
    coverUrl: a.coverUrl ?? null,
    seo: a.seo
      ? {
          metaTitle: a.seo.metaTitle,
          metaDescription: a.seo.metaDescription,
          canonicalUrl: a.seo.canonicalUrl,
        }
      : null,
  }
}

/**
 * Paginated published articles from PostgreSQL, filtered by category slug/name
 * and search text. Empty result (logged) on DB failure.
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
  const empty = { articles: [], total: 0, page, pageSize, pageCount: 0 }
  if (!process.env.DATABASE_URL) {
    console.error('[core] DATABASE_URL is not set — no articles.')
    return empty
  }
  try {
    const result = await getArticles({
      page,
      pageSize,
      status: 'published',
      category: params.category && params.category !== 'all' ? params.category : undefined,
      search: params.search || undefined,
    })
    return {
      articles: result.data.map(toCoreArticle),
      total: result.meta.pagination.total,
      page,
      pageSize,
      pageCount: result.meta.pagination.pageCount,
    }
  } catch (err) {
    console.error('[core] getCoreArticles failed:', err)
    return empty
  }
}

/** A single published article by slug, or null (missing / unpublished / DB error). */
export async function getCoreArticleBySlug(slug: string): Promise<CoreArticle | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const article = await getArticleBySlug(slug)
    if (!article || article.status !== 'published') return null
    return toCoreArticle(article)
  } catch (err) {
    console.error('[core] getCoreArticleBySlug failed:', err)
    return null
  }
}

/** Categories with published-article counts (non-empty only), for filter UI. */
export async function getCoreCategories(): Promise<{ name: string; slug: string; count: number }[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const result = await getArticles({ page: 1, pageSize: 100, status: 'published' })
    const counts = new Map<string, { name: string; slug: string; count: number }>()
    for (const a of result.data) {
      if (!a.category) continue
      const entry = counts.get(a.category.slug) ?? { name: a.category.name, slug: a.category.slug, count: 0 }
      entry.count += 1
      counts.set(a.category.slug, entry)
    }
    return [...counts.values()].sort((a, b) => b.count - a.count)
  } catch (err) {
    console.error('[core] getCoreCategories failed:', err)
    return []
  }
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

/** Published core use cases (service categories + capabilities). */
export async function getCoreServices(): Promise<Service[]> {
  return getUseCases()
}

/** Published portfolio scenes. */
export async function getCorePortfolios(): Promise<Project[]> {
  return getProjects()
}

export async function getCorePartners(): Promise<CorePartnerItem[]> {
  if (!process.env.DATABASE_URL) {
    return []
  }
  try {
    const { getClientLogos } = await import('@/lib/content/clients')
    const dbItems = await getClientLogos()
    return dbItems.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.src,
      alt: c.alt,
    }))
  } catch (err) {
    console.error('[core] getCorePartners failed:', err)
    return []
  }
}

