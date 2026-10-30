'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Sparkles,
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
import StudioBlockProperties from './StudioBlockProperties'
import { Tooltip } from '@/components/ui/Tooltip'
import StudioSeoInspector from './StudioSeoInspector'
import MediaPickerModal from './MediaPickerModal'
import { StudioAiSidebar } from './StudioAiSidebar'
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

export function StudioSolutionsManager() {
  const [activeTab, setActiveTab] = useState<'solutions' | 'finder'>('solutions')
  const [solutions, setSolutions] = useState<any[]>([])
  const [allPortfolios, setAllPortfolios] = useState<any[]>([])
  const [finderConfig, setFinderConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Full Studio Editor Mode
  const [editorMode, setEditorMode] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<StudioViewMode>('canvas')
  const [aiOpen, setAiOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [activeInspectorTab, setActiveInspectorTab] = useState<'meta' | 'seo'>('meta')

  // Panels & Selection State (Max 2 panels: Visual Editor + Inspector)
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // Solution Form State
  const [solId, setSolId] = useState<number | null>(null)
  const [solSlug, setSolSlug] = useState('')
  const [solTitle, setSolTitle] = useState('')
  const [solCategory, setSolCategory] = useState('taxonomy')
  const [solShortDesc, setSolShortDesc] = useState('')
  const [solDesc, setSolDesc] = useState('')
  const [solHeroImage, setSolHeroImage] = useState('/images/solutions/default.jpg')
  const [solHeroAlt, setSolHeroAlt] = useState('Solusi Rekayasa Digital & Arsitektur Terintegrasi SegiaTech')
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [solOrder, setSolOrder] = useState('0')
  const [solFeatured, setSolFeatured] = useState(false)
  const [solStatus, setSolStatus] = useState<'draft' | 'in_review' | 'approved' | 'published' | 'archived'>('published')
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
      if (resConfig.success && resConfig.data) setFinderConfig(resConfig.data)
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
    if (sol) {
      setSolId(sol.id)
      setSolSlug(sol.slug)
      setSolTitle(sol.title)
      setSolCategory(sol.category || 'taxonomy')
      setSolShortDesc(sol.shortDescription || '')
      setSolDesc(sol.description || '')
      setSolHeroImage(sol.heroImage || '/images/solutions/default.jpg')
      setSolHeroAlt(sol.heroAlt || (sol.title ? `${sol.title} - Solusi Rekayasa SegiaTech` : 'Solusi Rekayasa SegiaTech'))
      setSolOrder(String(sol.order ?? 0))
      setSolFeatured(Boolean(sol.featured))
      setSolStatus(sol.status || 'published')
      setSolBlocks(Array.isArray(sol.blocks) ? sol.blocks : [])
      setSolSelectedPortfolios([])

      setSeoTitle(sol.metaTitle || sol.title)
      setMetaDesc(sol.metaDescription || sol.shortDescription || '')
      setFocusKeyphrase(sol.focusKeyphrase || sol.title)
      setRelatedKeyphrases(sol.relatedKeyphrases || [])
      setCanonicalUrl(sol.canonicalUrl || `https://www.segiatech.com/solusi/${sol.slug}`)
    } else {
      setSolId(null)
      setSolSlug('')
      setSolTitle('')
      setSolCategory('taxonomy')
      setSolShortDesc('')
      setSolDesc('')
      setSolHeroImage('/images/solutions/default.jpg')
      setSolHeroAlt('Solusi Rekayasa Digital & Arsitektur Terintegrasi SegiaTech')
      setSolOrder(String(solutions.length + 1))
      setSolFeatured(false)
      setSolStatus('published')
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
      alert('Judul dan Slug Solusi wajib diisi.')
      return
    }

    setSaving(true)
    setSaveMessage('')
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
        }),
      })

      const json = await res.json()
      if (json.success) {
        setSaveMessage('Solusi berhasil disimpan!')
        fetchData()
        setTimeout(() => setEditorMode(false), 1200)
      } else {
        alert(json.error || 'Gagal menyimpan solusi.')
      }
    } catch {
      alert('Terjadi kesalahan jaringan.')
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
        fetchData()
      } else {
        alert(json.error || 'Gagal menghapus solusi.')
      }
    } catch {
      alert('Gagal menghapus solusi.')
    }
  }

  // Selected Block Handlers
  const currentSelectedBlock = solBlocks.find((b) => b.id === selectedBlockId) || null

  const handleUpdateSelectedBlock = (updatedBlock: StudioBlock) => {
    setSolBlocks((prev) => prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)))
  }

  const handleMoveBlock = (direction: 'up' | 'down') => {
    if (!selectedBlockId) return
    const currentBlocks = [...solBlocks]
    const idx = currentBlocks.findIndex((b) => b.id === selectedBlockId)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= currentBlocks.length) return
    const temp = currentBlocks[idx]
    currentBlocks[idx] = currentBlocks[targetIdx]
    currentBlocks[targetIdx] = temp
    setSolBlocks(currentBlocks)
  }

  const handleDuplicateSelectedBlock = () => {
    if (!selectedBlockId) return
    const currentBlocks = [...solBlocks]
    const idx = currentBlocks.findIndex((b) => b.id === selectedBlockId)
    if (idx === -1) return
    const cloned = {
      ...JSON.parse(JSON.stringify(currentBlocks[idx])),
      id: `blk-${Date.now()}`,
    }
    currentBlocks.splice(idx + 1, 0, cloned)
    setSolBlocks(currentBlocks)
    setSelectedBlockId(cloned.id)
  }

  const handleDeleteSelectedBlock = () => {
    if (!selectedBlockId) return
    if (confirm('Hapus blok ini?')) {
      setSolBlocks((prev) => prev.filter((b) => b.id !== selectedBlockId))
      setSelectedBlockId(null)
    }
  }

  // Save Quiz Config
  const handleSaveFinderConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/solution-finder-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finderConfig),
      })
      const json = await res.json()
      if (json.success) {
        alert('Konfigurasi Solution Finder berhasil disimpan!')
      }
    } catch {
      alert('Gagal menyimpan konfigurasi.')
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
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#0D0D0D] text-white antialiased selection:bg-[#F2C7A0] selection:text-black">
        {/* Top Dedicated Studio Master Header */}
        <header className="h-14 shrink-0 px-4 sm:px-6 bg-[#161616] border-b border-white/[0.08] flex items-center justify-between gap-3 z-30 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <Tooltip label="Kembali" hint="Kembali ke Daftar Solusi" side="bottom">
              <button
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
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-500/15 border border-sky-500/40 text-sky-300 uppercase tracking-wider">
                  <Compass className="w-3 h-3 text-sky-400" />
                  PAKET SOLUSI TERINTEGRASI
                </span>
                {solCategory && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-neutral-400 border border-white/10 hidden sm:inline-block">
                    {solCategory}
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline-block uppercase">
                  {solStatus}
                </span>
              </div>
              <h2 className="font-display text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {solTitle || 'Solusi Baru'}
              </h2>
            </div>
          </div>

          {/* Center: Segmented View Switcher (Kanvas, Split, Pratinjau) */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/10 text-xs shrink-0">
            <Tooltip label="Mode Kanvas" hint="Editor visual menyusun blok langsung" side="bottom">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  viewMode === 'canvas'
                    ? 'bg-white/20 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <PenSquare className="w-3.5 h-3.5 text-[#F2C7A0]" />
                <span className="hidden sm:inline">Kanvas</span>
              </button>
            </Tooltip>
            <Tooltip label="Mode Split" hint="Kanvas & pratinjau bersandingan" side="bottom">
              <button
                type="button"
                onClick={() => setViewMode('split-preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  viewMode === 'split-preview'
                    ? 'bg-white/20 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Split</span>
              </button>
            </Tooltip>
            <Tooltip label="Pratinjau Penuh" hint="Pratinjau 100% rasio web publik" side="bottom">
              <button
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
            {/* AI Copilot Drawer Toggle */}
            <Tooltip label="AI Copilot" hint="Asisten AI penyusun blok & copy kontekstual" side="bottom">
              <button
                type="button"
                onClick={() => setAiOpen(!aiOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  aiOpen
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:border-sky-500/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden lg:inline">AI Copilot</span>
              </button>
            </Tooltip>

            {/* Toggle Inspector / Properties Panel */}
            {viewMode !== 'full-preview' && (
              <Tooltip label={showPropertiesDrawer ? 'Tutup Panel' : 'Buka Panel'} hint="Panel pengaturan blok & SEO" side="bottom">
                <button
                  type="button"
                  onClick={() => setShowPropertiesDrawer(!showPropertiesDrawer)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    showPropertiesDrawer
                      ? 'bg-[#F2C7A0]/20 border-[#F2C7A0]/50 text-[#F2C7A0]'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{showPropertiesDrawer ? 'Tutup Panel' : 'Panel'}</span>
                </button>
              </Tooltip>
            )}

            {saveMessage && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-pulse hidden lg:inline-flex">
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
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#F2C7A0] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#ebd5c1] transition-all shadow-[0_0_15px_rgba(242,199,160,0.25)] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Solusi'}</span>
              </button>
            </Tooltip>
          </div>
        </header>

        {/* Dedicated Fullscreen Workspace: Left Visual Editor • Right Contextual Inspector */}
        <div className="relative flex-1 min-h-0 w-full flex overflow-hidden">
          {/* 1. MAIN PANEL: WYSIWYG Live Visual Editor */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
            <StudioVisualEditor
              blocks={solBlocks}
              onChangeBlocks={setSolBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={(id) => {
                setSelectedBlockId(id)
                if (id) setShowPropertiesDrawer(true)
              }}
              targetType="solution"
              contextData={{ portfolios: allPortfolios }}
              title={solTitle}
              slug={solSlug}
              onToggleInspector={() => setShowPropertiesDrawer(!showPropertiesDrawer)}
              isInspectorOpen={showPropertiesDrawer}
              onValidationChange={handleBlockValidation}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* 2. DOCKED RIGHT PANEL: Contextual Inspector (Block Properties / Document / SEO) */}
          {showPropertiesDrawer && viewMode !== 'full-preview' && (
            <aside className="w-full sm:w-[380px] xl:w-[420px] shrink-0 border-l border-white/[0.08] bg-[#141414] h-full overflow-y-auto z-20 flex flex-col p-4 space-y-4">
              {selectedBlockId && currentSelectedBlock ? (
                <div className="rounded-2xl overflow-hidden border border-white/10 flex-1 min-h-[500px]">
                  <StudioBlockProperties
                    block={currentSelectedBlock}
                    onUpdateBlock={handleUpdateSelectedBlock}
                    onDeselect={() => setSelectedBlockId(null)}
                    onMoveUp={() => handleMoveBlock('up')}
                    onMoveDown={() => handleMoveBlock('down')}
                    onDuplicate={handleDuplicateSelectedBlock}
                    onDelete={handleDeleteSelectedBlock}
                    allPortfolios={allPortfolios}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tab Switcher: Meta vs SEO */}
                  <div className="flex rounded-2xl bg-[#1e1e1e] p-1 border border-white/10 shadow-md">
                    <button
                      type="button"
                      onClick={() => setActiveInspectorTab('meta')}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-xl transition-all ${
                        activeInspectorTab === 'meta'
                          ? 'bg-[#F2C7A0] text-[#191919] shadow font-bold'
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
                          ? 'bg-[#F2C7A0] text-[#191919] shadow font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      SEO (Yoast)
                    </button>
                  </div>

                  {/* TAB A: Dokumen & Relasi */}
                  {activeInspectorTab === 'meta' && (
                    <div className="p-5 rounded-3xl bg-[#1e1e1e] border border-white/10 space-y-4 shadow-xl">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-neutral-400">
                        💡 <strong>Tip:</strong> Klik salah satu blok di kanvas tengah untuk mengedit properties blok secara langsung di panel ini.
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Solusi</label>
                        <input
                          type="text"
                          value={solTitle}
                          onChange={(e) => {
                            setSolTitle(e.target.value)
                            if (!solId) {
                              setSolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                              setSeoTitle(`${e.target.value} — Solusi SegiaTech`)
                              setFocusKeyphrase(e.target.value)
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Kategori Solusi</label>
                        <select
                          value={solCategory}
                          onChange={(e) => setSolCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-sm"
                        >
                          <option value="taxonomy">Taxonomy Bisnis</option>
                          <option value="venue">Venue & Destinasi</option>
                          <option value="enterprise">Enterprise Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Slug URL (/solusi/...)</label>
                        <input
                          type="text"
                          value={solSlug}
                          onChange={(e) => setSolSlug(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Deskripsi Singkat</label>
                        <textarea
                          value={solShortDesc}
                          onChange={(e) => {
                            setSolShortDesc(e.target.value)
                            setMetaDesc(e.target.value)
                          }}
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-sm"
                        />
                      </div>
                      {/* Cover Hero Image & Alt Text */}
                      <div className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-accent-400" />
                            <span>Cover Hero Image Solusi</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setMediaPickerOpen(true)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-white flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3 text-sky-400" />
                            <span>Galeri Media</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={solHeroImage}
                          onChange={(e) => setSolHeroImage(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
                          placeholder="/images/solutions/..."
                        />
                        <div className="space-y-1 pt-1 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono text-neutral-400">Alt Text [ID] (Wajib Publikasi)</label>
                            <span className={`text-[10px] font-mono ${solHeroAlt.length > 125 ? 'text-red-400' : 'text-neutral-500'}`}>{solHeroAlt.length}/125</span>
                          </div>
                          <input
                            type="text"
                            value={solHeroAlt}
                            onChange={(e) => setSolHeroAlt(e.target.value)}
                            placeholder="Deskripsi gambar solusi..."
                            className="w-full px-3 py-1.5 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Relasi Portofolio */}
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                          Hubungkan Bukti Portofolio ({solSelectedPortfolios.length} dipilih)
                        </label>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#141414] border border-white/10">
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
                                      ? 'bg-[#F2C7A0]/15 text-[#F2C7A0]'
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
                                    className="rounded text-[#F2C7A0] accent-[#F2C7A0]"
                                  />
                                  <span className="truncate">{p.title}</span>
                                </label>
                              )
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-neutral-400 mb-1">Status Publikasi</label>
                        <select
                          value={solStatus}
                          onChange={(e: any) => setSolStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-sm"
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
                    <div className="rounded-3xl bg-[#1e1e1e] border border-white/10 overflow-hidden shadow-xl">
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

        {/* Studio AI Copilot Drawer */}
        {aiOpen && (
          <StudioAiSidebar
            isOpen={aiOpen}
            onClose={() => setAiOpen(false)}
            variant="drawer"
            pageContext={{
              title: solTitle,
              slug: solSlug,
              status: solStatus,
              category: solCategory,
            }}
          />
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 2: LIST DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Compact Switcher & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('solutions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              activeTab === 'solutions'
                ? 'bg-[#F2C7A0] text-[#191919] font-bold shadow-sm'
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
                ? 'bg-[#F2C7A0] text-[#191919] font-bold shadow-sm'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2C7A0] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#ebd5c1] transition-all shadow-sm"
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
              className="p-5 rounded-3xl bg-[#1e1e1e] border border-white/10 hover:border-[#F2C7A0]/40 transition-all flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
                  <span className="text-[#F2C7A0] font-semibold uppercase">{sol.category}</span>
                  <span className="text-emerald-400 font-semibold">{sol.status}</span>
                </div>
                <h3 className="font-display text-base font-bold text-white group-hover:text-[#F2C7A0] transition-colors">
                  {sol.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {sol.shortDescription}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-white/5">/{sol.slug}</span>
                  <span className="px-2 py-0.5 rounded bg-white/5">
                    {Array.isArray(sol.blocks) ? sol.blocks.length : 0} Blok
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <a
                  href={`${siteConfig.url}/solusi/${sol.slug}`}
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
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#F2C7A0] hover:bg-white/10"
                  >
                    Edit & Blok
                  </button>
                  <button
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
      {activeTab === 'finder' && finderConfig && (
        <div className="p-6 rounded-3xl bg-[#1e1e1e] border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Konfigurasi Interactive Solution Finder
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Atur opsi kuesioner langkah demi langkah untuk mencocokkan kebutuhan pengunjung dengan solusi Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveFinderConfig}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F2C7A0] text-[#191919] font-medium text-xs hover:bg-[#ebd5c1]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-mono text-neutral-400">
                1. Tujuan Bisnis ({finderConfig.businessGoals?.length || 0} Opsi)
              </label>
              <textarea
                value={JSON.stringify(finderConfig.businessGoals, null, 2)}
                onChange={(e) => {
                  try {
                    setFinderConfig({ ...finderConfig, businessGoals: JSON.parse(e.target.value) })
                  } catch {}
                }}
                rows={10}
                className="w-full p-3 rounded-2xl bg-[#141414] border border-white/10 text-xs font-mono text-neutral-300"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-mono text-neutral-400">
                2. Daftar Industri ({finderConfig.industries?.length || 0} Opsi)
              </label>
              <textarea
                value={JSON.stringify(finderConfig.industries, null, 2)}
                onChange={(e) => {
                  try {
                    setFinderConfig({ ...finderConfig, industries: JSON.parse(e.target.value) })
                  } catch {}
                }}
                rows={10}
                className="w-full p-3 rounded-2xl bg-[#141414] border border-white/10 text-xs font-mono text-neutral-300"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="block text-xs font-mono text-neutral-400">
                3. Pertanyaan Dinamis & Opsi Jawaban ({finderConfig.questions?.length || 0} Kategori)
              </label>
              <textarea
                value={JSON.stringify(finderConfig.questions, null, 2)}
                onChange={(e) => {
                  try {
                    setFinderConfig({ ...finderConfig, questions: JSON.parse(e.target.value) })
                  } catch {}
                }}
                rows={12}
                className="w-full p-3 rounded-2xl bg-[#141414] border border-white/10 text-xs font-mono text-neutral-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
