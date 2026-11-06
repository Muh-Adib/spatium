import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  getCoreArticles,
  getCoreCategories,
  getAuthorName,
  getCategoryName,
  getMediaUrl,
} from '@/lib/core'
import { JournalClient, type JournalCategory } from './JournalClient'
import type { ArticleCardItem } from '@/components/journal/ArticleCard'

import { siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Wawasan Spasial & Riset 3DGS — SPATIUM',
  description:
    'Artikel SPATIUM seputar 3D Gaussian Splatting, digital twin, previz film, spatial tour untuk bisnis, dan preservasi memori.',
  alternates: {
    canonical: `${SITE_URL}/journal`,
  },
}

export const revalidate = 300 // Revalidate cache every 5 minutes

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const params = await searchParams
  const category = params.category || 'all'
  const query = (params.q || '').trim()
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const pageSize = 12

  // Published articles from PostgreSQL (honest empty result on DB failure)
  const [articlesData, categoriesData] = await Promise.all([
    getCoreArticles({
      page,
      pageSize,
      category,
      search: query,
    }),
    getCoreCategories(),
  ])

  const total = articlesData.total
  const totalPages = Math.max(1, articlesData.pageCount)

  const items: ArticleCardItem[] = articlesData.articles.map((p) => ({
    slug: p.slug,
    href: `/journal/${p.slug}`,
    title: p.title,
    category: getCategoryName(p.category),
    excerpt: p.excerpt ? p.excerpt.replace(/<[^>]+>/g, '') : p.seo?.metaDescription || '',
    date: p.publishedAt || p.createdAt || '',
    author: getAuthorName(p.author),
    readMinutes: p.readingTime,
    featuredImageUrl: getMediaUrl(p.featuredImage, p.coverUrl),
  }))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'SPATIUM Journal',
      url: `${SITE_URL}/journal`,
      description:
        'Artikel SPATIUM seputar digital twin dan 3D Gaussian Splatting untuk industri kreatif.',
      blogPost: items.slice(0, 10).map((article) => ({
        '@type': 'BlogPosting',
        headline: article.title,
        url: `${SITE_URL}/journal/${article.slug}`,
        datePublished: article.date,
        author: { '@type': 'Organization', name: article.author || 'SPATIUM' },
      })),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
            Memuat artikel...
          </div>
        }
      >
        <JournalClient
          posts={items}
          totalCount={total}
          totalAllCount={total}
          currentPage={page}
          totalPages={totalPages}
          currentCategory={category}
          currentQuery={query}
          categories={categoriesData}
        />
      </Suspense>
    </>
  )
}
