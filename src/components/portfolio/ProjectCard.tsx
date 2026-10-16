import { Link } from 'react-router-dom'
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

type ProjectCardProps = {
  project: Project
  /** Larger presentation for the featured slot. */
  featured?: boolean
}

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  return (
    <article className={`project-card card card--hover${featured ? ' project-card--featured' : ''}`}>
      <Link to={`/portfolio/${project.slug}`} className="project-card__link" aria-label={`${project.title} — view case study`}>
        <div className="project-card__media">
          <StudioArt variant={project.variant} />
          <span className="project-card__overlay" aria-hidden="true">
            <span className="project-card__cta">
              View case study
              <Icon name="arrow-up-right" size={16} />
            </span>
          </span>
          <span className="project-card__play" aria-hidden="true">
            <Icon name="play" size={14} filled />
          </span>
        </div>

        <div className="project-card__body">
          <div className="project-card__meta">
            <span className="pill pill--accent">{CATEGORY_LABEL[project.category]}</span>
            <span className="project-card__year mono">{project.year}</span>
          </div>
          <h3 className="project-card__title">{project.title}</h3>
          <p className="project-card__tagline">{project.tagline}</p>
          <p className="project-card__discipline mono">{project.discipline}</p>
        </div>
      </Link>
    </article>
  )
}

export default ProjectCard
