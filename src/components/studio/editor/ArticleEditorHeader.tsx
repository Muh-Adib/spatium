'use client'

import { memo, useEffect, useId, useRef, useState } from 'react'
import { siteConfig } from '@/config/site'
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Sliders,
  Calendar,
  Check,
  Clock,
  ChevronDown,
  Columns,
  PenSquare,
  ExternalLink,
  Keyboard,
  HardDrive,
  CircleDot,
} from 'lucide-react'
import type { ArticleEditorStatus } from '@/lib/articles/editorState'

export type EditorViewMode = 'focus' | 'split-inspector' | 'split-preview' | 'full-preview'

interface ArticleEditorHeaderProps {
  title: string
  slug: string
  status: ArticleEditorStatus
  isEditMode: boolean
  isDirty: boolean
  saving: boolean
  /** Time the browser autosave last wrote a local copy (null = none yet). */
  localSavedAt: Date | null
  wordCount: number
  readingTimeMinutes: number
  seoScore: number
  viewMode: EditorViewMode
  onViewModeChange: (mode: EditorViewMode) => void
  isInspectorOpen: boolean
  onToggleInspector: () => void
  onSave: (targetStatus?: ArticleEditorStatus) => void
  canPublish: boolean
  canSubmitForReview: boolean
  publicationDate: string
  onChangePublicationDate: (val: string) => void
  scheduleLocal: string
  onChangeScheduleLocal: (val: string) => void
  publicationTimezone: string
  onOpenShortcuts: () => void
  onNavigateBack: () => void
}

const STATUS_LABEL: Record<ArticleEditorStatus, string> = {
  published: 'Terbit',
  scheduled: 'Terjadwal',
  in_review: 'Menunggu review',
  approved: 'Disetujui',
  draft: 'Draf',
}

const VIEW_OPTIONS: Array<{ id: EditorViewMode; label: string; icon: typeof PenSquare }> = [
  { id: 'split-inspector', label: 'Tulis', icon: PenSquare },
  { id: 'split-preview', label: 'Berdampingan', icon: Columns },
  { id: 'full-preview', label: 'Pratinjau', icon: Eye },
]

const fmtTime = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const secondaryBtn =
  'inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-neutral-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'

export const ArticleEditorHeader = memo(function ArticleEditorHeader({
  title,
  slug,
  status,
  isEditMode,
  isDirty,
  saving,
  localSavedAt,
  wordCount,
  readingTimeMinutes,
  seoScore,
  viewMode,
  onViewModeChange,
  isInspectorOpen,
  onToggleInspector,
  onSave,
  canPublish,
  canSubmitForReview,
  publicationDate,
  onChangePublicationDate,
  scheduleLocal,
  onChangeScheduleLocal,
  publicationTimezone,
  onOpenShortcuts,
  onNavigateBack,
}: ArticleEditorHeaderProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const scheduleRef = useRef<HTMLDivElement>(null)
  const scheduleTriggerRef = useRef<HTMLButtonElement>(null)
  const scheduleId = useId()

  useEffect(() => {
    if (!scheduleOpen) return
    const onPointer = (event: MouseEvent) => {
      if (scheduleRef.current && !scheduleRef.current.contains(event.target as Node)) setScheduleOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setScheduleOpen(false)
        scheduleTriggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [scheduleOpen])

  const activeView = viewMode === 'focus' ? 'split-inspector' : viewMode
  const seoTone = seoScore >= 80 ? 'text-emerald-300' : seoScore >= 50 ? 'text-amber-300' : 'text-rose-300'

  let saveIcon = <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
  let saveText = isEditMode ? 'Tersimpan di server' : 'Belum pernah disimpan'
  if (saving) {
    saveIcon = <CircleDot className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
    saveText = 'Menyimpan ke server…'
  } else if (isDirty) {
    saveIcon = <HardDrive className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
    saveText = localSavedAt
      ? `Tersimpan lokal ${fmtTime(localSavedAt)} · belum disimpan ke server`
      : 'Belum disimpan ke server'
  }

  const previewHref = slug
    ? `${siteConfig.url}/journal/${encodeURIComponent(slug)}${status === 'published' ? '' : '?preview=true'}`
    : null

  return (
    <header className="z-30 flex min-h-[52px] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-white/[0.08] bg-[var(--studio-sidebar-bg)] px-3 py-1.5 sm:px-4">
      {/* Left: back, status, save state */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onNavigateBack}
          aria-label="Kembali ke daftar artikel"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-200 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <h1 className="sr-only">{title ? `Edit artikel: ${title}` : 'Tulis artikel baru'}</h1>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-semibold text-neutral-100">
          <span className="sr-only">Status: </span>
          {STATUS_LABEL[status]}
        </span>

        <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-neutral-300">
          {saveIcon}
          <span className="min-w-0">{saveText}</span>
        </p>
      </div>

      {/* Centre: view mode */}
      <div className="flex items-center gap-2">
        <div role="radiogroup" aria-label="Tampilan editor" className="flex items-center rounded-lg border border-white/10 bg-black/50 p-0.5 text-xs">
          {VIEW_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const checked = activeView === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={opt.label}
                onClick={() => onViewModeChange(opt.id)}
                className={`flex min-h-8 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ${
                  checked ? 'bg-white/15 font-bold text-white' : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">{opt.label}</span>
              </button>
            )
          })}
        </div>
        <p className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[11px] text-neutral-300 xl:flex">
          <span>{wordCount} kata</span>
          <span aria-hidden="true">·</span>
          <span>±{readingTimeMinutes} menit baca</span>
        </p>
      </div>

      {/* Right: actions (one primary) */}
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onOpenShortcuts} aria-label="Pintasan keyboard" aria-keyshortcuts="Shift+?" className={secondaryBtn}>
          <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden xl:inline">Pintasan</span>
        </button>

        {previewHref && (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka pratinjau publik di tab baru"
            className={secondaryBtn}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}

        <button
          type="button"
          onClick={onToggleInspector}
          aria-pressed={isInspectorOpen}
          aria-keyshortcuts="Control+/ Meta+/"
          aria-label={`Panel Dokumen & SEO, skor SEO ${seoScore} dari 100`}
          className={secondaryBtn}
        >
          <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">
            SEO <span className={`font-mono ${seoTone}`}>{seoScore}</span>
          </span>
        </button>

        {!(canPublish && status === 'published') && (
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave('draft')}
          aria-keyshortcuts="Control+S Meta+S"
          className={secondaryBtn}
        >
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Simpan draf</span>
        </button>
        )}

        {canSubmitForReview && !canPublish && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave('in_review')}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-bold text-accent-950 hover:bg-accent-300 disabled:opacity-60"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ajukan review</span>
          </button>
        )}

        {canPublish && (
          <div className="relative" ref={scheduleRef}>
            <div className="inline-flex items-stretch rounded-lg bg-accent-500 text-accent-950">
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave('published')}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-s-lg px-3 py-1.5 text-xs font-bold hover:bg-accent-300 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{status === 'published' ? 'Perbarui' : 'Terbitkan'}</span>
              </button>
              <button
                ref={scheduleTriggerRef}
                type="button"
                onClick={() => setScheduleOpen((v) => !v)}
                aria-expanded={scheduleOpen}
                aria-controls={scheduleId}
                aria-label="Opsi jadwal terbit"
                className="inline-flex min-h-9 items-center rounded-e-lg border-s border-accent-950/30 px-2 hover:bg-accent-300"
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {scheduleOpen && (
              <div
                id={scheduleId}
                role="group"
                aria-label="Opsi jadwal terbit"
                className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] space-y-3 rounded-2xl border border-white/15 bg-surface-elevated p-4 text-xs shadow-2xl"
              >
                <p className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 font-semibold text-white">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                    Jadwal terbit
                  </span>
                  <span className="font-mono text-[10px] font-normal text-neutral-300">{publicationTimezone}</span>
                </p>

                <div>
                  <label htmlFor={`${scheduleId}-at`} className="mb-1 block font-mono text-[11px] text-neutral-300">
                    Terbit otomatis pada
                  </label>
                  <input
                    id={`${scheduleId}-at`}
                    type="datetime-local"
                    value={scheduleLocal}
                    onChange={(e) => {
                      onChangeScheduleLocal(e.target.value)
                      if (scheduleError) setScheduleError(null)
                    }}
                    aria-invalid={scheduleError ? true : undefined}
                    aria-describedby={scheduleError ? `${scheduleId}-error` : undefined}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                  />
                  {scheduleError && (
                    <p id={`${scheduleId}-error`} className="mt-1 text-[11px] text-amber-300">
                      {scheduleError}
                    </p>
                  )}
                  {status === 'scheduled' && (
                    <p className="mt-1 text-[11px] text-neutral-300">Artikel sedang terjadwal dan belum tampil publik.</p>
                  )}
                </div>

                <div>
                  <label htmlFor={`${scheduleId}-orig`} className="mb-1 block font-mono text-[11px] text-neutral-300">
                    Tanggal terbit asli (UTC)
                  </label>
                  <input
                    id={`${scheduleId}-orig`}
                    type="datetime-local"
                    value={publicationDate ? new Date(publicationDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => onChangePublicationDate(e.target.value ? new Date(`${e.target.value}Z`).toISOString() : '')}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-white/10 pt-2">
                  <button type="button" onClick={() => setScheduleOpen(false)} className={secondaryBtn}>
                    Tutup
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (!scheduleLocal) {
                        setScheduleError('Pilih tanggal dan jam terbit.')
                        document.getElementById(`${scheduleId}-at`)?.focus()
                        return
                      }
                      setScheduleOpen(false)
                      onSave('scheduled')
                    }}
                    className={secondaryBtn}
                  >
                    Simpan jadwal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
})
