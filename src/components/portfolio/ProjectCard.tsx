import Link from 'next/link'
import { StudioArt } from '@/components/art/StudioArt'
import { Icon } from '@/components/Icon'
import type { Project, ProjectCategory } from '@/data/projects'
import './project-card.css'

export const CATEGORY_LABEL: Record<ProjectCategory, string> = {
  '2d': '2D Animation',
  '3d': '3D Animation',
  motion: 'Motion Graphics',
  assets: 'Digital Assets',
}

const UNKNOWN_CATEGORY_LABEL = 'Animation Studio'

type ProjectCardProps = {
  project: Project
  featured?: boolean
}

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const categoryLabel = CATEGORY_LABEL[project.category as ProjectCategory] || UNKNOWN_CATEGORY_LABEL

  return (
    <article className={`project-card card card--hover${featured ? ' project-card--featured' : ''}`}>
      <Link href={`/portfolio/${project.slug}`} className="project-card__link" aria-label={`${project.title} — view case study`}>
        <div className="project-card__media">
          {project.posterUrl ? (
            <img
              src={project.posterUrl}
              alt={project.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <StudioArt variant={project.variant ?? 0} />
          )}
          <span className="project-card__overlay" aria-hidden="true">
            <span className="project-card__cta">
              Lihat Case Study
              <Icon name="arrow-up-right" size={16} />
            </span>
          </span>
          <span className="project-card__play" aria-hidden="true">
            <Icon name="play" size={14} filled />
          </span>
        </div>

        <div className="project-card__body">
          <div className="project-card__meta">
            <span className="pill pill--accent">{categoryLabel}</span>
            {project.client ? (
              <span className="text-xs text-[var(--text-muted)] font-medium truncate max-w-[140px]">
                {project.client}
              </span>
            ) : null}
            <span className="project-card__year mono ml-auto">{project.year || 2024}</span>
          </div>
          <h3 className="project-card__title">{project.title}</h3>
          <p className="project-card__tagline">{project.tagline || project.brief || ''}</p>
          <p className="project-card__discipline mono">{project.discipline || 'Animation Studio'}</p>
        </div>
      </Link>
    </article>
  )
}

export default ProjectCard
