import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { StudioArt } from '@/components/art/StudioArt'
import { ProjectCard, CATEGORY_LABEL } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { getProject, PROJECTS, type ProjectCategory } from '@/data/projects'
import { getPortfolioBySlug, getPortfolios } from '@/lib/db/portfolio'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import '@/pages/project-detail.css'

const SITE_URL = 'https://unimasi.studio'

export function generateStaticParams() {
  return PROJECTS.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const dbProject = await getPortfolioBySlug(slug)
  const project = getProject(slug)

  if (!dbProject && !project) return { title: 'Project Not Found' }

  const titleText = dbProject?.title || project?.title || 'Studi Kasus'
  const rawTitle = `${titleText} · UNIMASI`
  const serpTitle = rawTitle.length > 62 ? `${titleText.slice(0, 42).trimEnd()}… · UNIMASI` : rawTitle
  const catLabel = dbProject?.category || (project ? (CATEGORY_LABEL[project.category as ProjectCategory] || 'Animation').toLowerCase() : 'Animation')
  const baseDesc =
    dbProject?.seo?.metaDescription ||
    dbProject?.summary ||
    (project ? `${project.tagline} Sebuah studi kapabilitas ${catLabel} dari UNIMASI Animation Studio.` : '')
  const tagline =
    baseDesc.length > 160
      ? `${baseDesc.slice(0, 157).trimEnd()}…`
      : baseDesc.length < 120 && project
        ? `${baseDesc} Pelajari brief, pendekatan artistik, dan hasil akhir produksi animasi ini.`
        : baseDesc
  const ogImg = dbProject?.heroMedia?.url || project?.posterUrl || '/icon-512.png'

  return {
    title: serpTitle,
    description: tagline,
    alternates: {
      canonical: `${SITE_URL}/portfolio/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: serpTitle,
      description: tagline,
      url: `${SITE_URL}/portfolio/${slug}`,
      siteName: 'UNIMASI',
      images: [{ url: ogImg, width: 1200, height: 630, alt: titleText }],
    },
    twitter: {
      card: 'summary_large_image',
      title: serpTitle,
      description: tagline,
      images: [ogImg],
    },
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const dbProject = await getPortfolioBySlug(slug)
  const dbBlocks = dbProject?.blocks && Array.isArray(dbProject.blocks) ? dbProject.blocks : []

  const project = getProject(slug)
  if (!dbProject && !project) notFound()

  const projectTitle = dbProject?.title || project?.title || ''
  const projectDesc = dbProject?.seo?.metaDescription || dbProject?.summary || project?.tagline || ''
  const projectDiscipline = (dbProject as any)?.discipline || project?.discipline || 'Animation'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: projectTitle,
      description: projectDesc,
      url: `${SITE_URL}/portfolio/${slug}`,
      genre: projectDiscipline,
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
          name: projectTitle,
          item: `${SITE_URL}/portfolio/${slug}`,
        },
      ],
    },
  ]

  if (dbBlocks.length > 0) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BlockRenderer blocks={dbBlocks} />
      </main>
    )
  }

  if (!project) notFound()

  const related = PROJECTS.filter((p) => p.category === project.category && p.slug !== project.slug).slice(0, 3)

  const catLabel = CATEGORY_LABEL[project.category as ProjectCategory] || 'Animation Studio'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow={catLabel}
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
            {project.client ? (
              <span className="pill">
                <Icon name="award" size={13} /> {project.client}
              </span>
            ) : null}
          </>
        }
      />

      <section className="section project-media" aria-label="Project media">
        <div className="container container--wide">
          <Reveal className="project-media__frame" variant="scale">
            <div className="project-media__head">
              <span className="mono">Production Showcase</span>
              <span className="mono">{project.discipline} · {project.year}</span>
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
            ) : project.posterUrl ? (
              <div className="relative aspect-video w-full overflow-hidden bg-black/60 rounded-xl">
                <img
                  src={project.posterUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="project-media__placeholder">
                <StudioArt variant={project.variant} />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section project-body" aria-labelledby="project-brief">
        <div className="container container--wide project-body__inner">
          <div className="project-body__main">
            <Reveal>
              <p className="eyebrow">Tantangan Klien (The Brief)</p>
              <h2 className="display-md project-body__title" id="project-brief">
                Tantangan Komunikasi &amp; Visual yang Dipecahkan
              </h2>
              <p className="project-body__text">{project.brief}</p>
            </Reveal>

            <Reveal delay={80}>
              <p className="eyebrow">Pendekatan Produksi (Approach)</p>
              <h2 className="display-md project-body__title">Metodologi &amp; Eksekusi Visual</h2>
              <ol className="project-body__approach">
                {project.approach.map((step: string, i: number) => (
                  <li key={step}>
                    <span className="project-body__step mono">{String(i + 1).padStart(2, '0')}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={140}>
              <p className="eyebrow">Hasil Serah Terima (Delivered)</p>
              <h2 className="display-md project-body__title">Aset Produksi yang Dihasilkan</h2>
              <ul className="project-body__delivered">
                {project.delivered.map((item: string) => (
                  <li key={item}>
                    <Icon name="check" size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <aside className="project-body__sidebar">
            <Reveal className="project-body__card" delay={60}>
              <p className="eyebrow">Spesifikasi Proyek</p>
              <dl className="project-meta-list">
                <div>
                  <dt>Klien</dt>
                  <dd>{project.client || 'Klien Korporat'}</dd>
                </div>
                <div>
                  <dt>Tahun Rilis</dt>
                  <dd className="mono">{project.year || 2024}</dd>
                </div>
                <div>
                  <dt>Kategori</dt>
                  <dd>{catLabel}</dd>
                </div>
                <div>
                  <dt>Spesialisasi</dt>
                  <dd>{project.discipline}</dd>
                </div>
                <div>
                  <dt>Studio</dt>
                  <dd>UNIMASI Yogyakarta</dd>
                </div>
              </dl>
              <Link href="/contact" className="btn btn--primary btn--full mt-6">
                Mulai Proyek Serupa
              </Link>
            </Reveal>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section project-related" aria-labelledby="related-heading">
          <div className="container container--wide">
            <SectionHead
              id="related-heading"
              eyebrow="Karya Terkait"
              title="Eksplorasi Studi Kasus Lainnya"
              aside={
                <Link href="/portfolio" className="link-arrow">
                  Lihat Seluruh Portfolio
                  <Icon name="arrow-right" size={17} />
                </Link>
              }
            />

            <div className="portfolio-preview__grid mt-8">
              {related.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        id="project-cta"
        eyebrow="Konsultasi Kreatif"
        title={
          <>
            Punya ide atau subjek teknis yang ingin <span className="accent">dianimasikan</span>?
          </>
        }
        body="Diskusikan naskah, konsep, atau kebutuhan aset Anda bersama tim spesialis kami. Kami siapkan alur produksi terstruktur dan penawaran transparan."
        primary={{ label: 'Mulai Diskusi Proyek', to: '/contact' }}
        secondary={{ label: 'Lihat Semua Layanan', to: '/services' }}
      />
    </>
  )
}
