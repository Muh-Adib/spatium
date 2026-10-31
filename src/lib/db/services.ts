import 'server-only'
import { prisma } from './prisma'
import type { Service, SEOComponent } from '../content/types'

function mapToService(row: any): Service {
  const seo: SEOComponent = {
    id: row.id,
    metaTitle: row.metaTitle || row.name,
    metaDescription: row.metaDescription || row.shortDescription,
  }

  let features = []
  if (row.features) {
    try {
      features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features
    } catch {
      features = []
    }
  }

  let deliverables = []
  if (row.deliverables) {
    try {
      deliverables = typeof row.deliverables === 'string' ? JSON.parse(row.deliverables) : row.deliverables
    } catch {
      deliverables = []
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

  let faq = []
  if (row.faq) {
    try {
      faq = typeof row.faq === 'string' ? JSON.parse(row.faq) : row.faq
    } catch {
      faq = []
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

  let primaryMedia = null
  if (row.primaryMedia) {
    try {
      primaryMedia = typeof row.primaryMedia === 'string' ? JSON.parse(row.primaryMedia) : row.primaryMedia
    } catch {
      primaryMedia = null
    }
  }

  let metrics = []
  if (row.metrics) {
    try {
      metrics = typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics
    } catch {
      metrics = []
    }
  }

  return {
    id: row.id,
    documentId: row.documentId || `svc-${row.slug}`,
    name: row.name,
    slug: row.slug,
    categoryId: row.categoryId ?? null,
    indexNumber: row.indexNumber ?? null,
    categoryBadge: row.categoryBadge ?? null,
    highlightWord: row.highlightWord ?? null,
    shortDescription: row.shortDescription || undefined,
    longDescription: row.longDescription || undefined,
    description: row.description || undefined,
    whatsappPrompt: row.whatsappPrompt || undefined,
    primaryMedia: primaryMedia || undefined,
    metrics: metrics.length > 0 ? metrics : undefined,
    blocks: blocks.length > 0 ? blocks : undefined,
    status: row.status || 'published',
    icon: row.icon || undefined,
    heroImage: row.heroImage
      ? {
          id: row.id,
          documentId: `media-svc-${row.slug}`,
          name: row.name,
          alternativeText: row.name,
          caption: null,
          width: 1200,
          height: 630,
          formats: {},
          url: row.heroImage,
          mime: 'image/jpeg',
          size: 0,
        }
      : undefined,
    features: features.length > 0 ? features : undefined,
    deliverables: deliverables.length > 0 ? deliverables : undefined,
    technologies: technologies.length > 0 ? technologies.map((t: any, idx: number) => ({
      id: idx + 1,
      documentId: `tech-${idx}`,
      name: typeof t === 'string' ? t : t.name,
      slug: (typeof t === 'string' ? t : t.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    })) : undefined,
    faq: faq.length > 0 ? faq : undefined,
    seo,
    publishedAt: row.createdAt || '2026-01-01T00:00:00.000Z',
    createdAt: row.createdAt || '2026-01-01T00:00:00.000Z',
    updatedAt: row.updatedAt || '2026-01-01T00:00:00.000Z',
  }
}

export async function getServices(limit?: number): Promise<Service[]> {
  try {
    let query = prisma.orm.public.Service.orderBy((s: any) => s.order.asc())
    if (limit) query = query.limit(limit)
    const rows = await query.all()
    return rows.map(mapToService)
  } catch (err) {
    console.error('Failed to get services:', err)
    return []
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const row = await prisma.orm.public.Service.where({ slug }).first()
    if (!row) return null
    return mapToService(row)
  } catch (err) {
    console.error('Failed to get service by slug:', err)
    return null
  }
}

export async function getServicesByCategoryId(categoryId: number): Promise<Service[]> {
  try {
    const rows = await prisma.orm.public.Service
      .where({ categoryId })
      .orderBy((s: any) => s.order.asc())
      .all()
    return rows.map(mapToService)
  } catch {
    return []
  }
}

export async function getServiceWithDetails(slug: string) {
  try {
    const row = await prisma.orm.public.Service.where({ slug }).first()
    if (!row) return null
    const svc = mapToService(row)

    // Lookup category slug
    let categorySlug = 'software-product'
    if (row.categoryId) {
      const cat = await prisma.orm.public.ServiceCategory.where({ id: row.categoryId }).first()
      if (cat?.slug) {
        categorySlug = cat.slug
      }
    }

    // Safe defaults for ServiceDetailView fallback
    const safePrimaryMedia = svc.primaryMedia || {
      type: 'image',
      imageUrl: row.heroImage || '/images/nav/web-dev.jpg',
      altText: row.name,
      badgeText: row.categoryBadge || 'ENTERPRISE SOLUTION',
    }

    const safeMetrics = svc.metrics && svc.metrics.length > 0 ? svc.metrics : [
      { label: 'SLA Uptime', value: '99.9%' },
      { label: 'Standard', value: 'ISO / OWASP' },
      { label: 'Architecture', value: 'Modular Cloud' },
    ]

    const safeWhatsappPrompt = svc.whatsappPrompt || `Halo UNIMASI, saya ingin konsultasi mengenai layanan ${svc.name}.`

    // Portofolio terkait via relation
    const linkedRels = await prisma.orm.public.ServicePortfolio
      .where({ serviceId: row.id })
      .orderBy((r: any) => r.displayOrder.asc())
      .include('portfolio')
      .all()

    const linkedPortfolios = linkedRels.map((r: any) => ({
      id: r.portfolio.id,
      slug: r.portfolio.slug,
      title: r.portfolio.title,
      client: r.portfolio.client,
      category: r.portfolio.category,
      heroImage: r.portfolio.heroImage,
    }))

    return {
      ...svc,
      categorySlug,
      index: svc.indexNumber || '01',
      primaryMedia: safePrimaryMedia,
      metrics: safeMetrics,
      whatsappPrompt: safeWhatsappPrompt,
      portfolioItems: linkedPortfolios,
    }
  } catch (err) {
    console.error('Failed to get service with details:', err)
    return null
  }
}

export async function getFeaturedServices(limit = 6): Promise<Service[]> {
  try {
    const rows = await prisma.orm.public.Service
      .where({ featured: true })
      .orderBy((s: any) => s.order.asc())
      .limit(limit)
      .all()
    return rows.map(mapToService)
  } catch {
    return []
  }
}
