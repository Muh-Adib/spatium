'use client'

import React, { useMemo, useState } from 'react'
import { ExternalLink, FileText, Plus, RefreshCw, Search } from 'lucide-react'
import { PAGE_STATUSES, type PageStatus } from '@/lib/pages/page-schema'
import { Button, FOCUS_RING, inputClass } from '../blocks/ui'
import type { ApiFailure, PageSummaryDto } from './client'
import { DateTime, STATUS_META, StatusBadge } from './shared'

type Props = {
  pages: PageSummaryDto[] | null
  failure: ApiFailure | null
  onRetry: () => void
  onCreate: () => void
  onOpen: (id: number) => void
}

export function PagesList({ pages, failure, onRetry, onCreate, onOpen }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<PageStatus | 'all'>('all')

  const filtered = useMemo(() => {
    if (!pages) return []
    const q = query.trim().toLowerCase()
    return pages.filter(
      (p) => (status === 'all' || p.status === status) && (!q || p.title.toLowerCase().includes(q) || p.slug.includes(q)),
    )
  }, [pages, query, status])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of pages ?? []) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [pages])

  const loading = pages === null && !failure
  const empty = pages !== null && pages.length === 0
  const filtering = query.trim() !== '' || status !== 'all'

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-prose space-y-1">
          <h2 className="font-heading text-lg font-semibold text-white">Halaman</h2>
          <p className="text-sm text-neutral-300">
            Halaman dinamis di <span className="font-mono">/&lt;slug&gt;</span>, disusun dari blok. Draf tidak tampil di situs sampai diterbitkan.
          </p>
        </div>
        {/* When the list is empty, the empty state carries the single primary action. */}
        {empty ? null : (
          <Button variant="primary" icon={Plus} onClick={onCreate}>
            Buat halaman
          </Button>
        )}
      </header>

      {!empty && !failure ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-[2.35rem] h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <label htmlFor="pages-search" className="mb-1 block text-xs text-neutral-300">
              Cari judul atau slug
            </label>
            <input id="pages-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={inputClass(false, 'h-10 pl-9')} />
          </div>
          <div className="min-w-[12rem]">
            <label htmlFor="pages-status" className="mb-1 block text-xs text-neutral-300">
              Status
            </label>
            <select id="pages-status" value={status} onChange={(e) => setStatus(e.target.value as PageStatus | 'all')} className={inputClass(false, 'h-10')}>
              <option value="all">Semua status ({pages?.length ?? 0})</option>
              {PAGE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label} ({counts[s] ?? 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div aria-busy={loading}>
        {failure ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
            <span>Daftar halaman gagal dimuat: {failure.error}</span>
            <Button size="sm" icon={RefreshCw} onClick={onRetry}>
              Coba lagi
            </Button>
          </div>
        ) : loading ? (
          <p className="rounded-xl border border-white/10 p-6 text-sm text-neutral-300">Memuat halaman…</p>
        ) : empty ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
            <h3 className="mt-3 text-base font-semibold text-white">Belum ada halaman</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-300">
              Buat halaman kampanye, landing page, atau halaman informasi. Mulai dari judul; slug dibuat otomatis.
            </p>
            <Button variant="primary" icon={Plus} className="mt-4" onClick={onCreate}>
              Buat halaman pertama
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-neutral-300">
            <p>Tidak ada halaman yang cocok dengan filter.</p>
            {filtering ? (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                }}
              >
                Hapus filter
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p role="status" className="mb-2 text-xs text-neutral-400">
              {filtered.length} dari {pages?.length ?? 0} halaman
            </p>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated">
              {filtered.map((page) => (
                <li key={page.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-[12rem] flex-1">
                    <button
                      type="button"
                      onClick={() => onOpen(page.id)}
                      className={`rounded text-left text-sm font-semibold text-white underline-offset-4 hover:underline [overflow-wrap:anywhere] ${FOCUS_RING}`}
                    >
                      {page.title}
                    </button>
                    <p className="mt-0.5 font-mono text-xs text-neutral-400 [overflow-wrap:anywhere]">/{page.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-300">
                    <StatusBadge status={page.status} />
                    <span>{page.blockCount} blok</span>
                    <span>
                      Diperbarui <DateTime iso={page.updatedAt} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.status === 'published' ? (
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-neutral-200 hover:bg-white/[0.08] ${FOCUS_RING}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        Lihat<span className="sr-only"> {page.title} (tab baru)</span>
                      </a>
                    ) : null}
                    <Button size="sm" onClick={() => onOpen(page.id)} aria-label={`Edit ${page.title}`}>
                      Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
