/**
 * Block registry — the ONE list of block types.
 *
 * Each entry is a definition from `src/blocks/<type>/definition.ts` (schema +
 * catalogue metadata). Everything else is derived from this array:
 * the validator union (`@/lib/blocks/schema`), the catalogue, palette,
 * manifest and MCP tools (`@/lib/blocks/catalog`), the editor's legacy
 * aliases, and the page-hero rule. Renderers are mapped in `./renderers.tsx`,
 * whose type forces one renderer per type registered here.
 *
 * Order matters: catalogue entries appear in the palette, `/api/blocks/manifest`
 * and MCP in this order. Legacy types (no `catalog`) keep validating and
 * rendering stored content but are not offered for new content.
 *
 * Server-safe: no React.
 */
import { z } from 'zod'
import { schemaTypes, type BlockCatalogEntry, type BlockDefinition, type BlockMemberSchema } from '@/lib/blocks/define'
import { heroCinemaBlock } from './hero-cinema/definition'
import { splatViewerBlock } from './splat-viewer/definition'
import { editorialHeadingBlock } from './heading/definition'
import { editorialParagraphBlock } from './paragraph/definition'
import { textEditorialBlock } from './text-editorial/definition'
import { processTimelineBlock } from './process-timeline/definition'
import { featureBentoGridBlock } from './feature-bento-grid/definition'
import { mediaShowcaseBlock } from './media-showcase/definition'
import { visualShowcaseGalleryBlock } from './visual-showcase-gallery/definition'
import { portfolioProofGridBlock } from './portfolio-proof-grid/definition'
import { statsTickerBlock } from './stats-ticker/definition'
import { faqAccordionBlock } from './faq-accordion/definition'
import { tableBlock } from './table/definition'
import { internalLinksBlock } from './internal-links/definition'
import { interactiveCtaBlock } from './interactive-cta/definition'
import { studioCtaBlock } from './studio-cta/definition'
import { deliverablesChecklistBlock } from './deliverables-checklist/definition'
import { workflowPhasesBlock } from './workflow-phases/definition'
import { heroCaseStudyBlock, heroPortfolioBlock } from './hero-portfolio/definition'
import { portfolioCaseStudyBlock } from './portfolio-case-study/definition'
import { heroDepartmentBlock } from './hero-department/definition'
import { heroServiceBlock } from './hero-service/definition'
import { techStackChipsBlock } from './tech-stack-chips/definition'
import { executiveQuoteCardBlock } from './executive-quote-card/definition'
import { engineeringPillarsBlock } from './engineering-pillars/definition'
import { comparisonMatrixBlock } from './comparison-matrix/definition'
import { architectureBlueprintBlock } from './architecture-blueprint/definition'
import { clientStatsImpactBlock } from './client-stats-impact/definition'
import { interactiveTechMatrixBlock } from './interactive-tech-matrix/definition'
import { departmentServiceListBlock } from './department-service-list/definition'
import { heroSolutionBlock } from './hero-solution/definition'
import { caseStudyChapterBlock } from './case-study-chapter/definition'
import {
  legacyCtaSectionBlock,
  legacyFaqSectionBlock,
  legacyFeatureGridBlock,
  legacyHeroBlock,
  legacyLiveEmbedBlock,
  legacyProcessBlock,
  legacyRichTextBlock,
  legacyStatisticsBlock,
  legacyTechnologyStackBlock,
  legacyTestimonialsBlock,
  legacyVideoSectionBlock,
} from './legacy-strapi/definition'

export const BLOCK_DEFINITIONS = [
  // Offered in the catalogue (palette order).
  heroCinemaBlock,
  splatViewerBlock,
  editorialHeadingBlock,
  editorialParagraphBlock,
  textEditorialBlock,
  processTimelineBlock,
  featureBentoGridBlock,
  mediaShowcaseBlock,
  visualShowcaseGalleryBlock,
  portfolioProofGridBlock,
  statsTickerBlock,
  faqAccordionBlock,
  tableBlock,
  internalLinksBlock,
  interactiveCtaBlock,
  studioCtaBlock,
  deliverablesChecklistBlock,
  workflowPhasesBlock,
  heroPortfolioBlock,
  portfolioCaseStudyBlock,
  // Legacy: still validated and rendered, not offered for new content.
  heroDepartmentBlock,
  heroServiceBlock,
  techStackChipsBlock,
  executiveQuoteCardBlock,
  engineeringPillarsBlock,
  comparisonMatrixBlock,
  architectureBlueprintBlock,
  clientStatsImpactBlock,
  interactiveTechMatrixBlock,
  departmentServiceListBlock,
  heroCaseStudyBlock,
  heroSolutionBlock,
  caseStudyChapterBlock,
  legacyHeroBlock,
  legacyFeatureGridBlock,
  legacyRichTextBlock,
  legacyStatisticsBlock,
  legacyFaqSectionBlock,
  legacyTestimonialsBlock,
  legacyCtaSectionBlock,
  legacyProcessBlock,
  legacyTechnologyStackBlock,
  legacyVideoSectionBlock,
  legacyLiveEmbedBlock,
] as const satisfies readonly [BlockDefinition, ...BlockDefinition[]]

type Definitions = typeof BLOCK_DEFINITIONS
/** The member schemas as a tuple, so the union (and `Block`) keeps each type's precise shape. */
type SchemasOf<T extends readonly unknown[]> = { -readonly [K in keyof T]: T[K] extends BlockDefinition<infer S> ? S : never }
type MemberSchemas = SchemasOf<Definitions>

// `map` cannot express the tuple mapping above; the element order and values are identical.
const memberSchemas = BLOCK_DEFINITIONS.map((d): BlockMemberSchema => d.schema) as unknown as MemberSchemas

/** Discriminated union of every registered block schema. */
export const blockUnionSchema = z.discriminatedUnion('type', memberSchemas)

/** Every `type` string the validator accepts (catalogue + legacy). */
export type BlockType = z.output<typeof blockUnionSchema>['type']

/** Every registered type, in registry order. */
export const BLOCK_TYPES: readonly BlockType[] = BLOCK_DEFINITIONS.flatMap((d) => schemaTypes(d.schema) as BlockType[])

/** Catalogue entries (metadata + schema), in registry order. */
export const CATALOG_ENTRIES: readonly BlockCatalogEntry[] = BLOCK_DEFINITIONS.flatMap((d: BlockDefinition) =>
  (d.catalog ?? []).map((meta): BlockCatalogEntry => ({ ...meta, schema: d.schema })),
)

/** Types whose block renders the page's own `<h1>` hero. */
export const PAGE_HERO_TYPES: ReadonlySet<string> = new Set(
  BLOCK_DEFINITIONS.flatMap((d: BlockDefinition) => (d.pageHero ? schemaTypes(d.schema) : [])),
)
