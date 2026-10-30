'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  FileText,
  Search,
  X,
  Upload,
  ImageIcon,
  Eye,
  Link2,
  Trash2,
  AlertTriangle,
  Calendar,
} from 'lucide-react'
import StudioSeoInspector from '@/components/studio/StudioSeoInspector'
import { AutoResizeTextarea } from './ArticleEditorCanvas'
import { CategoryCombobox } from './CategoryCombobox'
import { Locale } from '@/lib/seo/schema'
import { ContentBlock } from '@/lib/articles/blockEditor'

export interface ArticleEditorInspectorProps {
  isOpen: boolean
  onClose: () => void
  activeTab: 'document' | 'seo'
  onTabChange: (tab: 'document' | 'seo') => void

  // Document Fields
  category: string
  onCategoryChange: (val: string) => void
  categoriesList: Array<{ name: string; slug?: string }>
  tagInput: string
  onTagInputChange: (val: string) => void
  author: string
  onAuthorChange: (val: string) => void
  slug: string
  onSlugChange: (val: string) => void
  targetKeyword: string
  onTargetKeywordChange: (val: string) => void
  excerpt: string
  onExcerptChange: (val: string) => void
  coverUrl: string
  onCoverUrlChange: (val: string) => void
  coverAlt: string
  onCoverAltChange: (val: string) => void
  uploadingCover: boolean
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenMediaPickerForCover: () => void
  internalLinksCount: number
  title: string

  // SEO Inspector Props
  locale: Locale
  onChangeLocale: (loc: Locale) => void
  translationGroupId: string
  onChangeTranslationGroupId: (id: string) => void
  isCornerstone: boolean
  onChangeIsCornerstone: (v: boolean) => void
  focusKeyphrase: string
  onChangeFocusKeyphrase: (v: string) => void
  relatedKeyphrases: string[]
  onChangeRelatedKeyphrases: (v: string[]) => void
  seoTitle: string
  onChangeSeoTitle: (v: string) => void
  metaDescription: string
  onChangeMetaDescription: (v: string) => void
  canonicalUrl: string
  onChangeCanonicalUrl: (v: string) => void
  breadcrumbTitle: string
  onChangeBreadcrumbTitle: (v: string) => void
  schemaType: 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle'
  onChangeSchemaType: (v: 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle') => void
  robots: { index: boolean; follow: boolean; noarchive?: boolean; nosnippet?: boolean }
  onChangeRobots: (v: any) => void
  socialOg: any
  onChangeSocialOg: (v: any) => void
  socialTwitter: any
  onChangeSocialTwitter: (v: any) => void
  currentContent: string
  blocks: ContentBlock[]
}

export function ArticleEditorInspector({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  category,
  onCategoryChange,
  categoriesList,
  tagInput,
  onTagInputChange,
  author,
  onAuthorChange,
  slug,
  onSlugChange,
  targetKeyword,
  onTargetKeywordChange,
  excerpt,
  onExcerptChange,
  coverUrl,
  onCoverUrlChange,
  coverAlt,
  onCoverAltChange,
  uploadingCover,
  onCoverUpload,
  onOpenMediaPickerForCover,
  internalLinksCount,
  title,

  locale,
  onChangeLocale,
  translationGroupId,
  onChangeTranslationGroupId,
  isCornerstone,
  onChangeIsCornerstone,
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
  currentContent,
  blocks,
}: ArticleEditorInspectorProps) {
  if (!isOpen) return null

  return (
    <aside className="w-full sm:w-[380px] lg:w-[410px] shrink-0 h-full border-l border-white/[0.08] bg-[#161616] flex flex-col z-20 overflow-hidden shadow-2xl">
      {/* Inspector Topbar Tabs */}
      <div className="h-[52px] shrink-0 border-b border-white/[0.08] px-3 flex items-center justify-between gap-2 bg-[#191919]">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/10 flex-1">
          <button
            type="button"
            onClick={() => onTabChange('document')}
            className={`flex-1 py-1 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'document'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-accent-400" />
            <span>Dokumen</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('seo')}
            className={`flex-1 py-1 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'seo'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-accent-400" />
            <span>SEO Engine</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Tutup Panel Inspector (Lebihkan Ruang Menulis)"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full p-4 space-y-4 scrollbar-thin">
        {/* TAB 1: DOKUMEN & IDENTITAS */}
        {activeTab === 'document' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Internal Link Equity Banner */}
            {internalLinksCount > 0 && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3 flex items-start gap-2.5 text-xs shadow-soft-sm">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Link2 className="w-3 h-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-emerald-300 text-xs">
                      {internalLinksCount} Link Internal Terdeteksi
                    </p>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Crawlable
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Tautan internal terhubung ke struktur situs untuk menjaga PageRank & SEO link equity.
                  </p>
                </div>
              </div>
            )}

            {/* Identitas Dokumen */}
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-3.5 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/10">
                <FileText className="w-3.5 h-3.5 text-accent-400" />
                <span>Identitas &amp; Taksonomi</span>
              </h4>

              {/* Kategori */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1 font-semibold">
                  Kategori Konten
                </label>
                <CategoryCombobox
                  value={category}
                  onChange={onCategoryChange}
                  categoriesList={categoriesList}
                  variant="inspector"
                />
              </div>

              {/* Tag Artikel */}
              <div>
                <label htmlFor="article-tags" className="text-[10px] font-mono text-neutral-400 block mb-1 font-semibold">
                  Tag Artikel
                </label>
                <input
                  id="article-tags"
                  value={tagInput}
                  onChange={(e) => onTagInputChange(e.target.value)}
                  placeholder="nextjs, seo, arsitektur, web"
                  className="w-full rounded-lg bg-black/40 border border-white/15 p-2 text-xs text-white focus:outline-none focus:border-accent-400"
                />
                <p className="mt-1 text-[10px] text-neutral-500 font-mono">Pisahkan dengan koma.</p>
              </div>

              {/* Penulis */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1 font-semibold">
                  Penulis (Author)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => onAuthorChange(e.target.value)}
                  placeholder="Nama Penulis"
                  className="w-full rounded-lg bg-black/40 border border-white/15 p-2 text-xs text-white focus:outline-none focus:border-accent-400"
                />
              </div>

              {/* Slug Kanonikal */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1 font-semibold">
                  Slug URL Kanonikal
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  placeholder="slug-artikel"
                  className="w-full rounded-lg bg-black/40 border border-white/15 p-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-accent-400"
                />
                <span className="text-[10px] font-mono text-accent-400/80 block mt-1 truncate">
                  /artikel/{slug || '...'}
                </span>
              </div>

              {/* Target Keyword */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1 font-semibold">
                  Target Keyword SEO
                </label>
                <input
                  type="text"
                  value={targetKeyword}
                  onChange={(e) => onTargetKeywordChange(e.target.value)}
                  placeholder="Contoh: Web Development"
                  className="w-full rounded-lg bg-black/40 border border-white/15 p-2 text-xs text-white focus:outline-none focus:border-accent-400"
                />
              </div>

              {/* Ringkasan Meta (Excerpt) */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1 font-semibold">
                  Ringkasan Meta (Excerpt)
                </label>
                <AutoResizeTextarea
                  value={excerpt}
                  onChange={onExcerptChange}
                  placeholder="Ringkasan singkat untuk cuplikan SERP Google..."
                  minHeight={52}
                  className="w-full rounded-lg bg-black/40 border border-white/15 p-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-400 leading-relaxed"
                />
              </div>
            </div>

            {/* Visual Cover Hero */}
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-accent-400" />
                  <span>Visual Cover Hero</span>
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                  Featured
                </span>
              </div>

              {coverUrl ? (
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/15 bg-black group shadow-md">
                  <Image
                    src={coverUrl}
                    alt="Cover Hero Artikel"
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={onOpenMediaPickerForCover}
                      className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => onCoverUrlChange('')}
                      className="p-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-300 text-xs"
                      title="Hapus Cover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={onOpenMediaPickerForCover}
                  className="relative aspect-[16/9] w-full rounded-xl border-2 border-dashed border-white/15 hover:border-accent-400/50 bg-black/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-4 text-center group"
                >
                  <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-accent-500/20 text-neutral-400 group-hover:text-accent-400 flex items-center justify-center transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-300 group-hover:text-white">
                      Pilih Gambar Cover Hero
                    </p>
                    <p className="text-[10px] text-neutral-500">Rasio 16:9 disarankan</p>
                  </div>
                </div>
              )}

              {/* Buttons: Media Picker & Upload */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenMediaPickerForCover}
                  className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white text-center transition-colors"
                >
                  Galeri Media
                </button>

                <label className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                  <Upload className={`w-3.5 h-3.5 text-accent-400 ${uploadingCover ? 'animate-bounce' : ''}`} />
                  <span>{uploadingCover ? 'Mengunggah...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingCover}
                    onChange={onCoverUpload}
                  />
                </label>
              </div>

              {/* Alt Text Cover Hero (Publication Gate Requirement) */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 flex items-center justify-between mb-1">
                  <span className="font-semibold text-amber-300">
                    Alt Text Cover ({locale.toUpperCase()}) *
                  </span>
                  <span className="text-[9px] text-neutral-500 font-normal">Wajib Terisi</span>
                </label>
                <input
                  type="text"
                  value={coverAlt}
                  onChange={(e) => onCoverAltChange(e.target.value)}
                  placeholder="Deskripsi cover untuk mesin pencari & pembaca layar..."
                  className={`w-full rounded-lg bg-black/40 border p-2 text-xs text-white focus:outline-none ${
                    !coverAlt && coverUrl
                      ? 'border-amber-500/60 focus:border-amber-400'
                      : 'border-white/15 focus:border-accent-400'
                  }`}
                />
                {!coverAlt && coverUrl && (
                  <p className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Wajib diisi agar dapat dipublikasikan.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Mini Public Card Preview */}
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-3.5 space-y-2">
              <h4 className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/10">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Cuplikan Kartu Publik</span>
              </h4>

              <div className="rounded-lg overflow-hidden border border-white/10 bg-neutral-900 shadow-md">
                <div className="relative aspect-video w-full bg-black">
                  {coverUrl && (
                    <Image
                      src={coverUrl}
                      alt={title || 'Cover'}
                      fill
                      sizes="380px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[9px] font-mono text-white">
                    {category}
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <h5 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {title || 'Judul artikel Anda'}
                  </h5>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">
                    {excerpt || 'Ringkasan singkat artikel...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEO ENGINE (YOAST PARITY) */}
        {activeTab === 'seo' && (
          <div className="space-y-4 animate-fadeIn">
            <StudioSeoInspector
              locale={locale}
              onChangeLocale={onChangeLocale}
              translationGroupId={translationGroupId}
              onChangeTranslationGroupId={onChangeTranslationGroupId}
              isCornerstone={isCornerstone}
              onChangeIsCornerstone={onChangeIsCornerstone}
              articleTitle={title}
              articleExcerpt={excerpt}
              content={currentContent}
              category={category}
              slug={slug}
              onChangeSlug={onSlugChange}
              focusKeyphrase={focusKeyphrase}
              onChangeFocusKeyphrase={onChangeFocusKeyphrase}
              relatedKeyphrases={relatedKeyphrases}
              onChangeRelatedKeyphrases={onChangeRelatedKeyphrases}
              seoTitle={seoTitle}
              onChangeSeoTitle={onChangeSeoTitle}
              metaDescription={metaDescription}
              onChangeMetaDescription={onChangeMetaDescription}
              canonicalUrl={canonicalUrl}
              onChangeCanonicalUrl={onChangeCanonicalUrl}
              breadcrumbTitle={breadcrumbTitle}
              onChangeBreadcrumbTitle={onChangeBreadcrumbTitle}
              schemaType={schemaType}
              onChangeSchemaType={onChangeSchemaType}
              robots={robots}
              onChangeRobots={onChangeRobots}
              socialOg={socialOg}
              onChangeSocialOg={onChangeSocialOg}
              socialTwitter={socialTwitter}
              onChangeSocialTwitter={onChangeSocialTwitter}
              coverUrl={coverUrl}
              coverAlt={coverAlt}
              onChangeCoverAlt={onCoverAltChange}
              contentImages={blocks
                .filter((b): b is Extract<ContentBlock, { type: 'image' }> => b.type === 'image' && Boolean(b.url))
                .map((b) => ({
                  url: b.url || '',
                  altText: b.alt || b.caption || '',
                  decorative: false,
                }))}
              existingSlugs={[]}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
