'use client'

import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ExternalLink, RotateCcw, X } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  blocksToContent,
  contentToBlocks,
  extractTitleAndContentFromMarkdown,
  generateBlockId,
  type BlockType,
  type ContentBlock,
} from '@/lib/articles/blockEditor'
import { convertBlock, createBlock, publishableImageBlocks } from '@/lib/articles/blockFactory'
import {
  EditorArticleSchema,
  articleEditorReducer,
  articleToDoc,
  createEmptyDoc,
  localDraftDiffers,
  localDraftKey,
  parseLocalDraft,
  resolveSeoTemplate,
  serializeLocalDraft,
  setFieldAction,
  slugify,
  type ArticleDoc,
  type ArticleEditorStatus,
  type LocalDraft,
} from '@/lib/articles/editorState'
import { checkPublicationGate } from '@/lib/seo/validation'
import { analyzeContentSeo } from '@/lib/seo/analyzer'
import MediaPickerModal from '@/components/studio/MediaPickerModal'
import { ArticleEditorHeader, type EditorViewMode } from '@/components/studio/editor/ArticleEditorHeader'
import { ArticleEditorCanvas, type BlockActions } from '@/components/studio/editor/ArticleEditorCanvas'
import { ArticleEditorInspector, type InspectorTab } from '@/components/studio/editor/ArticleEditorInspector'
import { ArticleLivePreview } from '@/components/studio/editor/ArticleLivePreview'
import { ArticlePublicationGateModal, type GateIssue } from '@/components/studio/editor/ArticlePublicationGateModal'
import { ArticleUnsavedModal } from '@/components/studio/editor/ArticleUnsavedModal'
import { ArticleConflictModal } from '@/components/studio/editor/ArticleConflictModal'
import { ArticleShortcutsDialog } from '@/components/studio/editor/ArticleShortcutsDialog'

/** Heartbeat for the advisory edit lock (server TTL is 45 s, see src/lib/articles/locks.ts). */
const LOCK_HEARTBEAT_MS = 25_000
const AUTOSAVE_DELAY_MS = 1_200
const ANALYSIS_DELAY_MS = 300
const SLUG_DELAY_MS = 400
const ARTICLES_LIST_URL = '/admin?tab=articles'

// ---------------------------------------------------------------------------
// Small hooks
// ---------------------------------------------------------------------------

/** Latest-closure callback with a stable identity (keeps memoized children from re-rendering). */
function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = useRef(fn)
  useLayoutEffect(() => {
    ref.current = fn
  })
  return useCallback((...args: A) => ref.current(...args), [])
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function useMediaQuery(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

const isTextEntry = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** Focus an element once it exists (it may live in a panel that is being opened). */
function focusWhenReady(id: string, attempts = 12) {
  const el = document.getElementById(id)
  if (el) {
    const details = el.closest('details')
    if (details && !details.open) details.open = true
    el.focus()
    el.scrollIntoView({ block: 'center' })
    return
  }
  if (attempts > 0) requestAnimationFrame(() => focusWhenReady(id, attempts - 1))
}

const GATE_FIELD_LABELS: Record<string, string> = {
  slug: 'Slug URL',
  seoTitle: 'SEO title',
  metaDescription: 'Meta description',
  'heroVisual.altText': 'Alt text gambar sampul',
}

function gateFieldLabel(field: string): string | null {
  const image = /^images\[(\d+)\]\.altText$/.exec(field)
  if (image) return `Alt text gambar ${Number(image[1]) + 1}`
  return GATE_FIELD_LABELS[field] ?? null
}

type Notice = { tone: 'success'; text: string; url?: string; urlLabel?: string } | { tone: 'error'; text: string }

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function ArticleEditorInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { actorName, permissions, getAuthHeaders } = useAuth()

  // `editSlug` is the persisted slug of the article on the server (null = not created yet).
  const [editSlug, setEditSlug] = useState<string | null>(searchParams?.get('slug') ?? null)
  const isEditMode = Boolean(editSlug)
  const locallySavedSlugRef = useRef<string | null>(null)
  const authHeadersRef = useRef(getAuthHeaders)
  authHeadersRef.current = getAuthHeaders

  const [state, dispatch] = useReducer(articleEditorReducer, undefined, () => ({
    doc: createEmptyDoc(),
    isDirty: false,
    slugTouched: false,
  }))
  const { doc, isDirty } = state
  const stateRef = useRef(state)
  stateRef.current = state

  // Server sync
  const [loading, setLoading] = useState<boolean>(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeLockUser, setActiveLockUser] = useState<{ name: string; email: string } | null>(null)
  const [conflict, setConflict] = useState<{ serverUpdatedAt: string | null } | null>(null)
  const [gateIssues, setGateIssues] = useState<GateIssue[]>([])
  const gateImageIdsRef = useRef<string[]>([])

  // Local autosave
  const [localSavedAt, setLocalSavedAt] = useState<Date | null>(null)
  const [pendingLocalDraft, setPendingLocalDraft] = useState<LocalDraft | null>(null)

  // Layout
  const isWide = useMediaQuery('(min-width: 1024px)', true)
  const [viewMode, setViewMode] = useState<EditorViewMode>('split-inspector')
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('document')
  const [seoFocusRequest, setSeoFocusRequest] = useState<{ id: string; nonce: number } | null>(null)
  const [rawHtmlBlockIds, setRawHtmlBlockIds] = useState<Record<string, boolean>>({})
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [leave, setLeave] = useState<{ open: boolean; url: string | null }>({ open: false, url: null })

  // Misc
  const [categoriesList, setCategoriesList] = useState<Array<{ name: string; slug?: string }>>([])
  const [media, setMedia] = useState<{ open: boolean; target: 'cover' | { blockId: string } }>({ open: false, target: 'cover' })
  const [uploadingCover, setUploadingCover] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [undo, setUndo] = useState<{ block: ContentBlock; index: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')

  // The inspector starts closed on narrow screens (it opens as a sheet there).
  const narrowInitRef = useRef(false)
  useEffect(() => {
    if (narrowInitRef.current) return
    narrowInitRef.current = true
    if (!window.matchMedia('(min-width: 1024px)').matches) setInspectorOpen(false)
  }, [])

  const setField = useCallback(<K extends keyof ArticleDoc>(field: K, value: ArticleDoc[K]) => dispatch(setFieldAction(field, value)), [])
  const setSlug = useCallback((slug: string) => dispatch({ type: 'setSlug', slug }), [])
  const setTitle = useCallback((title: string) => dispatch(setFieldAction('title', title)), [])
  const setCategory = useCallback((category: string) => dispatch(setFieldAction('category', category)), [])
  const setRawContent = useCallback((raw: string) => dispatch(setFieldAction('rawContent', raw)), [])

  // ---------------- Data loading ----------------
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/categories', { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { success?: boolean; data?: Array<{ name?: unknown; slug?: unknown }> }) => {
        if (json.success && Array.isArray(json.data)) {
          setCategoriesList(
            json.data
              .filter((c): c is { name: string; slug?: unknown } => typeof c.name === 'string')
              .map((c) => ({ name: c.name, slug: typeof c.slug === 'string' ? c.slug : undefined })),
          )
        }
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) console.warn('[ArticleEditor] Categories unavailable:', err)
      })
    return () => controller.abort()
  }, [])

  // New article: default the author to the signed-in user.
  useEffect(() => {
    if (actorName && !isEditMode && !stateRef.current.doc.author) {
      dispatch({ type: 'patch', patch: { author: actorName }, dirty: false })
    }
  }, [actorName, isEditMode])

  // Offer to restore a browser draft for a new article.
  useEffect(() => {
    if (isEditMode) return
    try {
      const local = parseLocalDraft(localStorage.getItem(localDraftKey(null)))
      if (local && (local.doc.title.trim() || local.doc.blocks.length > 1)) setPendingLocalDraft(local)
    } catch (err) {
      console.warn('[ArticleEditor] Local draft unavailable:', err)
    }
    // Only on first mount for new articles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!editSlug) return
    // The slug was just created/renamed by our own save: the editor already holds that state.
    if (locallySavedSlugRef.current === editSlug) return

    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    fetch(`/api/articles?slug=${encodeURIComponent(editSlug)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Artikel tidak ditemukan.' : `Gagal memuat artikel (HTTP ${res.status}).`)
        const json: unknown = await res.json()
        const parsed = EditorArticleSchema.safeParse((json as { article?: unknown } | null)?.article)
        if (!parsed.success) throw new Error('Data artikel dari server tidak sesuai format.')
        const loaded = articleToDoc(parsed.data, editSlug, actorName || '')
        dispatch({ type: 'load', doc: loaded })
        setLoadedUpdatedAt(parsed.data.updatedAt ?? null)

        try {
          const local = parseLocalDraft(localStorage.getItem(localDraftKey(editSlug)))
          if (local && localDraftDiffers(local.doc, loaded)) setPendingLocalDraft(local)
        } catch (err) {
          console.warn('[ArticleEditor] Local draft unavailable:', err)
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[ArticleEditor] Load failed:', err)
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat artikel.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
    // actorName only provides a fallback author; re-fetching when it resolves would discard edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSlug])

  // ---------------- Advisory edit lock ----------------
  // Only articles that exist on the server are locked, keyed by the persisted slug — which does
  // not change while typing (title/slug edits only take effect on save). One POST per heartbeat.
  const lockSlug = isEditMode && !loading && !loadError ? editSlug : null
  useEffect(() => {
    if (!lockSlug) return
    let cancelled = false

    const heartbeat = async () => {
      try {
        const res = await fetch('/api/articles/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeadersRef.current() },
          body: JSON.stringify({ slug: lockSlug }),
        })
        if (cancelled) return
        if (res.status === 423) {
          const body = (await res.json()) as { lockedBy?: { name?: string; email?: string } }
          setActiveLockUser({ name: body.lockedBy?.name || 'Editor lain', email: body.lockedBy?.email || '' })
        } else if (res.ok) {
          setActiveLockUser(null)
        } else {
          console.warn('[ArticleEditor] Lock heartbeat rejected:', res.status)
        }
      } catch (err) {
        console.warn('[ArticleEditor] Lock heartbeat failed:', err)
      }
    }

    void heartbeat()
    const interval = setInterval(heartbeat, LOCK_HEARTBEAT_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
      fetch(`/api/articles/lock?slug=${encodeURIComponent(lockSlug)}`, {
        method: 'DELETE',
        headers: authHeadersRef.current(),
        keepalive: true,
      }).catch((err: unknown) => console.warn('[ArticleEditor] Lock release failed:', err))
    }
  }, [lockSlug])

  // ---------------- Derived values ----------------
  // New articles: derive the slug from the title once typing pauses (until the slug is edited by hand).
  useEffect(() => {
    if (isEditMode || state.slugTouched) return
    const t = setTimeout(() => dispatch({ type: 'autoSlug', slug: slugify(doc.title) }), SLUG_DELAY_MS)
    return () => clearTimeout(t)
  }, [doc.title, isEditMode, state.slugTouched])

  // SEO is computed once, from a debounced snapshot, and passed to header + inspector.
  const analysisDoc = useDebouncedValue(doc, ANALYSIS_DELAY_MS)
  const analysisContent = useMemo(
    () => (analysisDoc.editorStyle === 'blocks' ? blocksToContent(analysisDoc.blocks) : analysisDoc.rawContent),
    [analysisDoc.blocks, analysisDoc.rawContent, analysisDoc.editorStyle],
  )
  const contentImages = useMemo(
    () => publishableImageBlocks(analysisDoc.blocks).map((b) => ({ url: b.url, altText: b.alt || b.caption || '', decorative: false })),
    [analysisDoc.blocks],
  )
  const seoAnalysis = useMemo(() => {
    const d = analysisDoc
    const vars = { title: d.title, siteName: siteConfig.name, category: d.category }
    return analyzeContentSeo({
      title: d.title,
      seoTitle: resolveSeoTemplate(d.seoTitle, vars) || d.title,
      metaDescription: resolveSeoTemplate(d.metaDescription, vars) || d.excerpt,
      slug: d.slug || editSlug || '',
      content: analysisContent,
      focusKeyphrase: d.focusKeyphrase || d.targetKeyword || d.title.split(' ').slice(0, 2).join(' '),
      relatedKeyphrases: d.relatedKeyphrases,
      locale: d.locale,
      isCornerstone: d.isCornerstone,
      images: [
        ...(d.coverUrl ? [{ url: d.coverUrl, alt: d.coverAlt }] : []),
        ...contentImages.map((img) => ({ url: img.url, alt: img.altText })),
      ],
    })
  }, [analysisDoc, analysisContent, contentImages, editSlug])
  const wordCount = seoAnalysis.metrics.wordCount
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180))

  // ---------------- Local autosave ----------------
  useEffect(() => {
    if (!isDirty || loading || pendingLocalDraft) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(localDraftKey(editSlug), serializeLocalDraft(doc, loadedUpdatedAt))
        setLocalSavedAt(new Date())
      } catch (err) {
        console.warn('[ArticleEditor] Local autosave failed (storage full or blocked):', err)
      }
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [doc, isDirty, loading, pendingLocalDraft, editSlug, loadedUpdatedAt])

  const clearLocalDrafts = (...slugs: Array<string | null>) => {
    try {
      for (const s of slugs) localStorage.removeItem(localDraftKey(s))
    } catch (err) {
      console.warn('[ArticleEditor] Could not clear local draft:', err)
    }
    setLocalSavedAt(null)
  }

  // ---------------- Block actions (stable) ----------------
  const blockActions = useMemo<BlockActions>(() => {
    const updateBlocks = (update: (prev: ContentBlock[]) => ContentBlock[]) => dispatch({ type: 'updateBlocks', update })
    return {
      add: (type: BlockType) => {
        const block = createBlock(type)
        updateBlocks((prev) => [...prev, block])
        if (type === 'image') setMedia({ open: true, target: { blockId: block.id } })
        else requestAnimationFrame(() => {
          const row = document.querySelector<HTMLElement>(`[data-block-index="${stateRef.current.doc.blocks.length - 1}"]`)
          const field = row?.querySelector<HTMLElement>('[contenteditable="true"], textarea, input:not([type="checkbox"])')
          ;(field ?? row)?.focus()
        })
      },
      update: (id, updated) =>
        updateBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...updated } as ContentBlock) : b))),
      remove: (id) => {
        const blocks = stateRef.current.doc.blocks
        const index = blocks.findIndex((b) => b.id === id)
        const block = blocks[index]
        if (!block) return
        updateBlocks((prev) => prev.filter((b) => b.id !== id))
        setUndo({ block, index })
        setAnnouncement(`Blok ${index + 1} dihapus. Pilih Urungkan untuk mengembalikannya.`)
        requestAnimationFrame(() => {
          const next =
            document.querySelector<HTMLElement>(`[data-block-index="${index}"]`) ??
            document.querySelector<HTMLElement>(`[data-block-index="${index - 1}"]`)
          next?.focus()
        })
      },
      move: (id, direction) => {
        const blocks = stateRef.current.doc.blocks
        const index = blocks.findIndex((b) => b.id === id)
        const target = direction === 'up' ? index - 1 : index + 1
        if (index < 0 || target < 0 || target >= blocks.length) return
        updateBlocks((prev) => {
          const next = [...prev]
          const [moved] = next.splice(index, 1)
          if (moved) next.splice(target, 0, moved)
          return next
        })
        setAnnouncement(`Blok dipindah ke posisi ${target + 1} dari ${blocks.length}.`)
      },
      convert: (id, targetType) => updateBlocks((prev) => prev.map((b) => (b.id === id ? convertBlock(b, targetType) : b))),
      toggleRawHtml: (id) => setRawHtmlBlockIds((prev) => ({ ...prev, [id]: !prev[id] })),
      openMediaPicker: (id) => setMedia({ open: true, target: { blockId: id } }),
      splitHtml: (id) =>
        updateBlocks((prev) => {
          const index = prev.findIndex((b) => b.id === id)
          const target = prev[index]
          if (!target || target.type !== 'html' || !target.html) return prev
          const inner = contentToBlocks(target.html).map((b) => ({ ...b, id: generateBlockId('b') }))
          if (inner.length === 0) return prev
          const next = [...prev]
          next.splice(index, 1, ...inner)
          return next
        }),
    }
  }, [])

  const undoRemove = () => {
    if (!undo) return
    const { block, index } = undo
    dispatch({
      type: 'updateBlocks',
      update: (prev) => {
        const next = [...prev]
        next.splice(Math.min(index, next.length), 0, block)
        return next
      },
    })
    setUndo(null)
    setAnnouncement(`Blok ${index + 1} dikembalikan.`)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-block-index="${index}"]`)?.focus())
  }

  // ---------------- Content mode & import ----------------
  const applyConvertedContent = (raw: string, useExtractedTitle: boolean) => {
    if (!raw.trim()) return
    const current = stateRef.current.doc
    const { title: extracted, content } = extractTitleAndContentFromMarkdown(raw)
    const takeTitle = useExtractedTitle && Boolean(extracted) && !current.title.trim()
    const blocks = contentToBlocks(takeTitle ? content || raw : raw)
    if (blocks.length === 0) return
    dispatch({ type: 'patch', patch: { blocks, editorStyle: 'blocks', ...(takeTitle && extracted ? { title: extracted } : {}) } })
    setAnnouncement(`${blocks.length} blok dibuat dari teks.`)
  }

  const handleEditorStyleChange = useStableCallback((target: 'blocks' | 'raw') => {
    const current = stateRef.current.doc
    if (target === current.editorStyle) return
    if (target === 'blocks') {
      if (current.rawContent.trim()) applyConvertedContent(current.rawContent, true)
      else dispatch({ type: 'patch', patch: { editorStyle: 'blocks' }, dirty: false })
    } else {
      dispatch({ type: 'patch', patch: { rawContent: blocksToContent(current.blocks), editorStyle: 'raw' }, dirty: false })
    }
  })
  const handleConvertRawToBlocks = useStableCallback(() => applyConvertedContent(stateRef.current.doc.rawContent, true))
  const handleImportMarkdown = useStableCallback((markdown: string, useExtractedTitle: boolean) => applyConvertedContent(markdown, useExtractedTitle))

  // ---------------- Media ----------------
  const handleCoverUpload = useStableCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = (await res.json()) as { success?: boolean; url?: string; error?: string }
      if (!res.ok || !data.success || !data.url) throw new Error(data.error || 'Gagal mengunggah gambar.')
      setField('coverUrl', data.url)
    } catch (err) {
      console.error('[ArticleEditor] Cover upload failed:', err)
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Gagal mengunggah gambar sampul.' })
    } finally {
      setUploadingCover(false)
    }
  })

  const handleMediaSelect = (url: string) => {
    if (media.target === 'cover') setField('coverUrl', url)
    else blockActions.update(media.target.blockId, { url })
    setMedia((m) => ({ ...m, open: false }))
  }
  const openCoverPicker = useStableCallback(() => setMedia({ open: true, target: 'cover' }))

  // ---------------- Save ----------------
  const handleSave = async (targetStatus?: ArticleEditorStatus, forceOverwrite = false): Promise<boolean> => {
    const current = stateRef.current.doc
    if (!current.title.trim()) {
      setNotice({ tone: 'error', text: 'Judul artikel wajib diisi.' })
      focusWhenReady('article-title')
      return false
    }

    const blocks = current.editorStyle === 'blocks' ? current.blocks : contentToBlocks(current.rawContent)
    const finalContent = current.editorStyle === 'blocks' ? blocksToContent(blocks) : current.rawContent
    if (!finalContent.trim()) {
      setNotice({ tone: 'error', text: 'Isi artikel masih kosong.' })
      return false
    }

    const finalStatus = targetStatus ?? current.status
    const finalSlug = current.slug.trim() || slugify(current.title) || editSlug || ''
    const finalMetaTitle = current.seoTitle.trim() || `${current.title.trim()} — ${siteConfig.name}`
    const finalMetaDesc = current.metaDescription.trim() || current.excerpt.trim() || current.title.trim()
    const imageBlocks = publishableImageBlocks(blocks)

    if (finalStatus === 'published' || finalStatus === 'scheduled') {
      const gate = checkPublicationGate({
        locale: current.locale,
        title: current.title,
        slug: finalSlug,
        metaDescription: finalMetaDesc,
        seoTitle: finalMetaTitle,
        existingSlugs: [],
        images: imageBlocks.map((b) => ({ url: b.url, altText: b.alt || b.caption || '', decorative: false })),
        heroVisual: current.coverUrl ? { url: current.coverUrl, altText: current.coverAlt, decorative: false } : null,
      })
      if (!gate.canPublish) {
        gateImageIdsRef.current = imageBlocks.map((b) => b.id)
        setGateIssues(gate.violations.map((v) => ({ message: v.message, field: v.field })))
        return false
      }
    }

    setSaving(true)
    setNotice(null)
    try {
      const tags = current.tagInput.split(',').map((t) => t.trim()).filter(Boolean)
      const translationGroupId = current.translationGroupId.trim() || undefined
      const baseOg = current.baseSeoData.openGraph && typeof current.baseSeoData.openGraph === 'object' ? current.baseSeoData.openGraph : {}
      const baseTw = current.baseSeoData.twitter && typeof current.baseSeoData.twitter === 'object' ? current.baseSeoData.twitter : {}
      const payload = {
        slug: finalSlug,
        originalSlug: isEditMode ? editSlug : undefined,
        publishedAt: current.publicationDate || undefined,
        title: current.title.trim(),
        excerpt: current.excerpt.trim() || current.title.trim(),
        content: finalContent,
        category: current.category,
        tags,
        author: current.author,
        coverUrl: current.coverUrl,
        coverAlt: current.coverAlt,
        status: finalStatus,
        scheduledAt: finalStatus === 'scheduled' && current.scheduleLocal ? new Date(current.scheduleLocal).toISOString() : undefined,
        publicationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        expectedUpdatedAt: loadedUpdatedAt,
        forceOverwrite,
        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDesc,
        locale: current.locale,
        translationGroupId,
        focusKeyphrase: current.focusKeyphrase.trim() || undefined,
        relatedKeyphrases: current.relatedKeyphrases,
        isCornerstone: current.isCornerstone,
        primaryCategory: current.category,
        seoData: {
          ...current.baseSeoData,
          locale: current.locale,
          translationGroupId,
          focusKeyphrase: current.focusKeyphrase.trim(),
          relatedKeyphrases: current.relatedKeyphrases,
          seoTitle: finalMetaTitle,
          metaDescription: finalMetaDesc,
          slug: finalSlug,
          canonicalUrl: current.canonicalUrl.trim() || null,
          robots: current.robots,
          openGraph: {
            ...baseOg,
            title: current.socialOg.title || finalMetaTitle,
            description: current.socialOg.description || finalMetaDesc,
            image: current.socialOg.image || current.coverUrl,
            imageAlt: current.socialOg.imageAlt || current.coverAlt,
            type: 'article',
            locale: current.locale,
          },
          twitter: {
            ...baseTw,
            card: current.socialTwitter.card || 'summary_large_image',
            title: current.socialTwitter.title || finalMetaTitle,
            description: current.socialTwitter.description || finalMetaDesc,
            image: current.socialTwitter.image || current.coverUrl,
            imageAlt: current.socialTwitter.imageAlt || current.coverAlt,
          },
          schema: current.schemaChanged ? { type: current.schemaType } : current.baseSeoData.schema || { type: current.schemaType },
          breadcrumbTitle: current.breadcrumbTitle.trim() || current.title,
          isCornerstone: current.isCornerstone,
          primaryCategory: current.category,
        },
      }

      const res = await fetch('/api/articles', {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeadersRef.current() },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as {
        error?: string
        conflict?: boolean
        serverUpdatedAt?: string
        updatedAt?: string
        violations?: Array<{ message?: string; field?: string } | string>
      }

      if (!res.ok) {
        if (res.status === 409 && data.conflict) {
          setConflict({ serverUpdatedAt: data.serverUpdatedAt ?? null })
          return false
        }
        if (res.status === 422 && Array.isArray(data.violations)) {
          gateImageIdsRef.current = imageBlocks.map((b) => b.id)
          setGateIssues(
            data.violations.map((v) => (typeof v === 'string' ? { message: v } : { message: v.message || 'Syarat publikasi belum terpenuhi.', field: v.field })),
          )
          return false
        }
        throw new Error(data.error || 'Gagal menyimpan artikel.')
      }

      if (data.updatedAt) setLoadedUpdatedAt(data.updatedAt)
      dispatch({ type: 'markSaved', patch: { status: finalStatus, slug: finalSlug, blocks, editorStyle: current.editorStyle } })
      clearLocalDrafts(editSlug, finalSlug)
      setUndo(null)

      const previewSuffix = finalStatus === 'published' ? '' : '?preview=true'
      setNotice({
        tone: 'success',
        text: finalStatus === 'published' ? 'Artikel diterbitkan.' : finalStatus === 'scheduled' ? 'Jadwal terbit disimpan.' : 'Tersimpan di server.',
        url: `${siteConfig.url}/journal/${encodeURIComponent(finalSlug)}${previewSuffix}`,
        urlLabel: finalStatus === 'published' ? 'Lihat halaman publik' : 'Buka pratinjau',
      })

      // Subsequent saves PATCH this slug; update the URL without a reload.
      locallySavedSlugRef.current = finalSlug
      setEditSlug(finalSlug)
      router.replace(`/admin/buat-artikel?slug=${encodeURIComponent(finalSlug)}`, { scroll: false })
      return true
    } catch (err) {
      console.error('[ArticleEditor] Save failed:', err)
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.' })
      return false
    } finally {
      setSaving(false)
    }
  }
  const onSave = useStableCallback((target?: ArticleEditorStatus) => {
    void handleSave(target)
  })

  // ---------------- Gate → field focus ----------------
  const openInspector = (tab: InspectorTab) => {
    setInspectorTab(tab)
    setInspectorOpen(true)
    if (viewMode === 'full-preview' || viewMode === 'split-preview') setViewMode('split-inspector')
  }

  const focusGateField = (field: string) => {
    setGateIssues([])
    // Let the gate dialog close (and restore focus) before moving focus to the field.
    setTimeout(() => {
      const image = /^images\[(\d+)\]\.altText$/.exec(field)
      if (image) {
        const blockId = gateImageIdsRef.current[Number(image[1])]
        if (stateRef.current.doc.editorStyle !== 'blocks') handleEditorStyleChange('blocks')
        if (viewMode === 'full-preview') setViewMode('split-inspector')
        if (!isWide) setInspectorOpen(false)
        if (blockId) focusWhenReady(`block-${blockId}-alt`)
        return
      }
      if (field === 'slug') {
        openInspector('document')
        focusWhenReady('article-slug')
      } else if (field === 'heroVisual.altText') {
        openInspector('document')
        focusWhenReady('article-cover-alt')
      } else if (field === 'seoTitle' || field === 'metaDescription') {
        openInspector('seo')
        setSeoFocusRequest({ id: field === 'seoTitle' ? 'seo-title-input' : 'seo-meta-description-input', nonce: Date.now() })
      }
    }, 30)
  }

  // ---------------- Navigation guard ----------------
  const navigate = (target: string) => {
    try {
      const parsed = new URL(target, window.location.origin)
      if (parsed.origin === window.location.origin) {
        router.push(parsed.pathname + parsed.search + parsed.hash)
        return
      }
    } catch (err) {
      console.warn('[ArticleEditor] Invalid navigation target:', err)
    }
    window.location.href = target
  }

  const requestNavigate = useStableCallback((url: string) => {
    if (stateRef.current.isDirty) setLeave({ open: true, url })
    else router.push(url)
  })

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    // Keep the user on the page when Back is pressed; ask first.
    const guardState = { ...(window.history.state || {}), spatium_guard: true }
    window.history.pushState(guardState, '', window.location.href)
    const onPopState = () => {
      window.history.pushState(guardState, '', window.location.href)
      setLeave({ open: true, url: ARTICLES_LIST_URL })
    }
    const onDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = e.target instanceof Element ? e.target.closest('a') : null
      const href = anchor?.getAttribute('href')
      if (!anchor || !href || href.startsWith('#') || anchor.target === '_blank') return
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return
      const url = new URL(href, window.location.origin)
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search) return
      e.preventDefault()
      e.stopPropagation()
      setLeave({ open: true, url: href })
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('popstate', onPopState)
    document.addEventListener('click', onDocumentClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('click', onDocumentClick, true)
    }
  }, [isDirty])

  const leaveDiscard = () => {
    const target = leave.url || ARTICLES_LIST_URL
    dispatch({ type: 'markClean' })
    setLeave({ open: false, url: null })
    navigate(target)
  }
  const leaveSave = async () => {
    const target = leave.url || ARTICLES_LIST_URL
    // Save with the current status: leaving must never silently unpublish an article.
    const ok = await handleSave()
    if (ok) {
      setLeave({ open: false, url: null })
      navigate(target)
    }
  }

  // ---------------- Keyboard shortcuts (one stable listener) ----------------
  const toggleInspector = useStableCallback(() => {
    setInspectorOpen((open) => !open)
    if (viewMode !== 'split-inspector' && viewMode !== 'focus') setViewMode('split-inspector')
  })
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => undefined)
  keyHandlerRef.current = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void handleSave()
    } else if (mod && e.key === '/') {
      e.preventDefault()
      toggleInspector()
    } else if (e.key === '?' && !mod && !isTextEntry(e.target)) {
      e.preventDefault()
      setShortcutsOpen(true)
    }
  }
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keyHandlerRef.current(e)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleViewModeChange = useStableCallback((mode: EditorViewMode) => {
    setViewMode(mode)
    if (mode === 'split-inspector' && isWide) setInspectorOpen(true)
  })
  const openShortcuts = useStableCallback(() => setShortcutsOpen(true))
  const navigateBack = useStableCallback(() => requestNavigate(ARTICLES_LIST_URL))
  const setPublicationDate = useCallback((v: string) => dispatch(setFieldAction('publicationDate', v)), [])
  const setScheduleLocal = useCallback((v: string) => dispatch(setFieldAction('scheduleLocal', v)), [])
  const closeInspector = useCallback(() => setInspectorOpen(false), [])

  useEffect(() => {
    document.title = `${doc.title ? `Edit: ${doc.title}` : 'Tulis artikel'} · ${siteConfig.name} Studio`
  }, [doc.title])

  // ---------------- Render ----------------
  if (loading) {
    return (
      <div className="studio-admin flex h-[100dvh] w-full items-center justify-center bg-[var(--studio-bg)] text-sm text-neutral-200" role="status">
        Memuat artikel {editSlug}…
      </div>
    )
  }

  if (loadError) {
    return (
      <main className="studio-admin flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[var(--studio-bg)] p-6 text-center text-white">
        <AlertTriangle className="h-8 w-8 text-amber-300" aria-hidden="true" />
        <h1 className="text-lg font-bold">Artikel tidak bisa dibuka</h1>
        <p className="max-w-md text-sm text-neutral-300">{loadError}</p>
        <Link href={ARTICLES_LIST_URL} className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-bold text-accent-950 hover:bg-accent-300">
          Kembali ke daftar artikel
        </Link>
      </main>
    )
  }

  const showInspector = viewMode === 'split-inspector' || viewMode === 'focus'
  const canvas = (
    <ArticleEditorCanvas
      title={doc.title}
      onTitleChange={setTitle}
      slug={doc.slug}
      category={doc.category}
      categoriesList={categoriesList}
      onCategoryChange={setCategory}
      editorStyle={doc.editorStyle}
      onEditorStyleChange={handleEditorStyleChange}
      onConvertRawToBlocks={handleConvertRawToBlocks}
      onImportMarkdown={handleImportMarkdown}
      rawContent={doc.rawContent}
      onRawContentChange={setRawContent}
      blocks={doc.blocks}
      blockActions={blockActions}
      rawHtmlBlockIds={rawHtmlBlockIds}
      isFocusMode={!inspectorOpen || !isWide}
    />
  )
  const preview = (
    <ArticleLivePreview
      title={analysisDoc.title}
      slug={analysisDoc.slug}
      category={analysisDoc.category}
      author={analysisDoc.author}
      publicationDate={analysisDoc.publicationDate}
      readingTimeMinutes={readingTimeMinutes}
      coverUrl={analysisDoc.coverUrl}
      coverAlt={analysisDoc.coverAlt}
      excerpt={analysisDoc.excerpt}
      blocks={analysisDoc.blocks}
      rawContent={analysisDoc.rawContent}
      editorStyle={analysisDoc.editorStyle}
      tags={analysisDoc.tagInput.split(',').map((t) => t.trim()).filter(Boolean)}
    />
  )

  return (
    <div className="studio-admin flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--studio-bg)] text-neutral-100 antialiased selection:bg-accent-500 selection:text-accent-950">
      <a
        href="#article-title"
        className="sr-only z-50 rounded-lg bg-accent-500 px-3 py-2 text-sm font-bold text-accent-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Langsung ke judul artikel
      </a>

      <ArticleEditorHeader
        title={doc.title}
        slug={editSlug ?? ''}
        status={doc.status}
        isEditMode={isEditMode}
        isDirty={isDirty}
        saving={saving}
        localSavedAt={localSavedAt}
        wordCount={wordCount}
        readingTimeMinutes={readingTimeMinutes}
        seoScore={seoAnalysis.seoScore}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isInspectorOpen={inspectorOpen && showInspector}
        onToggleInspector={toggleInspector}
        onSave={onSave}
        canPublish={Boolean(permissions.canPublish)}
        canSubmitForReview={Boolean(permissions.canSubmitForReview)}
        publicationDate={doc.publicationDate}
        onChangePublicationDate={setPublicationDate}
        scheduleLocal={doc.scheduleLocal}
        onChangeScheduleLocal={setScheduleLocal}
        publicationTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
        onOpenShortcuts={openShortcuts}
        onNavigateBack={navigateBack}
      />

      {/* Polite announcements (block moves/deletes, saves). Region is always mounted. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="space-y-2 px-3 pt-2 empty:hidden sm:px-4">
        {pendingLocalDraft && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-info/40 bg-info/10 p-3 text-xs text-info-300">
            <p>
              Ada salinan lokal dari {new Date(pendingLocalDraft.savedAt).toLocaleString('id-ID')} yang belum disimpan ke server.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingLocalDraft(null)
                  clearLocalDrafts(editSlug)
                }}
                className="rounded-lg border border-white/20 px-3 py-1.5 font-semibold text-white hover:bg-white/10"
              >
                Buang salinan
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'restoreLocal', doc: pendingLocalDraft.doc })
                  setLocalSavedAt(new Date(pendingLocalDraft.savedAt))
                  setPendingLocalDraft(null)
                  setAnnouncement('Salinan lokal dipulihkan. Simpan untuk mengirimnya ke server.')
                }}
                className="rounded-lg bg-accent-500 px-3 py-1.5 font-bold text-accent-950 hover:bg-accent-300"
              >
                Pulihkan
              </button>
            </div>
          </div>
        )}

        {activeLockUser && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3 text-xs text-amber-200">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>{activeLockUser.name}</strong>
                {activeLockUser.email ? ` (${activeLockUser.email})` : ''} sedang mengedit artikel ini. Menyimpan bersamaan bisa menimpa perubahan.
              </span>
            </p>
            <button
              type="button"
              onClick={() => setActiveLockUser(null)}
              aria-label="Tutup peringatan editor lain"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div role="alert" className="empty:hidden">
          {notice?.tone === 'error' && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-100">
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {notice.text}
              </p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Tutup pesan kesalahan"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div role="status" className="empty:hidden">
          {notice?.tone === 'success' && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-100">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {notice.text}
              </p>
              <div className="flex items-center gap-2">
                {notice.url && (
                  <a
                    href={notice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 font-semibold hover:bg-emerald-500/30"
                  >
                    {notice.urlLabel}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">(tab baru)</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Tutup pesan"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          {undo && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-neutral-100">
              <p>Blok {undo.index + 1} dihapus.</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={undoRemove}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1 font-semibold hover:bg-white/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Urungkan
                </button>
                <button
                  type="button"
                  onClick={() => setUndo(null)}
                  aria-label="Tutup pemberitahuan hapus blok"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <main id="editor-main" className="relative flex min-h-0 w-full flex-1 overflow-hidden">
        {viewMode === 'full-preview' ? (
          preview
        ) : viewMode === 'split-preview' ? (
          <div className="flex h-full min-h-0 w-full flex-1 flex-col divide-y divide-white/[0.08] overflow-hidden lg:flex-row lg:divide-x lg:divide-y-0">
            <div className="flex min-h-0 flex-1 flex-col lg:w-1/2">{canvas}</div>
            <div className="flex min-h-0 flex-1 flex-col lg:w-1/2">{preview}</div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
            {canvas}
            {showInspector && (
              <ArticleEditorInspector
                isOpen={inspectorOpen}
                asSheet={!isWide}
                onClose={closeInspector}
                activeTab={inspectorTab}
                onTabChange={setInspectorTab}
                doc={doc}
                setField={setField}
                setSlug={setSlug}
                categoriesList={categoriesList}
                uploadingCover={uploadingCover}
                onCoverUpload={handleCoverUpload}
                onOpenMediaPickerForCover={openCoverPicker}
                internalLinksCount={seoAnalysis.metrics.internalLinkCount}
                analysisContent={analysisContent}
                analysis={seoAnalysis}
                contentImages={contentImages}
                seoFocusRequest={seoFocusRequest}
              />
            )}
          </div>
        )}
      </main>

      <ArticlePublicationGateModal issues={gateIssues} onClose={() => setGateIssues([])} onFixField={focusGateField} fieldLabel={gateFieldLabel} />

      <MediaPickerModal
        isOpen={media.open}
        onClose={() => setMedia((m) => ({ ...m, open: false }))}
        onSelect={handleMediaSelect}
        currentUrl={media.target === 'cover' ? doc.coverUrl : undefined}
        title={media.target === 'cover' ? 'Pilih gambar sampul' : 'Pilih gambar dari pustaka media'}
      />

      <ArticleUnsavedModal
        isOpen={leave.open}
        saving={saving}
        hasLocalCopy={Boolean(localSavedAt)}
        onCancel={() => setLeave({ open: false, url: null })}
        onConfirmDiscard={leaveDiscard}
        onSaveAndLeave={leaveSave}
      />

      <ArticleConflictModal
        open={conflict !== null}
        serverUpdatedAt={conflict?.serverUpdatedAt ?? null}
        onClose={() => setConflict(null)}
        onReload={() => {
          setConflict(null)
          dispatch({ type: 'markClean' })
          // Reload after the dirty guard (beforeunload) has been removed by the state update.
          setTimeout(() => window.location.reload(), 0)
        }}
        onForceOverwrite={() => {
          setConflict(null)
          void handleSave(undefined, true)
        }}
      />

      <ArticleShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}

export default function BuatArtikelStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="studio-admin flex h-[100dvh] w-full items-center justify-center bg-[var(--studio-bg)] text-sm text-neutral-300" role="status">
          Memuat editor…
        </div>
      }
    >
      <ArticleEditorInner />
    </Suspense>
  )
}
