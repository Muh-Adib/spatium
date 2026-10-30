'use client'

import React from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

export type IndexingBadgeState =
  | 'accepted'
  | 'success'
  | 'rate_limited'
  | 'failed'
  | 'unconfigured'
  | 'in_progress'
  | 'none'
  | string

export interface IndexingMicroBadgeProps {
  provider: 'google' | 'indexnow'
  status?: IndexingBadgeState | null
  httpStatus?: number | null
  submittedAt?: string | null
  errorMessage?: string | null
  onClick?: () => void
  className?: string
}

const BADGE_CONFIG: Record<
  string,
  { toneClass: string; label: string; hint: string }
> = {
  success: {
    toneClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
    label: 'Terverifikasi / Terindeks',
    hint: 'Inspeksi Google Search Console berhasil (HTTP 200).',
  },
  accepted: {
    toneClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
    label: 'Diterima IndexNow',
    hint: 'URL berhasil diserahkan ke Bing, Yandex, dan Seznam (HTTP 200/202).',
  },
  in_progress: {
    toneClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40 animate-pulse',
    label: 'Sedang Diproses',
    hint: 'Pengiriman paket HTTP sedang berjalan...',
  },
  rate_limited: {
    toneClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    label: 'Rate Limited (HTTP 429)',
    hint: 'Mencapai batas kuota penyedia. Harap tunggu periode cooldown.',
  },
  failed: {
    toneClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    label: 'Pengiriman Gagal',
    hint: 'Terjadi kesalahan saat memanggil API mesin pencari.',
  },
  unconfigured: {
    toneClass: 'bg-white/5 text-neutral-400 border-white/10',
    label: 'Belum Dikonfigurasi',
    hint: 'Kredensial API atau IndexNow Key belum disetel di server.',
  },
  none: {
    toneClass: 'bg-neutral-800/80 text-neutral-500 border-white/5',
    label: 'Belum Pernah Dikirim',
    hint: 'URL belum pernah diserahkan ke crawler ini.',
  },
}

export function IndexingMicroBadge({
  provider,
  status = 'none',
  httpStatus,
  submittedAt,
  errorMessage,
  onClick,
  className = '',
}: IndexingMicroBadgeProps) {
  const normStatus = !status ? 'none' : status.toLowerCase()
  const config = BADGE_CONFIG[normStatus] || BADGE_CONFIG.none
  const providerLabel = provider === 'google' ? 'Google' : 'IndexNow'
  const badgeLetter = provider === 'google' ? 'G' : 'IN'

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
    : null

  const httpInfo = httpStatus ? `[HTTP ${httpStatus}] ` : ''
  const hintText = errorMessage || (formattedDate ? `${httpInfo}${config.hint} (Terakhir: ${formattedDate})` : `${httpInfo}${config.hint}`)

  return (
    <Tooltip label={`${providerLabel}: ${config.label}`} hint={hintText} side="top">
      <span
        data-testid={`indexing-badge-${provider}`}
        data-status={normStatus}
        title={`${providerLabel}: ${config.label} - ${hintText}`}
        onClick={onClick}
        className={`inline-flex items-center justify-center font-mono font-bold text-[10px] h-5 min-w-[20px] px-1 rounded border cursor-help select-none transition-all ${config.toneClass} ${
          onClick ? 'hover:brightness-125 cursor-pointer' : ''
        } ${className}`}
      >
        {badgeLetter}
      </span>
    </Tooltip>
  )
}
