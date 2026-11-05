import { prisma } from '@/lib/db/prisma'

export type NodeType = 'article' | 'landing' | 'service' | 'solution' | 'portfolio' | 'page'

export interface ContentNodeEntity {
  id: number
  type: NodeType
  refId: string
  url: string
  title: string
  summary: string | null
  primaryKeyword: string | null
  location: string | null
  clusterId: number | null
  image: string | null
  status: 'draft' | 'published' | 'archived'
  indexable: boolean
  updatedAt: string | null
}

/**
 * Synchronizes an entity into the content_nodes graph index.
 * Called deterministically from mutation paths and backfill runners.
 */
export async function syncContentNode(type: NodeType, idOrSlug: string | number): Promise<ContentNodeEntity | null> {
  try {
    let nodeData: Partial<ContentNodeEntity> | null = null

    switch (type) {
      case 'article': {
        const a = typeof idOrSlug === 'number'
          ? await prisma.orm.public.Article.where({ id: idOrSlug }).first()
          : await prisma.orm.public.Article.where({ slug: String(idOrSlug) }).first()

        if (a) {
          nodeData = {
            type: 'article',
            refId: String(a.id),
            url: `/artikel/${a.slug}`,
            title: a.title,
            summary: a.excerpt || null,
            primaryKeyword: (a as unknown as { primaryKeyword?: string }).primaryKeyword || a.focusKeyphrase || null,
            location: (a as unknown as { targetCity?: string; targetLocation?: string }).targetCity || (a as unknown as { targetCity?: string; targetLocation?: string }).targetLocation || null,
            image: a.coverUrl || a.featuredImage || null,
            status: a.status === 'published' || a.status === 'archived' ? a.status : 'draft',
            indexable: a.status === 'published',
          }
        }
        break
      }

      case 'service': {
        const s = typeof idOrSlug === 'number'
          ? await prisma.orm.public.Service.where({ id: idOrSlug }).first()
          : await prisma.orm.public.Service.where({ slug: String(idOrSlug) }).first()

        if (s) {
          nodeData = {
            type: 'service',
            refId: String(s.id),
            url: `/layanan/${s.slug}`,
            title: s.name,
            summary: s.shortDescription || s.description || null,
            primaryKeyword: s.name,
            location: null,
            image: s.heroImage || null,
            status: (s as unknown as { status?: 'draft' | 'published' | 'archived' }).status || 'published',
            indexable: true,
          }
        }
        break
      }

      case 'solution': {
        const sol = typeof idOrSlug === 'number'
          ? await prisma.orm.public.Solution.where({ id: idOrSlug }).first()
          : await prisma.orm.public.Solution.where({ slug: String(idOrSlug) }).first()

        if (sol) {
          nodeData = {
            type: 'solution',
            refId: String(sol.id),
            url: `/solusi/${sol.slug}`,
            title: sol.title,
            summary: sol.shortDescription || sol.description || null,
            primaryKeyword: sol.title,
            location: null,
            image: sol.heroImage || null,
            status: sol.status === 'published' || sol.status === 'archived' ? sol.status : 'draft',
            indexable: sol.status === 'published',
          }
        }
        break
      }

      case 'portfolio': {
        const p = typeof idOrSlug === 'number'
          ? await prisma.orm.public.Portfolio.where({ id: idOrSlug }).first()
          : await prisma.orm.public.Portfolio.where({ slug: String(idOrSlug) }).first()

        if (p) {
          nodeData = {
            type: 'portfolio',
            refId: String(p.id),
            url: `/portofolio/${p.slug}`,
            title: p.title,
            summary: p.summary || null,
            primaryKeyword: p.title,
            location: null,
            image: p.heroImage || null,
            status: p.status === 'published' || p.status === 'archived' ? p.status : 'draft',
            indexable: p.status === 'published',
          }
        }
        break
      }

      case 'landing':
      case 'page': {
        const pg = typeof idOrSlug === 'number'
          ? await prisma.orm.public.Page.where({ id: idOrSlug }).first()
          : await prisma.orm.public.Page.where({ slug: String(idOrSlug) }).first()

        if (pg) {
          const isLanding = pg.kind === 'landing' || pg.slug.startsWith('jasa-animasi-')
          nodeData = {
            type: isLanding ? 'landing' : 'page',
            refId: String(pg.id),
            url: `/${pg.slug}`,
            title: pg.title,
            summary: pg.excerpt || null,
            primaryKeyword: pg.focusKeyphrase || pg.title,
            location: (pg as unknown as { location?: string }).location || null,
            image: null,
            status: pg.status === 'published' || pg.status === 'archived' ? pg.status : 'draft',
            indexable: pg.status === 'published' && (!pg.robots || !pg.robots.includes('noindex')),
          }
        }
        break
      }
    }

    if (!nodeData) {
      return null
    }

    // Upsert into content_nodes
    const existing = await prisma.orm.public.ContentNode.where({
      type: nodeData.type!,
      refId: nodeData.refId!,
    }).first()

    if (existing) {
      await prisma.orm.public.ContentNode.where({ id: existing.id }).update({
        ...nodeData,
        updatedAt: nodeData.updatedAt || undefined,
      })

      return {
        ...existing,
        ...nodeData,
        updatedAt: nodeData.updatedAt || undefined,
      } as ContentNodeEntity
    } else {
      const inserted = await prisma.orm.public.ContentNode.create({
        type: nodeData.type!,
        refId: nodeData.refId!,
        url: nodeData.url!,
        title: nodeData.title!,
        summary: nodeData.summary,
        primaryKeyword: nodeData.primaryKeyword,
        location: nodeData.location,
        clusterId: nodeData.clusterId || null,
        image: nodeData.image,
        status: nodeData.status || 'published',
        indexable: nodeData.indexable ?? true,
      })

      return inserted as ContentNodeEntity
    }
  } catch (err) {
    console.warn(`[ContentGraph] Error syncing node ${type}:${idOrSlug}:`, err)
    return null
  }
}

export async function getNodeById(id: number): Promise<ContentNodeEntity | null> {
  const row = await prisma.orm.public.ContentNode.where({ id }).first()
  return (row as ContentNodeEntity) || null
}

export async function getNodeByUrl(url: string): Promise<ContentNodeEntity | null> {
  const clean = url.startsWith('/') ? url : `/${url}`
  const row = await prisma.orm.public.ContentNode.where({ url: clean }).first()
  return (row as ContentNodeEntity) || null
}
