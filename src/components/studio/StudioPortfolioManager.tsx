'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo, useId } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import {
  Briefcase,
  Search,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  X,
  Upload,
  ArrowLeft,
  Save,
  Sliders,
  Eye,
  Globe,
  FileText,
  BarChart3,
  Cpu,
  ShieldCheck,
  FolderKanban,
  AlertCircle,
  Columns,
  PenSquare,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react'
import StudioVisualEditor, { StudioBlock, StudioViewMode } from './StudioVisualEditor'
import StudioSeoInspector from './StudioSeoInspector'
import MediaPickerModal from './MediaPickerModal'
import { EditorDialog, dialogButton } from './editor/EditorDialog'
import { Tooltip } from '@/components/ui/Tooltip'
import { Locale } from '@/lib/seo/schema'

export interface PortfolioItem {
  id?: number
  title: string
  slug: string
  client?: string
  year?: number
  category?: string
  summary?: string
  challenge?: string
  approach?: string
  solution?: string
  process?: string
  result?: string
  heroImage?: string
  liveUrl?: string
  featured?: boolean
  status?: 'draft' | 'in_review' | 'approved' | 'published' | 'archived'
  metrics?: Array<{ label: string; value: string; detail?: string }>
  technologies?: string[]
  blocks?: StudioBlock[]
  metaTitle?: string
  metaDescription?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
}

function generateDefaultPortfolioBlocks(title: string, client: string, summary: string, heroImage: string): StudioBlock[] {
  const heroTitle = title
  const heroDesc = summary
  return [
    {
      id: `hero-${Date.now()}-1`,
      type: 'hero-cinema',
      title: heroTitle,
      headline: heroTitle,
      highlightWord: 'Spatial Computing',
      badge: 'SPATIUM SPATIAL TECHNOLOGY STUDIO',
      client,
      description: heroDesc,
      subheadline: heroDesc,
      showreelUrl: '',
      data: {
        badge: 'SPATIUM SPATIAL TECHNOLOGY STUDIO',
        headline: heroTitle,
        subheadline: heroDesc,
        primaryCta: { label: 'Jelajahi 3DGS', href: '#splat-viewer' },
        secondaryCta: { label: 'Konsultasi Spasial', href: '/contact' },
      },
      // Values intentionally empty: fill with measured project data only.
      metrics: [
        { label: 'Jumlah Splat', value: '' },
        { label: 'Luas Area Dipindai', value: '' },
        { label: 'Format Output', value: '' },
      ],
    },
    {
      id: `timeline-${Date.now()}-2`,
      type: 'process-timeline',
      title: 'Alur Reality Capture & Rekonstruksi 3DGS',
      subtitle: 'Metodologi 4-fase terpadu SPATIUM dari pemindaian sensor hingga representasi neural radiance fields WebGL.',
      steps: [
        {
          step: '01',
          title: 'Laser Scan & Drone Capture',
          description: 'Akuisisi data multi-sensor LiDAR darat dan drone resolusi tinggi untuk jutaan koordinat XYZ.',
        },
        {
          step: '02',
          title: 'Point Cloud Densification',
          description: 'Registrasi dan pembersihan point cloud berkerapatan tinggi sebagai fondasi geometri yang terukur.',
        },
        {
          step: '03',
          title: '3D Geometry & CAD Reconstruction',
          description: 'Pemodelan mesh dan kalibrasi batas ruang arsitektur untuk integrasi software 3D profesional.',
        },
        {
          step: '04',
          title: '3D Gaussian Splatting (3DGS)',
          description: 'Pelatihan 3D Gaussian Splat menjadi ruang fotorealistis yang bisa dijelajahi langsung di browser.',
        },
      ],
      data: {
        title: 'Alur Reality Capture & Rekonstruksi 3DGS',
        description: 'Metodologi 4-fase terpadu SPATIUM dari pemindaian sensor hingga representasi neural radiance fields WebGL.',
        steps: [
          { stepNumber: '01', title: 'Laser Scan & Drone Capture', summary: 'Akuisisi data multi-sensor LiDAR darat dan drone resolusi tinggi untuk jutaan koordinat XYZ.' },
          { stepNumber: '02', title: 'Point Cloud Densification', summary: 'Registrasi dan pembersihan point cloud berkerapatan tinggi sebagai fondasi geometri yang terukur.' },
          { stepNumber: '03', title: '3D Geometry & CAD Reconstruction', summary: 'Pemodelan mesh dan kalibrasi batas ruang arsitektur untuk integrasi software 3D profesional.' },
          { stepNumber: '04', title: '3D Gaussian Splatting (3DGS)', summary: 'Pelatihan 3D Gaussian Splat menjadi ruang fotorealistis yang bisa dijelajahi langsung di browser.' },
        ],
      },
    },
    {
      id: `stats-${Date.now()}-3`,
      type: 'stats-ticker',
      // Values intentionally empty: fill with verified project data only (zero-mock policy).
      title: 'Data Proyek',
      items: [
        { label: 'Titik Pemindaian', value: '' },
        { label: 'Luas Area', value: '' },
        { label: 'Durasi Capture', value: '' },
      ],
      data: {
        title: 'Data Proyek',
        metrics: [
          { label: 'Titik Pemindaian', value: '' },
          { label: 'Luas Area', value: '' },
          { label: 'Durasi Capture', value: '' },
        ],
      },
    },
    {
      id: `cta-${Date.now()}-5`,
      type: 'interactive-cta',
      title: 'Wujudkan Digital Twin Ruang Anda',
      description: 'Diskusikan kebutuhan laser scan, point cloud, dan 3D Gaussian Splat untuk film, marketing, instalasi, atau dokumentasi kenangan bersama tim SPATIUM.',
      buttonText: 'Mulai Proyek Spasial',
      data: {
        headline: 'Wujudkan Digital Twin Ruang Anda',
        body: 'Diskusikan kebutuhan laser scan, point cloud, dan 3D Gaussian Splat untuk film, marketing, instalasi, atau dokumentasi kenangan bersama tim SPATIUM.',
        primaryCta: { label: 'Mulai Proyek Spasial', href: '/contact' },
      },
    },
  ]
}

export function StudioPortfolioManager() {
  const fieldId = useId()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')

  const availableCategories = useMemo(() => {
    const fromItems = items.map((i) => i.category).filter(Boolean) as string[]
    return Array.from(new Set(fromItems))
  }, [items])

  // Full Studio Editor Mode State (Max 2 Panels)
  const [editorMode, setEditorMode] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<StudioViewMode>('split-preview')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [listStatus, setListStatus] = useState('')
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeInspectorTab, setActiveInspectorTab] = useState<'story' | 'meta' | 'seo'>('story')

  // Form State
  const [formId, setFormId] = useState<number | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formClient, setFormClient] = useState('')
  const [formYear, setFormYear] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formHeroImage, setFormHeroImage] = useState('')
  const [formHeroAlt, setFormHeroAlt] = useState('')
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [showCoverAltModal, setShowCoverAltModal] = useState(false)
  const [formLiveUrl, setFormLiveUrl] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formStatus, setFormStatus] = useState<'draft' | 'in_review' | 'approved' | 'published' | 'archived'>('draft')

  // Narrative Story Form State
  const [formChallenge, setFormChallenge] = useState('')
  const [formApproach, setFormApproach] = useState('')
  const [formSolution, setFormSolution] = useState('')
  const [formProcess, setFormProcess] = useState('')
  const [formResult, setFormResult] = useState('')
  // Metrics and stack start empty: only measured project data is shown (AGENTS.md §3.3).
  const [formMetrics, setFormMetrics] = useState<Array<{ label: string; value: string; detail?: string }>>([])
  const [formTechnologies, setFormTechnologies] = useState<string[]>([])
  const [newTechInput, setNewTechInput] = useState('')

  // Visual Blocks Array
  const [formBlocks, setFormBlocks] = useState<StudioBlock[]>([])

  // Tour Upload State
  const [tourUploadModalOpen, setTourUploadModalOpen] = useState(false)
  const [tourUploadTitle, setTourUploadTitle] = useState('')
  const [tourUploadSlug, setTourUploadSlug] = useState('')
  const [tourUploadClient, setTourUploadClient] = useState('')
  const [tourUploadCategory, setTourUploadCategory] = useState('Marketing & Branding')
  const [tourUploadPointCount, setTourUploadPointCount] = useState('')
  const [tourUploadAccuracy, setTourUploadAccuracy] = useState('')
  const [tourUploadSplatId, setTourUploadSplatId] = useState('')
  const [tourUploadExternalUrl, setTourUploadExternalUrl] = useState('')
  const [tourUploadFile, setTourUploadFile] = useState<File | null>(null)
  const [tourUploading, setTourUploading] = useState(false)
  const [tourUploadError, setTourUploadError] = useState('')
  const [tourUploadResult, setTourUploadResult] = useState<any>(null)

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

  // Fetch Portfolios
  const fetchPortfolios = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat portofolio:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolios()
  }, [])

  // Deep link from MCP `editUrl` / notifications: /admin?tab=portfolio&slug=<slug> opens that entry once.
  const searchParams = useSearchParams()
  const deepLinkSlug = searchParams?.get('slug') ?? null
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    if (!deepLinkSlug || deepLinkHandled.current) return
    const match = items.find((entry) => entry.slug === deepLinkSlug)
    if (!match) return
    deepLinkHandled.current = true
    handleEditItem(match)
  }, [deepLinkSlug, items])

  // Create New Portfolio
  const handleAddNew = () => {
    // New items start empty and as DRAFT: every value must come from the real project
    // (AGENTS.md §3.3 — no prefilled metrics, clients or scene links).
    setFormId(null)
    setFormTitle('')
    const initialSlug = `spatium-capture-${Date.now().toString().slice(-4)}`
    setFormSlug(initialSlug)
    setFormClient('')
    setFormYear('')
    setFormCategory(availableCategories[0] || '')
    setFormSummary('')
    setFormHeroImage('')
    setFormHeroAlt('')
    setFormLiveUrl('')
    setFormFeatured(false)
    setFormStatus('draft')
    setFormChallenge('')
    setFormApproach('')
    setFormSolution('')
    setFormProcess('')
    setFormResult('')
    setFormMetrics([])
    setFormTechnologies(['3D Gaussian Splatting'])

    // Initialize Default Visual Blocks
    const defaultBlocks = generateDefaultPortfolioBlocks('', '', '', '')
    setFormBlocks(defaultBlocks)

    // Reset SEO
    setSeoTitle('')
    setMetaDesc('')
    setFocusKeyphrase('')
    setRelatedKeyphrases([])
    setCanonicalUrl(`${siteConfig.url}/portfolio/${initialSlug}`)

    setSelectedBlockId(defaultBlocks[0]?.id || null)
    setShowPropertiesDrawer(true)
    setSaveMessage('')
    setErrorMessage('')
    setEditorMode(true)
  }

  const handleTourUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tourUploadTitle.trim()) {
      setTourUploadError('Judul tur spasial wajib diisi.')
      return
    }

    setTourUploading(true)
    setTourUploadError('')
    setTourUploadResult(null)

    try {
      const data = new FormData()
      data.append('title', tourUploadTitle.trim())
      if (tourUploadSlug.trim()) data.append('slug', tourUploadSlug.trim())
      if (tourUploadClient.trim()) data.append('client', tourUploadClient.trim())
      if (tourUploadCategory.trim()) data.append('category', tourUploadCategory.trim())
      if (tourUploadPointCount.trim()) data.append('pointCount', tourUploadPointCount.trim())
      if (tourUploadAccuracy.trim()) data.append('accuracy', tourUploadAccuracy.trim())
      if (tourUploadSplatId.trim()) data.append('splatId', tourUploadSplatId.trim())
      if (tourUploadExternalUrl.trim()) data.append('externalUrl', tourUploadExternalUrl.trim())
      if (tourUploadFile) data.append('file', tourUploadFile)

      const res = await fetch('/api/portfolio/upload-tour', {
        method: 'POST',
        body: data,
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengunggah dan mengekstrak berkas tur spasial.')
      }

      setTourUploadResult(json)
      await fetchPortfolios()
    } catch (err) {
      console.error('[TourUpload] Upload failed:', err)
      setTourUploadError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah tur spasial.')
    } finally {
      setTourUploading(false)
    }
  }

  // Open Edit Mode for Existing Item
  const handleEditItem = (item: any) => {
    setFormId(item.id || null)
    setFormTitle(item.title || '')
    setFormSlug(item.slug || '')
    setFormClient(item.client || '')
    setFormYear(item.year ? String(item.year) : '')
    setFormCategory(item.category || '')
    setFormSummary(item.summary || '')
    setFormHeroImage(item.heroImage || '')
    let extractedAlt = ''
    if (item.seoData) {
      try {
        const parsed = typeof item.seoData === 'string' ? JSON.parse(item.seoData) : item.seoData
        extractedAlt = parsed.coverAlt || parsed.ogImageAlt || ''
      } catch (err) {
        console.warn('[Portfolio] seoData is not valid JSON:', err)
      }
    }
    // No generated alt text: the editor writes a real description (publication gate).
    setFormHeroAlt(extractedAlt)
    setFormLiveUrl(item.liveUrl || '')
    setFormFeatured(Boolean(item.featured))
    setFormStatus(item.status || 'draft')

    setFormChallenge(item.challenge || '')
    setFormApproach(item.approach || '')
    setFormSolution(item.solution || '')
    setFormProcess(item.process || '')
    setFormResult(item.result || '')

    // Parse Metrics
    let parsedMetrics: any[] = []
    if (item.metrics) {
      try {
        parsedMetrics = typeof item.metrics === 'string' ? JSON.parse(item.metrics) : item.metrics
      } catch (err) {
        console.warn('[Portfolio] metrics is not valid JSON:', err)
        parsedMetrics = []
      }
    }
    setFormMetrics(Array.isArray(parsedMetrics) ? parsedMetrics : [])

    // Parse Technologies
    let parsedTech: any[] = []
    if (item.technologies) {
      try {
        parsedTech = typeof item.technologies === 'string' ? JSON.parse(item.technologies) : item.technologies
      } catch (err) {
        console.warn('[Portfolio] technologies is not valid JSON:', err)
        parsedTech = []
      }
    }
    setFormTechnologies(
      Array.isArray(parsedTech)
        ? parsedTech.map((t) => (typeof t === 'string' ? t : t?.name)).filter((t): t is string => Boolean(t))
        : []
    )

    // Parse Blocks
    let parsedBlocks: StudioBlock[] = []
    if (item.blocks) {
      try {
        parsedBlocks = typeof item.blocks === 'string' ? JSON.parse(item.blocks) : item.blocks
      } catch (err) {
        console.warn('[Portfolio] blocks is not valid JSON:', err)
        parsedBlocks = []
      }
    }

    if (!Array.isArray(parsedBlocks) || parsedBlocks.length === 0) {
      parsedBlocks = generateDefaultPortfolioBlocks(item.title, item.client || '', item.summary || '', item.heroImage || '')
    }
    setFormBlocks(parsedBlocks)

    // SEO Data
    setSeoTitle(item.metaTitle || `${item.title} — Studi Kasus SPATIUM`)
    setMetaDesc(item.metaDescription || item.summary || '')
    setFocusKeyphrase(item.focusKeyphrase || '')
    let parsedRelated: string[] = []
    if (item.relatedKeyphrases) {
      try {
        parsedRelated = typeof item.relatedKeyphrases === 'string' ? JSON.parse(item.relatedKeyphrases) : item.relatedKeyphrases
      } catch (err) {
        console.warn('[Portfolio] relatedKeyphrases is not valid JSON:', err)
        parsedRelated = []
      }
    }
    setRelatedKeyphrases(Array.isArray(parsedRelated) ? parsedRelated : [])
    setCanonicalUrl(`${siteConfig.url}/portfolio/${item.slug}`)

    setSelectedBlockId(parsedBlocks[0]?.id || null)
    setShowPropertiesDrawer(true)
    setSaveMessage('')
    setErrorMessage('')
    setEditorMode(true)
  }

  // Delete Portfolio
  const handleDeleteItem = async (item: PortfolioItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus portofolio "${item.title}"?`)) return
    const query = item.id ? `id=${item.id}` : `slug=${encodeURIComponent(item.slug)}`
    try {
      const res = await fetch(`/api/portfolio?${query}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setListStatus(`Portofolio "${item.title}" berhasil dihapus.`)
        fetchPortfolios()
      } else {
        setListStatus(json.error || json.message || 'Gagal menghapus portofolio.')
      }
    } catch (err) {
      console.error('[Portfolio] delete failed:', err)
      setListStatus('Terjadi kesalahan jaringan saat menghapus.')
    }
  }

  // Save Portfolio Handler
  const handleSavePortfolio = async () => {
    if (!formTitle.trim() || !formSlug.trim()) {
      setErrorMessage('Judul dan slug portofolio wajib diisi.')
      return
    }

    setSaving(true)
    setSaveMessage('')
    setErrorMessage('')

    const payload = {
      id: formId,
      title: formTitle.trim(),
      slug: formSlug.trim(),
      client: formClient.trim() || null,
      // Unknown year stays empty — never defaulted to the current year (AGENTS.md §3.3).
      year: formYear.trim() || null,
      category: formCategory || null,
      summary: formSummary.trim() || null,
      challenge: formChallenge.trim() || null,
      approach: formApproach.trim() || null,
      solution: formSolution.trim() || null,
      process: formProcess.trim() || null,
      result: formResult.trim() || null,
      heroImage: formHeroImage.trim() || null,
      liveUrl: formLiveUrl.trim() || null,
      featured: formFeatured,
      status: formStatus,
      metrics: formMetrics,
      technologies: formTechnologies,
      blocks: formBlocks,
      metaTitle: seoTitle.trim() || null,
      metaDescription: metaDesc.trim() || null,
      focusKeyphrase: focusKeyphrase.trim() || null,
      relatedKeyphrases: relatedKeyphrases,
      seoData: {
        coverAlt: formHeroAlt.trim(),
        ogImage: formHeroImage.trim() || null,
        ogImageAlt: formHeroAlt.trim() || null,
        twitterImage: formHeroImage.trim() || null,
        twitterImageAlt: formHeroAlt.trim() || null,
        metaTitle: seoTitle.trim() || null,
        metaDescription: metaDesc.trim() || null,
        canonicalUrl: canonicalUrl.trim() || null,
        robots,
      },
    }

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        // Later saves update this row instead of trying to create a duplicate.
        if (typeof data.id === 'number') setFormId(data.id)
        if (typeof data.slug === 'string') setFormSlug(data.slug)
        setSaveMessage('Portofolio & blok visual berhasil disimpan!')
        fetchPortfolios()
        setTimeout(() => setSaveMessage(''), 3500)
      } else {
        setErrorMessage(data.error || data.message || 'Gagal menyimpan portofolio.')
      }
    } catch (err) {
      console.error('[Portfolio] save failed:', err)
      setErrorMessage('Terjadi kesalahan jaringan saat menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  // Metric helpers
  const handleAddMetric = () => {
    setFormMetrics([...formMetrics, { label: '', value: '', detail: '' }])
  }
  const handleUpdateMetric = (index: number, field: string, val: string) => {
    const next = [...formMetrics]
    next[index] = { ...next[index], [field]: val }
    setFormMetrics(next)
  }
  const handleRemoveMetric = (index: number) => {
    setFormMetrics(formMetrics.filter((_, i) => i !== index))
  }

  // Tech helpers
  const handleAddTech = () => {
    if (!newTechInput.trim()) return
    if (!formTechnologies.includes(newTechInput.trim())) {
      setFormTechnologies([...formTechnologies, newTechInput.trim()])
    }
    setNewTechInput('')
  }
  const handleRemoveTech = (tech: string) => {
    setFormTechnologies(formTechnologies.filter((t) => t !== tech))
  }

  // Image Upload Helper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.url) {
        setFormHeroImage(data.url)
        setErrorMessage('')
      } else {
        setErrorMessage(data.error || data.message || 'Gagal mengunggah gambar.')
      }
    } catch (err) {
      console.error('[Portfolio] image upload failed:', err)
      setErrorMessage('Terjadi kesalahan saat mengunggah gambar.')
    }
  }

  // Filtered List
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.client || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter
    return matchesSearch && matchesCat
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 1: FULL STUDIO WYSIWYG BUILDER & INSPECTOR (DEDICATED FULLSCREEN LAYOUT)
  // ─────────────────────────────────────────────────────────────────────────────
  if (editorMode) {
    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#0D0D0D] text-white antialiased selection:bg-[#4d8bff] selection:text-black">
        {/* Top Dedicated Studio Master Header */}
        <header className="h-14 shrink-0 px-4 sm:px-6 bg-[var(--studio-sidebar-bg)] border-b border-white/[0.08] flex items-center justify-between gap-3 z-30 select-none overflow-hidden flex-nowrap">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 max-w-[55%] lg:max-w-[60%] overflow-hidden flex-nowrap whitespace-nowrap">
            <Tooltip label="Kembali" hint="Kembali ke daftar portofolio" side="bottom">
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
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden flex-nowrap whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#4d8bff]/15 border border-[#4d8bff]/30 text-[#4d8bff] uppercase tracking-wider shrink-0">
                <Briefcase className="w-3 h-3 text-[#4d8bff]" />
                <span className="hidden sm:inline">PORTOFOLIO • DIGITAL TWIN</span>
              </span>
              {formCategory && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-neutral-400 border border-white/10 hidden md:inline-block shrink-0 truncate max-w-[120px]">
                  {formCategory}
                </span>
              )}
              <span className="text-xs text-neutral-600 hidden sm:inline shrink-0">/</span>
              <h2 className="font-syne text-xs sm:text-sm font-bold text-white truncate min-w-0 flex-1 block whitespace-nowrap" title={formTitle || 'Studi Kasus Baru'}>
                {formTitle || 'Studi Kasus Baru'}
              </h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0 ${
                formStatus === 'published'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-neutral-400 border border-white/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${formStatus === 'published' ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                <span className="hidden lg:inline">{formStatus}</span>
              </span>
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
            {/* Link to live public page */}
            {formSlug && (
              <Tooltip label="Lihat Publik" hint="Buka halaman publik di tab baru" side="bottom">
                <a
                  href={`${siteConfig.url}/portfolio/${formSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-info" />
                  <span>Publik</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500" />
                </a>
              </Tooltip>
            )}

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

            <Tooltip label="Simpan Portofolio" hint={!isBlocksValid ? `Ada ${blockIssues.length} isu skema` : 'Simpan susunan blok ke database'} side="bottom">
              <button
                type="button"
                onClick={handleSavePortfolio}
                disabled={saving || !isBlocksValid}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-[0_0_15px_rgba(77, 139, 255,0.25)] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
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
              blocks={formBlocks}
              onChangeBlocks={setFormBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              targetType="portfolio"
              contextData={{ portfolios: items }}
              draftId={formId ? String(formId) : 'new'}
              onSave={handleSavePortfolio}
              onValidationChange={handleBlockValidation}
              viewMode={viewMode}
            />
          </div>

          {/* 2. DOCKED RIGHT PANEL: Contextual Inspector (Block Properties / Story / Meta / SEO) */}
          {showPropertiesDrawer && viewMode !== 'full-preview' && (
            <aside className="w-full sm:w-[380px] xl:w-[420px] shrink-0 border-l border-white/[0.08] bg-[var(--studio-bg)] h-full overflow-y-auto z-20 flex flex-col p-4 space-y-4">
              {(
                <div className="space-y-4">
                  {/* Tab Switcher: Story vs Meta vs SEO */}
                  <div className="flex rounded-2xl bg-surface-overlay p-1 border border-white/10 shadow-md">
                    <button
                      type="button"
                      onClick={() => setActiveInspectorTab('story')}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-xl transition-all ${
                        activeInspectorTab === 'story'
                          ? 'bg-[#4d8bff] text-[#191919] shadow font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Narasi Kasus
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInspectorTab('meta')}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-xl transition-all ${
                        activeInspectorTab === 'meta'
                          ? 'bg-[#4d8bff] text-[#191919] shadow font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Identitas Proyek
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
                      SEO & SERP
                    </button>
                  </div>

                  {/* TAB 1: STORY (4 PILAR STUDI KASUS + METRICS + TECH) */}
                  {activeInspectorTab === 'story' && (
                    <div className="p-5 rounded-3xl bg-surface-overlay border border-white/10 space-y-4 shadow-xl">
                      <div className="border-b border-white/10 pb-3">
                        <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#4d8bff]" />
                          <span>Narasi Struktur Studi Kasus</span>
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Format narasi 4 pilar standar Dogstudio/editorial yang menyatu dengan data publik.
                        </p>
                      </div>

                      {/* Executive Summary */}
                      <div>
                        <label htmlFor={`${fieldId}-pf1`} className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Ringkasan Eksekutif (Summary)
                        </label>
                        <textarea id={`${fieldId}-pf1`}
                          rows={3}
                          value={formSummary}
                          onChange={(e) => setFormSummary(e.target.value)}
                          placeholder="Ringkasan dampak bisnis dan inovasi teknologi studi kasus ini..."
                          className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                        />
                      </div>

                      {/* 4 Story Pillars */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div>
                          <label htmlFor={`${fieldId}-pf2`} className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            1. Tantangan Bisnis &amp; Teknis (Challenge)
                          </label>
                          <textarea id={`${fieldId}-pf2`}
                            rows={3}
                            value={formChallenge}
                            onChange={(e) => setFormChallenge(e.target.value)}
                            placeholder="Apa masalah utama yang dihadapi klien sebelum proyek dimulai?"
                            className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>

                        <div>
                          <label htmlFor={`${fieldId}-pf3`} className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            2. Pendekatan Rekayasa (Approach)
                          </label>
                          <textarea id={`${fieldId}-pf3`}
                            rows={3}
                            value={formApproach}
                            onChange={(e) => setFormApproach(e.target.value)}
                            placeholder="Metodologi, riset teknis, dan arsitektur yang dipilih..."
                            className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>

                        <div>
                          <label htmlFor={`${fieldId}-pf4`} className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            3. Solusi &amp; Implementasi (Solution)
                          </label>
                          <textarea id={`${fieldId}-pf4`}
                            rows={3}
                            value={formSolution}
                            onChange={(e) => setFormSolution(e.target.value)}
                            placeholder="Detail fitur, modul interaktif, dan sistem yang dibangun..."
                            className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>

                        <div>
                          <label htmlFor={`${fieldId}-pf5`} className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            4. Hasil &amp; Dampak Bisnis (Results)
                          </label>
                          <textarea id={`${fieldId}-pf5`}
                            rows={3}
                            value={formResult}
                            onChange={(e) => setFormResult(e.target.value)}
                            placeholder="Hasil konversi, peningkatan performa, atau umpan balik pengguna..."
                            className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>
                      </div>

                      {/* Key Metrics Editor */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                            <span>Metrik Kunci (Key Results)</span>
                          </h4>
                          <button
                            type="button"
                            onClick={handleAddMetric}
                            className="text-[10px] font-mono text-[#4d8bff] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Tambah Metrik
                          </button>
                        </div>

                        <div className="space-y-2">
                          {formMetrics.map((met, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <input
                                  aria-label={`Nilai metrik ${i + 1}`}
                                  type="text"
                                  value={met.value}
                                  onChange={(e) => handleUpdateMetric(i, 'value', e.target.value)}
                                  placeholder="Nilai terukur"
                                  className="w-24 px-2 py-1 text-xs font-mono font-bold text-emerald-400 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4d8bff]"
                                />
                                <input
                                  aria-label={`Label metrik ${i + 1}`}
                                  type="text"
                                  value={met.label}
                                  onChange={(e) => handleUpdateMetric(i, 'label', e.target.value)}
                                  placeholder="Label metrik"
                                  className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#4d8bff]"
                                />
                                <button aria-label={`Hapus metrik ${i + 1}`}
                                  type="button"
                                  onClick={() => handleRemoveMetric(i)}
                                  className="p-1 text-neutral-500 hover:text-rose-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                aria-label={`Detail metrik ${i + 1}`}
                                type="text"
                                value={met.detail || ''}
                                onChange={(e) => handleUpdateMetric(i, 'detail', e.target.value)}
                                placeholder="Detail konteks metrik..."
                                className="w-full px-2 py-1 text-[11px] bg-transparent border-none text-neutral-400 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tech Stack Chips */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <label className="block text-[11px] font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-info" />
                          <span>Stack Teknologi</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {formTechnologies.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white"
                            >
                              <span>{tech}</span>
                              <button aria-label={`Hapus teknologi ${tech}`}
                                type="button"
                                onClick={() => handleRemoveTech(tech)}
                                className="text-neutral-500 hover:text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            aria-label="Tambah teknologi"
                            type="text"
                            value={newTechInput}
                            onChange={(e) => setNewTechInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddTech()
                              }
                            }}
                            placeholder="Ketik teknologi (e.g. Three.js)..."
                            className="flex-1 px-3 py-1.5 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                          <button
                            type="button"
                            onClick={handleAddTech}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white border border-white/10"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: META (IDENTITAS & COVER & PUBLISH) */}
                  {activeInspectorTab === 'meta' && (
                    <div className="p-5 rounded-3xl bg-surface-overlay border border-white/10 space-y-4 shadow-xl">
                      <div className="border-b border-white/10 pb-3">
                        <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#4d8bff]" />
                          <span>Identitas &amp; Pengaturan Proyek</span>
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Informasi metadata, relasi klien, cover media, dan status publikasi.
                        </p>
                      </div>

                      {/* Judul & Slug */}
                      <div>
                        <label htmlFor={`${fieldId}-pf7`} className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Judul Portofolio
                        </label>
                        <input id={`${fieldId}-pf7`}
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="Judul proyek studi kasus..."
                          className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                        />
                      </div>

                      <div>
                        <label htmlFor={`${fieldId}-pf8`} className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Slug URL Publik
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-neutral-500">/portfolio/</span>
                          <input id={`${fieldId}-pf8`}
                            type="text"
                            value={formSlug}
                            onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                            placeholder="slug-proyek"
                            className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>
                      </div>

                      {/* Client & Year */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor={`${fieldId}-pf9`} className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                            Klien / Mitra
                          </label>
                          <input id={`${fieldId}-pf9`}
                            type="text"
                            value={formClient}
                            onChange={(e) => setFormClient(e.target.value)}
                            placeholder="Nama Klien Korporat..."
                            className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>
                        <div>
                          <label htmlFor={`${fieldId}-pf10`} className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                            Tahun
                          </label>
                          <input id={`${fieldId}-pf10`}
                            type="number"
                            value={formYear}
                            onChange={(e) => setFormYear(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>
                      </div>

                      {/* Kategori */}
                      <div>
                        <label htmlFor={`${fieldId}-pf11`} className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Kategori Industri
                        </label>
                        <select id={`${fieldId}-pf11`}
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#4d8bff]"
                        >
                          {availableCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cover Image & Alt Text Control */}
                      <div className="space-y-3 p-3 rounded-2xl bg-black/40 border border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-accent-400" />
                            <span>Cover / Media Hero</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setMediaPickerOpen(true)}
                              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-white flex items-center gap-1 transition-colors"
                            >
                              <Layers className="w-3 h-3 text-info" />
                              <span>Galeri Media</span>
                            </button>
                            <label className="cursor-pointer px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-white flex items-center gap-1 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-[#4d8bff]">
                              <Upload className="w-3 h-3 text-emerald-400" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        </div>

                        {formHeroImage && (
                          <div className="relative h-28 w-full rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
                            <Image
                              src={formHeroImage}
                              alt={formHeroAlt || 'Cover preview'}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setMediaPickerOpen(true)}
                                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] text-white flex items-center gap-1 backdrop-blur-sm"
                              >
                                <Layers className="w-3 h-3" />
                                <span>Ganti Gambar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCoverAltModal(true)}
                                className="px-2.5 py-1 rounded-lg bg-[#4d8bff]/20 hover:bg-[#4d8bff]/30 text-[10px] text-[#4d8bff] flex items-center gap-1 backdrop-blur-sm"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>Edit Alt Text</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            aria-label="URL gambar cover"
                            type="text"
                            value={formHeroImage}
                            onChange={(e) => setFormHeroImage(e.target.value)}
                            placeholder="/images/spatium/web/..."
                            className="w-full px-3 py-2 text-xs font-mono bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                          />
                        </div>

                        {/* Dedicated Alt Text Input (Required for Publication Gate) */}
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <label htmlFor={`${fieldId}-cover-alt`} className="text-[11px] font-mono text-neutral-300 font-semibold">
                                Alt Text [ID]
                              </label>
                              {formHeroAlt.trim() && formHeroAlt.trim().length <= 125 && !/^(gambar|foto|image of|photo of|picture of)\b/i.test(formHeroAlt.trim()) ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Siap Publikasi</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  <span>Wajib Diisi</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button aria-label="Buka Pop-up Editor Alt Text"
                                type="button"
                                onClick={() => setShowCoverAltModal(true)}
                                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10"
                                title="Buka Pop-up Editor Alt Text"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              id={`${fieldId}-cover-alt`}
                              type="text"
                              value={formHeroAlt}
                              onChange={(e) => setFormHeroAlt(e.target.value)}
                              placeholder="Deskripsi visual untuk pembaca layar & Google Images..."
                              className="w-full px-3 py-2 text-xs bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff] pr-14"
                            />
                            <span
                              className={`absolute right-2.5 top-2 text-[10px] font-mono ${
                                formHeroAlt.length > 125
                                  ? 'text-red-400 font-bold'
                                  : formHeroAlt.length >= 10
                                  ? 'text-emerald-400'
                                  : 'text-neutral-500'
                              }`}
                            >
                              {formHeroAlt.length}/125
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500">
                            Wajib diisi agar Gerbang Publikasi terbuka. Maksimal 125 karakter.
                          </p>
                        </div>
                      </div>

                      {/* Pop-up Modal Perbaikan Alt Text & Media Cover */}
                      <EditorDialog
                        open={showCoverAltModal}
                        onClose={() => setShowCoverAltModal(false)}
                        size="lg"
                        icon={<ImageIcon className="h-4 w-4 text-[#4d8bff]" />}
                        title="Kelola Cover & Alt Text Portofolio"
                        description="Hubungkan gambar cover dan pastikan Alt Text valid untuk gerbang publikasi."
                        footer={
                          <button type="button" onClick={() => setShowCoverAltModal(false)} className={dialogButton.primary}>
                            Selesai
                          </button>
                        }
                      >
                        <div className="space-y-4 text-left">
                            {/* Cover Preview & Galeri Button */}
                            <div className="space-y-2">
                              <div className="relative h-36 w-full rounded-xl overflow-hidden border border-white/10 bg-black/50">
                                {formHeroImage ? (
                                  <Image
                                    src={formHeroImage}
                                    alt={formHeroAlt || 'Preview'}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-xs text-neutral-500">
                                    Belum ada gambar terpilih
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // The media picker is not a top-layer dialog: close this one first.
                                    setShowCoverAltModal(false)
                                    setMediaPickerOpen(true)
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5"
                                >
                                  <Layers className="w-3.5 h-3.5 text-info" />
                                  <span>Buka Galeri Media</span>
                                </button>
                                <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[200px]">
                                  {formHeroImage}
                                </span>
                              </div>
                            </div>

                            {/* Alt Text Input */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label htmlFor={`${fieldId}-pf12`} className="text-xs font-mono font-semibold text-neutral-300">
                                  Alt Text [ID] (Maks. 125 Karakter)
                                </label>
                                <span
                                  className={`text-[10px] font-mono ${
                                    formHeroAlt.trim().length > 125
                                      ? 'text-red-400 font-bold'
                                      : formHeroAlt.trim().length >= 10
                                      ? 'text-emerald-400'
                                      : 'text-neutral-500'
                                  }`}
                                >
                                  {formHeroAlt.trim().length} / 125 kar
                                </span>
                              </div>
                              <textarea id={`${fieldId}-pf12`}
                                value={formHeroAlt}
                                onChange={(e) => setFormHeroAlt(e.target.value)}
                                rows={3}
                                placeholder="Tuliskan deskripsi visual representasi cover untuk screen reader dan SEO..."
                                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-[#4d8bff]"
                              />
                            </div>

                            {/* Preset Pills */}
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                `${formTitle || 'Portofolio'} - Pemindaian Ruang SPATIUM`,
                                `Tampilan arsitektur sistem dan antarmuka ${formTitle || 'proyek'}`,
                                `Solusi digital terintegrasi ${formCategory || 'Teknologi'}: ${formTitle || 'Karya'}`,
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormHeroAlt(preset.slice(0, 120))}
                                  className="text-left px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neutral-300 line-clamp-1 transition-colors"
                                >
                                  + {preset.slice(0, 45)}...
                                </button>
                              ))}
                            </div>

                        </div>
                      </EditorDialog>

                      {/* Live Demo URL */}
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Tautan 3D Gaussian Splatting / Tur Spasial (Live URL)
                        </label>
                        <input
                          type="text"
                          value={formLiveUrl}
                          onChange={(e) => setFormLiveUrl(e.target.value)}
                          placeholder="https://superspl.at/s?id=... atau /tours/nama-proyek/index.html"
                          className="w-full px-3 py-2 text-xs font-mono bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
                        />
                      </div>

                      {/* Status & Featured */}
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        <div>
                          <label htmlFor={`${fieldId}-pf13`} className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                            Status Publikasi
                          </label>
                          <select id={`${fieldId}-pf13`}
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as 'draft' | 'in_review' | 'approved' | 'published' | 'archived')}
                            className="w-full px-3 py-2 text-xs font-mono bg-[var(--studio-bg)] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#4d8bff]"
                          >
                            <option value="draft">Draft (Draf Internal)</option>
                            <option value="in_review">In Review (Sedang Direview)</option>
                            <option value="approved">Approved (Disetujui)</option>
                            <option value="published">Published (Publik Aktif)</option>
                            <option value="archived">Archived (Diarsipkan)</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={formFeatured}
                            onChange={(e) => setFormFeatured(e.target.checked)}
                            className="w-4 h-4 rounded text-[#4d8bff] focus:ring-0 bg-black/40 border-white/20"
                          />
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              Jadikan Karya Unggulan (Featured)
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                              Tampilkan di barisan teratas landing page dan portofolio grid utama.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SEO INSPECTOR V4 */}
                  {activeInspectorTab === 'seo' && (
                    <div className="p-5 rounded-3xl bg-surface-overlay border border-white/10 space-y-4 shadow-xl">
                      <StudioSeoInspector
                        locale={seoLocale}
                        onChangeLocale={setSeoLocale}
                        translationGroupId=""
                        onChangeTranslationGroupId={() => {}}
                        isCornerstone={false}
                        onChangeIsCornerstone={() => {}}
                        articleTitle={formTitle}
                        articleExcerpt={formSummary}
                        content={`${formTitle} ${formSummary} ${formChallenge} ${formSolution} ${formResult}`}
                        category={formCategory}
                        slug={formSlug}
                        onChangeSlug={setFormSlug}
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
                        breadcrumbTitle={formTitle}
                        onChangeBreadcrumbTitle={() => {}}
                        schemaType="TechArticle"
                        onChangeSchemaType={() => {}}
                        robots={robots}
                        onChangeRobots={setRobots}
                        socialOg={socialOg}
                        onChangeSocialOg={setSocialOg}
                        socialTwitter={socialTwitter}
                        onChangeSocialTwitter={setSocialTwitter}
                        coverUrl={formHeroImage}
                        coverAlt={formHeroAlt}
                        onChangeCoverAlt={setFormHeroAlt}
                        onChangeCoverUrl={setFormHeroImage}
                        onOpenMediaPickerForCover={() => setMediaPickerOpen(true)}
                        existingSlugs={items.map((it) => it.slug).filter((s) => s !== formSlug)}
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
            setFormHeroImage(url)
            if (!formHeroAlt && item?.name) {
              const cleaned = item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
              setFormHeroAlt(`${formTitle || 'Portofolio'} - ${cleaned}`)
            }
            setMediaPickerOpen(false)
          }}
          currentUrl={formHeroImage}
          title="Pilih Media Cover Portofolio"
        />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 2: LIST DASHBOARD (STUDIO PORTFOLIO CATALOG)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <p role="status" className={listStatus ? 'text-xs font-mono text-neutral-300' : 'sr-only'}>
        {listStatus}
      </p>
      {/* Compact Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-surface-overlay border border-white/10 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            aria-label="Cari portofolio"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari studi kasus berdasarkan judul, nama klien, atau kategori..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-400">
            {items.length} item
          </span>

          <Tooltip label="Muat Ulang" hint="Segarkan data portofolio dari basis data">
            <button aria-label="Muat Ulang"
              type="button"
              onClick={fetchPortfolios}
              className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>

          <Tooltip label="Upload Spatial Tour (.zip / HTML)" hint="Unggah paket tur .zip / file HTML jadi atau embed SuperSplat">
            <button
              type="button"
              onClick={() => {
                setTourUploadResult(null)
                setTourUploadError('')
                setTourUploadModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium text-xs font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Tour (.zip)</span>
            </button>
          </Tooltip>

          <Tooltip label="Tambah Portofolio" hint="Buat studi kasus atau entri portofolio baru">
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4d8bff] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            aria-label="Cari portofolio"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari studi kasus berdasarkan judul, nama klien, atau kategori..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-overlay border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#4d8bff]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-[#4d8bff] text-[#191919] font-bold'
                : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
            }`}
          >
            Semua ({items.length})
          </button>
          {availableCategories.map((cat) => {
            const count = items.filter((it) => it.category === cat).length
            if (count === 0) return null
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                  selectedCategoryFilter === cat
                    ? 'bg-[#4d8bff] text-[#191919] font-bold'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid of Portfolios */}
      {loading ? (
        <div className="p-16 text-center text-xs text-neutral-400 font-mono flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#4d8bff]" />
          <span>Memuat data portofolio dari basis data...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-surface-overlay border border-dashed border-white/10 space-y-3">
          <Briefcase className="w-8 h-8 text-neutral-500 mx-auto" />
          <p className="text-xs text-neutral-400 font-mono">
            Tidak ada portofolio yang cocok dengan filter atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            let blockCount = 0
            if (item.blocks) {
              try {
                const b = typeof item.blocks === 'string' ? JSON.parse(item.blocks) : item.blocks
                if (Array.isArray(b)) blockCount = b.length
              } catch (err) { console.warn("[observable error]:", err) }
            }

            return (
              <div
                key={item.slug}
                className="p-5 rounded-3xl bg-surface-overlay border border-white/10 hover:border-[#4d8bff]/40 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3">
                  {/* Hero Media Thumbnail */}
                  <div className="relative h-44 w-full rounded-2xl bg-black/60 overflow-hidden border border-white/5">
                    {item.heroImage ? (
                      <Image
                        src={item.heroImage}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#060A17] via-[#0F3A79]/40 to-[#060A17] p-4 flex flex-col justify-between relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute inset-0 bg-[radial-gradient(#4d8bff18_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#4d8bff]/15 text-[#4d8bff] border border-[#4d8bff]/30 uppercase tracking-wider">
                            SPATIUM
                          </span>
                          <span className="text-[9px] font-mono text-info-300/80">
                            16:9 DCI
                          </span>
                        </div>
                        <div className="relative z-10 text-center my-auto py-2">
                          <div className="w-11 h-11 rounded-2xl bg-[#4d8bff]/10 border border-[#4d8bff]/30 mx-auto flex items-center justify-center text-[#4d8bff] font-syne font-bold text-sm mb-1.5 shadow-[0_0_15px_rgba(77,139,255,0.2)] group-hover:scale-110 transition-transform">
                            ▶
                          </div>
                          <p className="text-[11px] font-syne font-bold text-white/90 truncate max-w-[200px] mx-auto">
                            {item.title}
                          </p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-neutral-400 border-t border-white/5 pt-1.5">
                          <span>WALKTHROUGH</span>
                          <span className="text-[#4d8bff] font-semibold">3D SPLAT</span>
                        </div>
                      </div>
                    )}
                    {item.featured && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-500/90 text-amber-950 font-bold text-[9px] font-mono shadow-sm">
                        Featured
                      </span>
                    )}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-mono border border-white/10">
                      {item.year || '—'}
                    </span>
                  </div>

                  {/* Metadata Header */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
                      <span className="text-[#4d8bff] font-semibold uppercase truncate max-w-[160px]">
                        {item.client || 'Mitra Korporat'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium text-[10px] border border-emerald-500/20 uppercase">
                        {item.status || 'published'}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-white group-hover:text-[#4d8bff] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.summary || 'Studi kasus digital twin dari tim SPATIUM.'}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-white/5 truncate max-w-[140px]">
                        /portfolio/{item.slug}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5">
                        {blockCount > 0 ? `${blockCount} Blok Visual` : 'Standar Narasi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <a
                    href={`${siteConfig.url}/portfolio/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white inline-flex items-center gap-1.5 text-xs font-mono transition-colors"
                  >
                    <span>Lihat</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditItem(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#4d8bff] hover:text-[#6fb0ff] font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Studi Kasus &amp; Blok</span>
                    </button>
                    <button aria-label="Hapus Portofolio"
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Portofolio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tour Upload Modal */}
      <EditorDialog
        open={tourUploadModalOpen}
        onClose={() => setTourUploadModalOpen(false)}
        dismissible={!tourUploading}
        size="lg"
        icon={<Upload className="h-4 w-4 text-cyan-400" />}
        title="Unggah Paket Tur Spasial / 3DGS"
        description="Ekspor .zip (HTML + folder aset), berkas .html, atau embed SuperSplat. Hasil unggahan tersimpan sebagai draft."
      >
            {/* Error & Success Alerts */}
            {tourUploadError && (
              <div role="alert" className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{tourUploadError}</span>
              </div>
            )}

            {tourUploadResult && (
              <div role="status" className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tur spasial tersimpan</span>
                </div>
                <p className="text-neutral-300 mb-3">{tourUploadResult.message}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {tourUploadResult.liveUrl && (
                    <a
                      href={tourUploadResult.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white font-mono hover:bg-white/15 transition-colors"
                    >
                      <span>Lihat Tur Langsung</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Upload Form */}
            <form onSubmit={handleTourUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${fieldId}-pf14`} className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Judul Proyek Spasial *
                  </label>
                  <input id={`${fieldId}-pf14`}
                    type="text"
                    required
                    value={tourUploadTitle}
                    onChange={(e) => setTourUploadTitle(e.target.value)}
                    placeholder="Contoh: Villa Oceanview Canggu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label htmlFor={`${fieldId}-pf15`} className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Nama Klien / Brand
                  </label>
                  <input id={`${fieldId}-pf15`}
                    type="text"
                    value={tourUploadClient}
                    onChange={(e) => setTourUploadClient(e.target.value)}
                    placeholder="Contoh: Canggu Luxury Estate"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${fieldId}-pf16`} className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Sektor / Kategori
                  </label>
                  <select id={`${fieldId}-pf16`}
                    value={tourUploadCategory}
                    onChange={(e) => setTourUploadCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070F1E] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Marketing & Branding">Marketing & Branding</option>
                    <option value="Hospitality & Wisata">Hospitality & Wisata</option>
                    <option value="Healthcare & Medis">Healthcare & Medis</option>
                    <option value="Industrial & Manufaktur">Industrial & Manufaktur</option>
                    <option value="Agrikultur & Riset">Agrikultur & Riset</option>
                    <option value="Properti & Arsitektur">Properti & Arsitektur</option>
                    <option value="Memori & Dokumenter">Memori & Dokumenter</option>
                    <option value="Filmmaking & VFX">Filmmaking & VFX</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`${fieldId}-pf17`} className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Custom Slug (Opsional)
                  </label>
                  <input id={`${fieldId}-pf17`}
                    type="text"
                    value={tourUploadSlug}
                    onChange={(e) => setTourUploadSlug(e.target.value)}
                    placeholder="villa-oceanview-canggu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* File Input Box */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border-2 border-dashed border-white/15 hover:border-cyan-400/50 transition-colors">
                <label className="block text-center cursor-pointer rounded-xl focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-400">
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <span className="text-xs font-mono text-white block font-semibold mb-1">
                    {tourUploadFile ? tourUploadFile.name : 'Pilih Berkas .zip Paket Tur atau .html Mandiri'}
                  </span>
                  <span className="text-[11px] text-neutral-400 block font-mono">
                    Maksimal 250MB · Otomatis diekstrak ke folder /public/tours/
                  </span>
                  <input
                    type="file"
                    accept=".zip,.html,.htm"
                    onChange={(e) => setTourUploadFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Or Direct Embed SuperSplat / External URL */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <span className="text-xs font-mono uppercase tracking-wider text-[#4d8bff] font-semibold block mb-2">
                  Atau Gunakan SuperSplat ID / URL Eksternal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`${fieldId}-pf18`} className="block text-[11px] font-mono text-neutral-400 mb-1">
                      SuperSplat ID (8 karakter)
                    </label>
                    <input id={`${fieldId}-pf18`}
                      type="text"
                      value={tourUploadSplatId}
                      onChange={(e) => setTourUploadSplatId(e.target.value)}
                      placeholder="e318925e"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#4d8bff]"
                    />
                  </div>

                  <div>
                    <label htmlFor={`${fieldId}-tour-url`} className="block text-[11px] font-mono text-neutral-400 mb-1">
                      URL Lengkap (3DVista / Custom WebGL)
                    </label>
                    <input
                      id={`${fieldId}-tour-url`}
                      type="url"
                      value={tourUploadExternalUrl}
                      onChange={(e) => setTourUploadExternalUrl(e.target.value)}
                      placeholder="https://superspl.at/s?id=..."
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#4d8bff]"
                    />
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${fieldId}-pf19`} className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Kerapatan Partikel (Point Count)
                  </label>
                  <input id={`${fieldId}-pf19`}
                    type="text"
                    value={tourUploadPointCount}
                    onChange={(e) => setTourUploadPointCount(e.target.value)}
                    placeholder="15.1M Splats"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label htmlFor={`${fieldId}-pf20`} className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Akurasi Geometri
                  </label>
                  <input id={`${fieldId}-pf20`}
                    type="text"
                    value={tourUploadAccuracy}
                    onChange={(e) => setTourUploadAccuracy(e.target.value)}
                    placeholder="Sub-centimeter (5mm)"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTourUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-mono transition-colors"
                >
                  Tutup
                </button>

                <button
                  type="submit"
                  disabled={tourUploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-lg"
                >
                  {tourUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengekstrak Berkas...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ekstrak &amp; Simpan Draft</span>
                    </>
                  )}
                </button>
              </div>
            </form>
      </EditorDialog>
    </div>
  )
}
