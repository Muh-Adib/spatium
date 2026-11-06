'use client'

import React, { memo, useRef } from 'react'
import Image from 'next/image'
import { FileText, Search, X, Upload, ImageIcon, Eye, Link2, Trash2, AlertTriangle, ChevronDown } from 'lucide-react'
import StudioSeoInspector from '@/components/studio/StudioSeoInspector'
import type { DetailedSeoAnalysisResult } from '@/lib/seo/analyzer'
import type { ArticleDoc } from '@/lib/articles/editorState'
import { AutoResizeTextarea } from './ArticleEditorCanvas'
import { CategoryCombobox } from './CategoryCombobox'
import { EditorDialog } from './EditorDialog'

export type InspectorTab = 'document' | 'seo'

export interface ArticleEditorInspectorProps {
  isOpen: boolean
  /** Render as a modal side sheet (narrow viewports) instead of a docked panel. */
  asSheet: boolean
  onClose: () => void
  activeTab: InspectorTab
  onTabChange: (tab: InspectorTab) => void
  doc: ArticleDoc
  setField: <K extends keyof ArticleDoc>(field: K, value: ArticleDoc[K]) => void
  setSlug: (slug: string) => void
  categoriesList: Array<{ name: string; slug?: string }>
  uploadingCover: boolean
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenMediaPickerForCover: () => void
  internalLinksCount: number
  /** Debounced content + analysis computed once by the page (no duplicate scoring here). */
  analysisContent: string
  analysis: DetailedSeoAnalysisResult
  contentImages: Array<{ url: string; altText?: string; decorative?: boolean }>
  seoFocusRequest: { id: string; nonce: number } | null
}

const TABS: Array<{ id: InspectorTab; label: string; icon: typeof FileText }> = [
  { id: 'document', label: 'Dokumen', icon: FileText },
  { id: 'seo', label: 'SEO', icon: Search },
]

const inputCls =
  'w-full rounded-lg bg-black/40 border border-white/15 p-2 text-xs text-white placeholder:text-neutral-500 aria-[invalid=true]:border-amber-400'
const labelCls = 'text-[11px] font-mono text-neutral-300 block mb-1 font-semibold'

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-white/10 bg-surface-elevated">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-3.5 py-3 text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-200 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">{icon}</span>
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-300 group-open:rotate-180 motion-safe:transition-transform" aria-hidden="true" />
      </summary>
      <div className="space-y-3 border-t border-white/10 px-3.5 pb-3.5 pt-3">{children}</div>
    </details>
  )
}

function DocumentPanel(props: ArticleEditorInspectorProps) {
  const { doc, setField, setSlug, categoriesList, uploadingCover, onCoverUpload, onOpenMediaPickerForCover, internalLinksCount } = props
  const coverAltMissing = Boolean(doc.coverUrl) && !doc.coverAlt.trim()

  return (
    <div className="space-y-4">
      {internalLinksCount > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3 text-xs text-emerald-200">
          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{internalLinksCount} tautan internal di isi artikel.</span>
        </p>
      )}

      <Section title="Identitas & taksonomi" icon={<FileText className="h-3.5 w-3.5 text-accent-400" />}>
        <div>
          <label htmlFor="article-category" className={labelCls}>
            Kategori
          </label>
          <CategoryCombobox
            id="article-category"
            value={doc.category}
            onChange={(v) => setField('category', v)}
            categoriesList={categoriesList}
            variant="inspector"
          />
        </div>

        <div>
          <label htmlFor="article-tags" className={labelCls}>
            Tag
          </label>
          <input
            id="article-tags"
            value={doc.tagInput}
            onChange={(e) => setField('tagInput', e.target.value)}
            aria-describedby="article-tags-hint"
            placeholder="digital twin, gaussian splatting"
            className={inputCls}
          />
          <p id="article-tags-hint" className="mt-1 text-[11px] text-neutral-400">
            Pisahkan dengan koma.
          </p>
        </div>

        <div>
          <label htmlFor="article-author" className={labelCls}>
            Penulis
          </label>
          <input
            id="article-author"
            type="text"
            autoComplete="name"
            value={doc.author}
            onChange={(e) => setField('author', e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="article-slug" className={labelCls}>
            Slug URL
          </label>
          <input
            id="article-slug"
            type="text"
            value={doc.slug}
            onChange={(e) => setSlug(e.target.value)}
            aria-describedby="article-slug-hint"
            placeholder="slug-artikel"
            spellCheck={false}
            className={`${inputCls} font-mono`}
          />
          <p id="article-slug-hint" className="mt-1 break-all font-mono text-[11px] text-neutral-400">
            /journal/{doc.slug || '…'}
          </p>
        </div>

        <div>
          <label htmlFor="article-excerpt" className={labelCls}>
            Ringkasan
          </label>
          <AutoResizeTextarea
            id="article-excerpt"
            value={doc.excerpt}
            onChange={(v) => setField('excerpt', v)}
            aria-describedby="article-excerpt-hint"
            placeholder="Ringkasan singkat untuk kartu artikel dan cuplikan pencarian…"
            minHeight={52}
            className={`${inputCls} leading-relaxed`}
          />
          <p id="article-excerpt-hint" className="mt-1 text-[11px] text-neutral-400">
            Dipakai sebagai meta description jika kolom SEO kosong.
          </p>
        </div>
      </Section>

      <Section title="Gambar sampul" icon={<ImageIcon className="h-3.5 w-3.5 text-accent-400" />}>
        {doc.coverUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/15 bg-black">
            <Image src={doc.coverUrl} alt={doc.coverAlt} fill sizes="(max-width: 768px) 100vw, 380px" className="object-cover" />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/20 p-4 text-center text-xs text-neutral-300">
            Belum ada gambar sampul. Rasio 16:9 disarankan.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenMediaPickerForCover}
            className="min-h-9 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-neutral-100 hover:bg-white/10"
          >
            {doc.coverUrl ? 'Ganti dari galeri' : 'Pilih dari galeri'}
          </button>
          <label className="flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-center text-xs font-semibold text-neutral-100 hover:bg-white/10 focus-within:ring-2 focus-within:ring-accent-400">
            <Upload className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
            <span>{uploadingCover ? 'Mengunggah…' : 'Unggah file'}</span>
            <input type="file" accept="image/*" className="sr-only" disabled={uploadingCover} onChange={onCoverUpload} />
          </label>
          {doc.coverUrl && (
            <button
              type="button"
              onClick={() => setField('coverUrl', '')}
              className="col-span-2 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Lepas gambar sampul
            </button>
          )}
        </div>

        <div>
          <label htmlFor="article-cover-alt" className={labelCls}>
            Alt text sampul ({doc.locale.toUpperCase()}){doc.coverUrl ? ' — wajib' : ''}
          </label>
          <input
            id="article-cover-alt"
            type="text"
            value={doc.coverAlt}
            onChange={(e) => setField('coverAlt', e.target.value)}
            aria-invalid={coverAltMissing ? true : undefined}
            aria-describedby={coverAltMissing ? 'article-cover-alt-error' : undefined}
            placeholder="Deskripsikan isi gambar untuk pembaca layar…"
            className={inputCls}
          />
          {coverAltMissing && (
            <p id="article-cover-alt-error" className="mt-1 flex items-center gap-1 text-[11px] text-amber-300">
              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
              Wajib diisi agar artikel bisa diterbitkan.
            </p>
          )}
        </div>
      </Section>

      <Section title="Cuplikan kartu publik" icon={<Eye className="h-3.5 w-3.5 text-info-300" />} defaultOpen={false}>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
          <div className="relative aspect-video w-full bg-black">
            {doc.coverUrl && <Image src={doc.coverUrl} alt="" fill sizes="380px" className="object-cover" />}
            <span className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white">
              {doc.category}
            </span>
          </div>
          <div className="space-y-1 p-3">
            <p className="text-xs font-bold leading-snug text-white">{doc.title || 'Judul artikel'}</p>
            <p className="text-[11px] text-neutral-300">{doc.excerpt || 'Ringkasan artikel…'}</p>
          </div>
        </div>
      </Section>
    </div>
  )
}

function SeoPanel(props: ArticleEditorInspectorProps) {
  const { doc, setField, setSlug, analysis, analysisContent, contentImages, seoFocusRequest } = props
  return (
    <StudioSeoInspector
      locale={doc.locale}
      onChangeLocale={(v) => setField('locale', v)}
      translationGroupId={doc.translationGroupId}
      onChangeTranslationGroupId={(v) => setField('translationGroupId', v)}
      isCornerstone={doc.isCornerstone}
      onChangeIsCornerstone={(v) => setField('isCornerstone', v)}
      articleTitle={doc.title}
      articleExcerpt={doc.excerpt}
      content={analysisContent}
      analysis={analysis}
      category={doc.category}
      slug={doc.slug}
      onChangeSlug={setSlug}
      focusKeyphrase={doc.focusKeyphrase}
      onChangeFocusKeyphrase={(v) => setField('focusKeyphrase', v)}
      relatedKeyphrases={doc.relatedKeyphrases}
      onChangeRelatedKeyphrases={(v) => setField('relatedKeyphrases', v)}
      seoTitle={doc.seoTitle}
      onChangeSeoTitle={(v) => setField('seoTitle', v)}
      metaDescription={doc.metaDescription}
      onChangeMetaDescription={(v) => setField('metaDescription', v)}
      canonicalUrl={doc.canonicalUrl}
      onChangeCanonicalUrl={(v) => setField('canonicalUrl', v)}
      breadcrumbTitle={doc.breadcrumbTitle}
      onChangeBreadcrumbTitle={(v) => setField('breadcrumbTitle', v)}
      schemaType={doc.schemaType}
      onChangeSchemaType={(v) => setField('schemaType', v)}
      robots={doc.robots}
      onChangeRobots={(v) => setField('robots', v)}
      socialOg={doc.socialOg}
      onChangeSocialOg={(v) => setField('socialOg', v)}
      socialTwitter={doc.socialTwitter}
      onChangeSocialTwitter={(v) => setField('socialTwitter', v)}
      coverUrl={doc.coverUrl}
      coverAlt={doc.coverAlt}
      onChangeCoverAlt={(v) => setField('coverAlt', v)}
      contentImages={contentImages}
      existingSlugs={[]}
      articleStatus={doc.status}
      focusRequest={seoFocusRequest}
    />
  )
}

function InspectorBody(props: ArticleEditorInspectorProps) {
  const { activeTab, onTabChange } = props
  const tabRefs = useRef<Record<InspectorTab, HTMLButtonElement | null>>({ document: null, seo: null })

  // APG tabs: arrows / Home / End move focus and select (automatic activation).
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    if (next < 0) return
    e.preventDefault()
    const tab = TABS[next]
    if (!tab) return
    onTabChange(tab.id)
    tabRefs.current[tab.id]?.focus()
  }

  return (
    <>
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[var(--studio-bg)] px-3">
        <div role="tablist" aria-label="Panel artikel" className="flex flex-1 items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5">
          {TABS.map((tab, i) => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el
                }}
                id={`inspector-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`inspector-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  selected ? 'bg-white/15 text-white' : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.id === 'seo' && (
                  <span className="font-mono text-[10px] text-neutral-300">{props.analysis.seoScore}/100</span>
                )}
              </button>
            )
          })}
        </div>
        {!props.asSheet && (
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Tutup panel Dokumen & SEO"
            aria-keyshortcuts="Control+/ Meta+/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        id={`inspector-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`inspector-tab-${activeTab}`}
        tabIndex={0}
        className="min-w-0 max-w-full flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin"
      >
        {activeTab === 'document' ? <DocumentPanel {...props} /> : <SeoPanel {...props} />}
      </div>
    </>
  )
}

export const ArticleEditorInspector = memo(function ArticleEditorInspector(props: ArticleEditorInspectorProps) {
  if (props.asSheet) {
    return (
      <EditorDialog open={props.isOpen} onClose={props.onClose} variant="sheet" title="Dokumen & SEO" className="[&_[data-dialog-body]]:p-0">
        <div className="flex h-full min-h-0 flex-col">
          <InspectorBody {...props} />
        </div>
      </EditorDialog>
    )
  }
  if (!props.isOpen) return null
  return (
    <aside
      aria-label="Dokumen & SEO"
      className="z-20 flex h-full w-[380px] shrink-0 flex-col overflow-hidden border-l border-white/[0.08] bg-[var(--studio-sidebar-bg)] xl:w-[410px]"
    >
      <InspectorBody {...props} />
    </aside>
  )
})
