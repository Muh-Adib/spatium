import { IntroSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { CategoryIntroBlockData } from './definition'

/** Intro paragraphs (block override, else the summary), tools and the use-case visual. */
export function CategoryIntroBlock({ block, entity }: { block: CategoryIntroBlockData; entity: EntityOf<'service-category'> }) {
  const view = entity.category
  const paragraphs = block.paragraphs && block.paragraphs.length > 0 ? block.paragraphs : view.summary ? [view.summary] : []
  return (
    <IntroSection
      headingId={sectionId(block.id, 'detail-intro-title')}
      srHeading="Tentang layanan ini"
      paragraphs={paragraphs}
      tools={block.showTools === false ? [] : view.tools}
      showVisual={block.showVisual !== false}
      visual={view.visual}
      visualLabel={block.visualLabel || 'Interactive preview'}
      visualCaption={view.shortName}
    />
  )
}
