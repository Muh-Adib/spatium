/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const legacyHeroBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.hero'),
  headline: z.string().max(500).optional(),
  description: z.string().max(3000).optional(),
  badge: z.string().max(100).optional(),
  backgroundImage: z.any().optional(),
  cta: z.any().optional(),
})

export const legacyHeroBlock = defineBlock({
  schema: legacyHeroBlockSchema,
  pageHero: true,
})

export const legacyFeatureGridBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.feature-grid'),
  title: z.string().max(300).optional(),
  features: z.array(z.any()).optional(),
})

export const legacyFeatureGridBlock = defineBlock({
  schema: legacyFeatureGridBlockSchema,
})

export const legacyRichTextBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.rich-text'),
  body: z.string().max(30000).optional(),
})

export const legacyRichTextBlock = defineBlock({
  schema: legacyRichTextBlockSchema,
})

export const legacyStatisticsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.statistics'),
}).passthrough()

export const legacyStatisticsBlock = defineBlock({
  schema: legacyStatisticsBlockSchema,
})

export const legacyFaqSectionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.faq-section'),
}).passthrough()

export const legacyFaqSectionBlock = defineBlock({
  schema: legacyFaqSectionBlockSchema,
})

export const legacyTestimonialsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.testimonials'),
}).passthrough()

export const legacyTestimonialsBlock = defineBlock({
  schema: legacyTestimonialsBlockSchema,
})

export const legacyCtaSectionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.cta-section'),
}).passthrough()

export const legacyCtaSectionBlock = defineBlock({
  schema: legacyCtaSectionBlockSchema,
})

export const legacyProcessBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.process'),
}).passthrough()

export const legacyProcessBlock = defineBlock({
  schema: legacyProcessBlockSchema,
})

export const legacyTechnologyStackBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.technology-stack'),
}).passthrough()

export const legacyTechnologyStackBlock = defineBlock({
  schema: legacyTechnologyStackBlockSchema,
})

export const legacyVideoSectionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.video-section'),
}).passthrough()

export const legacyVideoSectionBlock = defineBlock({
  schema: legacyVideoSectionBlockSchema,
})

export const legacyLiveEmbedBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.live-embed'),
}).passthrough()

export const legacyLiveEmbedBlock = defineBlock({
  schema: legacyLiveEmbedBlockSchema,
})
