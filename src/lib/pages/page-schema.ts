/**
 * Dynamic pages (`Page` rows rendered at `/<slug>`): shared input contract.
 * Used by the Studio page editor, `/api/pages` and the MCP server, so all three
 * accept exactly the same shape. Safe for client and server.
 */
import { z } from 'zod'

/**
 * Top-level segments that already belong to the app, public assets or legacy
 * redirects. A page slug may never shadow one of them.
 */
export const RESERVED_PAGE_SLUGS: ReadonlySet<string> = new Set([
  // App routes
  'about', 'admin', 'api', 'contact', 'journal', 'pawon', 'portfolio', 'services',
  // Next.js / metadata files
  '_next', 'sitemap.xml', 'robots.txt', 'favicon.ico', 'icon', 'apple-icon', 'manifest', 'site.webmanifest',
  // Public asset folders and files
  'brand', 'images', 'tours', 'uploads', 'videos', 'fonts', 'static',
  // Legacy routes that 308-redirect (next.config.mjs)
  'artikel', 'kontak', 'layanan', 'portofolio', 'solusi', 'solutions', 'tentang',
  // Reserved for future use / common collisions
  'search', 'login', 'logout', 'preview', 'docs', 'blog', 'home', 'index',
])

export const PAGE_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const
export type PageStatus = (typeof PAGE_STATUSES)[number]

export const pageSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Slug minimal 2 karakter.')
  .max(80, 'Slug maksimal 80 karakter.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya huruf kecil, angka, dan tanda hubung (mis. kampanye-wedding).')
  .refine((s) => !RESERVED_PAGE_SLUGS.has(s), { message: 'Slug ini sudah dipakai oleh route situs. Pilih slug lain.' })

/** Fields an editor or MCP client may set. `blocks` is validated separately against the block catalogue. */
export const pageInputSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi.').max(200),
  slug: pageSlugSchema,
  metaTitle: z.string().trim().max(120).optional().nullable(),
  metaDescription: z.string().trim().max(320).optional().nullable(),
  ogImage: z.string().trim().max(1000).optional().nullable(),
  ogImageAlt: z.string().trim().max(300).optional().nullable(),
  robots: z.enum(['index, follow', 'noindex, follow', 'noindex, nofollow']).optional(),
  blocks: z.array(z.unknown()).max(60, 'Maksimal 60 blok per halaman.'),
})
export type PageInput = z.infer<typeof pageInputSchema>

/** Partial update; `expectedUpdatedAt` enables optimistic concurrency. */
export const pagePatchSchema = pageInputSchema.partial().extend({
  expectedUpdatedAt: z.string().optional(),
})
export type PagePatch = z.infer<typeof pagePatchSchema>

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
