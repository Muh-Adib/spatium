/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, toggleField } from '../entity-fields'

export const categoryIntroBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('category-intro'),
  paragraphs: z.array(z.string().trim().min(1).max(5000)).max(20).optional(),
  showTools: z.boolean().optional(),
  showVisual: z.boolean().optional(),
  visualLabel: overrideTextSchema(80),
})

export type CategoryIntroBlockData = z.output<typeof categoryIntroBlockSchema>

export const categoryIntroBlock = defineBlock({
  schema: categoryIntroBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'category-intro',
      label: 'Intro kategori + visual',
      description: `Paragraf pengantar, daftar tools, dan visual interaktif use case. ${DATA_BOUND_NOTE}`,
      category: 'content',
      targets: ['service-category'],
      fields: [
        { key: 'paragraphs', label: 'Paragraf pengantar', kind: 'stringList', itemLabel: 'Paragraf', help: 'Kosongkan untuk memakai ringkasan kategori.' },
        toggleField('showTools', 'Tampilkan tools', 'Bawaan: ya.'),
        toggleField('showVisual', 'Tampilkan visual interaktif', 'Bawaan: ya.'),
        { key: 'visualLabel', label: 'Label bingkai visual', kind: 'text', help: 'Bawaan: "Interactive preview".' },
      ],
      example: { type: 'category-intro' },
    },
  ],
})
