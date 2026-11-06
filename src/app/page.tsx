import type { Metadata } from 'next'
import { RevealProvider } from '@/components/motion/RevealProvider'
import { HomeHero } from '@/components/spatium/HomeHero'
import {
  WayWeSeeSpace,
  DistanceStatement,
  WalkableImage,
  SpatialMediaCompare,
  PipelineSection,
  PossibilitiesSection,
  ClosingCta,
} from '@/components/spatium/HomeSections'
import { UseCaseStories } from '@/components/spatium/UseCaseStories'
import { SceneExplorer, type ExplorerScene } from '@/components/spatium/SceneExplorer'
import { PartnerLogos } from '@/components/home/PartnerLogos'
import { PROJECT_CATEGORIES } from '@/lib/content/spatium-types'
import '@/components/spatium/spatium.css'
import { getCorePartners, getCorePortfolios, getCoreServices } from '@/lib/core'
import { buildBrandGraph } from '@/lib/seo/brand-schema'
import { siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'SPATIUM — Spatial Technology Studio | 3D Gaussian Splatting & Digital Twin',
  description:
    'SPATIUM — Spatial Technology Studio. Digital twin untuk industri kreatif: laser scan, point cloud, dan 3D Gaussian Splat fotorealistis untuk Filmmaking, Marketing & Branding, Entertainment, dan Memory.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    title: 'SPATIUM — Real Places. New Perspectives. | Spatial Technology Studio',
    description:
      'Walkable Image — walk, explore, and breathe inside the space as you are truly there. Digital twin & 3D Gaussian Splatting untuk industri kreatif.',
    url: SITE_URL,
    siteName: 'SPATIUM',
    images: [{ url: `${SITE_URL}/icon-512.png`, width: 512, height: 512, alt: 'SPATIUM Spatial Technology Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SPATIUM — Spatial Technology Studio',
    description: 'Real places. New perspectives. One Point, Unlimited Possibilities with 3D Gaussian Splatting.',
    images: [`${SITE_URL}/icon-512.png`],
  },
}

export default async function HomePage() {
  const [services, partners, projects] = await Promise.all([getCoreServices(), getCorePartners(), getCorePortfolios()])

  const scenes: ExplorerScene[] = projects.filter((p) => p.liveUrl && p.sceneUrl).map((p) => ({
    slug: p.slug,
    title: p.title,
    discipline: p.discipline,
    category: p.category,
    tagline: p.tagline,
    embedUrl: p.liveUrl ?? '',
    sceneUrl: p.sceneUrl ?? '',
    posterUrl: p.posterUrl,
  }))
  const sectorCount = new Set(scenes.map((s) => s.discipline.split(' · ')[0])).size

  const graph = buildBrandGraph({
    path: '/',
    title: 'SPATIUM — Spatial Technology Studio',
    description:
      'SPATIUM merekam ruang nyata dan merekonstruksinya menjadi 3D Gaussian Splat fotorealistis yang bisa dijelajahi dari mana saja.',
    services: services.map((s) => ({
      name: s.name,
      description: s.summary || s.tagline,
      url: `/services/${s.slug}`,
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <RevealProvider>
        <div className="sp-home">
          <HomeHero sceneCount={scenes.length} />
          <WayWeSeeSpace />
          <DistanceStatement />
          <WalkableImage />
          <SpatialMediaCompare />
          <PipelineSection />
          <PossibilitiesSection services={services} />

          <section className="sp-section" aria-labelledby="sp-stories-title">
            <div className="sp-container">
              <header className="sp-head" data-reveal>
                <p className="sp-eyebrow">06 · Use cases</p>
                <h2 id="sp-stories-title" className="sp-h2">
                  Real places, <span className="sp-accent">real productions.</span>
                </h2>
              </header>
              <UseCaseStories />
            </div>
          </section>

          <section id="scenes" className="sp-section" aria-labelledby="sp-scenes-title">
            <div className="sp-container">
              <div className="sp-scenes__head">
                <header className="sp-head" data-reveal>
                  <p className="sp-eyebrow">07 · Reality capture showcase</p>
                  <h2 id="sp-scenes-title" className="sp-h2">
                    Captured spaces, <span className="sp-accent">ready to explore.</span>
                  </h2>
                </header>
                <p className="sp-scenes__count" data-reveal>
                  <strong>{String(scenes.length).padStart(2, '0')}</strong> scene · {sectorCount} sektor industri
                </p>
              </div>
              <SceneExplorer scenes={scenes} filters={PROJECT_CATEGORIES} />
            </div>
          </section>

          <PartnerLogos partners={partners} />
          <ClosingCta />
        </div>
      </RevealProvider>
    </>
  )
}
