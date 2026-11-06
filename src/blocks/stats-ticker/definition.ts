/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const statsTickerBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('stats-ticker'),
    title: z.string().max(500).optional(),
    eyebrow: z.string().max(200).optional(),
    badge: z.string().max(200).optional(),
    metrics: z
      .array(
        z
          .object({
            value: z.string().optional(),
            label: z.string().optional(),
            subtext: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
    stats: z.array(z.any()).optional(),
    items: z.array(z.any()).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const statsTickerBlock = defineBlock({
  schema: statsTickerBlockSchema,
  catalog: [
    {
      type: 'stats-ticker',
      label: 'Angka proyek',
      description: 'Deretan angka. HANYA untuk data terukur dan terverifikasi — jangan isi angka perkiraan.',
      category: 'proof',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        {
          key: 'metrics',
          label: 'Angka',
          kind: 'list',
          itemLabel: 'Angka',
          max: 8,
          fields: [
            { key: 'value', label: 'Nilai', kind: 'text', required: true },
            { key: 'label', label: 'Label', kind: 'text', required: true },
            { key: 'subtext', label: 'Sumber / catatan', kind: 'text' },
          ],
        },
      ],
      example: { type: 'stats-ticker', title: 'Data proyek', metrics: [] },
    },
  ],
})
