import { Link, Navigate, useParams } from 'react-router-dom'
import { Seo, SITE_URL } from '@/components/Seo'
import { PageHero } from '@/components/ui/PageHero'
import { StudioArt } from '@/components/art/StudioArt'
import { ProjectCard, CATEGORY_LABEL } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { getProject, PROJECTS } from '@/data/projects'
import './project-detail.css'

export default function ProjectDetail() {
  const { slug = '' } = useParams()
  const project = getProject(slug)

  if (!project) return <Navigate to="/portfolio" replace />

  const related = PROJECTS.filter((p) => p.category === project.category && p.slug !== project.slug).slice(0, 3)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.tagline,
      url: `${SITE_URL}/portfolio/${project.slug}`,
      genre: project.discipline,
      creator: { '@type': 'Organization', name: 'UNIMASI', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Portfolio', item: `${SITE_URL}/portfolio` },
        {
          '@type': 'ListItem',
          position: 3,
          name: project.title,
          item: `${SITE_URL}/portfolio/${project.slug}`,
        },
      ],
    },
  ]

  return (
    <>
      <Seo
        title={project.title}
        description={`${project.tagline} — a ${CATEGORY_LABEL[project.category].toLowerCase()} capability study from the UNIMASI studio.`}
        path={`/portfolio/${project.slug}`}
        type="article"
        jsonLd={jsonLd}
      />

      <PageHero
        eyebrow={CATEGORY_LABEL[project.category]}
        title={project.title}
        lede={project.tagline}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Portfolio', to: '/portfolio' },
          { label: project.title },
        ]}
        meta={
          <>
            <span className="pill pill--accent">{project.discipline}</span>
            <span className="pill">{project.year}</span>
            <span className="pill">
              <Icon name="eye" size={13} /> Capability study
            </span>
          </>
        }
      />

      <section className="section project-media" aria-label="Project media">
        <div className="container container--wide">
          <Reveal className="project-media__frame" variant="scale">
            <div className="project-media__head">
              <span className="mono">Case study preview</span>
              <span className="mono">{project.year}</span>
            </div>

            {project.videoUrl ? (
              <video
                className="project-media__video"
                controls
                playsInline
                preload="metadata"
                poster={project.posterUrl}
              >
                <source src={project.videoUrl} />
                Your browser does not support embedded video.
              </video>
            ) : (
              <div className="project-media__placeholder">
                <StudioArt variant={project.variant} />
                <div className="project-media__placeholder-note">
                  <Icon name="film" size={16} />
                  <span>
                    Video slot ready. Add a <code>videoUrl</code> (and optional <code>posterUrl</code>)
                    to this project to play real media here.
                  </span>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section project-body" aria-labelledby="project-brief">
        <div className="container container--wide project-body__inner">
          <div className="project-body__main">
            <Reveal>
              <p className="eyebrow">The brief</p>
              <h2 className="display-md project-body__title" id="project-brief">
                What the project had to solve
              </h2>
              <p className="project-body__text">{project.brief}</p>
            </Reveal>

            <Reveal delay={80}>
              <p className="eyebrow">Approach</p>
              <h2 className="display-md project-body__title">How we built it</h2>
              <ol className="project-body__approach">
                {project.approach.map((step, i) => (
                  <li key={step}>
                    <span className="project-body__step mono">{String(i + 1).padStart(2, '0')}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={140}>
              <p className="eyebrow">Delivered</p>
              <h2 className="display-md project-body__title">What was produced</h2>
              <ul className="project-body__delivered">
                {project.delivered.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={180}>
              <p className="project-body__disclaimer">
                <Icon name="eye" size={15} />
                <span>
                  This entry is an illustrative capability study created in-house. It describes the
                  type of work and process the studio applies — no client, award or performance result
                  is claimed. Replace it with verified project detail before launch.
                </span>
              </p>
            </Reveal>
          </div>

          <aside className="project-body__aside" aria-label="Project facts">
            <Reveal className="project-facts card" delay={100}>
              <h2 className="project-facts__title">Project facts</h2>
              <dl>
                <div>
                  <dt>Discipline</dt>
                  <dd>{project.discipline}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{CATEGORY_LABEL[project.category]}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Capability study</dd>
                </div>
                <div>
                  <dt>Deliverables</dt>
                  <dd>{project.delivered.length} items</dd>
                </div>
              </dl>

              <Link to="/contact" className="btn btn--primary btn--block">
                Start a project like this
                <span className="btn__icon">
                  <Icon name="arrow-right" size={16} />
                </span>
              </Link>

              <Link to={`/portfolio?category=${project.category}`} className="project-facts__back link-arrow">
                <Icon name="arrow-left" size={15} />
                Back to portfolio
              </Link>
            </Reveal>
          </aside>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section section--deep project-related" aria-labelledby="project-related-title">
          <div className="container container--wide">
            <SectionHead
              id="project-related-title"
              eyebrow="More like this"
              title={`${CATEGORY_LABEL[project.category]} studies`}
            />
            <div className="project-related__grid">
              {related.map((item) => (
                <ProjectCard key={item.slug} project={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CTASection
        id="project-cta"
        eyebrow="Brief us"
        title={
          <>
            Have a project that needs <span className="accent">this treatment</span>?
          </>
        }
        body="Tell us what it has to explain and who needs to understand it. We will come back with a pipeline and a scope."
      />
    </>
  )
}
