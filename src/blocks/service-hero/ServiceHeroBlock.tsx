import { PageHero } from '@/components/ui/PageHero'
import type { EntityOf } from '../entity-context'
import type { ServiceHeroBlockData } from './definition'

/** Child-service hero: H1, summary, breadcrumb through the parent use case. */
export function ServiceHeroBlock({ block, entity }: { block: ServiceHeroBlockData; entity: EntityOf<'service'> }) {
  const view = entity.service
  const tools = block.showTools === false ? [] : view.tools.slice(0, block.toolLimit ?? 3)
  return (
    <PageHero
      eyebrow={block.eyebrow || view.parent.name}
      title={view.name}
      lede={view.summary}
      crumbs={[
        { label: 'Home', to: '/' },
        { label: 'Layanan', to: '/services' },
        { label: view.parent.shortName, to: `/services/${view.parent.slug}` },
        { label: view.name },
      ]}
      meta={
        tools.length > 0 ? (
          <>
            {tools.map((tool) => (
              <span className="pill" key={tool}>
                {tool}
              </span>
            ))}
          </>
        ) : undefined
      }
    />
  )
}
