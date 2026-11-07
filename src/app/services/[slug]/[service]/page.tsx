import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedServicePaths, getServicePage } from '@/lib/content/spatium'
import { getPublicContact } from '@/lib/content/contact'
import { ServiceView } from '@/components/entity/EntityViews'
import { jsonLdScript, serviceJsonLd } from '@/lib/seo/entity-jsonld'
import { siteConfig } from '@/config/site'
import { redirectIfMoved } from '@/lib/redirects/resolve'

const SITE_URL = siteConfig.url

export const revalidate = 300

type Params = Promise<{ slug: string; service: string }>

export async function generateStaticParams() {
  // Logs and returns [] when the DB is unreachable at build time.
  const paths = await getPublishedServicePaths()
  return paths.map((p) => ({ slug: p.categorySlug, service: p.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, service } = await params
  const page = await getServicePage(slug, service)
  if (!page) return { title: 'Layanan tidak ditemukan' }
  const view = page.entity.service

  const serpTitle = view.metaTitle.length > 60 ? `${view.metaTitle.slice(0, 57).trimEnd()}…` : view.metaTitle
  const desc = view.metaDescription.length > 160 ? `${view.metaDescription.slice(0, 157).trimEnd()}…` : view.metaDescription
  const url = `${SITE_URL}${view.href}`
  const ogImg = view.image || '/icon-512.png'

  return {
    title: serpTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: `${serpTitle} · SPATIUM`,
      description: desc,
      url,
      siteName: 'SPATIUM',
      images: [{ url: ogImg, width: 1200, height: 630, alt: view.imageAlt }],
    },
    twitter: { card: 'summary_large_image', title: `${serpTitle} · SPATIUM`, description: desc, images: [ogImg] },
  }
}

/** A published child service under its published use case (drafts on either side → 404). */
export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { slug, service } = await params
  const page = await getServicePage(slug, service)
  if (!page) {
    await redirectIfMoved(`/services/${slug}/${service}`)
    notFound()
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(serviceJsonLd(page.entity.service)) }} />
      <ServiceView entity={page.entity} blocks={page.blocks} contact={await getPublicContact()} />
    </>
  )
}
