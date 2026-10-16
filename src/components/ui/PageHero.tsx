import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import './page-hero.css'

export type Crumb = { label: string; to?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`}>
              {item.to && !last ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              )}
              {!last ? <Icon name="arrow-right" size={12} /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

type PageHeroProps = {
  eyebrow?: string
  title: ReactNode
  lede?: string
  crumbs?: Crumb[]
  meta?: ReactNode
  children?: ReactNode
}

export function PageHero({ eyebrow, title, lede, crumbs, meta, children }: PageHeroProps) {
  return (
    <section className="page-hero grain">
      <div className="bg-grid page-hero__grid" aria-hidden="true" />
      <div className="bg-glow bg-glow--blue page-hero__glow" aria-hidden="true" />
      <div className="container container--wide page-hero__inner">
        {crumbs ? (
          <Reveal>
            <Breadcrumbs items={crumbs} />
          </Reveal>
        ) : null}

        <Reveal>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="page-hero__title display-lg">{title}</h1>
        </Reveal>

        {lede ? (
          <Reveal delay={80}>
            <p className="lede page-hero__lede">{lede}</p>
          </Reveal>
        ) : null}

        {meta ? (
          <Reveal delay={140} className="page-hero__meta">
            {meta}
          </Reveal>
        ) : null}

        {children ? <div className="page-hero__extra">{children}</div> : null}
      </div>
    </section>
  )
}

export default PageHero
