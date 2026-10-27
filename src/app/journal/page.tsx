import { Suspense } from 'react'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
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

  let dbQuery = supabase
    .from('posts')
    .select(
      'id, slug, title, category_name, excerpt, yoast_description, published_at, author_name, featured_image_url',
      { count: 'exact' }
    )
    .eq('status', 'publish')

  if (category !== 'all') {
    dbQuery = dbQuery.eq('category_name', category)
  }

  if (query) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,slug.ilike.%${query}%,yoast_description.ilike.%${query}%`
    )
  }

  const isPageOneWithoutSearch = page === 1 && !query

  let from = 0
  let to = pageSize - 1

  if (isPageOneWithoutSearch) {
    from = 0
    to = pageSize // 0 to 12 = 13 items (1 featured + 12 in grid)
  } else if (!query) {
    from = (pageSize + 1) + (page - 2) * pageSize
    to = from + pageSize - 1
  } else {
    from = (page - 1) * pageSize
    to = from + pageSize - 1
  }

  const { data: posts, count: totalCount } = await dbQuery
    .order('published_at', { ascending: false })
    .range(from, to)

  // Fetch exact total count & category counts across full dataset
  const [{ data: catBatch1 }, { data: catBatch2 }, { count: exactTotalPublished }] =
    await Promise.all([
      supabase.from('posts').select('category_name').eq('status', 'publish').range(0, 999),
      supabase.from('posts').select('category_name').eq('status', 'publish').range(1000, 1999),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'publish'),
    ])

  const allCategoriesData = [...(catBatch1 || []), ...(catBatch2 || [])]
  const categoryCounts: Record<string, number> = {}
  allCategoriesData.forEach((row) => {
    const cat = row.category_name || 'Artikel'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  const sortedCategories: JournalCategory[] = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  const totalAll = exactTotalPublished || allCategoriesData.length || 1147

  const total = totalCount || 0
  let totalPages = 1
  if (!query) {
    totalPages = total <= 13 ? 1 : 1 + Math.ceil((total - 13) / pageSize)
  } else {
    totalPages = Math.ceil(total / pageSize)
  }

  const items: ArticleCardItem[] = (posts || []).map((p) => ({
    slug: p.slug,
    href: `/${p.slug}/`,
    title: p.title,
    category: p.category_name || 'Artikel',
    excerpt:
      p.yoast_description ||
      (p.excerpt ? p.excerpt.replace(/<[^>]+>/g, '').slice(0, 160) + '…' : ''),
    date: p.published_at || '',
    author: p.author_name || 'UNIMASI',
    featuredImageUrl: p.featured_image_url,
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
          totalAllCount={totalAll}
          currentPage={page}
          totalPages={totalPages}
          currentCategory={category}
          currentQuery={query}
          categories={sortedCategories}
        />
      </Suspense>
    </>
  )
}
