import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { getPage, getPages } from '@/lib/content/queries'
import { siteConfig } from '@/config/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300 // 5 minutes cache, ISR supported

export async function generateStaticParams() {
  try {
    const pages = await getPages()
    return pages.map((page) => ({ slug: page.slug }))
  } catch (err) {
    console.error('Failed to generate static params for /p/[slug]:', err)
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return {
      title: 'Halaman Tidak Ditemukan · UNIMASI Studio',
    }
  }

  const title = page.seo?.metaTitle || `${page.title} — UNIMASI Studio`
  const description =
    page.seo?.metaDescription ||
    page.excerpt ||
    'Landing page resmi UNIMASI Studio.'
  const canonical = page.canonical || `${siteConfig.url}/p/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      siteName: 'UNIMASI Studio',
    },
  }
}

export default async function DynamicBlockPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  const blocks = Array.isArray(page.blocks) ? page.blocks : []

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-white">
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} />
      ) : page.content ? (
        <div className="container max-w-4xl mx-auto py-32 px-4 sm:px-6">
          <h1 className="text-display-md font-bold mb-6 font-heading">{page.title}</h1>
          <div
            className="text-body-md text-[var(--text-muted)] leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      ) : (
        <div className="container max-w-4xl mx-auto py-32 px-4 text-center">
          <h1 className="text-display-md font-bold font-heading">{page.title}</h1>
          {page.excerpt && (
            <p className="mt-4 text-body-md text-[var(--text-muted)] max-w-xl mx-auto">
              {page.excerpt}
            </p>
          )}
        </div>
      )}
    </main>
  )
}
