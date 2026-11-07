import { RelatedProjectsSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { ServiceRelatedWorkBlockData } from './definition'

/** Published scenes linked to this service in the Studio. */
export function ServiceRelatedWorkBlock({ block, entity }: { block: ServiceRelatedWorkBlockData; entity: EntityOf<'service'> }) {
  return (
    <RelatedProjectsSection
      headingId={sectionId(block.id, 'service-work-heading')}
      eyebrow={block.eyebrow || 'Scene terkait'}
      heading={block.heading || `Contoh capture untuk ${entity.service.name}`}
      projects={entity.projects.slice(0, block.limit ?? 3)}
      variant="detail"
      allLabel="Lihat semua scene"
    />
  )
}
