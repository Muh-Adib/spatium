'use client'

import React, { Component, memo, useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { getBlockEntry } from '@/lib/blocks/catalog'
import type { EditorBlock } from './model'

/** Narrowest layout width used for the scaled desktop preview. */
const MIN_DESIGN_WIDTH = 1024

export type ContextData = { portfolios?: unknown[]; subServices?: unknown[]; services?: unknown[] }

type BoundaryProps = { label: string; resetKey: unknown; children: React.ReactNode }

class BlockErrorBoundary extends Component<BoundaryProps, { error: string | null }> {
  state = { error: null as string | null }
  componentDidUpdate(prev: BoundaryProps) {
    // Editing the block gives the renderer another chance.
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message : 'Kesalahan tidak dikenal.' }
  }
  componentDidCatch(err: unknown) {
    console.warn('[block-preview] block failed to render:', err)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="m-4 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {this.props.label} belum bisa ditampilkan: {this.state.error}
          </span>
        </div>
      )
    }
    return this.props.children
  }
}

const PreviewBlock = memo(function PreviewBlock({
  block,
  index,
  selected,
  onSelect,
  contextData,
}: {
  block: EditorBlock
  index: number
  selected: boolean
  onSelect?: (id: string) => void
  contextData?: ContextData
}) {
  const label = `Blok ${index + 1}: ${getBlockEntry(block.type)?.label ?? block.type}`
  return (
    <div data-preview-block={block.id} className="group relative [display:flow-root]">
      {/* Rendered content is inert: its links and buttons must not navigate or take focus inside the editor. */}
      <div inert className="[display:flow-root]">
        <BlockErrorBoundary resetKey={block} label={label}>
          <BlockRenderer blocks={[block]} contextData={contextData} />
        </BlockErrorBoundary>
      </div>
      {onSelect ? (
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Pilih ${label}`}
        aria-pressed={selected}
        onClick={() => onSelect(block.id)}
        className={`absolute inset-0 z-[5] cursor-pointer outline-none ${
          selected ? 'ring-4 ring-inset ring-accent-400' : 'hover:ring-2 hover:ring-inset hover:ring-white/40'
        }`}
      >
        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-1 font-sans text-xs font-medium ${
            selected ? 'bg-accent-500 text-accent-950' : 'bg-black/80 text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          {label}
        </span>
      </button>
      ) : null}
    </div>
  )
})

type Props = {
  blocks: readonly EditorBlock[]
  selectedId: string | null
  /** Omit for a read-only preview (no selection overlay). */
  onSelect?: (id: string) => void
  contextData?: ContextData
  /** Scroll the selected block into view when it was selected elsewhere (outline). */
  scrollToSelected: boolean
}

/**
 * Live preview with the real BlockRenderer. Desktop is laid out at 1280px and
 * zoomed to fit the pane, so it matches the public site; clicking a block
 * selects it in the outline.
 */
export function BlockPreview({ blocks, selectedId, onSelect, contextData, scrollToSelected }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  // Blocks size type with viewport units and breakpoints, so the preview is laid
  // out at the real viewport width and zoomed to fit the pane.
  const [scale, setScale] = useState<{ width: number; zoom: number } | null>(null)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth
      const designWidth = Math.max(window.innerWidth, MIN_DESIGN_WIDTH)
      const desktop = window.matchMedia('(min-width: 1024px)').matches
      setScale(desktop && width > 0 && width < designWidth ? { width: designWidth, zoom: width / designWidth } : null)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Reveal a block selected in the outline once it exists in the (deferred) preview.
  const pendingScroll = useRef<string | null>(null)
  useEffect(() => {
    pendingScroll.current = selectedId && scrollToSelected ? selectedId : null
  }, [selectedId, scrollToSelected])
  useEffect(() => {
    const id = pendingScroll.current
    if (!id) return
    const el = frameRef.current?.querySelector(`[data-preview-block="${CSS.escape(id)}"]`)
    if (!el) return
    pendingScroll.current = null
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  })

  return (
    <div ref={frameRef} className="w-full">
      {blocks.length === 0 ? (
        <p className="m-6 rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-300">
          Pratinjau muncul di sini setelah Anda menambahkan blok.
        </p>
      ) : (
        <div style={scale ? { width: scale.width, zoom: scale.zoom } : undefined} className="bg-[var(--color-background,#030611)] text-white">
          {blocks.map((block, index) => (
            <PreviewBlock key={block.id} block={block} index={index} selected={block.id === selectedId} onSelect={onSelect} contextData={contextData} />
          ))}
        </div>
      )}
    </div>
  )
}
