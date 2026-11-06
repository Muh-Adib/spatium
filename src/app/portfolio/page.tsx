import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PROJECTS, mapProjectCategory, type Project, type ProjectCategory } from '@/data/projects'
import { getCorePortfolios } from '@/lib/core'
import { PortfolioClient } from './PortfolioClient'
import { siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Portofolio Spasial & Reality Capture 3DGS',
  description:
    'Eksplorasi portofolio interaktif 3D Gaussian Splatting, LiDAR laser scanning, dan digital twin spasial SPATIUM di berbagai sektor industri: hospitality, kesehatan, manufaktur, agrikultur, dan perfilman.',
  alternates: {
    canonical: `${SITE_URL}/portfolio`,
  },
}

export const revalidate = 300

function mapCoreToProject(p: any): Project {
  const fallback = PROJECTS.find((lp) => lp.slug === p.slug) || PROJECTS[0]
  const cat = p.category || p.discipline
  let category: ProjectCategory = fallback.category === 'unknown' ? 'marketing' : fallback.category
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
    delivered: Array.isArray(p.technologies) ? p.technologies.map((t: any) => t.name || t) : fallback.delivered,
    variant: fallback.variant || 1,
    videoUrl: p.videoUrl || fallback.videoUrl,
    posterUrl: p.heroMedia?.url || (typeof p.heroImage === 'string' ? p.heroImage : p.heroImage?.url) || fallback.posterUrl,
    liveUrl: p.liveUrl || fallback.liveUrl,
    splatId: fallback.splatId,
    pointCount: fallback.pointCount,
    accuracy: fallback.accuracy,
    location: fallback.location,
    scenePairSlug: fallback.scenePairSlug,
    scenePairLabel: fallback.scenePairLabel,
  }
}

export default async function PortfolioPage() {
  const corePortfolios = await getCorePortfolios()
  const visibleCore = corePortfolios.filter((p: any) => p.status !== 'draft')
  const initialProjects: Project[] = visibleCore.length > 0
    ? visibleCore.map(mapCoreToProject)
    : PROJECTS

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
