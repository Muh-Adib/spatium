import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { usePointerParallax, useReducedMotion } from '@/hooks'
import './hero.css'

const STORYBOARD_FRAMES = [
  { label: 'Frame 01', art: 'frames' },
  { label: 'Frame 04', art: 'char' },
  { label: 'Frame 07', art: 'camera' },
]

const DISCIPLINES = ['2D Animation', '3D Animation', 'Motion Graphics']

export function Hero() {
  const { ref, onPointerMove, onPointerLeave } = usePointerParallax<HTMLDivElement>()
  const sectionRef = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const node = sectionRef.current
    if (!node) return
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const rect = node.getBoundingClientRect()
        const progress = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)))
        node.style.setProperty('--hero-scroll', progress.toFixed(4))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [reduced])

  return (
    <section className="hero grain" ref={sectionRef} aria-labelledby="hero-title">
      <div className="bg-grid hero__grid" aria-hidden="true" />
      <div className="bg-glow bg-glow--blue hero__glow hero__glow--1" aria-hidden="true" />
      <div className="bg-glow bg-glow--yellow hero__glow hero__glow--2" aria-hidden="true" />

      <div className="container container--wide hero__inner">
        <div className="hero__copy">
          <p className="eyebrow" data-reveal="left">
            Animation &amp; Motion Design Studio
          </p>

          <h1 className="hero__title display-xl" id="hero-title">
            <span className="hero__line" data-reveal="left" style={{ ['--reveal-delay' as string]: '60ms' }}>
              WE MAKE
            </span>
            <span className="hero__line" data-reveal="left" style={{ ['--reveal-delay' as string]: '160ms' }}>
              IDEAS <em>MOVE.</em>
            </span>
          </h1>

          <p className="hero__lede lede" data-reveal="up" style={{ ['--reveal-delay' as string]: '280ms' }}>
            We transform complex ideas into compelling visual experiences through animation and motion
            design.
          </p>

          <div className="hero__actions" data-reveal="up" style={{ ['--reveal-delay' as string]: '360ms' }}>
            <Link to="/portfolio" className="btn btn--primary">
              Explore Our Work
              <span className="btn__icon">
                <Icon name="arrow-right" size={17} />
              </span>
            </Link>
            <Link to="/contact" className="btn btn--ghost">
              Start a Project
            </Link>
          </div>

          <ul className="hero__disciplines" data-reveal="up" style={{ ['--reveal-delay' as string]: '440ms' }}>
            {DISCIPLINES.map((item) => (
              <li key={item}>
                <span className="hero__discipline-dot" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="hero__stage"
          ref={ref}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          aria-hidden="true"
        >
          <div className="hero__stage-inner">
            <div className="hero__orbit">
              <div className="hero__orbit-ring hero__orbit-ring--outer" />
              <div className="hero__orbit-ring hero__orbit-ring--inner" />
            </div>

            {/* Central dimensional object */}
            <div className="hero-cube">
              {['2D', '3D', 'MOTION', 'AI', 'MOTION', 'AI'].map((face, i) => (
                <span key={i} className={`hero-cube__face hero-cube__face--${i}`}>
                  <em>{face}</em>
                </span>
              ))}
            </div>

            {/* Floating storyboard frames + previews */}
            {STORYBOARD_FRAMES.map((frame, i) => (
              <div key={frame.label} className={`hero-float hero-float--${i + 1}`} data-depth={i + 1}>
                <div className="hero-float__frame">
                  <div className="hero-float__art">
                    <svg viewBox="0 0 160 100" preserveAspectRatio="none">
                      {frame.art === 'frames' && (
                        <>
                          <rect x="14" y="20" width="60" height="44" rx="4" fill="none" stroke="#FFD400" strokeWidth="2" />
                          <rect x="86" y="34" width="60" height="44" rx="4" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
                          <path d="M10 82h140" stroke="#ffffff" strokeWidth="1.5" opacity="0.28" />
                        </>
                      )}
                      {frame.art === 'char' && (
                        <>
                          <circle cx="80" cy="34" r="16" fill="#FFD400" opacity="0.9" />
                          <path d="M62 74c0-11 8-18 18-18s18 7 18 18" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.7" />
                          <path d="M24 20v60M136 20v60" stroke="#ffffff" strokeWidth="1.5" opacity="0.25" />
                        </>
                      )}
                      {frame.art === 'camera' && (
                        <>
                          <rect x="40" y="30" width="52" height="40" rx="6" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
                          <path d="M92 42l26-10v34l-26-10z" fill="#FFD400" opacity="0.9" />
                          <path d="M14 84h132" stroke="#ffffff" strokeWidth="1.5" opacity="0.25" />
                        </>
                      )}
                    </svg>
                  </div>
                  <span className="hero-float__label">{frame.label}</span>
                </div>
              </div>
            ))}

            <div className="hero-panel hero-panel--render" data-depth="2">
              <span className="hero-panel__tag">Render</span>
              <div className="hero-panel__bars">
                {[38, 62, 48, 84, 56].map((h, i) => (
                  <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.14}s` }} />
                ))}
              </div>
            </div>

            <div className="hero-panel hero-panel--timeline" data-depth="3">
              <span className="hero-panel__tag">Timeline</span>
              <div className="hero-panel__track">
                <span className="hero-panel__playhead" />
                {Array.from({ length: 14 }, (_, i) => (
                  <i key={i} style={{ opacity: 0.25 + ((i * 7) % 10) / 14 }} />
                ))}
              </div>
            </div>

            <div className="hero-chip hero-chip--a" data-depth="1">
              <Icon name="layers" size={14} /> Storyboard
            </div>
            <div className="hero-chip hero-chip--b" data-depth="3">
              <Icon name="cube" size={14} /> Look dev
            </div>
            <div className="hero-chip hero-chip--c" data-depth="2">
              <Icon name="chart" size={14} /> Data motion
            </div>
          </div>
        </div>
      </div>

      <div className="hero__scroll-cue" aria-hidden="true">
        <span className="mono">Scroll</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  )
}

export default Hero
