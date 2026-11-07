/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, toggleField } from '../entity-fields'

export const serviceHeroBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('service-hero'),
  eyebrow: overrideTextSchema(120),
  showTools: z.boolean().optional(),
  toolLimit: z.number().int().min(0).max(12).optional(),
})

export type ServiceHeroBlockData = z.output<typeof serviceHeroBlockSchema>

export const serviceHeroBlock = defineBlock({
  schema: serviceHeroBlockSchema,
  dataBound: true,
  pageHero: true,
  catalog: [
    {
      type: 'service-hero',
      label: 'Hero layanan',
      description: `Judul (H1), ringkasan, dan breadcrumb layanan beserta kategorinya. ${DATA_BOUND_NOTE}`,
      category: 'hero',
      targets: ['service'],
      fields: [
        eyebrowField('nama kategori induk'),
        toggleField('showTools', 'Tampilkan pill teknologi', 'Bawaan: ya.'),
        { key: 'toolLimit', label: 'Jumlah pill teknologi', kind: 'number', help: 'Bawaan: 3.' },
      ],
      example: { type: 'service-hero' },
    },
  ],
})
