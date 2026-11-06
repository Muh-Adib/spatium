/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const faqAccordionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('faq-accordion'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        question: z.string().max(500),
        answer: z.string().max(5000),
      })
    )
    .optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().max(500),
        answer: z.string().max(5000),
      })
    )
    .optional(),
})

export const faqAccordionBlock = defineBlock({
  schema: faqAccordionBlockSchema,
  catalog: [
    {
      type: 'faq-accordion',
      label: 'FAQ',
      description: 'Daftar pertanyaan dan jawaban yang bisa dibuka-tutup.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        {
          key: 'items',
          label: 'Pertanyaan',
          kind: 'list',
          itemLabel: 'Pertanyaan',
          max: 30,
          fields: [
            { key: 'question', label: 'Pertanyaan', kind: 'text', required: true },
            { key: 'answer', label: 'Jawaban', kind: 'textarea', required: true },
          ],
        },
      ],
      example: {
        type: 'faq-accordion',
        title: 'Pertanyaan umum',
        items: [
          {
            question: 'Apa itu 3D Gaussian Splat?',
            answer: 'Representasi 3D yang ringan, fotorealistis, dan imersif yang dibangun dari capture ruang nyata.',
          },
        ],
      },
      aliases: { items: ['faqs'] },
    },
  ],
})
