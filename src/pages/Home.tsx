import { Seo, SITE_NAME, SITE_URL } from '@/components/Seo'
import { Hero } from '@/components/home/Hero'
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

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
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
    name: SITE_NAME,
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

export default function Home() {
  return (
    <>
      <Seo
        title="UNIMASI — Animation & Motion Design Studio"
        description="UNIMASI is an animation studio specialising in 2D animation, 3D animation and visual production, and motion graphics. We make ideas move."
        path="/"
        jsonLd={jsonLd}
      />
      <Hero />
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
