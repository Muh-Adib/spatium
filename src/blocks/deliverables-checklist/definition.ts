/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const deliverablesChecklistBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('deliverables-checklist'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  items: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        included: z.boolean().optional().default(true),
      })
    )
    .optional()
    .default([]),
})

export const deliverablesChecklistBlock = defineBlock({
  schema: deliverablesChecklistBlockSchema,
  catalog: [
    {
      type: 'deliverables-checklist',
      label: 'Daftar keluaran',
      description: 'Checklist hal yang diterima klien.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        {
          key: 'items',
          label: 'Item',
          kind: 'list',
          itemLabel: 'Item',
          max: 20,
          fields: [
            { key: 'title', label: 'Item', kind: 'text', required: true },
            { key: 'description', label: 'Deskripsi', kind: 'text' },
          ],
        },
      ],
      example: {
        type: 'deliverables-checklist',
        title: 'Yang Anda terima',
        items: [{ title: 'Scene 3D Gaussian Splat' }, { title: 'Viewer interaktif di browser' }],
      },
      aliases: { 'items.description': ['desc'] },
    },
  ],
})
