/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const featureBentoGridBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('feature-bento-grid'),
  variant: z.string().max(100).optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        tag: z.string().max(100).optional(),
        badge: z.string().max(100).optional(),
        icon: z.string().optional(),
        size: z.string().max(50).optional(),
        image: z.string().optional(),
        metric: z.string().max(100).optional(),
        metricLabel: z.string().max(100).optional(),
      })
    )
    .optional(),
  features: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        tag: z.string().max(100).optional(),
        badge: z.string().max(100).optional(),
        icon: z.string().optional(),
        size: z.string().max(50).optional(),
        image: z.string().optional(),
        metric: z.string().max(100).optional(),
        metricLabel: z.string().max(100).optional(),
      })
    )
    .optional(),
})

export const featureBentoGridBlock = defineBlock({
  schema: featureBentoGridBlockSchema,
  catalog: [
    {
      type: 'feature-bento-grid',
      label: 'Grid fitur',
      description: 'Kartu fitur atau manfaat dalam grid. Hindari metrik yang belum terverifikasi.',
      category: 'content',
      targets: ALL_TARGETS,
      fields: [
        { key: 'badge', label: 'Badge', kind: 'text' },
        { key: 'title', label: 'Judul', kind: 'text' },
        { key: 'description', label: 'Deskripsi', kind: 'textarea' },
        {
          key: 'items',
          label: 'Kartu',
          kind: 'list',
          itemLabel: 'Kartu',
          max: 12,
          fields: [
            { key: 'title', label: 'Judul kartu', kind: 'text', required: true },
            { key: 'description', label: 'Deskripsi', kind: 'textarea' },
            { key: 'image', label: 'Gambar', kind: 'url' },
          ],
        },
      ],
      example: {
        type: 'feature-bento-grid',
        title: 'One Point, Unlimited Possibilities',
        items: [
          { title: 'Real-world accuracy', description: 'Skala dan detail nyata sebagai fondasi.' },
          { title: 'Versatile data', description: 'Point cloud, mesh, tekstur, panorama.' },
          { title: 'Multiple outputs', description: '3D, 2D, interaktif, imersif.' },
        ],
      },
      aliases: { items: ['features'], 'items.description': ['desc'] },
    },
  ],
})
