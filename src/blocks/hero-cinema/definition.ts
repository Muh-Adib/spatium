/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const heroCinemaBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('hero-cinema'),
    badge: z.string().max(200).optional(),
    headline: z.string().max(500).optional(),
    title: z.string().max(500).optional(),
    subheadline: z.string().max(1000).optional(),
    subtitle: z.string().max(1000).optional(),
    description: z.string().max(5000).optional(),
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
    media: z
      .object({
        type: z.string().optional(),
        src: z.string().optional(),
        poster: z.string().optional(),
        url: z.string().optional(),
        alt: z.string().optional(),
      })
      .passthrough()
      .optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const heroCinemaBlock = defineBlock({
  schema: heroCinemaBlockSchema,
  catalog: [
    {
      type: 'hero-cinema',
      label: 'Hero sinematik',
      description: 'Pembuka halaman: badge, headline besar, subjudul, dua tombol aksi, dan media opsional.',
      category: 'hero',
      targets: ALL_TARGETS,
      fields: [
        { key: 'badge', label: 'Badge', kind: 'text', max: 200 },
        { key: 'headline', label: 'Headline', kind: 'text', required: true, max: 500 },
        { key: 'subheadline', label: 'Subjudul', kind: 'textarea', max: 1000 },
        { key: 'primaryCta', label: 'Tombol utama', kind: 'link' },
        { key: 'secondaryCta', label: 'Tombol kedua', kind: 'link' },
      ],
      example: {
        type: 'hero-cinema',
        badge: 'Spatial Technology Studio',
        headline: 'Real places. New perspectives.',
        subheadline: 'Digital twin untuk industri kreatif — ruang nyata yang bisa dijelajahi dari mana saja.',
        primaryCta: { label: 'Mulai proyek', href: '/contact' },
        secondaryCta: { label: 'Lihat portofolio', href: '/portfolio' },
      },
      aliases: { headline: ['title'], subheadline: ['subtitle', 'description'] },
    },
  ],
  pageHero: true,
})
