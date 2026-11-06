'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import { PROJECTS, PROJECT_CATEGORIES, type ProjectCategory, type Project } from '@/data/projects'
import { Sparkles, Layers, Box, Compass } from 'lucide-react'
import './portfolio.css'

type Filter = 'all' | ProjectCategory

const VALID: Filter[] = [
  'all',
  'marketing',
  'hospitality',
  'healthcare',
  'industrial',
  'agriculture',
  'property',
  'memory',
  'filmmaking',
  '2d',
  '3d',
  'motion',
  'assets',
]

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
        eyebrow="SPATIUM PORTFOLIO"
        title={
          <>
            Karya &amp; Capture <span className="accent">Spasial 3D</span>.
          </>
        }
        lede="Kumpulan studi kasus 3D Gaussian Splatting, LiDAR laser scanning, dan digital twin fotorealistis skala 1:1. Buka setiap studi kasus untuk menjelajahi ruang fisik secara interaktif pada 60 FPS langsung di browser."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Portofolio' }]}
        meta={
          <>
            <span className="pill">
              <Sparkles className="w-3.5 h-3.5 inline text-cyan-400 mr-1" /> {allProjects.length} Proyek Aktif
            </span>
            <span className="pill">
              <Compass className="w-3.5 h-3.5 inline text-cyan-400 mr-1" /> Akurasi Sub-5mm
            </span>
            <span className="pill">
              <Box className="w-3.5 h-3.5 inline text-emerald-400 mr-1" /> 60 FPS WebGL
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
              Menampilkan {visible.length} dari {allProjects.length} proyek
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
              <p className="lead">Belum ada karya untuk kategori ini.</p>
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
        body="Kami siap melakukan survei dan pemindaian laser LiDAR di lokasi Anda. Hubungi spesialis spasial kami untuk konsultasi teknis dan penawaran langsung."
        primary={{ label: 'Mulai Diskusi Proyek', to: '/contact' }}
        secondary={{ label: 'Pelajari 4 Vertikal Layanan', to: '/services' }}
      />
    </>
  )
}
