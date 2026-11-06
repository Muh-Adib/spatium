/**
 * Brand-specific JSON-LD @graph builder.
 *
 * SPATIUM is a Spatial Technology Studio (digital twin for the creative
 * industry). Per the task rules, no
 * address, telephone, or email may be emitted unless verified — those fields
 * are omitted entirely rather than filled with placeholders.
 */
import { siteConfig } from '@/config/site'

type Schema = Record<string, unknown>

export interface BrandGraphInput {
  path: string
  pageType?: 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage'
  title: string
  description?: string
  breadcrumbs?: Array<{ name: string; url: string }>
  services?: Array<{ name: string; description?: string; url: string }>
  faqs?: Array<{ question: string; answer: string }>
  article?: {
    title: string
    description?: string
    url: string
    imageUrl?: string
    publishedAt?: string | null
    updatedAt?: string | null
    authorName?: string
  }
  video?: {
    name: string
    description?: string
    thumbnailUrl?: string
    uploadDate?: string
    embedUrl?: string
    duration?: string
  }
  caseStudy?: {
    title: string
    description?: string
    url: string
    clientName?: string
    dateCreated?: string
  }
}

const ORG_ID = `${siteConfig.url}/#organization`
const SITE_ID = `${siteConfig.url}/#website`

export function buildBrandGraph(input: BrandGraphInput): Schema {
  const pageUrl = new URL(input.path, siteConfig.url).href
  const graph: Schema[] = []

  // Organization — only verified fields. No address/phone/email (needs-confirmation).
  graph.push({
    '@type': 'Organization',
    '@id': ORG_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    areaServed: { '@type': 'Country', name: 'Indonesia' },
    knowsAbout: [
      '3D Gaussian Splatting',
      'LiDAR Laser Scanning',
      'Photogrammetry Digital Twin',
      'Spatial Computing',
      'Virtual Scouting & Previz',
    ],
  })

  graph.push({
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
    publisher: { '@id': ORG_ID },
    inLanguage: 'id-ID',
  })

  graph.push({
    '@type': input.pageType ?? 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: input.title,
    description: input.description,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
  })

  if (input.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: input.breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: new URL(b.url, siteConfig.url).href,
      })),
    })
  }

  if (input.services?.length) {
    graph.push({
      '@type': 'OfferCatalog',
      '@id': `${pageUrl}#services`,
      name: 'Layanan SPATIUM',
      itemListElement: input.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          description: s.description,
          url: new URL(s.url, siteConfig.url).href,
          provider: { '@id': ORG_ID },
        },
      })),
    })
  }

  if (input.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: input.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }

  if (input.article) {
    graph.push({
      '@type': 'BlogPosting',
      '@id': `${input.article.url}#article`,
      headline: input.article.title,
      description: input.article.description,
      url: new URL(input.article.url, siteConfig.url).href,
      image: input.article.imageUrl,
      datePublished: input.article.publishedAt ?? undefined,
      dateModified: input.article.updatedAt ?? input.article.publishedAt ?? undefined,
      author: input.article.authorName
        ? { '@type': 'Person', name: input.article.authorName }
        : { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      isPartOf: { '@id': `${pageUrl}#webpage` },
    })
  }

  if (input.video) {
    graph.push({
      '@type': 'VideoObject',
      '@id': `${pageUrl}#video`,
      name: input.video.name,
      description: input.video.description,
      thumbnailUrl: input.video.thumbnailUrl,
      uploadDate: input.video.uploadDate,
      embedUrl: input.video.embedUrl,
      duration: input.video.duration,
      publisher: { '@id': ORG_ID },
    })
  }

  if (input.caseStudy) {
    graph.push({
      '@type': 'CreativeWork',
      '@id': `${input.caseStudy.url}#case-study`,
      name: input.caseStudy.title,
      description: input.caseStudy.description,
      url: new URL(input.caseStudy.url, siteConfig.url).href,
      dateCreated: input.caseStudy.dateCreated,
      about: input.caseStudy.clientName
        ? { '@type': 'Organization', name: input.caseStudy.clientName }
        : undefined,
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph.filter(Boolean) }
}
