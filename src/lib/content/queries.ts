import { contentCanonical } from '@/lib/seo/canonical'
import { parseRobots } from '@/lib/seo/robots'
import { getSiteProfile } from '@/lib/db/siteProfile'
/**
 * WebShift Content Queries
 * Primary data source: SQLite via Drizzle ORM (`lib/db/`)
 * Fallback: Local seed JSON files (`data/seed/`)
 * No external CMS dependency.
 */

import type {
  Article,
  Category,
  Author,
  Page,
  Portfolio,
  Service,
  Solution,
  Redirect,
  SiteSetting,
  SEOComponent,
  MediaImage,
} from './types'

// Seed data fallback
import seedPortfolio from '@/data/seed/seed_portfolio.json'
import seedServices from '@/data/seed/seed_services.json'
import seedArticles from '@/data/seed/seed_articles.json'
import seedPages from '@/data/seed/seed_pages.json'
import seedRedirects from '@/data/seed/seed_redirects.json'

// -----------------------------------------------------------------------------
// Telemetry helpers
// -----------------------------------------------------------------------------

export function emitFallbackTelemetry(entity: string, error?: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[WebShift Fallback] Serving '${entity}' from local seed data.`,
      error ? `Reason: ${String(error)}` : ''
    )
  }
}

// -----------------------------------------------------------------------------
// DB-first article query helpers (with seed fallback)
// -----------------------------------------------------------------------------

function getDynamicArticles(): any[] {
  try {
    if (typeof window === 'undefined') {
      const fs = require('fs')
      const path = require('path')
      const p = path.join(process.cwd(), 'src', 'data', 'seed', 'seed_articles.json')
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'))
    }
  } catch {}
  return seedArticles as any[]
}

function getDynamicPortfolio(): any[] {
  try {
    if (typeof window === 'undefined') {
      const fs = require('fs')
      const path = require('path')
      const p = path.join(process.cwd(), 'src', 'data', 'seed', 'seed_portfolio.json')
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'))
    }
  } catch {}
  return seedPortfolio as any[]
}

// -----------------------------------------------------------------------------
// Category inference (from article content)
// -----------------------------------------------------------------------------

export function resolveArticleCategory(article: {
  title?: string
  category?: any
  slug?: string
  excerpt?: string
}): Category {
  if (
    article.category &&
    typeof article.category === 'object' &&
    article.category.name &&
    article.category.slug &&
    article.category.slug !== article.slug
  ) {
    return {
      id: article.category.id || 1,
      documentId: article.category.documentId || `cat-${article.category.slug}`,
      name: article.category.name,
      slug: article.category.slug,
    }
  }

  const t = `${article.title || ''} ${article.slug || ''}`.toLowerCase()
  const f = `${article.title || ''} ${article.slug || ''} ${article.excerpt || ''}`.toLowerCase()

  if (t.includes('next.js') || t.includes('nextjs') || t.includes('headless') || t.includes('arsitektur web') || t.includes('rekayasa web'))
    return { id: 1, documentId: 'cat-website-development', name: 'Website Development', slug: 'website-development' }

  if (f.includes('aquarium') || f.includes('akuarium') || f.includes('3d') || f.includes('webgl') || f.includes('three.js') || f.includes('virtual') || f.includes('ai ') || f.includes('ai-') || f.includes('artificial') || f.includes('machine learning') || f.includes('chatbot') || f.includes('kecerdasan'))
    return { id: 3, documentId: 'cat-teknologi-ai', name: 'Teknologi AI & Interaktif', slug: 'teknologi-ai' }

  if (f.includes('ui/ux') || f.includes('ui-ux') || f.includes('wireframe') || f.includes('figma') || f.includes('brand') || f.includes('logo') || (f.includes('desain') && !f.includes('web')))
    return { id: 4, documentId: 'cat-ui-ux-branding', name: 'UI/UX & Branding Digital', slug: 'ui-ux-branding' }

  if (f.includes('seo') || f.includes('ranking') || f.includes('kata kunci') || f.includes('serp') || f.includes('konten') || f.includes('maintenance') || f.includes('pemeliharaan') || f.includes('keamanan') || f.includes('audit'))
    return { id: 5, documentId: 'cat-seo-pemeliharaan', name: 'SEO & Pemeliharaan Web', slug: 'seo-pemeliharaan' }

  if (f.includes('lms') || f.includes('pembelajaran') || f.includes('sekolah') || f.includes('kampus') || f.includes('erp') || f.includes('manufaktur') || f.includes('inventory') || f.includes('rumah sakit') || f.includes('simrs') || f.includes('klinik') || f.includes('aplikasi') || f.includes('android') || f.includes('ios') || f.includes('sistem'))
    return { id: 2, documentId: 'cat-aplikasi-sistem', name: 'Aplikasi & Sistem Informasi', slug: 'aplikasi-sistem' }

  return { id: 1, documentId: 'cat-website-development', name: 'Website Development', slug: 'website-development' }
}

// -----------------------------------------------------------------------------
// Excerpt formatting
// -----------------------------------------------------------------------------

export function formatArticleExcerpt(article: { title?: string; slug?: string; excerpt?: string }): string {
  const slug = (article.slug || '').toLowerCase()
  const title = (article.title || '').toLowerCase()
  const rawExcerpt = (article.excerpt || '').trim()



  if (rawExcerpt && !rawExcerpt.includes('[&hellip;]') && rawExcerpt.length >= 45 && rawExcerpt.length <= 160)
    return rawExcerpt

  if (title.includes('ai apps') || title.includes('artificial intelligence') || title.includes('chatbot'))
    return 'Pengembangan solusi kecerdasan buatan terpadu, automasi proses cerdas, dan integrasi model machine learning untuk efisiensi bisnis.'
  if (title.includes('lms') || title.includes('ujian online') || title.includes('akademik'))
    return 'Platform Learning Management System modular dengan arsitektur cloud stabil untuk mendukung kegiatan pembelajaran dan ujian terpadu.'
  if (title.includes('company profile') || title.includes('website') || title.includes('web industri'))
    return 'Arsitektur website korporat berkecepatan tinggi dengan navigasi intuitif, standar keamanan modern, dan kesiapan optimasi mesin pencari.'

  if (rawExcerpt) {
    const cleaned = rawExcerpt.replace(/\[&hellip;\]/g, '').replace(/<[^>]*>/g, '').trim()
    if (cleaned.length > 130) return cleaned.slice(0, 125).replace(/[,.;\s]+$/, '') + '...'
    return cleaned
  }

  return 'Wawasan teknis, panduan arsitektur sistem, dan strategi transformasi digital terkurasi dari tim rekayasa perangkat lunak.'
}

// -----------------------------------------------------------------------------
// DB-backed queries with seed fallback
// -----------------------------------------------------------------------------

/**
 * Fetch articles from SQLite/Drizzle.
 */
async function getArticlesFromDB(options: {
  page?: number
  pageSize?: number
  category?: string
  search?: string
}): Promise<{ articles: Article[]; total: number; pageCount: number }> {
  const { getArticles: dbGetArticles } = await import('@/lib/db/articles')
  const result = await dbGetArticles({
    page: options.page,
    pageSize: options.pageSize,
    category: options.category,
    search: options.search,
    status: 'published',
  })
  return {
    articles: result.data,
    total: result.meta.pagination.total,
    pageCount: result.meta.pagination.pageCount,
  }
}

// --- Site Settings ----------------------------------------------------------

export async function getSiteSettings(): Promise<SiteSetting> {
  try {
    const { getSiteConfig } = await import('@/lib/db/site-config')
    const config = await getSiteConfig()
    if (config) {
      return config
    }
  } catch {}
  return {
    id: 1,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'SegiaTech',
    siteDescription: 'Solusi Digital untuk Masa Depan Bisnis Anda',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.segiatech.com',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '6285227702811',
    email: 'contact@segiatech.com',
    phone: '+62 852-2770-2811',
    address: 'Yogyakarta, Indonesia',
  }
}

function pageSeo(row: any, siteUrl: string) {
  const stored = row.seoData ? JSON.parse(row.seoData) : {}
  return {
    ...stored,
    id: row.id,
    metaTitle: stored.seoTitle || stored.metaTitle || row.metaTitle || row.title,
    metaDescription: stored.metaDescription || row.metaDescription || row.excerpt || '',
    canonicalUrl: contentCanonical(stored.canonicalUrl || row.canonical, stored.sourceOriginalUrl, `/${row.slug}`, siteUrl),
    robots: parseRobots(stored.robots || row.robots),
    robotsIndex: !row.robots?.includes('noindex'),
    robotsFollow: !row.robots?.includes('nofollow'),
  }
}

// --- Pages ------------------------------------------------------------------

export async function getPage(slug: string): Promise<Page | null> {
  try {
    const { prisma } = await import('@/lib/db/prisma')
    const siteUrl = (await getSiteProfile()).url
    const p = await prisma.orm.public.Page.where({ slug }).first()
    if (p) {
      const now = new Date().toISOString()
      return {
        id: p.id,
        documentId: p.documentId || `page-${p.slug}`,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || undefined,
        content: p.content || undefined,
        template: p.kind === 'landing' ? 'landing' : 'default',
        kind: p.kind as any,
        status: p.status as any,
        robots: p.robots || undefined,
        canonical: p.canonical || undefined,
        clusterId: p.clusterId || undefined,
        location: p.location || undefined,
        blocks: p.blocks ? JSON.parse(p.blocks) : [],
        seo: pageSeo(p, siteUrl),
        publishedAt: p.publishedAt || p.createdAt || null,
        createdAt: p.createdAt || now,
        updatedAt: p.updatedAt || now,
      }
    }
  } catch (error) { console.error('[pages] Query failed', error); throw error }
  return null
}

export async function getPages(): Promise<Page[]> {
  try {
    const { prisma } = await import('@/lib/db/prisma')
    const rows = await prisma.orm.public.Page.all()
    const siteUrl = (await getSiteProfile()).url
    const now = new Date().toISOString()
    return rows.map((p: any) => ({
      id: p.id,
      documentId: p.documentId || `page-${p.slug}`,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || undefined,
      content: p.content || undefined,
      template: p.kind === 'landing' ? 'landing' : 'default',
      kind: p.kind as any,
      status: p.status as any,
      robots: p.robots || undefined,
      canonical: p.canonical || undefined,
      clusterId: p.clusterId || undefined,
      location: p.location || undefined,
      blocks: p.blocks ? JSON.parse(p.blocks) : [],
      seo: pageSeo(p, siteUrl),
      publishedAt: p.publishedAt || p.createdAt || null,
      createdAt: p.createdAt || now,
      updatedAt: p.updatedAt || now,
    }))
  } catch (error) { console.error('[pages] Query failed', error); throw error }
}

// --- Articles ---------------------------------------------------------------

export interface ArticleParams {
  page?: number
  pageSize?: number
  category?: string
  search?: string
}

function buildArticleFromRaw(a: any, index: number): Article {
  const category = resolveArticleCategory(a)
  const rawAuthor = a.author?.name || (typeof a.author === 'string' ? a.author : 'Tim SegiaTech')
  const authorName = !rawAuthor || rawAuthor.toLowerCase().includes('indra') ? 'Tim SegiaTech' : rawAuthor
  const excerpt = formatArticleExcerpt(a)

  return {
    id: a.id || index + 1,
    documentId: a.documentId || `local-art-${a.slug}`,
    title: a.title,
    slug: a.slug,
    excerpt,
    content: a.content,
    category,
    author: { id: 1, documentId: 'author-default', name: authorName, slug: 'tim-segiatech' },
    coverUrl: a.coverUrl,
    featuredImage: a.featuredImage || (a.coverUrl ? {
      id: 1, documentId: `media-${a.slug}`, name: a.title,
      url: a.coverUrl, alternativeText: a.title, caption: null,
      width: 1200, height: 675, formats: {}, mime: 'image/jpeg', size: 0,
    } : undefined),
    seo: a.seo,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt || a.publishedAt,
    updatedAt: a.updatedAt || a.publishedAt,
    readingTime: a.readingTime || 4,
  }
}

export async function getArticle(
  slug: string,
  options?: { allowUnpublished?: boolean }
): Promise<Article | null> {
  const { getArticleBySlug } = await import('@/lib/db/articles')
  const article = await getArticleBySlug(slug)
  if (!article) return null
  if (article.status === 'published' || options?.allowUnpublished) {
    return article
  }
  return null
}

export async function getArticles(params: ArticleParams = {}): Promise<{
  articles: Article[]
  total: number
  pageCount: number
}> {
  const { page = 1, pageSize = 12, search, category } = params

  // 1. Primary: Try SQLite
  try {
    const dbResult = await getArticlesFromDB({ page, pageSize, search, category })
    return dbResult
  } catch (e) {
    emitFallbackTelemetry('articles', e)
    // 2. Fallback to seed ONLY if SQLite throws error
    let list = getDynamicArticles()
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) => a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q))
    }
    if (category) {
      list = list.filter((a) => {
        const cat = resolveArticleCategory(a)
        return cat.slug === category || cat.name.toLowerCase() === category.toLowerCase()
      })
    }

    const total = list.length
    const paginated = list.slice((page - 1) * pageSize, page * pageSize)

    return {
      articles: paginated.map((a, i) => buildArticleFromRaw(a, i)),
      total,
      pageCount: Math.ceil(total / pageSize),
    }
  }
}

// --- Services ---------------------------------------------------------------

export async function getService(slug: string): Promise<Service | null> {
  try {
    const { getServiceBySlug } = await import('@/lib/db/services')
    return await getServiceBySlug(slug)
  } catch (err) {
    emitFallbackTelemetry('service', err)
    return null
  }
}

export async function getServices(): Promise<Service[]> {
  try {
    const { getServices: getServicesDb } = await import('@/lib/db/services')
    return await getServicesDb()
  } catch (err) {
    emitFallbackTelemetry('services', err)
    return []
  }
}


// --- Portfolio --------------------------------------------------------------

export async function getPortfolio(slug: string): Promise<Portfolio | null> {
  let normalizedSlug = slug === 'website-smk-mahanain' ? 'website-smk-mahanaim' : slug
  if (normalizedSlug === 'interactive-3d-aquarium') normalizedSlug = 'interactive-3d-aquarium-edutainment'

  // 1. Try SQLite first
  try {
    const { getPortfolioBySlug } = await import('@/lib/db/portfolio')
    const port = await getPortfolioBySlug(normalizedSlug)
    if (port) return port
  } catch {}

  // 2. Fallback to seed
  const found = getDynamicPortfolio().find((p) => p.slug === normalizedSlug)
  if (!found) return null

  return {
    id: 1, documentId: `port-${slug}`,
    title: found.title, slug: found.slug, client: found.client,
    year: found.year, industry: found.industry, projectType: found.projectType,
    heroMedia: found.heroMedia, summary: found.summary,
    challenge: found.challenge, solution: found.solution,
    seo: found.seo, publishedAt: found.publishedAt,
    createdAt: found.publishedAt, updatedAt: found.publishedAt,
  }
}

export async function getPortfolioItems(): Promise<Portfolio[]> {
  // 1. Try SQLite first
  try {
    const { getPortfolios: getPortfoliosDb } = await import('@/lib/db/portfolio')
    const list = await getPortfoliosDb()
    return list
  } catch {}

  // 2. Fallback to seed
  return getDynamicPortfolio().map((p, i) => ({
    id: i + 1, documentId: `port-${p.slug}`,
    title: p.title, slug: p.slug, client: p.client,
    year: p.year, industry: p.industry, projectType: p.projectType,
    heroMedia: p.heroMedia, summary: p.summary,
    challenge: p.challenge, solution: p.solution,
    seo: p.seo, publishedAt: p.publishedAt,
    createdAt: p.publishedAt, updatedAt: p.publishedAt,
  }))
}

// --- Solutions & Taxonomy ---------------------------------------------------

export async function getSolution(slug: string): Promise<any | null> {
  try {
    const { getSolutionBySlug } = await import('@/lib/db/solutions')
    return await getSolutionBySlug(slug)
  } catch (err) {
    console.error('Failed to getSolution from DB:', err)
    return null
  }
}

export async function getSolutions(): Promise<any[]> {
  try {
    const { getSolutions: getSolutionsFromDb } = await import('@/lib/db/solutions')
    return await getSolutionsFromDb()
  } catch (err) {
    console.error('Failed to getSolutions from DB:', err)
    return []
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { getAllCategories } = await import('@/lib/db/articles')
    return await getAllCategories()
  } catch (err) {
    console.error('Failed to query categories from DB:', err)
    return []
  }
}

export async function getCategoriesWithCounts(): Promise<Array<Category & { articleCount: number }>> {
  try {
    const { getAllCategoriesWithCounts } = await import('@/lib/db/articles')
    return await getAllCategoriesWithCounts()
  } catch (err) {
    console.error('Failed to query categories with counts from DB:', err)
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
    console.error('[WebShift Engine] Failed to query redirects from database:', err)
    return []
  }
}

export async function searchContent(query: string): Promise<{
  articles: Article[]
  services: Service[]
  portfolio: Portfolio[]
}> {
  const q = query.toLowerCase()

  let arts: Article[] = []
  try {
    const dbResult = await getArticlesFromDB({ search: q, pageSize: 10 })
    arts = dbResult.articles
  } catch (err) {
    console.error('Failed to search articles from DB:', err)
  }

  const svcs = (await getServices())
    .filter((s) => s.name.toLowerCase().includes(q) || s.shortDescription?.toLowerCase().includes(q))
    .slice(0, 10)

  const ports = (await getPortfolioItems())
    .filter((p) => p.title.toLowerCase().includes(q) || (p.summary && p.summary.toLowerCase().includes(q)))
    .slice(0, 10)

  return { articles: arts, services: svcs, portfolio: ports }
}
