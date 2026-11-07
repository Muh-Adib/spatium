'use client'

import React, { useRef, useState, useEffect, useCallback, useId } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import {
  Boxes,
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
  Eye,
  Sliders,
  FolderKanban,
  ChevronRight,
  Globe,
  LayoutTemplate,
  AlertCircle,
  Columns,
  PenSquare,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react'
import StudioVisualEditor, { StudioBlock, StudioViewMode } from './StudioVisualEditor'
import StudioSeoInspector from './StudioSeoInspector'
import MediaPickerModal from './MediaPickerModal'
import { Tooltip } from '@/components/ui/Tooltip'
import { Locale } from '@/lib/seo/schema'
import { useAuth } from '@/lib/auth/AuthContext'

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
    console.warn('[Services] malformed JSON column:', err)
    return fallback
  }
}

/** Cover alt text saved in `seoData.coverAlt` (checked by the publication gate). */
function coverAltOf(seoData: unknown): string {
  const seo = parseJsonValue<Record<string, unknown> | null>(seoData, null)
  return seo && typeof seo.coverAlt === 'string' ? seo.coverAlt : ''
}

/** Readable message from an API error body, including publication-gate issues. */
function apiErrorMessage(json: { error?: string; message?: string; issues?: unknown }, fallback: string): string {
  return json.error || json.message || fallback
}

export function StudioServicesManager() {
  const fieldId = useId()
  // Same capabilities the API enforces, so the UI never offers a forbidden action.
  const { can } = useAuth()
  const [activeTab, setActiveTab] = useState<'departments' | 'services'>('departments')
  const [categories, setCategories] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [allPortfolios, setAllPortfolios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Full Studio Editor Mode
  const [editorMode, setEditorMode] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<StudioViewMode>('split-preview')
  const [editingType, setEditingType] = useState<'department' | 'service'>('department')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [listStatus, setListStatus] = useState('')
  const [activeInspectorTab, setActiveInspectorTab] = useState<'meta' | 'seo'>('meta')
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // Department Form State
  const [depId, setDepId] = useState<number | null>(null)
  const [depSlug, setDepSlug] = useState('')
  const [depTitle, setDepTitle] = useState('')
  const [depTag, setDepTag] = useState('')
  const [depShortDesc, setDepShortDesc] = useState('')
  const [depHeroImage, setDepHeroImage] = useState('')
  const [depHeroAlt, setDepHeroAlt] = useState('')
  const [depThemePreset, setDepThemePreset] = useState('charcoal')
  const [depOrder, setDepOrder] = useState('0')
  const [depStatus, setDepStatus] = useState<'draft' | 'in_review' | 'approved' | 'published' | 'archived'>('draft')
  const [depShowInNav, setDepShowInNav] = useState(true)
  const [depBlocks, setDepBlocks] = useState<StudioBlock[]>([])

  // Service Form State
  const [svcId, setSvcId] = useState<number | null>(null)
  const [svcSlug, setSvcSlug] = useState('')
  const [svcName, setSvcName] = useState('')
  const [svcCategoryId, setSvcCategoryId] = useState<number | null>(null)
  const [svcIndexNumber, setSvcIndexNumber] = useState('01')
  const [svcCategoryBadge, setSvcCategoryBadge] = useState('')
  const [svcHighlightWord, setSvcHighlightWord] = useState('')
  const [svcShortDesc, setSvcShortDesc] = useState('')
  const [svcWhatsappPrompt, setSvcWhatsappPrompt] = useState('')
  const [svcHeroImage, setSvcHeroImage] = useState('')
  const [svcHeroAlt, setSvcHeroAlt] = useState('')
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'dep' | 'svc'>('dep')
  const [svcOrder, setSvcOrder] = useState('0')
  const [svcFeatured, setSvcFeatured] = useState(false)
  const [svcStatus, setSvcStatus] = useState<'draft' | 'in_review' | 'approved' | 'published' | 'archived'>('draft')
  const [svcBlocks, setSvcBlocks] = useState<StudioBlock[]>([])
  const [svcSelectedPortfolios, setSvcSelectedPortfolios] = useState<number[]>([])

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
      const [resCat, resSvc, resPort] = await Promise.all([
        fetch('/api/service-categories').then((r) => r.json()),
        fetch('/api/services').then((r) => r.json()),
        fetch('/api/portfolio').then((r) => r.json().catch(() => ({ data: [] }))),
      ])

      if (resCat.success && resCat.data) setCategories(resCat.data)
      if (resSvc.success && resSvc.data) setServices(resSvc.data)
      if (resPort.success && resPort.data) setAllPortfolios(resPort.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Deep link from MCP `editUrl` / notifications: /admin?tab=services&slug=<slug> opens that entry once.
  const searchParams = useSearchParams()
  const deepLinkSlug = searchParams?.get('slug') ?? null
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    // Only roles that can save edits get the editor; others just see the list.
    if (!deepLinkSlug || deepLinkHandled.current || !can('service:update')) return
    const match = services.find((entry) => entry.slug === deepLinkSlug)
    if (!match) return
    deepLinkHandled.current = true
    handleEditService(match)
  }, [deepLinkSlug, services, can])

  // Same for categories: /admin?tab=services&category=<slug> (MCP service-category editUrl).
  const deepLinkCategory = searchParams?.get('category') ?? null
  const categoryDeepLinkHandled = useRef(false)
  useEffect(() => {
    if (!deepLinkCategory || categoryDeepLinkHandled.current || !can('service-category:update')) return
    const match = categories.find((entry) => entry.slug === deepLinkCategory)
    if (!match) return
    categoryDeepLinkHandled.current = true
    handleEditDepartment(match)
  }, [deepLinkCategory, categories, can])

  // Open Editor for Department
  const handleEditDepartment = (cat?: any) => {
    setEditingType('department')
    setErrorMessage('')
    setSaveMessage('')
    if (cat) {
      setDepId(cat.id)
      setDepSlug(cat.slug)
      setDepTitle(cat.title)
      setDepTag(cat.tag || '')
      setDepShortDesc(cat.shortDescription || '')
      setDepHeroImage(cat.heroImage || '')
      // Alt text is read back from seoData; never generated from the title.
      setDepHeroAlt(coverAltOf(cat.seoData))
      setDepThemePreset(cat.themePreset || 'charcoal')
      setDepOrder(String(cat.order ?? 0))
      setDepStatus(cat.status || 'draft')
      setDepShowInNav(Boolean(cat.showInNav ?? true))
      const depParsed = parseJsonValue<unknown>(cat.blocks, [])
      setDepBlocks(Array.isArray(depParsed) ? depParsed : [])
      setSeoTitle(cat.metaTitle || cat.title)
      setMetaDesc(cat.metaDescription || cat.shortDescription || '')
      setFocusKeyphrase(cat.focusKeyphrase || cat.title)
      const depKeyphrases = parseJsonValue<unknown>(cat.relatedKeyphrases, [])
      setRelatedKeyphrases(Array.isArray(depKeyphrases) ? depKeyphrases : [])
      setCanonicalUrl(cat.canonicalUrl || '')
    } else {
      setDepId(null)
      setDepSlug('')
      setDepTitle('')
      setDepTag('DEPARTEMEN SPESIALISASI')
      setDepShortDesc('')
      setDepHeroImage('')
      setDepHeroAlt('')
      setDepThemePreset('charcoal')
      setDepOrder(String(categories.length + 1))
      setDepStatus('draft')
      setDepShowInNav(true)
      setDepBlocks([])
      setSeoTitle('')
      setMetaDesc('')
      setFocusKeyphrase('')
      setRelatedKeyphrases([])
      setCanonicalUrl('')
    }
    setEditorMode(true)
  }

  // Open Editor for Service
  const handleEditService = (svc?: any) => {
    setEditingType('service')
    setErrorMessage('')
    setSaveMessage('')
    if (svc) {
      setSvcId(svc.id)
      setSvcSlug(svc.slug)
      setSvcName(svc.name)
      setSvcCategoryId(svc.categoryId || null)
      setSvcIndexNumber(svc.indexNumber || '01')
      setSvcCategoryBadge(svc.categoryBadge || '')
      setSvcHighlightWord(svc.highlightWord || '')
      setSvcShortDesc(svc.shortDescription || '')
      setSvcWhatsappPrompt(svc.whatsappPrompt || '')
      setSvcHeroImage(svc.heroImage?.url || svc.heroImage || '')
      // Alt text is read back from seoData; never generated from the name.
      setSvcHeroAlt(coverAltOf(svc.seoData))
      setSvcOrder(String(svc.order ?? 0))
      setSvcFeatured(Boolean(svc.featured))
      setSvcStatus(svc.status || 'draft')

      const blocksParsed = parseJsonValue<unknown>(svc.blocks, [])
      setSvcBlocks(Array.isArray(blocksParsed) ? blocksParsed : [])

      setSeoTitle(svc.metaTitle || svc.name)
      setMetaDesc(svc.metaDescription || svc.shortDescription || '')
      setFocusKeyphrase(svc.focusKeyphrase || svc.name)
      const svcKeyphrases = parseJsonValue<unknown>(svc.relatedKeyphrases, [])
      setRelatedKeyphrases(Array.isArray(svcKeyphrases) ? svcKeyphrases : [])
      setCanonicalUrl(`${siteConfig.url}/services/${svc.slug}`)
      // Keep the saved links; saving sends this list back, so it must start from the DB.
      setSvcSelectedPortfolios(Array.isArray(svc.portfolioIds) ? svc.portfolioIds : [])
    } else {
      setSvcId(null)
      setSvcSlug('')
      setSvcName('')
      setSvcCategoryId(categories[0]?.id || null)
      setSvcIndexNumber('01')
      setSvcCategoryBadge(categories[0]?.title || '')
      setSvcHighlightWord('')
      setSvcShortDesc('')
      setSvcWhatsappPrompt('Halo SPATIUM, saya ingin konsultasi layanan.')
      setSvcHeroImage('')
      setSvcHeroAlt('')
      setSvcOrder(String(services.length + 1))
      setSvcFeatured(false)
      setSvcStatus('draft')
      setSvcBlocks([])
      setSvcSelectedPortfolios([])
      setSeoTitle('')
      setMetaDesc('')
      setFocusKeyphrase('')
      setRelatedKeyphrases([])
      setCanonicalUrl('')
    }
    setEditorMode(true)
  }

  // Save Department
  const handleSaveDepartment = async () => {
    if (!depSlug.trim() || !depTitle.trim()) {
      setErrorMessage('Slug dan Judul Departemen wajib diisi.')
      return
    }

    setSaving(true)
    setSaveMessage('')
    setErrorMessage('')
    try {
      const res = await fetch('/api/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: depId,
          slug: depSlug.trim().toLowerCase(),
          title: depTitle.trim(),
          tag: depTag.trim(),
          shortDescription: depShortDesc.trim(),
          heroImage: depHeroImage,
          themePreset: depThemePreset,
          order: parseInt(depOrder, 10) || 0,
          status: depStatus,
          showInNav: depShowInNav,
          blocks: depBlocks,
          metaTitle: seoTitle,
          metaDescription: metaDesc,
          focusKeyphrase,
          relatedKeyphrases,
          seoData: { coverAlt: depHeroAlt.trim() },
        }),
      })

      const json = await res.json()
      if (json.success) {
        if (typeof json.data?.id === 'number') setDepId(json.data.id)
        setSaveMessage('Departemen berhasil disimpan!')
        fetchData()
        setTimeout(() => setEditorMode(false), 1200)
      } else {
        setErrorMessage(apiErrorMessage(json, 'Gagal menyimpan departemen.'))
      }
    } catch (err) {
      console.error('[Services] department save failed:', err)
      setErrorMessage('Terjadi kesalahan jaringan saat menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  // Save Service
  const handleSaveService = async () => {
    if (!svcSlug.trim() || !svcName.trim()) {
      setErrorMessage('Nama dan Slug Layanan wajib diisi.')
      return
    }

    setSaving(true)
    setSaveMessage('')
    setErrorMessage('')
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: svcId,
          slug: svcSlug.trim().toLowerCase(),
          name: svcName.trim(),
          categoryId: svcCategoryId,
          indexNumber: svcIndexNumber,
          categoryBadge: svcCategoryBadge,
          highlightWord: svcHighlightWord,
          shortDescription: svcShortDesc.trim(),
          whatsappPrompt: svcWhatsappPrompt,
          heroImage: svcHeroImage,
          order: parseInt(svcOrder, 10) || 0,
          featured: svcFeatured,
          status: svcStatus,
          blocks: svcBlocks,
          portfolioIds: svcSelectedPortfolios,
          metaTitle: seoTitle,
          metaDescription: metaDesc,
          focusKeyphrase,
          relatedKeyphrases,
          seoData: { coverAlt: svcHeroAlt.trim() },
        }),
      })

      const json = await res.json()
      if (json.success) {
        if (typeof json.id === 'number') setSvcId(json.id)
        setSaveMessage('Layanan berhasil disimpan!')
        fetchData()
        setTimeout(() => setEditorMode(false), 1200)
      } else {
        setErrorMessage(apiErrorMessage(json, 'Gagal menyimpan layanan.'))
      }
    } catch (err) {
      console.error('[Services] service save failed:', err)
      setErrorMessage('Terjadi kesalahan jaringan saat menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  // Delete Department
  const handleDeleteDepartment = async (id: number, title: string) => {
    if (!confirm(`Hapus Departemen "${title}"? Seluruh sub-layanan di bawahnya akan kehilangan kategori.`)) return
    try {
      const res = await fetch(`/api/service-categories?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setListStatus(`Departemen "${title}" berhasil dihapus.`)
        fetchData()
      } else {
        setListStatus(apiErrorMessage(json, 'Gagal menghapus departemen.'))
      }
    } catch (err) {
      console.error('[Services] department delete failed:', err)
      setListStatus('Gagal menghapus departemen.')
    }
  }

  // Delete Service
  const handleDeleteService = async (id: number, name: string) => {
    if (!confirm(`Hapus Layanan "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setListStatus(`Layanan "${name}" berhasil dihapus.`)
        fetchData()
      } else {
        setListStatus(apiErrorMessage(json, 'Gagal menghapus layanan.'))
      }
    } catch (err) {
      console.error('[Services] service delete failed:', err)
      setListStatus('Gagal menghapus layanan.')
    }
  }

  // Current content text for Yoast Readability evaluation
  const currentContentText =
    editingType === 'department' ? blocksToPlainText(depBlocks) : blocksToPlainText(svcBlocks)

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 1: FULL STUDIO BLOCK BUILDER & SEO INSPECTOR (DEDICATED FULLSCREEN LAYOUT)
  // ─────────────────────────────────────────────────────────────────────────────
  if (editorMode) {
    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#0D0D0D] text-white antialiased selection:bg-[#4d8bff] selection:text-black">
        {/* Top Dedicated Studio Master Header */}
        <header className="h-14 shrink-0 px-4 sm:px-6 bg-[var(--studio-sidebar-bg)] border-b border-white/[0.08] flex items-center justify-between gap-3 z-30 select-none">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-[45%] md:max-w-[50%]">
            <Tooltip label="Kembali" hint="Kembali ke Daftar Layanan" side="bottom">
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
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#4d8bff]/15 border border-[#4d8bff]/40 text-[#4d8bff] uppercase tracking-wider shrink-0">
                <Layers className="w-3 h-3 text-[#4d8bff]" />
                <span className="hidden sm:inline">{editingType === 'department' ? 'DEPARTEMEN' : 'LAYANAN'}</span>
              </span>
              <span className="text-xs text-neutral-600 hidden sm:inline shrink-0">/</span>
              <h2 className="font-syne text-xs sm:text-sm font-bold text-white truncate" title={editingType === 'department' ? depTitle || 'Departemen Baru' : svcName || 'Layanan Baru'}>
                {editingType === 'department' ? depTitle || 'Departemen Baru' : svcName || 'Layanan Baru'}
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
              <span role="status" className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 motion-safe:animate-pulse hidden lg:inline-flex">
                <CheckCircle2 className="w-3.5 h-3.5" />
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

            <Tooltip label="Simpan Halaman" hint={!isBlocksValid ? `Ada ${blockIssues.length} isu skema blok` : 'Simpan susunan blok ke database'} side="bottom">
              <button
                type="button"
                onClick={editingType === 'department' ? handleSaveDepartment : handleSaveService}
                disabled={saving || !isBlocksValid}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-[0_0_15px_rgba(77, 139, 255,0.25)] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Halaman'}</span>
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
              blocks={editingType === 'department' ? depBlocks : svcBlocks}
              onChangeBlocks={editingType === 'department' ? setDepBlocks : setSvcBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              targetType={editingType}
              contextData={{
                portfolios: allPortfolios,
                subServices: editingType === 'department' ? services.filter((s) => s.categoryId === depId) : undefined,
              }}
              draftId={editingType === 'department' ? `category-${depId ?? 'new'}` : `service-${svcId ?? 'new'}`}
              onSave={editingType === 'department' ? handleSaveDepartment : handleSaveService}
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

                      {editingType === 'department' ? (
                        <>
                          <div>
                            <label htmlFor="dep-title-input" className="block text-xs font-mono text-neutral-400 mb-1">Judul Departemen</label>
                            <input
                              id="dep-title-input"
                              name="depTitle"
                              aria-label="Judul Departemen"
                              type="text"
                              value={depTitle}
                              onChange={(e) => {
                                setDepTitle(e.target.value)
                                if (!depId) {
                                  setDepSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                                  setSeoTitle(`${e.target.value} — SPATIUM`)
                                  setFocusKeyphrase(e.target.value)
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="dep-slug-input" className="block text-xs font-mono text-neutral-400 mb-1">Slug URL (/services/...)</label>
                            <input
                              id="dep-slug-input"
                              name="depSlug"
                              aria-label="Slug URL"
                              type="text"
                              value={depSlug}
                              onChange={(e) => setDepSlug(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label htmlFor="dep-tag-input" className="block text-xs font-mono text-neutral-400 mb-1">Tagline Badge</label>
                            <input
                              id="dep-tag-input"
                              name="depTag"
                              aria-label="Tagline Badge"
                              type="text"
                              value={depTag}
                              onChange={(e) => setDepTag(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label htmlFor="dep-desc-input" className="block text-xs font-mono text-neutral-400 mb-1">Deskripsi Singkat</label>
                            <textarea
                              id="dep-desc-input"
                              name="depShortDesc"
                              aria-label="Deskripsi Singkat"
                              value={depShortDesc}
                              onChange={(e) => {
                                setDepShortDesc(e.target.value)
                                setMetaDesc(e.target.value)
                              }}
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                            />
                          </div>
                          <div className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                            <div className="flex items-center justify-between">
                              <label htmlFor="dep-hero-input" className="text-xs font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-accent-400" />
                                <span>Cover Image Departemen</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaPickerTarget('dep')
                                  setMediaPickerOpen(true)
                                }}
                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-white flex items-center gap-1"
                              >
                                <Layers className="w-3 h-3 text-info" />
                                <span>Galeri Media</span>
                              </button>
                            </div>
                            <input
                              id="dep-hero-input"
                              name="depHeroImage"
                              aria-label="Cover Image"
                              type="text"
                              value={depHeroImage}
                              onChange={(e) => setDepHeroImage(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-xs font-mono"
                              placeholder="/images/nav/..."
                            />
                            <div className="space-y-1 pt-1 border-t border-white/5">
                              <div className="flex items-center justify-between">
                                <label htmlFor={`${fieldId}-sv1`} className="text-[11px] font-mono text-neutral-400">Alt Text [ID] (Wajib Publikasi)</label>
                                <span className={`text-[10px] font-mono ${depHeroAlt.length > 125 ? 'text-red-400' : 'text-neutral-500'}`}>{depHeroAlt.length}/125</span>
                              </div>
                              <input id={`${fieldId}-sv1`}
                                type="text"
                                value={depHeroAlt}
                                onChange={(e) => setDepHeroAlt(e.target.value)}
                                placeholder="Deskripsi gambar departemen..."
                                className="w-full px-3 py-1.5 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                            <label htmlFor="dep-nav-checkbox" className="cursor-pointer">
                              <span className="block text-xs font-medium text-white">Tampilkan di Mega-Menu Header</span>
                              <span className="block text-[11px] text-neutral-400">Otomatis sync dengan navbar atas</span>
                            </label>
                            <input
                              id="dep-nav-checkbox"
                              name="depShowInNav"
                              aria-label="Tampilkan di Mega-Menu Header"
                              type="checkbox"
                              checked={depShowInNav}
                              onChange={(e) => setDepShowInNav(e.target.checked)}
                              className="w-4 h-4 rounded text-[#4d8bff] accent-[#4d8bff]"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label htmlFor="svc-name-input" className="block text-xs font-mono text-neutral-400 mb-1">Nama Layanan</label>
                            <input
                              id="svc-name-input"
                              name="svcName"
                              aria-label="Nama Layanan"
                              type="text"
                              value={svcName}
                              onChange={(e) => {
                                setSvcName(e.target.value)
                                if (!svcId) {
                                  setSvcSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                                  setSeoTitle(`${e.target.value} — Layanan SPATIUM`)
                                  setFocusKeyphrase(e.target.value)
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="svc-cat-select" className="block text-xs font-mono text-neutral-400 mb-1">Departemen Spesialisasi (Parent)</label>
                            <select
                              id="svc-cat-select"
                              name="svcCategoryId"
                              aria-label="Departemen Spesialisasi (Parent)"
                              value={svcCategoryId || ''}
                              onChange={(e) => {
                                const catId = Number(e.target.value) || null
                                setSvcCategoryId(catId)
                                const selected = categories.find((c) => c.id === catId)
                                if (selected) setSvcCategoryBadge(selected.title)
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                            >
                              <option value="">Pilih Departemen...</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="svc-slug-input" className="block text-xs font-mono text-neutral-400 mb-1">Slug URL (/services/...)</label>
                            <input
                              id="svc-slug-input"
                              name="svcSlug"
                              aria-label="Slug URL"
                              type="text"
                              value={svcSlug}
                              onChange={(e) => setSvcSlug(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label htmlFor="svc-wa-input" className="block text-xs font-mono text-neutral-400 mb-1">WhatsApp Prompt Pesan</label>
                            <input
                              id="svc-wa-input"
                              name="svcWhatsappPrompt"
                              aria-label="WhatsApp Prompt Pesan"
                              type="text"
                              value={svcWhatsappPrompt}
                              onChange={(e) => setSvcWhatsappPrompt(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                            />
                          </div>

                          {/* Cover Image Layanan */}
                          <div className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                            <div className="flex items-center justify-between">
                              <label htmlFor="svc-hero-input" className="text-xs font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-accent-400" />
                                <span>Cover Image Layanan</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaPickerTarget('svc')
                                  setMediaPickerOpen(true)
                                }}
                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-white flex items-center gap-1"
                              >
                                <Layers className="w-3 h-3 text-info" />
                                <span>Galeri Media</span>
                              </button>
                            </div>
                            <input
                              id="svc-hero-input"
                              name="svcHeroImage"
                              aria-label="Cover Image"
                              type="text"
                              value={svcHeroImage}
                              onChange={(e) => setSvcHeroImage(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-xs font-mono"
                              placeholder="/images/nav/..."
                            />
                            <div className="space-y-1 pt-1 border-t border-white/5">
                              <div className="flex items-center justify-between">
                                <label htmlFor={`${fieldId}-sv2`} className="text-[11px] font-mono text-neutral-400">Alt Text [ID] (Wajib Publikasi)</label>
                                <span className={`text-[10px] font-mono ${svcHeroAlt.length > 125 ? 'text-red-400' : 'text-neutral-500'}`}>{svcHeroAlt.length}/125</span>
                              </div>
                              <input id={`${fieldId}-sv2`}
                                type="text"
                                value={svcHeroAlt}
                                onChange={(e) => setSvcHeroAlt(e.target.value)}
                                placeholder="Deskripsi gambar layanan..."
                                className="w-full px-3 py-1.5 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-xs"
                              />
                            </div>
                          </div>

                          {/* Relational Portfolio Multi-Picker */}
                          <div>
                            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                              Hubungkan dengan Portofolio ({svcSelectedPortfolios.length} dipilih)
                            </label>
                            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[var(--studio-bg)] border border-white/10">
                              {allPortfolios.length === 0 ? (
                                <p className="text-xs text-neutral-500 p-2">Tidak ada portofolio tersedia.</p>
                              ) : (
                                allPortfolios.map((p) => {
                                  const isChecked = svcSelectedPortfolios.includes(p.id)
                                  return (
                                    <label
                                      key={p.id}
                                      htmlFor={`svc-portfolio-${p.id}`}
                                      className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                                        isChecked
                                          ? 'bg-[#4d8bff]/15 text-[#4d8bff]'
                                          : 'text-neutral-300 hover:bg-white/5'
                                      }`}
                                    >
                                      <input
                                        id={`svc-portfolio-${p.id}`}
                                        name={`portfolio-${p.id}`}
                                        aria-label={p.title}
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSvcSelectedPortfolios([...svcSelectedPortfolios, p.id])
                                          } else {
                                            setSvcSelectedPortfolios(
                                              svcSelectedPortfolios.filter((id) => id !== p.id)
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
                        </>
                      )}

                      <div>
                        <label htmlFor="pub-status-select" className="block text-xs font-mono text-neutral-400 mb-1">Status Publikasi</label>
                        <select
                          id="pub-status-select"
                          name="publicationStatus"
                          aria-label="Status Publikasi"
                          value={editingType === 'department' ? depStatus : svcStatus}
                          onChange={(e: any) =>
                            editingType === 'department'
                              ? setDepStatus(e.target.value)
                              : setSvcStatus(e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-white text-sm"
                        >
                          <option value="draft">Draft</option>
                          <option value="in_review">In Review</option>
                          <option value="approved">Approved</option>
                          <option
                            value="published"
                            disabled={
                              !can(editingType === 'department' ? 'service-category:publish' : 'service:publish') &&
                              (editingType === 'department' ? depStatus : svcStatus) !== 'published'
                            }
                          >
                            Published
                          </option>
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
                        articleTitle={editingType === 'department' ? depTitle : svcName}
                        articleExcerpt={editingType === 'department' ? depShortDesc : svcShortDesc}
                        content={currentContentText}
                        category={
                          editingType === 'department'
                            ? depTag || 'Departemen'
                            : svcCategoryBadge || 'Layanan'
                        }
                        slug={editingType === 'department' ? depSlug : svcSlug}
                        onChangeSlug={editingType === 'department' ? setDepSlug : setSvcSlug}
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
                        breadcrumbTitle={editingType === 'department' ? depTitle : svcName}
                        onChangeBreadcrumbTitle={() => {}}
                        schemaType="TechArticle"
                        onChangeSchemaType={() => {}}
                        robots={robots}
                        onChangeRobots={setRobots}
                        socialOg={socialOg}
                        onChangeSocialOg={setSocialOg}
                        socialTwitter={socialTwitter}
                        onChangeSocialTwitter={setSocialTwitter}
                        coverUrl={editingType === 'department' ? depHeroImage : svcHeroImage}
                        coverAlt={editingType === 'department' ? depHeroAlt : svcHeroAlt}
                        onChangeCoverAlt={editingType === 'department' ? setDepHeroAlt : setSvcHeroAlt}
                        onChangeCoverUrl={editingType === 'department' ? setDepHeroImage : setSvcHeroImage}
                        onOpenMediaPickerForCover={() => {
                          setMediaPickerTarget(editingType === 'department' ? 'dep' : 'svc')
                          setMediaPickerOpen(true)
                        }}
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
            if (mediaPickerTarget === 'dep') {
              setDepHeroImage(url)
              if (!depHeroAlt && item?.name) {
                const cleaned = item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
                setDepHeroAlt(`${depTitle || 'Departemen'} - ${cleaned}`)
              }
            } else {
              setSvcHeroImage(url)
              if (!svcHeroAlt && item?.name) {
                const cleaned = item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
                setSvcHeroAlt(`${svcName || 'Layanan'} - ${cleaned}`)
              }
            }
            setMediaPickerOpen(false)
          }}
          currentUrl={mediaPickerTarget === 'dep' ? depHeroImage : svcHeroImage}
          title={`Pilih Media Cover ${mediaPickerTarget === 'dep' ? 'Departemen' : 'Layanan'}`}
        />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 2: LIST DASHBOARD (DEPARTEMEN & LAYANAN HIERARCHICAL VIEW)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <p role="status" className={listStatus ? 'text-xs font-mono text-neutral-300' : 'sr-only'}>
        {listStatus}
      </p>
      {/* Compact Switcher & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-surface-overlay border border-white/10 shadow-sm">
        {/* Tabs Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              activeTab === 'departments'
                ? 'bg-[#4d8bff] text-[#191919] font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Departemen ({categories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              activeTab === 'services'
                ? 'bg-[#4d8bff] text-[#191919] font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layanan ({services.length})</span>
          </button>
        </div>

        {/* Action Button */}
        <div>
          {activeTab === 'departments' ? (
            can('service-category:create') && (
            <Tooltip label="Tambah Departemen" hint="Buat kategori departemen spesialisasi baru">
              <button
                type="button"
                onClick={() => handleEditDepartment()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Departemen</span>
              </button>
            </Tooltip>
            )
          ) : (
            can('service:create') && (
            <Tooltip label="Tambah Layanan" hint="Buat layanan rekayasa baru di bawah departemen">
              <button
                type="button"
                onClick={() => handleEditService()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Layanan</span>
              </button>
            </Tooltip>
            )
          )}
        </div>
      </div>

      {/* TAB 1: DEPARTMENTS LIST */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map((cat) => {
            const childCount = services.filter((s) => s.categoryId === cat.id).length
            return (
              <div
                key={cat.id}
                className="p-6 rounded-3xl bg-surface-overlay border border-white/10 hover:border-[#4d8bff]/40 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] text-[#4d8bff] uppercase px-2.5 py-0.5 rounded-full bg-[#4d8bff]/10 border border-[#4d8bff]/20 font-semibold truncate">
                      {cat.tag || 'SPESIALISASI'}
                    </span>
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
                      <span>{childCount} Layanan</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{cat.status}</span>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white group-hover:text-[#4d8bff] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {cat.shortDescription}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
                    <span className="px-2 py-0.5 rounded bg-white/5">/{cat.slug}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">
                      {(() => {
                        if (Array.isArray(cat.blocks)) return cat.blocks.length
                        if (typeof cat.blocks === 'string') {
                          const parsed = parseJsonValue<unknown>(cat.blocks, [])
                          return Array.isArray(parsed) ? parsed.length : 0
                        }
                        return 0
                      })()} Blok
                    </span>
                    {cat.showInNav && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Mega-Menu Header
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <a
                    href={`${siteConfig.url}/services`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white"
                  >
                    <span>Lihat Halaman</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-2">
                    {can('service-category:update') && (
                    <button
                      type="button"
                      onClick={() => handleEditDepartment(cat)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#4d8bff] hover:bg-white/10"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit & Blok</span>
                    </button>
                    )}
                    {can('service-category:delete') && (
                    <button aria-label={`Hapus departemen ${cat.title}`}
                      type="button"
                      onClick={() => handleDeleteDepartment(cat.id, cat.title)}
                      className="p-1.5 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Hapus Departemen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 2: SERVICES LIST (GROUPED BY DEPARTMENT) */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catServices = services.filter((s) => s.categoryId === cat.id)
            return (
              <div
                key={cat.id}
                className="p-6 rounded-3xl bg-surface-overlay border border-white/10 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="font-mono text-[10px] text-[#4d8bff] uppercase font-semibold">
                      DEPARTEMEN
                    </span>
                    <h2 className="font-display text-base sm:text-lg font-bold text-white">
                      {cat.title}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-neutral-400">
                    {catServices.length} Layanan Terdaftar
                  </span>
                </div>

                {catServices.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3">
                    Belum ada layanan di bawah departemen ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catServices.map((svc) => (
                      <div
                        key={svc.id}
                        className="p-4 rounded-2xl bg-[var(--studio-sidebar-bg)] border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                            <span>#{svc.indexNumber || '01'}</span>
                            <span className="text-emerald-400 font-semibold">{svc.status}</span>
                          </div>
                          <h4 className="font-display font-bold text-sm text-white line-clamp-1">
                            {svc.name}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                            {svc.shortDescription}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                          <a
                            href={`${siteConfig.url}/services/${svc.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <div className="flex items-center gap-1.5">
                            {can('service:update') && (
                            <button
                              type="button"
                              onClick={() => handleEditService(svc)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#4d8bff] hover:bg-white/10"
                            >
                              Edit
                            </button>
                            )}
                            {can('service:delete') && (
                            <button aria-label={`Hapus layanan ${svc.name}`}
                              type="button"
                              onClick={() => handleDeleteService(svc.id, svc.name)}
                              className="p-1 rounded text-neutral-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
