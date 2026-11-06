/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const techStackChipsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('tech-stack-chips'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(500).optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  categories: z
    .array(
      z.object({
        category: z.string().max(100),
        technologies: z.array(z.string().max(100)),
      })
    )
    .optional(),
  technologies: z
    .array(
      z.union([
        z.string().max(100),
        z.object({
          name: z.string().max(100),
          category: z.string().max(100).optional(),
        }),
      ])
    )
    .optional(),
})

export const techStackChipsBlock = defineBlock({
  schema: techStackChipsBlockSchema,
})
