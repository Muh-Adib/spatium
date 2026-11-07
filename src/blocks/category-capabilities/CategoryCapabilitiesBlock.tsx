import Link from 'next/link'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { CategoryCapabilitiesBlockData } from './definition'

/** Published child services; each card links to its own page (`id` keeps old `#slug` anchors working). */
export function CategoryCapabilitiesBlock({ block, entity }: { block: CategoryCapabilitiesBlockData; entity: EntityOf<'service-category'> }) {
  const view = entity.category
  const caps = block.limit ? view.capabilities.slice(0, block.limit) : view.capabilities
  if (caps.length === 0) return null
  const headingId = sectionId(block.id, 'capabilities-heading')
  return (
    <section className="section detail-capabilities" aria-labelledby={headingId}>
      <div className="container container--wide">
        <SectionHead
          id={headingId}
          eyebrow={block.eyebrow || 'Cakupan'}
          title={block.heading || `Kapabilitas ${view.shortName}`}
          aside={
            <p className="lede">
              {block.lede ||
                'Setiap kapabilitas bisa dikerjakan terpisah atau digabungkan dalam satu proyek, berangkat dari data capture yang sama.'}
            </p>
          }
        />

        <ul className="detail-capabilities__grid">
          {caps.map((cap, i) => (
            <Reveal as="li" key={cap.slug} id={cap.slug} delay={i * 60} className="detail-capability detail-capability--link">
              <span className="detail-capability__num mono">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="detail-capability__title">
                <Link href={cap.href} className="detail-capability__link">
                  {cap.title}
                </Link>
              </h3>
              <p className="detail-capability__body">{cap.description}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
