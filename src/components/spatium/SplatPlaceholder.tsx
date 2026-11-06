import './splat-placeholder.css'

/**
 * Honest stand-in for a scene without a verified still: a branded gaussian-splat
 * field labelled with the scene title, instead of unrelated illustration art.
 */
export function SplatPlaceholder({ label, seed = 0 }: { label?: string; seed?: number }) {
  return (
    <div className="splat-ph" style={{ ['--seed' as string]: seed % 6 }} aria-hidden="true">
      <span className="splat-ph__field" />
      <span className="splat-ph__horizon" />
      {label ? <span className="splat-ph__label">{label}</span> : null}
      <span className="splat-ph__badge">3DGS</span>
    </div>
  )
}
