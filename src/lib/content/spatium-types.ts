// -----------------------------------------------------------------------------
// SPATIUM — public content view models
//
// These are the shapes the public UI renders. They are produced from PostgreSQL
// rows by `src/lib/content/spatium.ts` (the single source of truth is the DB;
// see that file for the column conventions). Pure types and taxonomy labels
// only — no business content lives here.
// -----------------------------------------------------------------------------

/* ------------------------------- Portfolio ------------------------------- */

export type ProjectCategory =
  | 'filmmaking'
  | 'marketing'
  | 'entertainment'
  | 'memory'
  | 'hospitality'
  | 'healthcare'
  | 'industrial'
  | 'fnb'
  | 'agriculture'
  | 'property'

export type ProjectCategoryValue = ProjectCategory | 'unknown'

export type Project = {
  slug: string
  title: string
  /** Venue / owner name as written in the source document. */
  client?: string
  /** Filter id derived from `discipline`. */
  category: ProjectCategoryValue
  /** Sector label, e.g. "Food & Beverage · Interior" (DB `portfolios.category`). */
  discipline: string
  /** Capture year — only when recorded in the DB. */
  year?: string
  tagline: string
  brief: string
  approach: string[]
  delivered: string[]
  /** Decorative art variant used when no poster exists. */
  variant: number
  /** Only set when a verified still of this exact venue exists. */
  posterUrl?: string
  /** Embeddable SuperSplat viewer URL (`/s?id=`), used inside iframes. */
  liveUrl?: string
  /** Public SuperSplat scene page (`/scene/<id>`), used for "open scene" links. */
  sceneUrl?: string
  splatId?: string
  /** Only when measured and recorded in the DB. */
  pointCount?: string
  /** Only when measured and recorded in the DB. */
  accuracy?: string
  captureMethod?: string
  location?: string
  scenePairSlug?: string
  scenePairLabel?: string
  /** Admin-composed SDUI blocks; when present they replace the default layout. */
  blocks: SduiBlock[]
}

/** A Studio Admin SDUI block as stored in a `blocks` JSON column. */
export type SduiBlock = { type: string } & Record<string, unknown>

/** Sector filter taxonomy (UI labels, not business data). */
export const PROJECT_CATEGORIES: { id: 'all' | ProjectCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'industrial', label: 'Manufacturing' },
  { id: 'fnb', label: 'Food & Beverage' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'property', label: 'Property' },
  { id: 'filmmaking', label: 'Filmmaking & VFX' },
  { id: 'marketing', label: 'Marketing & Branding' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'memory', label: 'Memory & Documentary' },
]

export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  marketing: 'Marketing & Branding',
  hospitality: 'Hospitality',
  healthcare: 'Healthcare',
  industrial: 'Manufacturing',
  fnb: 'Food & Beverage',
  agriculture: 'Agriculture',
  property: 'Property',
  memory: 'Memory & Documentary',
  filmmaking: 'Filmmaking & VFX',
  entertainment: 'Entertainment & Installation',
}

export function isProjectCategory(value: string): value is ProjectCategory {
  return Object.prototype.hasOwnProperty.call(PROJECT_CATEGORY_LABEL, value)
}

/** Maps a free-text sector label (as stored in the DB) to a filter id. */
export function mapProjectCategory(raw: unknown): ProjectCategoryValue {
  if (typeof raw !== 'string') return 'unknown'
  const n = raw.trim().toLowerCase()
  if (isProjectCategory(n)) return n
  const has = (...keys: string[]) => keys.some((k) => n.includes(k))
  if (has('filmmak', 'vfx', 'cinema', 'previz')) return 'filmmaking'
  if (has('food', 'resto', 'cafe', 'café', 'f&b', 'fnb')) return 'fnb'
  if (has('market', 'brand', 'retail')) return 'marketing'
  if (has('entertain', 'install', 'exhibit')) return 'entertainment'
  if (has('memor', 'docu', 'heritage')) return 'memory'
  if (has('hospit', 'hotel', 'resort', 'wed')) return 'hospitality'
  if (has('health', 'medic', 'klinis', 'operasi')) return 'healthcare'
  if (has('indust', 'manufa', 'manufak', 'plant')) return 'industrial'
  if (has('agri', 'horti', 'farm', 'tani', 'greenhouse')) return 'agriculture'
  if (has('prop', 'estate', 'arsitek', 'apart', 'residen')) return 'property'
  return 'unknown'
}

/** A sector with at least one published scene, derived from `portfolios.category`. */
export type ProjectSector = { name: string; category: ProjectCategoryValue; sceneCount: number }

/**
 * Sectors actually covered by published scenes — the label before " · " in
 * `discipline` — in first-seen order. Never lists a sector without a scene.
 */
export function projectSectors(projects: readonly Project[]): ProjectSector[] {
  const sectors = new Map<string, ProjectSector>()
  for (const p of projects) {
    const name = p.discipline.split(' · ')[0]?.trim()
    if (!name) continue
    const existing = sectors.get(name)
    if (existing) existing.sceneCount += 1
    else sectors.set(name, { name, category: mapProjectCategory(name), sceneCount: 1 })
  }
  return [...sectors.values()]
}

export function superSplatSceneUrl(id: string): string {
  return `https://superspl.at/scene/${id}`
}

/** Extracts the SuperSplat scene id from an embed (`/s?id=`) or scene URL. */
export function superSplatIdFromUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  const embed = /superspl\.at\/s\?id=([a-z0-9]+)/i.exec(url)
  if (embed) return embed[1]
  const scene = /superspl\.at\/scene\/([a-z0-9]+)/i.exec(url)
  return scene ? scene[1] : undefined
}

/* -------------------------------- Services ------------------------------- */

export type ServiceVisual = 'filmmaking' | 'marketing' | 'entertainment' | 'memory' | '2d' | '3d' | 'motion' | 'assets'

export const SERVICE_VISUALS: readonly ServiceVisual[] = [
  'filmmaking',
  'marketing',
  'entertainment',
  'memory',
  '2d',
  '3d',
  'motion',
  'assets',
]

export function isServiceVisual(value: unknown): value is ServiceVisual {
  return typeof value === 'string' && (SERVICE_VISUALS as readonly string[]).includes(value)
}

export type Capability = { slug: string; title: string; description: string }

/** A core use case (DB `service_categories` row + its child `services`). */
export type Service = {
  slug: string
  index: string
  name: string
  shortName: string
  tagline: string
  summary: string
  metaTitle: string
  metaDescription: string
  intro: string[]
  capabilities: Capability[]
  deliverables: string[]
  tools: string[]
  visual: ServiceVisual
  image?: string
  imageAlt: string
  faqs: { q: string; a: string }[]
  related: { label: string; to: string }[]
  /** Blocks other than paragraph / faq-accordion / internal-links, rendered as-is. */
  extraBlocks: SduiBlock[]
}

/** Lightweight shape for nav lists and selects. */
export type ServiceNavItem = { slug: string; name: string }

/** Header mega-menu / footer entry: a published use case with `show_in_nav`. */
export type UseCaseMenuItem = ServiceNavItem & { tagline: string; image?: string; imageAlt: string }

/** Public social profile from Studio settings (`site_configs.social_links`). */
export type SocialLink = { label: string; href: string }

/* -------------------------------- Articles ------------------------------- */

export type JournalArticle = {
  slug: string
  title: string
  category: string
  categorySlug?: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  /** ISO date string (publication). */
  date: string
  author: string
  readMinutes: number
  tags: string[]
  /** Sanitised at render time. */
  html: string
  coverUrl?: string
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
}
