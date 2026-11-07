/**
 * Input contracts for the Studio media library (`/api/media`, `/api/upload`).
 * Pure and client-safe so it can be unit-tested directly. Who may upload,
 * manage or delete media: capabilities `media:upload`, `media:manage` and
 * `media:delete` in `src/lib/auth/capability-matrix.ts`.
 */
import { z } from 'zod'

/** Largest accepted upload, before optimisation. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const mediaId = z.coerce.number({ error: 'ID media tidak valid.' }).int('ID media tidak valid.').positive('ID media tidak valid.')

const altTextSchema = z.object({
  id: z.string().trim().max(300, 'Alt text maksimal 300 karakter.').optional(),
  en: z.string().trim().max(300, 'Alt text maksimal 300 karakter.').optional(),
})

const focalPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

/** Editable metadata fields; every field is optional (partial update). */
export const mediaMetadataPatchSchema = z.object({
  altText: altTextSchema.optional(),
  title: z.string().trim().max(200, 'Judul maksimal 200 karakter.').optional(),
  caption: z.string().trim().max(500, 'Caption maksimal 500 karakter.').optional(),
  description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter.').optional(),
  decorative: z.boolean().optional(),
  focalPoint: focalPointSchema.optional(),
  credit: z.string().trim().max(200, 'Kredit maksimal 200 karakter.').optional(),
})
export type MediaMetadataPatch = z.infer<typeof mediaMetadataPatchSchema>

/** PATCH /api/media */
export const mediaPatchBodySchema = mediaMetadataPatchSchema.extend({ id: mediaId })

/** POST /api/media with a JSON body. */
export const mediaActionBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('rename'),
    id: mediaId,
    newFileName: z
      .string()
      .trim()
      .min(1, 'Nama file baru wajib diisi.')
      .max(120, 'Nama file maksimal 120 karakter.')
      .refine((s) => !/[\\/]/.test(s) && !s.includes('..'), 'Nama file tidak boleh berisi path.'),
  }),
  z.object({
    action: z.literal('bulk_update'),
    items: z.array(mediaPatchBodySchema).min(1, 'Daftar media kosong.').max(100, 'Maksimal 100 media per permintaan.'),
  }),
])

/** Readable messages for a failed parse: `field: message`. */
export function zodIssueMessages(error: { issues: { path: PropertyKey[]; message: string }[] }): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.map(String).join('.')}: ${i.message}` : i.message))
}

/** Size error shared by both upload endpoints. */
export function oversizeMessage(bytes: number): string {
  return `Ukuran file (${(bytes / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal 5 MB.`
}
