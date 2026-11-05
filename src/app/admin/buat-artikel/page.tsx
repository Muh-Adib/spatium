'use client'

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  X,
} from 'lucide-react'
import {
  ContentBlock,
  BlockType,
  blocksToContent,
  contentToBlocks,
  calculateSeoScore,
  extractEmbedUrl,
  generateBlockId,
  extractTitleAndContentFromMarkdown,
} from '@/lib/articles/blockEditor'
import MediaPickerModal from '@/components/studio/MediaPickerModal'
import { StudioAiSidebar } from '@/components/studio/StudioAiSidebar'
import { Locale } from '@/lib/seo/schema'
import { checkPublicationGate } from '@/lib/seo/validation'
import { analyzeContentSeo } from '@/lib/seo/analyzer'
import type { StudioAiArticleContext } from '@/components/studio/StudioAiSidebar'

// Modular Studio Article Components
import { ArticleEditorHeader, EditorViewMode } from '@/components/studio/editor/ArticleEditorHeader'
import { ArticleEditorCanvas } from '@/components/studio/editor/ArticleEditorCanvas'
import { ArticleEditorInspector } from '@/components/studio/editor/ArticleEditorInspector'
import { ArticleLivePreview } from '@/components/studio/editor/ArticleLivePreview'
import { ArticlePublicationGateModal } from '@/components/studio/editor/ArticlePublicationGateModal'
import { ArticleLinkModal } from '@/components/studio/editor/ArticleLinkModal'
import { ArticleUnsavedModal } from '@/components/studio/editor/ArticleUnsavedModal'

function ArticleEditorInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editSlug, setEditSlug] = useState<string | null>(searchParams?.get('slug') ?? null)
  const isEditMode = Boolean(editSlug)
  const locallySavedSlugRef = useRef<string | null>(null)

  const { role, actorName, permissions, getAuthHeaders } = useAuth()

  // Multi-User Presence & Safe Concurrency Locks
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null)
  const [activeLockUser, setActiveLockUser] = useState<{ name: string; email: string } | null>(null)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [conflictServerUpdatedAt, setConflictServerUpdatedAt] = useState<string | null>(null)

  // Layout & View Modes
  const [viewMode, setViewMode] = useState<EditorViewMode>('split-inspector')
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [inspectorTab, setInspectorTab] = useState<'document' | 'seo'>('document')
  const [editorStyle, setEditorStyle] = useState<'blocks' | 'raw'>('blocks')
  const [loadingInitial, setLoadingInitial] = useState<boolean>(isEditMode)

  // AI Copilot Mode
  const [aiMode, setAiMode] = useState<'idle' | 'docked' | 'expanded' | 'widget'>('idle')
  const [aiWidth, setAiWidth] = useState(420)

  // Core Fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [category, setCategory] = useState('Website Development')
  const [categoriesList, setCategoriesList] = useState<Array<{ name: string; slug?: string }>>([])
  const [author, setAuthor] = useState(actorName || '')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverAlt, setCoverAlt] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [status, setStatus] = useState<'draft' | 'in_review' | 'approved' | 'scheduled' | 'published'>('draft')
  const [scheduleLocal, setScheduleLocal] = useState('')
  const publicationTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Multilingual & SEO States
  const [locale, setLocale] = useState<Locale>('id')
  const [translationGroupId, setTranslationGroupId] = useState<string>('')
  const [isCornerstone, setIsCornerstone] = useState<boolean>(false)
  const [focusKeyphrase, setFocusKeyphrase] = useState<string>('')
  const [relatedKeyphrases, setRelatedKeyphrases] = useState<string[]>([])
  const [seoTitle, setSeoTitle] = useState<string>('')
  const [metaDescription, setMetaDescription] = useState<string>('')
  const [canonicalUrl, setCanonicalUrl] = useState<string>('')
  const [breadcrumbTitle, setBreadcrumbTitle] = useState<string>('')
  const [baseSeoData, setBaseSeoData] = useState<Record<string, any>>({})
  const [schemaChanged, setSchemaChanged] = useState(false)
  const [publicationDate, setPublicationDate] = useState('')
  const [schemaType, setSchemaType] = useState<'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle'>('Article')
  const [robots, setRobots] = useState<{ index: boolean; follow: boolean; noarchive?: boolean; nosnippet?: boolean }>({
    index: true,
    follow: true,
  })
  const [socialOg, setSocialOg] = useState<{ title?: string; description?: string; image?: string; imageAlt?: string }>({})
  const [socialTwitter, setSocialTwitter] = useState<{
    card?: 'summary' | 'summary_large_image'
    title?: string
    description?: string
    image?: string
    imageAlt?: string
  }>({ card: 'summary_large_image' })

  // Blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    {
      id: 'b1',
      type: 'paragraph',
      text: 'Mulai ketik paragraf pembuka artikel Anda di sini...',
    },
  ])
  const [rawContent, setRawContent] = useState<string>('')
  const [rawHtmlBlockIds, setRawHtmlBlockIds] = useState<Record<string, boolean>>({})
  const [activeTypeDropdownBlockId, setActiveTypeDropdownBlockId] = useState<string | null>(null)

  // Status & Save States
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [successData, setSuccessData] = useState<{ url: string; title: string; action: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [gateViolations, setGateViolations] = useState<string[]>([])

  // Modals
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [activeLinkBlockId, setActiveLinkBlockId] = useState<string | null>(null)
  const [linkUrlInput, setLinkUrlInput] = useState('')
  const [linkTextInput, setLinkTextInput] = useState('')

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'cover' | { blockId: string }>('cover')
  const [uploadingCover, setUploadingCover] = useState(false)

  // Unsaved Changes Guard & Modal States
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null)

  // Load Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories')
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategoriesList(json.data.map((c: any) => ({ name: c.name, slug: c.slug })))
        }
      } catch (err) { console.warn("[observable error]:", err) }
    }
    loadCategories()
  }, [])

  // Sync author with authenticated actor
  useEffect(() => {
    if (actorName && !isEditMode) {
      setAuthor(actorName)
    }
  }, [actorName, isEditMode])

  // Load article for edit mode
  useEffect(() => {
    if (!editSlug) return

    // If this slug was just saved locally from the current editor session, don't re-fetch/overwrite state
    if (locallySavedSlugRef.current === editSlug) return

    let isMounted = true
    setLoadingInitial(true)
    setErrorMessage('')

    fetch(`/api/articles?slug=${encodeURIComponent(editSlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Artikel tidak ditemukan')
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        const art = data.article
        if (!art) throw new Error('Data artikel kosong')

        setTitle(art.title || '')
        setSlug(art.slug || editSlug)
        setLoadedUpdatedAt(art.updatedAt || null)
        setTagInput((art.tags || []).map((tag: { name: string }) => tag.name).join(', '))
        setCategory(art.category?.name || art.category || 'Website Development')
        setAuthor(art.author?.name || art.author || actorName || '')
        setCoverUrl(art.coverUrl || art.featuredImage?.url || '')
        setExcerpt(art.excerpt || '')
        setStatus((art.status as 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published') || 'draft')
        if (art.scheduledAt) {
          const scheduled = new Date(art.scheduledAt)
          setScheduleLocal(new Date(scheduled.getTime() - scheduled.getTimezoneOffset() * 60_000).toISOString().slice(0, 16))
        }

        if (art.seo?.metaTitle) {
          const parts = art.seo.metaTitle.split('—')
          if (parts[0]) setTargetKeyword(parts[0].trim().split(' ').slice(0, 3).join(' '))
        }

        setLocale((art.locale as 'id' | 'en') || 'id')
        setTranslationGroupId(art.translationGroupId || '')
        setIsCornerstone(Boolean(art.isCornerstone))
        const rawSeoData = (art.seoData && typeof art.seoData === 'object' ? art.seoData : {}) as Record<string, unknown>
        const keyphrase = art.focusKeyphrase || art.targetKeyword || art.seo?.focusTopic || art.primaryKeyword || (typeof rawSeoData.focusKeyphrase === 'string' ? rawSeoData.focusKeyphrase : '')
        setFocusKeyphrase(keyphrase)
        if (keyphrase) setTargetKeyword(keyphrase)
        const relKws = Array.isArray(art.relatedKeyphrases)
          ? art.relatedKeyphrases
          : Array.isArray(rawSeoData.relatedKeyphrases)
          ? (rawSeoData.relatedKeyphrases as string[])
          : []
        setRelatedKeyphrases(relKws)
        setSeoTitle(art.metaTitle || art.seo?.metaTitle || '')
        setMetaDescription(art.metaDescription || art.seo?.metaDescription || '')
        setCoverAlt(art.featuredImage?.alternativeText || art.coverAlt || '')
        setCanonicalUrl(art.seo?.canonicalUrl || '')
        setBreadcrumbTitle(art.seo?.breadcrumbTitle || (typeof rawSeoData.breadcrumbTitle === 'string' ? rawSeoData.breadcrumbTitle : ''))
        setBaseSeoData(art.seoData || {})
        setSchemaChanged(false)
        setPublicationDate(art.publishedAt || '')
        setSchemaType(art.seo?.schema?.type || 'Article')
        if (art.seo?.robots) setRobots(art.seo.robots)
        if (art.seo?.openGraph) setSocialOg(art.seo.openGraph)
        if (art.seo?.twitter) setSocialTwitter(art.seo.twitter)

        if (art.content) {
          setRawContent(art.content)
          const parsed = contentToBlocks(art.content)
          if (parsed.length > 0) {
            setBlocks(parsed)
          } else {
            setBlocks([
              {
                id: 'b1',
                type: 'paragraph',
                text: art.content.replace(/<[^>]*>/g, ' ').slice(0, 500),
              },
            ])
          }
        }
        setIsDirty(false)
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || 'Gagal memuat artikel untuk diedit')
        }
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false)
      })

    return () => {
      isMounted = false
    }
  }, [editSlug, actorName])

  // Multi-user lock heartbeat & collision detection
  useEffect(() => {
    const activeTargetSlug = editSlug || slug
    if (!activeTargetSlug) return

    let isMounted = true
    const checkAndAcquireLock = async () => {
      try {
        const res = await fetch(`/api/articles/lock?slug=${encodeURIComponent(activeTargetSlug)}`, {
          headers: getAuthHeaders(),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.isLocked && data.lockInfo) {
            if (isMounted) {
              setActiveLockUser({
                name: data.lockInfo.userName,
                email: data.lockInfo.userEmail,
              })
            }
            return
          } else {
            if (isMounted) setActiveLockUser(null)
          }
        }

        await fetch('/api/articles/lock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ slug: activeTargetSlug }),
        })
      } catch (err) {
        console.warn('[ArticleEditor] Lock heartbeat warning:', err)
      }
    }

    checkAndAcquireLock()
    const interval = setInterval(checkAndAcquireLock, 25_000)

    return () => {
      isMounted = false
      clearInterval(interval)
      if (activeTargetSlug) {
        fetch(`/api/articles/lock?slug=${encodeURIComponent(activeTargetSlug)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          keepalive: true,
        }).catch(() => {})
      }
    }
  }, [editSlug, slug, getAuthHeaders])

  // Auto-slug on title change if not editing
  const handleTitleChange = (val: string) => {
    setTitle(val)
    setIsDirty(true)
    if (!isEditMode) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(autoSlug)
    }
  }

  // Handle Bidirectional Editor Style (Blocks <-> Raw HTML / Markdown)
  const handleEditorStyleChange = (targetStyle: 'blocks' | 'raw') => {
    if (targetStyle === editorStyle) return

    if (targetStyle === 'blocks') {
      // User was in Raw HTML/MD mode and switches to Blocks!
      if (rawContent && rawContent.trim()) {
        const { title: extractedTitle, content: remainingContent } = extractTitleAndContentFromMarkdown(rawContent)
        if (extractedTitle && (!title || title.trim() === '' || title === 'Artikel Baru')) {
          handleTitleChange(extractedTitle)
          const converted = contentToBlocks(remainingContent || rawContent)
          if (converted.length > 0) {
            setBlocks(converted)
            setIsDirty(true)
          }
        } else {
          const converted = contentToBlocks(rawContent)
          if (converted.length > 0) {
            setBlocks(converted)
            setIsDirty(true)
          }
        }
      }
      setEditorStyle('blocks')
    } else {
      // User was in Blocks mode and switches to Raw HTML!
      const serialized = blocksToContent(blocks)
      setRawContent(serialized)
      setEditorStyle('raw')
    }
  }

  // Explicit conversion from Raw HTML / Markdown to Blocks
  const handleConvertRawToBlocks = () => {
    if (!rawContent || !rawContent.trim()) return
    const { title: extractedTitle, content: remainingContent } = extractTitleAndContentFromMarkdown(rawContent)
    if (extractedTitle && (!title || title.trim() === '' || title === 'Artikel Baru')) {
      handleTitleChange(extractedTitle)
      const converted = contentToBlocks(remainingContent || rawContent)
      if (converted.length > 0) {
        setBlocks(converted)
        setEditorStyle('blocks')
        setIsDirty(true)
      }
      return
    }
    const converted = contentToBlocks(rawContent)
    if (converted.length > 0) {
      setBlocks(converted)
      setEditorStyle('blocks')
      setIsDirty(true)
    }
  }

  // Direct Markdown Import Handler (ChatGPT / Claude / .md text)
  const handleImportMarkdown = (markdown: string, useExtractedTitle = true) => {
    if (!markdown || !markdown.trim()) return
    const { title: extractedTitle, content: remainingContent } = extractTitleAndContentFromMarkdown(markdown)
    if (useExtractedTitle && extractedTitle && (!title || title.trim() === '' || title === 'Artikel Baru')) {
      handleTitleChange(extractedTitle)
      const converted = contentToBlocks(remainingContent || markdown)
      if (converted.length > 0) {
        setBlocks(converted)
        setEditorStyle('blocks')
        setIsDirty(true)
      }
      return
    }
    const converted = contentToBlocks(markdown)
    if (converted.length > 0) {
      setBlocks(converted)
      setEditorStyle('blocks')
      setIsDirty(true)
    }
  }

  // Convert a single HTML block into multiple granular blocks
  const handleConvertSingleHtmlBlockToBlocks = (blockId: string) => {
    const target = blocks.find((b) => b.id === blockId)
    if (!target || target.type !== 'html' || !target.html) return
    const innerBlocks = contentToBlocks(target.html).map((b) => ({
      ...b,
      id: generateBlockId('b'),
    }))
    if (innerBlocks.length > 0) {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId)
        if (idx === -1) return prev
        const newBlocks = [...prev]
        newBlocks.splice(idx, 1, ...innerBlocks)
        return newBlocks
      })
      setIsDirty(true)
    }
  }

  // Sinkronisasi blocks ke raw content saat dalam mode blocks
  useEffect(() => {
    if (editorStyle === 'blocks') {
      setRawContent(blocksToContent(blocks))
    }
  }, [blocks, editorStyle])

  // SEO Score calculation & Real-time Content Analysis
  const currentContent = editorStyle === 'blocks' ? blocksToContent(blocks) : rawContent
  const activeKeyphrase = focusKeyphrase || targetKeyword || title.split(' ').slice(0, 2).join(' ')

  const seoAnalysis = useMemo(() => {
    return analyzeContentSeo({
      title,
      seoTitle: seoTitle || title,
      metaDescription: metaDescription || excerpt,
      slug: slug || editSlug || '',
      content: currentContent,
      focusKeyphrase: activeKeyphrase,
      relatedKeyphrases,
      locale,
      isCornerstone,
      images: [
        ...(coverUrl ? [{ url: coverUrl, alt: coverAlt }] : []),
        ...blocks
          .filter((b): b is import('@/lib/articles/blockEditor').ImageBlock => b.type === 'image' && Boolean((b as { url?: string }).url))
          .map((b) => ({ url: b.url, alt: b.alt })),
      ],
    })
  }, [
    title,
    seoTitle,
    metaDescription,
    slug,
    editSlug,
    currentContent,
    activeKeyphrase,
    relatedKeyphrases,
    locale,
    isCornerstone,
    coverUrl,
    coverAlt,
    blocks,
  ])

  const seoReport = calculateSeoScore({
    title,
    excerpt,
    content: currentContent,
    targetKeyword: activeKeyphrase,
    blocks,
  })

  const wordCount = currentContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180))
  const internalLinksCount = (currentContent.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi) || []).length

  const isPlaceholderString = (val?: string | null) => {
    if (!val || typeof val !== 'string') return false
    const l = val.toLowerCase().trim()
    return (
      l.includes('judul menarik & berbobot') ||
      l.includes('berbobot (40-65') ||
      l.includes('kata kunci fokus') ||
      l.includes('judul baru yang dioptimalkan') ||
      l.includes('judul seo | unimasi') ||
      l.includes('deskripsi meta memikat') ||
      l.includes('deskripsi visual gambar') ||
      l === 'paragraf...' ||
      l === 'penjelasan...' ||
      l === 'subjudul h2' ||
      l === 'subjudul h3' ||
      l === 'judul-kebab-case'
    )
  }

  // Synchronized callback to apply AI-generated article improvements directly to editor state
  const handleApplyArticleChanges = (changes: Partial<StudioAiArticleContext>) => {
    if (changes.title && !isPlaceholderString(changes.title)) setTitle(changes.title)
    if (changes.slug && !isPlaceholderString(changes.slug)) setSlug(changes.slug)
    if (changes.category && !isPlaceholderString(changes.category)) setCategory(changes.category)
    if (changes.tagInput) setTagInput(changes.tagInput)
    if (changes.author) setAuthor(changes.author)
    if (changes.coverAlt && !isPlaceholderString(changes.coverAlt)) setCoverAlt(changes.coverAlt)
    if (changes.excerpt && !isPlaceholderString(changes.excerpt)) setExcerpt(changes.excerpt)
    if (changes.targetKeyword && !isPlaceholderString(changes.targetKeyword)) setTargetKeyword(changes.targetKeyword)
    if (changes.focusKeyphrase && !isPlaceholderString(changes.focusKeyphrase)) {
      setFocusKeyphrase(changes.focusKeyphrase)
      if (!changes.targetKeyword || isPlaceholderString(changes.targetKeyword)) setTargetKeyword(changes.focusKeyphrase)
    }
    if (changes.relatedKeyphrases && Array.isArray(changes.relatedKeyphrases)) {
      setRelatedKeyphrases(changes.relatedKeyphrases)
    }
    if (changes.seoTitle && !isPlaceholderString(changes.seoTitle)) setSeoTitle(changes.seoTitle)
    if (changes.metaDescription && !isPlaceholderString(changes.metaDescription)) {
      setMetaDescription(changes.metaDescription)
      if (!changes.excerpt || isPlaceholderString(changes.excerpt)) setExcerpt(changes.metaDescription)
    }
    if (changes.canonicalUrl) setCanonicalUrl(changes.canonicalUrl)
    if (changes.schemaType) setSchemaType(changes.schemaType as 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle')

    const cleanBlocks = changes.blocks && Array.isArray(changes.blocks)
      ? changes.blocks.filter((b: Record<string, unknown>) => !isPlaceholderString(typeof b?.text === 'string' ? b.text : '') && !isPlaceholderString(typeof b?.title === 'string' ? b.title : ''))
      : []

    if (cleanBlocks.length > 0) {
      setBlocks(cleanBlocks)
      setRawContent(blocksToContent(cleanBlocks))
    } else if (changes.content && !isPlaceholderString(changes.content)) {
      setRawContent(changes.content)
      const parsed = contentToBlocks(changes.content)
      const nonDummy = (parsed as Array<{ text?: string; title?: string }>).filter((b) => !isPlaceholderString(typeof b?.text === 'string' ? b.text : '') && !isPlaceholderString(typeof b?.title === 'string' ? b.title : '')) as typeof parsed
      if (nonDummy.length > 0) {
        setBlocks(nonDummy)
      } else {
        setBlocks([
          {
            id: generateBlockId('b'),
            type: 'paragraph',
            text: changes.content,
          },
        ])
      }
    }
    setIsDirty(true)
    const effectiveTitle = (changes.title && !isPlaceholderString(changes.title)) ? changes.title : (title || 'Draf Artikel')
    setSuccessData({
      url: `${siteConfig.url}/artikel/${slug || editSlug || 'draf-baru'}`,
      title: effectiveTitle,
      action: 'dioptimalkan oleh AI (Perubahan berhasil diterapkan ke editor)',
    })
  }

  // Complete page context passed to StudioAiSidebar so the agent has 100% full awareness of this article
  const articlePageContext: StudioAiArticleContext = useMemo(() => ({
    title: title || 'Draf Artikel Baru',
    slug: slug || editSlug || 'draf-baru',
    originalSlug: editSlug || undefined,
    category,
    tagInput,
    author,
    status,
    locale,
    coverUrl,
    coverAlt,
    excerpt,
    targetKeyword,
    focusKeyphrase: focusKeyphrase || targetKeyword,
    relatedKeyphrases,
    seoTitle,
    metaDescription,
    canonicalUrl,
    breadcrumbTitle,
    schemaType,
    robots,
    content: currentContent,
    blocks,
    wordCount,
    readingTimeMinutes,
    internalLinksCount,
    seoScore: seoAnalysis.seoScore,
    seoGrade: seoAnalysis.overallStatus === 'good' ? 'Sangat Baik' : seoAnalysis.overallStatus === 'ok' ? 'Cukup' : 'Perlu Perbaikan',
    seoIndicators: seoAnalysis.indicators,
    readabilityScore: seoAnalysis.readabilityScore,
    readabilityIndicators: seoAnalysis.readabilityIndicators,
    seoMetrics: seoAnalysis.metrics,
    gateViolations,
    locationName: `Studio Editor Artikel (${slug || editSlug || 'draf-baru'})`,
  }), [
    title,
    slug,
    editSlug,
    category,
    tagInput,
    author,
    status,
    locale,
    coverUrl,
    coverAlt,
    excerpt,
    targetKeyword,
    focusKeyphrase,
    relatedKeyphrases,
    seoTitle,
    metaDescription,
    canonicalUrl,
    breadcrumbTitle,
    schemaType,
    robots,
    currentContent,
    blocks,
    wordCount,
    readingTimeMinutes,
    internalLinksCount,
    seoAnalysis,
    gateViolations,
  ])

  // Block Manipulation Handlers
  const addBlock = (type: BlockType) => {
    setIsDirty(true)
    const id = generateBlockId('b')
    let newBlock: ContentBlock

    switch (type) {
      case 'heading2':
        newBlock = { id, type: 'heading2', text: 'Subjudul Bagian Baru (H2)' }
        break
      case 'heading3':
        newBlock = { id, type: 'heading3', text: 'Poin Pembahasan Subtopik (H3)' }
        break
      case 'image':
        newBlock = {
          id,
          type: 'image',
          url: '/images/articles/web-architecture.jpg',
          alt: `${title || 'Artikel UNIMASI'} - Ilustrasi`,
          caption: 'Keterangan visual animasi atau produksi 3D.',
          alignment: 'center',
        }
        break
      case 'video':
        newBlock = {
          id,
          type: 'video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Video Demonstrasi Animasi',
          embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        }
        break
      case 'quote':
        newBlock = {
          id,
          type: 'quote',
          text: 'Kutipan penting atau visi animasi kreatif yang mempertegas poin artikel.',
          author: 'Pakar Animasi UNIMASI Studio',
        }
        break
      case 'list':
        newBlock = {
          id,
          type: 'list',
          items: ['Poin analisis pertama', 'Poin analisis kedua', 'Langkah mitigasi berikutnya'],
          ordered: false,
        }
        break
      case 'faq':
        newBlock = {
          id,
          type: 'faq',
          question: 'Pertanyaan teknis utama yang dijawab artikel ini?',
          answer: 'Jawaban langsung, terstruktur, dan berbasis data untuk audiens enterprise dan Google SERP AI Overview.',
        }
        break
      case 'code':
        newBlock = {
          id,
          type: 'code',
          code: '// Implementasi arsitektur Next.js 16 App Router\nexport const dynamic = "force-static";',
          language: 'typescript',
        }
        break
      case 'html':
        newBlock = {
          id,
          type: 'html',
          html: '<div class="p-4 bg-white/5 rounded-xl border border-white/10">\n  <p>Tulis kode HTML kustom atau sematan di sini...</p>\n</div>',
        }
        break
      case 'divider':
        newBlock = { id, type: 'divider' }
        break
      case 'internal-links':
        newBlock = {
          id,
          type: 'internal-links',
          title: 'Indeks Tautan Internal Terkait (SEO Reference)',
          links: [
            { text: 'Layanan Animasi 3D & Visual UNIMASI', href: '/services/3d-animation' },
            { text: 'Konsultasi Produksi Animasi', href: '/contact' },
          ],
        }
        break
      case 'table':
        newBlock = {
          id,
          type: 'table',
          headers: ['Parameter Produksi', 'Standar UNIMASI Studio', 'Rekomendasi'],
          rows: [
            ['Pipeline Animasi', 'Hybrid 2D/3D & Real-time Assets', 'Disarankan'],
            ['Akurasi Visual & Modeling', 'CAD-accurate 3D & Cinema Quality', 'Prioritas Utama'],
          ],
        }
        break
      case 'paragraph':
      default:
        newBlock = { id, type: 'paragraph', text: 'Tulis paragraf penjelasan baru Anda di sini...' }
        break
    }

    setBlocks((prev) => [...prev, newBlock])
  }

  const updateBlock = (id: string, updated: Partial<ContentBlock>) => {
    setIsDirty(true)
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...updated } as ContentBlock) : b)))
  }

  const removeBlock = (id: string) => {
    setIsDirty(true)
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= blocks.length) return
    setIsDirty(true)
    const newArr = [...blocks]
    const temp = newArr[index]
    newArr[index] = newArr[targetIdx]
    newArr[targetIdx] = temp
    setBlocks(newArr)
  }

  const convertBlockType = (blockId: string, targetType: BlockType) => {
    setIsDirty(true)
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block

        let textContent = ''
        if ('text' in block && typeof block.text === 'string') {
          textContent = block.text
        } else if (block.type === 'list' && Array.isArray(block.items)) {
          textContent = block.items.join('\n')
        } else if (block.type === 'code' && typeof block.code === 'string') {
          textContent = block.code
        } else if (block.type === 'faq') {
          textContent = `${block.question}\n${block.answer}`
        } else if (block.type === 'table') {
          textContent = [block.headers.join(' | '), ...block.rows.map((r) => r.join(' | '))].join('\n')
        } else if (block.type === 'html' && typeof block.html === 'string') {
          textContent = block.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        }

        switch (targetType) {
          case 'heading2':
            return { id: block.id, type: 'heading2', text: textContent || 'Subjudul H2...' }
          case 'heading3':
            return { id: block.id, type: 'heading3', text: textContent || 'Subjudul H3...' }
          case 'quote':
            return { id: block.id, type: 'quote', text: textContent || 'Kutipan...', author: (block as { author?: string }).author || '' }
          case 'list': {
            const rawLines = textContent
              ? textContent.split('\n').map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean)
              : []
            return { id: block.id, type: 'list', items: rawLines.length > 0 ? rawLines : ['Poin pertama...'], ordered: false }
          }
          case 'code':
            return { id: block.id, type: 'code', code: textContent.replace(/<[^>]*>/g, '') || '// Kode...', language: 'typescript' }
          case 'table':
            return {
              id: block.id,
              type: 'table',
              headers: ['Fitur / Topik', 'Deskripsi Spesifikasi', 'Catatan'],
              rows: [
                ['Item Utama', textContent || 'Rincian penjelasan spesifikasi', 'Standar'],
              ],
            }
          case 'html':
            return {
              id: block.id,
              type: 'html',
              html: textContent ? `<p>${textContent}</p>` : '<div class="p-3 bg-white/5 rounded-lg"><p>Konten HTML</p></div>',
            }
          case 'paragraph':
          default:
            return { id: block.id, type: 'paragraph', text: textContent || 'Tulis paragraf di sini...' }
        }
      })
    )
    setActiveTypeDropdownBlockId(null)
  }

  // File Upload Helper
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengunggah file gambar.')
    }
    return data.url
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const url = await uploadFile(file)
      setCoverUrl(url)
      setIsDirty(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah cover.')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleMediaSelect = (url: string) => {
    setIsDirty(true)
    if (mediaPickerTarget === 'cover') {
      setCoverUrl(url)
    } else if (typeof mediaPickerTarget === 'object' && mediaPickerTarget.blockId) {
      updateBlock(mediaPickerTarget.blockId, { url })
    }
    setMediaPickerOpen(false)
  }

  // Handle Save / Publish (Multi-User Safe Concurrency)
  const handleSave = async (
    targetStatus?: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published',
    forceOverwrite?: boolean
  ): Promise<boolean> => {
    if (!title.trim()) {
      setErrorMessage('Judul artikel wajib diisi.')
      return false
    }

    const finalContent = editorStyle === 'blocks' ? blocksToContent(blocks) : rawContent
    if (!finalContent.trim()) {
      setErrorMessage('Konten artikel tidak boleh kosong.')
      return false
    }

    const finalStatus = targetStatus || status

    // Ensure active blocks are in sync if saving from raw mode
    const effectiveBlocks = editorStyle === 'blocks' ? blocks : contentToBlocks(finalContent)
    if (editorStyle === 'raw' && effectiveBlocks.length > 0) {
      setBlocks(effectiveBlocks)
    }

    // Publication Gate Pre-check before saving as published
    const contentImages = effectiveBlocks
      .filter((b): b is Extract<ContentBlock, { type: 'image' }> => b.type === 'image' && Boolean(b.url))
      .map((b) => ({
        url: b.url || '',
        altText: b.alt || b.caption || '',
        decorative: false,
      }))

    if (finalStatus === 'published' || finalStatus === 'scheduled') {
      const gateCheck = checkPublicationGate({
        locale,
        title,
        slug: slug.trim() || editSlug || '',
        metaDescription: metaDescription.trim() || excerpt || title,
        seoTitle: seoTitle.trim() || `${title} — UNIMASI`,
        existingSlugs: [],
        images: contentImages,
        heroVisual: coverUrl ? { url: coverUrl, altText: coverAlt, decorative: false } : null,
      })

      if (!gateCheck.canPublish) {
        setGateViolations(gateCheck.violations.map((v) => v.message))
        return false
      }
    }

    setSaving(true)
    setErrorMessage('')
    setSuccessData(null)

    try {
      const finalMetaTitle = seoTitle.trim() || `${title} — UNIMASI`
      const finalMetaDesc = metaDescription.trim() || excerpt || title

      const payload = {
        slug: slug.trim() || editSlug,
        originalSlug: isEditMode ? editSlug : undefined,
        publishedAt: publicationDate || undefined,
        title: title.trim(),
        excerpt: excerpt.trim() || title.trim(),
        content: finalContent,
        category,
        tags: tagInput.split(',').map((tag) => tag.trim()).filter(Boolean),
        author,
        coverUrl,
        coverAlt,
        status: finalStatus,
        scheduledAt: finalStatus === 'scheduled' && scheduleLocal ? new Date(scheduleLocal).toISOString() : undefined,
        publicationTimezone,
        expectedUpdatedAt: loadedUpdatedAt,
        forceOverwrite: Boolean(forceOverwrite),

        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDesc,
        locale,
        translationGroupId: translationGroupId.trim() || undefined,
        focusKeyphrase: focusKeyphrase.trim() || undefined,
        relatedKeyphrases,
        isCornerstone,
        primaryCategory: category,
        seoData: {
          ...baseSeoData,
          locale,
          translationGroupId: translationGroupId.trim() || undefined,
          focusKeyphrase: focusKeyphrase.trim(),
          relatedKeyphrases,
          seoTitle: finalMetaTitle,
          metaDescription: finalMetaDesc,
          slug: slug.trim() || editSlug,
          canonicalUrl: canonicalUrl.trim() || null,
          robots,
          openGraph: {
            ...baseSeoData.openGraph,
            title: socialOg.title || finalMetaTitle,
            description: socialOg.description || finalMetaDesc,
            image: socialOg.image || coverUrl,
            imageAlt: socialOg.imageAlt || coverAlt,
            type: 'article',
            locale,
          },
          twitter: {
            ...baseSeoData.twitter,
            card: socialTwitter.card || 'summary_large_image',
            title: socialTwitter.title || finalMetaTitle,
            description: socialTwitter.description || finalMetaDesc,
            image: socialTwitter.image || coverUrl,
            imageAlt: socialTwitter.imageAlt || coverAlt,
          },
          schema: schemaChanged ? { type: schemaType } : (baseSeoData.schema || { type: schemaType }),
          breadcrumbTitle: breadcrumbTitle.trim() || title,
          isCornerstone,
          primaryCategory: category,
        },
      }

      const method = isEditMode ? 'PATCH' : 'POST'
      const res = await fetch('/api/articles', {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.conflict) {
          setConflictServerUpdatedAt(data.serverUpdatedAt || null)
          setConflictModalOpen(true)
          setErrorMessage(data.error || 'Konflik pengeditan: Artikel ini telah diperbarui oleh pengguna lain.')
          return false
        }
        if (res.status === 422 && data.violations) {
          setGateViolations(data.violations.map((v: any) => v.message || v))
          throw new Error('Gerbang publikasi terkunci. Mohon lengkapi syarat SEO/Aksesibilitas.')
        }
        throw new Error(data.error || 'Gagal menyimpan artikel.')
      }

      if (data.updatedAt) {
        setLoadedUpdatedAt(data.updatedAt)
      }

      setStatus(finalStatus)
      setIsDirty(false)
      const targetSlug = slug.trim() || editSlug || ''
      const previewSuffix = finalStatus === 'published' ? '' : '?preview=true'
      setSuccessData({
        url: `${siteConfig.url}/artikel/${encodeURIComponent(targetSlug)}${previewSuffix}`,
        title: title,
        action: finalStatus === 'published' ? 'diterbitkan' : 'disimpan sebagai draf',
      })

      // Update local editSlug state so subsequent saves PATCH instead of failing with duplicate POST
      locallySavedSlugRef.current = targetSlug
      setEditSlug(targetSlug)

      // Seamlessly update browser URL without full page reload
      const newUrl = `/admin/buat-artikel?slug=${encodeURIComponent(targetSlug)}`
      if (typeof window !== 'undefined') {
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
      }
      router.replace(newUrl, { scroll: false })
      return true
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menyimpan.')
      return false
    } finally {
      setSaving(false)
    }
  }

  // ------------------ NAVIGATION GUARD & EXIT CONFIRMATION ------------------
  const handleRequestNavigate = (url: string) => {
    if (isDirty) {
      setPendingNavigationUrl(url)
      setShowUnsavedModal(true)
    } else {
      router.push(url)
    }
  }

  const handleConfirmDiscard = () => {
    setIsDirty(false)
    setShowUnsavedModal(false)
    const target = pendingNavigationUrl || '/admin?tab=articles'
    setPendingNavigationUrl(null)

    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(target, window.location.origin)
        if (parsed.origin === window.location.origin) {
          router.push(parsed.pathname + parsed.search + parsed.hash)
          return
        }
      } catch (err) { console.warn("[observable error]:", err) }
      window.location.href = target
    } else {
      router.push(target)
    }
  }

  const handleSaveAndLeave = async () => {
    const success = await handleSave('draft')
    if (success) {
      setIsDirty(false)
      setShowUnsavedModal(false)
      const target = pendingNavigationUrl || '/admin?tab=articles'
      setPendingNavigationUrl(null)

      if (typeof window !== 'undefined') {
        try {
          const parsed = new URL(target, window.location.origin)
          if (parsed.origin === window.location.origin) {
            router.push(parsed.pathname + parsed.search + parsed.hash)
            return
          }
        } catch (err) { console.warn("[observable error]:", err) }
        window.location.href = target
      } else {
        router.push(target)
      }
    }
  }

  const handleCancelLeave = () => {
    setShowUnsavedModal(false)
    setPendingNavigationUrl(null)
  }

  // Guard 1: Intercept window unload, tab close, or browser refresh when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Guard 2: Intercept browser back/forward buttons when dirty
  useEffect(() => {
    if (!isDirty) return

    // Push an additional history entry so pressing browser back triggers popstate instead of exiting
    const currentState = window.history.state || {}
    window.history.pushState({ ...currentState, unimasi_guard: true }, '', window.location.href)

    const handlePopState = () => {
      // Re-push history entry so the user stays on the page until they confirm
      window.history.pushState({ ...currentState, unimasi_guard: true }, '', window.location.href)
      setPendingNavigationUrl('/admin?tab=articles')
      setShowUnsavedModal(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty])

  // Guard 3: Intercept clicks on links leaving the editor when dirty
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (!isDirty) return

      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Allow hash links within the page (#...)
      if (href.startsWith('#')) return

      // Allow non-navigational protocols
      if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      // Allow new tab links or modified clicks
      if (anchor.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return

      try {
        const targetUrl = new URL(href, window.location.origin)
        // If clicking the current page with no search/pathname change, ignore
        if (
          targetUrl.origin === window.location.origin &&
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return
        }
      } catch (err) { console.warn("[observable error]:", err) }

      e.preventDefault()
      e.stopPropagation()
      setPendingNavigationUrl(href)
      setShowUnsavedModal(true)
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [isDirty])

  // Keyboard Shortcuts: Cmd+S / Ctrl+S to save, Cmd+/ to toggle inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave(status === 'published' ? 'published' : 'draft')
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsInspectorOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        if (showUnsavedModal) {
          setShowUnsavedModal(false)
          setPendingNavigationUrl(null)
          return
        }
        if (gateViolations.length > 0) setGateViolations([])
        if (linkModalOpen) setLinkModalOpen(false)
        if (aiMode !== 'idle') setAiMode('idle')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, gateViolations, linkModalOpen, aiMode, title, blocks, rawContent, showUnsavedModal])

  // View Mode Switcher Handling
  const handleViewModeChange = (mode: EditorViewMode) => {
    setViewMode(mode)
    if (mode === 'focus') {
      setIsInspectorOpen(false)
    } else if (mode === 'split-inspector') {
      setIsInspectorOpen(true)
    }
  }

  const handleOpenSeoTab = () => {
    setInspectorTab('seo')
    setIsInspectorOpen(true)
    if (viewMode === 'focus' || viewMode === 'full-preview') {
      setViewMode('split-inspector')
    }
  }


  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--studio-bg)] space-y-4">
        <RefreshCw className="w-8 h-8 text-accent-400 animate-spin" />
        <h3 className="text-sm font-bold text-white">Memuat Data Artikel...</h3>
        <p className="text-xs text-neutral-400 font-mono">Memuat konten editorial ({editSlug})</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--studio-bg)] text-neutral-100 antialiased selection:bg-accent-500 selection:text-black">
      {/* ---------------- 1. COMPACT DEDICATED HEADER ---------------- */}
      <ArticleEditorHeader
        title={title}
        slug={slug}
        status={status}
        isEditMode={isEditMode}
        isDirty={isDirty}
        saving={saving}
        wordCount={wordCount}
        readingTimeMinutes={readingTimeMinutes}
        internalLinksCount={internalLinksCount}
        seoScore={seoReport.score}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen((v) => !v)}
        isAiOpen={aiMode !== 'idle'}
        onToggleAi={() => setAiMode((prev) => (prev === 'idle' ? 'docked' : 'idle'))}
        onSave={handleSave}
        permissions={permissions}
        publicationDate={publicationDate}
        onChangePublicationDate={setPublicationDate}
        scheduleLocal={scheduleLocal}
        onChangeScheduleLocal={setScheduleLocal}
        publicationTimezone={publicationTimezone}
        onOpenSeoTab={handleOpenSeoTab}
        onNavigateBack={() => handleRequestNavigate('/admin?tab=articles')}
      />

      {/* Multi-User Real-time Presence Banner */}
      {activeLockUser && (
        <div className="mx-4 mt-2 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-amber-300 text-xs animate-fadeIn z-20">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Perhatian Multi-User:</strong> Artikel ini sedang aktif diedit oleh{' '}
              <span className="font-semibold underline text-white">{activeLockUser.name}</span> ({activeLockUser.email}).
              Perubahan Anda dapat bertabrakan jika disimpan bersamaan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveLockUser(null)}
            className="text-amber-400 hover:text-white p-1 rounded transition-colors text-[11px]"
            title="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Notification / Toast Banner */}
      {errorMessage && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-300 animate-fadeIn z-20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="p-1 text-red-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successData && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn z-20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Artikel <strong>&ldquo;{successData.title}&rdquo;</strong> berhasil {successData.action}!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={successData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 font-semibold text-emerald-200"
            >
              <span>{status === 'published' ? 'Lihat Publik' : 'Buka Pratinjau'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button type="button" onClick={() => setSuccessData(null)} className="p-1 text-emerald-300 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 2. WORKSPACE AREA ---------------- */}
      <div className="relative flex-1 min-h-0 w-full flex overflow-hidden">
        {/* VIEW: FULL PREVIEW */}
        {viewMode === 'full-preview' ? (
          <ArticleLivePreview
            title={title}
            slug={slug}
            category={category}
            author={author}
            publicationDate={publicationDate}
            readingTimeMinutes={readingTimeMinutes}
            coverUrl={coverUrl}
            coverAlt={coverAlt}
            excerpt={excerpt}
            blocks={blocks}
            rawContent={rawContent}
            editorStyle={editorStyle}
            tags={tagInput.split(',').map((t) => t.trim()).filter(Boolean)}
          />
        ) : viewMode === 'split-preview' ? (
          /* VIEW: DUAL SPLIT PREVIEW (EDITOR ON LEFT, LIVE PREVIEW ON RIGHT) */
          <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden divide-x divide-white/[0.08]">
            <div className="w-1/2 h-full flex flex-col min-h-0">
              <ArticleEditorCanvas
                title={title}
                onTitleChange={handleTitleChange}
                slug={slug}
                category={category}
                categoriesList={categoriesList}
                onCategoryChange={(val) => { setCategory(val); setIsDirty(true) }}
                editorStyle={editorStyle}
                onEditorStyleChange={handleEditorStyleChange}
                onConvertRawToBlocks={handleConvertRawToBlocks}
                onImportMarkdown={handleImportMarkdown}
                onConvertSingleHtmlBlockToBlocks={handleConvertSingleHtmlBlockToBlocks}
                rawContent={rawContent}
                onRawContentChange={(val) => { setRawContent(val); setIsDirty(true) }}
                blocks={blocks}
                onAddBlock={addBlock}
                onUpdateBlock={updateBlock}
                onRemoveBlock={removeBlock}
                onMoveBlock={moveBlock}
                onConvertBlockType={convertBlockType}
                rawHtmlBlockIds={rawHtmlBlockIds}
                onToggleRawHtmlBlock={(id) => setRawHtmlBlockIds((prev) => ({ ...prev, [id]: !prev[id] }))}
                activeTypeDropdownBlockId={activeTypeDropdownBlockId}
                onSetActiveTypeDropdownBlockId={setActiveTypeDropdownBlockId}
                onOpenMediaPickerForBlock={(blockId) => {
                  setMediaPickerTarget({ blockId })
                  setMediaPickerOpen(true)
                }}
                isFocusMode={false}
              />
            </div>
            <div className="w-1/2 h-full flex flex-col min-h-0">
              <ArticleLivePreview
                title={title}
                slug={slug}
                category={category}
                author={author}
                publicationDate={publicationDate}
                readingTimeMinutes={readingTimeMinutes}
                coverUrl={coverUrl}
                coverAlt={coverAlt}
                excerpt={excerpt}
                blocks={blocks}
                rawContent={rawContent}
                editorStyle={editorStyle}
                tags={tagInput.split(',').map((t) => t.trim()).filter(Boolean)}
              />
            </div>
          </div>
        ) : (
          /* VIEW: CANVAS WITH COLLAPSIBLE INSPECTOR (FOCUS OR SPLIT-INSPECTOR) */
          <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden">
            <ArticleEditorCanvas
              title={title}
              onTitleChange={handleTitleChange}
              slug={slug}
              category={category}
              categoriesList={categoriesList}
              onCategoryChange={(val) => { setCategory(val); setIsDirty(true) }}
              editorStyle={editorStyle}
              onEditorStyleChange={handleEditorStyleChange}
              onConvertRawToBlocks={handleConvertRawToBlocks}
              onImportMarkdown={handleImportMarkdown}
              onConvertSingleHtmlBlockToBlocks={handleConvertSingleHtmlBlockToBlocks}
              rawContent={rawContent}
              onRawContentChange={(val) => { setRawContent(val); setIsDirty(true) }}
              blocks={blocks}
              onAddBlock={addBlock}
              onUpdateBlock={updateBlock}
              onRemoveBlock={removeBlock}
              onMoveBlock={moveBlock}
              onConvertBlockType={convertBlockType}
              rawHtmlBlockIds={rawHtmlBlockIds}
              onToggleRawHtmlBlock={(id) => setRawHtmlBlockIds((prev) => ({ ...prev, [id]: !prev[id] }))}
              activeTypeDropdownBlockId={activeTypeDropdownBlockId}
              onSetActiveTypeDropdownBlockId={setActiveTypeDropdownBlockId}
              onOpenMediaPickerForBlock={(blockId) => {
                setMediaPickerTarget({ blockId })
                setMediaPickerOpen(true)
              }}
              isFocusMode={viewMode === 'focus' || !isInspectorOpen}
            />

            {/* Collapsible Inspector Sidebar */}
            <ArticleEditorInspector
              isOpen={isInspectorOpen}
              onClose={() => setIsInspectorOpen(false)}
              activeTab={inspectorTab}
              onTabChange={setInspectorTab}
              category={category}
              onCategoryChange={(val) => { setCategory(val); setIsDirty(true) }}
              categoriesList={categoriesList}
              tagInput={tagInput}
              onTagInputChange={(val) => { setTagInput(val); setIsDirty(true) }}
              author={author}
              onAuthorChange={(val) => { setAuthor(val); setIsDirty(true) }}
              slug={slug}
              onSlugChange={(val) => { setSlug(val); setIsDirty(true) }}
              targetKeyword={targetKeyword}
              onTargetKeywordChange={(val) => { setTargetKeyword(val); setIsDirty(true) }}
              excerpt={excerpt}
              onExcerptChange={(val) => { setExcerpt(val); setIsDirty(true) }}
              coverUrl={coverUrl}
              onCoverUrlChange={(val) => { setCoverUrl(val); setIsDirty(true) }}
              coverAlt={coverAlt}
              onCoverAltChange={(val) => { setCoverAlt(val); setIsDirty(true) }}
              uploadingCover={uploadingCover}
              onCoverUpload={handleCoverUpload}
              onOpenMediaPickerForCover={() => {
                setMediaPickerTarget('cover')
                setMediaPickerOpen(true)
              }}
              internalLinksCount={internalLinksCount}
              title={title}
              locale={locale}
              onChangeLocale={setLocale}
              translationGroupId={translationGroupId}
              onChangeTranslationGroupId={setTranslationGroupId}
              isCornerstone={isCornerstone}
              onChangeIsCornerstone={setIsCornerstone}
              focusKeyphrase={focusKeyphrase}
              onChangeFocusKeyphrase={setFocusKeyphrase}
              relatedKeyphrases={relatedKeyphrases}
              onChangeRelatedKeyphrases={setRelatedKeyphrases}
              seoTitle={seoTitle}
              onChangeSeoTitle={setSeoTitle}
              metaDescription={metaDescription}
              onChangeMetaDescription={setMetaDescription}
              canonicalUrl={canonicalUrl}
              onChangeCanonicalUrl={setCanonicalUrl}
              breadcrumbTitle={breadcrumbTitle}
              onChangeBreadcrumbTitle={setBreadcrumbTitle}
              schemaType={schemaType}
              onChangeSchemaType={(v) => { setSchemaType(v); setSchemaChanged(true) }}
              robots={robots}
              onChangeRobots={setRobots}
              socialOg={socialOg}
              onChangeSocialOg={setSocialOg}
              socialTwitter={socialTwitter}
              onChangeSocialTwitter={setSocialTwitter}
              currentContent={currentContent}
              blocks={blocks}
            />
          </div>
        )}

        {/* ---------------- 3. AI COPILOT SIDEBAR ---------------- */}
        {aiMode === 'docked' && (
          <div
            style={{ width: `${aiWidth}px` }}
            className="relative z-30 h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.08] bg-surface-elevated flex shadow-2xl"
          >
            <StudioAiSidebar
              isOpen
              variant="panel"
              pageContext={articlePageContext}
              onApplyArticleChanges={handleApplyArticleChanges}
              onClose={() => setAiMode('idle')}
              onExpand={() => setAiMode('expanded')}
              onOpenWidget={() => setAiMode('widget')}
            />
          </div>
        )}

        {aiMode === 'expanded' && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setAiMode('docked')}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 right-0 z-50 w-[min(780px,calc(100vw-4rem))] flex flex-col border-l border-white/10 bg-surface-elevated shadow-2xl">
              <StudioAiSidebar
                isOpen
                variant="panel"
                isExpanded
                pageContext={articlePageContext}
                onApplyArticleChanges={handleApplyArticleChanges}
                onClose={() => setAiMode('idle')}
                onCollapse={() => setAiMode('docked')}
                onOpenWidget={() => setAiMode('widget')}
              />
            </div>
          </>
        )}

        {aiMode === 'widget' && (
          <div className="fixed bottom-4 right-4 z-50 h-[min(560px,calc(100vh-6rem))] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/80">
            <StudioAiSidebar
              isOpen
              variant="widget"
              pageContext={articlePageContext}
              onApplyArticleChanges={handleApplyArticleChanges}
              onClose={() => setAiMode('idle')}
              onOpenPanel={() => setAiMode('docked')}
            />
          </div>
        )}
      </div>

      {/* ---------------- 4. MODALS ---------------- */}
      <ArticlePublicationGateModal
        violations={gateViolations}
        onClose={() => setGateViolations([])}
        onFixSeo={() => {
          setGateViolations([])
          handleOpenSeoTab()
        }}
      />

      <ArticleLinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        linkTextInput={linkTextInput}
        onChangeLinkTextInput={setLinkTextInput}
        linkUrlInput={linkUrlInput}
        onChangeLinkUrlInput={setLinkUrlInput}
        onSubmit={(e) => {
          e.preventDefault()
          if (!activeLinkBlockId || !linkUrlInput.trim()) return
          const url = linkUrlInput.trim()
          const text = linkTextInput.trim() || url
          const formattedTag = `<a href="${url}">${text}</a>`
          const targetBlock = blocks.find((b) => b.id === activeLinkBlockId)
          if (targetBlock && targetBlock.type === 'paragraph') {
            const newText = targetBlock.text ? `${targetBlock.text} ${formattedTag}` : formattedTag
            updateBlock(activeLinkBlockId, { text: newText })
          }
          setLinkModalOpen(false)
          setActiveLinkBlockId(null)
          setLinkUrlInput('')
          setLinkTextInput('')
        }}
      />

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        currentUrl={mediaPickerTarget === 'cover' ? coverUrl : undefined}
        title={
          mediaPickerTarget === 'cover'
            ? 'Pilih Visual Cover Hero (Featured Image)'
            : 'Pilih Gambar dari Pustaka Media'
        }
      />

      {/* Confirmation Modal when Leaving with Unsaved Changes */}
      <ArticleUnsavedModal
        isOpen={showUnsavedModal}
        saving={saving}
        onCancel={handleCancelLeave}
        onConfirmDiscard={handleConfirmDiscard}
        onSaveAndLeave={handleSaveAndLeave}
      />

      {/* Multi-User Concurrency Collision & Conflict Modal */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-overlay border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/90">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Konflik Pengeditan Multi-User</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Artikel ini telah disimpan dan diperbarui oleh editor lain di database sejak Anda membukanya.
              Untuk mencegah menimpa tulisan editor lain tanpa sengaja, silakan tentukan tindakan Anda:
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setConflictModalOpen(false)
                  window.location.reload()
                }}
                className="w-full py-2.5 px-4 bg-info-500 hover:bg-info text-white font-medium rounded-xl text-xs transition-colors"
              >
                Muat Ulang Versi Terbaru dari Database (Disarankan)
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConflictModalOpen(false)
                  await handleSave(undefined, true)
                }}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-amber-300 font-medium rounded-xl text-xs transition-colors border border-amber-500/30"
              >
                Paksa Simpan & Timpa Perubahan (Force Overwrite)
              </button>
              <button
                type="button"
                onClick={() => setConflictModalOpen(false)}
                className="w-full py-2 px-4 text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
              >
                Kembali ke Editor Tanpa Menyimpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BuatArtikelStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--studio-bg)] font-mono text-xs text-neutral-400">
          Memuat Editor Studio…
        </div>
      }
    >
      <ArticleEditorInner />
    </Suspense>
  )
}
