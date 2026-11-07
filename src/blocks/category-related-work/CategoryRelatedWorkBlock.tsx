import { RelatedProjectsSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { CategoryRelatedWorkBlockData } from './definition'

/** Published scenes picked by slug (catalogue order, like the former template). */
export function CategoryRelatedWorkBlock({ block, entity }: { block: CategoryRelatedWorkBlockData; entity: EntityOf<'service-category'> }) {
  const slugs = block.portfolioSlugs ?? []
  const projects = entity.projects.filter((p) => slugs.includes(p.slug)).slice(0, block.limit ?? 3)
  return (
    <RelatedProjectsSection
      headingId={sectionId(block.id, 'detail-work-heading')}
      eyebrow={block.eyebrow || 'Scene terkait'}
      heading={block.heading || `Contoh capture untuk ${entity.category.shortName}`}
      projects={projects}
      variant="detail"
      allLabel="Lihat semua scene"
    />
  )
}
