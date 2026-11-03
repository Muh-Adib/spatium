'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PROJECTS, PROJECT_CATEGORIES, mapProjectCategory, type Project, type ProjectCategory } from '@/data/projects'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import './portfolio-preview.css'

export function PortfolioPreview({ initialProjects }: { initialProjects?: any[] } = {}) {
  const [filter, setFilter] = useState<'all' | ProjectCategory>('all')
  const allProjects: Project[] = initialProjects && initialProjects.length > 0
    ? initialProjects.map((project: any, index) => {
        const fallback = PROJECTS.find((item) => item.slug === project.slug) || PROJECTS[index % PROJECTS.length]
        return {
          ...fallback,
          ...project,
          category: PROJECT_CATEGORIES.some((item) => item.id === project.category)
            ? project.category
            : mapProjectCategory(project.category || project.discipline),
          posterUrl: project.posterUrl || project.coverImage || project.heroImage?.url || fallback.posterUrl,
          variant: project.variant ?? fallback.variant,
        }
      })
    : PROJECTS

  const visible = useMemo(() => {
    const list = filter === 'all' ? allProjects : allProjects.filter((p: any) => p.category === filter)
    return list.slice(0, 6)
  }, [filter, allProjects])

  return (
    <section className="section portfolio-preview" id="work" aria-labelledby="work-title">
      <div className="container container--wide">
        <SectionHead
          id="work-title"
          eyebrow="Featured portfolio"
          title={
            <>
              Work that explains <span className="accent">and</span> impresses.
            </>
          }
          aside={
            <>
              <p className="lede">
                A selection of studio capability studies across 2D, 3D and motion. Every entry opens a
                full case study with brief, approach and deliverables.
              </p>
              <Link href="/portfolio" className="link-arrow">
                View the full portfolio
                <Icon name="arrow-right" size={17} />
              </Link>
            </>
          }
        />

        <div className="portfolio-preview__filters" aria-label="Filter work by discipline">
          {PROJECT_CATEGORIES.filter((cat) => cat.id === 'all' || allProjects.some((project) => project.category === cat.id)).map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={filter === cat.id}
              className={`filter-btn${filter === cat.id ? ' is-active' : ''}`}
              onClick={() => setFilter(cat.id)}
            >
              {cat.label}
              <span className="filter-btn__count">
                {cat.id === 'all' ? allProjects.length : allProjects.filter((p) => p.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="portfolio-preview__grid" id="portfolio-preview-results" key={filter}>
          {visible.map((project: any, i: number) => (
            <Reveal key={project.slug} delay={i * 60} variant="scale" className="portfolio-preview__item">
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>

        <p className="portfolio-preview__note">
          <Icon name="eye" size={15} />
          Entries shown are capability studies and productions created by the studio.
        </p>
      </div>
    </section>
  )
}

export default PortfolioPreview
