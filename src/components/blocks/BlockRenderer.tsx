import React from 'react'
import { getBlockRenderer, type BlockRenderContext } from '@/blocks/renderers'
import { getAnimationClasses } from '@/lib/blocks/animation'

interface BlockRendererProps {
  blocks?: any[]
  contextData?: BlockRenderContext
}

/**
 * AnimatedBlockWrapper wraps rendered blocks with animation transitions,
 * specular ambient chromatic glow, and responsive spacing.
 */
function AnimatedBlockWrapper({ block, children }: { block: any; children: React.ReactNode }) {
  const anim = block?.animation || block?.settings?.animation
  const { containerClasses, glowBackdrop, paddingClasses } = getAnimationClasses(anim)

  return (
    <div
      data-block-id={block?.id}
      data-block-type={block?.type}
      className={`relative w-full ${containerClasses} ${paddingClasses ? '' : ''}`}
    >
      {glowBackdrop && (
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
          <div className="w-[700px] h-[380px] rounded-full bg-gradient-to-r from-accent/[0.08] via-[#0F3A79]/[0.1] to-accent/[0.08] blur-[150px] animate-pulse pointer-events-none" />
        </div>
      )}
      {children}
    </div>
  )
}

function renderBlockContent(block: any, contextData?: BlockRenderContext) {
  if (!block) return null
  const render = getBlockRenderer(block.type || block.__component)
  return render ? render(block, contextData) : null
}

/**
 * Renders a stored block list (public pages and the Studio preview). Each
 * block's renderer comes from the registry in `src/blocks/renderers.tsx`;
 * unknown types render nothing.
 */
export function BlockRenderer({ blocks, contextData }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="flex flex-col">
      {blocks.map((block, idx) => {
        if (!block) return null
        try {
          const content = renderBlockContent(block, contextData)
          if (!content) return null

          return (
            <AnimatedBlockWrapper key={block.id || idx} block={block}>
              {content}
            </AnimatedBlockWrapper>
          )
        } catch (err) {
          console.error(`Error rendering block ${block?.type || idx}:`, err)
          return (
            <div key={block.id || idx} className="p-4 m-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono">
              Gagal merender blok: <strong>{block?.type || 'unknown'}</strong>. Harap periksa skema data blok.
            </div>
          )
        }
      })}
    </div>
  )
}
