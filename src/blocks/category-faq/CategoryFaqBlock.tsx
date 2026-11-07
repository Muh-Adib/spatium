import { FaqSection, sectionId } from '@/components/entity/sections'
import type { CategoryFaqBlockData } from './definition'

/** Use-case FAQ (the questions live in the block; the page adds FAQPage JSON-LD from them). */
export function CategoryFaqBlock({ block }: { block: CategoryFaqBlockData }) {
  return (
    <FaqSection
      headingId={sectionId(block.id, 'faq-heading')}
      eyebrow={block.eyebrow || 'Perlu diketahui'}
      heading={block.heading || 'Pertanyaan umum'}
      items={(block.items ?? []).map((i) => ({ q: i.question, a: i.answer }))}
    />
  )
}
