'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export type ExplorerScene = {
  slug: string
  title: string
  discipline: string
  category: string
  tagline: string
  embedUrl: string
  sceneUrl: string
  posterUrl?: string
}

type Filter = { id: string; label: string }

export function SceneExplorer({ scenes, filters }: { scenes: ExplorerScene[]; filters: Filter[] }) {
  const [filter, setFilter] = useState('all')
  const [activeSlug, setActiveSlug] = useState(scenes[0]?.slug ?? '')
  const [live, setLive] = useState(false)

  const visible = useMemo(
    () => (filter === 'all' ? scenes : scenes.filter((s) => s.category === filter)),
    [filter, scenes],
  )
  const active = scenes.find((s) => s.slug === activeSlug) ?? visible[0] ?? scenes[0]
  const usedFilters = filters.filter((f) => f.id === 'all' || scenes.some((s) => s.category === f.id))

  if (!active) {
    return <p className="sp-muted">Belum ada scene yang dipublikasikan.</p>
  }

  const activeIndex = scenes.findIndex((s) => s.slug === active.slug)

  return (
    <div className="sp-explorer">
      <div className="sp-filters" role="toolbar" aria-label="Filter industri">
        {usedFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            className="sp-chip"
            aria-pressed={filter === f.id}
            onClick={() => {
              setFilter(f.id)
              const first = f.id === 'all' ? scenes[0] : scenes.find((s) => s.category === f.id)
              if (first) setActiveSlug(first.slug)
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="sp-explorer__layout">
        <div className="sp-stage sp-frame">
          <div className="sp-stage__viewport">
            {live ? (
              <iframe
                key={active.slug}
                src={active.embedUrl}
                title={`${active.title} — 3D Gaussian Splat interaktif`}
                allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
                allowFullScreen
                className="sp-stage__iframe"
              />
            ) : (
              <div className="sp-stage__poster">
                {active.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={active.posterUrl} alt={`${active.title} — pratinjau`} className="sp-stage__img" />
                ) : (
                  <div className="sp-stage__splats" aria-hidden="true" />
                )}
                <button type="button" className="sp-stage__play" onClick={() => setLive(true)}>
                  <span className="sp-stage__play-ring" aria-hidden="true" />
                  <span>Jelajahi scene 3D</span>
                  <small>Drag untuk memutar · scroll untuk zoom</small>
                </button>
              </div>
            )}
            <span className="sp-hud sp-hud--tl" aria-hidden="true" />
            <span className="sp-hud sp-hud--tr" aria-hidden="true" />
            <span className="sp-hud sp-hud--bl" aria-hidden="true" />
            <span className="sp-hud sp-hud--br" aria-hidden="true" />
          </div>
          <div className="sp-stage__meta">
            <div>
              <p className="sp-eyebrow">
                Project / {String(activeIndex + 1).padStart(2, '0')} · {active.discipline}
              </p>
              <h3 className="sp-stage__title">{active.title}</h3>
              <p className="sp-stage__desc">{active.tagline}</p>
            </div>
            <div className="sp-stage__links">
              <Link href={`/portfolio/${active.slug}`} className="sp-link">
                Detail proyek
              </Link>
              <a href={active.sceneUrl} target="_blank" rel="noopener noreferrer" className="sp-link">
                Buka di SuperSplat ↗
              </a>
            </div>
          </div>
        </div>

        <ul className="sp-scene-list" aria-label="Daftar scene">
          {visible.map((s) => {
            const n = scenes.findIndex((x) => x.slug === s.slug) + 1
            const isActive = s.slug === active.slug
            return (
              <li key={s.slug}>
                <button
                  type="button"
                  className="sp-scene-item"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setActiveSlug(s.slug)}
                >
                  <span className="sp-scene-item__n">{String(n).padStart(2, '0')}</span>
                  <span className="sp-scene-item__body">
                    <span className="sp-scene-item__title">{s.title}</span>
                    <span className="sp-scene-item__meta">{s.discipline}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="sp-note">
        Viewer interaktif disediakan melalui SuperSplat. Waktu muat bergantung pada koneksi, perangkat, dan ukuran scene.
      </p>
    </div>
  )
}
