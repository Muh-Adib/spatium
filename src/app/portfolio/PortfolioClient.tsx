'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import { PROJECT_CATEGORIES, isProjectCategory, type ProjectCategory, type Project } from '@/lib/content/spatium-types'
import { Sparkles, Box } from 'lucide-react'
import './portfolio.css'
import '@/components/home/portfolio-preview.css'

type Filter = 'all' | ProjectCategory

const toFilter = (raw: string | null): Filter => (raw && isProjectCategory(raw) ? raw : 'all')

export function PortfolioClient({ initialProjects }: { initialProjects: Project[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>(toFilter(searchParams ? searchParams.get('category') : null))

  const allProjects = initialProjects

  useEffect(() => {
    setFilter(toFilter(searchParams ? searchParams.get('category') : null))
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
        eyebrow="SPATIUM PORTFOLIO"
        title={
          <>
            Karya &amp; Capture <span className="accent">Spasial 3D</span>.
          </>
        }
        lede="Kumpulan scene 3D Gaussian Splatting dari ruang nyata. Buka setiap scene untuk menjelajahi ruangnya secara interaktif langsung di browser."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Portofolio' }]}
        meta={
          <>
            <span className="pill">
              <Sparkles className="w-3.5 h-3.5 inline text-cyan-400 mr-1" /> {allProjects.length} Scene
            </span>
            <span className="pill">
              <Box className="w-3.5 h-3.5 inline text-emerald-400 mr-1" /> Viewer interaktif di browser
            </span>
          </>
        }
      />

      <section className="section portfolio-index" aria-labelledby="portfolio-index-title">
        <div className="container container--wide">
          <h2 className="sr-only" id="portfolio-index-title">
            Filter portofolio
          </h2>

          <div className="portfolio-index__controls">
            <div className="portfolio-index__filters" aria-label="Filter proyek berdasarkan sektor industri">
              {PROJECT_CATEGORIES.filter((cat) => cat.id === 'all' || allProjects.some((project) => project.category === cat.id)).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={filter === cat.id}
                  className={`filter-btn${filter === cat.id ? ' is-active' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.label}
                  <span className="filter-btn__count">
                    {cat.id === 'all'
                      ? allProjects.length
                      : allProjects.filter((p) => p.category === cat.id).length}
                  </span>
                </button>
              ))}
            </div>
            <p className="portfolio-index__count mono" aria-live="polite">
              Menampilkan {visible.length} dari {allProjects.length} scene
            </p>
          </div>

          <div className="portfolio-index__grid" role="region" aria-label="Daftar studi kasus">
            {visible.map((project, i) => (
              <Reveal key={project.slug} delay={i * 60}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>

          {visible.length === 0 && (
            <div className="portfolio-index__empty">
              <p className="lead">
                {allProjects.length === 0 ? 'Belum ada scene yang dipublikasikan.' : 'Belum ada scene untuk kategori ini.'}
              </p>
              <button
                type="button"
                className="btn btn--ghost mt-4"
                onClick={() => setCategory('all')}
              >
                Lihat Semua Kategori
              </button>
            </div>
          )}
        </div>
      </section>

      <CTASection
        id="portfolio-cta"
        eyebrow="One Point, Unlimited Possibilities"
        title={
          <>
            Ingin menghadirkan pengalaman spasial <span className="accent">3DGS</span> untuk bisnis Anda?
          </>
        }
        body="Ceritakan ruang dan tujuan Anda. Kami bantu merencanakan capture di lokasi dan keluaran yang paling sesuai."
        primary={{ label: 'Mulai Diskusi Proyek', to: '/contact' }}
        secondary={{ label: 'Pelajari 4 Vertikal Layanan', to: '/services' }}
      />
    </>
  )
}
