/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, headingField, toggleField } from '../entity-fields'

export const serviceDescriptionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('service-description'),
  heading: overrideTextSchema(200),
  showVisual: z.boolean().optional(),
  visualLabel: overrideTextSchema(80),
})

export type ServiceDescriptionBlockData = z.output<typeof serviceDescriptionBlockSchema>

export const serviceDescriptionBlock = defineBlock({
  schema: serviceDescriptionBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'service-description',
      label: 'Deskripsi layanan + visual',
      description: `Deskripsi panjang layanan dan visual interaktif kategorinya. ${DATA_BOUND_NOTE}`,
      category: 'content',
      targets: ['service'],
      fields: [
        headingField('tanpa judul terlihat'),
        toggleField('showVisual', 'Tampilkan visual interaktif', 'Bawaan: ya.'),
        { key: 'visualLabel', label: 'Label bingkai visual', kind: 'text', help: 'Bawaan: "Interactive preview".' },
      ],
      example: { type: 'service-description' },
    },
  ],
})
