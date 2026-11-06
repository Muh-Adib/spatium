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
import { GaussianSplatViewer } from '@/components/spatial/GaussianSplatViewer'
import { siteConfig } from '@/config/site'
import { Sparkles, Compass, ShieldCheck, Cpu, Layers, MapPin, ArrowRight } from 'lucide-react'
import '@/pages/project-detail.css'

const SITE_URL = siteConfig.url

export async function generateStaticParams() {
  const slugs = new Set<string>(PROJECTS.map((project) => project.slug))
  try {
    const portfolios = await getPortfolios()
    for (const portfolio of portfolios) slugs.add(portfolio.slug)
  } catch (err) {
    console.warn('[observable error]:', err)
  }
  return Array.from(slugs).map((slug) => ({ slug }))
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

  const titleText = dbProject?.title || project?.title || 'Studi Kasus Spasial'
  const rawTitle = `${titleText} · SPATIUM`
  const serpTitle = rawTitle.length > 62 ? `${titleText.slice(0, 42).trimEnd()}… · SPATIUM` : rawTitle
  const catLabel = dbProject?.category || project?.discipline || '3D Gaussian Splatting'
  const baseDesc =
    dbProject?.seo?.metaDescription ||
    dbProject?.summary ||
    (project ? `${project.tagline} Tur spasial fotorealistis 3DGS dan digital twin dari SPATIUM Spatial Studio.` : '')
  const tagline =
    baseDesc.length > 160
      ? `${baseDesc.slice(0, 157).trimEnd()}…`
      : baseDesc.length < 120 && project
        ? `${baseDesc} Eksplorasi interaktif skala 1:1 langsung di browser WebGL.`
        : baseDesc
  const ogImg = dbProject?.heroMedia?.url || project?.posterUrl || '/images/spatium-logo.png'

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
      siteName: 'SPATIUM',
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
  const projectDiscipline = (dbProject as { discipline?: string })?.discipline || project?.discipline || '3D Gaussian Splatting'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: projectTitle,
      description: projectDesc,
      url: `${SITE_URL}/portfolio/${slug}`,
      genre: projectDiscipline,
      creator: {
        '@type': 'Organization',
        name: 'SPATIUM Spatial Technology Studio',
        url: SITE_URL,
      },
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

  const liveUrl = (dbProject as any)?.liveUrl || (dbProject as any)?.livePreviewUrl || project?.liveUrl
  const splatId = project?.splatId
  const pointCount = project?.pointCount || '12.4M Splats'
  const accuracy = project?.accuracy || 'Sub-centimeter (< 5mm)'
  const location = project?.location || 'Indonesia'

  const view = {
    slug,
    title: dbProject?.title || project?.title || '',
    tagline: dbProject?.summary || project?.tagline || '',
    discipline: dbProject?.category || project?.discipline || '3D Gaussian Splatting',
    year: dbProject?.year || project?.year || '2024',
    client: dbProject?.client || project?.client || 'Klien Spatium',
    category: (project?.category || (dbProject?.category as ProjectCategory) || 'marketing') as ProjectCategory,
    brief: dbProject?.challenge || project?.brief || '',
    approach:
      (typeof dbProject?.approach === 'string' ? dbProject.approach.split(/\n+/).filter(Boolean) : undefined) ||
      project?.approach ||
      [],
    delivered: (dbProject?.technologies || []).map((t: { name?: string }) => t.name).filter(Boolean).length
      ? ((dbProject!.technologies || []) as Array<{ name?: string }>).map((t) => t.name).filter((name): name is string => Boolean(name))
      : project?.delivered || [],
    liveUrl,
    posterUrl: dbProject?.heroMedia?.url || project?.posterUrl,
    variant: project?.variant ?? 1,
    scenePairSlug: project?.scenePairSlug,
    scenePairLabel: project?.scenePairLabel,
  }

  const related = PROJECTS.filter((p) => p.slug !== view.slug).slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="SPATIUM Spatial Showcase"
        title={view.title}
        lede={view.tagline}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Portfolio', to: '/portfolio' },
          { label: view.title },
        ]}
        meta={
          <>
            <span className="pill pill--accent">{view.discipline}</span>
            <span className="pill">{view.year}</span>
            {view.client ? (
              <span className="pill">
                <Icon name="award" size={13} /> {view.client}
              </span>
            ) : null}
            <span className="pill">
              <MapPin className="w-3 h-3 inline text-cyan-400 mr-1" />
              {location}
            </span>
          </>
        }
      />

      {/* Main Interactive 3D Gaussian Splatting Viewport Section */}
      <section className="section project-media" aria-label="Spatial Media Viewport">
        <div className="container container--wide">
          <Reveal className="project-media__frame" variant="scale">
            <div className="project-media__head flex items-center justify-between">
              <span className="mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>3DGS Neural Radiance Field Viewer</span>
              </span>
              <span className="mono text-cyan-400">{pointCount} · {accuracy}</span>
            </div>

            {view.liveUrl ? (
              <GaussianSplatViewer
                liveUrl={view.liveUrl}
                splatId={splatId}
                title={view.title}
                client={view.client}
                category={view.discipline}
                pointCount={pointCount}
                accuracy={accuracy}
                scenePairSlug={view.scenePairSlug}
                scenePairLabel={view.scenePairLabel}
                heightClass="h-[520px] md:h-[680px]"
              />
            ) : view.posterUrl ? (
              <div className="relative aspect-video w-full overflow-hidden bg-black/60 rounded-xl">
                <img
                  src={view.posterUrl}
                  alt={view.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="project-media__placeholder">
                <StudioArt variant={view.variant} />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Narrative Section: Brief, Approach, Delivered */}
      <section className="section project-body" aria-labelledby="project-brief">
        <div className="container container--wide project-body__inner">
          <div className="project-body__main">
            <Reveal>
              <p className="eyebrow text-cyan-400">Tantangan Klien (The Brief)</p>
              <h2 className="display-md project-body__title text-white" id="project-brief">
                Tantangan Komunikasi &amp; Ruang Fisik
              </h2>
              <p className="project-body__text text-neutral-300 leading-relaxed">{view.brief}</p>
            </Reveal>

            <Reveal delay={80}>
              <p className="eyebrow text-cyan-400">Metodologi Akuisisi (Approach)</p>
              <h2 className="display-md project-body__title text-white">Alur Rekonstruksi Spasial 3DGS</h2>
              <ol className="project-body__approach">
                {view.approach.map((step: string, i: number) => (
                  <li key={step}>
                    <span className="project-body__step mono">{String(i + 1).padStart(2, '0')}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={140}>
              <p className="eyebrow text-cyan-400">Hasil Serah Terima (Deliverables)</p>
              <h2 className="display-md project-body__title text-white">Aset Digital yang Dihasilkan</h2>
              <ul className="project-body__delivered">
                {view.delivered.map((item: string) => (
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
              <p className="eyebrow text-cyan-400">Spesifikasi Spasial</p>
              <dl className="project-meta-list">
                <div>
                  <dt>Klien</dt>
                  <dd>{view.client || 'Mitra SPATIUM'}</dd>
                </div>
                <div>
                  <dt>Tahun Perekaman</dt>
                  <dd className="mono">{view.year || 2024}</dd>
                </div>
                <div>
                  <dt>Lokasi</dt>
                  <dd>{location}</dd>
                </div>
                <div>
                  <dt>Kerapatan Partikel</dt>
                  <dd className="mono text-cyan-300 font-bold">{pointCount}</dd>
                </div>
                <div>
                  <dt>Akurasi Geometri</dt>
                  <dd className="mono text-cyan-400 font-bold">{accuracy}</dd>
                </div>
                <div>
                  <dt>Teknologi</dt>
                  <dd>3D Gaussian Splatting + LiDAR</dd>
                </div>
                <div>
                  <dt>Platform</dt>
                  <dd>WebGL Native 60 FPS + WebXR</dd>
                </div>
              </dl>

              {view.scenePairSlug && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs font-mono text-neutral-400 mb-2">Scene Terkait:</p>
                  <Link
                    href={`/portfolio/${view.scenePairSlug}`}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 text-xs font-mono text-white transition-all"
                  >
                    <span>{view.scenePairLabel || 'Beralih Sudut Ruang'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </Link>
                </div>
              )}

              <Link href="/contact" className="btn btn--primary btn--full mt-6">
                Pesan Pemindaian Serupa
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
              title="Eksplorasi Capture Spasial Lainnya"
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
        eyebrow="Konsultasi Teknologi Spasial"
        title={
          <>
            Ingin merekonstruksi lokasi fisik Anda ke dalam <span className="accent">3D Gaussian Splatting</span>?
          </>
        }
        body="Diskusikan lokasi, tujuan bisnis (marketing ZMOT, simulasi medis, previz film, atau preservasi memori), dan kami siapkan jadwal pemindaian LiDAR presisi tinggi di lokasi Anda."
        primary={{ label: 'Jadwalkan Konsultasi Spasial', to: '/contact' }}
        secondary={{ label: 'Lihat Semua Layanan', to: '/services' }}
      />
    </>
  )
}
