// -----------------------------------------------------------------------------
// WebShift Content Types — Platform-agnostic domain model
// Unified Single-Brand Embedded SQLite (Drizzle ORM) Architecture
// -----------------------------------------------------------------------------

// --- Observable Data Source Contract ----------------------------------------

export type ContentSource = 'db' | 'seed' | 'external'

export interface DataResult<T> {
  data: T
  source: ContentSource
  stale: boolean
  fetchedAt: string
  latencyMs?: number
  warning?: string
}

// --- Shared Media Types ------------------------------------------------------

export interface ImageFormat {
  name: string
  hash?: string
  ext?: string
  mime?: string
  width: number
  height: number
  size?: number
  url: string
}

export interface MediaImage {
  id: number
  documentId?: string
  name: string
  alternativeText: string | null
  caption: string | null
  width: number
  height: number
  formats?: {
    thumbnail?: ImageFormat
    small?: ImageFormat
    medium?: ImageFormat
    large?: ImageFormat
  }
  url: string
  mime?: string
  size?: number
}

// --- Shared Component Types --------------------------------------------------

export interface SEOComponent {
  sourceOriginalUrl?: string
  openGraph?: { title?: string; description?: string; image?: string; imageAlt?: string }
  twitter?: { title?: string; description?: string; image?: string; card?: string }
  robots?: { index?: boolean; follow?: boolean; noarchive?: boolean; nosnippet?: boolean }
  schema?: Record<string, unknown>
  id?: number
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  robotsIndex?: boolean
  robotsFollow?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImage?: MediaImage
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: MediaImage
  focusTopic?: string
  secondaryTopics?: string
  searchIntent?: 'informational' | 'navigational' | 'transactional' | 'commercial'
  breadcrumbTitle?: string
  schemaType?: string
  customSchema?: Record<string, unknown>
}

export interface CTAComponent {
  id?: number
  title?: string
  description?: string
  primaryLabel?: string
  primaryUrl?: string
  secondaryLabel?: string
  secondaryUrl?: string
  theme?: 'light' | 'dark' | 'accent'
  trackingId?: string
}

export interface FAQItem {
  id?: number
  question: string
  answer: string
}

export interface TestimonialComponent {
  id?: number
  quote: string
  author?: string
  role?: string
  company?: string
  avatar?: MediaImage
  rating?: number
}

export interface MediaComponent {
  id?: number
  file: MediaImage
  seoAlt?: string
  caption?: string
  credit?: string
}

export interface LinkComponent {
  id?: number
  label: string
  url: string
  isExternal?: boolean
  openInNewTab?: boolean
}

// --- Block Components (Dynamic Zone) ----------------------------------------

export interface HeroBlock {
  __component: 'blocks.hero'
  id?: number
  headline: string
  subheadline?: string
  description?: string
  cta?: CTAComponent
  backgroundImage?: MediaImage
  layoutVariant?: 'centered' | 'split-left' | 'split-right' | 'full-width' | 'video-bg'
  theme?: 'light' | 'dark' | 'transparent'
  animationType?: 'none' | 'fade' | 'split-text' | 'reveal'
  badge?: string
}

export interface FeatureItem {
  id?: number
  icon?: string
  title: string
  description?: string
}

export interface FeatureGridBlock {
  __component: 'blocks.feature-grid'
  id?: number
  title?: string
  description?: string
  items: FeatureItem[]
  columns?: '2' | '3' | '4'
  layoutVariant?: 'cards' | 'list' | 'icons' | 'numbered'
}

export interface RichTextBlock {
  __component: 'blocks.rich-text'
  id?: number
  content: string
  width?: 'full' | 'contained' | 'narrow'
}

export interface StatItem {
  id?: number
  value: string
  label: string
  prefix?: string
  suffix?: string
}

export interface StatisticsBlock {
  __component: 'blocks.statistics'
  id?: number
  title?: string
  stats: StatItem[]
}

export interface FAQSectionBlock {
  __component: 'blocks.faq-section'
  id?: number
  title?: string
  description?: string
  items: FAQItem[]
  layoutVariant?: 'accordion' | 'grid'
}

export interface TestimonialsBlock {
  __component: 'blocks.testimonials'
  id?: number
  title?: string
  items: TestimonialComponent[]
  layoutVariant?: 'grid' | 'carousel' | 'single'
}

export interface CTASectionBlock {
  __component: 'blocks.cta-section'
  id?: number
  cta: CTAComponent
  backgroundImage?: MediaImage
  theme?: 'light' | 'dark' | 'accent' | 'gradient'
}

export interface LogoCloudBlock {
  __component: 'blocks.logo-cloud'
  id?: number
  title?: string
  logos: MediaImage[]
  marquee?: boolean
}

export interface ProcessStep {
  id?: number
  number?: string
  title: string
  description?: string
  icon?: string
}

export interface ProcessBlock {
  __component: 'blocks.process'
  id?: number
  title?: string
  description?: string
  steps: ProcessStep[]
}

export interface ImageGalleryBlock {
  __component: 'blocks.image-gallery'
  id?: number
  title?: string
  images: MediaComponent[]
  layoutVariant?: 'grid' | 'masonry' | 'carousel' | 'lightbox'
}

export interface ParallaxImageBlock {
  __component: 'blocks.parallax-image'
  id?: number
  image: MediaImage
  caption?: string
  speed?: number
  direction?: 'vertical' | 'horizontal'
}

export interface TimelineEvent {
  id?: number
  year?: string
  title: string
  description?: string
}

export interface TimelineBlock {
  __component: 'blocks.timeline'
  id?: number
  title?: string
  events: TimelineEvent[]
}

export interface PricingTier {
  id?: number
  name: string
  price?: string
  period?: string
  description?: string
  features?: string[]
  isHighlighted?: boolean
  ctaLabel?: string
  ctaUrl?: string
}

export interface PricingBlock {
  __component: 'blocks.pricing'
  id?: number
  title?: string
  description?: string
  tiers: PricingTier[]
}

export interface TechnologyStackBlock {
  __component: 'blocks.technology-stack'
  id?: number
  title?: string
  description?: string
  technologies?: { name: string; icon?: string; category?: string }[]
  layoutVariant?: 'icons' | 'list' | 'grid'
}

export interface ComparisonBlock {
  __component: 'blocks.comparison'
  id?: number
  title?: string
  leftLabel?: string
  rightLabel?: string
  leftImage?: MediaImage
  rightImage?: MediaImage
}

export interface VideoSectionBlock {
  __component: 'blocks.video-section'
  id?: number
  title?: string
  videoUrl?: string
  thumbnail?: MediaImage
  autoplay?: boolean
}

export interface LiveEmbedBlock {
  __component: 'blocks.live-embed'
  id?: number
  title?: string
  description?: string
  url?: string
  embedUrl?: string
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'custom'
}

export type PageBlock =
  | HeroBlock
  | FeatureGridBlock
  | RichTextBlock
  | StatisticsBlock
  | FAQSectionBlock
  | TestimonialsBlock
  | CTASectionBlock
  | LogoCloudBlock
  | ProcessBlock
  | ImageGalleryBlock
  | ParallaxImageBlock
  | TimelineBlock
  | PricingBlock
  | TechnologyStackBlock
  | ComparisonBlock
  | VideoSectionBlock
  | LiveEmbedBlock

// --- Content Types -----------------------------------------------------------

export interface Category {
  id: number
  documentId?: string
  name: string
  slug: string
  description?: string
  seo?: SEOComponent
}

export interface Topic {
  id: number
  documentId?: string
  name: string
  slug: string
  description?: string
}

export interface Industry {
  id: number
  documentId?: string
  name: string
  slug: string
  description?: string
  icon?: string
  seo?: SEOComponent
}

export interface Technology {
  id: number
  documentId?: string
  name: string
  slug: string
  category?: string
  icon?: MediaImage
  description?: string
  website?: string
}

export interface Author {
  email?: string
  id: number
  documentId?: string
  name: string
  slug: string
  bio?: string
  avatar?: MediaImage
}

export interface SiteSetting {
  id: number
  documentId?: string
  siteName: string
  siteDescription?: string
  siteUrl?: string
  logo?: MediaImage
  favicon?: MediaImage
  defaultOgImage?: MediaImage
  defaultMetaTitle?: string
  defaultMetaDescription?: string
  defaultRobots?: string
  googleVerification?: string
  bingVerification?: string
  analyticsId?: string
  gtmId?: string
  whatsapp?: string
  email?: string
  phone?: string
  address?: string
  logoUrl?: string
  faviconUrl?: string
  brandVoice?: string
  hqLocation?: string
  socialLinks?: Record<string, string>
}

export interface Redirect {
  id: number
  documentId?: string
  sourcePath: string
  destinationPath: string
  statusCode: number
  active: boolean
  reason?: string
}

export interface Page {
  id: number
  documentId?: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  template?: string
  featuredImage?: MediaImage
  blocks: PageBlock[]
  seo?: SEOComponent
  customSchema?: Record<string, unknown>
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  locale?: 'id' | 'en'
  translationGroupId?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
  isCornerstone?: boolean
  kind?: 'standard' | 'landing'
  status?: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'archived'
  robots?: string
  canonical?: string
  clusterId?: string
  location?: string
}

export interface Article {
  seoData?: Record<string, any>
  wpSourceUrl?: string
  scheduledAt?: string
  publicationTimezone?: string
  scheduleError?: string
  id: number
  documentId?: string
  title: string
  slug: string
  excerpt: string
  content?: string
  featuredImage?: MediaImage
  coverUrl?: string
  author?: Author
  category?: Category
  tags?: Topic[]
  readingTime?: number
  tableOfContents?: { id: string; text: string; level: number }[]
  relatedArticles?: Article[]
  relatedServices?: Service[]
  relatedPortfolio?: Portfolio[]
  seo?: SEOComponent
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  locale?: 'id' | 'en'
  translationGroupId?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
  isCornerstone?: boolean
  status?: string
  primaryKeyword?: string
  targetLocation?: string
  targetCity?: string
  faqs?: any
  tagsParagraph?: string
  imageMetadata?: any
}

export interface Service {
  id: number
  documentId?: string
  name: string
  slug: string
  categoryId?: number | null
  indexNumber?: string | null
  categoryBadge?: string | null
  highlightWord?: string | null
  shortDescription?: string
  longDescription?: string
  description?: string
  whatsappPrompt?: string
  icon?: string
  heroImage?: MediaImage
  primaryMedia?: any
  metrics?: { label: string; value: string; detail?: string }[]
  industries?: Industry[]
  features?: { title: string; description?: string; icon?: string }[]
  deliverables?: string[]
  technologies?: Technology[]
  process?: ProcessBlock
  relatedServices?: Service[]
  relatedPortfolio?: Portfolio[]
  relatedArticles?: Article[]
  faq?: FAQItem[]
  cta?: CTAComponent
  seo?: SEOComponent
  blocks?: any[]
  status?: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  locale?: 'id' | 'en'
  translationGroupId?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
  isCornerstone?: boolean
}

export interface Portfolio {
  id: number
  documentId?: string
  title: string
  slug: string
  client?: string
  year?: number
  category?: string
  industry?: Industry
  location?: string
  projectType?: string
  summary: string
  challenge?: string
  approach?: string
  solution?: string
  process?: string
  result?: string
  metrics?: { label: string; value: string; detail?: string }[]
  servicesUsed?: Service[]
  technologies?: Technology[]
  features?: { title: string; description?: string }[]
  gallery?: MediaComponent[]
  heroMedia?: MediaImage
  videoUrl?: string
  videoPoster?: string
  livePreviewUrl?: string
  testimonial?: TestimonialComponent
  externalUrl?: string
  relatedArticles?: Article[]
  relatedServices?: Service[]
  seo?: SEOComponent
  blocks?: any[]
  status?: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  locale?: 'id' | 'en'
  translationGroupId?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
  isCornerstone?: boolean
}

// --- Search -----------------------------------------------------------------

export interface SearchResult {
  type: 'article' | 'service' | 'portfolio' | 'page'
  id: number
  title: string
  slug: string
  description?: string
  url: string
  tags?: string[]
}

export type MigrationStatus = 'preserve' | 'redirect' | 'merge' | 'remove' | 'noindex'

export interface UrlMigration {
  oldUrl: string
  newUrl: string
  status: MigrationStatus
  redirectCode?: 301 | 308
  reason?: string
}
