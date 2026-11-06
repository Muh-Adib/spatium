/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const portfolioCaseStudyBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('portfolio-case-study'),
  eyebrow: z.string().max(200).optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(3000).optional(),
  challenge: z.string().max(10000).optional(),
  approach: z.string().max(10000).optional(),
  solution: z.string().max(10000).optional(),
  result: z.string().max(10000).optional(),
  highlights: z.array(z.object({
    label: z.string().optional(),
    value: z.string().optional(),
    detail: z.string().optional(),
  }).passthrough()).optional(),
  data: z.record(z.string(), z.any()).optional(),
}).passthrough()

export const portfolioCaseStudyBlock = defineBlock({
  schema: portfolioCaseStudyBlockSchema,
  catalog: [
    {
      type: 'portfolio-case-study',
      label: 'Narasi studi kasus',
      description: 'Tantangan, pendekatan, solusi, dan hasil.',
      category: 'content',
      targets: ['portfolio'],
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        { key: 'challenge', label: 'Tantangan', kind: 'textarea' },
        { key: 'approach', label: 'Pendekatan', kind: 'textarea' },
        { key: 'solution', label: 'Solusi', kind: 'textarea' },
        { key: 'result', label: 'Hasil', kind: 'textarea' },
      ],
      example: { type: 'portfolio-case-study', title: 'Studi kasus', challenge: 'Tantangan proyek.', approach: 'Pendekatan yang dipakai.' },
    },
  ],
})
