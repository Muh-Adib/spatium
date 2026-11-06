/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const comparisonMatrixBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('comparison-matrix'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  traditionalLabel: z.string().max(100).optional(),
  highlightLabel: z.string().max(100).optional(),
  // Legacy aliases (pre-SPATIUM fork) — read-only fallbacks for stored blocks.
  unimasiLabel: z.string().max(100).optional(),
  segiaLabel: z.string().max(100).optional(),
  rows: z
    .array(
      z.object({
        aspect: z.string().max(200).optional(),
        feature: z.string().max(200).optional(),
        title: z.string().max(200).optional(),
        desc: z.string().max(2000).optional(),
        traditional: z.string().max(2000),
        highlight: z.string().max(2000).optional(),
        // Legacy aliases (pre-SPATIUM fork) — read-only fallbacks for stored blocks.
        unimasi: z.string().max(2000).optional(),
        segia: z.string().max(2000).optional(),
      })
    )
    .optional()
    .default([]),
})

export const comparisonMatrixBlock = defineBlock({
  schema: comparisonMatrixBlockSchema,
})
