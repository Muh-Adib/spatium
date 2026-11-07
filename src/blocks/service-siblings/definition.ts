/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField } from '../entity-fields'

export const serviceSiblingsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('service-siblings'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
})

export type ServiceSiblingsBlockData = z.output<typeof serviceSiblingsBlockSchema>

export const serviceSiblingsBlock = defineBlock({
  schema: serviceSiblingsBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'service-siblings',
      label: 'Kapabilitas lain + kategori induk',
      description: `Tautan ke kategori induk dan layanan terbit lain di kategori yang sama. ${DATA_BOUND_NOTE}`,
      category: 'navigation',
      targets: ['service'],
      fields: [eyebrowField('"Bagian dari <kategori>"'), headingField('"Kapabilitas lainnya"')],
      example: { type: 'service-siblings' },
    },
  ],
})
