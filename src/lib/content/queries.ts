import { siteConfig } from '@/config/site'
/**
 * Content queries — PostgreSQL (Prisma 8) via `src/lib/db/*` is the only source.
 *
 * Zero-Mock policy (AGENTS.md §3.3): there is no seed/fixture fallback. Errors
 * are logged with console.error and surface as honest empty results.
 */

import type { Article, Category, Portfolio, Service, Redirect, SiteSetting } from './types'
import type { SolutionEntity } from '@/lib/db/solutions'

// --- Site Settings ----------------------------------------------------------

export async function getSiteSettings(): Promise<SiteSetting> {
  try {
    const { getSiteConfig } = await import('@/lib/db/site-config')
    const config = await getSiteConfig()
    if (config) return config
  } catch (err) {
    console.error('[content] getSiteSettings failed, using verified siteConfig:', err)
  }
  // Verified static business config (src/config/site.ts) — not a fictional fallback.
  return {
    id: 1,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || siteConfig.name,
    siteDescription: siteConfig.description,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url,
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || siteConfig.whatsapp || undefined,
    email: siteConfig.email || undefined,
    phone: siteConfig.phone || undefined,
    address: siteConfig.address || undefined,
  }
}

// --- Articles ---------------------------------------------------------------

export interface ArticleParams {
  page?: number
  pageSize?: number
  category?: string
  search?: string
}

export async function getArticle(slug: string, options?: { allowUnpublished?: boolean }): Promise<Article | null> {
  try {
    const { getArticleBySlug } = await import('@/lib/db/articles')
    const article = await getArticleBySlug(slug)
    if (!article) return null
    return article.status === 'published' || options?.allowUnpublished ? article : null
  } catch (err) {
    console.error('[content] getArticle failed:', err)
    return null
  }
}

export async function getArticles(params: ArticleParams = {}): Promise<{
  articles: Article[]
  total: number
  pageCount: number
}> {
  const { page = 1, pageSize = 12, search, category } = params
  try {
    const { getArticles: dbGetArticles } = await import('@/lib/db/articles')
    const result = await dbGetArticles({ page, pageSize, category, search, status: 'published' })
    return {
      articles: result.data,
      total: result.meta.pagination.total,
      pageCount: result.meta.pagination.pageCount,
    }
  } catch (err) {
    console.error('[content] getArticles failed:', err)
    return { articles: [], total: 0, pageCount: 0 }
  }
}

// --- Services ---------------------------------------------------------------

export async function getService(slug: string): Promise<Service | null> {
  try {
    const { getServiceBySlug } = await import('@/lib/db/services')
    return await getServiceBySlug(slug)
  } catch (err) {
    console.error('[content] getService failed:', err)
    return null
  }
}

export async function getServices(): Promise<Service[]> {
  try {
    const { getServices: getServicesDb } = await import('@/lib/db/services')
    return await getServicesDb()
  } catch (err) {
    console.error('[content] getServices failed:', err)
    return []
  }
}

// --- Portfolio --------------------------------------------------------------

export async function getPortfolio(slug: string): Promise<Portfolio | null> {
  try {
    const { getPortfolioBySlug } = await import('@/lib/db/portfolio')
    return await getPortfolioBySlug(slug)
  } catch (err) {
    console.error('[content] getPortfolio failed:', err)
    return null
  }
}

export async function getPortfolioItems(): Promise<Portfolio[]> {
  try {
    const { getPortfolios } = await import('@/lib/db/portfolio')
    return await getPortfolios()
  } catch (err) {
    console.error('[content] getPortfolioItems failed:', err)
    return []
  }
}

// --- Solutions & Taxonomy ---------------------------------------------------

export async function getSolution(slug: string): Promise<SolutionEntity | null> {
  try {
    const { getSolutionBySlug } = await import('@/lib/db/solutions')
    return await getSolutionBySlug(slug)
  } catch (err) {
    console.error('[content] getSolution failed:', err)
    return null
  }
}

export async function getSolutions(): Promise<SolutionEntity[]> {
  try {
    const { getSolutions: getSolutionsFromDb } = await import('@/lib/db/solutions')
    return await getSolutionsFromDb()
  } catch (err) {
    console.error('[content] getSolutions failed:', err)
    return []
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { getAllCategories } = await import('@/lib/db/articles')
    return await getAllCategories()
  } catch (err) {
    console.error('[content] getCategories failed:', err)
    return []
  }
}

export async function getCategoriesWithCounts(): Promise<Array<Category & { articleCount: number }>> {
  try {
    const { getAllCategoriesWithCounts } = await import('@/lib/db/articles')
    return await getAllCategoriesWithCounts()
  } catch (err) {
    console.error('[content] getCategoriesWithCounts failed:', err)
    return []
  }
}

export async function getCategory(slug: string): Promise<Category | null> {
  const cats = await getCategories()
  return cats.find((c) => c.slug === slug) ?? null
}

export async function getRedirects(): Promise<Redirect[]> {
  try {
    const { getAllRedirects } = await import('@/lib/db/redirects')
    return await getAllRedirects()
  } catch (err) {
    console.error('[content] getRedirects failed:', err)
    return []
  }
}

export async function searchContent(query: string): Promise<{
  articles: Article[]
  services: Service[]
  portfolio: Portfolio[]
}> {
  const q = query.toLowerCase()
  const [{ articles }, services, portfolio] = await Promise.all([
    getArticles({ search: q, pageSize: 10 }),
    getServices(),
    getPortfolioItems(),
  ])
  return {
    articles,
    services: services
      .filter((s) => s.name.toLowerCase().includes(q) || s.shortDescription?.toLowerCase().includes(q))
      .slice(0, 10),
    portfolio: portfolio
      .filter((p) => p.title.toLowerCase().includes(q) || (p.summary && p.summary.toLowerCase().includes(q)))
      .slice(0, 10),
  }
}
