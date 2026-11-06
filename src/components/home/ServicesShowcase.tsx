import Link from 'next/link'
import type { Service } from '@/lib/content/spatium-types'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import './services-showcase.css'

export function ServicesShowcase({ services }: { services: Service[] }) {
  const displayServices = services.slice(0, 4)
  if (displayServices.length === 0) return null

  return (
    <section className="section services-showcase" id="services" aria-labelledby="services-title">
      <div className="container container--wide">
        <SectionHead
          id="services-title"
          eyebrow="Use case"
          title={
            <>
              Solusi Teknologi Spasial &amp; <span className="accent">Reality Capture</span>.
            </>
          }
          aside={
            <>
              <p className="lede">
                Dari rekonstruksi set film, spatial tour untuk bisnis, instalasi imersif, hingga preservasi memori — semuanya berangkat dari satu kali capture ruang nyata.
              </p>
              <Link href="/services" className="link-arrow">
                Lihat Seluruh Layanan
                <Icon name="arrow-right" size={17} />
              </Link>
            </>
          }
        />

        <div className="services-showcase__list">
          {displayServices.map((service, index) => (
            <article
              className={`service-block${index % 2 === 1 ? ' service-block--reverse' : ''}`}
              key={service.slug}
              id={service.slug}
            >
              <div className="service-block__copy">
                <Reveal variant={index % 2 === 0 ? 'left' : 'right'}>
                  <div className="service-block__index-row">
                    <span className="service-block__index">{service.index}</span>
                    <span className="service-block__rule" aria-hidden="true" />
                    <span className="pill" style={{ borderColor: 'transparent', background: 'rgba(77, 139, 255, 0.12)', color: '#6fb0ff' }}>
                      {service.shortName}
                    </span>
                  </div>

                  <h3 className="service-block__title display-md">
                    <Link href={`/services/${service.slug}`}>{service.name}</Link>
                  </h3>

                  <p className="service-block__tagline">{service.tagline}</p>
                  <p className="service-block__summary">{service.summary}</p>

                  <ul className="service-block__capabilities">
                    {service.capabilities.slice(0, 6).map((cap) => (
                      <li key={cap.slug}>
                        <Icon name="check" size={14} />
                        {cap.title}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/services/${service.slug}`} className="btn btn--ghost">
                    Lihat {service.shortName}
                    <span className="btn__icon">
                      <Icon name="arrow-right" size={16} />
                    </span>
                  </Link>
                </Reveal>
              </div>

              <Reveal variant="scale" delay={120} className="service-block__visual">
                <div className="service-block__frame">
                  <div className="service-block__frame-head">
                    <span className="mono">Interactive preview</span>
                    <span className="service-block__dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                  <ServiceVisual kind={service.visual} />
                </div>
              </Reveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesShowcase
