import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServiceCategoryWithServices, getServiceCategories } from '@/lib/db/serviceCategories'
import { getServiceBySlug } from '@/lib/db/services'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { siteConfig } from '@/config/site'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const cats = await getServiceCategories()
    return cats.map((c) => ({ slug: c.slug }))
  } catch (err) {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const cat = await getServiceCategoryWithServices(slug)
  const svc = !cat ? await getServiceBySlug(slug) : null
  const item: any = cat || svc

  if (!item) return { title: 'Layanan Tidak Ditemukan · SPATIUM' }

  const title = item.metaTitle || `${item.title || item.name} · Layanan Spasial SPATIUM`
  const description =
    item.metaDescription ||
    item.shortDescription ||
    'Layanan produksi teknologi spasial, 3D Gaussian Splatting, dan LiDAR terdepan dari SPATIUM.'
  const canonical = item.canonicalUrl || `${siteConfig.url}/layanan/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      siteName: 'SPATIUM',
      images: [{ url: item.heroImage || '/icon-512.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [item.heroImage || '/icon-512.png'],
    },
  }
}

export default async function LayananDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cat = await getServiceCategoryWithServices(slug)
  const svc = !cat ? await getServiceBySlug(slug) : null

  if (!cat && !svc) notFound()

  const item: any = cat || svc
  const blocks = Array.isArray(item.blocks) ? item.blocks : []
  const contextData = cat
    ? { subServices: cat.subServices || [] }
    : { portfolios: (svc as { portfolioItems?: unknown[] })?.portfolioItems || [] }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: item.title || item.name,
      description: item.shortDescription || item.description || '',
      url: `${siteConfig.url}/layanan/${slug}`,
      provider: { '@type': 'Organization', name: 'SPATIUM', url: siteConfig.url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
        { '@type': 'ListItem', position: 2, name: 'Layanan', item: `${siteConfig.url}/services` },
        {
          '@type': 'ListItem',
          position: 3,
          name: item.title || item.name,
          item: `${siteConfig.url}/layanan/${slug}`,
        },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} contextData={contextData} />
      ) : (
        <div className="container max-w-4xl mx-auto py-32 px-4 text-center">
          <h1 className="text-3xl font-bold font-heading">{item.title || item.name}</h1>
          <p className="mt-4 text-[var(--text-muted)]">{item.shortDescription}</p>
        </div>
      )}
    </main>
  )
}
