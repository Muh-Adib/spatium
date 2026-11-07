/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema, itemLimitSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField, limitField } from '../entity-fields'

export const portfolioRelatedBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('portfolio-related'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  limit: itemLimitSchema,
})

export type PortfolioRelatedBlockData = z.output<typeof portfolioRelatedBlockSchema>

export const portfolioRelatedBlock = defineBlock({
  schema: portfolioRelatedBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'portfolio-related',
      label: 'Karya terkait',
      description: `Scene terbit lainnya. ${DATA_BOUND_NOTE}`,
      category: 'proof',
      targets: ['portfolio'],
      fields: [eyebrowField('"Karya Terkait"'), headingField('"Eksplorasi Capture Spasial Lainnya"'), limitField('scene (bawaan 3)')],
      example: { type: 'portfolio-related' },
    },
  ],
})
