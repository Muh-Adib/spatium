'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Monitor, RotateCcw, Smartphone, Tablet } from 'lucide-react'
import { PREVIEW_MESSAGES, previewAppliedMessageSchema, previewSelectMessageSchema } from '@/lib/content/entity-preview-model'
import type { BlockIssue } from '@/lib/blocks/catalog'
import { IconButton } from '../blocks/ui'
import { buildPreviewDraftMessage, previewPath, type EntityForm, type EntityRow } from './model'

export type PreviewReport = {
  blockIssues: BlockIssue[]
  fieldIssues: { field: string; message: string }[]
  blockCount: number
}

const WIDTHS = [
  { id: 'desktop', label: 'Desktop', width: 1280, icon: Monitor },
  { id: 'tablet', label: 'Tablet', width: 768, icon: Tablet },
  { id: 'mobile', label: 'Seluler', width: 390, icon: Smartphone },
] as const
type WidthId = (typeof WIDTHS)[number]['id']

const DEBOUNCE_MS = 150

type Props = {
  form: EntityForm
  row: EntityRow
  title: string
  selectedId: string | null
  onSelect: (blockId: string) => void
}

/**
 * Live preview = the public page. Embeds `/admin/preview/<entity>/<id>` (same
 * view component as the site) and streams the unsaved form + blocks into it
 * with the postMessage contract (docs/EDITORS.md). Clicking a block in the
 * preview selects it in the outline.
 */
export function PreviewFrame({ form, row, title, selectedId, onSelect }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  // Small screens start on the phone layout (the desktop one would be scaled to ~25%).
  const [widthId, setWidthId] = useState<WidthId>(() => (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop'))
  const [area, setArea] = useState<{ width: number; height: number } | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [report, setReport] = useState<PreviewReport | null>(null)

  // Messages from the preview iframe (same origin, from this iframe only).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return
      const data: unknown = event.data
      if (!data || typeof data !== 'object' || !('type' in data)) return
      if (data.type === PREVIEW_MESSAGES.ready) {
        setReady(true)
        return
      }
      const applied = previewAppliedMessageSchema.safeParse(data)
      if (applied.success) {
        setReport({ blockIssues: applied.data.blockIssues, fieldIssues: applied.data.fieldIssues, blockCount: applied.data.blockCount })
        return
      }
      const selected = previewSelectMessageSchema.safeParse(data)
      if (selected.success) onSelectRef.current(selected.data.blockId)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Stream the draft (debounced) once the iframe listens.
  useEffect(() => {
    if (!ready) return
    const handle = window.setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(buildPreviewDraftMessage(form, row, selectedId), window.location.origin)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [ready, form, row, selectedId])

  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const update = () => setArea({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const target = WIDTHS.find((w) => w.id === widthId) ?? WIDTHS[0]
  const zoom = area && area.width > 0 ? Math.min(1, area.width / target.width) : 1
  const frameWidth = zoom < 1 ? target.width : Math.min(target.width, area?.width ?? target.width)
  const frameHeight = area ? Math.max(area.height / zoom, 320) : 800

  return (
    <div className="flex h-full min-h-[70dvh] flex-col lg:min-h-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-1.5">
        <div role="group" aria-label="Lebar pratinjau" className="flex rounded-lg border border-white/15 p-0.5">
          {WIDTHS.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={widthId === w.id}
              onClick={() => setWidthId(w.id)}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs ${
                widthId === w.id ? 'bg-white/15 text-white' : 'text-neutral-300 hover:text-white'
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400`}
            >
              <w.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {w.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-300">{zoom < 1 ? `Skala ${Math.round(zoom * 100)}%` : 'Skala 100%'}</span>
        <span className="flex-1" />
        <IconButton
          icon={RotateCcw}
          size="sm"
          label="Muat ulang pratinjau"
          onClick={() => {
            setReady(false)
            setReport(null)
            setReloadKey((k) => k + 1)
          }}
        />
      </div>
      <PreviewStatus ready={ready} report={report} />
      <div ref={areaRef} className="relative min-h-0 flex-1 overflow-hidden bg-[#030611]">
        {!ready ? (
          <p className="absolute inset-x-0 top-6 z-10 text-center text-sm text-neutral-300" aria-hidden="true">
            Memuat pratinjau…
          </p>
        ) : null}
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={previewPath(form.kind, row.id)}
          title={`Pratinjau halaman ${title || 'tanpa judul'}`}
          style={{
            width: frameWidth,
            height: frameHeight,
            transform: zoom < 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'top left',
          }}
          className={`block border-0 bg-[#030611] ${zoom >= 1 ? 'mx-auto' : ''}`}
        />
      </div>
    </div>
  )
}

/** What the preview did with the last draft; skipped blocks/fields are listed (always announced politely). */
function PreviewStatus({ ready, report }: { ready: boolean; report: PreviewReport | null }) {
  const skipped = report ? report.blockIssues.length + report.fieldIssues.length : 0
  return (
    <div className={`border-b border-white/10 px-3 py-1.5 text-xs ${skipped ? 'bg-amber-500/10 text-amber-100' : 'text-neutral-300'}`}>
      <p role="status">
        {!ready
          ? 'Memuat pratinjau…'
          : !report
            ? 'Pratinjau versi tersimpan.'
            : skipped
              ? `Pratinjau perubahan belum disimpan · ${skipped} bagian dilewati:`
              : `Pratinjau perubahan belum disimpan · ${report.blockCount} blok.`}
      </p>
      {report && skipped ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {report.blockIssues.map((i) => (
            <li key={`b-${i.index}-${i.message}`} className="[overflow-wrap:anywhere]">
              Blok {i.index + 1}
              {i.type ? ` (${i.type})` : ''}: {i.message}
            </li>
          ))}
          {report.fieldIssues.map((i) => (
            <li key={`f-${i.field}-${i.message}`} className="[overflow-wrap:anywhere]">
              Kolom {i.field}: {i.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
