/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const architectureBlueprintBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('architecture-blueprint'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  blueprintImage: z.string().optional(),
  image: z.string().optional(),
  imageLabel: z.string().max(200).optional(),
  imageBadge: z.string().max(100).optional(),
  hudTitle: z.string().max(200).optional(),
  hudMetric: z.string().max(100).optional(),
  hudDesc: z.string().max(300).optional(),
  layers: z
    .array(
      z.object({
        name: z.string().max(200).optional(),
        title: z.string().max(200).optional(),
        level: z.string().max(100).optional(),
        badge: z.string().max(100).optional(),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        tech: z.union([z.array(z.string().max(100)), z.string().max(500)]).optional(),
      })
    )
    .optional()
    .default([]),
})

export const architectureBlueprintBlock = defineBlock({
  schema: architectureBlueprintBlockSchema,
})
