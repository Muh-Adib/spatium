import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { pickCategoryRow, pickPortfolioRow, pickServiceRow, toProject, toUseCase } from './entity-model'
import type { PreviewPayload } from './entity-preview-model'
import type { Project } from './spatium-types'

/**
 * Loads a Studio preview payload: the entity row in ANY status (by numeric id
 * or slug) plus the published context the public page would show. Callers
 * must check authorization first (`/admin/preview` does). null when missing.
 */
export async function loadPreviewPayload(kind: PreviewPayload['kind'], idOrSlug: string): Promise<PreviewPayload | null> {
  const byId = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : null
  const published = await publishedProjects()

  switch (kind) {
    case 'service-category': {
      const row = byId
        ? await prisma.orm.public.ServiceCategory.where({ id: byId }).first()
        : await prisma.orm.public.ServiceCategory.where({ slug: idOrSlug }).first()
      if (!row) return null
      const [categories, services] = await Promise.all([
        prisma.orm.public.ServiceCategory.where({ status: 'published' }).orderBy((c) => c.order.asc()).all(),
        prisma.orm.public.Service.where({ status: 'published' }).orderBy((s) => s.order.asc()).all(),
      ])
      const useCases = categories.map((c, i) => toUseCase(c, services.filter((s) => s.categoryId === c.id), i))
      const position = Math.max(0, categories.findIndex((c) => c.id === row.id))
      return {
        kind,
        row: pickCategoryRow(row),
        children: services.filter((s) => s.categoryId === row.id).map(pickServiceRow),
        useCases,
        projects: published.list,
        position,
      }
    }
    case 'service': {
      const row = byId
        ? await prisma.orm.public.Service.where({ id: byId }).first()
        : await prisma.orm.public.Service.where({ slug: idOrSlug }).first()
      if (!row) return null
      const parentRow = row.categoryId !== null ? await prisma.orm.public.ServiceCategory.where({ id: row.categoryId }).first() : null
      const siblings =
        row.categoryId !== null
          ? await prisma.orm.public.Service.where({ categoryId: row.categoryId, status: 'published' }).orderBy((s) => s.order.asc()).all()
          : []
      const links = await prisma.orm.public.ServicePortfolio.where({ serviceId: row.id }).orderBy((l) => l.displayOrder.asc()).all()
      return {
        kind,
        row: pickServiceRow(row),
        parentRow: parentRow ? pickCategoryRow(parentRow) : null,
        siblings: siblings.filter((s) => s.id !== row.id).map(pickServiceRow),
        linkedProjects: links.flatMap((l) => {
          const project = published.byId.get(l.portfolioId)
          return project ? [project] : []
        }),
      }
    }
    case 'portfolio': {
      const row = byId
        ? await prisma.orm.public.Portfolio.where({ id: byId }).first()
        : await prisma.orm.public.Portfolio.where({ slug: idOrSlug }).first()
      if (!row) return null
      const index = published.ids.indexOf(row.id)
      return { kind, row: pickPortfolioRow(row), published: published.list, index: index >= 0 ? index : published.list.length }
    }
  }
}

async function publishedProjects(): Promise<{ list: Project[]; ids: number[]; byId: Map<number, Project> }> {
  const rows = await prisma.orm.public.Portfolio.where({ status: 'published' }).orderBy((p) => p.id.asc()).all()
  const list = rows.map((r, i) => toProject(r, i))
  return { list, ids: rows.map((r) => r.id), byId: new Map(rows.map((r, i) => [r.id, list[i]])) }
}
