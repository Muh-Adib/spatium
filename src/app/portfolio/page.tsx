import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PROJECTS, type Project, type ProjectCategory } from '@/data/projects'
import { getCorePortfolios } from '@/lib/core'
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

export const revalidate = 300

function mapCoreToUnimasiProject(p: any): Project {
  const fallback = PROJECTS.find((lp) => lp.slug === p.slug) || PROJECTS[0]
  const cat = (p.category?.toLowerCase() || '3d')
  let category: ProjectCategory = '3d'
  if (cat.includes('2d')) category = '2d'
  else if (cat.includes('motion') || cat.includes('grafis')) category = 'motion'
  else if (cat.includes('asset') || cat.includes('ai')) category = 'assets'

  return {
    slug: p.slug,
    title: p.title || fallback.title,
    client: p.client || fallback.client,
    category,
    discipline: p.category || fallback.discipline,
    year: String(p.year || fallback.year || '2024'),
    tagline: p.summary || fallback.tagline,
    brief: p.challenge || p.summary || fallback.brief,
    approach: p.solution ? [p.solution] : fallback.approach,
    delivered: Array.isArray(p.technologies) ? p.technologies.map((t: any) => t.name) : fallback.delivered,
    variant: fallback.variant || 1,
    videoUrl: p.videoUrl || fallback.videoUrl,
    posterUrl: p.heroImage?.url || fallback.posterUrl,
  }
}

export default async function PortfolioPage() {
  const corePortfolios = await getCorePortfolios()
  const initialProjects: Project[] = corePortfolios.length > 0
    ? corePortfolios.map(mapCoreToUnimasiProject)
    : PROJECTS

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'UNIMASI portfolio',
      url: `${SITE_URL}/portfolio`,
      isPartOf: { '@type': 'WebSite', name: 'UNIMASI', url: SITE_URL },
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
      <Suspense fallback={<div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Loading portfolio...</div>}>
        <PortfolioClient initialProjects={initialProjects} />
      </Suspense>
    </>
  )
}
