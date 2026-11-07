/**
 * JSON-LD for entity pages (service category, service, portfolio). Pure.
 */
import { siteConfig } from '@/config/site'
import type { Project, Service, ServiceDetail } from '@/lib/content/spatium-types'

type JsonLd = Record<string, unknown>

const SITE_URL = siteConfig.url

function breadcrumbs(items: { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  }
}

function faqPage(faqs: readonly { q: string; a: string }[]): JsonLd[] {
  if (faqs.length === 0) return []
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
    },
  ]
}

export function serviceCategoryJsonLd(view: Service, faqs: readonly { q: string; a: string }[]): JsonLd[] {
  const url = `${SITE_URL}/services/${view.slug}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: view.name,
      serviceType: view.name,
      description: view.metaDescription,
      url,
      provider: { '@type': 'Organization', name: 'SPATIUM', url: SITE_URL },
    },
    breadcrumbs([
      { name: 'Home', url: SITE_URL },
      { name: 'Layanan', url: `${SITE_URL}/services` },
      { name: view.name, url },
    ]),
    ...faqPage(faqs),
  ]
}

export function serviceJsonLd(view: ServiceDetail): JsonLd[] {
  const url = `${SITE_URL}${view.href}`
  const parentUrl = `${SITE_URL}/services/${view.parent.slug}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: view.name,
      serviceType: view.parent.name,
      description: view.metaDescription,
      url,
      provider: { '@type': 'Organization', name: 'SPATIUM', url: SITE_URL },
      isRelatedTo: { '@type': 'Service', name: view.parent.name, url: parentUrl },
    },
    breadcrumbs([
      { name: 'Home', url: SITE_URL },
      { name: 'Layanan', url: `${SITE_URL}/services` },
      { name: view.parent.name, url: parentUrl },
      { name: view.name, url },
    ]),
  ]
}

export function portfolioJsonLd(view: Project): JsonLd[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: view.title,
      description: view.brief || view.tagline,
      url: `${SITE_URL}/portfolio/${view.slug}`,
      genre: view.discipline,
      creator: { '@type': 'Organization', name: 'SPATIUM Spatial Technology Studio', url: SITE_URL },
    },
  ]
}

/** `<script type="application/ld+json">` body; `<` is escaped so content cannot close the script. */
export function jsonLdScript(data: readonly JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
