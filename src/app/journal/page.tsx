import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SORTED_ARTICLES } from '@/data/articles'
import { JournalClient } from './JournalClient'

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Articles on animation briefs, storyboards, 2D and 3D pipelines, motion design systems and AI-assisted production — written by the UNIMASI studio.',
  alternates: {
    canonical: `${SITE_URL}/journal`,
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'UNIMASI Journal',
    url: `${SITE_URL}/journal`,
    description:
      'Practical writing on animation briefs, storyboards, production pipelines and motion design.',
    blogPost: SORTED_ARTICLES.map((article) => ({
      '@type': 'BlogPosting',
      headline: article.title,
      url: `${SITE_URL}/journal/${article.slug}`,
      datePublished: article.date,
      author: { '@type': 'Organization', name: 'UNIMASI' },
    })),
  },
]

export default function JournalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Loading journal...</div>}>
        <JournalClient />
      </Suspense>
    </>
  )
}
