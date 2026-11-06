import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeroCinemaBlock } from '../src/blocks/HeroCinemaBlock'
import { ProcessTimelineBlock } from '../src/blocks/ProcessTimelineBlock'
import { StatsTickerBlock } from '../src/blocks/StatsTickerBlock'
import { InteractiveCtaBlock, TextEditorialBlock } from '../src/blocks/InteractiveCtaBlock'
import { BlockRenderer as ComponentBlockRenderer } from '../src/components/blocks/BlockRenderer'
import * as CatalogBlocks from '../src/components/blocks/CatalogBlocks'
import { parseBlocks, blockSchema } from '../src/lib/blocks/schema'

interface TestCaseResult {
  name: string
  suite: string
  passed: boolean
  error?: string
  outputLength?: number
}

const results: TestCaseResult[] = []

function assertRender(suite: string, name: string, fn: () => React.ReactElement) {
  try {
    const el = fn()
    const html = renderToStaticMarkup(el)
    results.push({ suite, name, passed: true, outputLength: html.length })
    console.log(`  ✓ [${suite}] ${name} (HTML: ${html.length} chars)`)
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err.stack || err.message })
    console.error(`  ✗ [${suite}] ${name} FAILED:`, err.message)
  }
}

function assertCondition(suite: string, name: string, condition: boolean, message?: string) {
  if (condition) {
    results.push({ suite, name, passed: true })
    console.log(`  ✓ [${suite}] ${name}`)
  } else {
    results.push({ suite, name, passed: false, error: message || 'Assertion failed' })
    console.error(`  ✗ [${suite}] ${name} FAILED:`, message)
  }
}

console.log('================================================================');
console.log('STARTING EMPIRICAL HARNESS: SPATIUM Milestone 1 Block Verification');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Dedicated Cinema Blocks Direct Rendering
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- SUITE 1: HeroCinemaBlock Empirical Cases ---')

// 1.1 completely empty block
assertRender('HeroCinema', '1.1 Completely empty block { type: "hero-cinema" }', () =>
  React.createElement(HeroCinemaBlock, { block: { type: 'hero-cinema' } })
)

// 1.2 undefined data
assertRender('HeroCinema', '1.2 Block with undefined data { type: "hero-cinema", data: undefined }', () =>
  React.createElement(HeroCinemaBlock, { block: { type: 'hero-cinema', data: undefined } })
)

// 1.3 null data
assertRender('HeroCinema', '1.3 Block with null data { type: "hero-cinema", data: null }', () =>
  React.createElement(HeroCinemaBlock, { block: { type: 'hero-cinema', data: null } })
)

// 1.4 flat block
assertRender('HeroCinema', '1.4 Flat block { type: "hero-cinema", badge: "Cinema 4K", headline: "Future Visions" }', () =>
  React.createElement(HeroCinemaBlock, {
    block: {
      type: 'hero-cinema',
      badge: 'Cinema 4K',
      headline: 'Future Visions',
      subheadline: 'Studio quality motion',
      primaryCta: { label: 'Explore', href: '/work' },
      secondaryCta: { label: 'Contact', href: '/contact' }
    }
  })
)

// 1.5 nested block
assertRender('HeroCinema', '1.5 Nested block { type: "hero-cinema", data: { badge: "Nested Badge", headline: "Nested Headline" } }', () =>
  React.createElement(HeroCinemaBlock, {
    block: {
      type: 'hero-cinema',
      data: {
        badge: 'Nested Badge',
        headline: 'Nested Headline',
        subheadline: 'Nested Subheadline',
        primaryCta: { label: 'Nested Action', href: '/nested' }
      }
    }
  })
)

// 1.6 Adversarial: primitive data types
assertRender('HeroCinema', '1.6 Malformed data: string primitive "corrupted"', () =>
  React.createElement(HeroCinemaBlock, { block: { type: 'hero-cinema', data: 'corrupted' as any } })
)

assertRender('HeroCinema', '1.7 Malformed data: number primitive 12345', () =>
  React.createElement(HeroCinemaBlock, { block: { type: 'hero-cinema', data: 12345 as any } })
)

// 1.8 Null block passed
assertRender('HeroCinema', '1.8 Null block { block: null }', () =>
  React.createElement(HeroCinemaBlock, { block: null as any })
)

// 1.9 Undefined block passed
assertRender('HeroCinema', '1.9 Undefined block { block: undefined }', () =>
  React.createElement(HeroCinemaBlock, { block: undefined as any })
)

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Other Dedicated Cinema Blocks
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 2: Other Dedicated Cinema Blocks ---')

// 2.1 ProcessTimelineBlock
assertRender('ProcessTimeline', '2.1 ProcessTimeline empty block', () =>
  React.createElement(ProcessTimelineBlock, { block: { type: 'process-timeline' } })
)
assertRender('ProcessTimeline', '2.2 ProcessTimeline null data', () =>
  React.createElement(ProcessTimelineBlock, { block: { type: 'process-timeline', data: null } })
)
assertRender('ProcessTimeline', '2.3 ProcessTimeline flat steps', () =>
  React.createElement(ProcessTimelineBlock, {
    block: {
      type: 'process-timeline',
      title: 'Timeline Flat',
      steps: [{ title: 'Step 1', deliverables: ['Item A', 'Item B'] }]
    }
  })
)
assertRender('ProcessTimeline', '2.4 ProcessTimeline nested steps', () =>
  React.createElement(ProcessTimelineBlock, {
    block: {
      type: 'process-timeline',
      data: {
        title: 'Timeline Nested',
        steps: [{ title: 'Step 1', deliverables: ['Item 1'] }]
      }
    }
  })
)
assertRender('ProcessTimeline', '2.5 ProcessTimeline malformed steps (not array)', () =>
  React.createElement(ProcessTimelineBlock, {
    block: {
      type: 'process-timeline',
      steps: 'not-an-array' as any,
      data: { steps: 9999 as any }
    }
  })
)

// 2.2 StatsTickerBlock
assertRender('StatsTicker', '2.6 StatsTicker empty block', () =>
  React.createElement(StatsTickerBlock, { block: { type: 'stats-ticker' } })
)
assertRender('StatsTicker', '2.7 StatsTicker null data', () =>
  React.createElement(StatsTickerBlock, { block: { type: 'stats-ticker', data: null } })
)
assertRender('StatsTicker', '2.8 StatsTicker flat metrics', () =>
  React.createElement(StatsTickerBlock, {
    block: {
      type: 'stats-ticker',
      title: 'Metrics Flat',
      metrics: [{ value: '100M+', label: 'Views', detail: 'Across all films' }]
    }
  })
)
assertRender('StatsTicker', '2.9 StatsTicker nested metrics', () =>
  React.createElement(StatsTickerBlock, {
    block: {
      type: 'stats-ticker',
      data: {
        title: 'Metrics Nested',
        metrics: [{ value: '50+', label: 'Awards' }]
      }
    }
  })
)
assertRender('StatsTicker', '2.10 StatsTicker fallback items/stats arrays', () =>
  React.createElement(StatsTickerBlock, {
    block: {
      type: 'stats-ticker',
      items: [{ value: '24fps', label: 'Cinema Rate' }]
    }
  })
)
assertRender('StatsTicker', '2.11 StatsTicker non-array metrics', () =>
  React.createElement(StatsTickerBlock, {
    block: {
      type: 'stats-ticker',
      metrics: 'invalid' as any,
      data: { stats: false as any }
    }
  })
)

// 2.3 InteractiveCtaBlock
assertRender('InteractiveCta', '2.12 InteractiveCta empty block', () =>
  React.createElement(InteractiveCtaBlock, { block: { type: 'interactive-cta' } })
)
assertRender('InteractiveCta', '2.13 InteractiveCta null data', () =>
  React.createElement(InteractiveCtaBlock, { block: { type: 'interactive-cta', data: null } })
)
assertRender('InteractiveCta', '2.14 InteractiveCta flat ctaText/ctaLink', () =>
  React.createElement(InteractiveCtaBlock, {
    block: {
      type: 'interactive-cta',
      headline: 'Start Flat',
      ctaText: 'Hubungi Kami',
      ctaLink: '/kontak'
    }
  })
)
assertRender('InteractiveCta', '2.15 InteractiveCta nested primaryCta', () =>
  React.createElement(InteractiveCtaBlock, {
    block: {
      type: 'interactive-cta',
      data: {
        headline: 'Start Nested',
        primaryCta: { label: 'Click', href: '/click' }
      }
    }
  })
)

// 2.4 TextEditorialBlock
assertRender('TextEditorial', '2.16 TextEditorial empty block', () =>
  React.createElement(TextEditorialBlock, { block: { type: 'text-editorial' } })
)
assertRender('TextEditorial', '2.17 TextEditorial flat content', () =>
  React.createElement(TextEditorialBlock, {
    block: {
      type: 'text-editorial',
      headline: 'Editorial Headline',
      contentHtml: '<p>Direct paragraph</p>'
    }
  })
)
assertRender('TextEditorial', '2.18 TextEditorial nested content', () =>
  React.createElement(TextEditorialBlock, {
    block: {
      type: 'text-editorial',
      data: {
        headline: 'Nested Editorial',
        content: '<p>Nested paragraph</p>'
      }
    }
  })
)

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Catalog Blocks Stress Testing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 3: CatalogBlocks 20+ Components Stress Test ---')

const catalogBlockEntries = [
  { name: 'HeroDepartmentBlock', comp: CatalogBlocks.HeroDepartmentBlock, type: 'hero-department' },
  { name: 'HeroServiceBlock', comp: CatalogBlocks.HeroServiceBlock, type: 'hero-service' },
  { name: 'FeatureBentoGridBlock', comp: CatalogBlocks.FeatureBentoGridBlock, type: 'feature-bento-grid' },
  { name: 'TechStackChipsBlock', comp: CatalogBlocks.TechStackChipsBlock, type: 'tech-stack-chips' },
  { name: 'ExecutiveQuoteCardBlock', comp: CatalogBlocks.ExecutiveQuoteCardBlock, type: 'executive-quote-card' },
  { name: 'EngineeringPillarsBlock', comp: CatalogBlocks.EngineeringPillarsBlock, type: 'engineering-pillars' },
  { name: 'WorkflowPhasesBlock', comp: CatalogBlocks.WorkflowPhasesBlock, type: 'workflow-phases' },
  { name: 'ComparisonMatrixBlock', comp: CatalogBlocks.ComparisonMatrixBlock, type: 'comparison-matrix' },
  { name: 'ArchitectureBlueprintBlock', comp: CatalogBlocks.ArchitectureBlueprintBlock, type: 'architecture-blueprint' },
  { name: 'ClientStatsImpactBlock', comp: CatalogBlocks.ClientStatsImpactBlock, type: 'client-stats-impact' },
  { name: 'DeliverablesChecklistBlock', comp: CatalogBlocks.DeliverablesChecklistBlock, type: 'deliverables-checklist' },
  { name: 'InteractiveTechMatrixBlock', comp: CatalogBlocks.InteractiveTechMatrixBlock, type: 'interactive-tech-matrix' },
  { name: 'PortfolioProofGridBlock', comp: CatalogBlocks.PortfolioProofGridBlock, type: 'portfolio-proof-grid' },
  { name: 'FaqAccordionBlock', comp: CatalogBlocks.FaqAccordionBlock, type: 'faq-accordion' },
  { name: 'StudioCtaBlock', comp: CatalogBlocks.StudioCtaBlock, type: 'studio-cta' },
  { name: 'EditorialParagraphBlock', comp: CatalogBlocks.EditorialParagraphBlock, type: 'editorial-paragraph' },
  { name: 'EditorialHeadingBlock', comp: CatalogBlocks.EditorialHeadingBlock, type: 'editorial-heading' },
  { name: 'DepartmentServiceListBlock', comp: CatalogBlocks.DepartmentServiceListBlock, type: 'department-service-list' },
  { name: 'VisualShowcaseGalleryBlock', comp: CatalogBlocks.VisualShowcaseGalleryBlock, type: 'visual-showcase-gallery' },
  { name: 'MediaShowcaseBlock', comp: CatalogBlocks.MediaShowcaseBlock, type: 'media-showcase' },
]

for (const entry of catalogBlockEntries) {
  assertRender('CatalogBlocks', `${entry.name} empty { type: "${entry.type}" }`, () =>
    React.createElement(entry.comp as any, { block: { type: entry.type } })
  )
  assertRender('CatalogBlocks', `${entry.name} null data { type: "${entry.type}", data: null }`, () =>
    React.createElement(entry.comp as any, { block: { type: entry.type, data: null } })
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: BlockRenderer Stress Testing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 4: BlockRenderer Implementations ---')

// 4.1 Component BlockRenderer (src/components/blocks/BlockRenderer.tsx)
assertRender('ComponentBlockRenderer', '4.1 undefined blocks', () =>
  React.createElement(ComponentBlockRenderer, { blocks: undefined })
)
assertRender('ComponentBlockRenderer', '4.2 empty array []', () =>
  React.createElement(ComponentBlockRenderer, { blocks: [] })
)
assertRender('ComponentBlockRenderer', '4.3 array with null, undefined, empty object', () =>
  React.createElement(ComponentBlockRenderer, { blocks: [null, undefined, {} as any] })
)
assertRender('ComponentBlockRenderer', '4.4 unknown block type', () =>
  React.createElement(ComponentBlockRenderer, { blocks: [{ type: 'unknown-block-404' }] })
)
assertRender('ComponentBlockRenderer', '4.5 dedicated cinema blocks mixture', () =>
  React.createElement(ComponentBlockRenderer, {
    blocks: [
      { type: 'hero-cinema' },
      { type: 'hero-cinema', data: null },
      { type: 'hero-cinema', badge: 'Flat 4K', headline: 'Flat Head' },
      { type: 'hero-cinema', data: { badge: 'Nested 4K', headline: 'Nested Head' } },
      { type: 'process-timeline' },
      { type: 'stats-ticker' },
      { type: 'interactive-cta' },
      { type: 'text-editorial' }
    ]
  })
)

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Zod Schema and parseBlocks() Validation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 5: parseBlocks() and Zod Schema Verification ---')

// 5.1 Falsy rawInput
const res5_1 = parseBlocks(null)
assertCondition('parseBlocks', '5.1 parseBlocks(null) returns ok: true, empty array', res5_1.ok && res5_1.blocks.length === 0)

const res5_2 = parseBlocks(undefined)
assertCondition('parseBlocks', '5.2 parseBlocks(undefined) returns ok: true, empty array', res5_2.ok && res5_2.blocks.length === 0)

const res5_3 = parseBlocks('')
assertCondition('parseBlocks', '5.3 parseBlocks("") returns ok: true, empty array', res5_3.ok && res5_3.blocks.length === 0)

// 5.2 Invalid JSON string
const res5_4 = parseBlocks('{ corrupt json')
assertCondition('parseBlocks', '5.4 parseBlocks(invalid JSON) returns ok: false', !res5_4.ok && res5_4.issues?.length! > 0)

// 5.3 Non-array object
const res5_5 = parseBlocks({ type: 'hero-cinema' })
assertCondition('parseBlocks', '5.5 parseBlocks(non-array object) returns ok: false', !res5_5.ok && res5_5.issues?.[0]?.includes('must be an array')!)

// 5.4 Valid dedicated cinema blocks via JSON string and object array
const cinemaBlocksPayload = [
  { type: 'hero-cinema' },
  { type: 'hero-cinema', data: { badge: 'Test Badge', headline: 'Test Headline' } },
  { type: 'hero-cinema', badge: 'Flat Badge', headline: 'Flat Headline' },
  { type: 'process-timeline', steps: [{ title: 'Step 1' }] },
  { type: 'stats-ticker', metrics: [{ value: '10', label: 'Years' }] },
  { type: 'interactive-cta', headline: 'CTA' },
  { type: 'text-editorial', leadText: 'Editorial lead' }
]

const res5_6 = parseBlocks(cinemaBlocksPayload)
assertCondition(
  'parseBlocks',
  '5.6 parseBlocks(dedicated cinema blocks array) passes Zod validation',
  res5_6.ok && res5_6.blocks.length === 7,
  res5_6.issues?.join(', ')
)

const res5_7 = parseBlocks(JSON.stringify(cinemaBlocksPayload))
assertCondition(
  'parseBlocks',
  '5.7 parseBlocks(JSON string of cinema blocks) passes Zod validation',
  res5_7.ok && res5_7.blocks.length === 7,
  res5_7.issues?.join(', ')
)

// 5.5 Pre-normalization of legacy Strapi __component to type
const legacyPayload = [
  { __component: 'hero-cinema', headline: 'Legacy Cinema' },
  { __component: 'blocks.hero', headline: 'Legacy Hero' }
]
const res5_8 = parseBlocks(legacyPayload)
assertCondition(
  'parseBlocks',
  '5.8 parseBlocks handles legacy __component normalization',
  res5_8.ok && res5_8.blocks.length === 2 && res5_8.blocks[0].type === 'hero-cinema' && res5_8.blocks[1].type === 'blocks.hero',
  res5_8.issues?.join(', ')
)

// 5.6 Unrecognized block type
const unknownPayload = [{ type: 'unrecognized-block-xyz' }]
const res5_9 = parseBlocks(unknownPayload)
assertCondition(
  'parseBlocks',
  '5.9 parseBlocks rejects unknown block types with invalid_union discriminator error',
  !res5_9.ok && res5_9.issues?.length! > 0
)

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
const total = results.length
const passed = results.filter(r => r.passed).length
const failed = results.filter(r => !r.passed).length
console.log(`SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
