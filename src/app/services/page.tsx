import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/ui/PageHero'
import { ServicesShowcase } from '@/components/home/ServicesShowcase'
import { Capabilities } from '@/components/home/Capabilities'
import { ProcessTimeline } from '@/components/home/ProcessTimeline'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { CORE_SERVICES, SERVICES } from '@/data/services'
import { INDUSTRIES } from '@/data/site'
import { getCoreServices } from '@/lib/core'
import '@/pages/services.css'

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'Animation & Motion Design Services',
  description:
    '2D animation, 3D animation, motion graphics, and digital visual assets with AI-assisted production — the four UNIMASI capabilities.',
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
}

const jsonLd = SERVICES.map((service) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.name,
  serviceType: service.name,
  description: service.metaDescription,
  url: `${SITE_URL}/services/${service.slug}`,
  provider: { '@type': 'Organization', name: 'UNIMASI', url: SITE_URL },
}))

export default async function ServicesPage() {
  const services = await getCoreServices()
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="Services"
        title={
          <>
            Everything we do, <span className="accent">and why</span>.
          </>
        }
        lede="Three core disciplines supported by a digital asset pipeline. Each one has its own visual language, its own production route and its own ideal use case."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Services' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="layers" size={13} /> 4 core disciplines
            </span>
            <span className="pill">
              <Icon name="sparkle" size={13} /> AI-assisted production
            </span>
            <span className="pill">
              <Icon name="users" size={13} /> 8 industries served
            </span>
          </>
        }
      />

      <ServicesShowcase initialServices={services} />

      <section className="section services-compare" aria-labelledby="compare-title">
        <div className="container container--wide">
          <SectionHead
            id="compare-title"
            eyebrow="Side by side"
            title="Which discipline fits your message?"
            aside={
              <p className="lede">
                A quick comparison of what each discipline is best at, what it produces and how it is
                typically used.
              </p>
            }
          />

          <Reveal className="compare-table-wrap">
            <table className="compare-table">
              <caption className="sr-only">Comparison of the three core animation disciplines</caption>
              <thead>
                <tr>
                  <th scope="col">At a glance</th>
                  {CORE_SERVICES.map((service) => (
                    <th scope="col" key={service.slug}>
                      <span className="compare-table__index mono">{service.index}</span>
                      <Link href={`/services/${service.slug}`}>{service.shortName}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Best for</th>
                  {CORE_SERVICES.map((service) => (
                    <td key={service.slug}>{service.tagline}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Core capabilities</th>
                  {CORE_SERVICES.map((service) => (
                    <td key={service.slug}>
                      <ul className="compare-table__list">
                        {service.capabilities.slice(0, 4).map((cap) => (
                          <li key={cap.title}>{cap.title}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Typical deliverables</th>
                  {CORE_SERVICES.map((service) => (
                    <td key={service.slug}>
                      <ul className="compare-table__list">
                        {service.deliverables.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Toolchain</th>
                  {CORE_SERVICES.map((service) => (
                    <td key={service.slug}>
                      <div className="compare-table__tools">
                        {service.tools.slice(0, 4).map((tool) => (
                          <span className="pill" key={tool}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">&nbsp;</th>
                  {CORE_SERVICES.map((service) => (
                    <td key={service.slug}>
                      <Link href={`/services/${service.slug}`} className="link-arrow">
                        Detail page
                        <Icon name="arrow-right" size={15} />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Reveal>

          <ul className="services-industries">
            {INDUSTRIES.map((industry) => (
              <li key={industry.name}>
                <Icon name={industry.icon} size={16} />
                {industry.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Capabilities />
      <ProcessTimeline />

      <CTASection
        id="services-cta"
        eyebrow="Not sure which applies?"
        title={
          <>
            Send the brief — we will recommend the <span className="accent">right pipeline</span>.
          </>
        }
        body="We regularly explain why a project does not need the expensive option. The recommendation comes with the trade-offs stated."
        primary={{ label: 'Start a Project', to: '/contact' }}
        secondary={{ label: 'See portfolio', to: '/portfolio' }}
      />
    </>
  )
}
