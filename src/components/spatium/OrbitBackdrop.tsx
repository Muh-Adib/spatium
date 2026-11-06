/**
 * Orbit lines + planetary horizon glow — the recurring backdrop of the
 * SPATIUM product deck (title, chapter and closing slides). Pure SVG/CSS.
 */
export function OrbitBackdrop({ variant = 'hero' }: { variant?: 'hero' | 'band' | 'closing' }) {
  return (
    <div className={`sp-orbit sp-orbit--${variant}`} aria-hidden="true">
      <svg className="sp-orbit__svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`sp-orbit-a-${variant}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7fb2ff" stopOpacity="0" />
            <stop offset="0.35" stopColor="#7fb2ff" stopOpacity="0.85" />
            <stop offset="0.7" stopColor="#3b7bff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#3b7bff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`sp-orbit-b-${variant}`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#9cc3ff" stopOpacity="0" />
            <stop offset="0.4" stopColor="#9cc3ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3b7bff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`sp-star-${variant}`}>
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.25" stopColor="#bcd6ff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#3b7bff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          className="sp-orbit__ring sp-orbit__ring--a"
          cx="820"
          cy="420"
          rx="900"
          ry="300"
          transform="rotate(-14 820 420)"
          fill="none"
          stroke={`url(#sp-orbit-a-${variant})`}
          strokeWidth="1.6"
        />
        <ellipse
          className="sp-orbit__ring sp-orbit__ring--b"
          cx="980"
          cy="360"
          rx="760"
          ry="210"
          transform="rotate(-20 980 360)"
          fill="none"
          stroke={`url(#sp-orbit-b-${variant})`}
          strokeWidth="1"
        />
        <circle className="sp-orbit__star" cx="1390" cy="150" r="22" fill={`url(#sp-star-${variant})`} />
        <circle className="sp-orbit__star sp-orbit__star--b" cx="150" cy="250" r="16" fill={`url(#sp-star-${variant})`} />
      </svg>
      <div className="sp-orbit__horizon" />
    </div>
  )
}
