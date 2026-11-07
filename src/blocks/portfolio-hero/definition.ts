/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, toggleField } from '../entity-fields'

export const portfolioHeroBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('portfolio-hero'),
  eyebrow: overrideTextSchema(120),
  showMeta: z.boolean().optional(),
})

export type PortfolioHeroBlockData = z.output<typeof portfolioHeroBlockSchema>

export const portfolioHeroBlock = defineBlock({
  schema: portfolioHeroBlockSchema,
  dataBound: true,
  pageHero: true,
  catalog: [
    {
      type: 'portfolio-hero',
      label: 'Hero scene portofolio',
      description: `Judul (H1), tagline, breadcrumb, dan pill sektor/tahun/klien/lokasi. ${DATA_BOUND_NOTE}`,
      category: 'hero',
      targets: ['portfolio'],
      fields: [eyebrowField('"SPATIUM Spatial Showcase"'), toggleField('showMeta', 'Tampilkan pill detail', 'Bawaan: ya.')],
      example: { type: 'portfolio-hero' },
    },
  ],
})
