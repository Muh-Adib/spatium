import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PROJECTS } from '@/data/projects'
import { PortfolioClient } from './PortfolioClient'

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Selected 2D animation, 3D animation, motion graphics and digital asset work from the UNIMASI studio, presented as capability case studies.',
  alternates: {
    canonical: `${SITE_URL}/portfolio`,
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'UNIMASI portfolio',
    url: `${SITE_URL}/portfolio`,
    isPartOf: { '@type': 'WebSite', name: 'UNIMASI', url: SITE_URL },
    hasPart: PROJECTS.map((project) => ({
      '@type': 'CreativeWork',
      name: project.title,
      description: project.tagline,
      url: `${SITE_URL}/portfolio/${project.slug}`,
      genre: project.discipline,
    })),
  },
]

export default function PortfolioPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Loading portfolio...</div>}>
        <PortfolioClient />
      </Suspense>
    </>
  )
}
