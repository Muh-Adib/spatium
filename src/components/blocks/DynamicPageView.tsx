import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { PageHero } from '@/components/ui/PageHero'
import { startsWithHero } from '@/lib/pages/render'

/**
 * Renders a Studio page (`/<slug>`) the same way in public and in the admin
 * preview: the blocks in order, preceded by a plain page heading when the
 * first block is not a hero (every page keeps exactly one `<h1>`).
 */
export function DynamicPageView({ title, slug, blocks }: { title: string; slug: string; blocks: unknown[] }) {
  const ownHero = startsWithHero(blocks)
  return (
    <article data-page-slug={slug}>
      {ownHero ? null : <PageHero title={title} crumbs={[{ label: 'Home', to: '/' }, { label: title }]} />}
      <BlockRenderer blocks={blocks} />
    </article>
  )
}
