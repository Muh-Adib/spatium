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

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'Articles',
  description:
    'Articles on 3D animation, videotron production, motion graphics, and CGI pipelines — written by UNIMASI studio.',
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

  // Fetch articles from SegiaTech Core Delivery API
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
    href: `/${p.slug}/`,
    title: p.title,
    category: getCategoryName(p.category),
    excerpt:
      p.seoData?.metaDescription ||
      p.seo?.metaDescription ||
      (p.excerpt ? p.excerpt.replace(/<[^>]+>/g, '').slice(0, 160) + '…' : ''),
    date: p.publishedAt || p.createdAt || '',
    author: getAuthorName(p.author),
    featuredImageUrl: getMediaUrl(p.featuredImage, p.coverUrl),
  }))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'UNIMASI Journal',
      url: `${SITE_URL}/journal`,
      description:
        'Practical writing on animation briefs, 3D CGI production pipelines, and motion design.',
      blogPost: items.slice(0, 10).map((article) => ({
        '@type': 'BlogPosting',
        headline: article.title,
        url: `${SITE_URL}/${article.slug}/`,
        datePublished: article.date,
        author: { '@type': 'Organization', name: 'UNIMASI' },
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
            Loading journal...
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
