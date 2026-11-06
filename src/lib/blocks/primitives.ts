/**
 * Zod primitives shared by block definitions (`src/blocks/<type>/definition.ts`).
 * No React, no server-only dependencies.
 */
import { z } from 'zod'

export const BLOCK_SCHEMA_VERSION = 1
export const MAX_BLOCKS_PER_PAGE = 60

export const safeUrlSchema = z.string().refine(
  (url) => {
    if (!url) return true
    return (
      url.startsWith('/') ||
      url.startsWith('https://') ||
      url.startsWith('http://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('#')
    )
  },
  { message: 'URL harus diawali dengan /, https://, http://, mailto:, tel:, atau #' }
)

export const iconNameSchema = z.string().regex(/^[a-z0-9-]+$/i, {
  message: 'Nama ikon hanya boleh berupa huruf, angka, dan tanda hubung (-)',
})
