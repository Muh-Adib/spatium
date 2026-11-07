/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { eyebrowField, headingField } from '../entity-fields'

export const categoryFaqBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('category-faq'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  items: z.array(z.object({ question: z.string().trim().min(1).max(500), answer: z.string().trim().min(1).max(5000) })).max(30).optional(),
})

export type CategoryFaqBlockData = z.output<typeof categoryFaqBlockSchema>

export const categoryFaqBlock = defineBlock({
  schema: categoryFaqBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'category-faq',
      label: 'FAQ kategori',
      description: 'Pertanyaan umum kategori, dengan data terstruktur FAQPage. Tersembunyi bila belum ada pertanyaan.',
      category: 'content',
      targets: ['service-category'],
      fields: [
        eyebrowField('"Perlu diketahui"'),
        headingField('"Pertanyaan umum"'),
        {
          key: 'items',
          label: 'Pertanyaan',
          kind: 'list',
          itemLabel: 'Pertanyaan',
          fields: [
            { key: 'question', label: 'Pertanyaan', kind: 'text', required: true },
            { key: 'answer', label: 'Jawaban', kind: 'textarea', required: true },
          ],
        },
      ],
      example: { type: 'category-faq' },
    },
  ],
})
