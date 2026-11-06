'use client'

import { siteConfig } from '@/config/site'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Globe,
  Share2,
  Sliders,
  Smartphone,
  Monitor,
  Plus,
  X,
  RefreshCw,
  ShieldAlert,
  FileText,
  Bookmark,
  Clock,
  Info,
  Image as ImageIcon,
} from 'lucide-react'
import { Locale, PublicationGateResult } from '@/lib/seo/schema'
import { analyzeContentSeo, DetailedSeoAnalysisResult } from '@/lib/seo/analyzer'
import { checkPublicationGate } from '@/lib/seo/validation'
import { resolveSeoTemplate } from '@/lib/articles/editorState'
import { useIndexingCooldown } from '@/hooks/useIndexingCooldown'

export interface StudioSeoInspectorProps {
  locale: Locale
  onChangeLocale: (locale: Locale) => void
  translationGroupId: string
  onChangeTranslationGroupId: (id: string) => void
  isCornerstone: boolean
  onChangeIsCornerstone: (val: boolean) => void

  articleTitle: string
  articleExcerpt?: string
  content: string
  category: string
  slug: string
  onChangeSlug: (slug: string) => void

  focusKeyphrase: string
  onChangeFocusKeyphrase: (kw: string) => void
  relatedKeyphrases: string[]
  onChangeRelatedKeyphrases: (kws: string[]) => void

  seoTitle: string
  onChangeSeoTitle: (title: string) => void
  metaDescription: string
  onChangeMetaDescription: (desc: string) => void

  canonicalUrl: string
  onChangeCanonicalUrl: (url: string) => void
  breadcrumbTitle: string
  onChangeBreadcrumbTitle: (title: string) => void

  schemaType: 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle'
  onChangeSchemaType: (type: 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle') => void

  robots: {
    index: boolean
    follow: boolean
    noarchive?: boolean
    nosnippet?: boolean
  }
  onChangeRobots: (robots: { index: boolean; follow: boolean; noarchive?: boolean; nosnippet?: boolean }) => void

  socialOg: {
    title?: string
    description?: string
    image?: string
    imageAlt?: string
  }
  onChangeSocialOg: (og: { title?: string; description?: string; image?: string; imageAlt?: string }) => void

  socialTwitter: {
    card?: 'summary' | 'summary_large_image'
    title?: string
    description?: string
    image?: string
    imageAlt?: string
  }
  onChangeSocialTwitter: (tw: { card?: 'summary' | 'summary_large_image'; title?: string; description?: string; image?: string; imageAlt?: string }) => void

  coverUrl?: string
  coverAlt?: string
  onChangeCoverAlt?: (alt: string) => void
  onChangeCoverUrl?: (url: string) => void
  onOpenMediaPickerForCover?: () => void

  contentImages?: Array<{ url: string; altText?: string; decorative?: boolean }>
  existingSlugs?: string[]
  articleStatus?: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | string
  articleUrl?: string
  articleId?: number
  /**
   * Precomputed analysis (the article editor computes it once, debounced). When omitted the
   * inspector analyses the content itself (portfolio / services / solutions managers).
   */
  analysis?: DetailedSeoAnalysisResult
  /** Ask the inspector to reveal and focus one of its fields (e.g. from the publication gate). */
  focusRequest?: { id: string; nonce: number } | null
}

type SeoSubTab = 'serp' | 'readability' | 'social' | 'advanced'

const SUB_TABS: Array<{ id: SeoSubTab; label: string; icon: typeof Search; iconClass: string }> = [
  { id: 'serp', label: 'SERP', icon: Search, iconClass: 'text-accent-400' },
  { id: 'readability', label: 'Keterbacaan', icon: FileText, iconClass: 'text-info-300' },
  { id: 'social', label: 'Sosial', icon: Share2, iconClass: 'text-purple-300' },
  { id: 'advanced', label: 'Lanjutan', icon: Sliders, iconClass: 'text-amber-300' },
]

/** Field ids that live in the SERP sub-tab (used to switch tabs before focusing). */
const SERP_FIELD_IDS = new Set(['seo-title-input', 'seo-meta-description-input', 'seo-slug-input', 'seo-cover-alt-input', 'seo-focus-keyphrase-input'])

const TEMPLATE_VARS = [
  { code: '%title%', label: 'Judul Asli' },
  { code: '%sitename%', label: 'Nama Situs' },
  { code: '%sep%', label: 'Pemisah (—)' },
  { code: '%category%', label: 'Kategori' },
  { code: '%date%', label: 'Tahun/Tanggal' },
]

export default function StudioSeoInspector({
  locale,
  onChangeLocale,
  translationGroupId,
  onChangeTranslationGroupId,
  isCornerstone,
  onChangeIsCornerstone,
  articleTitle,
  articleExcerpt = '',
  content,
  category,
  slug,
  onChangeSlug,
  focusKeyphrase,
  onChangeFocusKeyphrase,
  relatedKeyphrases,
  onChangeRelatedKeyphrases,
  seoTitle,
  onChangeSeoTitle,
  metaDescription,
  onChangeMetaDescription,
  canonicalUrl,
  onChangeCanonicalUrl,
  breadcrumbTitle,
  onChangeBreadcrumbTitle,
  schemaType,
  onChangeSchemaType,
  robots,
  onChangeRobots,
  socialOg,
  onChangeSocialOg,
  socialTwitter,
  onChangeSocialTwitter,
  coverUrl,
  coverAlt = '',
  onChangeCoverAlt,
  onChangeCoverUrl,
  onOpenMediaPickerForCover,
  contentImages = [],
  existingSlugs = [],
  articleStatus,
  articleUrl,
  articleId,
  analysis: providedAnalysis,
  focusRequest,
}: StudioSeoInspectorProps) {
  const [site, setSite] = useState<{ name: string; url: string }>({ name: siteConfig.name, url: siteConfig.url })
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/settings', { signal: controller.signal }).then((r) => r.json()).then((json) => {
      if (json.success && json.data?.name && json.data?.url) setSite({ name: json.data.name, url: json.data.url })
    }).catch((error) => { if (error.name !== 'AbortError') console.warn('Site preview settings unavailable', error) })
    return () => controller.abort()
  }, [])

  // Hook into live indexing cooldown and status
  const indexingTargetUrl = articleUrl || canonicalUrl || (slug ? `${site.url}/journal/${slug}` : '')
  const {
    status: indexingData,
    loading: indexingLoading,
    cooldownActive,
    remainingSeconds,
    remainingFormatted,
    retrigger: handleRetriggerIndexing,
    isRetriggering,
    actionError: indexingError,
    canRetrigger,
    retriggerBlockedReason,
    refresh: refreshIndexing,
  } = useIndexingCooldown({
    url: indexingTargetUrl,
    type: 'article',
    idOrSlug: slug,
    entityStatus: articleStatus || 'published',
    enabled: Boolean(slug || indexingTargetUrl),
  })

  // Navigation inside SEO panel
  const [activeTab, setActiveTab] = useState<SeoSubTab>('serp')
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [newRelatedKw, setNewRelatedKw] = useState('')
  const [relatedKwError, setRelatedKwError] = useState<string | null>(null)
  const subTabRefs = useRef<Partial<Record<SeoSubTab, HTMLButtonElement | null>>>({})

  // Reveal + focus a requested field (publication gate "Perbaiki" links).
  useEffect(() => {
    if (!focusRequest) return
    if (SERP_FIELD_IDS.has(focusRequest.id)) setActiveTab('serp')
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(focusRequest.id)
      if (el) {
        el.focus()
        el.scrollIntoView({ block: 'center' })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [focusRequest])

  const onSubTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % SUB_TABS.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + SUB_TABS.length) % SUB_TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = SUB_TABS.length - 1
    const tab = SUB_TABS[next]
    if (!tab) return
    e.preventDefault()
    setActiveTab(tab.id)
    subTabRefs.current[tab.id]?.focus()
  }

  // 1. Resolve template variables into actual preview text
  const resolveTemplate = (text: string): string =>
    resolveSeoTemplate(text, { title: articleTitle, siteName: site.name, category })

  const effectiveTitle = resolveTemplate(seoTitle) || articleTitle || 'Judul Konten — SPATIUM'
  const effectiveDescription = resolveTemplate(metaDescription) || articleExcerpt || 'Ringkasan konten yang informatif untuk mesin pencari.'

  // Estimated pixel width for desktop title (~600px standard cut off in SERP)
  const titlePixelWidth = useMemo(() => {
    // Rough proportional calculation for standard Arial/Google Sans SERP title (avg 9.8px per character)
    let px = 0
    for (const char of effectiveTitle) {
      if (/[A-Z]/.test(char)) px += 12
      else if (/[ijl\s\.,\-]/.test(char)) px += 5
      else if (/[wmMW]/.test(char)) px += 14
      else px += 9
    }
    return Math.round(px)
  }, [effectiveTitle])

  // 2. Real-time SEO & Readability Analysis (Isomorphic)
  const allImages = useMemo(() => {
    const list: Array<{ url: string; alt?: string; decorative?: boolean }> = []
    if (coverUrl) {
      list.push({ url: coverUrl, alt: coverAlt, decorative: false })
    }
    for (const img of contentImages) {
      list.push({ url: img.url, alt: img.altText, decorative: img.decorative })
    }
    return list
  }, [coverUrl, coverAlt, contentImages])

  const analysis: DetailedSeoAnalysisResult = useMemo(() => {
    if (providedAnalysis) return providedAnalysis
    return analyzeContentSeo({
      title: articleTitle,
      seoTitle: effectiveTitle,
      metaDescription: effectiveDescription,
      slug,
      content,
      focusKeyphrase,
      relatedKeyphrases,
      locale,
      isCornerstone,
      images: allImages,
    })
  }, [providedAnalysis, articleTitle, effectiveTitle, effectiveDescription, slug, content, focusKeyphrase, relatedKeyphrases, locale, isCornerstone, allImages])

  // 3. Publication Gate Pre-check
  const publicationGate: PublicationGateResult = useMemo(() => {
    return checkPublicationGate({
      locale,
      title: articleTitle,
      slug,
      metaDescription: effectiveDescription,
      seoTitle: effectiveTitle,
      existingSlugs: existingSlugs.filter((s) => s !== slug),
      images: contentImages.map((img) => ({
        url: img.url,
        altText: img.altText,
        decorative: img.decorative,
      })),
      heroVisual: coverUrl ? { url: coverUrl, altText: coverAlt, decorative: false } : null,
    })
  }, [locale, articleTitle, slug, effectiveDescription, effectiveTitle, existingSlugs, contentImages, coverUrl, coverAlt])

  // 5. Related Keyphrases Management
  const handleAddRelatedKeyphrase = () => {
    const trimmed = newRelatedKw.trim()
    if (!trimmed) return
    if (relatedKeyphrases.length >= 5) {
      setRelatedKwError('Maksimal 5 keyphrase terkait.')
      return
    }
    if (relatedKeyphrases.includes(trimmed)) {
      setRelatedKwError('Keyphrase ini sudah ada.')
      return
    }
    setRelatedKwError(null)
    onChangeRelatedKeyphrases([...relatedKeyphrases, trimmed])
    setNewRelatedKw('')
  }

  const handleRemoveRelatedKeyphrase = (kw: string) => {
    onChangeRelatedKeyphrases(relatedKeyphrases.filter((k) => k !== kw))
  }

  // 6. Template Variable Inserter
  const insertVariable = (target: 'title' | 'desc', varCode: string) => {
    if (target === 'title') {
      onChangeSeoTitle(seoTitle ? `${seoTitle} ${varCode}` : varCode)
    } else {
      onChangeMetaDescription(metaDescription ? `${metaDescription} ${varCode}` : varCode)
    }
  }

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* ─── Top Control: Language & Cornerstone ───────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-accent-400" />
            <span className="text-xs font-mono font-bold text-neutral-300 uppercase">Bahasa & Lokalisasi</span>
          </div>

          {/* Bilingual Switcher */}
          <div role="radiogroup" aria-label="Bahasa konten" className="flex items-center gap-1 p-0.5 rounded-lg bg-black/60 border border-white/10">
            <button
              type="button"
              role="radio"
              aria-checked={locale === 'id'}
              onClick={() => onChangeLocale('id')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                locale === 'id' ? 'bg-accent-500 text-accent-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              ID (Indonesia)
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={locale === 'en'}
              onClick={() => onChangeLocale('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                locale === 'en' ? 'bg-accent-500 text-accent-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              EN (English)
            </button>
          </div>
        </div>

        {/* Translation Group & Cornerstone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
          <div>
            <label htmlFor="seo-translation-group" className="text-[11px] font-mono text-neutral-300 block mb-1">
              Grup terjemahan (ID penghubung ID/EN)
            </label>
            <input
              id="seo-translation-group"
              type="text"
              value={translationGroupId}
              onChange={(e) => onChangeTranslationGroupId(e.target.value)}
              placeholder="UUID penghubung ID/EN..."
              className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1 text-[11px] font-mono text-neutral-300 focus:border-accent-400"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
            <label className="text-[11px] font-medium text-neutral-300 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCornerstone}
                onChange={(e) => onChangeIsCornerstone(e.target.checked)}
                className="rounded border-white/20 text-accent-500 focus:ring-accent-400 w-3.5 h-3.5 bg-black/40"
              />
              <span className="flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-amber-400" />
                <span>Konten Pilar (Cornerstone)</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ─── Score Overview Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Skor SEO</span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                analysis.seoScore >= 80
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : analysis.seoScore >= 50
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              {analysis.seoScore} / 100
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              style={{ width: `${analysis.seoScore}%` }}
              className={`h-full transition-all duration-300 ${
                analysis.seoScore >= 80 ? 'bg-emerald-400' : analysis.seoScore >= 50 ? 'bg-amber-400' : 'bg-red-400'
              }`}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-mono block truncate">
            {analysis.indicators.filter((i) => i.status === 'good').length} lulus,{' '}
            {analysis.indicators.filter((i) => i.status === 'problem').length} masalah
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Keterbacaan</span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                analysis.readabilityScore >= 80
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : analysis.readabilityScore >= 50
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              {analysis.readabilityScore} / 100
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              style={{ width: `${analysis.readabilityScore}%` }}
              className={`h-full transition-all duration-300 ${
                analysis.readabilityScore >= 80
                  ? 'bg-emerald-400'
                  : analysis.readabilityScore >= 50
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-mono block truncate">
            {analysis.readabilityIndicators.filter((i) => i.status === 'good').length} kriteria terpenuhi
          </span>
        </div>
      </div>

      {/* ─── Publication Gate Status Warning ────────────────────────────── */}
      {!publicationGate.canPublish && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-red-300 font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Gerbang Publikasi Terkunci ({publicationGate.violations.length} Masalah Wajib)</span>
          </div>
          <ul className="space-y-1 text-[11px] text-red-200/90 pl-6 list-disc">
            {publicationGate.violations.map((v, i) => (
              <li key={i}>{v.message}</li>
            ))}
          </ul>
          {publicationGate.violations.some((v) => v.field === 'heroVisual.altText') && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('serp')
                requestAnimationFrame(() => document.getElementById('seo-cover-alt-input')?.focus())
              }}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-rose-300/50 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500/30"
            >
              Isi alt text sampul
            </button>
          )}
        </div>
      )}

      {/* ─── Navigation Sub-Tabs (APG tabs) ─────────────────────────────── */}
      <div role="tablist" aria-label="Bagian SEO" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-medium">
        {SUB_TABS.map((tab, i) => {
          const Icon = tab.icon
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={(el) => {
                subTabRefs.current[tab.id] = el
              }}
              id={`seo-subtab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="seo-subtab-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => onSubTabKeyDown(e, i)}
              className={`flex-1 min-h-8 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 ${
                selected ? 'bg-white/15 text-white font-bold' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Icon className={`w-3 h-3 ${tab.iconClass}`} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div id="seo-subtab-panel" role="tabpanel" aria-labelledby={`seo-subtab-${activeTab}`} className="space-y-4">
      {/* ─── TAB 1: SEO & SERP ─────────────────────────────────────────── */}
      {activeTab === 'serp' && (
        <div className="space-y-4 max-w-full overflow-x-hidden">
          {/* Focus Keyphrase */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <label htmlFor="seo-focus-keyphrase-input" className="text-xs font-mono font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
                <span>Focus keyphrase</span>
              </label>
              {focusKeyphrase && (
                <span className="text-[11px] font-mono text-neutral-300">
                  {analysis.indicators.some((i) => i.id === 'kw-title' && i.status === 'good') ? '✓ Ada di judul' : '! Belum di judul'}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <input
                id="seo-focus-keyphrase-input"
                type="text"
                value={focusKeyphrase}
                onChange={(e) => onChangeFocusKeyphrase(e.target.value)}
                placeholder="Contoh: jasa pembuatan website nextjs"
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-accent-400"
              />
              <p className="text-[10px] text-neutral-400">
                Keyphrase utama yang ingin diranking di Google untuk bahasa [{locale.toUpperCase()}].
              </p>
            </div>

            {/* Related Keyphrases (Multi-input) */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <p id="seo-related-label" className="text-[11px] font-mono text-neutral-300 font-semibold block">
                Keyphrase terkait (maks. 5)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {relatedKeyphrases.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRelatedKeyphrase(kw)}
                      aria-label={`Hapus keyphrase ${kw}`}
                      className="p-0.5 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>

              {relatedKeyphrases.length < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    aria-labelledby="seo-related-label"
                    aria-invalid={relatedKwError ? true : undefined}
                    aria-describedby={relatedKwError ? 'seo-related-error' : undefined}
                    value={newRelatedKw}
                    onChange={(e) => {
                      setNewRelatedKw(e.target.value)
                      if (relatedKwError) setRelatedKwError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddRelatedKeyphrase()
                      }
                    }}
                    placeholder="Tambah kata kunci turunan..."
                    className="flex-1 rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white focus:border-accent-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddRelatedKeyphrase}
                    aria-label="Tambah keyphrase terkait"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
              {relatedKwError && (
                <p id="seo-related-error" className="text-[11px] text-amber-300">
                  {relatedKwError}
                </p>
              )}
            </div>
          </div>

          {/* Google SERP Snippet Preview */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase">Google SERP Preview</span>
              <div role="radiogroup" aria-label="Perangkat pratinjau" className="flex items-center gap-1 p-0.5 rounded-lg bg-black/50 border border-white/10">
                <button
                  type="button"
                  role="radio"
                  aria-checked={serpDevice === 'desktop'}
                  onClick={() => setSerpDevice('desktop')}
                  className={`p-1.5 rounded ${serpDevice === 'desktop' ? 'bg-white/20 text-white' : 'text-neutral-300'}`}
                  aria-label="Desktop"
                >
                  <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={serpDevice === 'mobile'}
                  onClick={() => setSerpDevice('mobile')}
                  className={`p-1.5 rounded ${serpDevice === 'mobile' ? 'bg-white/20 text-white' : 'text-neutral-300'}`}
                  aria-label="Seluler"
                >
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Google SERP Card */}
            <div
              className={`p-3.5 rounded-xl bg-white text-neutral-900 shadow-sm border border-neutral-300 font-sans transition-all overflow-hidden max-w-full ${
                serpDevice === 'mobile' ? 'max-w-[340px] mx-auto' : 'w-full'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 min-w-0 max-w-full">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-700 border border-neutral-200 shrink-0">
                  S
                </div>
                <div className="leading-tight min-w-0 flex-1 overflow-hidden">
                  <p className="text-[11px] font-normal text-neutral-700 truncate">{site.name}</p>
                  <p className="text-[10px] text-neutral-500 truncate block max-w-full" title={`${site.url} > journal > ${slug || ''}`}>
                    {site.url} &gt; journal &gt; {slug || '...'}
                  </p>
                </div>
              </div>

              {/* SERP Title */}
              <p className="text-[16px] text-[#1a0dab] font-normal leading-snug line-clamp-2 mt-0.5 break-words">
                {effectiveTitle}
              </p>

              {/* SERP Description */}
              <p className="text-[12px] text-[#4d5156] line-clamp-2 leading-relaxed mt-1 break-words">
                {effectiveDescription}
              </p>
            </div>

            {/* Pixel Width Meter for Desktop Title */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>Lebar Judul di SERP Desktop (~600px):</span>
                <span
                  className={
                    titlePixelWidth > 600
                      ? 'text-red-400 font-bold'
                      : titlePixelWidth > 550
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400'
                  }
                >
                  {titlePixelWidth} px / 600 px ({effectiveTitle.length} karakter)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (titlePixelWidth / 600) * 100)}%` }}
                  className={`h-full transition-all duration-300 ${
                    titlePixelWidth > 600 ? 'bg-red-400' : titlePixelWidth > 550 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              </div>
            </div>

            {/* Character Meter for Meta Description */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>Panjang Meta Description (Target 120-160 char):</span>
                <span
                  className={
                    effectiveDescription.length >= 120 && effectiveDescription.length <= 160
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400'
                  }
                >
                  {effectiveDescription.length} karakter
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (effectiveDescription.length / 160) * 100)}%`,
                  }}
                  className={`h-full transition-all duration-300 ${
                    effectiveDescription.length >= 120 && effectiveDescription.length <= 160
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* SEO Title & Meta Description Inputs */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase">Input & Template Variabel</span>
            </div>

            {/* SEO Title Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="seo-title-input" className="text-[11px] font-mono text-neutral-300 font-semibold">SEO title</label>
              </div>

              <input
                id="seo-title-input"
                type="text"
                value={seoTitle}
                onChange={(e) => onChangeSeoTitle(e.target.value)}
                placeholder="%title% %sep% %sitename%"
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:border-accent-400 font-mono"
              />

              {/* Template Var Pills for Title */}
              <div className="flex flex-wrap gap-1 pt-1">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => insertVariable('title', v.code)}
                    aria-label={`Sisipkan ${v.label} ke SEO title`}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-neutral-300"
                  >
                    +{v.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta Description Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="seo-meta-description-input" className="text-[11px] font-mono text-neutral-300 font-semibold">Meta description</label>
              </div>

              <textarea
                id="seo-meta-description-input"
                value={metaDescription}
                onChange={(e) => onChangeMetaDescription(e.target.value)}
                rows={3}
                placeholder="Tulis deskripsi 120-160 karakter yang memuat focus keyphrase dan ajakan bertindak..."
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:border-accent-400 leading-relaxed"
              />

              {/* Template Var Pills for Description */}
              <div className="flex flex-wrap gap-1 pt-1">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => insertVariable('desc', v.code)}
                    aria-label={`Sisipkan ${v.label} ke meta description`}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-neutral-300"
                  >
                    +{v.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Slug Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="seo-slug-input" className="text-[11px] font-mono text-neutral-300 font-semibold">Slug URL</label>
              </div>
              <input
                id="seo-slug-input"
                type="text"
                value={slug}
                onChange={(e) => onChangeSlug(e.target.value)}
                placeholder="slug-artikel-anda"
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2 text-xs font-mono text-neutral-300 focus:border-accent-400"
              />
            </div>
          </div>

          {/* Cover / Hero Visual SEO & Aksesibilitas */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Cover / Media Hero (Aksesibilitas & SEO)
                </span>
              </div>
              {coverUrl ? (
                coverAlt && coverAlt.trim().length <= 125 && !/^(gambar|foto|image of|photo of|picture of)\b/i.test(coverAlt.trim()) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Alt Text Siap</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/15 text-red-400 border border-red-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Alt Text Wajib Diisi</span>
                  </span>
                )
              ) : (
                <span className="text-[10px] font-mono text-neutral-500">
                  Tidak ada cover
                </span>
              )}
            </div>

            <div className="space-y-3">
              {coverUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10">
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/60">
                    <Image
                      src={coverUrl}
                      alt={coverAlt || 'Preview Cover'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-neutral-300 truncate">{coverUrl}</p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {coverAlt ? `Alt: "${coverAlt}"` : 'Belum memiliki Alt Text'}
                    </p>
                  </div>
                  {onOpenMediaPickerForCover && (
                    <button
                      type="button"
                      onClick={onOpenMediaPickerForCover}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-neutral-300 shrink-0 hover:text-white transition-colors"
                    >
                      Ganti
                    </button>
                  )}
                </div>
              )}

              {/* Alt Text Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="seo-cover-alt-input" className="text-[11px] font-mono text-neutral-300 font-semibold">
                    Alt text sampul [{locale.toUpperCase()}]
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="seo-cover-alt-input"
                    type="text"
                    value={coverAlt}
                    aria-describedby="seo-cover-alt-hint"
                    onChange={(e) => onChangeCoverAlt?.(e.target.value)}
                    placeholder="Deskripsi spesifik tentang isi gambar untuk pembaca layar..."
                    className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:border-accent-400 pr-16"
                  />
                  <span
                    className={`absolute right-2.5 top-2.5 text-[10px] font-mono ${
                      coverAlt.length > 125
                        ? 'text-red-400 font-bold'
                        : coverAlt.length >= 10
                        ? 'text-emerald-400'
                        : 'text-neutral-500'
                    }`}
                  >
                    {coverAlt.length}/125
                  </span>
                </div>
                <p id="seo-cover-alt-hint" className="text-[10px] text-neutral-400">
                  Wajib untuk Gerbang Publikasi. Maksimal 125 karakter, hindari kata awal &quot;gambar/foto&quot;.
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Checklist Audit */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-2.5">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase pb-2 border-b border-white/10">
              Checklist analisis SEO
            </h4>

            <div className="space-y-1.5">
              {analysis.indicators.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-black/20 border border-white/5"
                >
                  {item.status === 'good' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : item.status === 'ok' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        item.status === 'good'
                          ? 'text-neutral-200'
                          : item.status === 'ok'
                          ? 'text-amber-200'
                          : 'text-red-300'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: READABILITY ────────────────────────────────────────── */}
      {activeTab === 'readability' && (
        <div className="space-y-4 max-w-full overflow-x-hidden">
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase pb-2 border-b border-white/10">
              Analisis Keterbacaan ({locale === 'id' ? 'Bahasa Indonesia' : 'English'})
            </h4>

            <div className="space-y-2">
              {analysis.readabilityIndicators.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/20 border border-white/5"
                >
                  {item.status === 'good' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : item.status === 'ok' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        item.status === 'good'
                          ? 'text-neutral-200'
                          : item.status === 'ok'
                          ? 'text-amber-200'
                          : 'text-red-300'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SOCIAL PREVIEW ─────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="space-y-4 max-w-full overflow-x-hidden">
          {/* Facebook / LinkedIn Open Graph Card */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase pb-2 border-b border-white/10">
              Pratinjau Kartu Open Graph (Facebook / LinkedIn)
            </h4>

            <div className="rounded-xl overflow-hidden border border-white/15 bg-neutral-900 shadow-md">
              <div className="relative aspect-[1.91/1] w-full bg-black/60">
                {socialOg.image || coverUrl ? (
                  <Image
                    src={socialOg.image || coverUrl || ''}
                    alt={socialOg.imageAlt || coverAlt || 'Open Graph Visual'}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-mono">
                    1200 x 630 OpenGraph Image
                  </div>
                )}
              </div>
              <div className="p-3 bg-neutral-950/80 border-t border-white/10 space-y-1">
                <span className="text-[9px] font-mono text-neutral-400 uppercase">SPATIUM.ID</span>
                <h5 className="text-xs font-bold text-white line-clamp-1">
                  {socialOg.title || effectiveTitle}
                </h5>
                <p className="text-[11px] text-neutral-400 line-clamp-2">
                  {socialOg.description || effectiveDescription}
                </p>
              </div>
            </div>

            {/* Social OG Overrides */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div>
                <label htmlFor="seo-og-title" className="text-[11px] font-mono text-neutral-300 block mb-1">Judul OG kustom</label>
                <input
                  id="seo-og-title"
                  type="text"
                  value={socialOg.title || ''}
                  onChange={(e) => onChangeSocialOg({ ...socialOg, title: e.target.value })}
                  placeholder="Kosongkan untuk pakai SEO Title..."
                  className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white focus:border-accent-400"
                />
              </div>

              <div>
                <label htmlFor="seo-og-description" className="text-[11px] font-mono text-neutral-300 block mb-1">Deskripsi OG kustom</label>
                <textarea
                  id="seo-og-description"
                  value={socialOg.description || ''}
                  onChange={(e) => onChangeSocialOg({ ...socialOg, description: e.target.value })}
                  rows={2}
                  placeholder="Kosongkan untuk pakai Meta Description..."
                  className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white focus:border-accent-400"
                />
              </div>

              <div>
                <p className="text-[11px] font-mono text-neutral-300 block mb-1">Gambar OG</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={socialOg.image || ''}
                    onChange={(e) => onChangeSocialOg({ ...socialOg, image: e.target.value })}
                    aria-label="URL gambar OG"
                    placeholder="URL gambar OG (1200x630)"
                    className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white font-mono focus:border-accent-400"
                  />
                  <input
                    type="text"
                    value={socialOg.imageAlt || ''}
                    onChange={(e) => onChangeSocialOg({ ...socialOg, imageAlt: e.target.value })}
                    aria-label="Alt text gambar OG"
                    placeholder="Alt text gambar OG"
                    className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white focus:border-accent-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Twitter / X Card Preview */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase pb-2 border-b border-white/10">
              Twitter / X Card
            </h4>
            <div className="flex gap-4">
              <label className="text-xs text-neutral-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="twitterCard"
                  checked={(socialTwitter.card || 'summary_large_image') === 'summary_large_image'}
                  onChange={() => onChangeSocialTwitter({ ...socialTwitter, card: 'summary_large_image' })}
                  className="text-accent-500 focus:ring-accent-400 bg-black/40"
                />
                <span>Summary Large Image (Disarankan)</span>
              </label>
              <label className="text-xs text-neutral-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="twitterCard"
                  checked={socialTwitter.card === 'summary'}
                  onChange={() => onChangeSocialTwitter({ ...socialTwitter, card: 'summary' })}
                  className="text-accent-500 focus:ring-accent-400 bg-black/40"
                />
                <span>Summary Kecil</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: ADVANCED ───────────────────────────────────────────── */}
      {activeTab === 'advanced' && (
        <div className="space-y-4 max-w-full overflow-x-hidden">
          {/* ─── REAL-TIME INDEXING CARD (GOOGLE & INDEXNOW) ─────────────── */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-4 shadow-soft-sm">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-info" />
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Status Indeksasi Real-Time &amp; Retrigger
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 border border-white/10">
                  24h Rate-Limited
                </span>
                <button
                  type="button"
                  onClick={refreshIndexing}
                  disabled={indexingLoading}
                  aria-label="Segarkan status indeksasi"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${indexingLoading ? 'motion-safe:animate-spin text-accent-400' : ''}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Target URL Reference */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-neutral-300">
              <span className="text-neutral-500 shrink-0">Target URL:</span>
              <span className="truncate text-accent-300 select-all" title={indexingTargetUrl}>
                {indexingTargetUrl || `${site.url}/journal/${slug || '...'}`}
              </span>
            </div>

            {/* Provider Grid: Google & IndexNow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Google Search Console */}
              <div className="rounded-xl border border-white/5 bg-black/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-neutral-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Google Search Console</span>
                  </span>
                  {(() => {
                    const g = indexingData?.providers?.google
                    if (!g) {
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 text-neutral-400 border border-white/10">
                          Belum Diperiksa
                        </span>
                      )
                    }
                    if (g.status === 'success') {
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {g.httpStatus ? `HTTP ${g.httpStatus}` : 'OK / Valid'}
                        </span>
                      )
                    }
                    if (g.status === 'rate_limited') {
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          HTTP 429
                        </span>
                      )
                    }
                    if (g.status === 'unconfigured') {
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
                          Belum Terhubung
                        </span>
                      )
                    }
                    return (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {g.httpStatus ? `HTTP ${g.httpStatus}` : 'Gagal'}
                      </span>
                    )
                  })()}
                </div>

                <div className="space-y-1 text-[10px] font-mono text-neutral-400">
                  <div className="flex justify-between">
                    <span>Terakhir Inspeksi:</span>
                    <span className="text-neutral-200">
                      {indexingData?.providers?.google?.submittedAt
                        ? new Date(indexingData.providers.google.submittedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pemicu / Aktor:</span>
                    <span className="text-neutral-300 capitalize">
                      {indexingData?.providers?.google?.trigger || '—'} (
                      {indexingData?.providers?.google?.actor || 'system'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: IndexNow Protocol */}
              <div className="rounded-xl border border-white/5 bg-black/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-neutral-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-info" />
                    <span>IndexNow (Bing/Yandex)</span>
                  </span>
                  {(() => {
                    const inow = indexingData?.providers?.indexnow
                    if (!inow) {
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 text-neutral-400 border border-white/10">
                          Belum Terkirim
                        </span>
                      )
                    }
                    if (inow.status === 'accepted' || inow.status === 'success') {
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          HTTP {inow.httpStatus || 202} Accepted
                        </span>
                      )
                    }
                    if (inow.status === 'rate_limited') {
                      return (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          HTTP 429
                        </span>
                      )
                    }
                    return (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {inow.httpStatus ? `HTTP ${inow.httpStatus}` : 'Gagal'}
                      </span>
                    )
                  })()}
                </div>

                <div className="space-y-1 text-[10px] font-mono text-neutral-400">
                  <div className="flex justify-between">
                    <span>Terakhir Terkirim:</span>
                    <span className="text-neutral-200">
                      {indexingData?.providers?.indexnow?.submittedAt
                        ? new Date(indexingData.providers.indexnow.submittedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesin Pencari:</span>
                    <span className="text-neutral-300">Bing, Yandex, Seznam</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cooldown State Banner & Live Countdown */}
            {cooldownActive ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Masa Jeda 24 Jam Sedang Berjalan</span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{remainingFormatted}</span>
                </div>

                {/* Progress bar showing elapsed percentage of 24 hours */}
                <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, ((86400 - remainingSeconds) / 86400) * 100))}%` }}
                    className="h-full bg-amber-400 transition-all duration-1000"
                  />
                </div>

                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Pengiriman manual dibatasi maksimal 1x dalam 24 jam per URL agar antrean perayapan bot mesin pencari tetap stabil.
                </p>
              </div>
            ) : articleStatus && articleStatus !== 'published' ? (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-neutral-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>
                  Indeksasi otomatis dan manual hanya aktif setelah artikel diterbitkan (status saat ini:{' '}
                  <strong className="text-neutral-200">{articleStatus}</strong>).
                </span>
              </div>
            ) : null}

            {indexingError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
                {indexingError}
              </div>
            )}

            {/* Retrigger Action Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-neutral-500">
                {canRetrigger
                  ? 'Siap dipicu ulang kapan saja.'
                  : retriggerBlockedReason || 'Pemicuan ulang dinonaktifkan.'}
              </span>

              <button
                type="button"
                onClick={() => handleRetriggerIndexing('all')}
                disabled={!canRetrigger || isRetriggering}
                className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-300 text-accent-950 text-xs font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetriggering ? 'animate-spin' : ''}`} />
                <span>
                  {isRetriggering
                    ? 'Mengirim Ulang...'
                    : cooldownActive
                    ? `Jeda Aktif (${remainingFormatted})`
                    : 'Kirim Ulang Indeksasi (Retrigger)'}
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-4">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase pb-2 border-b border-white/10">
              Pengaturan Robot &amp; Indeksasi Mesin Pencari
            </h4>

            {/* Robots Index / Follow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/30 border border-white/5 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={robots.index !== false}
                  onChange={(e) => onChangeRobots({ ...robots, index: e.target.checked })}
                  className="rounded border-white/20 text-accent-500 focus:ring-accent-400 bg-black/40"
                />
                <div>
                  <span className="font-semibold block">Izinkan Indeks (index)</span>
                  <span className="text-[10px] text-neutral-500">Bolehkah mesin pencari menampilkan konten ini di hasil pencarian?</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/30 border border-white/5 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={robots.follow !== false}
                  onChange={(e) => onChangeRobots({ ...robots, follow: e.target.checked })}
                  className="rounded border-white/20 text-accent-500 focus:ring-accent-400 bg-black/40"
                />
                <div>
                  <span className="font-semibold block">Ikuti Tautan (follow)</span>
                  <span className="text-[10px] text-neutral-500">Bolehkah bot Google merayapi link di halaman ini?</span>
                </div>
              </label>
            </div>

            {/* Canonical URL */}
            <div className="space-y-1">
              <label htmlFor="seo-canonical-url" className="text-[11px] font-mono text-neutral-300 font-semibold block">
                URL kanonikal kustom
              </label>
              <input
                id="seo-canonical-url"
                inputMode="url"
                type="text"
                value={canonicalUrl}
                onChange={(e) => onChangeCanonicalUrl(e.target.value)}
                placeholder="Kosongkan untuk memakai URL artikel ini secara default..."
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white font-mono focus:border-accent-400"
              />
              <span className="text-[10px] text-neutral-500 font-mono block">
                Default: {site.url}/journal/{'{slug}'}
              </span>
            </div>

            {/* Breadcrumb Title */}
            <div className="space-y-1">
              <label htmlFor="seo-breadcrumb-title" className="text-[11px] font-mono text-neutral-300 font-semibold block">
                Judul breadcrumb khusus
              </label>
              <input
                id="seo-breadcrumb-title"
                type="text"
                value={breadcrumbTitle}
                onChange={(e) => onChangeBreadcrumbTitle(e.target.value)}
                placeholder="Kosongkan untuk memakai judul artikel..."
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:border-accent-400"
              />
            </div>

            {/* Schema Type */}
            <div className="space-y-1">
              <label htmlFor="seo-schema-type" className="text-[11px] font-mono text-neutral-300 font-semibold block">
                Tipe schema JSON-LD
              </label>
              <select
                id="seo-schema-type"
                value={schemaType}
                onChange={(e) => onChangeSchemaType(e.target.value as 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle')}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:border-accent-400"
              >
                <option value="Article" className="bg-surface-overlay">Article (Umum)</option>
                <option value="BlogPosting" className="bg-surface-overlay">BlogPosting (Postingan Blog)</option>
                <option value="TechArticle" className="bg-surface-overlay">TechArticle (Teknikal & Arsitektur)</option>
                <option value="NewsArticle" className="bg-surface-overlay">NewsArticle (Berita & Rilis)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
