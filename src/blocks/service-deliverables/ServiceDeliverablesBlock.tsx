import { DeliverablesSection, sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { ServiceDeliverablesBlockData } from './definition'

/** Recorded deliverables of the service (hidden when none) and the pipeline timeline. */
export function ServiceDeliverablesBlock({ block, entity }: { block: ServiceDeliverablesBlockData; entity: EntityOf<'service'> }) {
  return (
    <DeliverablesSection
      headingId={sectionId(block.id, 'service-deliverables-heading')}
      eyebrow={block.eyebrow || 'Keluaran'}
      heading={
        block.heading || (
          <>
            Apa yang <span className="accent">Anda terima</span>.
          </>
        )
      }
      lede={block.lede || 'Keluaran disesuaikan dengan tujuan proyek; berikut yang umum untuk layanan ini.'}
      items={entity.service.deliverables}
      showPipeline={block.showPipeline !== false}
      pipelineLabel={block.pipelineLabel || 'Alur digital twin'}
    />
  )
}
