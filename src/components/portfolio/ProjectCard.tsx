import Link from 'next/link'
import { StudioArt } from '@/components/art/StudioArt'
import { Icon } from '@/components/Icon'
import type { Project, ProjectCategory } from '@/data/projects'
import { Sparkles, Compass } from 'lucide-react'
import './project-card.css'

export const CATEGORY_LABEL: Record<ProjectCategory, string> = {
  marketing: 'Marketing & Retail',
  hospitality: 'Hospitality & Wisata',
  healthcare: 'Healthcare & Medis',
  industrial: 'Industrial & Manufaktur',
  agriculture: 'Agrikultur & Riset',
  property: 'Properti & Arsitektur',
  memory: 'Memori & Dokumenter',
  filmmaking: 'Filmmaking & VFX',
  entertainment: 'Entertainment & Installation',
  '2d': '2D Animation',
  '3d': '3D Animation',
  motion: 'Motion Graphics',
  assets: 'Digital Assets',
}

const UNKNOWN_CATEGORY_LABEL = '3D Gaussian Splatting'

type ProjectCardProps = {
  project: Project
  featured?: boolean
}

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const categoryLabel = CATEGORY_LABEL[project.category as ProjectCategory] || UNKNOWN_CATEGORY_LABEL

  return (
    <article className={`project-card card card--hover${featured ? ' project-card--featured' : ''}`}>
      <Link href={`/portfolio/${project.slug}`} className="project-card__link" aria-label={`${project.title} — view case study`}>
        <div className="project-card__media relative">
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

          {/* 3DGS Indicator Badge */}
          {project.pointCount && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#040711]/85 backdrop-blur-md border border-cyan-400/30 text-cyan-300 text-[10px] font-mono tracking-wider uppercase font-semibold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{project.pointCount}</span>
            </div>
          )}

          <span className="project-card__overlay" aria-hidden="true">
            <span className="project-card__cta">
              Lihat Studi Kasus
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
          <p className="project-card__discipline mono">{project.discipline || 'SPATIUM Reality Capture'}</p>
        </div>
      </Link>
    </article>
  )
}

export default ProjectCard
