'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import { PROJECTS, PROJECT_CATEGORIES, type ProjectCategory, type Project } from '@/data/projects'
import '@/pages/portfolio.css'

type Filter = 'all' | ProjectCategory

const VALID: Filter[] = ['all', '2d', '3d', 'motion', 'assets']

export function PortfolioClient({ initialProjects }: { initialProjects?: Project[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const raw = searchParams ? (searchParams.get('category') as Filter | null) : null
  const initial: Filter = raw && VALID.includes(raw) ? raw : 'all'
  const [filter, setFilter] = useState<Filter>(initial)

  const allProjects = initialProjects && initialProjects.length > 0 ? initialProjects : PROJECTS

  useEffect(() => {
    const next = searchParams ? (searchParams.get('category') as Filter | null) : null
    setFilter(next && VALID.includes(next) ? next : 'all')
  }, [searchParams])

  const setCategory = (value: Filter) => {
    setFilter(value)
    const nextParams = new URLSearchParams(searchParams ? searchParams.toString() : '')
    if (value === 'all') {
      nextParams.delete('category')
    } else {
      nextParams.set('category', value)
    }
    const query = nextParams.toString()
    router.replace(query ? `/portfolio?${query}` : '/portfolio', { scroll: false })
  }

  const visible = useMemo(
    () => (filter === 'all' ? allProjects : allProjects.filter((p) => p.category === filter)),
    [filter, allProjects],
  )

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title={
          <>
            Selected <span className="accent">work</span>.
          </>
        }
        lede="Capability studies across 2D, 3D, motion graphics and digital assets. Each one opens a full case study covering the brief, the approach and what was delivered."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Portfolio' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="film" size={13} /> {PROJECTS.length} case studies
            </span>
            <span className="pill">
              <Icon name="grid" size={13} /> 4 disciplines
            </span>
          </>
        }
      />

      <section className="section portfolio-index" aria-labelledby="portfolio-index-title">
        <div className="container container--wide">
          <h2 className="sr-only" id="portfolio-index-title">
            Filter work
          </h2>

          <div className="portfolio-index__controls">
            <div className="portfolio-index__filters" role="tablist" aria-label="Filter work by discipline">
              {PROJECT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === cat.id}
                  className={`filter-btn${filter === cat.id ? ' is-active' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.label}
                  <span className="filter-btn__count">
                    {cat.id === 'all'
                      ? PROJECTS.length
                      : PROJECTS.filter((p) => p.category === cat.id).length}
                  </span>
                </button>
              ))}
            </div>
            <p className="portfolio-index__count mono" aria-live="polite">
              Showing {visible.length} of {PROJECTS.length}
            </p>
          </div>

          {visible.length > 0 ? (
            <div className="portfolio-index__grid" key={filter}>
              {visible.map((project, i) => {
                const showFeatured = filter === 'all' && i === 0
                return (
                  <Reveal
                    key={project.slug}
                    delay={i * 55}
                    variant="scale"
                    className={`portfolio-index__item${showFeatured ? ' portfolio-index__item--wide' : ''}`}
                  >
                    <ProjectCard project={project} featured={showFeatured} />
                  </Reveal>
                )
              })}
            </div>
          ) : (
            <p className="portfolio-index__empty">No projects in this category yet.</p>
          )}

          <p className="portfolio-index__note">
            <Icon name="eye" size={15} />
            <span>
              <strong>About this portfolio.</strong> These entries are illustrative capability studies
              created in-house to demonstrate the studio&rsquo;s disciplines and process. No client
              names, awards or performance results are claimed. Swap each entry for genuine project
              media — including video — before launch.
            </span>
          </p>
        </div>
      </section>

      <CTASection
        id="portfolio-cta"
        eyebrow="Your project next"
        title={
          <>
            Seen something close to <span className="accent">what you need</span>?
          </>
        }
        body="Send us the brief and the reference. We will tell you which of these pipelines applies and what it would take."
        secondary={{ label: 'Explore services', to: '/services' }}
      />
    </>
  )
}
