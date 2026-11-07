/**
 * Renderer registry: one component per block type registered in `./registry`.
 *
 * The mapped type below makes TypeScript reject a missing or unknown type, so
 * this map cannot drift from the registry. Renderers live next to their
 * definition in `src/blocks/<type>/`. Kept separate from `./registry` so
 * schemas and catalogue metadata stay importable on the server (MCP,
 * publication gate) without pulling React components.
 */
import type React from 'react'
import type { BlockType } from './registry'
import { HeroCinemaBlock } from './hero-cinema/HeroCinemaBlock'
import { SplatViewerBlock } from './splat-viewer/SplatViewerBlock'
import { EditorialHeadingBlock } from './heading/EditorialHeadingBlock'
import { EditorialParagraphBlock } from './paragraph/EditorialParagraphBlock'
import { TextEditorialBlock } from './text-editorial/TextEditorialBlock'
import { ProcessTimelineBlock } from './process-timeline/ProcessTimelineBlock'
import { FeatureBentoGridBlock } from './feature-bento-grid/FeatureBentoGridBlock'
import { MediaShowcaseBlock } from './media-showcase/MediaShowcaseBlock'
import { VisualShowcaseGalleryBlock } from './visual-showcase-gallery/VisualShowcaseGalleryBlock'
import { PortfolioProofGridBlock } from './portfolio-proof-grid/PortfolioProofGridBlock'
import { StatsTickerBlock } from './stats-ticker/StatsTickerBlock'
import { FaqAccordionBlock } from './faq-accordion/FaqAccordionBlock'
import { TableBlock } from './table/TableBlock'
import { InternalLinksBlock } from './internal-links/InternalLinksBlock'
import { InteractiveCtaBlock } from './interactive-cta/InteractiveCtaBlock'
import { StudioCtaBlock } from './studio-cta/StudioCtaBlock'
import { DeliverablesChecklistBlock } from './deliverables-checklist/DeliverablesChecklistBlock'
import { WorkflowPhasesBlock } from './workflow-phases/WorkflowPhasesBlock'
import { HeroPortfolioBlock } from './hero-portfolio/HeroPortfolioBlock'
import { PortfolioCaseStudyBlock } from './portfolio-case-study/PortfolioCaseStudyBlock'
import { HeroDepartmentBlock } from './hero-department/HeroDepartmentBlock'
import { HeroServiceBlock } from './hero-service/HeroServiceBlock'
import { TechStackChipsBlock } from './tech-stack-chips/TechStackChipsBlock'
import { ExecutiveQuoteCardBlock } from './executive-quote-card/ExecutiveQuoteCardBlock'
import { EngineeringPillarsBlock } from './engineering-pillars/EngineeringPillarsBlock'
import { ComparisonMatrixBlock } from './comparison-matrix/ComparisonMatrixBlock'
import { ArchitectureBlueprintBlock } from './architecture-blueprint/ArchitectureBlueprintBlock'
import { ClientStatsImpactBlock } from './client-stats-impact/ClientStatsImpactBlock'
import { InteractiveTechMatrixBlock } from './interactive-tech-matrix/InteractiveTechMatrixBlock'
import { DepartmentServiceListBlock } from './department-service-list/DepartmentServiceListBlock'
import { HeroSolutionBlock } from './hero-solution/HeroSolutionBlock'
import { CaseStudyChapterBlock } from './case-study-chapter/CaseStudyChapterBlock'
import {
  CTABlockComponent,
  FAQBlockComponent,
  FeatureGridBlockComponent,
  HeroBlockComponent,
  LiveEmbedBlockComponent,
  ProcessBlockComponent,
  RichTextBlockComponent,
  StatisticsBlockComponent,
  TechnologyStackComponent,
  TestimonialsBlockComponent,
  VideoSectionBlockComponent,
} from './legacy-strapi/LegacyStrapiBlocks'

/** Records rendered alongside the blocks (e.g. portfolios for a proof grid). */
export interface BlockRenderContext {
  portfolios?: any[]
  subServices?: any[]
  services?: any[]
}

/** Builds the element for one block. Most blocks only receive `block`; a few also read the page context. */
export type RenderBlock = (block: any, context?: BlockRenderContext) => React.ReactNode

/** A renderer that passes only the block (the common case). */
const blockOnly =
  (Component: React.ComponentType<{ block: any }>): RenderBlock =>
  (block) => <Component block={block} />

export const BLOCK_RENDERERS: { readonly [T in BlockType]: RenderBlock } = {
  'hero-cinema': blockOnly(HeroCinemaBlock),
  'splat-viewer': blockOnly(SplatViewerBlock),
  heading2: blockOnly(EditorialHeadingBlock),
  heading3: blockOnly(EditorialHeadingBlock),
  paragraph: blockOnly(EditorialParagraphBlock),
  'text-editorial': blockOnly(TextEditorialBlock),
  'process-timeline': blockOnly(ProcessTimelineBlock),
  'feature-bento-grid': blockOnly(FeatureBentoGridBlock),
  'media-showcase': blockOnly(MediaShowcaseBlock),
  'editorial-image': blockOnly(MediaShowcaseBlock),
  image: blockOnly(MediaShowcaseBlock),
  'visual-showcase-gallery': blockOnly(VisualShowcaseGalleryBlock),
  // Records from the page context win over the ones stored in the block.
  'portfolio-proof-grid': (block, context) => (
    <PortfolioProofGridBlock
      block={{
        ...block,
        portfolios: context?.portfolios && context.portfolios.length > 0 ? context.portfolios : block.portfolios || [],
      }}
    />
  ),
  'stats-ticker': blockOnly(StatsTickerBlock),
  'faq-accordion': blockOnly(FaqAccordionBlock),
  table: blockOnly(TableBlock),
  'internal-links': blockOnly(InternalLinksBlock),
  'interactive-cta': blockOnly(InteractiveCtaBlock),
  'studio-cta': blockOnly(StudioCtaBlock),
  'deliverables-checklist': blockOnly(DeliverablesChecklistBlock),
  'workflow-phases': blockOnly(WorkflowPhasesBlock),
  'hero-portfolio': blockOnly(HeroPortfolioBlock),
  'hero-case-study': blockOnly(HeroPortfolioBlock),
  'portfolio-case-study': blockOnly(PortfolioCaseStudyBlock),
  'hero-department': blockOnly(HeroDepartmentBlock),
  'hero-service': blockOnly(HeroServiceBlock),
  'tech-stack-chips': blockOnly(TechStackChipsBlock),
  'executive-quote-card': blockOnly(ExecutiveQuoteCardBlock),
  'engineering-pillars': blockOnly(EngineeringPillarsBlock),
  'comparison-matrix': blockOnly(ComparisonMatrixBlock),
  'architecture-blueprint': blockOnly(ArchitectureBlueprintBlock),
  'client-stats-impact': blockOnly(ClientStatsImpactBlock),
  'interactive-tech-matrix': blockOnly(InteractiveTechMatrixBlock),
  'department-service-list': (block, context) => (
    <DepartmentServiceListBlock block={block} contextServices={context?.subServices || context?.services} />
  ),
  'hero-solution': blockOnly(HeroSolutionBlock),
  'case-study-chapter': blockOnly(CaseStudyChapterBlock),
  'blocks.hero': blockOnly(HeroBlockComponent),
  'blocks.feature-grid': blockOnly(FeatureGridBlockComponent),
  'blocks.rich-text': blockOnly(RichTextBlockComponent),
  'blocks.statistics': blockOnly(StatisticsBlockComponent),
  'blocks.faq-section': blockOnly(FAQBlockComponent),
  'blocks.testimonials': blockOnly(TestimonialsBlockComponent),
  'blocks.cta-section': blockOnly(CTABlockComponent),
  'blocks.process': blockOnly(ProcessBlockComponent),
  'blocks.technology-stack': blockOnly(TechnologyStackComponent),
  'blocks.video-section': blockOnly(VideoSectionBlockComponent),
  'blocks.live-embed': blockOnly(LiveEmbedBlockComponent),
}

/** The renderer for a stored block's `type`, or undefined for unknown types. */
export function getBlockRenderer(type: unknown): RenderBlock | undefined {
  if (typeof type !== 'string' || !Object.hasOwn(BLOCK_RENDERERS, type)) return undefined
  return (BLOCK_RENDERERS as Readonly<Record<string, RenderBlock>>)[type]
}
