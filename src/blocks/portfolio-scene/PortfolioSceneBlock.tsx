import { Reveal } from '@/components/ui/Reveal'
import { SplatPlaceholder } from '@/components/spatium/SplatPlaceholder'
import { GaussianSplatViewer } from '@/components/spatial/GaussianSplatViewer'
import { validateEmbedUrl } from '@/lib/media/embedValidator'
import type { EntityOf } from '../entity-context'
import type { PortfolioSceneBlockData } from './definition'
import '@/pages/project-detail.css'

const HEIGHT = { standard: 'h-[520px] md:h-[680px]', compact: 'h-[420px] md:h-[520px]' } as const

/**
 * The scene viewer. The iframe URL is built from the SuperSplat scene id in
 * `liveUrl`; any other liveUrl is used only when it passes the embed
 * allowlist (CSP `frame-src`). Without a scene: the poster, else the placeholder art.
 */
export function PortfolioSceneBlock({ block, entity }: { block: PortfolioSceneBlockData; entity: EntityOf<'portfolio'> }) {
  const view = entity.project
  const { pointCount, accuracy, splatId } = view
  const embedUrl = splatId
    ? `https://superspl.at/s?id=${splatId}`
    : view.liveUrl && validateEmbedUrl(view.liveUrl).isValid
      ? view.liveUrl
      : undefined
  return (
    <section className="section project-media" aria-label="Spatial Media Viewport">
      <div className="container container--wide">
        <Reveal className="project-media__frame" variant="scale">
          <div className="project-media__head flex items-center justify-between">
            <span className="mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              <span>{block.label || '3D Gaussian Splat Viewer'}</span>
            </span>
            {pointCount || accuracy ? (
              <span className="mono text-cyan-400">{[pointCount, accuracy].filter(Boolean).join(' · ')}</span>
            ) : null}
          </div>

          {embedUrl ? (
            <GaussianSplatViewer
              liveUrl={embedUrl}
              splatId={splatId}
              title={view.title}
              client={view.client}
              category={view.discipline}
              pointCount={pointCount}
              accuracy={accuracy}
              scenePairSlug={view.scenePairSlug}
              scenePairLabel={view.scenePairLabel}
              heightClass={HEIGHT[block.height ?? 'standard']}
            />
          ) : view.posterUrl ? (
            <div className="relative aspect-video w-full overflow-hidden bg-black/60 rounded-xl">
              <img src={view.posterUrl} alt={view.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="project-media__placeholder">
              <div className="relative w-full h-full aspect-video">
                <SplatPlaceholder seed={view.variant} label={view.title} />
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}
