/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const visualShowcaseGalleryBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('visual-showcase-gallery'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  images: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().max(200).optional(),
        caption: z.string().max(300).optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .optional()
    .default([]),
  items: z
    .array(
      z.object({
        title: z.string().max(200),
        category: z.string().max(100).optional(),
        image: z.string().optional(),
        src: z.string().optional(),
        metric: z.string().max(100).optional(),
        desc: z.string().max(2000).optional(),
        description: z.string().max(2000).optional(),
      })
    )
    .optional(),
})

export const visualShowcaseGalleryBlock = defineBlock({
  schema: visualShowcaseGalleryBlockSchema,
  catalog: [
    {
      type: 'visual-showcase-gallery',
      label: 'Galeri gambar',
      description: 'Beberapa gambar dalam grid. Setiap gambar wajib punya alt text.',
      category: 'media',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        { key: 'description', label: 'Deskripsi', kind: 'textarea' },
        {
          key: 'images',
          label: 'Gambar',
          kind: 'list',
          itemLabel: 'Gambar',
          max: 24,
          fields: [
            { key: 'src', label: 'Gambar', kind: 'image', altKey: 'alt', required: true },
            { key: 'caption', label: 'Keterangan', kind: 'text' },
          ],
        },
      ],
      example: {
        type: 'visual-showcase-gallery',
        title: 'Dari point cloud ke splat',
        images: [
          { src: '/images/spatium/web/pipe-02-pointcloud.webp', alt: 'Rumah sebagai point cloud', caption: 'Point cloud' },
          { src: '/images/spatium/web/pipe-04-splat.webp', alt: 'Rumah yang sama sebagai 3D Gaussian Splat', caption: '3D Gaussian Splat' },
        ],
      },
    },
  ],
})
