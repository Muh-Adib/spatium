/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema, itemLimitSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField, limitField } from '../entity-fields'

export const serviceRelatedWorkBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('service-related-work'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  limit: itemLimitSchema,
})

export type ServiceRelatedWorkBlockData = z.output<typeof serviceRelatedWorkBlockSchema>

export const serviceRelatedWorkBlock = defineBlock({
  schema: serviceRelatedWorkBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'service-related-work',
      label: 'Portofolio terkait (layanan)',
      description: `Portofolio terbit yang ditautkan ke layanan ini. Tersembunyi bila belum ada. ${DATA_BOUND_NOTE}`,
      category: 'proof',
      targets: ['service'],
      fields: [eyebrowField('"Scene terkait"'), headingField('"Contoh capture untuk <nama layanan>"'), limitField('scene (bawaan 3)')],
      example: { type: 'service-related-work' },
    },
  ],
})
