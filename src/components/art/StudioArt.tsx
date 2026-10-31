import type { ReactNode } from 'react'
import './studio-art.css'

/**
 * Original, self-contained studio artwork rendered as inline SVG.
 *
 * These compositions are generated in-house — no external image requests, no
 * third-party assets, nothing that can 404. They act as clearly identifiable
 * placeholders until genuine project media is supplied, at which point a
 * `posterUrl` on the project replaces them.
 */

type Motif = (accent: string) => ReactNode

const GRID = (
  <g opacity="0.16" stroke="#ffffff" strokeWidth="1">
    {Array.from({ length: 9 }, (_, i) => (
      <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={600} />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`h${i}`} x1={0} y1={i * 100} x2={800} y2={i * 100} />
    ))}
  </g>
)

const MOTIFS: Motif[] = [
  // 0 — concentric arcs
  (a) => (
    <g fill="none" strokeLinecap="round">
      {[220, 168, 116, 64].map((r, i) => (
        <path
          key={r}
          d={`M ${400 - r} 300 A ${r} ${r} 0 0 1 ${400 + r} 300`}
          stroke={i === 0 ? '#ffffff' : a}
          strokeWidth={i === 0 ? 2 : 6}
          opacity={1 - i * 0.16}
        />
      ))}
      <circle cx="400" cy="300" r="20" fill={a} />
    </g>
  ),
  // 1 — stacked editorial panels
  (a) => (
    <g>
      <rect x="120" y="120" width="220" height="300" rx="14" fill="#ffffff" opacity="0.1" />
      <rect x="180" y="160" width="220" height="300" rx="14" fill="#ffffff" opacity="0.16" />
      <rect x="240" y="200" width="220" height="300" rx="14" fill={a} opacity="0.9" />
      <rect x="270" y="236" width="120" height="10" rx="5" fill="#0A1730" opacity="0.55" />
      <rect x="270" y="262" width="160" height="10" rx="5" fill="#0A1730" opacity="0.35" />
      <circle cx="350" cy="420" r="44" fill="none" stroke="#0A1730" strokeWidth="4" opacity="0.5" />
    </g>
  ),
  // 2 — character study blocks
  (a) => (
    <g>
      <rect x="290" y="120" width="220" height="220" rx="110" fill="#ffffff" opacity="0.12" />
      <circle cx="400" cy="210" r="62" fill={a} />
      <path d="M362 210a38 38 0 0 1 76 0" stroke="#0A1730" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="300" y="360" width="200" height="130" rx="26" fill="#ffffff" opacity="0.18" />
      <path d="M300 420h200" stroke={a} strokeWidth="6" strokeLinecap="round" opacity="0.8" />
    </g>
  ),
  // 3 — frame strip
  (a) => (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={90 + i * 160}
          y={190 + (i % 2) * 40}
          width="120"
          height="180"
          rx="10"
          fill={i === 2 ? a : '#ffffff'}
          opacity={i === 2 ? 0.95 : 0.14}
        />
      ))}
      <path d="M110 300h620" stroke={a} strokeWidth="2" strokeDasharray="8 10" opacity="0.7" />
    </g>
  ),
  // 4 — isometric wireframe
  (a) => (
    <g fill="none" stroke={a} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M400 130 620 240 400 350 180 240Z" />
      <path d="M180 240v150L400 500V350" />
      <path d="M620 240v150L400 500" />
      <path d="M400 130v220" opacity="0.4" />
      <path d="M180 240 400 350 620 240" opacity="0.55" />
      <circle cx="400" cy="240" r="9" fill={a} stroke="none" />
    </g>
  ),
  // 5 — turbine / process rings
  (a) => (
    <g transform="translate(400 300)">
      <circle r="185" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.25" />
      <circle r="125" fill="none" stroke={a} strokeWidth="3" opacity="0.8" />
      {Array.from({ length: 10 }, (_, i) => (
        <line
          key={i}
          x1="0"
          y1="-125"
          x2="0"
          y2="-185"
          stroke="#ffffff"
          strokeWidth="3"
          opacity="0.3"
          transform={`rotate(${i * 36})`}
        />
      ))}
      <circle r="42" fill={a} />
      <circle r="18" fill="#0A1730" />
    </g>
  ),
  // 6 — architectural planes
  (a) => (
    <g>
      <path d="M400 100 700 250 400 400 100 250Z" fill="#ffffff" opacity="0.1" />
      <path d="M400 250 700 400 400 550 100 400Z" fill={a} opacity="0.85" />
      <path d="M400 250 400 550" stroke="#0A1730" strokeWidth="3" opacity="0.4" />
      <path d="M250 325 550 475" stroke="#0A1730" strokeWidth="3" opacity="0.25" />
      <path d="M550 325 250 475" stroke="#0A1730" strokeWidth="3" opacity="0.25" />
    </g>
  ),
  // 7 — kinetic type bars
  (a) => (
    <g>
      {[
        [140, 60, 240],
        [140, 130, 380],
        [140, 200, 300],
        [140, 270, 460],
        [140, 340, 210],
      ].map(([x, y, w], i) => (
        <rect key={i} x={x} y={y} width={w} height="38" rx="8" fill={i % 2 ? '#ffffff' : a} opacity={i % 2 ? 0.16 : 0.92} />
      ))}
      <rect x="140" y="410" width="120" height="38" rx="8" fill={a} opacity="0.5" />
    </g>
  ),
  // 8 — data chart
  (a) => (
    <g>
      <path d="M120 470h580" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
      {[130, 210, 300, 180, 380, 260].map((h, i) => (
        <rect
          key={i}
          x={150 + i * 92}
          y={470 - h}
          width="54"
          height={h}
          rx="8"
          fill={i === 4 ? a : '#ffffff'}
          opacity={i === 4 ? 0.95 : 0.16}
        />
      ))}
      <path
        d="M177 300 269 250 361 210 453 300 545 150 637 210"
        fill="none"
        stroke={a}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  ),
  // 9 — ident mark
  (a) => (
    <g transform="translate(400 300)">
      <circle r="170" fill="none" stroke={a} strokeWidth="2" strokeDasharray="6 12" opacity="0.7" />
      <circle r="120" fill={a} opacity="0.14" />
      <path d="M-52 -46v92h22V18c0 16 8 26 22 26s22-10 22-26v-46h-22v44c0 10-5 16-13 16s-13-6-13-16v-44Z" fill="#ffffff" />
      <circle r="170" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.2" strokeDasharray="2 8" transform="rotate(20)" />
    </g>
  ),
  // 10 — product device
  (a) => (
    <g>
      <rect x="250" y="130" width="300" height="340" rx="34" fill="#ffffff" opacity="0.12" />
      <rect x="278" y="158" width="244" height="284" rx="22" fill={a} opacity="0.9" />
      <rect x="300" y="190" width="150" height="14" rx="7" fill="#0A1730" opacity="0.55" />
      <rect x="300" y="222" width="110" height="12" rx="6" fill="#0A1730" opacity="0.35" />
      <circle cx="400" cy="370" r="42" fill="#0A1730" opacity="0.65" />
      <path d="M388 352l34 18-34 18z" fill={a} />
    </g>
  ),
  // 11 — particle field
  (a) => (
    <g>
      {Array.from({ length: 42 }, (_, i) => {
        const c = i % 9
        const r0 = Math.floor(i / 9)
        const cx = 110 + c * 76 + (r0 % 2) * 22
        const cy = 130 + r0 * 84
        const big = i % 7 === 0
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={big ? 11 : 5}
            fill={big ? a : '#ffffff'}
            opacity={big ? 0.95 : 0.3}
          />
        )
      })}
      <path d="M110 130h600v420H110z" fill="none" stroke={a} strokeWidth="1.5" opacity="0.35" />
    </g>
  ),
  // 12 — terrain / landscape data
  (a) => (
    <g fill="none" strokeLinecap="round">
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M80 ${380 + i * 26} q 100 ${-52 - i * 10} 200 0 t 200 0 t 200 0`}
          stroke={i === 2 ? a : '#ffffff'}
          strokeWidth={i === 2 ? 4 : 2}
          opacity={i === 2 ? 0.95 : 0.22}
        />
      ))}
      <circle cx="620" cy="180" r="46" fill={a} opacity="0.9" stroke="none" />
    </g>
  ),
]

const ACCENTS = ['#FFD600', '#7FB2FF', '#8FF0C4', '#FFD600', '#FFE566', '#7FB2FF']

type StudioArtProps = {
  variant?: number
  /** Optional label rendered in the corner, e.g. a discipline tag. */
  caption?: string
  className?: string
}

export function StudioArt({ variant = 0, caption, className }: StudioArtProps) {
  const numVariant = typeof variant === 'number' && !Number.isNaN(variant) ? variant : 0
  const index = Math.abs(numVariant) % MOTIFS.length
  const accent = ACCENTS[Math.abs(numVariant) % ACCENTS.length]
  const motif = MOTIFS[index] || MOTIFS[0]

  return (
    <div className={`studio-art${className ? ` ${className}` : ''}`}>
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label={caption ? `Abstract studio artwork: ${caption}` : 'Abstract studio artwork'}>
        <defs>
          <linearGradient id={`sa-bg-${index}-${variant}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0A1730" />
            <stop offset="60%" stopColor="#081428" />
            <stop offset="100%" stopColor="#04091A" />
          </linearGradient>
          <radialGradient id={`sa-glow-${index}-${variant}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="600" fill={`url(#sa-bg-${index}-${variant})`} />
        {GRID}
        <rect width="800" height="600" fill={`url(#sa-glow-${index}-${variant})`} />
        {motif(accent)}
        <g className="studio-art__corner" opacity="0.5">
          <path d="M40 40h56M40 40v56" stroke="#ffffff" strokeWidth="2" />
          <path d="M760 560h-56M760 560v-56" stroke="#ffffff" strokeWidth="2" />
        </g>
      </svg>
      {caption ? <span className="studio-art__caption mono">{caption}</span> : null}
    </div>
  )
}

export default StudioArt
