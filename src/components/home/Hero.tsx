'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Layers,
  Box,
  Compass,
  Cpu,
  Eye,
  Camera,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from '@/hooks'
import type { AnimationWebGLStatus } from '@/components/webgl/AnimationWebGL'
import './hero.css'

const AnimationWebGL = dynamic(() => import('@/components/webgl/AnimationWebGL'), {
  ssr: false,
})

type StudioDiscipline = 'splat' | 'filmmaking' | 'marketing' | 'medical' | 'memory'

const DISCIPLINES: {
  id: StudioDiscipline
  label: string
  pill: string
  client: string
  title: string
  description: string
  image: string
  splatUrl?: string
  icon: typeof Sparkles
}[] = [
  {
    id: 'splat',
    label: '3DGS Real-Time',
    pill: '3D GAUSSIAN SPLATTING',
    client: 'Batuna Resto & Resort',
    title: 'Batuna Resto Manado — Oceanfront Exterior',
    description: 'Eksplorasi spasial fotorealistis 15.1M splats dengan kebebasan berjalan 360° di browser 60 FPS tanpa distorsi lensa.',
    image: '/images/spatium/page_01_0.jpg',
    splatUrl: 'https://superspl.at/s?id=dc1cd13b',
    icon: Sparkles,
  },
  {
    id: 'marketing',
    label: 'Marketing & ZMOT',
    pill: 'F&B & RETAIL REALITY',
    client: 'Kidang Nyaring Coffee',
    title: 'Kidang Nyaring Cafe — Outdoor Forest Canopy',
    description: 'Menghadirkan Zero Moment of Truth (ZMOT) bagi pelanggan untuk merasakan suasana dan memilih meja favorit sebelum berkunjung.',
    image: '/images/spatium/page_03_0.jpg',
    splatUrl: 'https://superspl.at/s?id=9373a4cd',
    icon: Compass,
  },
  {
    id: 'medical',
    label: 'Healthcare & Medis',
    pill: 'CLINICAL DIGITAL TWIN',
    client: 'National Referral Hospital',
    title: 'Ruang Operasi Bedah Presisi Sub-3mm',
    description: 'Kembaran digital ruang bedah steril presisi sub-sentimeter untuk orientasi prosedur dan verifikasi instrumen medis tanpa kontak fisik.',
    image: '/images/spatium/page_09_0.jpg',
    splatUrl: 'https://superspl.at/s?id=551b7432',
    icon: Cpu,
  },
  {
    id: 'filmmaking',
    label: 'Filmmaking & VFX',
    pill: 'SET RECONSTRUCTION & PREVIZ',
    client: 'PT Unicam Indonesia',
    title: 'Fasilitas Manufaktur & Presisi Industri',
    description: 'Pemindaian set fisik dan fasilitas produksi untuk virtual scouting sutradara, line-up kamera sinema, dan audit global jarak jauh.',
    image: '/images/spatium/page_07_0.jpg',
    splatUrl: 'https://superspl.at/s?id=9c0284e8',
    icon: Camera,
  },
  {
    id: 'memory',
    label: 'Memory & Legacy',
    pill: 'WEDDING & HERITAGE PRESERVATION',
    client: 'Private Luxury Estate',
    title: 'Grand Glasshouse Wedding Sanctuary',
    description: 'Preservasi spasial momen berharga dan arsitektur kaca berkilau ke dalam arsip memori abadi yang dapat dikunjungi kembali lintas generasi.',
    image: '/images/spatium/page_08_0.jpg',
    splatUrl: 'https://superspl.at/s?id=e318925e',
    icon: Box,
  },
]

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const morphProgressRef = useRef(0)
  const [webglReady, setWebglReady] = useState(false)
  const [activeDiscipline, setActiveDiscipline] = useState<StudioDiscipline>('splat')
  const [heroMode, setHeroMode] = useState<'splat' | 'cinematic'>('splat')
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
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
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
      <div className="bg-glow bg-glow--blue hero__glow hero__glow--2" aria-hidden="true" />

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
              SPATIUM · SPATIAL TECHNOLOGY STUDIO
            </span>
            <span className="hero-studio-location">JAKARTA · BANDUNG · GLOBAL</span>
          </div>

          <h1 className="hero__title display-xl" id="hero-title">
            <span className="hero__line hero__title-line">REAL PLACES.</span>
            <span className="hero__line hero__title-line">
              NEW <em>PERSPECTIVES.</em>
            </span>
          </h1>

          <p className="hero__kicker">
            3D Gaussian Splatting · LiDAR Laser Scanning · Photogrammetry · Walkable Images
          </p>

          <p className="hero__lede lede">
            Mengatasi <em>The Curse of Distance</em> dengan menghadirkan ruang nyata ke dalam pengalaman spasial fotorealistis 3D 60 FPS.
            Dari sekadar melihat foto, menjadi berjalan dan mengalami. Dari sekadar menduga, menjadi memverifikasi secara langsung.
          </p>

          <div className="hero__actions">
            <a href="#spatial-showcase" className="btn btn--primary">
              Jelajahi Capture 3DGS
              <span className="btn__icon">
                <ArrowRight size={17} aria-hidden="true" />
              </span>
            </a>
            <Link href="/contact" className="btn btn--ghost">
              Konsultasi Ruang Spasial
            </Link>
          </div>

          {/* Quick Studio Metrics & Pipeline Row */}
          <div className="hero__stats-row">
            <div className="hero-stat-item">
              <span className="hero-stat-val">&lt; 5mm</span>
              <span className="hero-stat-lbl">Akurasi Spasial LiDAR</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-val">60 FPS</span>
              <span className="hero-stat-lbl">Real-time WebGL Native</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat-item">
              <span className="hero-stat-val">15M+</span>
              <span className="hero-stat-lbl">Photorealistic Splats</span>
            </div>
          </div>
        </div>

        {/* Right Column: Immersive Cinema Viewport & Discipline Switcher */}
        <div className="hero__stage">
          <div className="hero__cinema-frame">
            {/* Top Discipline Switcher Tabs */}
            <div className="hero__discipline-tabs" role="tablist" aria-label="Vertikal Spasial SPATIUM">
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

            {/* Mode Switcher Bar */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#060D1A]/95 border-b border-white/10 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHeroMode('splat')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    heroMode === 'splat'
                      ? 'bg-cyan-400 text-[#040811] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                      : 'text-neutral-400 hover:text-white bg-white/5'
                  }`}
                >
                  ● 3DGS Live Embed
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode('cinematic')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    heroMode === 'cinematic'
                      ? 'bg-white text-[#040811] shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      : 'text-neutral-400 hover:text-white bg-white/5'
                  }`}
                >
                  Capture Stills
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline">60 FPS WebGL</span>
                <button
                  type="button"
                  onClick={() => setFullscreenModal(true)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                  aria-label="Fullscreen Viewport"
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {/* Central Viewport Monitor */}
            <div className="hero-viewport-monitor relative h-[360px] sm:h-[420px]">
              {heroMode === 'splat' && currentItem.splatUrl ? (
                <div className="w-full h-full relative bg-[#040810]">
                  <iframe
                    src={currentItem.splatUrl}
                    title={currentItem.title}
                    allow="accelerometer; gyroscope; magnetometer; xr-spatial-tracking; fullscreen"
                    className="w-full h-full border-0 absolute inset-0 z-0 bg-[#040810]"
                  />
                  {/* Floating Hint */}
                  <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-[#060D1A]/85 backdrop-blur-md border border-white/15 text-cyan-400 text-[10px] font-mono tracking-wider uppercase font-semibold">
                      Drag / Scroll untuk Navigasi 360°
                    </span>
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
                      
                      <div className="flex items-center gap-3 mt-3">
                        {currentItem.splatUrl && (
                          <button
                            type="button"
                            onClick={() => setHeroMode('splat')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#040811] font-bold text-xs font-mono uppercase tracking-wider hover:bg-cyan-100 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
                          >
                            <Eye size={13} />
                            <span>Buka 3DGS Live</span>
                          </button>
                        )}
                        <Link
                          href="/portfolio"
                          className="hero-discipline-link"
                        >
                          Lihat Semua Showcases &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport HUD Corner Markers */}
              <div className="hero-hud-bracket hero-hud--tl pointer-events-none" />
              <div className="hero-hud-bracket hero-hud--tr pointer-events-none" />
              <div className="hero-hud-bracket hero-hud--bl pointer-events-none" />
              <div className="hero-hud-bracket hero-hud--br pointer-events-none" />
              <div className="hero-hud-timecode pointer-events-none">3DGS ● 60.0 FPS : SUB-5MM</div>
            </div>

            {/* Bottom Monitor Status Bar */}
            <div className="hero-stage-status">
              <span className="hero-stage-label">SPATIUM REALITY CAPTURE PIPELINE</span>
              <span className="hero-stage-meta">ONE POINT, UNLIMITED POSSIBILITIES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Fullscreen Showcase */}
      {fullscreenModal && (
        <div className="hero-modal-overlay" onClick={() => setFullscreenModal(false)}>
          <div className="hero-modal-container max-w-6xl w-full h-[85vh] bg-[#070F1E] rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hero-modal-close z-30"
              onClick={() => setFullscreenModal(false)}
              aria-label="Tutup"
            >
              &times;
            </button>
            <div className="w-full h-full relative">
              {currentItem.splatUrl ? (
                <iframe
                  src={currentItem.splatUrl}
                  title={currentItem.title}
                  allow="accelerometer; gyroscope; magnetometer; xr-spatial-tracking; fullscreen"
                  className="w-full h-full border-0 absolute inset-0 z-0 bg-[#040810]"
                />
              ) : currentItem.image ? (
                <Image
                  src={currentItem.image}
                  alt={currentItem.title}
                  fill
                  className="object-contain"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
