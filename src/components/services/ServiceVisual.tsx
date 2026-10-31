'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useReducedMotion } from '@/hooks'
import type { ServiceVisual as VisualKind } from '@/data/services'
import './service-visual.css'

/* ==========================================================================
   Sketch (2D) — line art vs colour
   ========================================================================== */
function SketchArt() {
  return (
    <svg viewBox="0 0 400 300" className="sv-art" role="img" aria-label="Line-art storyboard sketch">
      <g fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.75">
        <rect x="28" y="30" width="150" height="106" rx="6" />
        <rect x="222" y="30" width="150" height="106" rx="6" />
        <rect x="28" y="164" width="150" height="106" rx="6" />
        <rect x="222" y="164" width="150" height="106" rx="6" />
      </g>
      <g fill="none" stroke="#FFD600" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="103" cy="76" r="22" />
        <path d="M74 118c4-16 15-24 29-24s25 8 29 24" />
        <path d="M60 70h-14M60 82h-10" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.5">
        <path d="M246 96l34-30 40 22 34-20" />
        <path d="M246 110h104" />
        <path d="M246 124h72" />
      </g>
      <g fill="none" stroke="#FFD600" strokeWidth="2" strokeLinecap="round">
        <path d="M78 232l26-30 26 30z" />
        <circle cx="104" cy="208" r="6" />
        <path d="M140 210h24M140 224h16" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.5">
        <rect x="246" y="190" width="104" height="56" rx="6" />
        <path d="M262 214h72M262 228h48" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.16">
        <path d="M0 150h400M200 0v300" />
      </g>
    </svg>
  )
}

function FinalArt() {
  return (
    <svg viewBox="0 0 400 300" className="sv-art" role="img" aria-label="Finished colour animation frame">
      <defs>
        <linearGradient id="sv2d-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3E77" />
          <stop offset="100%" stopColor="#0A1730" />
        </linearGradient>
        <linearGradient id="sv2d-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD600" />
          <stop offset="100%" stopColor="#E0AD00" />
        </linearGradient>
      </defs>
      <rect x="28" y="30" width="150" height="106" rx="6" fill="url(#sv2d-a)" />
      <rect x="28" y="164" width="150" height="106" rx="6" fill="url(#sv2d-a)" />
      <rect x="222" y="30" width="150" height="106" rx="6" fill="#122C57" />
      <rect x="222" y="164" width="150" height="106" rx="6" fill="url(#sv2d-a)" />

      <circle cx="103" cy="76" r="22" fill="url(#sv2d-b)" />
      <path d="M74 118c4-16 15-24 29-24s25 8 29 24z" fill="url(#sv2d-b)" />
      <rect x="60" y="126" width="86" height="6" rx="3" fill="#ffffff" opacity="0.35" />
      <path d="M46 70h14M50 82h10" stroke="#FFD600" strokeWidth="3" strokeLinecap="round" />

      <g>
        <rect x="246" y="76" width="18" height="32" rx="3" fill="#7FB2FF" />
        <rect x="272" y="60" width="18" height="48" rx="3" fill="#FFD600" />
        <rect x="298" y="88" width="18" height="20" rx="3" fill="#ffffff" opacity="0.5" />
        <rect x="324" y="52" width="18" height="56" rx="3" fill="#8FF0C4" />
        <path d="M246 118h104" stroke="#ffffff" strokeWidth="2" opacity="0.4" />
      </g>

      <path d="M78 232l26-30 26 30z" fill="#FFD600" />
      <circle cx="104" cy="208" r="6" fill="#0A1730" />
      <rect x="140" y="204" width="26" height="8" rx="4" fill="#ffffff" opacity="0.8" />
      <rect x="140" y="220" width="18" height="8" rx="4" fill="#ffffff" opacity="0.4" />

      <rect x="246" y="190" width="104" height="56" rx="6" fill="#0F2044" />
      <rect x="262" y="210" width="72" height="8" rx="4" fill="#ffffff" opacity="0.7" />
      <rect x="262" y="226" width="48" height="8" rx="4" fill="#FFD600" />
    </svg>
  )
}

/* ==========================================================================
   3D — wireframe vs shaded
   ========================================================================== */
function WireframeArt() {
  return (
    <svg viewBox="0 0 400 300" className="sv-art" role="img" aria-label="Wireframe 3D model">
      <g fill="none" stroke="#7FB2FF" strokeWidth="1.6" strokeLinejoin="round" opacity="0.9">
        <path d="M200 52 300 88 200 124 100 88z" />
        <path d="M100 88v128l100 36V124" />
        <path d="M300 88v128l-100 36" />
        <path d="M200 124v128" opacity="0.4" />
        <path d="M150 106v128M250 106v128" opacity="0.32" />
        <path d="M100 152l100 36 100-36" opacity="0.32" />
        <path d="M100 216l100 36 100-36" opacity="0.32" />
        <path d="M133 148v128M267 148v128" opacity="0.18" strokeDasharray="4 6" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.14">
        <path d="M0 252h400M0 60h400" />
      </g>
      <circle cx="200" cy="124" r="4" fill="#FFD600" />
      <circle cx="100" cy="88" r="3.5" fill="#7FB2FF" />
      <circle cx="300" cy="88" r="3.5" fill="#7FB2FF" />
      <circle cx="200" cy="252" r="3.5" fill="#7FB2FF" />
    </svg>
  )
}

function RenderArt() {
  return (
    <svg viewBox="0 0 400 300" className="sv-art" role="img" aria-label="Shaded 3D render">
      <defs>
        <linearGradient id="sv3d-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F7FF" />
          <stop offset="100%" stopColor="#9FB6DA" />
        </linearGradient>
        <linearGradient id="sv3d-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C4E86" />
          <stop offset="100%" stopColor="#122C57" />
        </linearGradient>
        <linearGradient id="sv3d-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD600" />
          <stop offset="100%" stopColor="#C9A200" />
        </linearGradient>
      </defs>
      <path d="M200 52 300 88 200 124 100 88z" fill="url(#sv3d-top)" />
      <path d="M100 88v128l100 36V124z" fill="url(#sv3d-left)" />
      <path d="M300 88v128l-100 36V124z" fill="url(#sv3d-right)" />
      <path d="M200 124 300 88" stroke="#ffffff" strokeWidth="1.5" opacity="0.45" />
      <path d="M100 152l100 36 100-36" stroke="#ffffff" strokeWidth="1" opacity="0.12" fill="none" />
      <ellipse cx="200" cy="268" rx="118" ry="16" fill="#04091A" opacity="0.45" />
      <path d="M118 92 214 60" stroke="#ffffff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
    </svg>
  )
}

/* ==========================================================================
   Motion graphics — chart + kinetic type
   ========================================================================== */
type ChartKind = 'bars' | 'line' | 'donut'

const CHART_DATA = [0.42, 0.68, 0.54, 0.88, 0.61, 0.74]

function MotionChart({ kind, animateKey }: { kind: ChartKind; animateKey: number }) {
  if (kind === 'line') {
    const points = CHART_DATA.map((v, i) => `${40 + i * 58},${200 - v * 140}`).join(' ')
    return (
      <svg viewBox="0 0 380 240" className="sv-chart" role="img" aria-label="Animated line chart">
        <g stroke="rgba(255,255,255,0.14)" strokeWidth="1">
          {[60, 100, 140, 200].map((y) => (
            <line key={y} x1="30" y1={y} x2="356" y2={y} />
          ))}
        </g>
        <polyline
          key={animateKey}
          points={points}
          fill="none"
          stroke="#FFD600"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sv-line-draw"
        />
        {CHART_DATA.map((v, i) => (
          <circle key={i} cx={40 + i * 58} cy={200 - v * 140} r="5.5" fill="#FFD600" className="sv-dot-in" style={{ animationDelay: `${0.5 + i * 0.09}s` }} />
        ))}
      </svg>
    )
  }

  if (kind === 'donut') {
    const total = CHART_DATA.reduce((a, b) => a + b, 0)
    const C = 2 * Math.PI * 74
    let offset = 0
    const colors = ['#FFD600', '#7FB2FF', '#8FF0C4', '#FFE566', '#FF8A5C', '#ffffff']
    return (
      <svg viewBox="0 0 380 240" className="sv-chart" role="img" aria-label="Animated donut chart">
        <g transform="translate(120 120) rotate(-90)">
          {CHART_DATA.map((v, i) => {
            const len = (v / total) * C
            const seg = (
              <circle
                key={`${animateKey}-${i}`}
                r="74"
                fill="none"
                stroke={colors[i]}
                strokeWidth="26"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                className="sv-donut-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            )
            offset += len
            return seg
          })}
        </g>
        <g transform="translate(238 96)">
          {CHART_DATA.slice(0, 4).map((_, i) => (
            <g key={i} transform={`translate(0 ${i * 30})`}>
              <rect width="14" height="14" rx="4" fill={colors[i]} />
              <rect x="24" y="4" width={60 + i * 12} height="8" rx="4" fill="rgba(255,255,255,0.35)" />
            </g>
          ))}
        </g>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 380 240" className="sv-chart" role="img" aria-label="Animated bar chart">
      <g stroke="rgba(255,255,255,0.14)" strokeWidth="1">
        {[60, 100, 140, 200].map((y) => (
          <line key={y} x1="30" y1={y} x2="356" y2={y} />
        ))}
      </g>
      {CHART_DATA.map((v, i) => (
        <g key={`${animateKey}-${i}`}>
          <rect
            x={44 + i * 58 - 18}
            y={200 - v * 140}
            width="36"
            height={v * 140}
            rx="7"
            fill={i === 3 ? '#FFD600' : 'rgba(127,178,255,0.75)'}
            className="sv-bar-grow"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        </g>
      ))}
      <line x1="26" y1="200" x2="360" y2="200" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
    </svg>
  )
}

/* ==========================================================================
   Before / after slider
   ========================================================================== */
function BeforeAfter({
  before,
  after,
  labels,
  tag,
}: {
  before: React.ReactNode
  after: React.ReactNode
  labels: [string, string]
  tag: string
}) {
  const [pos, setPos] = useState(56)
  const [playing, setPlaying] = useState(false)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!playing) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / 1000
      setPos(50 + 46 * Math.sin(t * 1.6))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const setFromClientX = useCallback((clientX: number) => {
    const node = stageRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(100, Math.max(0, next)))
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    setPlaying(false)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    setFromClientX(e.clientX)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    setFromClientX(e.clientX)
  }

  const stop = () => {
    dragging.current = false
  }

  return (
    <div className="ba">
      <div
        className="ba__stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerLeave={stop}
        role="slider"
        aria-label={`${tag} comparison`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% ${labels[1]}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 4))
          if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 4))
        }}
      >
        <div className="ba__layer">{before}</div>
        <div className="ba__layer ba__layer--after" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {after}
        </div>
        <span className="ba__badge ba__badge--left">{labels[0]}</span>
        <span className="ba__badge ba__badge--right">{labels[1]}</span>
        <div className="ba__handle" style={{ left: `${pos}%` }}>
          <span className="ba__handle-grip">
            <Icon name="arrow-left" size={13} />
            <Icon name="arrow-right" size={13} />
          </span>
        </div>
      </div>

      <div className="ba__controls">
        <label className="ba__range-label">
          <span className="mono">{tag}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(pos)}
            onChange={(e) => {
              setPlaying(false)
              setPos(Number(e.target.value))
            }}
            aria-label={`${tag} blend`}
          />
        </label>
        {!reduced ? (
          <button
            type="button"
            className={`ba__play${playing ? ' is-on' : ''}`}
            onClick={() => setPlaying((v) => !v)}
            aria-pressed={playing}
          >
            <Icon name={playing ? 'close' : 'play'} size={14} filled={!playing} />
            {playing ? 'Stop preview' : 'Auto preview'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

/* ==========================================================================
   3D orbit stage
   ========================================================================== */
function OrbitStage() {
  const [rot, setRot] = useState({ x: -16, y: -28 })
  const dragging = useRef<{ x: number; y: number } | null>(null)
  const [view, setView] = useState<'iso' | 'front' | 'top'>('iso')
  const [shaded, setShaded] = useState(true)

  const views = { iso: { x: -16, y: -28 }, front: { x: 0, y: 0 }, top: { x: -68, y: 0 } } as const

  const applyView = (v: 'iso' | 'front' | 'top') => {
    setView(v)
    setRot(views[v])
  }

  return (
    <div className="orbit">
      <div
        className="orbit__stage"
        onPointerDown={(e) => {
          dragging.current = { x: e.clientX, y: e.clientY }
          setView('iso')
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return
          const dx = e.clientX - dragging.current.x
          const dy = e.clientY - dragging.current.y
          dragging.current = { x: e.clientX, y: e.clientY }
          setRot((r) => ({ x: Math.max(-80, Math.min(80, r.x - dy * 0.4)), y: r.y + dx * 0.5 }))
        }}
        onPointerUp={() => {
          dragging.current = null
        }}
        onPointerLeave={() => {
          dragging.current = null
        }}
      >
        <div
          className={`orbit__model${shaded ? ' is-shaded' : ' is-wire'}`}
          style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
          aria-hidden="true"
        >
          {['front', 'back', 'right', 'left', 'top', 'bottom'].map((face) => (
            <span key={face} className={`orbit__face orbit__face--${face}`} />
          ))}
          <span className="orbit__core" />
        </div>
        <span className="orbit__hint mono">Drag to orbit</span>
      </div>

      <div className="orbit__controls">
        <div className="seg" role="group" aria-label="Camera view">
          {(['iso', 'front', 'top'] as const).map((v) => (
            <button key={v} type="button" className={`seg__btn${view === v ? ' is-active' : ''}`} onClick={() => applyView(v)} aria-pressed={view === v}>
              {v === 'iso' ? 'Perspective' : v === 'front' ? 'Front' : 'Top'}
            </button>
          ))}
        </div>
        <button type="button" className="orbit__toggle" onClick={() => setShaded((s) => !s)} aria-pressed={!shaded}>
          <Icon name={shaded ? 'eye' : 'grid'} size={15} />
          {shaded ? 'Showing render' : 'Showing wireframe'}
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
   Public component
   ========================================================================== */
export function ServiceVisual({ kind }: { kind: VisualKind }) {
  const [chart, setChart] = useState<ChartKind>('bars')
  const [chartKey, setChartKey] = useState(0)
  const marquee = useMemo(
    () => ['KINETIC TYPE', 'DATA MOTION', 'BRAND IDENT', 'UI MOTION', 'COMPOSITING'],
    [],
  )

  if (kind === '2d') {
    return (
      <BeforeAfter
        tag="Sketch → Final"
        labels={['Sketch', 'Final animation']}
        before={<SketchArt />}
        after={<FinalArt />}
      />
    )
  }

  if (kind === '3d') {
    return (
      <div className="sv-stack">
        <BeforeAfter
          tag="Wireframe → Render"
          labels={['Wireframe', 'Render']}
          before={<WireframeArt />}
          after={<RenderArt />}
        />
        <OrbitStage />
      </div>
    )
  }

  if (kind === 'motion') {
    return (
      <div className="sv-motion">
        <div className="sv-marquee" aria-hidden="true">
          <div className="sv-marquee__track">
            {[...marquee, ...marquee].map((word, i) => (
              <span key={i} className="sv-marquee__word">
                {word}
                <i />
              </span>
            ))}
          </div>
        </div>

        <div className="sv-chart-wrap">
          <div className="sv-chart-head">
            <div className="seg" role="group" aria-label="Chart type">
              {(['bars', 'line', 'donut'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`seg__btn${chart === c ? ' is-active' : ''}`}
                  aria-pressed={chart === c}
                  onClick={() => {
                    setChart(c)
                    setChartKey((k) => k + 1)
                  }}
                >
                  {c === 'bars' ? 'Bars' : c === 'line' ? 'Line' : 'Donut'}
                </button>
              ))}
            </div>
            <button type="button" className="sv-replay" onClick={() => setChartKey((k) => k + 1)}>
              <Icon name="refresh" size={14} /> Replay
            </button>
          </div>
          <MotionChart kind={chart} animateKey={chartKey} />
          <p className="sv-chart-note mono">Illustrative data — reveals, scale and pacing only</p>
        </div>
      </div>
    )
  }

  // assets
  const tiles = [
    { label: 'Wireframe', icon: 'grid' },
    { label: 'Material', icon: 'brush' },
    { label: 'Rig', icon: 'route' },
    { label: 'Motion preset', icon: 'bolt' },
    { label: 'LOD set', icon: 'layers' },
    { label: 'Spec sheet', icon: 'film' },
  ] as const

  return (
    <div className="sv-assets">
      {tiles.map((tile, i) => (
        <div className="sv-asset" key={tile.label} style={{ ['--i' as string]: i }}>
          <span className="sv-asset__icon">
            <Icon name={tile.icon} size={20} />
          </span>
          <span className="sv-asset__label">{tile.label}</span>
          <span className="sv-asset__bar" />
        </div>
      ))}
    </div>
  )
}

export default ServiceVisual
