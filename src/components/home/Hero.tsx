'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { ArrowRight, Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Layers, Box, Film, Cpu } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from '@/hooks'
import type { AnimationWebGLStatus } from '@/components/webgl/AnimationWebGL'
import './hero.css'

const AnimationWebGL = dynamic(() => import('@/components/webgl/AnimationWebGL'), {
  ssr: false,
})

type StudioDiscipline = 'reel' | '2d' | '3d' | 'motion' | 'assets'

const DISCIPLINES: {
  id: StudioDiscipline
  label: string
  pill: string
  client: string
  title: string
  description: string
  image?: string
  icon: typeof Film
}[] = [
  {
    id: 'reel',
    label: 'Studio Reel',
    pill: 'MASTER REEL 2024',
    client: 'Selected Works',
    title: 'UNIMASI Studio Showreel 4K',
    description: 'Rangkuman karya animasi 2D, 3D CGI, dan motion design untuk mitra korporat & institusi global.',
    icon: Film,
  },
  {
    id: '3d',
    label: '3D CGI & Industrial',
    pill: '3D VISUAL PRODUCTION',
    client: 'PT Yogya Presisi Tehnikatama Industri (YPTI)',
    title: 'Presisi Manufaktur CNC & Mekanikal 5-Axis',
    description: 'Visualisasi CAD fotorealistik, sinematografi makro industri, dan simulasi proses produksi presisi tinggi.',
    image: '/images/showcase/pt-ypti-3d.webp',
    icon: Box,
  },
  {
    id: 'motion',
    label: 'Motion Graphics',
    pill: 'KINETIC & TECH EXPLAINER',
    client: 'Telkom Indonesia',
    title: 'Visualisasi Jaringan & Ekosistem Digital',
    description: 'Tipografi kinetik dinamis, animasi infografis interaktif, dan arsitektur data visual berskala besar.',
    image: '/images/showcase/telkom-dfe.webp',
    icon: Layers,
  },
  {
    id: '2d',
    label: '2D Animation',
    pill: 'NARRATIVE & EXPLAINER',
    client: 'Danone Indonesia',
    title: 'Storytelling Emosional & Karakter Frame-by-Frame',
    description: 'Desain karakter ekspresif, alur cerita berkesan, dan animasi 2D berstandar festival serta kampanye publik.',
    image: '/images/showcase/3d-short-film.webp',
    icon: Sparkles,
  },
  {
    id: 'assets',
    label: 'Digital Visual Assets',
    pill: 'SPATIAL & AI WORKFLOW',
    client: 'Universitas Gadjah Mada (UGM)',
    title: 'Aset Spasial Real-Time & Riset Visual',
    description: 'Visualisasi molekuler sains, asset library 3D real-time, dan pipeline produksi visual berbantuan AI terkurasi.',
    image: '/images/showcase/ugm.webp',
    icon: Cpu,
  },
]

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const morphProgressRef = useRef(0)
  const [webglReady, setWebglReady] = useState(false)
  const [activeDiscipline, setActiveDiscipline] = useState<StudioDiscipline>('reel')
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [fullscreenModal, setFullscreenModal] = useState(false)
  const reduced = useReducedMotion()

  const handleWebglStatus = useCallback((status: AnimationWebGLStatus) => {
    if (status === 'ready') setWebglReady(true)
  }, [])

  // Video playback listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section || reduced) return

      gsap.registerPlugin(ScrollTrigger)

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          morphProgressRef.current = self.progress
        },
      })

      const eyebrow = section.querySelector('.hero__badge-row')
      const titleLines = section.querySelectorAll('.hero__title-line')
      const kicker = section.querySelector('.hero__kicker')
      const lede = section.querySelector('.hero__lede')
      const actions = section.querySelector('.hero__actions')
      const stats = section.querySelector('.hero__stats-row')
      const cinemaFrame = section.querySelector('.hero__cinema-frame')

      gsap.set([eyebrow, titleLines, kicker, lede, actions, stats, cinemaFrame], {
        y: 28,
        autoAlpha: 0,
      })

      gsap
        .timeline({ defaults: { duration: 0.8, ease: 'power3.out' } })
        .to(eyebrow, { y: 0, autoAlpha: 1 }, 0.05)
        .to(titleLines, { y: 0, autoAlpha: 1, stagger: 0.1 }, 0.15)
        .to(kicker, { y: 0, autoAlpha: 1 }, 0.38)
        .to(lede, { y: 0, autoAlpha: 1 }, 0.48)
        .to(actions, { y: 0, autoAlpha: 1 }, 0.58)
        .to(stats, { y: 0, autoAlpha: 1 }, 0.68)
        .to(cinemaFrame, { y: 0, autoAlpha: 1, scale: 1 }, 0.3)
    },
    { scope: sectionRef },
  )

  const currentItem = DISCIPLINES.find((d) => d.id === activeDiscipline) || DISCIPLINES[0]

  return (
    <section
      className={`hero grain${webglReady ? ' hero--gl' : ''}`}
      ref={sectionRef}
      aria-labelledby="hero-title"
    >
      {/* Dynamic Background Atmosphere */}
      <div className="bg-grid hero__grid" aria-hidden="true" />
      <div className="bg-glow bg-glow--blue hero__glow hero__glow--1" aria-hidden="true" />
      <div className="bg-glow bg-glow--yellow hero__glow hero__glow--2" aria-hidden="true" />

      {/* Interactive WebGL Spatial Viewport */}
      <div className="hero__webgl" aria-hidden="true">
        <AnimationWebGL progressRef={morphProgressRef} onStatus={handleWebglStatus} />
      </div>

      <div className="container container--wide hero__inner">
        {/* Left Column: Bold Editorial Copy */}
        <div className="hero__copy">
          <div className="hero__badge-row">
            <span className="hero-status-pill">
              <span className="hero-status-dot" />
              STUDIO SHOWREEL 4K · 24 FPS
            </span>
            <span className="hero-studio-location">YOGYAKARTA &amp; GLOBAL</span>
          </div>

          <h1 className="hero__title display-xl" id="hero-title">
            <span className="hero__line hero__title-line">WE MAKE</span>
            <span className="hero__line hero__title-line">
              IDEAS <em>MOVE.</em>
            </span>
          </h1>

          <p className="hero__kicker">
            2D Animation · 3D CGI &amp; Industrial · Motion Graphics · Visual Assets
          </p>

          <p className="hero__lede lede">
            Mengubah konsep teknis dan gagasan kompleks menjadi visual sinematik yang memukau.
            Dikerjakan frame demi frame oleh tim spesialis senior untuk kejelasan dan impresi maksimal.
          </p>

          <div className="hero__actions">
            <Link href="/portfolio" className="btn btn--primary">
              Eksplorasi Karya Terpilih
              <span className="btn__icon">
                <ArrowRight size={17} aria-hidden="true" />
              </span>
            </Link>
            <Link href="/contact" className="btn btn--ghost">
              Mulai Diskusi Proyek
            </Link>
          </div>

          {/* Quick Studio Metrics & Pipeline Row */}
          <div className="hero__stats-row">
            <div className="hero-stat-item">
              <span className="hero-stat-val">4K DCI</span>
              <span className="hero-stat-lbl">Standar Master Render</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-val">4 Inti</span>
              <span className="hero-stat-lbl">Spesialisasi Produksi</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-val">24 FPS</span>
              <span className="hero-stat-lbl">Bespoke Senior Craft</span>
            </div>
          </div>
        </div>

        {/* Right Column: Immersive Cinema Viewport & Discipline Switcher */}
        <div className="hero__stage">
          <div className="hero__cinema-frame">
            {/* Top Discipline Switcher Tabs */}
            <div className="hero__discipline-tabs" role="tablist" aria-label="Layanan Unggulan">
              {DISCIPLINES.map((d) => {
                const IconComponent = d.icon
                const isActive = activeDiscipline === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`hero-tab-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveDiscipline(d.id)}
                  >
                    <IconComponent size={13} aria-hidden="true" />
                    <span>{d.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Central Cinema Monitor Viewport */}
            <div className="hero-viewport-monitor">
              {activeDiscipline === 'reel' ? (
                <div className="hero-video-wrapper">
                  <video
                    ref={videoRef}
                    src="/videos/unimasi-showreel.webm"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="hero-viewport-video"
                    onClick={togglePlay}
                  />

                  {/* Video Overlays */}
                  <div className="hero-video-controls">
                    <button
                      type="button"
                      className="hero-ctrl-btn"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
                    >
                      {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      type="button"
                      className="hero-ctrl-btn"
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <div className="hero-ctrl-bar">
                      <div
                        className="hero-ctrl-progress"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                    <span className="hero-ctrl-time">SHOWREEL 4K</span>
                    <button
                      type="button"
                      className="hero-ctrl-btn"
                      onClick={() => setFullscreenModal(true)}
                      aria-label="Lihat ukuran penuh"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hero-discipline-preview">
                  {currentItem.image && (
                    <Image
                      src={currentItem.image}
                      alt={currentItem.title}
                      fill
                      className="hero-discipline-img"
                      priority
                      sizes="(max-width: 1024px) 100vw, 640px"
                    />
                  )}
                  <div className="hero-discipline-scrim">
                    <div className="hero-discipline-content">
                      <span className="hero-pill-badge">{currentItem.pill}</span>
                      <p className="hero-client-tag">Klien: {currentItem.client}</p>
                      <h3 className="hero-discipline-title">{currentItem.title}</h3>
                      <p className="hero-discipline-desc">{currentItem.description}</p>
                      <Link
                        href="/portfolio"
                        className="hero-discipline-link"
                      >
                        Lihat Case Study Selengkapnya &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport HUD Corner Markers */}
              <div className="hero-hud-bracket hero-hud--tl" />
              <div className="hero-hud-bracket hero-hud--tr" />
              <div className="hero-hud-bracket hero-hud--bl" />
              <div className="hero-hud-bracket hero-hud--br" />
              <div className="hero-hud-timecode">REC ● 00:01:24 : 24fps</div>
              <div className="hero-hud-format">UHD 3840×2160 · 10-BIT</div>
            </div>

            {/* Bottom Pipeline Track */}
            <div className="hero-pipeline-track">
              <div className="hero-pipeline-step">
                <span className="hero-step-num">01</span>
                <span className="hero-step-name">Brief &amp; Script</span>
              </div>
              <div className="hero-step-arrow">&rarr;</div>
              <div className="hero-pipeline-step">
                <span className="hero-step-num">02</span>
                <span className="hero-step-name">Storyboard 2D</span>
              </div>
              <div className="hero-step-arrow">&rarr;</div>
              <div className="hero-pipeline-step">
                <span className="hero-step-num">03</span>
                <span className="hero-step-name">CGI &amp; Motion</span>
              </div>
              <div className="hero-step-arrow">&rarr;</div>
              <div className="hero-pipeline-step">
                <span className="hero-step-num">04</span>
                <span className="hero-step-name">Master Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless Transition to Next Section */}
      <div className="hero__scroll-cue" aria-hidden="true">
        <span className="mono">Scroll to Explore</span>
        <span className="hero__scroll-line" />
      </div>

      {/* Fullscreen Video Modal */}
      {fullscreenModal && (
        <div
          className="hero-modal-backdrop"
          onClick={() => setFullscreenModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="hero-modal-body" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hero-modal-close"
              onClick={() => setFullscreenModal(false)}
              aria-label="Tutup modal"
            >
              &times;
            </button>
            <video
              src="/videos/unimasi-showreel.webm"
              controls
              autoPlay
              className="hero-modal-video"
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default Hero
