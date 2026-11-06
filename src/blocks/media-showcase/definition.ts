/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const mediaShowcaseBlockSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['media-showcase', 'editorial-image', 'image']),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  caption: z.string().max(500).optional(),
  badge: z.string().max(100).optional(),
  src: z.string().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  heroImage: z.string().optional(),
  alt: z.string().max(300).optional().default(''),
  altText: z.string().max(300).optional(),
  aspectRatio: z.string().max(50).optional(),
  frameStyle: z.string().max(50).optional(),
  imageLabel: z.string().max(300).optional(),
  windowTitle: z.string().max(300).optional(),
  floatingBadges: z
    .array(
      z.object({
        label: z.string().max(100),
        icon: z.string().optional(),
      })
    )
    .optional()
    .default([]),
})

export const mediaShowcaseBlock = defineBlock({
  schema: mediaShowcaseBlockSchema,
  catalog: [
    {
      type: 'media-showcase',
      label: 'Gambar tunggal',
      description: 'Satu gambar besar dengan keterangan. Alt text wajib.',
      category: 'media',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        { key: 'src', label: 'Gambar', kind: 'image', altKey: 'alt', required: true },
        { key: 'caption', label: 'Keterangan', kind: 'textarea' },
      ],
      example: {
        type: 'media-showcase',
        src: '/images/spatium/web/pipe-04-splat.webp',
        alt: 'Rumah modern yang direkam sebagai 3D Gaussian Splat',
        caption: 'Contoh hasil 3D Gaussian Splat.',
      },
      aliases: { src: ['image', 'imageUrl', 'url', 'heroImage'], alt: ['altText'] },
    },
  ],
})
