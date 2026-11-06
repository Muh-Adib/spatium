import { z } from 'zod'
import { NextResponse } from 'next/server'

// --- 1. Articles Mutation Schemas --------------------------------------------
export const createArticleSchema = z.object({
  title: z.string().min(1, 'Judul artikel wajib diisi').max(300, 'Judul terlalu panjang'),
  slug: z.string().min(1, 'Slug wajib diisi').max(200, 'Slug terlalu panjang').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  content: z.string().optional().default(''),
  excerpt: z.string().max(1000).optional().default(''),
  category: z.string().max(100).optional().default('Teknologi'),
  tags: z.preprocess((value) => typeof value === 'string' ? value.split(',').map((tag) => tag.trim()).filter(Boolean) : value, z.array(z.string().trim().min(1).max(100).regex(/[\p{L}\p{N}]/u, 'Tag harus memuat huruf atau angka')).max(50)).optional(),
  featuredImage: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().max(1000).optional().nullable(),
  coverAlt: z.string().max(2000).optional(),
  seoData: z.object({
    seoTitle: z.string().max(300).nullable().optional(),
    metaDescription: z.string().max(500).nullable().optional(),
    openGraph: z.object({ imageAlt: z.string().max(2000).optional() }).passthrough().nullable().optional(),
    twitter: z.record(z.string(), z.unknown()).nullable().optional(),
    robots: z.record(z.string(), z.unknown()).nullable().optional(),
  }).passthrough().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'scheduled', 'published', 'archived']).optional().default('draft'),
  metaTitle: z.string().max(300).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  focusKeyphrase: z.string().max(200).optional().nullable(),
  locale: z.enum(['id', 'en']).optional().default('id'),
  author: z.string().max(100).optional().nullable(),
})

export const updateArticleSchema = createArticleSchema.partial().extend({
  slug: z.string().min(1, 'Slug artikel wajib ditentukan'),
})

// --- 2. Settings Mutation Schema ---------------------------------------------
export const settingsMutationSchema = z.object({
  siteName: z.string().min(1).max(200).optional(),
  tagline: z.string().max(300).optional().nullable(),
  metaTitle: z.string().max(300).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  socialLinks: z.record(z.string(), z.unknown()).optional(),
  seoSettings: z.record(z.string(), z.unknown()).optional(),
  brandSettings: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

// --- 3. Keywords Mutation Schema ---------------------------------------------
export const createKeywordSchema = z.object({
  keyword: z.string().min(1, 'Keyword wajib diisi').max(200),
  locale: z.enum(['id', 'en']).optional().default('id'),
  intent: z.enum(['informational', 'navigational', 'transactional', 'commercial']).optional().default('informational'),
  targetUrl: z.string().max(500).optional().nullable(),
  priorityScore: z.number().min(0).max(100).optional().default(50),
})

// --- 4. Service Mutation Schema ----------------------------------------------
export const serviceMutationSchema = z.object({
  name: z.string().min(1, 'Nama layanan wajib diisi').max(200),
  slug: z.string().min(1, 'Slug layanan wajib diisi').max(200),
  shortDescription: z.string().max(1000).optional().nullable(),
  description: z.string().optional().nullable(),
  icon: z.string().max(200).optional().nullable(),
  heroImage: z.string().max(1000).optional().nullable(),
  order: z.union([z.number(), z.string()]).optional().default(0),
  featured: z.boolean().optional().default(false),
  features: z.unknown().optional(),
  deliverables: z.unknown().optional(),
  technologies: z.unknown().optional(),
  faq: z.unknown().optional(),
})

// --- 5. Portfolio Mutation Schema --------------------------------------------
export const portfolioMutationSchema = z.object({
  title: z.string().min(1, 'Judul portofolio wajib diisi').max(200),
  slug: z.string().min(1, 'Slug portofolio wajib diisi').max(200),
  client: z.string().max(200).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  featuredImage: z.string().max(1000).optional().nullable(),
  heroImage: z.string().max(1000).optional().nullable(),
  featured: z.boolean().optional().default(false),
  year: z.union([z.number(), z.string()]).optional().nullable(),
  status: z.enum(['draft', 'in_review', 'approved', 'published', 'archived']).optional().default('published'),
  challenge: z.string().optional().nullable(),
  approach: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  process: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  liveUrl: z.string().max(1000).optional().nullable(),
  metrics: z.unknown().optional(),
  technologies: z.unknown().optional(),
  blocks: z.unknown().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  focusKeyphrase: z.string().optional().nullable(),
  relatedKeyphrases: z.unknown().optional(),
})

// --- 7. Database Reset Operation Schema --------------------------------------
export const databaseResetSchema = z.object({
  confirm: z.literal(true, {
    error: 'Konfirmasi reset database wajib bernilai true',
  }),
})

// --- 8. Indexing Retrigger Schema -------------------------------------------
export const retriggerIndexingSchema = z
  .object({
    url: z.string().trim().optional(),
    type: z.enum(['article', 'page', 'custom']).optional(),
    idOrSlug: z.union([z.string().trim(), z.number()]).optional(),
    provider: z.enum(['all', 'indexnow', 'google']).optional().default('all'),
  })
  .refine(
    (data) =>
      Boolean(
        (data.url && data.url.length > 0) ||
          (data.type && data.idOrSlug !== undefined && data.idOrSlug !== '')
      ),
    {
      message: 'Wajib menyertakan parameter url, atau kombinasi type dan idOrSlug.',
      path: ['url'],
    }
  )

export type RetriggerIndexingInput = z.infer<typeof retriggerIndexingSchema>

// --- 9. Indexing Status Query Schema ----------------------------------------
export const indexingStatusQuerySchema = z
  .object({
    url: z.string().trim().optional(),
    type: z.enum(['article', 'page', 'custom']).optional(),
    idOrSlug: z.string().trim().optional(),
    provider: z.enum(['all', 'indexnow', 'google']).optional().default('all'),
  })
  .refine(
    (data) =>
      Boolean(
        (data.url && data.url.length > 0) ||
          (data.type && data.idOrSlug !== undefined && data.idOrSlug !== '')
      ),
    {
      message: 'Wajib menyertakan parameter url, atau kombinasi type dan idOrSlug.',
      path: ['url'],
    }
  )

export type IndexingStatusQueryInput = z.infer<typeof indexingStatusQuerySchema>

// --- 10. Indexing History Query Schema ---------------------------------------
export const indexingHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  provider: z.enum(['all', 'indexnow', 'google']).optional(),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
})

export type IndexingHistoryQueryInput = z.infer<typeof indexingHistoryQuerySchema>

// --- Validation Helper -------------------------------------------------------
export function validateBody<T>(schema: z.ZodType<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Data request tidak valid.',
          issues: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    }
  }
  return { success: true, data: result.data }
}
