import type { SeoSite } from '@/lib/seo/site'
import { siteConfig } from '@/config/site'

// -----------------------------------------------------------------------------
// JSON-LD Structured Data Generators
// -----------------------------------------------------------------------------

type JsonLdSchema = Record<string, unknown>

// Social profiles are Studio settings (DB); the static default has none.
export function createSchemaGenerators(site: SeoSite = { ...siteConfig, email: null, phone: null, social: {} }) {
function generateOrganizationSchema(): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    description: site.description,
    // A ContactPoint only exists when Studio settings hold a phone or email.
    ...(site.phone || site.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            ...(site.phone ? { telephone: site.phone } : {}),
            contactType: 'customer service',
            ...(site.email ? { email: site.email } : {}),
            areaServed: 'ID',
            availableLanguage: ['Indonesian', 'English'],
          },
        }
      : {}),
    sameAs: Object.values(site.social).filter(Boolean),
    ...(site.address ? { address: { '@type': 'PostalAddress', streetAddress: site.address } } : {}),
  }
}

function generateWebSiteSchema(): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${site.url}${item.url}`,
    })),
  }
}

function generateArticleSchema(article: {
  title: string
  slug: string
  excerpt: string
  publishedAt?: string | null
  updatedAt?: string
  author?: { name: string } | null
  featuredImage?: { url: string; width?: number; height?: number } | null
}): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    url: `${site.url}/journal/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: article.author
      ? { '@type': 'Person', name: article.author.name }
      : { '@type': 'Organization', name: site.name },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
    image: article.featuredImage?.url ?? undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${site.url}/journal/${article.slug}`,
    },
  }
}

function generatePortfolioSchema(portfolio: {
  title: string
  slug: string
  summary: string
  client?: string
  year?: number
  heroMedia?: { url: string } | null
}): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: portfolio.title,
    description: portfolio.summary,
    url: `${site.url}/portfolio/${portfolio.slug}`,
    creator: {
      '@type': 'Organization',
      name: site.name,
    },
    ...(portfolio.client ? { about: { '@type': 'Organization', name: portfolio.client } } : {}),
    ...(portfolio.year ? { dateCreated: String(portfolio.year) } : {}),
    ...(portfolio.heroMedia ? { image: portfolio.heroMedia.url } : {}),
  }
}

function generateFAQSchema(
  items: { question: string; answer: string }[]
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

function generateLocalBusinessSchema(): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url: site.url,
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(site.address ? { address: { '@type': 'PostalAddress', streetAddress: site.address } } : {}),
    sameAs: Object.values(site.social).filter(Boolean),
  }
}

function generateServicesListSchema(
  services: { name: string; slug: string; shortDescription?: string }[]
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Layanan Teknologi Spasial SPATIUM',
    description:
      'Layanan digital twin SPATIUM: pemindaian LiDAR, point cloud, geometri 3D, dan 3D Gaussian Splat untuk film & VFX, marketing, instalasi, serta dokumentasi.',
    itemListElement: services.map((svc, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Service',
        name: svc.name,
        description: svc.shortDescription,
        url: `${site.url}/services/${svc.slug}`,
        provider: {
          '@type': 'Organization',
          name: site.name,
          url: site.url,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Indonesia',
        },
      },
    })),
  }
}

function generateServiceSchema(service: {
  name: string
  slug: string
  description?: string | null
  heroImage?: string | null
}): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description || '',
    url: `${site.url}/services/${service.slug}`,
    provider: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    ...(service.heroImage ? { image: service.heroImage } : {}),
  }
}

function generateCategoryCollectionSchema(category: {
  title: string
  slug: string
  shortDescription?: string | null
  subServices?: { name: string; slug: string; shortDescription?: string | null }[]
}): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.title,
    description: category.shortDescription || '',
    url: `${site.url}/services/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (category.subServices || []).map((svc, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Service',
          name: svc.name,
          description: svc.shortDescription || '',
          url: `${site.url}/services/${svc.slug}`,
        },
      })),
    },
  }
}



return { generateOrganizationSchema, generateWebSiteSchema, generateBreadcrumbSchema, generateArticleSchema, generatePortfolioSchema, generateFAQSchema, generateLocalBusinessSchema, generateServicesListSchema, generateServiceSchema, generateCategoryCollectionSchema }
}

export const { generateOrganizationSchema, generateWebSiteSchema, generateBreadcrumbSchema, generateArticleSchema, generatePortfolioSchema, generateFAQSchema, generateLocalBusinessSchema, generateServicesListSchema, generateServiceSchema, generateCategoryCollectionSchema } = createSchemaGenerators()
