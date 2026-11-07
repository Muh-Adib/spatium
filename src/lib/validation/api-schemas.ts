import { z } from 'zod'
import { NextResponse } from 'next/server'
import { normaliseWhatsappNumber } from '@/lib/contact/public-contact'

// --- 1. Articles Mutation Schemas --------------------------------------------
export const createArticleSchema = z.object({
  title: z.string().min(1, 'Judul artikel wajib diisi').max(300, 'Judul terlalu panjang'),
  slug: z.string().min(1, 'Slug wajib diisi').max(200, 'Slug terlalu panjang').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  content: z.string().optional().default(''),
  excerpt: z.string().max(1000).optional().default(''),
  category: z.string().max(100).optional().default(''),
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
/** Social networks the public footer knows how to label (src/lib/content/spatium.ts). */
export const SOCIAL_NETWORKS = ['instagram', 'linkedin', 'youtube', 'tiktok', 'facebook', 'x', 'vimeo', 'behance'] as const

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter.`).nullish()

/** Empty string clears the field; anything else must be an absolute https URL. */
const httpsUrlOrEmpty = z
  .string()
  .trim()
  .max(500, 'URL maksimal 500 karakter.')
  .refine((value) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && !url.username && !url.password
    } catch {
      return false
    }
  }, 'Gunakan URL https:// lengkap.')

/** Local asset path (`/brand/x.svg`) or https URL; empty clears it. */
const assetPathOrUrl = z
  .string()
  .trim()
  .max(500, 'Path maksimal 500 karakter.')
  .refine((value) => !value || (/^\/(?!\/)[\w\-./]+$/.test(value) && !value.includes('..')) || httpsUrlOrEmpty.safeParse(value).success, 'Gunakan path lokal (mis. /brand/logo.svg) atau URL https://.')

/**
 * WhatsApp number: '' clears it; otherwise normalised to E.164 digits without
 * "+" (spaces/dashes removed, leading 0 → 62) and rejected when not 8–15 digits.
 */
const whatsappNumberOrEmpty = z
  .string()
  .trim()
  .max(30, 'Nomor WhatsApp maksimal 30 karakter.')
  .transform((value, ctx) => {
    if (!value) return ''
    const digits = normaliseWhatsappNumber(value)
    if (!digits) {
      ctx.addIssue({ code: 'custom', message: 'Nomor WhatsApp tidak valid. Gunakan format internasional, mis. +62 812 3456 7890.' })
      return z.NEVER
    }
    return digits
  })

/** Phone for display and tel: links: digits, spaces, + ( ) - . only. */
const phoneOrEmpty = z
  .string()
  .trim()
  .max(30, 'Telepon maksimal 30 karakter.')
  .refine((value) => !value || (/^\+?[\d\s().-]+$/.test(value) && (value.match(/\d/g) ?? []).length >= 6), 'Telepon hanya angka, spasi, +, (, ), - dan minimal 6 digit.')

/**
 * Site settings (`site_configs`, single row). Every field is optional: only
 * keys present in the request are written, so omitted fields keep their value.
 */
export const settingsMutationSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama situs wajib diisi.').max(200, 'Nama situs maksimal 200 karakter.').optional(),
    tagline: optionalText(300, 'Tagline'),
    description: optionalText(500, 'Deskripsi'),
    url: z.string().trim().min(1, 'URL situs wajib diisi.').max(300).optional(),
    email: z.string().trim().toLowerCase().max(200, 'Email maksimal 200 karakter.').refine((value) => !value || z.email().safeParse(value).success, 'Format email tidak valid.').nullish(),
    phone: phoneOrEmpty.nullish(),
    whatsapp: whatsappNumberOrEmpty.nullish(),
    whatsappMessage: optionalText(500, 'Pesan WhatsApp'),
    address: optionalText(500, 'Alamat'),
    openingHours: optionalText(300, 'Jam operasional'),
    logoUrl: assetPathOrUrl.nullish(),
    faviconUrl: assetPathOrUrl.nullish(),
    socialLinks: z.partialRecord(z.enum(SOCIAL_NETWORKS), httpsUrlOrEmpty).optional(),
  })
  .strict()

export type SettingsMutation = z.infer<typeof settingsMutationSchema>

// --- 3. Keywords Mutation Schema ---------------------------------------------
export const createKeywordSchema = z.object({
  keyword: z.string().min(1, 'Keyword wajib diisi').max(200),
  locale: z.enum(['id', 'en']).optional().default('id'),
  intent: z.enum(['informational', 'navigational', 'transactional', 'commercial']).optional().default('informational'),
  targetUrl: z.string().max(500).optional().nullable(),
  priorityScore: z.number().min(0).max(100).optional().default(50),
})

// --- 4-6. Catalog Mutation Schemas (portfolio, service, category) ------------
// Shared building blocks. JSON-ish fields (metrics, features, …) stay loose here
// and are serialised by the route; blocks are validated by the block schema.
const catalogStatusSchema = z.enum(['draft', 'in_review', 'approved', 'published', 'archived'])
const nullableText = (max: number) => z.string().max(max, `Teks melebihi ${max} karakter.`).nullish()
const catalogSlugSchema = z.string().trim().min(1, 'Slug wajib diisi.').max(200, 'Slug terlalu panjang.')
const positiveIdSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/, 'ID harus berupa angka.').transform(Number),
])
const intLikeSchema = z.union([
  z.number().int(),
  z.string().trim().regex(/^-?\d*$/, 'Nilai harus berupa angka bulat.'),
])
const jsonObjectOrStringSchema = z.union([z.record(z.string(), z.unknown()), z.string().max(20000)]).nullish()
const keyphrasesSchema = z.union([z.array(z.string().max(200)).max(50), z.string().max(5000)]).nullish()
const linkedIdsSchema = z.array(positiveIdSchema).max(200).optional()

export const serviceMutationSchema = z.object({
  id: positiveIdSchema.nullish(),
  name: z.string().trim().min(1, 'Nama layanan wajib diisi.').max(200),
  slug: catalogSlugSchema,
  categoryId: positiveIdSchema.nullish(),
  indexNumber: nullableText(20),
  categoryBadge: nullableText(200),
  highlightWord: nullableText(200),
  shortDescription: nullableText(1000),
  longDescription: nullableText(20000),
  description: nullableText(20000),
  whatsappPrompt: nullableText(1000),
  icon: nullableText(200),
  heroImage: nullableText(1000),
  primaryMedia: z.unknown().optional(),
  metrics: z.unknown().optional(),
  features: z.unknown().optional(),
  deliverables: z.unknown().optional(),
  technologies: z.unknown().optional(),
  faq: z.unknown().optional(),
  blocks: z.unknown().optional(),
  order: intLikeSchema.nullish(),
  featured: z.boolean().optional(),
  status: catalogStatusSchema.optional(),
  metaTitle: nullableText(300),
  metaDescription: nullableText(500),
  focusKeyphrase: nullableText(200),
  relatedKeyphrases: keyphrasesSchema,
  seoData: jsonObjectOrStringSchema,
  portfolioIds: linkedIdsSchema,
})
export type ServiceMutationInput = z.infer<typeof serviceMutationSchema>

export const serviceCategoryMutationSchema = z.object({
  id: positiveIdSchema.nullish(),
  slug: catalogSlugSchema,
  title: z.string().trim().min(1, 'Judul departemen wajib diisi.').max(200),
  tag: nullableText(200),
  shortDescription: nullableText(1000),
  heroImage: nullableText(1000),
  themePreset: nullableText(50),
  keyOutcomes: z.unknown().optional(),
  blocks: z.unknown().optional(),
  order: intLikeSchema.nullish(),
  status: catalogStatusSchema.optional(),
  showInNav: z.boolean().optional(),
  metaTitle: nullableText(300),
  metaDescription: nullableText(500),
  focusKeyphrase: nullableText(200),
  relatedKeyphrases: keyphrasesSchema,
  seoData: jsonObjectOrStringSchema,
})
export type ServiceCategoryMutationInput = z.infer<typeof serviceCategoryMutationSchema>

export const portfolioMutationSchema = z.object({
  id: positiveIdSchema.nullish(),
  title: z.string().trim().min(1, 'Judul portofolio wajib diisi.').max(200),
  slug: catalogSlugSchema,
  client: nullableText(200),
  summary: nullableText(2000),
  category: nullableText(100),
  heroImage: nullableText(1000),
  featured: z.boolean().optional(),
  year: z.union([z.number().int().min(1900).max(2200), z.string().trim().regex(/^(\d{4})?$/, 'Tahun harus 4 digit.')]).nullish(),
  status: catalogStatusSchema.optional(),
  challenge: nullableText(20000),
  approach: nullableText(20000),
  solution: nullableText(20000),
  process: nullableText(20000),
  result: nullableText(20000),
  liveUrl: nullableText(1000),
  metrics: z.unknown().optional(),
  technologies: z.unknown().optional(),
  blocks: z.unknown().optional(),
  metaTitle: nullableText(300),
  metaDescription: nullableText(500),
  focusKeyphrase: nullableText(200),
  relatedKeyphrases: keyphrasesSchema,
  seoData: jsonObjectOrStringSchema,
})
export type PortfolioMutationInput = z.infer<typeof portfolioMutationSchema>

/**
 * Like `validateBody`, but in the `{ success, error, issues }` shape the catalog
 * managers read: `error` is the first readable issue so an alert can show it.
 */
export function validateCatalogBody<T>(schema: z.ZodType<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(body)
  if (result.success) return { success: true, data: result.data }
  const issues = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
  const first = issues[0]
  return {
    success: false,
    response: NextResponse.json(
      {
        success: false,
        error: first ? `${first.field ? `${first.field}: ` : ''}${first.message}` : 'Data request tidak valid.',
        issues,
      },
      { status: 400 },
    ),
  }
}

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
    const first = result.error.issues[0]
    return {
      success: false,
      response: NextResponse.json(
        {
          // Readable for Studio UIs that only show `error`; `issues` keeps per-field detail.
          error: first ? (first.path.length ? `${first.path.join('.')}: ${first.message}` : first.message) : 'Data request tidak valid.',
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
