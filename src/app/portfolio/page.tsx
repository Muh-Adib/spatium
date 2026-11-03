import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PROJECTS, mapProjectCategory, type Project, type ProjectCategory } from '@/data/projects'
import { getCorePortfolios } from '@/lib/core'
import { PortfolioClient } from './PortfolioClient'

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'Animation Portfolio & Case Studies',
  description:
    'Selected 2D animation, 3D animation, motion graphics and digital asset work from the UNIMASI studio, presented as capability case studies.',
  alternates: {
    canonical: `${SITE_URL}/portfolio`,
  },
}

export const revalidate = 300

function mapCoreToUnimasiProject(p: any): Project {
  const fallback = PROJECTS.find((lp) => lp.slug === p.slug) || PROJECTS[0]
  const cat = p.category || p.discipline
  let category: ProjectCategory = fallback.category === 'unknown' ? 'motion' : fallback.category
  const mapped = mapProjectCategory(cat)
  if (mapped !== 'unknown') category = mapped

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
    posterUrl: p.heroMedia?.url || (typeof p.heroImage === 'string' ? p.heroImage : p.heroImage?.url) || fallback.posterUrl,
  }
}

export default async function PortfolioPage() {
  const corePortfolios = await getCorePortfolios()
  // Draft items (unverified metrics / missing assets) never reach the public list.
  const visibleCore = corePortfolios.filter((p: any) => p.status !== 'draft')
  const initialProjects: Project[] = visibleCore.length > 0
    ? visibleCore.map(mapCoreToUnimasiProject)
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
