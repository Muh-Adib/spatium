/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, toggleField } from '../entity-fields'

export const categoryHeroBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('category-hero'),
  eyebrow: overrideTextSchema(120),
  showTools: z.boolean().optional(),
  toolLimit: z.number().int().min(0).max(12).optional(),
})

export type CategoryHeroBlockData = z.output<typeof categoryHeroBlockSchema>

export const categoryHeroBlock = defineBlock({
  schema: categoryHeroBlockSchema,
  dataBound: true,
  pageHero: true,
  catalog: [
    {
      type: 'category-hero',
      label: 'Hero kategori layanan',
      description: `Judul (H1), tagline, ringkasan, dan breadcrumb use case. ${DATA_BOUND_NOTE}`,
      category: 'hero',
      targets: ['service-category'],
      fields: [
        eyebrowField('"Use case <nomor>"'),
        toggleField('showTools', 'Tampilkan pill tools', 'Bawaan: ya.'),
        { key: 'toolLimit', label: 'Jumlah pill tools', kind: 'number', help: 'Bawaan: 3.' },
      ],
      example: { type: 'category-hero' },
    },
  ],
})
