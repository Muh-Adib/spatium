/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const textEditorialBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('text-editorial'),
    leadText: z.string().max(5000).optional(),
    lead: z.string().max(5000).optional(),
    body: z.string().max(50000).optional(),
    content: z.string().max(50000).optional(),
    columns: z.union([z.number(), z.string()]).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const textEditorialBlock = defineBlock({
  schema: textEditorialBlockSchema,
  catalog: [
    {
      type: 'text-editorial',
      label: 'Teks editorial',
      description: 'Paragraf pembuka (lead) yang lebih besar diikuti isi teks.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [
        { key: 'leadText', label: 'Lead', kind: 'textarea' },
        { key: 'body', label: 'Isi', kind: 'textarea' },
      ],
      example: { type: 'text-editorial', leadText: 'Kalimat pembuka yang merangkum bagian ini.', body: 'Isi teks bagian ini.' },
      aliases: { leadText: ['lead'], body: ['content'] },
    },
  ],
})
