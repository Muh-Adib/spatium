import type { Metadata } from 'next'
import type { SEOComponent, MediaImage } from '@/lib/content/types'
import { resolveMediaUrl } from '@/lib/content/transform'
import type { SeoSite } from './site'
import { siteConfig } from '@/config/site'
import { ContentSeo, Locale } from './schema'

// -----------------------------------------------------------------------------
// SEO Metadata Generator (V4 Engine)
// -----------------------------------------------------------------------------

export interface TemplateVariableContext {
  title?: string
  siteName?: string
  separator?: string
  category?: string
  date?: string
}

/**
 * Replaces Yoast-style template variables: %title%, %sitename%, %sep%, %category%, %date%
 */
export function resolveSeoTemplate(template: string, ctx: TemplateVariableContext): string {
  if (!template) return ctx.title || ''
  const sitename = ctx.siteName || siteConfig.name
  const sep = ctx.separator || '|'
  const title = ctx.title || ''
  const category = ctx.category || ''
  const date = ctx.date || new Date().getFullYear().toString()

  return template
    .replace(/%{1,2}title%{1,2}/gi, title)
    .replace(/%{1,2}sitename%{1,2}/gi, sitename)
    .replace(/%{1,2}sep%{1,2}/gi, sep)
    .replace(/%{1,2}category%{1,2}/gi, category)
    .replace(/%{1,2}date%{1,2}/gi, date)
    .replace(/\s+/g, ' ')
    .trim()
}

export interface MetadataInput {
  site?: SeoSite
  title?: string
  description?: string
  slug?: string
  locale?: Locale
  alternateSlugs?: { id?: string; en?: string }
  seo?: SEOComponent | ContentSeo | any
  featuredImage?: MediaImage | null
  type?: 'article' | 'website' | 'service' | 'portfolio'
  publishedAt?: string | null
  updatedAt?: string
  author?: string
  category?: string
  noIndex?: boolean
}

/**
 * Generate Next.js Metadata object from CMS SEO data with automatic fallbacks.
 * Fully supports template variables, bilingual alternates (hreflang), and structured directives.
 */
interface ExtendedSeoData {
  metaTitle?: string
  seoTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  openGraph?: {
    title?: string
    description?: string
    image?: string | { url?: string }
    imageAlt?: string
  }
  ogImage?: string | { url?: string }
  ogTitle?: string
  ogDescription?: string
  twitter?: {
    card?: string
    title?: string
    description?: string
    image?: string | { url?: string }
  }
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string | { url?: string }
  robots?: {
    index?: boolean
    follow?: boolean
    noarchive?: boolean
    nosnippet?: boolean
    maxVideoPreview?: number
    maxImagePreview?: 'none' | 'standard' | 'large'
    maxSnippet?: number
  }
  robotsIndex?: boolean
  robotsFollow?: boolean
  keywords?: string[] | string
  [key: string]: unknown
}

export function generatePageMetadata(input: MetadataInput): Metadata {
  const {
    title: pageTitle,
    description: pageDescription,
    slug,
    locale = 'id',
    alternateSlugs,
    seo: rawSeo,
    featuredImage,
    type = 'website',
    publishedAt,
    updatedAt,
    author,
    category,
    noIndex = false,
  } = input

  const site = input.site || siteConfig
  const s = (rawSeo || {}) as ExtendedSeoData

  // Resolve template variables
  const rawTitle = s.metaTitle || s.seoTitle || pageTitle || site.name
  const fullTitle = resolveSeoTemplate(rawTitle, {
    title: pageTitle || site.name,
    siteName: site.name,
    separator: '|',
    category,
    date: publishedAt ? new Date(publishedAt).getFullYear().toString() : undefined,
  })

  // Description
  const metaDescription =
    resolveSeoTemplate(s.metaDescription || pageDescription || site.description, { title: pageTitle, siteName: site.name, category, date: publishedAt ? new Date(publishedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID') : undefined })

  // Canonical URL (Self-referential per locale)
  const cleanSlug = slug ? slug.replace(/^\//, '') : ''
  const localePrefix = locale === 'en' ? '/en' : ''
  const pathPart = cleanSlug ? `/${cleanSlug}` : ''
  const defaultCanonical = `${site.url}${localePrefix}${pathPart}`
  const canonicalUrl = s.canonicalUrl || defaultCanonical

  // Multi-language hreflang alternates (Section 9.1 & 16.3)
  const languageAlternates: Record<string, string> = {
    'x-default': `${site.url}${pathPart}`,
    id: `${site.url}/${cleanSlug}`.replace(/\/$/, ''),
  }
  if (alternateSlugs?.en) {
    languageAlternates.en = `${site.url}/en/${alternateSlugs.en.replace(/^\//, '')}`
  } else if (locale === 'en' && cleanSlug) {
    languageAlternates.en = `${site.url}/en/${cleanSlug}`
  }

  // OG Image resolution
  let ogImageUrl: string | undefined
  let ogImageAlt: string = fullTitle

  if (s.openGraph && typeof s.openGraph === 'object' && s.openGraph.image) {
    const img = typeof s.openGraph.image === 'string' ? s.openGraph.image : s.openGraph.image.url
    if (img) ogImageUrl = resolveMediaUrl(img)
    if (s.openGraph.imageAlt) ogImageAlt = s.openGraph.imageAlt
  } else if (s.ogImage) {
    const img = typeof s.ogImage === 'string' ? s.ogImage : s.ogImage.url
    if (img) ogImageUrl = resolveMediaUrl(img)
  } else if (featuredImage) {
    ogImageUrl = resolveMediaUrl(featuredImage.url)
    if (featuredImage.alternativeText) ogImageAlt = featuredImage.alternativeText
  } else if (site.defaultOgImage) {
    ogImageUrl = `${site.url}${site.defaultOgImage}`
  }

  // Robots configuration
  let robotsIndex = true
  let robotsFollow = true

  if (noIndex) {
    robotsIndex = false
  } else if (s.robots && typeof s.robots === 'object') {
    robotsIndex = s.robots.index ?? true
    robotsFollow = s.robots.follow ?? true
  } else {
    if (typeof s.robotsIndex === 'boolean') robotsIndex = s.robotsIndex
    if (typeof s.robotsFollow === 'boolean') robotsFollow = s.robotsFollow
  }

  const metadata: Metadata = {
    title: fullTitle,
    description: metaDescription,
    metadataBase: new URL(site.url),

    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },

    robots: {
      index: robotsIndex,
      follow: robotsFollow,
      noarchive: s.robots?.noarchive || undefined,
      nosnippet: s.robots?.nosnippet || undefined,
      googleBot: {
        index: robotsIndex,
        follow: robotsFollow,
        'max-video-preview': s.robots?.maxVideoPreview ?? -1,
        'max-image-preview': s.robots?.maxImagePreview || 'large',
        'max-snippet': s.robots?.maxSnippet ?? -1,
      },
    },

    openGraph: {
      title: s.openGraph?.title || s.ogTitle || fullTitle,
      description: s.openGraph?.description || s.ogDescription || metaDescription,
      url: canonicalUrl,
      siteName: site.name,
      locale: locale === 'en' ? 'en_US' : 'id_ID',
      type: type === 'article' ? 'article' : 'website',
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: 1200, height: 630, alt: ogImageAlt }]
        : undefined,
      ...(type === 'article' && publishedAt
        ? {
            publishedTime: publishedAt,
            modifiedTime: updatedAt || publishedAt,
            authors: author ? [author] : undefined,
          }
        : {}),
    },

    twitter: {
      card: s.twitter?.card === 'summary' ? 'summary' : 'summary_large_image',
      title: s.twitter?.title || s.twitterTitle || s.ogTitle || fullTitle,
      description: s.twitter?.description || s.twitterDescription || s.ogDescription || metaDescription,
      images: s.twitter?.image
        ? [resolveMediaUrl(typeof s.twitter.image === 'string' ? s.twitter.image : s.twitter.image.url || '')]
        : s.twitterImage
          ? [resolveMediaUrl(typeof s.twitterImage === 'string' ? s.twitterImage : s.twitterImage.url || '')]
          : ogImageUrl
            ? [ogImageUrl]
            : undefined,
    },
  }

  return metadata
}

/**
 * Minimal metadata for error/not-found pages
 */
export function generateErrorMetadata(statusCode: number): Metadata {
  const title = statusCode === 404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan'
  return {
    title: `${title} | ${siteConfig.name}`,
    robots: { index: false, follow: false },
  }
}
