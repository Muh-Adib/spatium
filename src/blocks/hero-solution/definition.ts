/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const heroSolutionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('hero-solution'),
  badge: z.string().max(200).optional(),
  title: z.string().max(500).optional(),
  headline: z.string().max(500).optional(),
  shortDescription: z.string().max(3000).optional(),
  description: z.string().max(5000).optional(),
  heroImage: z.string().optional(),
  category: z.string().max(200).optional(),
  keyBenefits: z.union([z.string(), z.array(z.string())]).optional(),
  primaryCta: z.object({ label: z.string().optional(), href: z.string().optional() }).optional(),
  secondaryCta: z.object({ label: z.string().optional(), href: z.string().optional() }).optional(),
  data: z.record(z.string(), z.any()).optional(),
}).passthrough()

export const heroSolutionBlock = defineBlock({
  schema: heroSolutionBlockSchema,
  pageHero: true,
})
