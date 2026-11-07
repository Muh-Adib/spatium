import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { resolveEntityBlocks, type StoredBlock } from '@/blocks/presets'
import { getArticleBySlug, getArticles } from '@/lib/db/articles'
import { getPublicContact } from './contact'
import type { Article as CmsArticle } from './types'
import {
  categoryEntity,
  categoryImageAlt,
  portfolioEntity,
  serviceEntity,
  toProject,
  toServiceDetail,
  toUseCase,
  type ServiceRow,
} from './entity-model'
import {
  type EntityContext,
  type JournalArticle,
  type Project,
  type Service,
  type ServiceNavItem,
  type SocialLink,
  type UseCaseMenuItem,
} from './spatium-types'

// -----------------------------------------------------------------------------
// SPATIUM public content access layer — PostgreSQL is the single source of truth
//
// Column conventions (seeded by scripts/seed.ts, editable in Studio Admin):
//
// portfolios (one row per captured scene)
//   category      sector label as written in the source doc, e.g.
//                 "Food & Beverage · Interior"; the filter id is derived from it.
//   summary       one-line tagline · challenge = brief
//   approach      capture steps, one per line · result = deliverables, one per line
//   live_url      embeddable SuperSplat viewer URL (https://superspl.at/s?id=<id>)
//   hero_image    poster still — only when a verified still of the venue exists
//   year/client   left NULL unless recorded (no invented data)
//   metrics       JSON [{ label, value, detail? }] keyed by `label`:
//                   sceneUrl   public scene page (https://superspl.at/scene/<id>)
//                   location   city / region
//                   scenePair  value = paired scene slug, detail = button label
//                   pointCount / accuracy  only when measured
//
// service_categories (one row per core use case)
//   title / tag (tagline) / short_description (summary) / hero_image
//   theme_preset  ServiceVisual kind used for the illustration
//   key_outcomes  JSON [{ label, value }] keyed by `label`:
//                   deliverable | tool | imageAlt
//   blocks        page blocks (data-bound sections + generic blocks). Rows
//                 saved before data-bound blocks hold legacy carriers
//                 (paragraph → intro, faq-accordion → FAQ, internal-links →
//                 related scenes); `resolveEntityBlocks` folds them into the
//                 preset (src/blocks/presets.ts).
// services (derivative capabilities) — linked through category_id; listed on
//   their parent use case and rendered at /services/<category>/<slug>.
//
// Every entity page renders resolveEntityBlocks(<target>, stored blocks) with
// the entity context (src/lib/content/entity-model.ts) — see docs/BLOCKS.md.
// -----------------------------------------------------------------------------

const hasDb = () => {
  if (process.env.DATABASE_URL) return true
  console.error('[content] DATABASE_URL is not set — serving empty content.')
  return false
}

/* -------------------------------- Portfolio ------------------------------- */

type PublishedProjects = { projects: Project[]; byId: Map<number, Project> }

async function loadPublishedProjects(): Promise<PublishedProjects> {
  const rows = await prisma.orm.public.Portfolio.where({ status: 'published' })
    .orderBy((p) => p.id.asc())
    .all()
  const projects: Project[] = []
  const byId = new Map<number, Project>()
  rows.forEach((row, i) => {
    const project = toProject(row, i)
    projects.push(project)
    byId.set(row.id, project)
  })
  return { projects, byId }
}

/** Published scenes in catalogue order. Returns [] (logged) on DB failure. */
export async function getProjects(): Promise<Project[]> {
  if (!hasDb()) return []
  try {
    return (await loadPublishedProjects()).projects
  } catch (err) {
    console.error('[content] getProjects failed:', err)
    return []
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const all = await getProjects()
  return all.find((p) => p.slug === slug) ?? null
}

/* -------------------------------- Services -------------------------------- */

async function loadPublishedUseCases(): Promise<{ useCases: Service[]; services: ServiceRow[] }> {
  const [categories, services] = await Promise.all([
    prisma.orm.public.ServiceCategory.where({ status: 'published' })
      .orderBy((c) => c.order.asc())
      .all(),
    prisma.orm.public.Service.where({ status: 'published' })
      .orderBy((s) => s.order.asc())
      .all(),
  ])
  const useCases = categories.map((cat, i) =>
    toUseCase(
      cat,
      services.filter((s) => s.categoryId === cat.id),
      i,
    ),
  )
  return { useCases, services: services.filter((s) => categories.some((c) => c.id === s.categoryId)) }
}

/** Published core use cases with their published capabilities. [] on failure. */
export async function getUseCases(): Promise<Service[]> {
  if (!hasDb()) return []
  try {
    return (await loadPublishedUseCases()).useCases
  } catch (err) {
    console.error('[content] getUseCases failed:', err)
    return []
  }
}

export async function getUseCaseBySlug(slug: string): Promise<Service | null> {
  const all = await getUseCases()
  return all.find((s) => s.slug === slug) ?? null
}

export async function getUseCaseNav(): Promise<ServiceNavItem[]> {
  const all = await getUseCases()
  return all.map((s) => ({ slug: s.slug, name: s.name }))
}

/**
 * Published use cases flagged `show_in_nav`, for the header mega menu and the
 * footer. [] when none exist or the DB is unavailable (the menu then hides).
 */
export async function getUseCaseMenu(): Promise<UseCaseMenuItem[]> {
  if (!hasDb()) return []
  try {
    const rows = await prisma.orm.public.ServiceCategory.where({ status: 'published' })
      .orderBy((c) => c.order.asc())
      .all()
    return rows
      .filter((row) => row.showInNav === true)
      .map((row) => ({
        slug: row.slug,
        name: row.title,
        tagline: row.tag ?? '',
        image: row.heroImage ?? undefined,
        imageAlt: categoryImageAlt(row),
      }))
  } catch (err) {
    console.error('[content] getUseCaseMenu failed:', err)
    return []
  }
}

/* ------------------------------ Entity pages ------------------------------ */

/** What an entity page renders: the entity context and the resolved blocks. */
export type EntityPage<K extends EntityContext['kind']> = {
  entity: Extract<EntityContext, { kind: K }>
  blocks: StoredBlock[]
}

/** A published use case page. null when missing/unpublished or on DB failure (logged). */
export async function getServiceCategoryPage(slug: string): Promise<EntityPage<'service-category'> | null> {
  if (!hasDb()) return null
  try {
    const [{ useCases }, { projects }] = await Promise.all([loadPublishedUseCases(), loadPublishedProjects()])
    const category = useCases.find((s) => s.slug === slug)
    if (!category) return null
    return {
      entity: categoryEntity(category, projects, useCases),
      blocks: resolveEntityBlocks('service-category', category.blocks),
    }
  } catch (err) {
    console.error('[content] getServiceCategoryPage failed:', err)
    return null
  }
}

/** A published child service page under its published use case. null otherwise. */
export async function getServicePage(categorySlug: string, serviceSlug: string): Promise<EntityPage<'service'> | null> {
  if (!hasDb()) return null
  try {
    const [{ useCases, services }, published] = await Promise.all([loadPublishedUseCases(), loadPublishedProjects()])
    const parent = useCases.find((s) => s.slug === categorySlug)
    if (!parent) return null
    const position = parent.capabilities.findIndex((c) => c.slug === serviceSlug)
    const row = services.find((s) => s.slug === serviceSlug)
    if (!row || position < 0) return null
    const links = await prisma.orm.public.ServicePortfolio.where({ serviceId: row.id })
      .orderBy((l) => l.displayOrder.asc())
      .all()
    const linked = links.flatMap((l) => {
      const project = published.byId.get(l.portfolioId)
      return project ? [project] : []
    })
    const detail = toServiceDetail(row, parent, position)
    return { entity: serviceEntity(detail, parent, linked), blocks: resolveEntityBlocks('service', detail.blocks) }
  } catch (err) {
    console.error('[content] getServicePage failed:', err)
    return null
  }
}

/** A published scene page. null when missing/unpublished or on DB failure. */
export async function getPortfolioPage(slug: string): Promise<EntityPage<'portfolio'> | null> {
  if (!hasDb()) return null
  try {
    const { projects } = await loadPublishedProjects()
    const project = projects.find((p) => p.slug === slug)
    if (!project) return null
    return { entity: portfolioEntity(project, projects), blocks: resolveEntityBlocks('portfolio', project.blocks) }
  } catch (err) {
    console.error('[content] getPortfolioPage failed:', err)
    return null
  }
}

/** Public paths of every published child service under a published use case (sitemap). */
export async function getPublishedServicePaths(): Promise<{ path: string; categorySlug: string; slug: string }[]> {
  const useCases = await getUseCases()
  return useCases.flatMap((u) => u.capabilities.map((c) => ({ path: c.href, categorySlug: u.slug, slug: c.slug })))
}

/* --------------------------------- Socials -------------------------------- */

/**
 * Social profiles set in Studio settings (`site_configs.social_links`); only
 * absolute https URLs are kept, [] when unset. Part of the public contact
 * profile — see getPublicContact().
 */
export async function getSocialLinks(): Promise<SocialLink[]> {
  return (await getPublicContact()).socials
}

/**
 * Public path of a published child service (`/services/<category>/<slug>`),
 * so the former `/services/<service>` URL can redirect. null if unknown.
 */
export async function getServicePathBySlug(serviceSlug: string): Promise<string | null> {
  if (!hasDb()) return null
  try {
    const paths = await getPublishedServicePaths()
    return paths.find((p) => p.slug === serviceSlug)?.path ?? null
  } catch (err) {
    console.error('[content] getServicePathBySlug failed:', err)
    return null
  }
}

/* -------------------------------- Articles -------------------------------- */

function toJournalArticle(a: CmsArticle): JournalArticle {
  const html = a.content ?? ''
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return {
    slug: a.slug,
    title: a.title,
    category: a.category?.name ?? 'Artikel',
    categorySlug: a.category?.slug,
    excerpt: a.excerpt ?? '',
    metaTitle: a.seo?.metaTitle ?? a.title,
    metaDescription: a.seo?.metaDescription ?? a.excerpt ?? '',
    date: a.publishedAt ?? a.createdAt ?? '',
    author: a.author?.name ?? 'Tim SPATIUM',
    readMinutes: a.readingTime ?? Math.max(1, Math.round(words / 200)),
    tags: (a.tags ?? []).map((t) => t.name).filter(Boolean),
    html,
    coverUrl: a.coverUrl,
  }
}

/** Published article by slug; null when missing, unpublished, or on DB failure. */
export async function getJournalArticleBySlug(slug: string): Promise<JournalArticle | null> {
  if (!hasDb()) return null
  try {
    const article = await getArticleBySlug(slug)
    if (!article || article.status !== 'published') return null
    return toJournalArticle(article)
  } catch (err) {
    console.error('[content] getJournalArticleBySlug failed:', err)
    return null
  }
}

/** Latest published articles. [] on failure. */
export async function getJournalArticles(limit = 100): Promise<JournalArticle[]> {
  if (!hasDb()) return []
  try {
    const result = await getArticles({ pageSize: limit, status: 'published' })
    return result.data.map(toJournalArticle)
  } catch (err) {
    console.error('[content] getJournalArticles failed:', err)
    return []
  }
}
