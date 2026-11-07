import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getServiceCategoryPage, getServicePathBySlug, getUseCases } from '@/lib/content/spatium'
import { getPublicContact } from '@/lib/content/contact'
import { ServiceCategoryView } from '@/components/entity/EntityViews'
import { categoryFaqs } from '@/blocks/presets'
import { jsonLdScript, serviceCategoryJsonLd } from '@/lib/seo/entity-jsonld'
import { siteConfig } from '@/config/site'
import { redirectIfMoved } from '@/lib/redirects/resolve'

const SITE_URL = siteConfig.url

export const revalidate = 300

export async function generateStaticParams() {
  // getUseCases() logs and returns [] when the DB is unreachable at build time.
  const useCases = await getUseCases()
  return useCases.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = (await getUseCases()).find((s) => s.slug === slug)
  if (!service) return { title: 'Layanan tidak ditemukan' }

  const serpTitle = service.metaTitle.length > 60 ? `${service.metaTitle.slice(0, 57).trimEnd()}…` : service.metaTitle
  const desc =
    service.metaDescription.length > 160 ? `${service.metaDescription.slice(0, 157).trimEnd()}…` : service.metaDescription
  const ogImg = service.image || '/icon-512.png'

  return {
    title: serpTitle,
    description: desc,
    alternates: { canonical: `${SITE_URL}/services/${slug}` },
    openGraph: {
      type: 'website',
      title: `${serpTitle} · SPATIUM`,
      description: desc,
      url: `${SITE_URL}/services/${slug}`,
      siteName: 'SPATIUM',
      images: [{ url: ogImg, width: 1200, height: 630, alt: service.imageAlt }],
    },
    twitter: { card: 'summary_large_image', title: `${serpTitle} · SPATIUM`, description: desc, images: [ogImg] },
  }
}

/**
 * A published use case. Every section is a block (preset when the row has no
 * stored blocks, see `resolveEntityBlocks`), rendered by the same view as the
 * Studio preview.
 */
export default async function ServiceCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getServiceCategoryPage(slug)

  if (!page) {
    // A child service at the old flat URL moved to /services/<category>/<service>.
    const nested = await getServicePathBySlug(slug)
    if (nested) permanentRedirect(nested)
    await redirectIfMoved(`/services/${slug}`)
    notFound()
  }

  const jsonLd = serviceCategoryJsonLd(page.entity.category, categoryFaqs(page.blocks))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <ServiceCategoryView entity={page.entity} blocks={page.blocks} contact={await getPublicContact()} />
    </>
  )
}
