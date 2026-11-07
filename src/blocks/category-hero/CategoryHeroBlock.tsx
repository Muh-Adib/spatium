import { PageHero } from '@/components/ui/PageHero'
import type { EntityOf } from '../entity-context'
import type { CategoryHeroBlockData } from './definition'

/** Use-case hero: H1, tagline pill, first tools, breadcrumb. */
export function CategoryHeroBlock({ block, entity }: { block: CategoryHeroBlockData; entity: EntityOf<'service-category'> }) {
  const view = entity.category
  const tools = block.showTools === false ? [] : view.tools.slice(0, block.toolLimit ?? 3)
  return (
    <PageHero
      eyebrow={block.eyebrow || `Use case ${view.index}`}
      title={view.name}
      lede={view.summary}
      crumbs={[
        { label: 'Home', to: '/' },
        { label: 'Layanan', to: '/services' },
        { label: view.shortName },
      ]}
      meta={
        <>
          {view.tagline ? <span className="pill pill--accent">{view.tagline}</span> : null}
          {tools.map((tool) => (
            <span className="pill" key={tool}>
              {tool}
            </span>
          ))}
        </>
      }
    />
  )
}
