'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { TextButton } from '@/components/admin/AdminUi'
import { formatCheckedAt, useSystemStatus, type ContentCounts } from './useSystemStatus'

const TABLES: { key: keyof ContentCounts; table: string; label: string }[] = [
  { key: 'articles', table: 'articles', label: 'Artikel' },
  { key: 'pages', table: 'pages', label: 'Halaman' },
  { key: 'portfolios', table: 'portfolios', label: 'Portofolio' },
  { key: 'services', table: 'services', label: 'Layanan' },
  { key: 'serviceCategories', table: 'service_categories', label: 'Kategori layanan' },
  { key: 'solutions', table: 'solutions', label: 'Solusi' },
  { key: 'redirects', table: 'redirects', label: 'Aturan redirect' },
]

export default function SystemTab() {
  const { state, checking, recheck } = useSystemStatus()
  const data = state.phase === 'ready' ? state.data : null

  return (
    <div className="space-y-6">
      <section aria-labelledby="sys-db" className="space-y-4 rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 id="sys-db" className="text-base font-semibold">
              Database
            </h2>
            <p className="mt-1 text-xs text-neutral-300">
              PostgreSQL 16 lewat Prisma 8 ORM (<code className="font-mono">@prisma/orm-postgres</code>). Skema:{' '}
              <code className="font-mono">prisma/schema.prisma</code>.
            </p>
          </div>
          <TextButton onClick={recheck} busy={checking} className="shrink-0">
            <RefreshCw className={`h-4 w-4 ${checking ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
            {checking ? 'Memeriksa…' : 'Periksa koneksi'}
          </TextButton>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 p-4">
            <dt className="text-xs text-neutral-300">Koneksi</dt>
            <dd className="mt-1 flex items-center gap-2" role="status">
              {state.phase === 'loading' ? (
                'Memeriksa…'
              ) : data?.online ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" /> Terhubung
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-300" aria-hidden="true" />
                  {state.phase === 'error' ? state.message : 'Tidak terhubung'}
                </>
              )}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <dt className="text-xs text-neutral-300">Waktu respons kueri hitung</dt>
            <dd className="mt-1 tabular-nums">{data?.latency ?? '—'}</dd>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <dt className="text-xs text-neutral-300">Terakhir diperiksa</dt>
            <dd className="mt-1 tabular-nums">{formatCheckedAt(data?.checkedAt) ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="sys-tables" className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--studio-bg)]">
        <h2 id="sys-tables" className="border-b border-white/10 px-5 py-3 text-sm font-semibold">
          Jumlah baris per tabel
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-neutral-200">
                <th scope="col" className="px-5 py-2.5 font-semibold">Tabel</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">Isi</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">Baris</th>
              </tr>
            </thead>
            <tbody>
              {TABLES.map((t) => (
                <tr key={t.key} className="border-b border-white/[0.06]">
                  <th scope="row" className="px-5 py-2.5 font-mono font-normal">{t.table}</th>
                  <td className="px-5 py-2.5 text-neutral-200">{t.label}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{data?.counts ? data.counts[t.key] : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="sys-cli" className="space-y-2 rounded-2xl border border-white/10 p-5">
        <h2 id="sys-cli" className="text-sm font-semibold">Perintah pemeliharaan</h2>
        <p className="text-xs text-neutral-300">Jalankan dari root repo:</p>
        <ul className="space-y-1.5 font-mono text-xs">
          <li><code>pnpm run db:push</code> <span className="font-sans text-neutral-300">— terapkan skema Prisma</span></li>
          <li><code>pnpm run db:seed</code> <span className="font-sans text-neutral-300">— isi konten awal</span></li>
        </ul>
      </section>
    </div>
  )
}
