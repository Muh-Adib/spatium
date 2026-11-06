/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'
import { safeUrlSchema } from '@/lib/blocks/primitives'

/** SuperSplat scene ids are short alphanumeric hashes (e.g. "e318925e"). */
export const splatIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{4,64}$/, {
  message: 'ID scene SuperSplat hanya boleh huruf, angka, garis bawah, atau tanda hubung.',
})

export const splatViewerBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('splat-viewer'),
  /** SuperSplat scene id — the viewer URL is built server-side, never taken from input. */
  splatId: splatIdSchema,
  title: z.string().max(200).optional(),
  caption: z.string().max(1000).optional(),
  /** Optional still shown until the visitor starts the 3D viewer. */
  posterUrl: safeUrlSchema.optional(),
  posterAlt: z.string().max(300).optional(),
  /** Load the viewer immediately instead of on click (heavier; off by default). */
  autoLoad: z.boolean().optional(),
}).refine((b) => !b.posterUrl || Boolean(b.posterAlt && b.posterAlt.trim()), {
  message: 'posterAlt wajib diisi bila posterUrl dipakai.',
  path: ['posterAlt'],
})

export const splatViewerBlock = defineBlock({
  schema: splatViewerBlockSchema,
  catalog: [
    {
      type: 'splat-viewer',
      label: 'Viewer 3D Gaussian Splat',
      description: 'Menyematkan scene SuperSplat yang bisa dijelajahi. Viewer dimuat saat pengunjung mengeklik, kecuali autoLoad aktif.',
      category: 'spatial',
      targets: ALL_TARGETS,
      fields: [
        { key: 'splatId', label: 'ID scene SuperSplat', kind: 'text', required: true, help: 'Bagian setelah ?id= atau /scene/ pada URL SuperSplat, mis. e318925e.' },
        { key: 'title', label: 'Judul', kind: 'text', max: 200 },
        { key: 'caption', label: 'Keterangan', kind: 'textarea', max: 1000 },
        { key: 'posterUrl', label: 'Gambar poster', kind: 'image', altKey: 'posterAlt' },
        { key: 'autoLoad', label: 'Muat viewer otomatis', kind: 'boolean', help: 'Lebih berat untuk pengunjung. Biarkan nonaktif kecuali scene adalah fokus halaman.' },
      ],
      example: { type: 'splat-viewer', splatId: 'e318925e', title: 'Jelajahi ruangnya', caption: 'Drag untuk memutar, scroll untuk zoom.' },
    },
  ],
})
