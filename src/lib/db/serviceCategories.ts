import 'server-only'
import { prisma } from './prisma'

export interface ServiceCategoryEntity {
  id: number
  slug: string
  title: string
  tag: string | null
  shortDescription: string | null
  heroImage: string | null
  themePreset: string | null
  keyOutcomes: { label: string; value: string }[]
  blocks: any[]
  order: number | null
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived'
  showInNav: boolean | null
  createdAt: string | null
  updatedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  focusKeyphrase: string | null
  relatedKeyphrases: string[]
  seoData: any | null
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

export function mapCategoryRow(row: any): ServiceCategoryEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tag: row.tag || null,
    shortDescription: row.shortDescription || null,
    heroImage: row.heroImage || null,
    themePreset: row.themePreset || 'charcoal',
    keyOutcomes: parseJsonSafe(row.keyOutcomes, []),
    blocks: parseJsonSafe(row.blocks, []),
    order: row.order ?? 0,
    status: row.status || 'published',
    showInNav: Boolean(row.showInNav ?? true),
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    metaTitle: row.metaTitle || null,
    metaDescription: row.metaDescription || null,
    focusKeyphrase: row.focusKeyphrase || null,
    relatedKeyphrases: parseJsonSafe(row.relatedKeyphrases, []),
    seoData: parseJsonSafe(row.seoData, null),
  }
}

export async function getServiceCategories(): Promise<ServiceCategoryEntity[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const rows = await prisma.orm.public.ServiceCategory
      .orderBy((c: any) => c.order.asc())
      .all()
    return rows.map(mapCategoryRow)
  } catch (err: any) {
    console.error('Failed to get service categories:', err?.message || String(err))
    return []
  }
}

export async function getNavServiceCategories(): Promise<ServiceCategoryEntity[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const rows = await prisma.orm.public.ServiceCategory
      .where({ status: 'published' })
      .orderBy((c: any) => c.order.asc())
      .all()
    return rows.filter((r: any) => Boolean(r.showInNav)).map(mapCategoryRow)
  } catch {
    return []
  }
}

export async function getServiceCategoryBySlug(slug: string): Promise<ServiceCategoryEntity | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const row = await prisma.orm.public.ServiceCategory.where({ slug }).first()
    if (!row) return null
    return mapCategoryRow(row)
  } catch {
    return null
  }
}

export async function getServiceCategoryWithServices(slug: string) {
  if (!process.env.DATABASE_URL) return null
  try {
    const category = await getServiceCategoryBySlug(slug)
    if (!category) return null

    const subServices = await prisma.orm.public.Service
      .where({ categoryId: category.id })
      .orderBy((s: any) => s.order.asc())
      .all()

    return {
      ...category,
      subServices: subServices.map((s: any) => ({
        ...s,
        primaryMedia: parseJsonSafe(s.primaryMedia, null),
        metrics: parseJsonSafe(s.metrics, []),
        features: parseJsonSafe(s.features, []),
        blocks: parseJsonSafe(s.blocks, []),
      })),
    }
  } catch {
    return null
  }
}

export async function getAllServiceCategoriesWithServices() {
  try {
    const categories = await getServiceCategories()
    const allServices = await prisma.orm.public.Service
      .where({ status: 'published' })
      .orderBy((s: any) => s.order.asc())
      .all()

    return categories.map((cat) => ({
      ...cat,
      subServices: allServices
        .filter((s: any) => s.categoryId === cat.id)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          shortDescription: s.shortDescription,
        })),
    }))
  } catch (err) {
    return []
  }
}
