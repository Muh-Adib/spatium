/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const clientStatsImpactBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('client-stats-impact'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  stats: z
    .array(
      z.object({
        value: z.string().max(50),
        label: z.string().max(150),
        description: z.string().max(500).optional(),
        detail: z.string().max(500).optional(),
      })
    )
    .optional()
    .default([]),
})

export const clientStatsImpactBlock = defineBlock({
  schema: clientStatsImpactBlockSchema,
})
