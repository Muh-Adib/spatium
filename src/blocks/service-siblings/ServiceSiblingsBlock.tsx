import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { NavCardsSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { ServiceSiblingsBlockData } from './definition'

/** Link back to the parent use case and the other published services in it. */
export function ServiceSiblingsBlock({ block, entity }: { block: ServiceSiblingsBlockData; entity: EntityOf<'service'> }) {
  const { parent } = entity.service
  return (
    <NavCardsSection
      headingId={sectionId(block.id, 'service-siblings-heading')}
      eyebrow={block.eyebrow || `Bagian dari ${parent.name}`}
      heading={block.heading || 'Kapabilitas lainnya'}
      aside={
        <Link href={`/services/${parent.slug}`} className="link-arrow">
          Lihat {parent.shortName}
          <Icon name="arrow-right" size={16} />
        </Link>
      }
      cards={entity.siblings.map((item, i) => ({
        key: item.slug,
        href: item.href,
        index: String(i + 1).padStart(2, '0'),
        title: item.title,
        body: item.description,
        cta: 'Lihat layanan',
      }))}
    />
  )
}
