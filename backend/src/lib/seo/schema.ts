import { z } from 'zod'

// ─── Locale & Internationalization ──────────────────────────────────────────
export const LocaleSchema = z.enum(['id', 'en'])
export type Locale = z.infer<typeof LocaleSchema>

export const LocalizedTextSchema = z.object({
  id: z.string().default(''),
  en: z.string().default(''),
})
export type LocalizedText = z.infer<typeof LocalizedTextSchema>

// ─── Field Source Tracking (Section 2 & 3.5) ────────────────────────────────
export const FieldSourceTypeSchema = z.enum(['human', 'ai', 'ai-edited'])
export type FieldSourceType = z.infer<typeof FieldSourceTypeSchema>

export const FieldSourceMapSchema = z.record(z.string(), FieldSourceTypeSchema)
export type FieldSourceMap = z.infer<typeof FieldSourceMapSchema>

// ─── Robots Directive ───────────────────────────────────────────────────────
export const RobotsDirectiveSchema = z.object({
  index: z.boolean().default(true),
  follow: z.boolean().default(true),
  noarchive: z.boolean().optional(),
  nosnippet: z.boolean().optional(),
  maxImagePreview: z.enum(['none', 'standard', 'large']).default('large').optional(),
  maxSnippet: z.number().optional(),
})
export type RobotsDirective = z.infer<typeof RobotsDirectiveSchema>

// ─── Open Graph & Twitter Cards ─────────────────────────────────────────────
export const OpenGraphMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  type: z.enum(['article', 'website', 'profile', 'book']).default('website'),
  locale: z.string().optional(),
})
export type OpenGraphMetadata = z.infer<typeof OpenGraphMetadataSchema>

export const TwitterMetadataSchema = z.object({
  card: z.enum(['summary', 'summary_large_image', 'app', 'player']).default('summary_large_image'),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
})
export type TwitterMetadata = z.infer<typeof TwitterMetadataSchema>

// ─── Structured Data / JSON-LD Configuration (Section 8) ────────────────────
export const JsonLdConfigSchema = z.object({
  type: z.enum([
    'Article',
    'BlogPosting',
    'Service',
    'CreativeWork',
    'Project',
    'Organization',
    'LocalBusiness',
    'ContactPage',
    'CollectionPage',
    'FAQPage',
    'BreadcrumbList',
  ]).default('Article'),
  properties: z.record(z.string(), z.unknown()).optional(),
  faqItems: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
})
export type JsonLdConfig = z.infer<typeof JsonLdConfigSchema>

// ─── Visual Cover / Hero Model (Section 6) ──────────────────────────────────
export const HeroVisualSchema = z.object({
  mediaId: z.number().optional(),
  url: z.string().min(1, 'Hero image URL wajib ada'),
  altText: LocalizedTextSchema.default({ id: '', en: '' }),
  decorative: z.boolean().default(false),
  caption: z.string().optional(),
  credit: z.string().optional(),
  focalPoint: z.object({
    x: z.number().min(0).max(100).default(50),
    y: z.number().min(0).max(100).default(50),
  }).default({ x: 50, y: 50 }),
  overlay: z.object({
    color: z.string().default('#000000'),
    opacity: z.number().min(0).max(1).default(0.4),
  }).optional(),
  textPosition: z.enum(['left', 'center', 'right', 'bottom']).default('left').optional(),
  priority: z.boolean().default(true),
  videoUrl: z.string().optional(),
  videoPoster: z.string().optional(),
  videoTranscript: z.string().optional(),
  ogImageSource: z.enum(['cover', 'custom']).default('cover'),
})
export type HeroVisual = z.infer<typeof HeroVisualSchema>

// ─── Analysis Indicator (Section 3.2 & 3.3) ─────────────────────────────────
export const AnalysisIndicatorStatusSchema = z.enum(['good', 'ok', 'problem'])
export type AnalysisIndicatorStatus = z.infer<typeof AnalysisIndicatorStatusSchema>

export const AnalysisIndicatorSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: AnalysisIndicatorStatusSchema,
  message: z.string(),
  value: z.union([z.string(), z.number()]).optional(),
  recommendation: z.string().optional(),
})
export type AnalysisIndicator = z.infer<typeof AnalysisIndicatorSchema>

export const AnalysisReportSchema = z.object({
  seoScore: z.number().min(0).max(100).default(0),
  readabilityScore: z.number().min(0).max(100).default(0),
  overallStatus: AnalysisIndicatorStatusSchema.default('ok'),
  indicators: z.array(AnalysisIndicatorSchema).default([]),
  readabilityIndicators: z.array(AnalysisIndicatorSchema).default([]),
  calculatedAt: z.string().default(() => new Date().toISOString()),
})
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>

// ─── Unified Content SEO Object (Section 2) ─────────────────────────────────
export const ContentSeoSchema = z.object({
  locale: LocaleSchema.default('id'),
  translationGroupId: z.string().optional(),
  focusKeyphrase: z.string().default(''),
  relatedKeyphrases: z.array(z.string()).max(5, 'Maksimal 5 related keyphrase').default([]),
  seoTitle: z.string().default(''),
  metaDescription: z.string().default(''),
  slug: z.string().default(''),
  canonicalUrl: z.string().nullable().default(null),
  robots: RobotsDirectiveSchema.default({ index: true, follow: true, maxImagePreview: 'large' }),
  openGraph: OpenGraphMetadataSchema.default({ type: 'website' }),
  twitter: TwitterMetadataSchema.default({ card: 'summary_large_image' }),
  schema: JsonLdConfigSchema.default({ type: 'Article' }),
  breadcrumbTitle: z.string().optional(),
  isCornerstone: z.boolean().default(false),
  primaryCategory: z.string().optional(),
  redirects: z.array(z.string()).default([]),
  analysis: AnalysisReportSchema.optional(),
  fieldSource: FieldSourceMapSchema.default({}),
  heroVisual: HeroVisualSchema.optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
})
export type ContentSeo = z.infer<typeof ContentSeoSchema>

// ─── Media Manager Models (Section 5) ───────────────────────────────────────
export const MediaMetadataSchema = z.object({
  id: z.number().optional(),
  fileName: z.string().min(1, 'Nama file wajib diisi'),
  url: z.string().min(1, 'URL media wajib diisi'),
  altText: LocalizedTextSchema.default({ id: '', en: '' }),
  title: z.string().optional(),
  caption: z.string().optional(),
  description: z.string().optional(),
  decorative: z.boolean().default(false),
  focalPoint: z.object({
    x: z.number().default(50),
    y: z.number().default(50),
  }).default({ x: 50, y: 50 }),
  credit: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  blurHash: z.string().optional(),
  usedIn: z.array(z.string()).default([]),
  uploadedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})
export type MediaMetadata = z.infer<typeof MediaMetadataSchema>

export const MediaAuditIssueSchema = z.object({
  id: z.string(),
  mediaId: z.number(),
  url: z.string(),
  fileName: z.string(),
  type: z.enum([
    'missing_alt_id',
    'missing_alt_en',
    'duplicate_alt',
    'bad_filename',
    'oversized_image',
    'unused_media',
  ]),
  severity: z.enum(['critical', 'warning', 'info']),
  message: z.string(),
})
export type MediaAuditIssue = z.infer<typeof MediaAuditIssueSchema>

export const MediaAuditReportSchema = z.object({
  totalScanned: z.number(),
  missingAltCount: z.number(),
  oversizedCount: z.number(),
  badFilenameCount: z.number(),
  unusedCount: z.number(),
  issues: z.array(MediaAuditIssueSchema),
  scannedAt: z.string(),
})
export type MediaAuditReport = z.infer<typeof MediaAuditReportSchema>

// ─── CTA Block Models (Section 7) ───────────────────────────────────────────
export const CtaContentSchema = z.object({
  title: z.string().min(1, 'Judul CTA wajib ada'),
  description: z.string().default(''),
  primary: z.object({
    label: z.string().min(1, 'Label tombol utama wajib diisi'),
    href: z.string().min(1, 'Tautan tombol utama wajib diisi'),
    rel: z.string().default(''),
    target: z.string().default('_self'),
  }),
  secondary: z.object({
    label: z.string().optional(),
    href: z.string().optional(),
    rel: z.string().default(''),
    target: z.string().default('_self'),
  }).optional(),
  icon: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaAlt: z.string().optional(),
  tracking: z.object({
    eventId: z.string().default('cta_click'),
    utm: z.record(z.string(), z.string()).default({}),
  }).default({ eventId: 'cta_click', utm: {} }),
})
export type CtaContent = z.infer<typeof CtaContentSchema>

export const CtaStyleSchema = z.object({
  variant: z.enum(['banner', 'card', 'inline', 'sticky', 'split']).default('banner'),
  bg: z.string().default('token:brand-600'),
  text: z.string().default('#ffffff'),
  button: z.string().default('token:brand-accent'),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('lg'),
  align: z.enum(['left', 'center', 'right']).default('center'),
  padding: z.enum(['compact', 'standard', 'spacious']).default('standard'),
  darkMode: z.boolean().default(true),
})
export type CtaStyle = z.infer<typeof CtaStyleSchema>

export const CtaPlacementSchema = z.object({
  mode: z.enum(['after-paragraph', 'end-of-article', 'sidebar', 'manual']).default('after-paragraph'),
  index: z.number().min(1).default(3),
  targetCategory: z.string().optional(),
  targetTag: z.string().optional(),
})
export type CtaPlacement = z.infer<typeof CtaPlacementSchema>

export const CtaPresetSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Nama preset CTA wajib diisi'),
  slug: z.string().min(1, 'Slug preset CTA wajib diisi'),
  locale: LocaleSchema.default('id'),
  content: CtaContentSchema,
  style: CtaStyleSchema,
  placement: CtaPlacementSchema.optional(),
  active: z.boolean().default(true),
})
export type CtaPreset = z.infer<typeof CtaPresetSchema>

// ─── Keyword Bank & Planner Models (Section 4) ──────────────────────────────
export const KeywordIntentSchema = z.enum(['informational', 'navigational', 'transactional', 'commercial'])
export type KeywordIntent = z.infer<typeof KeywordIntentSchema>

export const KeywordStatusSchema = z.enum(['planned', 'in_progress', 'published', 'decaying'])
export type KeywordStatus = z.infer<typeof KeywordStatusSchema>

export const KeywordBankItemSchema = z.object({
  id: z.number().optional(),
  keyword: z.string().min(1, 'Kata kunci wajib diisi'),
  locale: LocaleSchema.default('id'),
  intent: KeywordIntentSchema.default('informational'),
  status: KeywordStatusSchema.default('planned'),
  targetContentType: z.enum(['article', 'service', 'portfolio', 'page']).optional(),
  targetContentId: z.number().optional(),
  targetSlug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  gscImpressions: z.number().default(0),
  gscClicks: z.number().default(0),
  gscPosition: z.number().default(0),
  priorityScore: z.number().default(0),
})
export type KeywordBankItem = z.infer<typeof KeywordBankItemSchema>

// ─── Site Audit Models (Section 15.3) ───────────────────────────────────────
export const AuditSeveritySchema = z.enum(['critical', 'warning', 'info'])
export type AuditSeverity = z.infer<typeof AuditSeveritySchema>

export const AuditCategorySchema = z.enum([
  'meta',
  'images',
  'links',
  'headings',
  'schema',
  'hreflang',
  'redirects',
  'performance',
])
export type AuditCategory = z.infer<typeof AuditCategorySchema>

export const SiteAuditIssueSchema = z.object({
  id: z.number().optional(),
  auditId: z.string(),
  severity: AuditSeveritySchema,
  category: AuditCategorySchema,
  urlOrPath: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  contentId: z.number().nullable().optional(),
  title: z.string(),
  description: z.string(),
  recommendation: z.string(),
  resolved: z.boolean().default(false),
})
export type SiteAuditIssue = z.infer<typeof SiteAuditIssueSchema>

// ─── Publication Gate Validation Result (Section 3.4) ───────────────────────
export const GateViolationSchema = z.object({
  rule: z.string(),
  field: z.string(),
  severity: z.enum(['critical', 'warning']),
  message: z.string(),
})
export type GateViolation = z.infer<typeof GateViolationSchema>

export const PublicationGateResultSchema = z.object({
  canPublish: z.boolean(),
  violations: z.array(GateViolationSchema),
  warnings: z.array(GateViolationSchema),
})
export type PublicationGateResult = z.infer<typeof PublicationGateResultSchema>
