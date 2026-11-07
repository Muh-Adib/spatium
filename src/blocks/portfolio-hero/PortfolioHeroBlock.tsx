import { MapPin } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { PageHero } from '@/components/ui/PageHero'
import type { EntityOf } from '../entity-context'
import type { PortfolioHeroBlockData } from './definition'

/** Scene hero: H1, tagline, breadcrumb, sector/year/client/location pills (only recorded facts). */
export function PortfolioHeroBlock({ block, entity }: { block: PortfolioHeroBlockData; entity: EntityOf<'portfolio'> }) {
  const view = entity.project
  return (
    <PageHero
      eyebrow={block.eyebrow || 'SPATIUM Spatial Showcase'}
      title={view.title}
      lede={view.tagline}
      crumbs={[
        { label: 'Home', to: '/' },
        { label: 'Portfolio', to: '/portfolio' },
        { label: view.title },
      ]}
      meta={
        block.showMeta === false ? undefined : (
          <>
            <span className="pill pill--accent">{view.discipline}</span>
            {view.year ? <span className="pill">{view.year}</span> : null}
            {view.client ? (
              <span className="pill">
                <Icon name="award" size={13} /> {view.client}
              </span>
            ) : null}
            {view.location ? (
              <span className="pill">
                <MapPin className="w-3 h-3 inline text-cyan-400 mr-1" aria-hidden="true" />
                {view.location}
              </span>
            ) : null}
          </>
        )
      }
    />
  )
}
