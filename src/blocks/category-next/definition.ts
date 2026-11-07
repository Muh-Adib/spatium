/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField } from '../entity-fields'

export const categoryNextBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('category-next'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
})

export type CategoryNextBlockData = z.output<typeof categoryNextBlockSchema>

export const categoryNextBlock = defineBlock({
  schema: categoryNextBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'category-next',
      label: 'Use case lain',
      description: `Kartu kategori layanan terbit lainnya. ${DATA_BOUND_NOTE}`,
      category: 'navigation',
      targets: ['service-category'],
      fields: [eyebrowField('"Use case lain"'), headingField('"Jelajahi lebih lanjut"')],
      example: { type: 'category-next' },
    },
  ],
})
