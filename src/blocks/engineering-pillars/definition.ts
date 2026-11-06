/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const engineeringPillarsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('engineering-pillars'),
  variant: z.string().max(100).optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  pillars: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        icon: z.string().optional(),
        metric: z.string().max(100).optional(),
        metricLabel: z.string().max(100).optional(),
        points: z.array(z.string().max(200)).optional(),
        badge: z.string().max(100).optional(),
      })
    )
    .optional()
    .default([]),
})

export const engineeringPillarsBlock = defineBlock({
  schema: engineeringPillarsBlockSchema,
})
