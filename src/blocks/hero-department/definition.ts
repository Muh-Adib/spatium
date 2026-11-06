/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { safeUrlSchema } from '@/lib/blocks/primitives'

export const heroDepartmentBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('hero-department'),
  variant: z.string().optional().default('cinematic'),
  title: z.string().max(300),
  tagline: z.string().max(500).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  keyOutcomes: z
    .array(
      z.object({
        label: z.string().max(100),
        value: z.string().max(100),
      })
    )
    .optional()
    .default([]),
  heroImage: z.string().optional(),
  imageCaption: z.string().max(200).optional(),
  imageBadge: z.string().max(100).optional(),
  windowTitle: z.string().max(200).optional(),
  windowBadge: z.string().max(100).optional(),
  floatingBadges: z
    .array(
      z.object({
        label: z.string().max(100),
        icon: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  cta: z
    .object({
      label: z.string().max(100).optional(),
      url: safeUrlSchema.optional(),
    })
    .optional(),
})

export const heroDepartmentBlock = defineBlock({
  schema: heroDepartmentBlockSchema,
  pageHero: true,
})
