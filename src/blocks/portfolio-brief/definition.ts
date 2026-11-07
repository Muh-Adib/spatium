/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField, toggleField } from '../entity-fields'

export const portfolioBriefBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('portfolio-brief'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(200),
  approachHeading: overrideTextSchema(200),
  deliveredHeading: overrideTextSchema(200),
  showFacts: z.boolean().optional(),
})

export type PortfolioBriefBlockData = z.output<typeof portfolioBriefBlockSchema>

export const portfolioBriefBlock = defineBlock({
  schema: portfolioBriefBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'portfolio-brief',
      label: 'Brief, alur, keluaran + detail scene',
      description: `Konteks (challenge), langkah alur (approach), keluaran (result), dan kartu detail scene (klien, tahun, lokasi, metrik terukur, teknologi). ${DATA_BOUND_NOTE}`,
      category: 'content',
      targets: ['portfolio'],
      fields: [
        eyebrowField('"Tentang scene"'),
        headingField('"Konteks ruang"'),
        { key: 'approachHeading', label: 'Judul alur', kind: 'text', help: 'Bawaan: "Alur Rekonstruksi Spasial 3DGS".' },
        { key: 'deliveredHeading', label: 'Judul keluaran', kind: 'text', help: 'Bawaan: "Aset Digital yang Dihasilkan".' },
        toggleField('showFacts', 'Tampilkan kartu detail scene', 'Bawaan: ya.'),
      ],
      example: { type: 'portfolio-brief' },
    },
  ],
})
