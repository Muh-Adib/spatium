// -----------------------------------------------------------------------------
// Entity view models — pure transforms from database rows to what the public
// entity pages (service category, service, portfolio) render.
//
// Client- and server-safe (no Prisma, no server-only): the public routes build
// the entity from published rows (`./spatium.ts`), and the Studio draft preview
// rebuilds it in the browser from the stored row patched with unsaved editor
// fields, so preview and public page go through the same code.
// -----------------------------------------------------------------------------
import { z } from 'zod'
import {
  isServiceVisual,
  mapProjectCategory,
  superSplatIdFromUrl,
  superSplatSceneUrl,
  type Capability,
  type EntityContext,
  type Project,
  type SduiBlock,
  type Service,
  type ServiceDetail,
} from './spatium-types'

/* ------------------------------- JSON columns ------------------------------ */

const labelledList = z.array(
  z.object({ label: z.string(), value: z.string(), detail: z.string().optional().nullable() }),
)
type LabelledList = z.infer<typeof labelledList>
const anyBlockList = z.array(z.object({ type: z.string() }).catchall(z.unknown()))

export function parseJsonColumn<T>(raw: string | null | undefined, schema: z.ZodType<T>, ctx: string): T | null {
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

/** Stored block list of a row (`[]` when empty or malformed, logged). */
export function storedBlocks(raw: string | null | undefined, ctx: string): SduiBlock[] {
  return parseJsonColumn(raw, anyBlockList, ctx) ?? []
}

const pick = (list: LabelledList | null, label: string) => list?.find((m) => m.label === label)
const pickAll = (list: LabelledList | null, label: string) =>
  (list ?? []).filter((m) => m.label === label).map((m) => m.value)
const lines = (text: string | null | undefined) =>
  (text ?? '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

/** Cover alt text stored in `seoData.coverAlt` (the field the publication gate checks). */
export function coverAltOf(seoData: string | null | undefined): string | undefined {
  if (!seoData) return undefined
  try {
    const parsed: unknown = JSON.parse(seoData)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'coverAlt' in parsed) {
      const alt = (parsed as { coverAlt?: unknown }).coverAlt
      return typeof alt === 'string' && alt.trim() ? alt.trim() : undefined
    }
  } catch (err) {
    console.warn('[content] seoData is malformed:', err)
  }
  return undefined
}

/** A list column stored as `["a", "b"]` or `[{ label|title|name|value }]`, as strings. */
function stringList(raw: string | null | undefined, ctx: string): string[] {
  const list = parseJsonColumn(raw, z.array(z.unknown()), ctx) ?? []
  return list.flatMap((item) => {
    if (typeof item === 'string') return item.trim() ? [item.trim()] : []
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>
      const text = [rec.label, rec.title, rec.name, rec.value].find((v): v is string => typeof v === 'string' && v.trim() !== '')
      return text ? [text.trim()] : []
    }
    return []
  })
}

/* --------------------------------- Rows ----------------------------------- */

export type PortfolioRow = {
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
  status: string | null
}

export type CategoryRow = {
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
  seoData: string | null
  status: string
}

export type ServiceRow = {
  id: number
  slug: string
  name: string
  categoryId: number | null
  indexNumber: string | null
  shortDescription: string | null
  longDescription: string | null
  description: string | null
  heroImage: string | null
  deliverables: string | null
  technologies: string | null
  blocks: string | null
  order: number | null
  metaTitle: string | null
  metaDescription: string | null
  seoData: string | null
  status: string
}

/** Keeps only the columns the view models read (rows are sent to the browser for the draft preview). */
export function pickPortfolioRow(row: PortfolioRow): PortfolioRow {
  const { id, slug, title, client, year, category, summary, challenge, approach, result, heroImage, liveUrl, metrics, technologies, blocks, status } = row
  return { id, slug, title, client, year, category, summary, challenge, approach, result, heroImage, liveUrl, metrics, technologies, blocks, status }
}

export function pickCategoryRow(row: CategoryRow): CategoryRow {
  const { id, slug, title, tag, shortDescription, heroImage, themePreset, keyOutcomes, blocks, order, metaTitle, metaDescription, seoData, status } = row
  return { id, slug, title, tag, shortDescription, heroImage, themePreset, keyOutcomes, blocks, order, metaTitle, metaDescription, seoData, status }
}

export function pickServiceRow(row: ServiceRow): ServiceRow {
  const {
    id, slug, name, categoryId, indexNumber, shortDescription, longDescription, description, heroImage,
    deliverables, technologies, blocks, order, metaTitle, metaDescription, seoData, status,
  } = row
  return {
    id, slug, name, categoryId, indexNumber, shortDescription, longDescription, description, heroImage,
    deliverables, technologies, blocks, order, metaTitle, metaDescription, seoData, status,
  }
}

/* -------------------------------- Portfolio ------------------------------- */

export function toProject(row: PortfolioRow, index: number): Project {
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
    blocks: storedBlocks(row.blocks, `portfolios.blocks#${row.slug}`),
  }
}

/* ------------------------------ Service category --------------------------- */

const paragraphCarrier = z.object({ type: z.literal('paragraph'), text: z.string() })
const faqCarrier = z.object({
  type: z.literal('faq-accordion'),
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
})
const linksCarrier = z.object({
  type: z.literal('internal-links'),
  links: z.array(z.object({ title: z.string(), url: z.string() })),
})

/**
 * Legacy category content carriers. Before data-bound blocks, a category's
 * `blocks` column held its intro (`paragraph`), FAQ (`faq-accordion`) and
 * related links (`internal-links`), which the fixed template consumed; other
 * blocks were "extras" rendered after the deliverables section.
 */
export function splitLegacyCategoryBlocks(blocks: readonly SduiBlock[]) {
  const intro: string[] = []
  const faqs: Service['faqs'] = []
  const related: Service['related'] = []
  const extraBlocks: SduiBlock[] = []
  for (const block of blocks) {
    const p = paragraphCarrier.safeParse(block)
    if (p.success) {
      intro.push(p.data.text)
      continue
    }
    const f = faqCarrier.safeParse(block)
    if (f.success) {
      faqs.push(...f.data.items.map((i) => ({ q: i.question, a: i.answer })))
      continue
    }
    const l = linksCarrier.safeParse(block)
    if (l.success) {
      related.push(...l.data.links.map((link) => ({ label: link.title, to: link.url })))
      continue
    }
    extraBlocks.push(block)
  }
  return { intro, faqs, related, extraBlocks }
}

/** Portfolio slugs referenced by `/portfolio/<slug>` links. */
export function portfolioSlugsFromLinks(links: readonly { to: string }[]): string[] {
  return links.map((r) => /^\/portfolio\/([^/?#]+)/.exec(r.to)?.[1]).filter((s): s is string => Boolean(s))
}

export function serviceDetailPath(categorySlug: string, serviceSlug: string): string {
  return `/services/${categorySlug}/${serviceSlug}`
}

function capabilityOf(categorySlug: string, child: Pick<ServiceRow, 'slug' | 'name' | 'shortDescription' | 'description'>): Capability {
  return {
    slug: child.slug,
    title: child.name,
    description: child.shortDescription ?? child.description ?? '',
    href: serviceDetailPath(categorySlug, child.slug),
  }
}

/**
 * Core use case view model. `intro`/`faqs`/`related`/`extraBlocks` are the
 * legacy carriers (see `splitLegacyCategoryBlocks`); data-bound blocks receive
 * them through `resolveEntityBlocks`, not from here.
 */
export function toUseCase(row: CategoryRow, children: readonly ServiceRow[], position: number): Service {
  const outcomes = parseJsonColumn(row.keyOutcomes, labelledList, `service_categories.key_outcomes#${row.slug}`)
  const blocks = storedBlocks(row.blocks, `service_categories.blocks#${row.slug}`)
  const legacy = splitLegacyCategoryBlocks(blocks)
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
    intro: legacy.intro.length > 0 ? legacy.intro : summary ? [summary] : [],
    capabilities: children.map((c) => capabilityOf(row.slug, c)),
    deliverables: pickAll(outcomes, 'deliverable'),
    tools: pickAll(outcomes, 'tool'),
    visual: isServiceVisual(row.themePreset) ? row.themePreset : 'marketing',
    image: row.heroImage ?? undefined,
    imageAlt: coverAltOf(row.seoData) ?? pick(outcomes, 'imageAlt')?.value ?? row.title,
    faqs: legacy.faqs,
    related: legacy.related,
    extraBlocks: legacy.extraBlocks,
    blocks,
  }
}

/** Header-menu alt for a category row (same rule as `toUseCase`). */
export function categoryImageAlt(row: Pick<CategoryRow, 'seoData' | 'keyOutcomes' | 'title' | 'slug'>): string {
  const outcomes = parseJsonColumn(row.keyOutcomes, labelledList, `service_categories.key_outcomes#${row.slug}`)
  return coverAltOf(row.seoData) ?? pick(outcomes, 'imageAlt')?.value ?? row.title
}

/* ------------------------------ Entity contexts ---------------------------- */

export function categoryEntity(category: Service, projects: Project[], useCases: readonly Service[]): EntityContext & { kind: 'service-category' } {
  return { kind: 'service-category', category, projects, others: useCases.filter((s) => s.slug !== category.slug) }
}

export function serviceEntity(service: ServiceDetail, parent: Service, projects: Project[]): EntityContext & { kind: 'service' } {
  return { kind: 'service', service, siblings: parent.capabilities.filter((c) => c.slug !== service.slug), projects }
}

export function portfolioEntity(project: Project, published: readonly Project[]): EntityContext & { kind: 'portfolio' } {
  return { kind: 'portfolio', project, related: published.filter((p) => p.slug !== project.slug) }
}

/* ------------------------------ Child service ------------------------------ */

export function toServiceDetail(row: ServiceRow, parent: Service, position: number): ServiceDetail {
  const summary = row.shortDescription ?? row.description ?? ''
  const body = row.longDescription || row.description || row.shortDescription || ''
  return {
    slug: row.slug,
    index: row.indexNumber?.trim() || String(row.order ?? position + 1).padStart(2, '0'),
    name: row.name,
    summary,
    paragraphs: lines(body),
    deliverables: stringList(row.deliverables, `services.deliverables#${row.slug}`),
    tools: stringList(row.technologies, `services.technologies#${row.slug}`),
    image: row.heroImage ?? undefined,
    imageAlt: coverAltOf(row.seoData) ?? row.name,
    metaTitle: row.metaTitle ?? row.name,
    metaDescription: row.metaDescription ?? summary,
    href: serviceDetailPath(parent.slug, row.slug),
    parent: { slug: parent.slug, name: parent.name, shortName: parent.shortName, index: parent.index, visual: parent.visual },
    blocks: storedBlocks(row.blocks, `services.blocks#${row.slug}`),
  }
}
