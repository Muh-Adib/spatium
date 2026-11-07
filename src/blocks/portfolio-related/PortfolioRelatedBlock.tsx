import { RelatedProjectsSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { PortfolioRelatedBlockData } from './definition'

/** Other published scenes (first ones in catalogue order). */
export function PortfolioRelatedBlock({ block, entity }: { block: PortfolioRelatedBlockData; entity: EntityOf<'portfolio'> }) {
  return (
    <RelatedProjectsSection
      headingId={sectionId(block.id, 'related-heading')}
      eyebrow={block.eyebrow || 'Karya Terkait'}
      heading={block.heading || 'Eksplorasi Capture Spasial Lainnya'}
      projects={entity.related.slice(0, block.limit ?? 3)}
      variant="project"
      allLabel="Lihat Seluruh Portfolio"
    />
  )
}
