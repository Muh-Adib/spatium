import type { Metadata } from 'next'
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

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'UNIMASI — Animation & Motion Design Studio',
  description:
    'UNIMASI is an animation studio specialising in 2D animation, 3D animation and visual production, and motion graphics. We make ideas move.',
  alternates: {
    canonical: SITE_URL,
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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <PartnerLogos />
      <ServicesShowcase />
      <Capabilities />
      <PortfolioPreview />
      <ProcessTimeline />
      <WhyUnimasi />
      <Industries />
      <JournalPreview />
      <InquirySection />
    </>
  )
}
