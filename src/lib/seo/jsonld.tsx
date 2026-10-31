import React from 'react'
import { siteConfig } from '@/config/site'

export interface ArticleJsonLdProps {
  title: string
  description?: string
  url: string
  imageUrl?: string
  publishedAt?: string | null
  updatedAt?: string | null
  authorName?: string
  authorUrl?: string
  inLanguage?: string
}

export interface ServiceJsonLdProps {
  name: string
  description?: string
  url: string
  imageUrl?: string
  serviceType?: string
  providerName?: string
  areaServed?: string
  faqs?: Array<{ question: string; answer: string }>
}

export interface ProjectJsonLdProps {
  title: string
  description?: string
  url: string
  imageUrl?: string
  dateCreated?: string
  clientName?: string
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

/**
 * Server-rendered, sanitised JSON-LD container
 */
export function JsonLd({ schema }: { schema: Record<string, unknown> | Array<Record<string, unknown>> }) {
  if (!schema) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  )
}

/**
 * Article / BlogPosting Schema Generator
 */
export function buildArticleSchema(props: ArticleJsonLdProps) {
  const {
    title,
    description,
    url,
    imageUrl,
    publishedAt,
    updatedAt,
    authorName = 'UNIMASI Editorial Team',
    authorUrl = siteConfig.url,
    inLanguage = 'id-ID',
  } = props

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: title,
    description: description || title,
    inLanguage,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    datePublished: publishedAt || new Date().toISOString(),
    dateModified: updatedAt || publishedAt || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
  }
}

/**
 * Service & FAQ Schema Generator
 */
export function buildServiceSchema(props: ServiceJsonLdProps) {
  const {
    name,
    description,
    url,
    imageUrl,
    serviceType = 'Web Development & Creative Technology',
    providerName = siteConfig.name,
    areaServed = 'Indonesia',
    faqs = [],
  } = props

  const serviceSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description: description || name,
    url,
    serviceType,
    ...(imageUrl ? { image: imageUrl } : {}),
    provider: {
      '@type': 'Organization',
      name: providerName,
      url: siteConfig.url,
    },
    areaServed: {
      '@type': 'Country',
      name: areaServed,
    },
  }

  if (faqs && faqs.length > 0) {
    return [
      serviceSchema,
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
    ]
  }

  return serviceSchema
}

/**
 * CreativeWork / Project Schema Generator
 */
export function buildProjectSchema(props: ProjectJsonLdProps) {
  const { title, description, url, imageUrl, dateCreated, clientName } = props
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description: description || title,
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(dateCreated ? { dateCreated } : {}),
    creator: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    ...(clientName ? { sponsor: { '@type': 'Organization', name: clientName } } : {}),
  }
}

/**
 * Organization + WebSite (Homepage) Schema Generator
 */
export function buildOrganizationSchema() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/logo.png`,
      description: siteConfig.description,
      sameAs: [
        'https://github.com/unimasi',
        'https://www.linkedin.com/company/unimasi',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: siteConfig.email || 'info@unimasi.com',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteConfig.url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]
}

/**
 * BreadcrumbList Schema Generator
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
