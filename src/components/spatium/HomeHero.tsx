'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { OrbitBackdrop } from './OrbitBackdrop'
import type { SplatFieldStatus } from './SplatField'

const SplatField = dynamic(() => import('./SplatField'), { ssr: false })

export function HomeHero({ sceneCount }: { sceneCount: number }) {
  const rootRef = useRef<HTMLElement | null>(null)
  const progressRef = useRef(0)
  const [glReady, setGlReady] = useState(false)

  const onStatus = useCallback((status: SplatFieldStatus) => {
    setGlReady(status === 'ready')
  }, [])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.registerPlugin(ScrollTrigger)

      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          progressRef.current = self.progress
        },
      })

      gsap
        .timeline({ defaults: { ease: 'power3.out', duration: 1 } })
        .from('.sp-hero__eyebrow', { y: 16, autoAlpha: 0 }, 0.2)
        .from('.sp-hero__line', { yPercent: 110, stagger: 0.12, duration: 1.1 }, 0.3)
        .from('.sp-hero__lede', { y: 18, autoAlpha: 0 }, 0.75)
        .from('.sp-hero__actions > *', { y: 14, autoAlpha: 0, stagger: 0.08 }, 0.9)
        .from('.sp-hero__flow > *', { autoAlpha: 0, stagger: 0.1 }, 1.1)

      gsap.to('.sp-hero__copy', {
        yPercent: -14,
        autoAlpha: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} className={`sp-hero${glReady ? ' is-gl' : ''}`} aria-labelledby="sp-hero-title">
      <OrbitBackdrop variant="hero" />
      <SplatField className="sp-hero__gl" progressRef={progressRef} onStatus={onStatus} />
      <div className="sp-hero__vignette" aria-hidden="true" />

      <div className="sp-container sp-hero__inner">
        <div className="sp-hero__copy">
          <p className="sp-eyebrow sp-hero__eyebrow">Spatial Technology Studio · Digital Twin for Creative Industry</p>
          <h1 id="sp-hero-title" className="sp-hero__title">
            <span className="sp-hero__mask">
              <span className="sp-hero__line">Real places.</span>
            </span>
            <span className="sp-hero__mask">
              <span className="sp-hero__line sp-accent">New perspectives.</span>
            </span>
          </h1>
          <p className="sp-hero__lede">
            Kami merekam ruang nyata dan merekonstruksinya menjadi <strong>3D Gaussian Splat</strong> yang fotorealistis
            — ruang yang bisa dijelajahi, diukur, dan dikunjungi kembali dari mana saja.
          </p>
          <div className="sp-hero__actions">
            <a href="#scenes" className="sp-btn sp-btn--primary">
              Jelajahi {sceneCount} scene
              <span aria-hidden="true">→</span>
            </a>
            <Link href="/contact" className="sp-btn sp-btn--ghost">
              Mulai proyek
            </Link>
          </div>
        </div>

        <ol className="sp-hero__flow" aria-label="Alur kerja Spatium">
          <li>Capture once</li>
          <li aria-hidden="true" className="sp-hero__flow-sep" />
          <li>Spatial foundation</li>
          <li aria-hidden="true" className="sp-hero__flow-sep" />
          <li>Multiple possibilities</li>
        </ol>
      </div>

      <a href="#way-we-see" className="sp-hero__cue" aria-label="Gulir ke bagian berikutnya">
        <span />
      </a>
    </section>
  )
}
