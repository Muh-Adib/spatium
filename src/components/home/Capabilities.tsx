import Link from 'next/link'
import type { Service } from '@/lib/content/spatium-types'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import './capabilities.css'

export function Capabilities({ service }: { service?: Service }) {
  if (!service || service.capabilities.length === 0) return null
  return (
    <section className="section capabilities" id="capabilities" aria-labelledby="capabilities-title">
      <div className="bg-grid capabilities__grid" aria-hidden="true" />
      <div className="bg-glow bg-glow--yellow capabilities__glow" aria-hidden="true" data-parallax="12" />

      <div className="container container--wide capabilities__inner">
        <Reveal className="capabilities__head">
          <p className="eyebrow">Kapabilitas</p>
          <h2 className="display-md capabilities__title" id="capabilities-title">
            {service.name}
          </h2>
          <p className="lede capabilities__lede">{service.summary}</p>
          <Link href={`/services/${service.slug}`} className="btn btn--primary">
            Lihat detail {service.shortName}
            <span className="btn__icon">
              <Icon name="arrow-right" size={16} />
            </span>
          </Link>
        </Reveal>

        <div className="capabilities__body">
          <Reveal variant="scale" className="capabilities__visual">
            <div className="capabilities__visual-frame">
              <ServiceVisual kind={service.visual} />
            </div>
          </Reveal>

          <ul className="capabilities__list">
            {service.capabilities.map((cap, i) => (
              <Reveal as="li" key={cap.slug} id={cap.slug} delay={i * 80} className="capability-item">
                <span className="capability-item__num mono">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="capability-item__title">{cap.title}</h3>
                  <p className="capability-item__body">{cap.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Capabilities
