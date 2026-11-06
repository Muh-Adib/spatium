/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const workflowPhasesBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('workflow-phases'),
  variant: z.string().optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  phases: z
    .array(
      z.object({
        step: z.string().max(50).optional(),
        phase: z.union([z.string(), z.number()]).optional(),
        title: z.string().max(200).optional(),
        name: z.string().max(200).optional(),
        timeline: z.string().max(100).optional(),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        deliverables: z.array(z.string().max(200)).optional(),
        badge: z.string().max(100).optional(),
      })
    )
    .optional()
    .default([]),
})

export const workflowPhasesBlock = defineBlock({
  schema: workflowPhasesBlockSchema,
  catalog: [
    {
      type: 'workflow-phases',
      label: 'Fase proyek',
      description: 'Fase kerja dengan keluaran per fase.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        {
          key: 'phases',
          label: 'Fase',
          kind: 'list',
          itemLabel: 'Fase',
          max: 10,
          fields: [
            { key: 'title', label: 'Nama fase', kind: 'text', required: true },
            { key: 'description', label: 'Deskripsi', kind: 'textarea' },
            { key: 'deliverables', label: 'Keluaran', kind: 'stringList', itemLabel: 'Keluaran' },
          ],
        },
      ],
      example: {
        type: 'workflow-phases',
        title: 'Alur proyek',
        phases: [
          { title: 'Capture', description: 'Perekaman di lokasi.' },
          { title: 'Process', description: 'Point cloud dan rekonstruksi.' },
          { title: 'Deliver', description: 'Scene dan viewer siap dipakai.' },
        ],
      },
      aliases: { 'phases.title': ['name'], 'phases.description': ['desc'] },
    },
  ],
})
