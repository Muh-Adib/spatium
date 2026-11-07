import { DeliverablesSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { CategoryDeliverablesBlockData } from './definition'

/** Deliverables of the use case and the digital-twin pipeline timeline. */
export function CategoryDeliverablesBlock({ block, entity }: { block: CategoryDeliverablesBlockData; entity: EntityOf<'service-category'> }) {
  return (
    <DeliverablesSection
      headingId={sectionId(block.id, 'deliverables-heading')}
      eyebrow={block.eyebrow || 'Keluaran'}
      heading={
        block.heading || (
          <>
            Apa yang <span className="accent">Anda terima</span>.
          </>
        )
      }
      lede={block.lede || 'Keluaran disesuaikan dengan tujuan proyek; berikut yang umum untuk use case ini.'}
      items={entity.category.deliverables}
      showPipeline={block.showPipeline !== false}
      pipelineLabel={block.pipelineLabel || 'Alur digital twin'}
    />
  )
}
