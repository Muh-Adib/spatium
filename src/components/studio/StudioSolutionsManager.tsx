'use client'

import React, { useState, useEffect, useCallback, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import {
  Lightbulb,
  Search,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw,
  X,
  Upload,
  Layers,
  ArrowLeft,
  Save,
  FolderKanban,
  HelpCircle,
  Sliders,
  AlertCircle,
  Columns,
  PenSquare,
  Eye,
  Compass,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react'
import StudioVisualEditor, { StudioBlock, StudioViewMode } from './StudioVisualEditor'
import { Tooltip } from '@/components/ui/Tooltip'
import StudioSeoInspector from './StudioSeoInspector'
import MediaPickerModal from './MediaPickerModal'
import { Locale } from '@/lib/seo/schema'

function blocksToPlainText(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks
    .map((b) => {
      const parts = [b.title, b.name, b.description, b.text, b.quote]
      return parts.filter(Boolean).join(' ')
    })
    .filter(Boolean)
    .join('\n\n')
}

/** Parses a JSON column that may already be decoded; logs and falls back on malformed data. */
function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value !== 'string') return value as T
  try {
    return JSON.parse(value) as T
  } catch (err) {
    console.warn('[Solutions] malformed JSON column:', err)
    return fallback
  }
}

/** Cover alt text saved in `seoData.coverAlt` (checked by the publication gate). */
function coverAltOf(seoData: unknown): string {
  const seo = parseJsonValue<Record<string, unknown> | null>(seoData, null)
  return seo && typeof seo.coverAlt === 'string' ? seo.coverAlt : ''
}

type FinderListKey = 'businessGoals' | 'industries' | 'questions' | 'recommendationMatrix'
const FINDER_LISTS: { key: FinderListKey; label: string; rows: number; wide?: boolean }[] = [
  { key: 'businessGoals', label: '1. Tujuan Bisnis', rows: 10 },
  { key: 'industries', label: '2. Daftar Industri', rows: 10 },
  { key: 'questions', label: '3. Pertanyaan Dinamis & Opsi Jawaban', rows: 12, wide: true },
  { key: 'recommendationMatrix', label: '4. Matriks Rekomendasi', rows: 10, wide: true },
]
type FinderDraft = Record<FinderListKey, string>
const EMPTY_FINDER_DRAFT: FinderDraft = { businessGoals: '[]', industries: '[]', questions: '[]', recommendationMatrix: '[]' }

function finderDraftFrom(config: Partial<Record<FinderListKey, unknown>> | null): FinderDraft {
  if (!config) return EMPTY_FINDER_DRAFT
  const draft = { ...EMPTY_FINDER_DRAFT }
  for (const { key } of FINDER_LISTS) {
    const value = config[key]
    draft[key] = JSON.stringify(Array.isArray(value) ? value : [], null, 2)
  }
  return draft
}

/** Error per list: each must be valid JSON describing an array. */
function finderDraftErrors(draft: FinderDraft): Partial<Record<FinderListKey, string>> {
  const errors: Partial<Record<FinderListKey, string>> = {}
  for (const { key } of FINDER_LISTS) {
    try {
      const parsed: unknown = JSON.parse(draft[key] || '[]')
      if (!Array.isArray(parsed)) errors[key] = 'Isi harus berupa daftar JSON, diawali [ dan diakhiri ].'
    } catch (err) {
      errors[key] = `JSON tidak valid: ${err instanceof Error ? err.message : 'periksa tanda kutip dan koma.'}`
    }
  }
  return errors
}

export function StudioSolutionsManager() {
  const fieldId = useId()
  const [activeTab, setActiveTab] = useState<'solutions' | 'finder'>('solutions')
  const [solutions, setSolutions] = useState<any[]>([])
  const [allPortfolios, setAllPortfolios] = useState<any[]>([])
  const [finderDraft, setFinderDraft] = useState<FinderDraft>(EMPTY_FINDER_DRAFT)
  const [finderExists, setFinderExists] = useState(false)
  const [finderErrors, setFinderErrors] = useState<Partial<Record<FinderListKey, string>>>({})
  const [finderStatus, setFinderStatus] = useState('')
  const [loading, setLoading] = useState(true)

  // Full Studio Editor Mode
  const [editorMode, setEditorMode] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<StudioViewMode>('split-preview')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [listStatus, setListStatus] = useState('')
  const [activeInspectorTab, setActiveInspectorTab] = useState<'meta' | 'seo'>('meta')

  // Panels & Selection State (Max 2 panels: Visual Editor + Inspector)
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // Solution Form State
  const [solId, setSolId] = useState<number | null>(null)
  const [solSlug, setSolSlug] = useState('')
  const [solTitle, setSolTitle] = useState('')
  const [solCategory, setSolCategory] = useState('')
  const [solShortDesc, setSolShortDesc] = useState('')
  const [solDesc, setSolDesc] = useState('')
  const [solHeroImage, setSolHeroImage] = useState('')
  const [solHeroAlt, setSolHeroAlt] = useState('')
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [solOrder, setSolOrder] = useState('0')
  const [solFeatured, setSolFeatured] = useState(false)
  const [solStatus, setSolStatus] = useState<'draft' | 'in_review' | 'approved' | 'published' | 'archived'>('draft')
  const [solBlocks, setSolBlocks] = useState<StudioBlock[]>([])
  const [solSelectedPortfolios, setSolSelectedPortfolios] = useState<number[]>([])

  // Shared SEO V4 Inspector State
  const [seoLocale, setSeoLocale] = useState<Locale>('id')
  const [seoTitle, setSeoTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [focusKeyphrase, setFocusKeyphrase] = useState('')
  const [relatedKeyphrases, setRelatedKeyphrases] = useState<string[]>([])
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [robots, setRobots] = useState({ index: true, follow: true })
  const [socialOg, setSocialOg] = useState<any>({})
  const [socialTwitter, setSocialTwitter] = useState<any>({})

  // Block Validation State (L3-T1)
  const [isBlocksValid, setIsBlocksValid] = useState(true)
  const [blockIssues, setBlockIssues] = useState<string[]>([])
  const handleBlockValidation = useCallback((valid: boolean, issues: string[]) => {
    setIsBlocksValid(valid)
    setBlockIssues(issues)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resSol, resPort, resConfig] = await Promise.all([
        fetch('/api/solutions').then((r) => r.json()),
        fetch('/api/portfolio').then((r) => r.json().catch(() => ({ data: [] }))),
        fetch('/api/solution-finder-config').then((r) => r.json().catch(() => ({ data: null }))),
      ])

      if (resSol.success && resSol.data) setSolutions(resSol.data)
      if (resPort.success && resPort.data) setAllPortfolios(resPort.data)
      if (resConfig.success) {
        // No saved config yet → start from empty lists so it can be created here.
        setFinderDraft(finderDraftFrom(resConfig.data ?? null))
        setFinderExists(Boolean(resConfig.data))
        setFinderErrors({})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEditSolution = (sol?: any) => {
    setSelectedBlockId(null)
    setErrorMessage('')
    setSaveMessage('')
    if (sol) {
      setSolId(sol.id)
      setSolSlug(sol.slug)
      setSolTitle(sol.title)
      setSolCategory(sol.category || '')
      setSolShortDesc(sol.shortDescription || '')
      setSolDesc(sol.description || '')
      setSolHeroImage(sol.heroImage || '')
      // Alt text is read back from seoData; never generated from the title.
      setSolHeroAlt(coverAltOf(sol.seoData))
      setSolOrder(String(sol.order ?? 0))
      setSolFeatured(Boolean(sol.featured))
      setSolStatus(sol.status || 'draft')
      const solParsed = parseJsonValue<unknown>(sol.blocks, [])
      setSolBlocks(Array.isArray(solParsed) ? solParsed : [])
      // Keep the saved links; saving sends this list back, so it must start from the DB.
      setSolSelectedPortfolios(Array.isArray(sol.portfolioIds) ? sol.portfolioIds : [])

      setSeoTitle(sol.metaTitle || sol.title)
      setMetaDesc(sol.metaDescription || sol.shortDescription || '')
      setFocusKeyphrase(sol.focusKeyphrase || sol.title)
      setRelatedKeyphrases(sol.relatedKeyphrases || [])
      setCanonicalUrl(sol.canonicalUrl || '')
    } else {
      setSolId(null)
      setSolSlug('')
      setSolTitle('')
      setSolCategory('')
      setSolShortDesc('')
      setSolDesc('')
      setSolHeroImage('')
      setSolHeroAlt('')
      setSolOrder(String(solutions.length + 1))
      setSolFeatured(false)
      setSolStatus('draft')
      setSolBlocks([])
      setSolSelectedPortfolios([])

      setSeoTitle('')
      setMetaDesc('')
      setFocusKeyphrase('')
      setRelatedKeyphrases([])
      setCanonicalUrl('')
    }
    setEditorMode(true)
  }

  const handleSaveSolution = async () => {
    if (!solSlug.trim() || !solTitle.trim()) {
      setErrorMessage('Judul dan Slug Solusi wajib diisi.')
      return
    }

    setSaving(true)
    setSaveMessage('')
    setErrorMessage('')
    try {
      const res = await fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solId,
          slug: solSlug.trim().toLowerCase(),
          title: solTitle.trim(),
          category: solCategory,
          shortDescription: solShortDesc.trim(),
          description: solDesc.trim(),
          heroImage: solHeroImage,
          order: parseInt(solOrder, 10) || 0,
          featured: solFeatured,
          status: solStatus,
          blocks: solBlocks,
          portfolioIds: solSelectedPortfolios,
          metaTitle: seoTitle,
          metaDescription: metaDesc,
          focusKeyphrase,
          relatedKeyphrases,
          seoData: { coverAlt: solHeroAlt.trim() },
        }),
      })

      const json = await res.json()
      if (json.success) {
        if (typeof json.id === 'number') setSolId(json.id)
        setSaveMessage('Solusi berhasil disimpan!')
        fetchData()
        setTimeout(() => setEditorMode(false), 1200)
      } else {
        setErrorMessage(json.error || json.message || 'Gagal menyimpan solusi.')
      }
    } catch (err) {
      console.error('[Solutions] save failed:', err)
      setErrorMessage('Terjadi kesalahan jaringan saat menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSolution = async (id: number, title: string) => {
    if (!confirm(`Hapus Solusi "${title}"?`)) return
    try {
      const res = await fetch(`/api/solutions?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setListStatus(`Solusi "${title}" berhasil dihapus.`)
        fetchData()
      } else {
        setListStatus(json.error || json.message || 'Gagal menghapus solusi.')
      }
    } catch (err) {
      console.error('[Solutions] delete failed:', err)
      setListStatus('Gagal menghapus solusi.')
    }
  }

  // Save Quiz Config
  const handleSaveFinderConfig = async () => {
    const errors = finderDraftErrors(finderDraft)
    setFinderErrors(errors)
    const firstInvalid = FINDER_LISTS.find(({ key }) => errors[key])
    if (firstInvalid) {
      setFinderStatus('Perbaiki daftar yang ditandai sebelum menyimpan.')
      document.getElementById(`${fieldId}-finder-${firstInvalid.key}`)?.focus()
      return
    }

    setSaving(true)
    setFinderStatus('')
    try {
      const body = Object.fromEntries(FINDER_LISTS.map(({ key }) => [key, JSON.parse(finderDraft[key] || '[]')]))
      const res = await fetch('/api/solution-finder-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setFinderExists(true)
        setFinderStatus('Konfigurasi Solution Finder berhasil disimpan.')
      } else {
        setFinderStatus(json.error || json.message || 'Gagal menyimpan konfigurasi.')
      }
    } catch (err) {
      console.error('[Solutions] finder config save failed:', err)
      setFinderStatus('Gagal menyimpan konfigurasi.')
    } finally {
      setSaving(false)
    }
  }

  const currentContentText = blocksToPlainText(solBlocks)

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 1: FULL STUDIO BLOCK BUILDER & SEO INSPECTOR
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 1: FULL STUDIO BLOCK BUILDER & SEO INSPECTOR (DEDICATED FULLSCREEN LAYOUT)
  // ─────────────────────────────────────────────────────────────────────────────
  if (editorMode) {
    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#0D0D0D] text-white antialiased selection:bg-[#4d8bff] selection:text-black">
        {/* Top Dedicated Studio Master Header */}
        <header className="h-14 shrink-0 px-4 sm:px-6 bg-[var(--studio-sidebar-bg)] border-b border-white/[0.08] flex items-center justify-between gap-3 z-30 select-none">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-[45%] md:max-w-[50%]">
            <Tooltip label="Kembali" hint="Kembali ke Daftar Solusi" side="bottom">
              <button aria-label="Kembali"
                type="button"
                onClick={() => {
                  setEditorMode(false)
                  setSelectedBlockId(null)
                }}
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Tooltip>
            <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#4d8bff]/15 border border-[#4d8bff]/30 text-[#4d8bff] uppercase tracking-wider shrink-0">
                <Compass className="w-3 h-3 text-[#4d8bff]" />
                <span className="hidden sm:inline">SOLUSI</span>
              </span>
              <span className="text-xs text-neutral-600 hidden sm:inline shrink-0">/</span>
              <h2 className="font-syne text-xs sm:text-sm font-bold text-white truncate" title={solTitle || 'Solusi Baru'}>
                {solTitle || 'Solusi Baru'}
              </h2>
            </div>
          </div>

          {/* Center: Segmented View Switcher (Kanvas, Split, Pratinjau) */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/10 text-xs shrink-0">
            <Tooltip label="Mode Kanvas" hint="Editor visual menyusun blok langsung" side="bottom">
              <button aria-label="Mode Kanvas" aria-pressed={viewMode === 'canvas'}
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  viewMode === 'canvas'
                    ? 'bg-white/20 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <PenSquare className="w-3.5 h-3.5 text-[#4d8bff]" />
                <span className="hidden sm:inline">Kanvas</span>
              </button>
            </Tooltip>
            <Tooltip label="Mode Split" hint="Kanvas & pratinjau bersandingan" side="bottom">
              <button aria-label="Mode Split" aria-pressed={viewMode === 'split-preview'}
                type="button"
                onClick={() => setViewMode('split-preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  viewMode === 'split-preview'
                    ? 'bg-white/20 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-info" />
                <span className="hidden sm:inline">Split</span>
              </button>
            </Tooltip>
            <Tooltip label="Pratinjau Penuh" hint="Pratinjau 100% rasio web publik" side="bottom">
              <button aria-label="Pratinjau Penuh" aria-pressed={viewMode === 'full-preview'}
                type="button"
                onClick={() => setViewMode('full-preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  viewMode === 'full-preview'
                    ? 'bg-white/20 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Pratinjau</span>
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Inspector / Properties Panel */}
            {viewMode !== 'full-preview' && (
              <Tooltip label={showPropertiesDrawer ? 'Tutup Panel' : 'Buka Panel'} hint="Panel pengaturan blok & SEO" side="bottom">
                <button aria-label={showPropertiesDrawer ? 'Tutup Panel' : 'Buka Panel'} aria-expanded={showPropertiesDrawer}
                  type="button"
                  onClick={() => setShowPropertiesDrawer(!showPropertiesDrawer)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    showPropertiesDrawer
                      ? 'bg-[#4d8bff]/20 border-[#4d8bff]/50 text-[#4d8bff]'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{showPropertiesDrawer ? 'Tutup Panel' : 'Panel'}</span>
                </button>
              </Tooltip>
            )}

            {saveMessage && (
              <span role="status" className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-pulse hidden lg:inline-flex">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveMessage}</span>
              </span>
            )}

            {!isBlocksValid && (
              <span
                className="text-xs font-mono text-rose-400 flex items-center gap-1.5 hidden md:inline-flex cursor-help"
                title={blockIssues.join('\n')}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{blockIssues.length} Error Skema</span>
              </span>
            )}

            <Tooltip label="Simpan Solusi" hint={!isBlocksValid ? `Ada ${blockIssues.length} isu skema blok` : 'Simpan susunan blok ke database'} side="bottom">
              <button
                type="button"
                onClick={handleSaveSolution}
                disabled={saving || !isBlocksValid}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-[0_0_15px_rgba(77, 139, 255,0.25)] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Solusi'}</span>
              </button>
            </Tooltip>
          </div>
        </header>

        {errorMessage && (
          <div role="alert" className="shrink-0 flex items-start gap-2 px-4 sm:px-6 py-2 bg-rose-500/10 border-b border-rose-500/30 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words">{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage('')} aria-label="Tutup pesan galat" className="shrink-0 rounded p-0.5 text-rose-300 hover:bg-white/10">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Dedicated Fullscreen Workspace: Left Visual Editor • Right Contextual Inspector */}
        <div className="relative flex-1 min-h-0 w-full flex overflow-hidden">
          {/* 1. MAIN PANEL: WYSIWYG Live Visual Editor */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
            <StudioVisualEditor
              blocks={solBlocks}
              onChangeBlocks={setSolBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              targetType="solution"
              contextData={{ portfolios: allPortfolios }}
              draftId={solId ? String(solId) : 'new'}
              onSave={handleSaveSolution}
              onValidationChange={handleBlockValidation}
              viewMode={viewMode}
            />
          </div>

          {/* 2. DOCKED RIGHT PANEL: Contextual Inspector (Block Properties / Document / SEO) */}
          {showPropertiesDrawer && viewMode !== 'full-preview' && (
            <aside className="w-full sm:w-[380px] xl:w-[420px] shrink-0 border-l border-white/[0.08] bg-[var(--studio-bg)] h-full overflow-y-auto z-20 flex flex-col p-4 space-y-4">
              {(
                <div className="space-y-4">
                  {/* Tab Switcher: Meta vs SEO */}
                  <div className="flex rounded-2xl bg-surface-overlay p-1 border border-white/10 shadow-md">
                    <button
                      type="button"
                      onClick={() => setActiveInspectorTab('meta')}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-xl transition-all ${
                        activeInspectorTab === 'meta'
                          ? 'bg-[#4d8bff] text-[#191919] shadow font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Dokumen & Relasi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInspectorTab('seo')}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-xl transition-all ${
                        activeInspectorTab === 'seo'
                          ? 'bg-[#4d8bff] text-[#191919] shadow font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      SEO (Yoast)
                    </button>
                  </div>

                  {/* TAB A: Dokumen & Relasi */}
                  {activeInspectorTab === 'meta' && (
                    <div className="p-5 rounded-3xl bg-surface-overlay border border-white/10 space-y-4 shadow-xl">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-neutral-400">
                        💡 <strong>Tip:</strong> Klik salah satu blok di kanvas tengah untuk mengedit properties blok secara langsung di panel ini.
                      </div>

                      <div>
                        <label htmlFor={`${fieldId}-so1`} className="block text-xs font-mono text-neutral-400 mb-1">Judul Solusi</label>
                        <input id={`${fieldId}-so1`}
                          type="text"
                          value={solTitle}
                          onChange={(e) => {
                            setSolTitle(e.target.value)
                            if (!solId) {
                              setSolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                              setSeoTitle(`${e.target.value} — Solusi SPATIUM`)
                              setFocusKeyphrase(e.target.value)
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${fieldId}-so2`} className="block text-xs font-mono text-neutral-400 mb-1">Kategori Solusi</label>
                        <select id={`${fieldId}-so2`}
                          value={solCategory}
                          onChange={(e) => setSolCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                        >
                          <option value="taxonomy">Taxonomy Bisnis</option>
                          <option value="venue">Venue & Destinasi</option>
                          <option value="enterprise">Enterprise Custom</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`${fieldId}-so3`} className="block text-xs font-mono text-neutral-400 mb-1">Slug URL</label>
                        <input id={`${fieldId}-so3`}
                          type="text"
                          value={solSlug}
                          onChange={(e) => setSolSlug(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${fieldId}-so4`} className="block text-xs font-mono text-neutral-400 mb-1">Deskripsi Singkat</label>
                        <textarea id={`${fieldId}-so4`}
                          value={solShortDesc}
                          onChange={(e) => {
                            setSolShortDesc(e.target.value)
                            setMetaDesc(e.target.value)
                          }}
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                        />
                      </div>
                      {/* Cover Hero Image & Alt Text */}
                      <div className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                        <div className="flex items-center justify-between">
                          <label htmlFor={`${fieldId}-so5`} className="text-xs font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-accent-400" />
                            <span>Cover Hero Image Solusi</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setMediaPickerOpen(true)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-white flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3 text-info" />
                            <span>Galeri Media</span>
                          </button>
                        </div>
                        <input id={`${fieldId}-so5`}
                          type="text"
                          value={solHeroImage}
                          onChange={(e) => setSolHeroImage(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-xs font-mono"
                          placeholder="/images/solutions/..."
                        />
                        <div className="space-y-1 pt-1 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <label htmlFor={`${fieldId}-so6`} className="text-[11px] font-mono text-neutral-400">Alt Text [ID] (Wajib Publikasi)</label>
                            <span className={`text-[10px] font-mono ${solHeroAlt.length > 125 ? 'text-red-400' : 'text-neutral-500'}`}>{solHeroAlt.length}/125</span>
                          </div>
                          <input id={`${fieldId}-so6`}
                            type="text"
                            value={solHeroAlt}
                            onChange={(e) => setSolHeroAlt(e.target.value)}
                            placeholder="Deskripsi gambar solusi..."
                            className="w-full px-3 py-1.5 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Relasi Portofolio */}
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                          Hubungkan Bukti Portofolio ({solSelectedPortfolios.length} dipilih)
                        </label>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[var(--studio-bg)] border border-white/10">
                          {allPortfolios.length === 0 ? (
                            <p className="text-xs text-neutral-500 p-2">Tidak ada portofolio tersedia.</p>
                          ) : (
                            allPortfolios.map((p) => {
                              const isChecked = solSelectedPortfolios.includes(p.id)
                              return (
                                <label
                                  key={p.id}
                                  className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'bg-[#4d8bff]/15 text-[#4d8bff]'
                                      : 'text-neutral-300 hover:bg-white/5'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSolSelectedPortfolios([...solSelectedPortfolios, p.id])
                                      } else {
                                        setSolSelectedPortfolios(
                                          solSelectedPortfolios.filter((id) => id !== p.id)
                                        )
                                      }
                                    }}
                                    className="rounded text-[#4d8bff] accent-[#4d8bff]"
                                  />
                                  <span className="truncate">{p.title}</span>
                                </label>
                              )
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`${fieldId}-so7`} className="block text-xs font-mono text-neutral-400 mb-1">Status Publikasi</label>
                        <select id={`${fieldId}-so7`}
                          value={solStatus}
                          onChange={(e: any) => setSolStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                        >
                          <option value="draft">Draft</option>
                          <option value="in_review">In Review</option>
                          <option value="approved">Approved</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* TAB B: Yoast-Parity SEO Inspector */}
                  {activeInspectorTab === 'seo' && (
                    <div className="rounded-3xl bg-surface-overlay border border-white/10 overflow-hidden shadow-xl">
                      <StudioSeoInspector
                        locale={seoLocale}
                        onChangeLocale={setSeoLocale}
                        translationGroupId=""
                        onChangeTranslationGroupId={() => {}}
                        isCornerstone={false}
                        onChangeIsCornerstone={() => {}}
                        articleTitle={solTitle}
                        articleExcerpt={solShortDesc}
                        content={currentContentText}
                        category={solCategory}
                        slug={solSlug}
                        onChangeSlug={setSolSlug}
                        focusKeyphrase={focusKeyphrase}
                        onChangeFocusKeyphrase={setFocusKeyphrase}
                        relatedKeyphrases={relatedKeyphrases}
                        onChangeRelatedKeyphrases={setRelatedKeyphrases}
                        seoTitle={seoTitle}
                        onChangeSeoTitle={setSeoTitle}
                        metaDescription={metaDesc}
                        onChangeMetaDescription={setMetaDesc}
                        canonicalUrl={canonicalUrl}
                        onChangeCanonicalUrl={setCanonicalUrl}
                        breadcrumbTitle={solTitle}
                        onChangeBreadcrumbTitle={() => {}}
                        schemaType="TechArticle"
                        onChangeSchemaType={() => {}}
                        robots={robots}
                        onChangeRobots={setRobots}
                        socialOg={socialOg}
                        onChangeSocialOg={setSocialOg}
                        socialTwitter={socialTwitter}
                        onChangeSocialTwitter={setSocialTwitter}
                        coverUrl={solHeroImage}
                        coverAlt={solHeroAlt}
                        onChangeCoverAlt={setSolHeroAlt}
                        onChangeCoverUrl={setSolHeroImage}
                        onOpenMediaPickerForCover={() => setMediaPickerOpen(true)}
                        existingSlugs={[]}
                      />
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>

        {/* Media Picker Modal */}
        <MediaPickerModal
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(url, item) => {
            setSolHeroImage(url)
            if (!solHeroAlt && item?.name) {
              const cleaned = item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
              setSolHeroAlt(`${solTitle || 'Solusi'} - ${cleaned}`)
            }
            setMediaPickerOpen(false)
          }}
          currentUrl={solHeroImage}
          title="Pilih Media Cover Solusi"
        />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 2: LIST DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <p role="status" className={listStatus ? 'text-xs font-mono text-neutral-300' : 'sr-only'}>
        {listStatus}
      </p>
      {/* Compact Switcher & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-surface-overlay border border-white/10 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('solutions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              activeTab === 'solutions'
                ? 'bg-[#4d8bff] text-[#191919] font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Katalog Solusi ({solutions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finder')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              activeTab === 'finder'
                ? 'bg-[#4d8bff] text-[#191919] font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Finder</span>
          </button>
        </div>

        {activeTab === 'solutions' && (
          <Tooltip label="Tambah Solusi" hint="Buat katalog solusi baru untuk industri atau venue">
            <button
              type="button"
              onClick={() => handleEditSolution()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Solusi</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* TAB 1: SOLUTIONS LIST */}
      {activeTab === 'solutions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.map((sol) => (
            <div
              key={sol.id}
              className="p-5 rounded-3xl bg-surface-overlay border border-white/10 hover:border-[#4d8bff]/40 transition-all flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
                  <span className="text-[#4d8bff] font-semibold uppercase">{sol.category}</span>
                  <span className="text-emerald-400 font-semibold">{sol.status}</span>
                </div>
                <h3 className="font-display text-base font-bold text-white group-hover:text-[#4d8bff] transition-colors">
                  {sol.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {sol.shortDescription}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-white/5">/{sol.slug}</span>
                  <span className="px-2 py-0.5 rounded bg-white/5">
                    {(() => {
                      if (Array.isArray(sol.blocks)) return sol.blocks.length
                      if (typeof sol.blocks === 'string') {
                        const parsed = parseJsonValue<unknown>(sol.blocks, [])
                        return Array.isArray(parsed) ? parsed.length : 0
                      }
                      return 0
                    })()} Blok
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <a
                  href={`${siteConfig.url}/services`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white"
                  title="Lihat Halaman Solusi di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleEditSolution(sol)}
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#4d8bff] hover:bg-white/10"
                  >
                    Edit & Blok
                  </button>
                  <button aria-label={`Hapus solusi ${sol.title}`}
                    type="button"
                    onClick={() => handleDeleteSolution(sol.id, sol.title)}
                    className="p-1 rounded text-neutral-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SOLUTION FINDER CONFIG */}
      {activeTab === 'finder' && (
        <div className="p-6 rounded-3xl bg-surface-overlay border border-white/10 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Konfigurasi Interactive Solution Finder
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {finderExists
                  ? 'Atur opsi kuesioner langkah demi langkah untuk mencocokkan kebutuhan pengunjung dengan solusi Anda.'
                  : 'Belum ada konfigurasi tersimpan. Isi daftar di bawah (format JSON array) lalu simpan untuk membuatnya.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveFinderConfig}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs hover:bg-[#6fb0ff] disabled:opacity-60"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
            </button>
          </div>

          <p role="status" className={finderStatus ? 'text-xs font-mono text-neutral-200' : 'sr-only'}>
            {finderStatus}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FINDER_LISTS.map(({ key, label, rows, wide }) => {
              const inputId = `${fieldId}-finder-${key}`
              const error = finderErrors[key]
              const count = (() => {
                const parsed = parseJsonValue<unknown>(finderDraft[key], null)
                return Array.isArray(parsed) ? parsed.length : null
              })()
              return (
                <div key={key} className={`space-y-3 ${wide ? 'md:col-span-2' : ''}`}>
                  <label htmlFor={inputId} className="block text-xs font-mono text-neutral-400">
                    {label} {count !== null ? `(${count} entri)` : ''}
                  </label>
                  <textarea
                    id={inputId}
                    value={finderDraft[key]}
                    onChange={(e) => {
                      setFinderDraft({ ...finderDraft, [key]: e.target.value })
                      if (error) setFinderErrors({ ...finderErrors, [key]: undefined })
                    }}
                    rows={rows}
                    spellCheck={false}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className={`w-full p-3 rounded-2xl bg-[var(--studio-bg)] border text-xs font-mono text-neutral-300 ${
                      error ? 'border-rose-400' : 'border-white/10'
                    }`}
                  />
                  {error && (
                    <p id={`${inputId}-error`} className="text-xs text-rose-300">
                      {error}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
