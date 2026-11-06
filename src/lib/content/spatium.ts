import 'server-only'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getArticleBySlug, getArticles } from '@/lib/db/articles'
import type { Article as CmsArticle } from './types'
import {
  isServiceVisual,
  type SduiBlock,
  mapProjectCategory,
  superSplatIdFromUrl,
  superSplatSceneUrl,
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
//   blocks        SDUI ontology blocks rendered into the page layout:
//                   paragraph → intro paragraphs, faq-accordion → FAQs,
//                   internal-links → related links
// services (derivative capabilities) — linked through category_id; rendered as
//   the capability grid of their parent use case.
// -----------------------------------------------------------------------------

const hasDb = () => {
  if (process.env.DATABASE_URL) return true
  console.error('[content] DATABASE_URL is not set — serving empty content.')
  return false
}

const labelledList = z.array(
  z.object({ label: z.string(), value: z.string(), detail: z.string().optional().nullable() }),
)
type LabelledList = z.infer<typeof labelledList>
const anyBlockList = z.array(z.object({ type: z.string() }).catchall(z.unknown()))

function parseJsonColumn<T>(raw: string | null | undefined, schema: z.ZodType<T>, ctx: string): T | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.warn(`[content] invalid JSON in ${ctx}:`, err)
    return null
  }
  const result = schema.safeParse(parsed)
  if (!result.success) {
    console.warn(`[content] unexpected JSON shape in ${ctx}:`, result.error.message)
    return null
  }
  return result.data
}

const pick = (list: LabelledList | null, label: string) => list?.find((m) => m.label === label)
const pickAll = (list: LabelledList | null, label: string) =>
  (list ?? []).filter((m) => m.label === label).map((m) => m.value)
const lines = (text: string | null | undefined) =>
  (text ?? '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

/* -------------------------------- Portfolio ------------------------------- */

type PortfolioRow = {
  id: number
  slug: string
  title: string
  client: string | null
  year: number | null
  category: string | null
  summary: string | null
  challenge: string | null
  approach: string | null
  result: string | null
  heroImage: string | null
  liveUrl: string | null
  metrics: string | null
  technologies: string | null
  blocks: string | null
}

function toProject(row: PortfolioRow, index: number): Project {
  const metrics = parseJsonColumn(row.metrics, labelledList, `portfolios.metrics#${row.slug}`)
  const technologies = parseJsonColumn(row.technologies, z.array(z.string()), `portfolios.technologies#${row.slug}`)
  const splatId = superSplatIdFromUrl(row.liveUrl)
  const pair = pick(metrics, 'scenePair')
  const discipline = row.category ?? ''
  return {
    slug: row.slug,
    title: row.title,
    client: row.client ?? undefined,
    category: mapProjectCategory(discipline),
    discipline,
    year: row.year ? String(row.year) : undefined,
    tagline: row.summary ?? '',
    brief: row.challenge ?? row.summary ?? '',
    approach: lines(row.approach),
    delivered: lines(row.result),
    variant: (index % 3) + 1,
    posterUrl: row.heroImage ?? undefined,
    liveUrl: row.liveUrl ?? undefined,
    sceneUrl: pick(metrics, 'sceneUrl')?.value ?? (splatId ? superSplatSceneUrl(splatId) : undefined),
    splatId,
    pointCount: pick(metrics, 'pointCount')?.value,
    accuracy: pick(metrics, 'accuracy')?.value,
    captureMethod: technologies?.[0],
    location: pick(metrics, 'location')?.value,
    scenePairSlug: pair?.value,
    scenePairLabel: pair?.detail ?? undefined,
    blocks: parseJsonColumn(row.blocks, anyBlockList, `portfolios.blocks#${row.slug}`) ?? [],
  }
}

/** Published scenes in catalogue order. Returns [] (logged) on DB failure. */
export async function getProjects(): Promise<Project[]> {
  if (!hasDb()) return []
  try {
    const rows = await prisma.orm.public.Portfolio.where({ status: 'published' })
      .orderBy((p) => p.id.asc())
      .all()
    return rows.map(toProject)
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

const paragraphBlock = z.object({ type: z.literal('paragraph'), text: z.string() })
const faqBlock = z.object({
  type: z.literal('faq-accordion'),
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
})
const linksBlock = z.object({
  type: z.literal('internal-links'),
  links: z.array(z.object({ title: z.string(), url: z.string() })),
})

type CategoryRow = {
  id: number
  slug: string
  title: string
  tag: string | null
  shortDescription: string | null
  heroImage: string | null
  themePreset: string | null
  keyOutcomes: string | null
  blocks: string | null
  order: number | null
  metaTitle: string | null
  metaDescription: string | null
}

type ServiceRow = {
  slug: string
  name: string
  categoryId: number | null
  shortDescription: string | null
  description: string | null
}

function toService(row: CategoryRow, children: ServiceRow[], position: number): Service {
  const outcomes = parseJsonColumn(row.keyOutcomes, labelledList, `service_categories.key_outcomes#${row.slug}`)
  const blocks = parseJsonColumn(row.blocks, anyBlockList, `service_categories.blocks#${row.slug}`) ?? []
  const intro: string[] = []
  const faqs: Service['faqs'] = []
  const related: Service['related'] = []
  const extraBlocks: Service['extraBlocks'] = []
  for (const block of blocks) {
    const p = paragraphBlock.safeParse(block)
    if (p.success) {
      intro.push(p.data.text)
      continue
    }
    const f = faqBlock.safeParse(block)
    if (f.success) {
      faqs.push(...f.data.items.map((i) => ({ q: i.question, a: i.answer })))
      continue
    }
    const l = linksBlock.safeParse(block)
    if (l.success) {
      related.push(...l.data.links.map((link) => ({ label: link.title, to: link.url })))
      continue
    }
    extraBlocks.push(block)
  }
  const summary = row.shortDescription ?? ''
  return {
    slug: row.slug,
    index: String(row.order ?? position + 1).padStart(2, '0'),
    name: row.title,
    shortName: row.title.split(' & ')[0] ?? row.title,
    tagline: row.tag ?? '',
    summary,
    metaTitle: row.metaTitle ?? row.title,
    metaDescription: row.metaDescription ?? summary,
    intro: intro.length > 0 ? intro : summary ? [summary] : [],
    capabilities: children.map((c) => ({
      slug: c.slug,
      title: c.name,
      description: c.shortDescription ?? c.description ?? '',
    })),
    deliverables: pickAll(outcomes, 'deliverable'),
    tools: pickAll(outcomes, 'tool'),
    visual: isServiceVisual(row.themePreset) ? row.themePreset : 'marketing',
    image: row.heroImage ?? undefined,
    imageAlt: pick(outcomes, 'imageAlt')?.value ?? row.title,
    faqs,
    related,
    extraBlocks,
  }
}

/** Published core use cases with their published capabilities. [] on failure. */
export async function getUseCases(): Promise<Service[]> {
  if (!hasDb()) return []
  try {
    const [categories, services] = await Promise.all([
      prisma.orm.public.ServiceCategory.where({ status: 'published' })
        .orderBy((c) => c.order.asc())
        .all(),
      prisma.orm.public.Service.where({ status: 'published' })
        .orderBy((s) => s.order.asc())
        .all(),
    ])
    return categories.map((cat, i) =>
      toService(
        cat,
        services.filter((s) => s.categoryId === cat.id),
        i,
      ),
    )
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
      .map((row) => {
        const outcomes = parseJsonColumn(row.keyOutcomes, labelledList, `service_categories.key_outcomes#${row.slug}`)
        return {
          slug: row.slug,
          name: row.title,
          tagline: row.tag ?? '',
          image: row.heroImage ?? undefined,
          imageAlt: pick(outcomes, 'imageAlt')?.value ?? row.title,
        }
      })
  } catch (err) {
    console.error('[content] getUseCaseMenu failed:', err)
    return []
  }
}

/* --------------------------------- Socials -------------------------------- */

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  x: 'X',
  twitter: 'X',
  vimeo: 'Vimeo',
  behance: 'Behance',
}
const socialLinksColumn = z.record(z.string(), z.string())

/**
 * Social profiles set in Studio settings (`site_configs.social_links`, a JSON
 * object `{ "<network>": "<https url>" }`). Only absolute https URLs are kept;
 * [] when unset so the UI hides the list instead of inventing handles.
 */
export async function getSocialLinks(): Promise<SocialLink[]> {
  if (!hasDb()) return []
  try {
    const row = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
    const links = parseJsonColumn(row?.socialLinks, socialLinksColumn, 'site_configs.social_links') ?? {}
    return Object.entries(links).flatMap(([network, raw]) => {
      const href = raw.trim()
      if (!href) return []
      let url: URL
      try {
        url = new URL(href)
      } catch (err) {
        console.warn(`[content] social link "${network}" is not a URL — skipped.`, err)
        return []
      }
      if (url.protocol !== 'https:') {
        console.warn(`[content] social link "${network}" is not https — skipped.`)
        return []
      }
      const key = network.trim().toLowerCase()
      return [{ label: SOCIAL_LABELS[key] ?? network.trim(), href: url.href }]
    })
  } catch (err) {
    console.error('[content] getSocialLinks failed:', err)
    return []
  }
}

/**
 * Resolves a derivative service slug to its parent use case slug, so
 * `/services/<capability>` can redirect to the use-case page. null if unknown.
 */
export async function getParentUseCaseSlug(serviceSlug: string): Promise<string | null> {
  if (!hasDb()) return null
  try {
    const svc = await prisma.orm.public.Service.where({ slug: serviceSlug, status: 'published' }).first()
    if (!svc || svc.categoryId === null) return null
    const cat = await prisma.orm.public.ServiceCategory.where({ id: svc.categoryId, status: 'published' }).first()
    return cat?.slug ?? null
  } catch (err) {
    console.error('[content] getParentUseCaseSlug failed:', err)
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
