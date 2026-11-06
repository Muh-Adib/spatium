'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import type { ServiceVisual as VisualKind } from '@/lib/content/spatium-types'
import './service-visual.css'

/**
 * Spatial before/after viewer built from product-deck stills: drag to reveal how
 * the same real place reads as raw data versus the finished spatial output.
 */
type Pair = {
  /** The stills already carry the deck's own captions — skip overlay tags. */
  captioned?: boolean
  before: { src: string; alt: string; label: string }
  after: { src: string; alt: string; label: string }
}

const PAIRS: Record<VisualKind, Pair> = {
  filmmaking: {
    captioned: true,
    before: { src: '/images/spatium/web/film-pointcloud.webp', alt: 'Raw point cloud sebuah gang permukiman', label: 'Point cloud' },
    after: { src: '/images/spatium/web/film-previz.webp', alt: 'Pre-visualization dari lokasi yang sama', label: 'Pre-visualization' },
  },
  marketing: {
    before: { src: '/images/spatium/web/mkt-map.webp', alt: '3D map restoran dengan hotspot', label: '3D map' },
    after: { src: '/images/spatium/web/mkt-exterior.webp', alt: 'Eksterior restoran dalam spatial tour', label: 'Spatial tour' },
  },
  entertainment: {
    before: { src: '/images/spatium/web/hub.webp', alt: 'Digital twin venue sebagai fondasi spasial', label: 'Digital twin' },
    after: { src: '/images/spatium/web/uc-entertainment.webp', alt: 'Instalasi imersif di venue', label: 'Experience' },
  },
  memory: {
    before: { src: '/images/spatium/web/wed-dollhouse.webp', alt: 'Denah 3D venue pernikahan', label: '3D map' },
    after: { src: '/images/spatium/web/wed-altar.webp', alt: 'Altar pernikahan dalam pengalaman spasial', label: 'Venue' },
  },
  '3d': {
    before: { src: '/images/spatium/web/pipe-02-pointcloud.webp', alt: 'Rumah sebagai point cloud', label: 'Point cloud' },
    after: { src: '/images/spatium/web/pipe-04-splat.webp', alt: 'Rumah yang sama sebagai 3D Gaussian Splat', label: '3D Gaussian Splat' },
  },
  '2d': {
    before: { src: '/images/spatium/web/way-photograph.webp', alt: 'Foto dua dimensi sebuah rumah', label: 'Photograph' },
    after: { src: '/images/spatium/web/way-digitaltwin.webp', alt: 'Digital twin rumah yang sama', label: 'Digital twin' },
  },
  motion: {
    before: { src: '/images/spatium/web/way-videograph.webp', alt: 'Rekaman video sebuah rumah', label: 'Videograph' },
    after: { src: '/images/spatium/web/way-digitaltwin.webp', alt: 'Digital twin rumah yang sama', label: 'Digital twin' },
  },
  assets: {
    before: { src: '/images/spatium/web/pipe-03-geometry.webp', alt: 'Mesh 3D hasil olahan point cloud', label: '3D geometry' },
    after: { src: '/images/spatium/web/pipe-04-splat.webp', alt: '3D Gaussian Splat fotorealistis', label: '3D Gaussian Splat' },
  },
}

export function ServiceVisual({ kind }: { kind: VisualKind }) {
  const pair = PAIRS[kind] ?? PAIRS['3d']
  const [pos, setPos] = useState(52)
  const id = useId()

  return (
    <figure className="svx" style={{ ['--pos' as string]: `${pos}%` }}>
      <div className="svx__stage">
        <Image src={pair.after.src} alt={pair.after.alt} fill sizes="(max-width: 900px) 100vw, 50vw" className="svx__img" />
        <div className="svx__before" aria-hidden="true">
          <Image src={pair.before.src} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" className="svx__img" />
        </div>
        <span className="svx__handle" aria-hidden="true">
          <span />
        </span>
        {pair.captioned ? null : (
          <>
            <span className="svx__tag svx__tag--l">{pair.before.label}</span>
            <span className="svx__tag svx__tag--r">{pair.after.label}</span>
          </>
        )}
        <label htmlFor={id} className="sr-only">
          Geser untuk membandingkan {pair.before.label} dan {pair.after.label}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="svx__range"
        />
      </div>
      <figcaption className="svx__cap">
        <span>{pair.before.label}</span>
        <span className="svx__arrow" aria-hidden="true">
          →
        </span>
        <span>{pair.after.label}</span>
      </figcaption>
    </figure>
  )
}

export default ServiceVisual
