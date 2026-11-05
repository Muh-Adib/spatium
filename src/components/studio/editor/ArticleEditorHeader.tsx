'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Sliders,
  Sparkles,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  Columns,
  PenSquare,
  Search,
  Maximize2,
  ExternalLink,
} from 'lucide-react'
import { useIndexingCooldown } from '@/hooks/useIndexingCooldown'

export type EditorViewMode = 'focus' | 'split-inspector' | 'split-preview' | 'full-preview'

interface ArticleEditorHeaderProps {
  title: string
  slug: string
  status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published'
  isEditMode: boolean
  isDirty: boolean
  saving: boolean
  wordCount: number
  readingTimeMinutes: number
  internalLinksCount: number
  seoScore: number
  viewMode: EditorViewMode
  onViewModeChange: (mode: EditorViewMode) => void
  isInspectorOpen: boolean
  onToggleInspector: () => void
  isAiOpen: boolean
  onToggleAi: () => void
  onSave: (targetStatus?: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published') => void
  permissions: {
    canPublish?: boolean
    canSubmitForReview?: boolean
    [key: string]: any
  }
  publicationDate: string
  onChangePublicationDate: (val: string) => void
  scheduleLocal: string
  onChangeScheduleLocal: (val: string) => void
  publicationTimezone: string
  onOpenSeoTab: () => void
  onNavigateBack?: () => void
}

export function ArticleEditorHeader({
  title,
  slug,
  status,
  isEditMode,
  isDirty,
  saving,
  wordCount,
  readingTimeMinutes,
  internalLinksCount,
  seoScore,
  viewMode,
  onViewModeChange,
  isInspectorOpen,
  onToggleInspector,
  isAiOpen,
  onToggleAi,
  onSave,
  permissions,
  publicationDate,
  onChangePublicationDate,
  scheduleLocal,
  onChangeScheduleLocal,
  publicationTimezone,
  onOpenSeoTab,
  onNavigateBack,
}: ArticleEditorHeaderProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const scheduleRef = useRef<HTMLDivElement>(null)

  // Load indexing status when published to power micro-pills
  const isPublished = status === 'published'
  const { status: indexingData } = useIndexingCooldown({
    type: 'article',
    idOrSlug: slug,
    enabled: isPublished && Boolean(slug),
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scheduleRef.current && !scheduleRef.current.contains(event.target as Node)) {
        setScheduleOpen(false)
      }
    }
    if (scheduleOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [scheduleOpen])

  // SEO Score color styling
  const seoBadgeStyle =
    seoScore >= 80
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
      : seoScore >= 50
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
      : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'

  // Status badge styling
  const statusLabel =
    status === 'published'
      ? 'Terbit'
      : status === 'scheduled'
      ? 'Terjadwal'
      : status === 'in_review'
      ? 'Menunggu Review'
      : 'Draf'

  const statusBadgeStyle =
    status === 'published'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : status === 'scheduled'
      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      : status === 'in_review'
      ? 'bg-info/15 text-info-300 border-info/30'
      : 'bg-white/5 text-neutral-400 border-white/10'

  return (
    <header className="h-[52px] shrink-0 border-b border-white/[0.08] bg-[var(--studio-sidebar-bg)] px-3 sm:px-4 flex items-center justify-between gap-2 z-30 select-none">
      {/* ----------------- LEFT: NAV & STATUS ----------------- */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onNavigateBack ? (
          <button
            type="button"
            onClick={onNavigateBack}
            title="Kembali ke Daftar Artikel"
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/admin?tab=articles"
            title="Kembali ke Daftar Artikel"
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}

        <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border shrink-0 ${statusBadgeStyle}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'published'
                  ? 'bg-emerald-400'
                  : status === 'scheduled'
                  ? 'bg-purple-400'
                  : status === 'in_review'
                  ? 'bg-info'
                  : 'bg-neutral-500'
              }`}
            />
            <span>{statusLabel}</span>
          </span>

          {/* Real-time Save status indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
            {saving ? (
              <span className="flex items-center gap-1 text-accent-400">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                <span>Menyimpan...</span>
              </span>
            ) : isDirty ? (
              <span className="flex items-center gap-1 text-amber-400/90" title="Ada perubahan belum disimpan (Ctrl+S / ⌘S)">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Belum disimpan</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400/90">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Tersimpan</span>
              </span>
            )}
          </div>

          {/* Indexing Micro-Pill Badges (Only when article is published) */}
          {status === 'published' && (
            <div
              onClick={onOpenSeoTab}
              title="Status Indeksasi Mesin Pencari (Klik untuk membuka detail di SEO Inspector Tab 4)"
              className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 cursor-pointer hover:border-white/20 transition-all text-[10px] font-mono select-none"
            >
              {/* Google Micro-Pill */}
              <span className="flex items-center gap-1" title="Google Search Console URL Inspection Status">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    indexingData?.providers?.google?.status === 'success'
                      ? 'bg-emerald-400'
                      : indexingData?.providers?.google?.status === 'rate_limited'
                      ? 'bg-amber-400'
                      : indexingData?.providers?.google?.status === 'unconfigured'
                      ? 'bg-neutral-500'
                      : indexingData?.providers?.google?.status === 'failed'
                      ? 'bg-rose-400'
                      : 'bg-neutral-500'
                  }`}
                />
                <span className="text-neutral-300 font-bold">GSC:</span>
                <span
                  className={
                    indexingData?.providers?.google?.status === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : 'text-neutral-400'
                  }
                >
                  {indexingData?.providers?.google?.status === 'success'
                    ? 'OK'
                    : indexingData?.providers?.google?.status === 'rate_limited'
                    ? '429'
                    : indexingData?.providers?.google?.status === 'unconfigured'
                    ? 'Off'
                    : indexingData?.providers?.google?.status === 'failed'
                    ? 'Err'
                    : '—'}
                </span>
              </span>

              <span className="text-neutral-700">|</span>

              {/* IndexNow Micro-Pill */}
              <span className="flex items-center gap-1" title="IndexNow (Bing/Yandex) Submission Status">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    indexingData?.providers?.indexnow?.status === 'accepted' || indexingData?.providers?.indexnow?.status === 'success'
                      ? 'bg-emerald-400'
                      : indexingData?.providers?.indexnow?.status === 'rate_limited'
                      ? 'bg-amber-400'
                      : indexingData?.providers?.indexnow?.status === 'failed'
                      ? 'bg-rose-400'
                      : 'bg-neutral-500'
                  }`}
                />
                <span className="text-neutral-300 font-bold">IN:</span>
                <span
                  className={
                    indexingData?.providers?.indexnow?.status === 'accepted' || indexingData?.providers?.indexnow?.status === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : 'text-neutral-400'
                  }
                >
                  {indexingData?.providers?.indexnow?.status === 'accepted' || indexingData?.providers?.indexnow?.status === 'success'
                    ? '202'
                    : indexingData?.providers?.indexnow?.status === 'rate_limited'
                    ? '429'
                    : indexingData?.providers?.indexnow?.status === 'failed'
                    ? 'Err'
                    : '—'}
                </span>
              </span>
            </div>
          )}

          {/* Title preview on desktop */}
          <span className="text-xs text-neutral-400 hidden xl:inline truncate max-w-[200px] border-l border-white/10 pl-2">
            {title || 'Tanpa Judul'}
          </span>
        </div>
      </div>

      {/* ----------------- CENTER: STREAMLINED VIEW SWITCHER ----------------- */}
      <div className="flex items-center gap-2">
        {/* View Mode Segmented Switcher (Kanvas, Split, Pratinjau) */}
        <div className="flex items-center p-0.5 rounded-lg bg-black/50 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange('focus')}
            title="Kanvas Menulis (Fokus Maksimal)"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === 'focus' || viewMode === 'split-inspector'
                ? 'bg-white/15 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PenSquare className="w-3 h-3 text-accent-400" />
            <span className="hidden sm:inline">Kanvas</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('split-preview')}
            title="Split View (Editor & Pratinjau Bersandingan)"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === 'split-preview'
                ? 'bg-white/15 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Columns className="w-3 h-3 text-info" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('full-preview')}
            title="Pratinjau Penuh Format Publik"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === 'full-preview'
                ? 'bg-white/15 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Pratinjau</span>
          </button>
        </div>

        {/* Word count stats */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-neutral-400">
          <span>{wordCount} kata</span>
          <span className="text-neutral-600">·</span>
          <span>~{readingTimeMinutes} mnt</span>
        </div>
      </div>

      {/* ----------------- RIGHT: ACTIONS & PUBLISH ----------------- */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Live Preview Tab Link */}
        {slug && (
          <a
            href={`${siteConfig.url}/artikel/${encodeURIComponent(slug)}${status === 'published' ? '' : '?preview=true'}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka halaman live preview di tab baru (dapat diakses meski draf belum terbit)"
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {/* AI Copilot Toggle Button */}
        <button
          type="button"
          onClick={onToggleAi}
          title={isAiOpen ? 'Tutup Asisten AI Copilot' : 'Buka Asisten AI Copilot'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isAiOpen
              ? 'bg-accent-500/20 border-accent-400/40 text-accent-300 shadow-sm'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-accent-400" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Unified Document & SEO Panel Toggle (with integrated SEO Score Badge) */}
        <button
          type="button"
          onClick={onToggleInspector}
          title={isInspectorOpen ? 'Tutup Panel Dokumen & SEO' : 'Buka Panel Dokumen & SEO'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isInspectorOpen
              ? 'bg-accent-500/20 border-accent-400/40 text-accent-300 shadow-sm'
              : `${seoBadgeStyle}`
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SEO: {seoScore}/100</span>
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave('draft')}
          title="Simpan sebagai Draf (Shortcut: ⌘S atau Ctrl+S)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 text-neutral-300" />
          <span className="hidden sm:inline">{saving ? 'Menyimpan...' : 'Draf'}</span>
        </button>

        {/* Submit Review Button (Author/Reviewer) */}
        {permissions.canSubmitForReview && !permissions.canPublish && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave('in_review')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/20 hover:bg-info/30 text-info-300 border border-info/30 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ajukan Review</span>
          </button>
        )}

        {/* Publishing / Scheduling (Editor / Admin) */}
        {permissions.canPublish && (
          <div className="relative" ref={scheduleRef}>
            <div className="inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm border border-emerald-400/30">
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave('published')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-white text-xs font-bold transition-all hover:brightness-110 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Perbarui' : 'Terbitkan'}</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleOpen((v) => !v)}
                title="Opsi Jadwal & Waktu Terbit"
                className="px-1.5 py-1.5 border-l border-emerald-400/30 text-emerald-100 hover:bg-black/20 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Schedule Dropdown Popover */}
            {scheduleOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 p-4 rounded-2xl bg-surface-elevated/95 border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 font-semibold text-white">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent-400" />
                    <span>Opsi Jadwal Publikasi</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">{publicationTimezone}</span>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    Jadwal Terbit Otomatis:
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleLocal}
                    onChange={(e) => onChangeScheduleLocal(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-400"
                  />
                  {status === 'scheduled' && (
                    <span className="text-[10px] text-accent-300 block mt-1 font-mono">
                      Artikel saat ini terjadwal (belum tampil publik).
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    Tanggal Publikasi Asli (UTC):
                  </label>
                  <input
                    type="datetime-local"
                    value={publicationDate ? new Date(publicationDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) =>
                      onChangePublicationDate(e.target.value ? new Date(`${e.target.value}Z`).toISOString() : '')
                    }
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-400"
                  />
                </div>

                <div className="pt-2 flex justify-between gap-2 border-t border-white/10">
                  <button
                    type="button"
                    disabled={saving || !scheduleLocal}
                    onClick={() => {
                      setScheduleOpen(false)
                      onSave('scheduled')
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 border border-accent-400/30 text-xs font-semibold disabled:opacity-40 transition-all text-center"
                  >
                    Simpan Jadwal
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(false)}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
