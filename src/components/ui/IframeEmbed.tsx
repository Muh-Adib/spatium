'use client'

import React, { useState } from 'react'
import { validateEmbedUrl, getEmbedSandboxPolicy } from '@/lib/media/embedValidator'
import { ExternalLink, ShieldAlert, Globe } from 'lucide-react'

interface IframeEmbedProps {
  url: string
  title: string
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'custom'
  className?: string
  openExternalLabel?: string
}

export function IframeEmbed({
  url,
  title,
  aspectRatio = '16/9',
  className = '',
  openExternalLabel = 'Buka Live Project di Tab Baru',
}: IframeEmbedProps) {
  const [loadError, setLoadError] = useState(false)
  const validation = validateEmbedUrl(url)

  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-video'
      : aspectRatio === '4/3'
      ? 'aspect-[4/3]'
      : aspectRatio === '1/1'
      ? 'aspect-square'
      : 'min-h-[500px]'

  if (!validation.isValid) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-neutral-900/60 p-8 text-center ${className}`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-body-lg font-semibold text-white">Live Preview Ditangguhkan</h3>
        <p className="mt-2 text-body-sm text-neutral-400 max-w-md mx-auto">
          {validation.reason ?? 'Domain embed tidak diizinkan oleh kebijakan keamanan UNIMASI.'}
        </p>
        <div className="mt-6">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-5 py-2.5 text-body-sm font-medium text-white transition-all border border-neutral-700"
          >
            <Globe className="h-4 w-4 text-[#FFD600]" />
            <span>Kunjungi Situs Langsung</span>
            <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-2xl ${className}`}>
      {/* Top Browser chrome bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 font-mono text-[11px] text-neutral-400 truncate max-w-xs md:max-w-md">
            {validation.domain}
          </span>
        </div>
        <a
          href={validation.safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#FFD600] hover:text-[#FFE855] transition-colors"
          title={openExternalLabel}
        >
          <span>{openExternalLabel}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Frame content */}
      <div className={`relative w-full ${aspectClass}`}>
        {!loadError ? (
          <iframe
            src={validation.safeUrl}
            title={title}
            loading="lazy"
            sandbox={getEmbedSandboxPolicy()}
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setLoadError(true)}
            className="h-full w-full border-0 bg-neutral-950"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-neutral-400">
            <p className="text-body-sm">Gagal memuat pratinjau langsung.</p>
            <a
              href={validation.safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[#FFD600] underline text-body-xs"
            >
              Buka situs secara langsung di tab baru
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
