import 'server-only'
import { prisma } from './prisma'
import type { Portfolio, SEOComponent } from '../content/types'

function mapToPortfolio(row: any): Portfolio {
  const seo: SEOComponent = {
    id: row.id,
    metaTitle: row.metaTitle || row.title,
    metaDescription: row.metaDescription || row.summary,
  }

  let metrics = []
  if (row.metrics) {
    try {
      metrics = typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics
    } catch {
      metrics = []
    }
  }

  let technologies = []
  if (row.technologies) {
    try {
      technologies = typeof row.technologies === 'string' ? JSON.parse(row.technologies) : row.technologies
    } catch {
      technologies = []
    }
  }

  let blocks = []
  if (row.blocks) {
    try {
      blocks = typeof row.blocks === 'string' ? JSON.parse(row.blocks) : row.blocks
    } catch {
      blocks = []
    }
  }

  return {
    id: row.id,
    documentId: row.documentId || `port-${row.slug}`,
    title: row.title,
    slug: row.slug,
    blocks: blocks.length > 0 ? blocks : undefined,
    client: row.client || undefined,
    year: row.year || undefined,
    category: row.category || undefined,
    summary: row.summary || '',
    challenge: row.challenge || undefined,
    approach: row.approach || undefined,
    solution: row.solution || undefined,
    process: row.process || undefined,
    result: row.result || undefined,
    heroMedia: row.heroImage
      ? {
          id: row.id,
          documentId: `media-port-${row.slug}`,
          name: row.title,
          alternativeText: row.title,
          caption: null,
          width: 1200,
          height: 675,
          formats: {},
          url: row.heroImage,
          mime: 'image/webp',
          size: 0,
        }
      : undefined,
    livePreviewUrl: row.liveUrl || undefined,
    metrics: metrics.length > 0 ? metrics : undefined,
    technologies: technologies.length > 0 ? technologies.map((t: any, idx: number) => ({
      id: idx + 1,
      documentId: `tech-${idx}`,
      name: typeof t === 'string' ? t : t.name,
      slug: (typeof t === 'string' ? t : t.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    })) : undefined,
    seo,
    publishedAt: row.createdAt || '2026-01-01T00:00:00.000Z',
    createdAt: row.createdAt || '2026-01-01T00:00:00.000Z',
    updatedAt: row.updatedAt || '2026-01-01T00:00:00.000Z',
  }
}

export async function getPortfolios(limit?: number): Promise<Portfolio[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    let query = prisma.orm.public.Portfolio.orderBy((p: any) => p.id.desc())
    if (limit) {
      query = query.limit(limit)
    }
    const rows = await query.all()
    return rows.map(mapToPortfolio)
  } catch (err: any) {
    console.error('Failed to get portfolios:', err?.message || String(err))
    return []
  }
}

export async function getPortfolioBySlug(slug: string): Promise<Portfolio | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const row = await prisma.orm.public.Portfolio.where({ slug }).first()
    if (!row) return null
    return mapToPortfolio(row)
  } catch (err: any) {
    console.error('Failed to get portfolio by slug:', err?.message || String(err))
    return null
  }
}

export async function getFeaturedPortfolios(limit = 6): Promise<Portfolio[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const rows = await prisma.orm.public.Portfolio.where({ featured: true }).limit(limit).all()
    return rows.map(mapToPortfolio)
  } catch (err: any) {
    console.error('Failed to get featured portfolios:', err?.message || String(err))
    return []
  }
}

export interface RelatedServiceSummary {
  id: number
  slug: string
  name: string
  shortDescription?: string | null
  iconName?: string | null
}

export interface RelatedSolutionSummary {
  id: number
  slug: string
  title: string
  shortDescription?: string | null
}

export async function getRelatedServicesForPortfolio(portfolioId: number): Promise<RelatedServiceSummary[]> {
  try {
    const rels = await prisma.orm.public.ServicePortfolio
      .where({ portfolioId })
      .orderBy((r: any) => r.displayOrder.asc())
      .include('service')
      .all()

    return rels.map((r: any) => ({
      id: r.service.id,
      slug: r.service.slug,
      name: r.service.name,
      shortDescription: r.service.shortDescription,
      iconName: r.service.icon,
    }))
  } catch {
    return []
  }
}

export async function getRelatedSolutionsForPortfolio(portfolioId: number): Promise<RelatedSolutionSummary[]> {
  try {
    const rels = await prisma.orm.public.SolutionPortfolio
      .where({ portfolioId })
      .orderBy((r: any) => r.displayOrder.asc())
      .include('solution')
      .all()

    return rels.map((r: any) => ({
      id: r.solution.id,
      slug: r.solution.slug,
      title: r.solution.title,
      shortDescription: r.solution.shortDescription,
    }))
  } catch {
    return []
  }
}
