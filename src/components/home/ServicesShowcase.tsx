import Link from 'next/link'
import { CORE_SERVICES } from '@/data/services'
import { getCoreServices } from '@/lib/core'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import './services-showcase.css'

export async function ServicesShowcase({ initialServices }: { initialServices?: any[] } = {}) {
  const services = initialServices || (await getCoreServices())
  const displayServices = (services && services.length > 0 ? services : CORE_SERVICES).slice(0, 4)
  if (!displayServices || displayServices.length === 0) return null

  return (
    <section className="section services-showcase" id="services" aria-labelledby="services-title">
      <div className="container container--wide">
        <SectionHead
          id="services-title"
          eyebrow="4 Vertikal Layanan Spasial"
          title={
            <>
              Solusi Teknologi Spasial &amp; <span className="accent">Reality Capture</span>.
            </>
          }
          aside={
            <>
              <p className="lede">
                Dari rekonstruksi set film virtual, display interaktif ZMOT ritel &amp; F&B, hingga digital twin presisi sub-sentimeter dan preservasi memori abadi.
              </p>
              <Link href="/services" className="link-arrow">
                Lihat Seluruh Layanan
                <Icon name="arrow-right" size={17} />
              </Link>
            </>
          }
        />

        <div className="services-showcase__list">
          {displayServices.map((service: any, index: number) => (
            <article
              className={`service-block${index % 2 === 1 ? ' service-block--reverse' : ''}`}
              key={service.slug}
              id={service.slug}
            >
              <div className="service-block__copy">
                <Reveal variant={index % 2 === 0 ? 'left' : 'right'}>
                  <div className="service-block__index-row">
                    <span className="service-block__index">{service.index || `0${index + 1}`}</span>
                    <span className="service-block__rule" aria-hidden="true" />
                    <span className="pill" style={{ borderColor: 'transparent', background: 'rgba(255,214,0,0.12)', color: 'var(--yellow)' }}>
                      {service.shortName || service.name}
                    </span>
                  </div>

                  <h3 className="service-block__title display-md">
                    <Link href={`/services/${service.slug}`}>{service.name}</Link>
                  </h3>

                  <p className="service-block__tagline">{service.tagline}</p>
                  <p className="service-block__summary">{service.summary}</p>

                  <ul className="service-block__capabilities">
                    {(service.capabilities || []).slice(0, 6).map((cap: any) => (
                      <li key={typeof cap === 'string' ? cap : cap.title}>
                        <Icon name="check" size={14} />
                        {typeof cap === 'string' ? cap : cap.title}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/services/${service.slug}`} className="btn btn--ghost">
                    Explore {service.shortName || service.name}
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
                  <ServiceVisual kind={service.visual || '2d'} />
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
