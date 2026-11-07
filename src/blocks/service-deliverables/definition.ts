/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField, ledeField, toggleField } from '../entity-fields'

export const serviceDeliverablesBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('service-deliverables'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  lede: overrideTextSchema(600),
  showPipeline: z.boolean().optional(),
  pipelineLabel: overrideTextSchema(80),
})

export type ServiceDeliverablesBlockData = z.output<typeof serviceDeliverablesBlockSchema>

export const serviceDeliverablesBlock = defineBlock({
  schema: serviceDeliverablesBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'service-deliverables',
      label: 'Keluaran layanan + alur',
      description: `Keluaran layanan (bila tercatat) dan timeline alur digital twin. ${DATA_BOUND_NOTE}`,
      category: 'content',
      targets: ['service'],
      fields: [
        eyebrowField('"Keluaran"'),
        headingField('"Apa yang Anda terima."'),
        ledeField('keluaran disesuaikan dengan tujuan proyek'),
        toggleField('showPipeline', 'Tampilkan alur digital twin', 'Bawaan: ya.'),
        { key: 'pipelineLabel', label: 'Label alur', kind: 'text', help: 'Bawaan: "Alur digital twin".' },
      ],
      example: { type: 'service-deliverables' },
    },
  ],
})
