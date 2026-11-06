import type { Metadata } from 'next'
import { RevealProvider } from '@/components/motion/RevealProvider'
import { Hero } from '@/components/home/Hero'
import { PartnerLogos } from '@/components/home/PartnerLogos'
import { ServicesShowcase } from '@/components/home/ServicesShowcase'
import { Capabilities } from '@/components/home/Capabilities'
import { SpatialShowcase } from '@/components/home/SpatialShowcase'
import { SpatialVsTraditional } from '@/components/home/SpatialVsTraditional'
import { SpatialPipeline } from '@/components/home/SpatialPipeline'
import { WhyUnimasi } from '@/components/home/WhyUnimasi'
import { Industries } from '@/components/home/Industries'
import { JournalPreview } from '@/components/home/JournalPreview'
import { InquirySection } from '@/components/home/InquirySection'
import { getCorePartners, getCorePortfolios, getCoreServices } from '@/lib/core'
import { buildBrandGraph } from '@/lib/seo/brand-schema'
import { siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'SPATIUM — Spatial Technology Studio | 3D Gaussian Splatting & Digital Twin',
  description:
    'SPATIUM adalah studio teknologi spasial terdepan di Indonesia spesialis 3D Gaussian Splatting (3DGS), laser scanning LiDAR terestrial, dan reality capture fotorealistis skala 1:1 untuk Filmmaking, Marketing, Entertainment, dan Memory Preservation.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    title: 'SPATIUM — Real Places. New Perspectives. | Spatial Technology Studio',
    description:
      'Mengatasi The Curse of Distance dengan Walkable Images. Tur spasial 3D Gaussian Splatting 60 FPS real-time native WebGL untuk industri perfilman, properti, hospitality, dan preservasi memori.',
    url: SITE_URL,
    siteName: 'SPATIUM',
    images: [{ url: `${SITE_URL}/images/spatium-logo.png`, width: 1200, height: 630, alt: 'SPATIUM Spatial Technology Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SPATIUM — Spatial Technology Studio',
    description: 'Real places. New perspectives. One Point, Unlimited Possibilities with 3D Gaussian Splatting.',
    images: [`${SITE_URL}/images/spatium-logo.png`],
  },
}

export default async function HomePage() {
  const [portfolios, services, partners] = await Promise.all([
    getCorePortfolios(),
    getCoreServices(),
    getCorePartners(),
  ])

  const graph = buildBrandGraph({
    path: '/',
    title: 'SPATIUM — Spatial Technology Studio',
    description:
      'SPATIUM merekonstruksi ruang fisik menjadi pengalaman digital spasial fotorealistis interaktif 3D Gaussian Splatting berkecepatan 60 FPS.',
    services: (services as Array<{ title?: string; name?: string; tagline?: string; shortDescription?: string; summary?: string; slug: string }>).map((s) => ({
      name: s.title ?? s.name ?? '',
      description: s.tagline ?? s.shortDescription ?? s.summary ?? '',
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
        <Hero />
        <PartnerLogos partners={partners as unknown as import('@/data/clients').PartnerLogo[]} />
        <SpatialShowcase initialProjects={portfolios as unknown as import('@/data/projects').Project[]} />
        <SpatialVsTraditional />
        <SpatialPipeline />
        <ServicesShowcase initialServices={services} />
        <Capabilities />
        <WhyUnimasi />
        <Industries />
        <JournalPreview />
        <InquirySection />
      </RevealProvider>
    </>
  )
}
