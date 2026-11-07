/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema, itemLimitSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField, ledeField, limitField } from '../entity-fields'

export const categoryCapabilitiesBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('category-capabilities'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  lede: overrideTextSchema(600),
  limit: itemLimitSchema,
})

export type CategoryCapabilitiesBlockData = z.output<typeof categoryCapabilitiesBlockSchema>

export const categoryCapabilitiesBlock = defineBlock({
  schema: categoryCapabilitiesBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'category-capabilities',
      label: 'Kapabilitas (layanan turunan)',
      description: `Kartu layanan turunan yang terbit, masing-masing menautkan ke halamannya. ${DATA_BOUND_NOTE}`,
      category: 'navigation',
      targets: ['service-category'],
      fields: [
        eyebrowField('"Cakupan"'),
        headingField('"Kapabilitas <nama singkat>"'),
        ledeField('setiap kapabilitas bisa dikerjakan terpisah atau digabungkan'),
        limitField('kapabilitas'),
      ],
      example: { type: 'category-capabilities' },
    },
  ],
})
