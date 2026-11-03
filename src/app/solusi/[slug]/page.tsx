import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSolutionBySlug, getSolutions } from '@/lib/db/solutions'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { siteConfig } from '@/config/site'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const solutions = await getSolutions()
    return solutions.map((sol) => ({ slug: sol.slug }))
  } catch (err) {
    console.error('Error in generateStaticParams for /solusi:', err)
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const sol = await getSolutionBySlug(slug)
  if (!sol) return { title: 'Solusi Tidak Ditemukan · UNIMASI' }

  const title = sol.metaTitle || `${sol.title} · Solusi UNIMASI`
  const description =
    sol.metaDescription ||
    sol.shortDescription ||
    'Solusi animasi dan rekayasa visual 3D berstandar industri dari UNIMASI Studio.'
  const canonical = sol.canonicalUrl || `${siteConfig.url}/solusi/${sol.slug}`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      siteName: 'UNIMASI Studio',
      images: [
        {
          url: sol.heroImage || '/icon-512.png',
          width: 1200,
          height: 630,
          alt: sol.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [sol.heroImage || '/icon-512.png'],
    },
  }
}

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const sol = await getSolutionBySlug(slug)

  if (!sol) notFound()

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: sol.title,
      serviceType: sol.category || 'Business Solution',
      description: sol.shortDescription || sol.description || '',
      url: `${siteConfig.url}/solusi/${sol.slug}`,
      provider: {
        '@type': 'Organization',
        name: 'UNIMASI Studio',
        url: siteConfig.url,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
        { '@type': 'ListItem', position: 2, name: 'Solusi', item: `${siteConfig.url}/solusi` },
        {
          '@type': 'ListItem',
          position: 3,
          name: sol.title,
          item: `${siteConfig.url}/solusi/${sol.slug}`,
        },
      ],
    },
  ]

  const blocks = Array.isArray(sol.blocks) ? sol.blocks : []

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {blocks.length > 0 ? (
        <BlockRenderer
          blocks={blocks}
          contextData={{
            portfolios: sol.relatedPortfolios || [],
          }}
        />
      ) : (
        <div className="container max-w-4xl mx-auto py-32 px-4 text-center">
          <h1 className="text-3xl font-bold font-heading">{sol.title}</h1>
          <p className="mt-4 text-[var(--text-muted)]">{sol.shortDescription}</p>
        </div>
      )}
    </main>
  )
}
