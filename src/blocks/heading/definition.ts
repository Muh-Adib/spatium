/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const editorialHeadingBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(['heading2', 'heading3']),
    level: z.union([z.literal(2), z.literal(3)]).optional(),
    content: z.string().max(1000).optional(),
    text: z.string().max(1000).optional(),
    title: z.string().max(1000).optional(),
  })
  .refine((data) => Boolean(data.content || data.text || data.title), {
    message: 'Heading harus memiliki content, text, atau title',
  })

export const editorialHeadingBlock = defineBlock({
  schema: editorialHeadingBlockSchema,
  catalog: [
    {
      type: 'heading2',
      label: 'Judul bagian (H2)',
      description: 'Judul bagian utama. Gunakan berurutan: H2 lalu H3, jangan melompat level.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [{ key: 'content', label: 'Teks judul', kind: 'text', required: true, max: 1000 }],
      example: { type: 'heading2', content: 'Dari dunia nyata ke 3D Gaussian Splat' },
      aliases: { content: ['text', 'title'] },
    },
    {
      type: 'heading3',
      label: 'Sub-judul (H3)',
      description: 'Sub-judul di bawah sebuah H2.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [{ key: 'content', label: 'Teks sub-judul', kind: 'text', required: true, max: 1000 }],
      example: { type: 'heading3', content: 'Capture once, use everywhere' },
      aliases: { content: ['text', 'title'] },
    },
  ],
})
