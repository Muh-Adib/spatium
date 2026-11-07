/**
 * Default block presets for entity pages, and how a stored block list becomes
 * the list that is rendered.
 *
 * Every section of a service-category, service and portfolio page is a block.
 * A new entity starts with its preset (Studio and MCP store it on create); an
 * entity without stored blocks renders its preset, so rows saved before
 * data-bound blocks existed render exactly as the former fixed templates.
 *
 * Server-safe: no React.
 */
import { createBlock } from '@/lib/blocks/catalog'
import type { EntityTarget } from '@/lib/blocks/define'
import type { Block, BlockType } from '@/lib/blocks/schema'
import { portfolioSlugsFromLinks, splitLegacyCategoryBlocks } from '@/lib/content/entity-model'
import { DATA_BOUND_TYPES } from './registry'

export type { EntityTarget } from '@/lib/blocks/define'

/** A stored block (validated or not): a `type` plus its fields. */
export type StoredBlock = { type: string; id?: unknown } & Record<string, unknown>

/** Block types of each preset, in page order. */
export const PRESET_TYPES = {
  'service-category': [
    'category-hero',
    'category-intro',
    'category-capabilities',
    'category-deliverables',
    'category-faq',
    'category-related-work',
    'category-next',
    'entity-cta',
  ],
  service: ['service-hero', 'service-description', 'service-deliverables', 'service-related-work', 'service-siblings', 'entity-cta'],
  portfolio: ['portfolio-hero', 'portfolio-scene', 'portfolio-brief', 'portfolio-related', 'entity-cta'],
} as const satisfies Record<EntityTarget, readonly BlockType[]>

/** Where legacy category extras were rendered: right after this block. */
const CATEGORY_EXTRAS_AFTER = 'category-deliverables'
/** Legacy service blocks render before this block. */
const SERVICE_EXTRAS_BEFORE = 'entity-cta'

/**
 * A preset as a fresh block list (catalogue defaults). `ids: 'stable'` gives
 * `preset-<type>` ids (render-time presets: stable React keys and heading ids);
 * `'fresh'` gives new unique ids (stored on create).
 */
export function buildPreset(target: EntityTarget, options: { ids?: 'stable' | 'fresh' } = {}): Block[] {
  return PRESET_TYPES[target].map((type) => {
    const block = createBlock(type)
    if (!block) throw new Error(`Preset block "${type}" is not in the catalogue.`)
    return options.ids === 'stable' ? { ...block, id: `preset-${type}` } : block
  })
}

/** The presets with stable ids (read-only reference; use `buildPreset` to store one). */
export const BLOCK_PRESETS: Readonly<Record<EntityTarget, readonly Block[]>> = {
  'service-category': buildPreset('service-category', { ids: 'stable' }),
  service: buildPreset('service', { ids: 'stable' }),
  portfolio: buildPreset('portfolio', { ids: 'stable' }),
}

/** True when the list holds at least one data-bound block ("explicit" mode). */
export function hasDataBoundBlocks(blocks: readonly unknown[]): boolean {
  return blocks.some(
    (b) => b !== null && typeof b === 'object' && typeof (b as StoredBlock).type === 'string' && DATA_BOUND_TYPES.has((b as StoredBlock).type),
  )
}

/**
 * The blocks to render for an entity, from what is stored:
 *
 * - **Explicit** (the list holds a data-bound block): rendered as stored.
 * - **Empty**: the preset.
 * - **Legacy** (only generic blocks), per target:
 *   - `service-category`: the preset, with the legacy content carriers folded
 *     in — `paragraph` blocks → `category-intro.paragraphs`, `faq-accordion`
 *     → `category-faq.items`, `internal-links` to `/portfolio/<slug>` →
 *     `category-related-work.portfolioSlugs` — and every other block inserted
 *     after `category-deliverables`, where the former template rendered extras.
 *   - `service`: the preset with the stored blocks before the closing CTA.
 *   - `portfolio`: the stored blocks as-is (they used to replace the template).
 *
 * The result is lossless: storing it switches the entity to explicit mode
 * without a visible change (the Studio editor loads this list).
 */
export function resolveEntityBlocks(target: EntityTarget, stored: readonly StoredBlock[]): StoredBlock[] {
  if (stored.length === 0) return [...BLOCK_PRESETS[target]]
  if (hasDataBoundBlocks(stored)) return [...stored]

  const preset: StoredBlock[] = BLOCK_PRESETS[target].map((b) => ({ ...b }))
  switch (target) {
    case 'portfolio':
      return [...stored]
    case 'service': {
      const at = preset.findIndex((b) => b.type === SERVICE_EXTRAS_BEFORE)
      preset.splice(at < 0 ? preset.length : at, 0, ...stored)
      return preset
    }
    case 'service-category': {
      const legacy = splitLegacyCategoryBlocks(stored)
      const filled = preset.map((b) => {
        if (b.type === 'category-intro' && legacy.intro.length > 0) return { ...b, paragraphs: legacy.intro }
        if (b.type === 'category-faq' && legacy.faqs.length > 0) {
          return { ...b, items: legacy.faqs.map((f) => ({ question: f.q, answer: f.a })) }
        }
        if (b.type === 'category-related-work') {
          const slugs = [...new Set(portfolioSlugsFromLinks(legacy.related))]
          return slugs.length > 0 ? { ...b, portfolioSlugs: slugs } : b
        }
        return b
      })
      const at = filled.findIndex((b) => b.type === CATEGORY_EXTRAS_AFTER)
      filled.splice(at < 0 ? filled.length : at + 1, 0, ...legacy.extraBlocks)
      return filled
    }
  }
}

/** FAQ entries of the rendered category blocks (for FAQPage JSON-LD). */
export function categoryFaqs(blocks: readonly StoredBlock[]): { q: string; a: string }[] {
  return blocks.flatMap((b) => {
    if (b.type !== 'category-faq' || !Array.isArray(b.items)) return []
    return b.items.flatMap((item: unknown) => {
      if (!item || typeof item !== 'object') return []
      const { question, answer } = item as { question?: unknown; answer?: unknown }
      return typeof question === 'string' && typeof answer === 'string' ? [{ q: question, a: answer }] : []
    })
  })
}
