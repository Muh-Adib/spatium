/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const editorialParagraphBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('paragraph'),
    content: z.string().max(20000).optional(),
    text: z.string().max(20000).optional(),
    dropCap: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.content || data.text), {
    message: 'paragraph harus memiliki content atau text',
  })

export const editorialParagraphBlock = defineBlock({
  schema: editorialParagraphBlockSchema,
  catalog: [
    {
      type: 'paragraph',
      label: 'Paragraf',
      description: 'Teks paragraf. Mendukung tautan dan penekanan sederhana (HTML akan disanitasi).',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [{ key: 'content', label: 'Isi paragraf', kind: 'textarea', required: true, max: 20000 }],
      example: { type: 'paragraph', content: 'Tulis isi paragraf di sini.' },
      aliases: { content: ['text'] },
    },
  ],
})
