/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField, ledeField, toggleField } from '../entity-fields'

export const categoryDeliverablesBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('category-deliverables'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  lede: overrideTextSchema(600),
  showPipeline: z.boolean().optional(),
  pipelineLabel: overrideTextSchema(80),
})

export type CategoryDeliverablesBlockData = z.output<typeof categoryDeliverablesBlockSchema>

export const categoryDeliverablesBlock = defineBlock({
  schema: categoryDeliverablesBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'category-deliverables',
      label: 'Keluaran + alur digital twin',
      description: `Daftar keluaran kategori dan timeline alur capture (laser scan → 3D Gaussian Splat). ${DATA_BOUND_NOTE}`,
      category: 'content',
      targets: ['service-category'],
      fields: [
        eyebrowField('"Keluaran"'),
        headingField('"Apa yang Anda terima."'),
        ledeField('keluaran disesuaikan dengan tujuan proyek'),
        toggleField('showPipeline', 'Tampilkan alur digital twin', 'Bawaan: ya.'),
        { key: 'pipelineLabel', label: 'Label alur', kind: 'text', help: 'Bawaan: "Alur digital twin".' },
      ],
      example: { type: 'category-deliverables' },
    },
  ],
})
