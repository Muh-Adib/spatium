/**
 * Section markup shared by the data-bound entity blocks (service category,
 * service, portfolio). This is the markup of the former fixed templates, so
 * the default preset renders exactly as before; blocks only choose what to
 * pass in. Synchronous and hook-free: renders on the server (public pages)
 * and in the browser (Studio draft preview).
 */
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { SPATIAL_PIPELINE } from '@/config/spatium-story'
import type { Project, ServiceVisual as VisualKind } from '@/lib/content/spatium-types'
import '@/pages/service-detail.css'
import '@/components/home/portfolio-preview.css'
import '@/pages/project-detail.css'

/** Unique heading id per block instance (falls back to the template's id). */
export function sectionId(blockId: unknown, fallback: string): string {
  return typeof blockId === 'string' && blockId ? `${blockId}-heading` : fallback
}

/** A non-empty override, or undefined. */
export function override(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function IntroSection(props: {
  headingId: string
  heading?: string
  srHeading: string
  paragraphs: readonly string[]
  tools: readonly string[]
  showVisual: boolean
  visual: VisualKind
  visualLabel: string
  visualCaption: string
}) {
  const { headingId, heading, srHeading, paragraphs, tools, showVisual, visual, visualLabel, visualCaption } = props
  return (
    <section className="section detail-intro" aria-labelledby={headingId}>
      <div className="container container--wide detail-intro__inner">
        <Reveal className="detail-intro__copy">
          {heading ? (
            <h2 className="display-md" id={headingId}>
              {heading}
            </h2>
          ) : (
            <h2 className="sr-only" id={headingId}>
              {srHeading}
            </h2>
          )}
          {paragraphs.map((paragraph, i) => (
            <p key={`${i}-${paragraph.slice(0, 24)}`} className="detail-intro__paragraph">
              {paragraph}
            </p>
          ))}

          {tools.length > 0 ? (
            <ul className="detail-intro__tools">
              {tools.map((tool) => (
                <li className="pill" key={tool}>
                  {tool}
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>

        {showVisual ? (
          <Reveal className="detail-intro__visual" variant="scale" delay={100}>
            <div className="detail-intro__frame">
              <div className="detail-intro__frame-head">
                <span className="mono">{visualLabel}</span>
                <span className="mono">{visualCaption}</span>
              </div>
              <ServiceVisual kind={visual} />
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}

export function DeliverablesSection({
  headingId,
  eyebrow,
  heading,
  lede,
  items,
  showPipeline,
  pipelineLabel,
}: {
  headingId: string
  eyebrow: string
  heading: ReactNode
  lede: string
  items: readonly string[]
  showPipeline: boolean
  pipelineLabel: string
}) {
  if (items.length === 0 && !showPipeline) return null
  return (
    <section className="section section--deep detail-deliverables" aria-labelledby={headingId}>
      <div className="container container--wide detail-deliverables__inner">
        {items.length > 0 ? (
          <Reveal className="detail-deliverables__copy">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="display-md" id={headingId}>
              {heading}
            </h2>
            <p className="lede">{lede}</p>

            <ul className="detail-deliverables__list">
              {items.map((item) => (
                <li key={item}>
                  <Icon name="check" size={15} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ) : (
          <h2 className="sr-only" id={headingId}>
            Alur kerja
          </h2>
        )}

        {showPipeline ? (
          <Reveal className="detail-timeline" delay={100}>
            <p className="mono detail-timeline__label">{pipelineLabel}</p>
            <ol className="detail-timeline__list">
              {SPATIAL_PIPELINE.map((step) => (
                <li key={step.index}>
                  <span className="detail-timeline__dot" aria-hidden="true" />
                  <div>
                    <strong>{step.title}</strong>
                    <span className="mono">{step.caption}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}

export function FaqSection({
  headingId,
  eyebrow,
  heading,
  items,
}: {
  headingId: string
  eyebrow: string
  heading: string
  items: readonly { q: string; a: string }[]
}) {
  if (items.length === 0) return null
  return (
    <section className="section detail-faq" aria-labelledby={headingId}>
      <div className="container container--wide detail-faq__inner">
        <Reveal className="detail-faq__head">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display-md" id={headingId}>
            {heading}
          </h2>
        </Reveal>

        <div className="detail-faq__list">
          {items.map((faq, i) => (
            <Reveal key={`${i}-${faq.q}`} delay={i * 60}>
              <details className="faq-item">
                <summary>
                  <span>{faq.q}</span>
                  <Icon name="plus" size={18} />
                </summary>
                <p>{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RelatedProjectsSection({
  headingId,
  eyebrow,
  heading,
  projects,
  variant,
  allLabel,
}: {
  headingId: string
  eyebrow: string
  heading: string
  projects: readonly Project[]
  /** `detail` = use-case grid; `project` = portfolio page grid. */
  variant: 'detail' | 'project'
  allLabel: string
}) {
  if (projects.length === 0) return null
  return (
    <section
      className={variant === 'detail' ? 'section detail-work' : 'section project-related'}
      aria-labelledby={headingId}
    >
      <div className="container container--wide">
        <SectionHead
          id={headingId}
          eyebrow={eyebrow}
          title={heading}
          aside={
            <Link href="/portfolio" className="link-arrow">
              {allLabel}
              <Icon name="arrow-right" size={variant === 'detail' ? 16 : 17} />
            </Link>
          }
        />
        <div className={variant === 'detail' ? 'detail-work__grid' : 'portfolio-preview__grid mt-8'}>
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}

export type NavCard = { key: string; href: string; index: string; title: string; body: string; cta: string }

export function NavCardsSection({
  headingId,
  eyebrow,
  heading,
  aside,
  cards,
}: {
  headingId: string
  eyebrow: string
  heading: string
  aside?: ReactNode
  cards: readonly NavCard[]
}) {
  if (cards.length === 0) return null
  return (
    <section className="section detail-next" aria-labelledby={headingId}>
      <div className="container container--wide">
        <SectionHead id={headingId} eyebrow={eyebrow} title={heading} aside={aside} />
        <ul className="detail-next__grid">
          {cards.map((item) => (
            <Reveal as="li" key={item.key}>
              <Link href={item.href} className="detail-next__card card card--hover">
                <span className="detail-next__index mono">{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="link-arrow">
                  {item.cta}
                  <Icon name="arrow-right" size={15} />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
