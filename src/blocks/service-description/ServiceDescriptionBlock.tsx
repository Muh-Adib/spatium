import { IntroSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { ServiceDescriptionBlockData } from './definition'

/** Long description of the service with its use case's visual. */
export function ServiceDescriptionBlock({ block, entity }: { block: ServiceDescriptionBlockData; entity: EntityOf<'service'> }) {
  const view = entity.service
  return (
    <IntroSection
      headingId={sectionId(block.id, 'service-intro-title')}
      heading={block.heading}
      srHeading={`Tentang ${view.name}`}
      paragraphs={view.paragraphs}
      tools={view.tools}
      showVisual={block.showVisual !== false}
      visual={view.parent.visual}
      visualLabel={block.visualLabel || 'Interactive preview'}
      visualCaption={view.parent.shortName}
    />
  )
}
