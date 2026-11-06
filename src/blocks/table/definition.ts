/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const tableBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('table'),
  title: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  headers: z.array(z.string().max(500)).default([]),
  rows: z.array(z.array(z.string().max(2000))).default([]),
}).passthrough()

export const tableBlock = defineBlock({
  schema: tableBlockSchema,
  catalog: [
    {
      type: 'table',
      label: 'Tabel',
      description: 'Tabel data sederhana dengan baris judul.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        { key: 'caption', label: 'Keterangan', kind: 'text' },
        { key: 'headers', label: 'Kolom', kind: 'stringList', itemLabel: 'Kolom' },
        { key: 'rows', label: 'Baris', kind: 'table', columnsKey: 'headers', max: 100 },
      ],
      example: {
        type: 'table',
        title: 'Foto, video, dan media spasial',
        headers: ['Media', 'Menangkap'],
        rows: [
          ['Foto', 'Gambar'],
          ['Video', 'Momen'],
          ['Media spasial', 'Ruang'],
        ],
      },
    },
  ],
})
