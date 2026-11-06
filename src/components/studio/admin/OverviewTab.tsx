'use client'

import React from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, ArrowRightLeft, Boxes, Briefcase, CheckCircle2, FileText, Files, RefreshCw, Sparkles } from 'lucide-react'
import { TextButton } from '@/components/admin/AdminUi'
import { tabHref, type AdminTab } from '@/lib/admin/tabs'
import { formatCheckedAt, useSystemStatus, type ContentCounts } from './useSystemStatus'

const CARDS: { key: keyof ContentCounts; label: string; tab: AdminTab; icon: LucideIcon }[] = [
  { key: 'articles', label: 'Artikel', tab: 'articles', icon: FileText },
  { key: 'pages', label: 'Halaman', tab: 'pages', icon: Files },
  { key: 'portfolios', label: 'Portofolio', tab: 'portfolio', icon: Briefcase },
  { key: 'services', label: 'Layanan', tab: 'services', icon: Boxes },
  { key: 'solutions', label: 'Solusi', tab: 'solutions', icon: Sparkles },
  { key: 'redirects', label: 'Aturan redirect', tab: 'redirects', icon: ArrowRightLeft },
]

export default function OverviewTab() {
  const { state, checking, recheck } = useSystemStatus()
  const data = state.phase === 'ready' ? state.data : null
  const counts = data?.counts ?? null

  return (
    <div className="space-y-6">
      <section aria-labelledby="overview-db" className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 id="overview-db" className="text-sm font-semibold">
            Status database
          </h2>
          <p className="flex items-center gap-2 text-sm" role="status">
            {state.phase === 'loading' ? (
              <span className="text-neutral-300">Memeriksa koneksi…</span>
            ) : state.phase === 'error' ? (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                <span className="text-amber-100">{state.message}</span>
              </>
            ) : data?.online ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>
                  Terhubung ke {data.database}
                  {data.latency ? ` · respons ${data.latency}` : ''}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
                <span className="text-red-100">Tidak terhubung. {data?.message}</span>
              </>
            )}
          </p>
          {formatCheckedAt(data?.checkedAt) && (
            <p className="text-xs text-neutral-300">Diperiksa pukul {formatCheckedAt(data?.checkedAt)}</p>
          )}
        </div>
        <TextButton onClick={recheck} busy={checking} className="shrink-0">
          <RefreshCw className={`h-4 w-4 ${checking ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          {checking ? 'Memeriksa…' : 'Periksa ulang'}
        </TextButton>
      </section>

      <section aria-labelledby="overview-counts">
        <h2 id="overview-counts" className="mb-3 text-sm font-semibold">
          Jumlah konten
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CARDS.map(({ key, label, tab, icon: Icon }) => (
            <li key={key}>
              <Link
                href={tabHref(tab)}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-4 transition-colors hover:border-accent-400/50 hover:bg-white/[0.03]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-400/15 text-accent-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xl font-semibold tabular-nums">
                    {counts ? counts[key] : state.phase === 'loading' ? '…' : '—'}
                  </span>
                  <span className="block text-xs text-neutral-300">
                    {label}
                    {!counts && state.phase !== 'loading' ? ' (belum terbaca)' : ''}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
