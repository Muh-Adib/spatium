'use client'

import { siteConfig } from '@/config/site'
import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Globe,
  Share2,
  Sliders,
  Smartphone,
  Monitor,
  Plus,
  X,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldAlert,
  Layers,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Image as ImageIcon,
} from 'lucide-react'
import { Locale, ContentSeo, PublicationGateResult } from '@/lib/seo/schema'
import { getStoredAiCredentials, triggerAiKeyPrompt } from '@/lib/ai/key-manager'
import { analyzeContentSeo, DetailedSeoAnalysisResult } from '@/lib/seo/analyzer'
import { checkPublicationGate } from '@/lib/seo/validation'
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
}

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
  const indexingTargetUrl = articleUrl || canonicalUrl || (slug ? `${site.url}/artikel/${slug}` : '')
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
  const [activeTab, setActiveTab] = useState<'serp' | 'readability' | 'social' | 'advanced'>('serp')
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [newRelatedKw, setNewRelatedKw] = useState('')
  const [generatingAiField, setGeneratingAiField] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [showAltFixModal, setShowAltFixModal] = useState(false)
  const [tempAlt, setTempAlt] = useState('')

  // 1. Resolve template variables into actual preview text
  const resolveTemplate = (text: string): string => {
    if (!text) return ''
    const now = new Date()
    return text
      .replace(/%{1,2}title%{1,2}/g, articleTitle || 'Judul Konten')
      .replace(/%{1,2}sitename%{1,2}/g, site.name)
      .replace(/%{1,2}sep%{1,2}/g, '—')
      .replace(/%{1,2}category%{1,2}/g, category || 'Teknologi')
      .replace(/%{1,2}date%{1,2}/g, now.getFullYear().toString())
  }

  const effectiveTitle = resolveTemplate(seoTitle) || articleTitle || 'Judul Konten — UNIMASI'
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
  }, [articleTitle, effectiveTitle, effectiveDescription, slug, content, focusKeyphrase, relatedKeyphrases, locale, isCornerstone, allImages])

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

  // 4. AI Suggestion Handler with Fallback
  const handleAiSuggest = async (field: 'title' | 'metaDescription' | 'slug' | 'all') => {
    const creds = getStoredAiCredentials()
    if (!creds.hasKey) {
      triggerAiKeyPrompt({
        featureName: 'Saran SEO Otomatis (AI)',
        reason: 'Silakan tambahkan API Key Google AI Studio atau OpenRouter Anda untuk menggunakan asisten AI pembuat judul, deskripsi, dan slug SEO.',
        provider: creds.provider,
        onSuccess: () => {
          handleAiSuggest(field)
        },
      })
      return
    }

    setGeneratingAiField(field)
    setAiError(null)

    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: field === 'title' ? 'seoTitle' : field,
          locale,
          title: articleTitle,
          excerpt: articleExcerpt,
          content: content.slice(0, 3000),
          focusKeyphrase: focusKeyphrase || articleTitle.split(' ').slice(0, 3).join(' '),
          existingTitles: [],
          existingSlugs: existingSlugs,
          aiConfig: {
            provider: creds.provider,
            apiKey: creds.apiKey,
            model: creds.model,
            proxyUrl: creds.proxyUrl,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghasilkan saran SEO')
      }

      if (data.needsKey) {
        triggerAiKeyPrompt({
          featureName: 'Saran SEO Otomatis (AI)',
          reason: 'Kunci API belum diisi atau tidak valid. Silakan periksa kembali API Key Anda.',
          provider: creds.provider,
        })
        return
      }

      const titleVal = data.seoTitle || data.data?.seoTitle || (field === 'title' ? (data.data?.value || data.value) : undefined)
      const descVal = data.metaDescription || data.data?.metaDescription || (field === 'metaDescription' ? (data.data?.value || data.value) : undefined)
      const slugVal = data.slug || data.data?.slug || (field === 'slug' ? (data.data?.value || data.value) : undefined)

      if (titleVal && (field === 'title' || field === 'all')) {
        onChangeSeoTitle(titleVal)
      }
      if (descVal && (field === 'metaDescription' || field === 'all')) {
        onChangeMetaDescription(descVal)
      }
      if (slugVal && (field === 'slug' || field === 'all')) {
        onChangeSlug(slugVal)
      }
    } catch (err: any) {
      setAiError(err.message || 'Gagal memanggil asisten SEO')
    } finally {
      setGeneratingAiField(null)
    }
  }

  // 5. Related Keyphrases Management
  const handleAddRelatedKeyphrase = () => {
    const trimmed = newRelatedKw.trim()
    if (!trimmed) return
    if (relatedKeyphrases.length >= 5) {
      alert('Maksimal 5 related keyphrases')
      return
    }
    if (relatedKeyphrases.includes(trimmed)) return
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
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => onChangeLocale('id')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                locale === 'id' ? 'bg-accent-500 text-black shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              ID (Indonesia)
            </button>
            <button
              type="button"
              onClick={() => onChangeLocale('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                locale === 'en' ? 'bg-accent-500 text-black shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              EN (English)
            </button>
          </div>
        </div>

        {/* Translation Group & Cornerstone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
          <div>
            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
              Grup Terjemahan (Translation Group ID)
            </label>
            <input
              type="text"
              value={translationGroupId}
              onChange={(e) => onChangeTranslationGroupId(e.target.value)}
              placeholder="UUID penghubung ID/EN..."
              className="w-full rounded-lg bg-black/40 border border-white/10 px-2.5 py-1 text-[11px] font-mono text-neutral-300 focus:outline-none focus:border-accent-400"
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
            {publicationGate.violations.map((v: any, i: number) => (
              <li key={i}>{v.message}</li>
            ))}
          </ul>
          {publicationGate.violations.some((v: any) => v.field === 'heroVisual.altText' || v.rule?.includes('hero')) && (
            <div className="pt-2 mt-2 border-t border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/40 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-red-200">
                  Hero / Cover image wajib memiliki deskripsi Alt Text (maks. 125 kar).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempAlt(coverAlt || '')
                  setShowAltFixModal(true)
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/25 hover:bg-red-500/40 border border-red-400/50 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>⚡ Perbaiki Alt Text Cover Sekarang</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Navigation Sub-Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('serp')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'serp' ? 'bg-white/15 text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Search className="w-3 h-3 text-accent-400" />
          <span>SEO & SERP</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('readability')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'readability' ? 'bg-white/15 text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-3 h-3 text-info" />
          <span>Keterbacaan</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'social' ? 'bg-white/15 text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Share2 className="w-3 h-3 text-purple-400" />
          <span>Sosial</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'advanced' ? 'bg-white/15 text-white font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3 h-3 text-amber-400" />
          <span>Advanced</span>
        </button>
      </div>

      {/* ─── TAB 1: SEO & SERP ─────────────────────────────────────────── */}
      {activeTab === 'serp' && (
        <div className="space-y-4 max-w-full overflow-x-hidden">
          {/* Focus Keyphrase */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <label className="text-xs font-mono font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-accent-400" />
                <span>Focus Keyphrase (Kata Kunci Utama)</span>
              </label>
              {focusKeyphrase && (
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    analysis.indicators.some((i) => i.id === 'kw-title' && i.status === 'good')
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                  title="Status Keyphrase di Judul"
                />
              )}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={focusKeyphrase}
                onChange={(e) => onChangeFocusKeyphrase(e.target.value)}
                placeholder="Contoh: jasa pembuatan website nextjs"
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-400"
              />
              <p className="text-[10px] text-neutral-400">
                Keyphrase utama yang ingin diranking di Google untuk bahasa [{locale.toUpperCase()}].
              </p>
            </div>

            {/* Related Keyphrases (Multi-input) */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="text-[11px] font-mono text-neutral-400 font-semibold block">
                Related Keyphrases (Maks 5)
              </label>
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
                      className="p-0.5 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {relatedKeyphrases.length < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRelatedKw}
                    onChange={(e) => setNewRelatedKw(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddRelatedKeyphrase()
                      }
                    }}
                    placeholder="Tambah kata kunci turunan..."
                    className="flex-1 rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddRelatedKeyphrase}
                    disabled={!newRelatedKw.trim()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Google SERP Snippet Preview */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase">Google SERP Preview</span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/50 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSerpDevice('desktop')}
                  className={`p-1 rounded ${serpDevice === 'desktop' ? 'bg-white/20 text-white' : 'text-neutral-400'}`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSerpDevice('mobile')}
                  className={`p-1 rounded ${serpDevice === 'mobile' ? 'bg-white/20 text-white' : 'text-neutral-400'}`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
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
                  <p className="text-[10px] text-neutral-500 truncate block max-w-full" title={`${site.url} > artikel > ${slug || ''}`}>
                    {site.url} &gt; artikel &gt; {slug || '...'}
                  </p>
                </div>
              </div>

              {/* SERP Title */}
              <h3 className="text-[16px] text-[#1a0dab] hover:underline font-normal leading-snug line-clamp-2 cursor-pointer mt-0.5 break-words">
                {effectiveTitle}
              </h3>

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
              <button
                type="button"
                onClick={() => handleAiSuggest('all')}
                disabled={generatingAiField !== null}
                className="px-2.5 py-1 rounded-lg bg-accent-500/15 hover:bg-accent-500/25 border border-accent-500/30 text-accent-300 text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-accent-400" />
                <span>{generatingAiField === 'all' ? 'Mengoptimalkan...' : 'Generate AI Lengkap'}</span>
              </button>
            </div>

            {aiError && (
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
                {aiError}
              </div>
            )}

            {/* SEO Title Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-neutral-400 font-semibold">SEO Title Template</label>
                <button
                  type="button"
                  onClick={() => handleAiSuggest('title')}
                  disabled={generatingAiField !== null}
                  className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Saran AI</span>
                </button>
              </div>

              <input
                type="text"
                value={seoTitle}
                onChange={(e) => onChangeSeoTitle(e.target.value)}
                placeholder="%title% %sep% %sitename%"
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 font-mono"
              />

              {/* Template Var Pills for Title */}
              <div className="flex flex-wrap gap-1 pt-1">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => insertVariable('title', v.code)}
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
                <label className="text-[11px] font-mono text-neutral-400 font-semibold">Meta Description</label>
                <button
                  type="button"
                  onClick={() => handleAiSuggest('metaDescription')}
                  disabled={generatingAiField !== null}
                  className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Saran AI</span>
                </button>
              </div>

              <textarea
                value={metaDescription}
                onChange={(e) => onChangeMetaDescription(e.target.value)}
                rows={3}
                placeholder="Tulis deskripsi 120-160 karakter yang memuat focus keyphrase dan ajakan bertindak..."
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 leading-relaxed"
              />

              {/* Template Var Pills for Description */}
              <div className="flex flex-wrap gap-1 pt-1">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => insertVariable('desc', v.code)}
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
                <label className="text-[11px] font-mono text-neutral-400 font-semibold">Slug URL</label>
                <button
                  type="button"
                  onClick={() => handleAiSuggest('slug')}
                  disabled={generatingAiField !== null}
                  className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Saran Slug</span>
                </button>
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => onChangeSlug(e.target.value)}
                placeholder="slug-artikel-anda"
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-accent-400"
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
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
                  <label className="text-[11px] font-mono text-neutral-400 font-semibold">
                    Deskripsi Alt Text [{locale.toUpperCase()}]
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const candidate = `${articleTitle || 'Visual'} - UNIMASI Rekayasa Sistem Digital`.slice(0, 120)
                        onChangeCoverAlt?.(candidate)
                      }}
                      className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Saran AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempAlt(coverAlt || '')
                        setShowAltFixModal(true)
                      }}
                      className="text-[10px] text-neutral-400 hover:text-white underline underline-offset-2"
                    >
                      Buka Pop-up
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={coverAlt}
                    onChange={(e) => onChangeCoverAlt?.(e.target.value)}
                    placeholder="Deskripsi spesifik tentang isi gambar untuk pembaca layar..."
                    className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 pr-16"
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
                <p className="text-[10px] text-neutral-500">
                  Wajib untuk Gerbang Publikasi. Maksimal 125 karakter, hindari kata awal &quot;gambar/foto&quot;.
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Checklist Audit */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-4 space-y-2.5">
            <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase pb-2 border-b border-white/10">
              Checklist Analisis SEO Yoast-Parity
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
                <span className="text-[9px] font-mono text-neutral-400 uppercase">UNIMASI.ID</span>
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
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">OG Title Kustom</label>
                <input
                  type="text"
                  value={socialOg.title || ''}
                  onChange={(e) => onChangeSocialOg({ ...socialOg, title: e.target.value })}
                  placeholder="Kosongkan untuk pakai SEO Title..."
                  className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-accent-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">OG Description Kustom</label>
                <textarea
                  value={socialOg.description || ''}
                  onChange={(e) => onChangeSocialOg({ ...socialOg, description: e.target.value })}
                  rows={2}
                  placeholder="Kosongkan untuk pakai Meta Description..."
                  className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-accent-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">OG Image URL & Alt Text</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={socialOg.image || ''}
                    onChange={(e) => onChangeSocialOg({ ...socialOg, image: e.target.value })}
                    placeholder="URL gambar OG (1200x630)"
                    className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white font-mono focus:outline-none focus:border-accent-400"
                  />
                  <input
                    type="text"
                    value={socialOg.imageAlt || ''}
                    onChange={(e) => onChangeSocialOg({ ...socialOg, imageAlt: e.target.value })}
                    placeholder="Alt text gambar OG"
                    className="w-full rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-accent-400"
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
                  title="Segarkan data status dari server"
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${indexingLoading ? 'animate-spin text-accent-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Target URL Reference */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-neutral-300">
              <span className="text-neutral-500 shrink-0">Target URL:</span>
              <span className="truncate text-accent-300 select-all" title={indexingTargetUrl}>
                {indexingTargetUrl || `https://www.unimasi.com/artikel/${slug || '...'}`}
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
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
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
              <label className="text-[11px] font-mono text-neutral-400 font-semibold block">
                URL Kanonikal Kustom (Canonical URL)
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => onChangeCanonicalUrl(e.target.value)}
                placeholder="Kosongkan untuk memakai URL artikel ini secara default..."
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-accent-400"
              />
              <span className="text-[10px] text-neutral-500 font-mono block">
                Default: https://www.unimasi.com/artikel/{slug}
              </span>
            </div>

            {/* Breadcrumb Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-neutral-400 font-semibold block">
                Judul Breadcrumb Khusus
              </label>
              <input
                type="text"
                value={breadcrumbTitle}
                onChange={(e) => onChangeBreadcrumbTitle(e.target.value)}
                placeholder="Kosongkan untuk memakai judul artikel..."
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400"
              />
            </div>

            {/* Schema Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-neutral-400 font-semibold block">
                Tipe Schema JSON-LD
              </label>
              <select
                value={schemaType}
                onChange={(e) => onChangeSchemaType(e.target.value as 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle')}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400"
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

      {/* ─── Cover Image & Alt Text Quick-Fix Modal ─── */}
      {showAltFixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--studio-bg)] border border-white/15 shadow-2xl p-5 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Perbaiki Alt Text Cover / Hero Visual</h3>
                  <p className="text-[11px] text-neutral-400">Wajib untuk membuka Gerbang Publikasi [{locale.toUpperCase()}]</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAltFixModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Preview & Media Picker Shortcut */}
            {coverUrl ? (
              <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
                <Image
                  src={coverUrl}
                  alt={tempAlt || 'Preview cover'}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5 justify-between">
                  <span className="text-[10px] font-mono text-neutral-300 truncate max-w-[70%]">
                    {coverUrl}
                  </span>
                  {onOpenMediaPickerForCover && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAltFixModal(false)
                        onOpenMediaPickerForCover()
                      }}
                      className="px-2 py-1 rounded bg-black/70 hover:bg-black border border-white/20 text-[10px] text-neutral-200 transition-colors flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-info" />
                      <span>Ganti Media</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/5 text-center space-y-2">
                <ImageIcon className="w-6 h-6 text-neutral-500 mx-auto" />
                <p className="text-xs text-neutral-400">Belum ada URL gambar cover yang ditentukan.</p>
                {onOpenMediaPickerForCover && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAltFixModal(false)
                      onOpenMediaPickerForCover()
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white inline-flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-info" />
                    <span>Pilih dari Galeri Media</span>
                  </button>
                )}
              </div>
            )}

            {/* Alt Text Textarea & Char Counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-neutral-300">
                  Deskripsi Alt Text (Maks. 125 Karakter)
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    tempAlt.trim().length > 125
                      ? 'text-red-400 font-bold'
                      : tempAlt.trim().length >= 10
                      ? 'text-emerald-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {tempAlt.trim().length} / 125 kar
                </span>
              </div>
              <textarea
                value={tempAlt}
                onChange={(e) => setTempAlt(e.target.value)}
                rows={3}
                placeholder={`Deskripsikan visual hero ini secara jelas dan informatif untuk bahasa [${locale.toUpperCase()}]...`}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-[#FFD600]"
              />

              {/* Real-time warning feedback */}
              {/^(gambar|foto|image of|photo of|picture of)\b/i.test(tempAlt.trim()) && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Hindari kata awal &quot;gambar/foto&quot; karena pembaca layar mengatakannya secara otomatis.</span>
                </p>
              )}
              {tempAlt.trim().length > 125 && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3 shrink-0" />
                  <span>Alt text melebihi 125 karakter. Harap ringkas agar ramah indeks Google Images.</span>
                </p>
              )}
            </div>

            {/* Preset & AI Suggestions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Saran & Rekomendasi Cepat:</span>
                <button
                  type="button"
                  onClick={() => {
                    const candidate = `${articleTitle || 'Visual'} - Solusi Rekayasa Digital UNIMASI`.slice(0, 120)
                    setTempAlt(candidate)
                  }}
                  className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Saran Cerdas</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  `${articleTitle || 'Proyek'} - Implementasi Sistem Digital UNIMASI`,
                  `Arsitektur dan antarmuka visual ${articleTitle || 'karya'}`,
                  `Solusi teknologi inovatif ${category || 'UNIMASI'}: ${articleTitle || 'Digital'}`,
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTempAlt(preset.slice(0, 120))}
                    className="text-left px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neutral-300 line-clamp-1 transition-colors"
                  >
                    + {preset.slice(0, 50)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAltFixModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-neutral-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!tempAlt.trim() || tempAlt.trim().length > 125 || /^(gambar|foto|image of|photo of|picture of)\b/i.test(tempAlt.trim())}
                onClick={() => {
                  if (onChangeCoverAlt) {
                    onChangeCoverAlt(tempAlt.trim())
                  }
                  setShowAltFixModal(false)
                }}
                className="px-4 py-1.5 rounded-xl bg-[#FFD600] hover:bg-[#E0B285] text-black font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terapkan Alt Text & Buka Kunci</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
