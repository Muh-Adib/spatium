import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getCorePortfolios } from '@/lib/core'
import { PortfolioClient } from './PortfolioClient'
import { siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Portofolio Spasial & Reality Capture 3DGS',
  description:
    'Jelajahi scene 3D Gaussian Splatting dan digital twin SPATIUM di berbagai sektor: hospitality, kesehatan, manufaktur, food & beverage, agrikultur, dan properti.',
  alternates: {
    canonical: `${SITE_URL}/portfolio`,
  },
}

export const revalidate = 300

export default async function PortfolioPage() {
  const initialProjects = await getCorePortfolios()

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'SPATIUM Portofolio Spasial & 3DGS',
      url: `${SITE_URL}/portfolio`,
      isPartOf: { '@type': 'WebSite', name: 'SPATIUM', url: SITE_URL },
      hasPart: initialProjects.map((project) => ({
        '@type': 'CreativeWork',
        name: project.title,
        description: project.tagline,
        url: `${SITE_URL}/portfolio/${project.slug}`,
        genre: project.discipline,
      })),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Memuat portofolio spasial SPATIUM...</div>}>
        <PortfolioClient initialProjects={initialProjects} />
      </Suspense>
    </>
  )
}
