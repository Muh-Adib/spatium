/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema, itemLimitSchema, slugRefSchema } from '@/lib/blocks/primitives'
import { eyebrowField, headingField, limitField } from '../entity-fields'

export const categoryRelatedWorkBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('category-related-work'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  portfolioSlugs: z.array(slugRefSchema).max(12).optional(),
  limit: itemLimitSchema,
})

export type CategoryRelatedWorkBlockData = z.output<typeof categoryRelatedWorkBlockSchema>

export const categoryRelatedWorkBlock = defineBlock({
  schema: categoryRelatedWorkBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'category-related-work',
      label: 'Scene terkait (kategori)',
      description: 'Kartu portofolio terbit yang dipilih berdasarkan slug. Tersembunyi bila tidak ada yang terbit.',
      category: 'proof',
      targets: ['service-category'],
      fields: [
        eyebrowField('"Scene terkait"'),
        headingField('"Contoh capture untuk <nama singkat>"'),
        { key: 'portfolioSlugs', label: 'Slug portofolio', kind: 'stringList', itemLabel: 'Slug', help: 'Hanya portofolio terbit yang tampil.' },
        limitField('scene (bawaan 3)'),
      ],
      example: { type: 'category-related-work' },
    },
  ],
})
