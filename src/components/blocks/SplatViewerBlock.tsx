'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import './splat-viewer-block.css'

export type SplatViewerBlockData = {
  splatId: string
  title?: string
  caption?: string
  posterUrl?: string
  posterAlt?: string
  autoLoad?: boolean
}

const SCENE_ID = /^[a-zA-Z0-9_-]{4,64}$/

/**
 * Embeds a SuperSplat 3D Gaussian Splat scene. The iframe URL is built from a
 * validated scene id (never from free-form input) and loads only on request,
 * so a page with several scenes stays light until the visitor opts in.
 */
export function SplatViewerBlock({ block }: { block: SplatViewerBlockData }) {
  const [live, setLive] = useState(Boolean(block.autoLoad))
  const titleId = useId()
  if (!SCENE_ID.test(block.splatId)) return null

  const embedUrl = `https://superspl.at/s?id=${block.splatId}`
  const sceneUrl = `https://superspl.at/scene/${block.splatId}`
  const label = block.title || 'Scene 3D Gaussian Splat'

  return (
    <section className="svb" aria-labelledby={block.title ? titleId : undefined} aria-label={block.title ? undefined : label}>
      <div className="svb__inner">
        {block.title ? (
          <h2 id={titleId} className="svb__title">
            {block.title}
          </h2>
        ) : null}
        <div className="svb__frame">
          {live ? (
            <iframe
              src={embedUrl}
              title={`${label} — viewer 3D interaktif`}
              allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
              allowFullScreen
              className="svb__iframe"
            />
          ) : (
            <div className="svb__poster">
              {block.posterUrl ? (
                <Image src={block.posterUrl} alt={block.posterAlt ?? ''} fill sizes="(max-width: 1200px) 100vw, 1200px" className="svb__img" />
              ) : (
                <span className="svb__splats" aria-hidden="true" />
              )}
              <button type="button" className="svb__play" onClick={() => setLive(true)}>
                <span className="svb__ring" aria-hidden="true" />
                <span>Jelajahi scene 3D</span>
                <small>Drag untuk memutar · scroll untuk zoom</small>
              </button>
            </div>
          )}
        </div>
        <div className="svb__meta">
          {block.caption ? <p className="svb__caption">{block.caption}</p> : <span />}
          <a className="svb__link" href={sceneUrl} target="_blank" rel="noopener noreferrer">
            Buka di SuperSplat <span aria-hidden="true">↗</span>
            <span className="sr-only">(tab baru)</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default SplatViewerBlock
