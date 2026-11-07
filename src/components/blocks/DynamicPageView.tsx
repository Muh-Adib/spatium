import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { PageHero } from '@/components/ui/PageHero'
import { startsWithHero } from '@/lib/pages/render'
import type { PublicContact } from '@/lib/contact/public-contact'

/**
 * Renders a Studio page (`/<slug>`) the same way in public and in the admin
 * preview: the blocks in order, preceded by a plain page heading when the
 * first block is not a hero (every page keeps exactly one `<h1>`). `contact`
 * (Studio settings) feeds contact CTAs inside blocks.
 */
export function DynamicPageView({
  title,
  slug,
  blocks,
  contact,
}: {
  title: string
  slug: string
  blocks: unknown[]
  contact?: PublicContact
}) {
  const ownHero = startsWithHero(blocks)
  return (
    <article data-page-slug={slug}>
      {ownHero ? null : <PageHero title={title} crumbs={[{ label: 'Home', to: '/' }, { label: title }]} />}
      <BlockRenderer blocks={blocks} contextData={{ contact }} />
    </article>
  )
}
