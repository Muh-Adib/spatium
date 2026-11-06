import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { SplatPlaceholder } from '@/components/spatium/SplatPlaceholder'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { getProjectBySlug, getProjects } from '@/lib/content/spatium'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { GaussianSplatViewer } from '@/components/spatial/GaussianSplatViewer'
import { siteConfig } from '@/config/site'
import { MapPin, ArrowRight } from 'lucide-react'
import '@/pages/project-detail.css'
import '@/components/home/portfolio-preview.css'
import { redirectIfMoved } from '@/lib/redirects/resolve'

const SITE_URL = siteConfig.url

export const revalidate = 300

export async function generateStaticParams() {
  // getProjects() logs and returns [] when the DB is unreachable at build time.
  const projects = await getProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Scene tidak ditemukan' }

  const rawTitle = `${project.title} · SPATIUM`
  const serpTitle = rawTitle.length > 62 ? `${project.title.slice(0, 42).trimEnd()}… · SPATIUM` : rawTitle
  const baseDesc = project.brief || project.tagline
  const description = baseDesc.length > 160 ? `${baseDesc.slice(0, 157).trimEnd()}…` : baseDesc
  const ogImg = project.posterUrl || '/icon-512.png'

  return {
    title: serpTitle,
    description,
    alternates: {
      canonical: `${SITE_URL}/portfolio/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: serpTitle,
      description,
      url: `${SITE_URL}/portfolio/${slug}`,
      siteName: 'SPATIUM',
      images: [{ url: ogImg, width: 1200, height: 630, alt: project.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: serpTitle,
      description,
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
  const projects = await getProjects()
  const view = projects.find((p) => p.slug === slug)
  if (!view) {
    await redirectIfMoved(`/portfolio/${slug}`)
    notFound()
  }

  // No fictional fallbacks: unknown specs stay hidden (AGENTS.md §3.3).
  const { pointCount, accuracy, location, splatId } = view

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: view.title,
      description: view.brief || view.tagline,
      url: `${SITE_URL}/portfolio/${slug}`,
      genre: view.discipline,
      creator: {
        '@type': 'Organization',
        name: 'SPATIUM Spatial Technology Studio',
        url: SITE_URL,
      },
    },
  ]

  if (view.blocks.length > 0) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BlockRenderer blocks={view.blocks} />
      </main>
    )
  }

  const related = projects.filter((p) => p.slug !== view.slug).slice(0, 3)

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
            {view.year ? <span className="pill">{view.year}</span> : null}
            {view.client ? (
              <span className="pill">
                <Icon name="award" size={13} /> {view.client}
              </span>
            ) : null}
            {location ? (
              <span className="pill">
                <MapPin className="w-3 h-3 inline text-cyan-400 mr-1" />
                {location}
              </span>
            ) : null}
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
                <span>3D Gaussian Splat Viewer</span>
              </span>
              {pointCount || accuracy ? (
                <span className="mono text-cyan-400">{[pointCount, accuracy].filter(Boolean).join(' · ')}</span>
              ) : null}
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
                <div className="relative w-full h-full aspect-video"><SplatPlaceholder seed={view.variant} label={view.title} /></div>
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
              <p className="eyebrow text-cyan-400">Tentang scene</p>
              <h2 className="display-md project-body__title text-white" id="project-brief">
                Konteks ruang
              </h2>
              <p className="project-body__text text-neutral-300 leading-relaxed">{view.brief}</p>
            </Reveal>

            {view.approach.length > 0 ? (
            <Reveal delay={80}>
              <p className="eyebrow text-cyan-400">Alur kerja</p>
              <h2 className="display-md project-body__title text-white">Alur Rekonstruksi Spasial 3DGS</h2>
              <ol className="project-body__approach">
                {view.approach.map((step, i) => (
                  <li key={step}>
                    <span className="project-body__step mono">{String(i + 1).padStart(2, '0')}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
            ) : null}

            {view.delivered.length > 0 ? (
            <Reveal delay={140}>
              <p className="eyebrow text-cyan-400">Keluaran</p>
              <h2 className="display-md project-body__title text-white">Aset Digital yang Dihasilkan</h2>
              <ul className="project-body__delivered">
                {view.delivered.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            ) : null}
          </div>

          <aside className="project-body__sidebar">
            <Reveal className="project-body__card" delay={60}>
              <p className="eyebrow text-cyan-400">Detail scene</p>
              <dl className="project-meta-list">
                {view.client ? (
                  <div>
                    <dt>Klien / Venue</dt>
                    <dd>{view.client}</dd>
                  </div>
                ) : null}
                {view.year ? (
                  <div>
                    <dt>Tahun Perekaman</dt>
                    <dd className="mono">{view.year}</dd>
                  </div>
                ) : null}
                {location ? (
                  <div>
                    <dt>Lokasi</dt>
                    <dd>{location}</dd>
                  </div>
                ) : null}
                {pointCount ? (
                  <div>
                    <dt>Kerapatan Splat</dt>
                    <dd className="mono">{pointCount}</dd>
                  </div>
                ) : null}
                {accuracy ? (
                  <div>
                    <dt>Akurasi Geometri</dt>
                    <dd className="mono">{accuracy}</dd>
                  </div>
                ) : null}
                {view.discipline ? (
                  <div>
                    <dt>Sektor</dt>
                    <dd>{view.discipline}</dd>
                  </div>
                ) : null}
                {view.captureMethod ? (
                  <div>
                    <dt>Teknologi</dt>
                    <dd>{view.captureMethod}</dd>
                  </div>
                ) : null}
              </dl>

              {view.sceneUrl ? (
                <a
                  href={view.sceneUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-arrow mt-4"
                >
                  Buka scene di SuperSplat
                  <Icon name="arrow-up-right" size={15} />
                </a>
              ) : null}

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
                Diskusikan ruang Anda
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
        body="Ceritakan lokasi dan tujuan Anda — marketing, previz film, instalasi, atau preservasi memori — dan kami bantu merencanakan capture di lokasi."
        primary={{ label: 'Jadwalkan Konsultasi Spasial', to: '/contact' }}
        secondary={{ label: 'Lihat Semua Layanan', to: '/services' }}
      />
    </>
  )
}
