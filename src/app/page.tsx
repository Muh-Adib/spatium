import type { Metadata } from 'next'
import { RevealProvider } from '@/components/motion/RevealProvider'
import { Hero } from '@/components/home/Hero'
import { PartnerLogos } from '@/components/home/PartnerLogos'
import { ServicesShowcase } from '@/components/home/ServicesShowcase'
import { Capabilities } from '@/components/home/Capabilities'
import { PortfolioPreview } from '@/components/home/PortfolioPreview'
import { ProcessTimeline } from '@/components/home/ProcessTimeline'
import { WhyUnimasi } from '@/components/home/WhyUnimasi'
import { Industries } from '@/components/home/Industries'
import { JournalPreview } from '@/components/home/JournalPreview'
import { InquirySection } from '@/components/home/InquirySection'
import { SERVICES } from '@/data/services'
import { STUDIO_EMAIL } from '@/data/site'
import { getCorePortfolios, getCoreServices } from '@/lib/core'
import { buildBrandGraph } from '@/lib/seo/brand-schema'

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'UNIMASI — Animation & Motion Design Studio',
  description:
    'UNIMASI is an animation studio specialising in 2D animation, 3D animation and visual production, and motion graphics. We make ideas move.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    title: 'UNIMASI — Animation & Motion Design Studio',
    description:
      'UNIMASI is an animation studio specialising in 2D animation, 3D animation and visual production, and motion graphics. We make ideas move.',
    url: SITE_URL,
    siteName: 'UNIMASI',
    images: [{ url: `${SITE_URL}/icon-512.png`, width: 512, height: 512, alt: 'UNIMASI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNIMASI — Animation & Motion Design Studio',
    description: 'We make ideas move — 2D, 3D animation and motion graphics.',
    images: [`${SITE_URL}/icon-512.png`],
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UNIMASI',
    url: SITE_URL,
    description:
      'Animation and motion design studio specialising in 2D animation, 3D animation and visual production, and motion graphics.',
    email: STUDIO_EMAIL,
    knowsAbout: [
      '2D Animation',
      '3D Animation',
      'Motion Graphics',
      'Explainer Video',
      'Architectural Visualization',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UNIMASI',
    url: SITE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'UNIMASI services',
    itemListElement: SERVICES.map((service, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: service.name,
      url: `${SITE_URL}/services/${service.slug}`,
    })),
  },
]

export default async function HomePage() {
  const [portfolios, services] = await Promise.all([
    getCorePortfolios(),
    getCoreServices(),
  ])

  const graph = buildBrandGraph({
    path: '/',
    title: 'UNIMASI — Animation & Motion Design Studio',
    description:
      'UNIMASI mengubah ide, informasi, produk, dan konsep kompleks menjadi visual digital yang menarik, komunikatif, dan mudah dipahami.',
    services: SERVICES.map((s: any) => ({
      name: s.title ?? s.name,
      description: s.tagline ?? s.shortDescription ?? s.summary,
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
        <PartnerLogos />
        <ServicesShowcase initialServices={services} />
        <Capabilities />
        <PortfolioPreview initialProjects={portfolios as any} />
        <ProcessTimeline />
        <WhyUnimasi />
        <Industries />
        <JournalPreview />
        <InquirySection />
      </RevealProvider>
    </>
  )
}
