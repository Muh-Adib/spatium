/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'
import { safeUrlSchema } from '@/lib/blocks/primitives'

export const studioCtaBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('studio-cta'),
  headline: z.string().max(300).optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  buttonText: z.string().max(100).optional(),
  buttonUrl: safeUrlSchema.optional(),
  style: z.string().max(50).optional(),
  badge: z.string().max(100).optional(),
})

export const studioCtaBlock = defineBlock({
  schema: studioCtaBlockSchema,
  catalog: [
    {
      type: 'studio-cta',
      label: 'CTA sederhana',
      description: 'Ajakan singkat dengan satu tombol.',
      category: 'conversion',
      targets: ALL_TARGETS,
      fields: [
        { key: 'headline', label: 'Judul', kind: 'text', required: true },
        { key: 'description', label: 'Deskripsi', kind: 'textarea' },
        { key: 'buttonText', label: 'Teks tombol', kind: 'text' },
        { key: 'buttonUrl', label: 'URL tombol', kind: 'url' },
      ],
      example: { type: 'studio-cta', headline: 'Elevate your space with us!', buttonText: 'Mulai proyek', buttonUrl: '/contact' },
      aliases: { headline: ['title'] },
    },
  ],
})
