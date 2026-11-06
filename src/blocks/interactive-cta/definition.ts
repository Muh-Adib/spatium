/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const interactiveCtaBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('interactive-cta'),
    title: z.string().max(500).optional(),
    headline: z.string().max(500).optional(),
    subheadline: z.string().max(1000).optional(),
    description: z.string().max(5000).optional(),
    badge: z.string().max(200).optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    secondaryCtaText: z.string().optional(),
    secondaryCtaLink: z.string().optional(),
    primaryCta: z
      .object({
        label: z.string().optional(),
        href: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    secondaryCta: z
      .object({
        label: z.string().optional(),
        href: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const interactiveCtaBlock = defineBlock({
  schema: interactiveCtaBlockSchema,
  catalog: [
    {
      type: 'interactive-cta',
      label: 'Ajakan konsultasi',
      description: 'Banner ajakan dengan judul, deskripsi, dan dua tombol.',
      category: 'conversion',
      targets: ALL_TARGETS,
      fields: [
        { key: 'badge', label: 'Badge', kind: 'text' },
        { key: 'title', label: 'Judul', kind: 'text', required: true },
        { key: 'description', label: 'Deskripsi', kind: 'textarea' },
        { key: 'primaryCta', label: 'Tombol utama', kind: 'link' },
        { key: 'secondaryCta', label: 'Tombol kedua', kind: 'link' },
      ],
      example: {
        type: 'interactive-cta',
        title: 'Every space has a story. Let’s make it explorable.',
        primaryCta: { label: 'Diskusikan ruang Anda', href: '/contact' },
      },
      aliases: { title: ['headline'], description: ['subheadline'] },
    },
  ],
})
