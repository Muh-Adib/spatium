'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ExternalLink, PenLine } from 'lucide-react'
import { Button, FOCUS_RING } from '../blocks/ui'
import { StatusBadge } from '../pages/shared'

/** `?tab=…&…` helpers: the open editor lives in the URL so back/forward and links work. */
export function useAdminParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const get = useCallback((key: string) => searchParams?.get(key) ?? null, [searchParams])
  const set = useCallback(
    (changes: Record<string, string | null>, mode: 'push' | 'replace' = 'push') => {
      const next = new URLSearchParams(searchParams?.toString() ?? '')
      for (const [k, v] of Object.entries(changes)) {
        if (v === null) next.delete(k)
        else next.set(k, v)
      }
      const url = `${pathname}?${next.toString()}`
      if (mode === 'replace') router.replace(url, { scroll: false })
      else router.push(url, { scroll: false })
    },
    [router, pathname, searchParams],
  )
  return { get, set }
}

export const editButtonId = (kind: string, id: number) => `edit-${kind}-${id}`

/**
 * Returns focus to the row's Edit button when the editor closes (or to the
 * list heading when the row is gone, e.g. after a delete).
 */
export function useReturnFocus(editorOpen: boolean, fallback: React.RefObject<HTMLElement | null>) {
  const target = useRef<string | null>(null)
  const wasOpen = useRef(editorOpen)
  useEffect(() => {
    if (wasOpen.current && !editorOpen) {
      const id = target.current
      target.current = null
      requestAnimationFrame(() => {
        const el = id ? document.getElementById(id) : null
        ;(el ?? fallback.current)?.focus()
      })
    }
    wasOpen.current = editorOpen
  }, [editorOpen, fallback])
  return (id: string) => {
    target.current = id
  }
}

type CardProps = {
  kind: string
  id: number
  title: string
  status: unknown
  path: string | null
  /** Public URL, only when the page is live. */
  liveHref: string | null
  description?: string
  meta?: React.ReactNode
  image?: string | null
  canEdit: boolean
  onEdit: () => void
}

/** One list row: title, status (icon + text), path, named actions. No hover-only controls. */
export function EntityCard({ kind, id, title, status, path, liveHref, description, meta, image, canEdit, onEdit }: CardProps) {
  const name = title || 'Tanpa judul'
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/10 bg-surface-elevated p-3 sm:p-4">
      {image !== undefined ? (
        <div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {image ? (
            // Plain <img>: arbitrary stored URL; decorative next to the visible title.
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-neutral-300">Belum ada gambar sampul</span>
          )}
        </div>
      ) : null}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold text-white [overflow-wrap:anywhere]">{name}</h3>
          <StatusBadge status={typeof status === 'string' ? status : null} />
        </div>
        {path ? <p className="font-mono text-xs text-neutral-300 [overflow-wrap:anywhere]">{path}</p> : null}
        {description ? <p className="line-clamp-2 text-sm text-neutral-300">{description}</p> : null}
        {meta ? <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-300">{meta}</div> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        {canEdit ? (
          <Button id={editButtonId(kind, id)} size="sm" icon={PenLine} onClick={onEdit}>
            Edit<span className="sr-only"> {name}</span>
          </Button>
        ) : null}
        {liveHref ? (
          <a
            href={liveHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-neutral-200 underline-offset-2 hover:bg-white/[0.08] hover:text-white hover:underline ${FOCUS_RING}`}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Lihat<span className="sr-only"> {name}</span> di situs<span className="sr-only"> (tab baru)</span>
          </a>
        ) : null}
      </div>
    </li>
  )
}

export function ListState({ loading, error, onRetry, empty, children }: { loading: boolean; error: string | null; onRetry: () => void; empty: string | null; children: React.ReactNode }) {
  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
        <span className="min-w-0 flex-1">Daftar gagal dimuat: {error}</span>
        <Button size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      </div>
    )
  }
  if (loading) {
    return (
      <p role="status" aria-busy="true" className="rounded-xl border border-white/10 p-6 text-sm text-neutral-300">
        Memuat daftar…
      </p>
    )
  }
  if (empty) return <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-neutral-300">{empty}</p>
  return <>{children}</>
}
