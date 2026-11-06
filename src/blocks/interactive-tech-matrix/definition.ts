/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const interactiveTechMatrixBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('interactive-tech-matrix'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  categories: z
    .array(
      z.object({
        name: z.string().max(100),
        badge: z.string().max(100).optional(),
        items: z.array(
          z.union([
            z.string().max(200),
            z.object({
              name: z.string().max(100),
              version: z.string().max(50).optional(),
              purpose: z.string().max(200).optional(),
              badge: z.string().max(50).optional(),
            }),
          ])
        ),
      })
    )
    .optional()
    .default([]),
})

export const interactiveTechMatrixBlock = defineBlock({
  schema: interactiveTechMatrixBlockSchema,
})
