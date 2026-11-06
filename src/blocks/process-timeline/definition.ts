/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const processTimelineBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('process-timeline'),
    title: z.string().max(500).optional(),
    eyebrow: z.string().max(200).optional(),
    badge: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    steps: z
      .array(
        z
          .object({
            step: z.string().optional(),
            number: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            duration: z.string().optional(),
            deliverables: z.array(z.string()).optional(),
          })
          .passthrough()
      )
      .optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const processTimelineBlock = defineBlock({
  schema: processTimelineBlockSchema,
  catalog: [
    {
      type: 'process-timeline',
      label: 'Alur kerja / pipeline',
      description: 'Tahapan berurutan, cocok untuk pipeline Laser Scan → Point Cloud → 3D Geometry → 3D Gaussian Splat.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
        { key: 'title', label: 'Judul', kind: 'text' },
        { key: 'description', label: 'Deskripsi', kind: 'textarea' },
        {
          key: 'steps',
          label: 'Tahap',
          kind: 'list',
          itemLabel: 'Tahap',
          max: 12,
          fields: [
            { key: 'number', label: 'Nomor', kind: 'text' },
            { key: 'title', label: 'Judul tahap', kind: 'text', required: true },
            { key: 'description', label: 'Deskripsi', kind: 'textarea' },
            { key: 'deliverables', label: 'Keluaran', kind: 'stringList', itemLabel: 'Keluaran' },
          ],
        },
      ],
      example: {
        type: 'process-timeline',
        eyebrow: 'Alur kerja',
        title: 'Dari dunia nyata ke 3D Gaussian Splat',
        steps: [
          { number: '01', title: 'Laser Scan', description: 'Merekam pengukuran spasial dari lokasi nyata.' },
          { number: '02', title: 'Point Cloud', description: 'Representasi 3D dari titik-titik spasial berwarna.' },
          { number: '03', title: '3D Geometry', description: 'Mesh terstruktur yang bisa diedit.' },
          { number: '04', title: '3D Gaussian Splat', description: 'Representasi ringan, fotorealistis, dan imersif.' },
        ],
      },
      aliases: { 'steps.number': ['step'] },
    },
  ],
})
