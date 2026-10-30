import 'server-only'
import { prisma } from './prisma'

export interface SolutionEntity {
  id: number
  slug: string
  title: string
  category: string | null
  shortDescription: string | null
  description: string | null
  heroImage: string | null
  blocks: any[]
  keyBenefits: string[]
  technologies: string[]
  order: number | null
  featured: boolean | null
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived'
  createdAt: string | null
  updatedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  focusKeyphrase: string | null
  relatedKeyphrases: string[]
  seoData: any | null
  relatedPortfolios?: any[]
  relatedServices?: {
    id: number
    slug: string
    name: string
    shortDescription?: string | null
    icon?: string | null
  }[]
}

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (!val) return fallback
  if (typeof val !== 'string') return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

export function mapSolutionRow(row: any): SolutionEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category || 'taxonomy',
    shortDescription: row.shortDescription || null,
    description: row.description || null,
    heroImage: row.heroImage || null,
    blocks: parseJsonSafe(row.blocks, []),
    keyBenefits: parseJsonSafe(row.keyBenefits, []),
    technologies: parseJsonSafe(row.technologies, []),
    order: row.order ?? 0,
    featured: Boolean(row.featured),
    status: row.status || 'published',
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    metaTitle: row.metaTitle || null,
    metaDescription: row.metaDescription || null,
    focusKeyphrase: row.focusKeyphrase || null,
    relatedKeyphrases: parseJsonSafe(row.relatedKeyphrases, []),
    seoData: parseJsonSafe(row.seoData, null),
  }
}

export async function getSolutions(): Promise<SolutionEntity[]> {
  try {
    const rows = await prisma.orm.public.Solution
      .orderBy((s: any) => s.order.asc())
      .all()
    return rows.map(mapSolutionRow)
  } catch (err) {
    console.error('Failed to get solutions:', err)
    return []
  }
}

export async function getSolutionBySlug(slug: string): Promise<SolutionEntity | null> {
  try {
    const row = await prisma.orm.public.Solution.where({ slug }).first()
    if (!row) return null
    const sol = mapSolutionRow(row)

    // Ambil portofolio terkait lewat solution_portfolios
    const linkedPortfoliosRels = await prisma.orm.public.SolutionPortfolio
      .where({ solutionId: sol.id })
      .orderBy((r: any) => r.displayOrder.asc())
      .include('portfolio')
      .all()

    sol.relatedPortfolios = linkedPortfoliosRels.map((r: any) => ({
      id: r.portfolio.id,
      slug: r.portfolio.slug,
      title: r.portfolio.title,
      client: r.portfolio.client,
      category: r.portfolio.category,
      heroImage: r.portfolio.heroImage,
    }))

    // Ambil layanan terkait lewat solution_services
    const linkedServicesRels = await prisma.orm.public.SolutionService
      .where({ solutionId: sol.id })
      .include('service')
      .all()

    sol.relatedServices = linkedServicesRels.map((r: any) => ({
      id: r.service.id,
      slug: r.service.slug,
      name: r.service.name,
      shortDescription: r.service.shortDescription,
      icon: r.service.icon,
    }))

    return sol
  } catch (err) {
    console.error('Failed to get solution by slug:', err)
    return null
  }
}

export async function getSolutionFinderConfig() {
  try {
    const row = await prisma.orm.public.SolutionFinderConfig
      .where({ configKey: 'default' })
      .first()

    if (!row) return null
    return {
      id: row.id,
      configKey: row.configKey,
      businessGoals: parseJsonSafe(row.businessGoals, []),
      industries: parseJsonSafe(row.industries, []),
      questions: parseJsonSafe(row.questions, []),
      recommendationMatrix: parseJsonSafe(row.recommendationMatrix, []),
      updatedAt: row.updatedAt,
    }
  } catch (err) {
    return null
  }
}
