/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE } from '../entity-fields'

export const portfolioSceneBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('portfolio-scene'),
  label: overrideTextSchema(80),
  height: z.enum(['standard', 'compact']).optional(),
})

export type PortfolioSceneBlockData = z.output<typeof portfolioSceneBlockSchema>

export const portfolioSceneBlock = defineBlock({
  schema: portfolioSceneBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'portfolio-scene',
      label: 'Viewer scene 3D',
      description: `Viewer SuperSplat dari ID scene di liveUrl (atau poster bila belum ada scene). ${DATA_BOUND_NOTE}`,
      category: 'spatial',
      targets: ['portfolio'],
      fields: [
        { key: 'label', label: 'Label bingkai', kind: 'text', help: 'Bawaan: "3D Gaussian Splat Viewer".' },
        {
          key: 'height',
          label: 'Tinggi viewer',
          kind: 'select',
          options: [
            { value: 'standard', label: 'Standar' },
            { value: 'compact', label: 'Ringkas' },
          ],
        },
      ],
      example: { type: 'portfolio-scene' },
    },
  ],
})
