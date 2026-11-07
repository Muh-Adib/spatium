import { NavCardsSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { CategoryNextBlockData } from './definition'

/** The other published use cases. */
export function CategoryNextBlock({ block, entity }: { block: CategoryNextBlockData; entity: EntityOf<'service-category'> }) {
  return (
    <NavCardsSection
      headingId={sectionId(block.id, 'detail-next-heading')}
      eyebrow={block.eyebrow || 'Use case lain'}
      heading={block.heading || 'Jelajahi lebih lanjut'}
      cards={entity.others.map((item) => ({
        key: item.slug,
        href: `/services/${item.slug}`,
        index: item.index,
        title: item.name,
        body: item.tagline,
        cta: 'Lihat layanan',
      }))}
    />
  )
}
