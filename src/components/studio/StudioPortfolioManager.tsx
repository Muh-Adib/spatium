'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import StudioBlockProperties from './StudioBlockProperties'
import StudioSeoInspector from './StudioSeoInspector'
import MediaPickerModal from './MediaPickerModal'
import { StudioAiSidebar } from './StudioAiSidebar'
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
  const heroTitle = title || 'Cinematic Motion & 3D Animation Showcase'
  const heroDesc = summary || 'Eksplorasi visual imersif, animasi 3D fidelitas tinggi, dan narasi sinematik yang memukau audiens global bersama UNIMASI.'
  return [
    {
      id: `hero-${Date.now()}-1`,
      type: 'hero-cinema',
      title: heroTitle,
      headline: heroTitle,
      highlightWord: 'Cinematic Motion',
      badge: 'UNIMASI ANIMATION STUDIO',
      client: client || 'Mitra Industri Kreatif',
      description: heroDesc,
      subheadline: heroDesc,
      showreelUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      data: {
        badge: 'UNIMASI ANIMATION STUDIO',
        headline: heroTitle,
        subheadline: heroDesc,
        primaryCta: { label: 'Lihat Showreel', href: '#showreel' },
        secondaryCta: { label: 'Konsultasi Proyek', href: '/kontak' },
      },
      metrics: [
        { label: 'Resolusi Master', value: '4K DCI' },
        { label: 'Total Views / Reach', value: '2.4M+' },
        { label: 'Audience Retention', value: '89.4%' },
      ],
    },
    {
      id: `timeline-${Date.now()}-2`,
      type: 'process-timeline',
      title: 'Alur Produksi Animasi & Craft Visual',
      subtitle: 'Metodologi 4-fase terpadu UNIMASI dari sketsa ide hingga mastering warna standar bioskop.',
      steps: [
        {
          step: '01',
          title: 'Konseptual & Storyboard Visual',
          description: 'Eksplorasi naskah naratif, character design, dan penataan storyboard sinematik frame-by-frame.',
        },
        {
          step: '02',
          title: 'Modeling 3D & Rigging Kompleks',
          description: 'Pembangunan aset geometri presisi tinggi, simulasi kain, rambut, dan sistem rigging anatomis.',
        },
        {
          step: '03',
          title: 'Lighting Sinematik & Multi-Pass Render',
          description: 'Pencahayaan dramatik dengan global illumination dan kalkulasi fotorealistis berkecepatan tinggi.',
        },
        {
          step: '04',
          title: 'Sound Design Spasial & Color Grading',
          description: 'Mastering grading warna standar DCI-P3 dan orkestrasi audio atmosferik yang menggugah emosi.',
        },
      ],
      data: {
        title: 'Alur Produksi Animasi & Craft Visual',
        description: 'Metodologi 4-fase terpadu UNIMASI dari sketsa ide hingga mastering warna standar bioskop.',
        steps: [
          { stepNumber: '01', title: 'Konseptual & Storyboard Visual', summary: 'Eksplorasi naskah naratif, character design, dan penataan storyboard sinematik frame-by-frame.' },
          { stepNumber: '02', title: 'Modeling 3D & Rigging Kompleks', summary: 'Pembangunan aset geometri presisi tinggi, simulasi kain, rambut, dan sistem rigging anatomis.' },
          { stepNumber: '03', title: 'Lighting Sinematik & Multi-Pass Render', summary: 'Pencahayaan dramatik dengan global illumination dan kalkulasi fotorealistis berkecepatan tinggi.' },
          { stepNumber: '04', title: 'Sound Design Spasial & Color Grading', summary: 'Mastering grading warna standar DCI-P3 dan orkestrasi audio atmosferik yang menggugah emosi.' },
        ],
      },
    },
    {
      id: `stats-${Date.now()}-3`,
      type: 'stats-ticker',
      title: 'Metrik Dampak Visual & Engagement Audiens',
      items: [
        { label: 'Frame Dirender', value: '140,000+' },
        { label: 'Tingkat Retensi Rata-rata', value: '89.4%' },
        { label: 'Penghargaan & Seleksi', value: '12 Nominasi' },
        { label: 'Engagement Rate Sosial', value: '18.7%' },
      ],
      data: {
        title: 'Metrik Dampak Visual & Engagement Audiens',
        metrics: [
          { label: 'Frame Dirender', value: '140,000+' },
          { label: 'Tingkat Retensi Rata-rata', value: '89.4%' },
          { label: 'Penghargaan & Seleksi', value: '12 Nominasi' },
          { label: 'Engagement Rate Sosial', value: '18.7%' },
        ],
      },
    },
    {
      id: `quote-${Date.now()}-4`,
      type: 'executive-quote-card',
      quote: client
        ? `UNIMASI berhasil mentransformasi visi dan narasi kompleks ${client} menjadi mahakarya animasi visual yang memukau jutaan pemirsa.`
        : 'Standar animasi sinematik dan kedalaman estetika UNIMASI mendefinisikan ulang cara brand kami berkomunikasi secara emosional dengan audiens global.',
      author: client ? `Creative Lead, ${client}` : 'Head of Creative Strategy',
      role: 'Creative Partner',
    },
    {
      id: `cta-${Date.now()}-5`,
      type: 'interactive-cta',
      title: 'Wujudkan Proyek Animasi & Motion Visual Anda',
      description: 'Diskusikan produksi animasi komersial, kampanye brand 3D, atau eksplorasi CGI imersif langsung bersama sutradara visual UNIMASI.',
      buttonText: 'Mulai Proyek Animasi',
      data: {
        headline: 'Wujudkan Proyek Animasi & Motion Visual Anda',
        body: 'Diskusikan produksi animasi komersial, kampanye brand 3D, atau eksplorasi CGI imersif langsung bersama sutradara visual UNIMASI.',
        primaryCta: { label: 'Mulai Proyek Animasi', href: '/kontak' },
      },
    },
  ]
}

export function StudioPortfolioManager() {
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
  const [viewMode, setViewMode] = useState<StudioViewMode>('canvas')
  const [aiOpen, setAiOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeInspectorTab, setActiveInspectorTab] = useState<'story' | 'meta' | 'seo'>('story')

  // Form State
  const [formId, setFormId] = useState<number | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formClient, setFormClient] = useState('')
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString())
  const [formCategory, setFormCategory] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formHeroImage, setFormHeroImage] = useState('/images/portfolio/website-pmb-umby.png')
  const [formHeroAlt, setFormHeroAlt] = useState('')
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [showCoverAltModal, setShowCoverAltModal] = useState(false)
  const [formLiveUrl, setFormLiveUrl] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formStatus, setFormStatus] = useState<'draft' | 'in_review' | 'approved' | 'published' | 'archived'>('published')

  // Narrative Story Form State
  const [formChallenge, setFormChallenge] = useState('')
  const [formApproach, setFormApproach] = useState('')
  const [formSolution, setFormSolution] = useState('')
  const [formProcess, setFormProcess] = useState('')
  const [formResult, setFormResult] = useState('')
  const [formMetrics, setFormMetrics] = useState<Array<{ label: string; value: string; detail?: string }>>([
    { label: 'Peningkatan Efisiensi', value: '3.4x', detail: 'Otomatisasi alur kerja operasional' },
    { label: 'Ketersediaan Sistem', value: '99.98%', detail: 'Zero-downtime architecture' },
  ])
  const [formTechnologies, setFormTechnologies] = useState<string[]>([
    'Next.js 16',
    'React 19',
    'TypeScript',
    'Tailwind CSS',
    'SQLite / Drizzle',
  ])
  const [newTechInput, setNewTechInput] = useState('')

  // Visual Blocks Array
  const [formBlocks, setFormBlocks] = useState<StudioBlock[]>([])

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

  // Create New Portfolio
  const handleAddNew = () => {
    setFormId(null)
    setFormTitle('Studi Kasus Digital Inovatif')
    const initialSlug = `studi-kasus-${Date.now().toString().slice(-4)}`
    setFormSlug(initialSlug)
    setFormClient('Mitra Industri Korporat')
    setFormYear(new Date().getFullYear().toString())
    setFormCategory(availableCategories[0] || 'Immersive Software & Edutainment')
    setFormSummary('Pengembangan sistem digital mutakhir dengan standar arsitektur modern dan performa tinggi.')
    setFormHeroImage('/images/portfolio/website-pmb-umby.png')
    setFormHeroAlt('Studi Kasus Digital Inovatif - Rekayasa Sistem Digital UNIMASI')
    setFormLiveUrl('https://unimasi.com')
    setFormFeatured(false)
    setFormStatus('published')
    setFormChallenge('Sistem warisan konvensional membatasi skalabilitas dan memperlambat waktu respon layanan kepada pengguna.')
    setFormApproach('Merancang ulang seluruh alur arsitektur dengan pendekatan modular decoupled dan edge caching.')
    setFormSolution('Mengimplementasikan Next.js 16 berkecepatan tinggi dengan integrasi basis data tertanam responsif.')
    setFormProcess('Discovery, UX Research, Architecture Design, Agile Sprint, Zero-Downtime Migration.')
    setFormResult('Meningkatkan keterlibatan pengguna sebesar 240% dan memangkas waktu proses hingga 68%.')
    setFormMetrics([
      { label: 'Peningkatan Efisiensi', value: '3.4x', detail: 'Otomatisasi alur kerja' },
      { label: 'Ketersediaan Sistem', value: '99.98%', detail: 'Zero-downtime architecture' },
      { label: 'Kecepatan Muat', value: '< 1.1s', detail: 'Core Web Vitals Optimal' },
    ])
    setFormTechnologies(['Next.js 16', 'TypeScript', 'Tailwind CSS', 'SQLite / Drizzle'])

    // Initialize Default Visual Blocks
    const defaultBlocks = generateDefaultPortfolioBlocks(
      'Studi Kasus Digital Inovatif',
      'Mitra Industri Korporat',
      'Pengembangan sistem digital mutakhir dengan standar arsitektur modern dan performa tinggi.',
      '/images/portfolio/website-pmb-umby.png'
    )
    setFormBlocks(defaultBlocks)

    // Reset SEO
    setSeoTitle('Studi Kasus Digital Inovatif — Portofolio UNIMASI')
    setMetaDesc('Pelajari bagaimana UNIMASI membantu mitra industri merekayasa sistem digital berkinerja tinggi.')
    setFocusKeyphrase('rekayasa digital studi kasus')
    setRelatedKeyphrases(['portofolio teknologi informasi', 'pengembangan web skalabel'])
    setCanonicalUrl(`https://unimasi.com/portofolio/${initialSlug}`)

    setSelectedBlockId(defaultBlocks[0]?.id || null)
    setShowPropertiesDrawer(true)
    setSaveMessage('')
    setErrorMessage('')
    setEditorMode(true)
  }

  // Open Edit Mode for Existing Item
  const handleEditItem = (item: any) => {
    setFormId(item.id || null)
    setFormTitle(item.title || '')
    setFormSlug(item.slug || '')
    setFormClient(item.client || '')
    setFormYear((item.year || new Date().getFullYear()).toString())
    setFormCategory(item.category || availableCategories[0] || 'Immersive Software & Edutainment')
    setFormSummary(item.summary || '')
    setFormHeroImage(item.heroImage || '/images/portfolio/website-pmb-umby.png')
    let extractedAlt = ''
    if (item.seoData) {
      try {
        const parsed = typeof item.seoData === 'string' ? JSON.parse(item.seoData) : item.seoData
        extractedAlt = parsed.coverAlt || parsed.ogImageAlt || ''
      } catch {}
    }
    if (!extractedAlt && item.title) {
      extractedAlt = `${item.title} - UNIMASI Portofolio`
    }
    setFormHeroAlt(extractedAlt)
    setFormLiveUrl(item.liveUrl || '')
    setFormFeatured(Boolean(item.featured))
    setFormStatus(item.status || 'published')

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
      } catch {
        parsedMetrics = []
      }
    }
    setFormMetrics(Array.isArray(parsedMetrics) && parsedMetrics.length > 0 ? parsedMetrics : [
      { label: 'Peningkatan Efisiensi', value: '3.4x', detail: 'Otomatisasi alur kerja' },
      { label: 'Ketersediaan Sistem', value: '99.98%', detail: 'Zero-downtime architecture' },
    ])

    // Parse Technologies
    let parsedTech: any[] = []
    if (item.technologies) {
      try {
        parsedTech = typeof item.technologies === 'string' ? JSON.parse(item.technologies) : item.technologies
      } catch {
        parsedTech = []
      }
    }
    setFormTechnologies(
      Array.isArray(parsedTech) && parsedTech.length > 0
        ? parsedTech.map((t) => (typeof t === 'string' ? t : t.name || 'Tech'))
        : ['Next.js 16', 'TypeScript', 'Tailwind CSS']
    )

    // Parse Blocks
    let parsedBlocks: StudioBlock[] = []
    if (item.blocks) {
      try {
        parsedBlocks = typeof item.blocks === 'string' ? JSON.parse(item.blocks) : item.blocks
      } catch {
        parsedBlocks = []
      }
    }

    if (!Array.isArray(parsedBlocks) || parsedBlocks.length === 0) {
      parsedBlocks = generateDefaultPortfolioBlocks(
        item.title,
        item.client || '',
        item.summary || '',
        item.heroImage || '/images/portfolio/website-pmb-umby.png'
      )
    }
    setFormBlocks(parsedBlocks)

    // SEO Data
    setSeoTitle(item.metaTitle || `${item.title} — Studi Kasus UNIMASI`)
    setMetaDesc(item.metaDescription || item.summary || '')
    setFocusKeyphrase(item.focusKeyphrase || '')
    let parsedRelated: string[] = []
    if (item.relatedKeyphrases) {
      try {
        parsedRelated = typeof item.relatedKeyphrases === 'string' ? JSON.parse(item.relatedKeyphrases) : item.relatedKeyphrases
      } catch {
        parsedRelated = []
      }
    }
    setRelatedKeyphrases(Array.isArray(parsedRelated) ? parsedRelated : [])
    setCanonicalUrl(`https://unimasi.com/portofolio/${item.slug}`)

    setSelectedBlockId(parsedBlocks[0]?.id || null)
    setShowPropertiesDrawer(true)
    setSaveMessage('')
    setErrorMessage('')
    setEditorMode(true)
  }

  // Delete Portfolio
  const handleDeleteItem = async (slug: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus portofolio "${title}"?`)) return
    try {
      const res = await fetch(`/api/portfolio?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        alert('Portofolio berhasil dihapus.')
        fetchPortfolios()
      } else {
        alert(json.error || 'Gagal menghapus portofolio.')
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menghapus.')
    }
  }

  // Save Portfolio Handler
  const handleSavePortfolio = async () => {
    if (!formTitle.trim() || !formSlug.trim()) {
      alert('Judul dan slug portofolio wajib diisi.')
      return
    }

    setSaving(true)
    setSaveMessage('')
    setErrorMessage('')

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim(),
      client: formClient.trim() || null,
      year: parseInt(formYear, 10) || new Date().getFullYear(),
      category: formCategory,
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
        setSaveMessage('Portofolio & blok visual berhasil disimpan!')
        fetchPortfolios()
        setTimeout(() => setSaveMessage(''), 3500)
      } else {
        setErrorMessage(data.error || 'Gagal menyimpan portofolio.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  // Selected Block Manipulation
  const currentSelectedBlock = formBlocks.find((b) => b.id === selectedBlockId)

  const handleUpdateSelectedBlock = (updatedFields: Partial<StudioBlock> | any) => {
    if (!selectedBlockId) return
    setFormBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBlockId) return b
        return {
          ...b,
          ...updatedFields,
          ...(b.data ? { data: { ...b.data, ...updatedFields } } : {}),
        }
      })
    )
  }

  const handleDuplicateSelectedBlock = () => {
    if (!selectedBlockId) return
    const idx = formBlocks.findIndex((b) => b.id === selectedBlockId)
    if (idx === -1) return
    const blockToCopy = formBlocks[idx]
    const duplicatedBlock: StudioBlock = {
      ...JSON.parse(JSON.stringify(blockToCopy)),
      id: `${blockToCopy.type}-${Date.now()}`,
    }
    const nextBlocks = [...formBlocks]
    nextBlocks.splice(idx + 1, 0, duplicatedBlock)
    setFormBlocks(nextBlocks)
    setSelectedBlockId(duplicatedBlock.id)
  }

  const handleDeleteSelectedBlock = () => {
    if (!selectedBlockId) return
    setFormBlocks((prev) => prev.filter((b) => b.id !== selectedBlockId))
    setSelectedBlockId(null)
  }

  const handleMoveBlock = (direction: 'up' | 'down') => {
    if (!selectedBlockId) return
    const idx = formBlocks.findIndex((b) => b.id === selectedBlockId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === formBlocks.length - 1) return

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    const nextBlocks = [...formBlocks]
    const temp = nextBlocks[idx]
    nextBlocks[idx] = nextBlocks[targetIdx]
    nextBlocks[targetIdx] = temp
    setFormBlocks(nextBlocks)
  }

  // Metric helpers
  const handleAddMetric = () => {
    setFormMetrics([...formMetrics, { label: 'Metrik Baru', value: '100%', detail: 'Deskripsi singkat' }])
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
      } else {
        alert(data.error || 'Gagal mengunggah gambar.')
      }
    } catch {
      alert('Terjadi kesalahan saat mengunggah gambar.')
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
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#0D0D0D] text-white antialiased selection:bg-[#FFD600] selection:text-black">
        {/* Top Dedicated Studio Master Header */}
        <header className="h-14 shrink-0 px-4 sm:px-6 bg-[#161616] border-b border-white/[0.08] flex items-center justify-between gap-3 z-30 select-none overflow-hidden flex-nowrap">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 max-w-[45%] md:max-w-[50%] overflow-hidden flex-nowrap whitespace-nowrap">
            <Tooltip label="Kembali" hint="Kembali ke daftar portofolio" side="bottom">
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
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden flex-nowrap whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFD600]/15 border border-[#FFD600]/30 text-[#FFD600] uppercase tracking-wider shrink-0">
                <Briefcase className="w-3 h-3 text-[#FFD600]" />
                <span className="hidden sm:inline">PORTOFOLIO</span>
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
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  viewMode === 'canvas'
                    ? 'bg-white/20 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <PenSquare className="w-3.5 h-3.5 text-[#FFD600]" />
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
            {/* Link to live public page */}
            {formSlug && (
              <Tooltip label="Lihat Publik" hint="Buka halaman publik di tab baru" side="bottom">
                <a
                  href={`${siteConfig.url}/portofolio/${formSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Publik</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500" />
                </a>
              </Tooltip>
            )}

            {/* AI Copilot Drawer Toggle */}
            <Tooltip label="AI Copilot" hint="Asisten AI penyusun blok & copy kontekstual" side="bottom">
              <button
                type="button"
                onClick={() => setAiOpen(!aiOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  aiOpen
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:border-purple-500/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
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
                      ? 'bg-[#FFD600]/20 border-[#FFD600]/50 text-[#FFD600]'
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
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </span>
            )}

            {errorMessage && (
              <span className="text-xs font-mono text-rose-400 flex items-center gap-1.5 hidden md:inline-flex">
                {errorMessage}
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
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#FFD600] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#FFE855] transition-all shadow-[0_0_15px_rgba(255, 214, 0,0.25)] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </Tooltip>
          </div>
        </header>

        {/* Dedicated Fullscreen Workspace: Left Visual Editor • Right Contextual Inspector */}
        <div className="relative flex-1 min-h-0 w-full flex overflow-hidden">
          {/* 1. MAIN PANEL: WYSIWYG Live Visual Editor */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
            <StudioVisualEditor
              blocks={formBlocks}
              onChangeBlocks={setFormBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={(id) => {
                setSelectedBlockId(id)
                if (id) setShowPropertiesDrawer(true)
              }}
              targetType="portfolio"
              contextData={{ portfolios: items }}
              title={formTitle}
              slug={formSlug}
              onToggleInspector={() => setShowPropertiesDrawer(!showPropertiesDrawer)}
              isInspectorOpen={showPropertiesDrawer}
              onValidationChange={handleBlockValidation}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* 2. DOCKED RIGHT PANEL: Contextual Inspector (Block Properties / Story / Meta / SEO) */}
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
                    allPortfolios={items.map((it) => ({
                      id: it.id || 0,
                      slug: it.slug,
                      title: it.title,
                      client: it.client,
                      heroImage: it.heroImage,
                    }))}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tab Switcher: Story vs Meta vs SEO */}
                  <div className="flex rounded-2xl bg-[#1e1e1e] p-1 border border-white/10 shadow-md">
                    <button
                      type="button"
                      onClick={() => setActiveInspectorTab('story')}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-xl transition-all ${
                        activeInspectorTab === 'story'
                          ? 'bg-[#FFD600] text-[#191919] shadow font-bold'
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
                          ? 'bg-[#FFD600] text-[#191919] shadow font-bold'
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
                          ? 'bg-[#FFD600] text-[#191919] shadow font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      SEO & SERP
                    </button>
                  </div>

                  {/* TAB 1: STORY (4 PILAR STUDI KASUS + METRICS + TECH) */}
                  {activeInspectorTab === 'story' && (
                    <div className="p-5 rounded-3xl bg-[#1e1e1e] border border-white/10 space-y-4 shadow-xl">
                      <div className="border-b border-white/10 pb-3">
                        <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#FFD600]" />
                          <span>Narasi Struktur Studi Kasus</span>
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Format narasi 4 pilar standar Dogstudio/editorial yang menyatu dengan data publik.
                        </p>
                      </div>

                      {/* Executive Summary */}
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Ringkasan Eksekutif (Summary)
                        </label>
                        <textarea
                          rows={3}
                          value={formSummary}
                          onChange={(e) => setFormSummary(e.target.value)}
                          placeholder="Ringkasan dampak bisnis dan inovasi teknologi studi kasus ini..."
                          className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                        />
                      </div>

                      {/* 4 Story Pillars */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div>
                          <label className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            1. Tantangan Bisnis &amp; Teknis (Challenge)
                          </label>
                          <textarea
                            rows={3}
                            value={formChallenge}
                            onChange={(e) => setFormChallenge(e.target.value)}
                            placeholder="Apa masalah utama yang dihadapi klien sebelum proyek dimulai?"
                            className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            2. Pendekatan Rekayasa (Approach)
                          </label>
                          <textarea
                            rows={3}
                            value={formApproach}
                            onChange={(e) => setFormApproach(e.target.value)}
                            placeholder="Metodologi, riset teknis, dan arsitektur yang dipilih..."
                            className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            3. Solusi &amp; Implementasi (Solution)
                          </label>
                          <textarea
                            rows={3}
                            value={formSolution}
                            onChange={(e) => setFormSolution(e.target.value)}
                            placeholder="Detail fitur, modul interaktif, dan sistem yang dibangun..."
                            className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-neutral-300 font-semibold mb-1">
                            4. Hasil &amp; Dampak Bisnis (Results)
                          </label>
                          <textarea
                            rows={3}
                            value={formResult}
                            onChange={(e) => setFormResult(e.target.value)}
                            placeholder="Hasil konversi, peningkatan performa, atau umpan balik pengguna..."
                            className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>
                      </div>

                      {/* Key Metrics Editor */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Metrik Kunci (Key Results)</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleAddMetric}
                            className="text-[10px] font-mono text-[#FFD600] hover:underline flex items-center gap-1"
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
                                  type="text"
                                  value={met.value}
                                  onChange={(e) => handleUpdateMetric(i, 'value', e.target.value)}
                                  placeholder="Nilai (e.g. 3.4x)"
                                  className="w-24 px-2 py-1 text-xs font-mono font-bold text-emerald-400 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#FFD600]"
                                />
                                <input
                                  type="text"
                                  value={met.label}
                                  onChange={(e) => handleUpdateMetric(i, 'label', e.target.value)}
                                  placeholder="Label metrik"
                                  className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FFD600]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMetric(i)}
                                  className="p-1 text-neutral-500 hover:text-rose-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
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
                          <Cpu className="w-3.5 h-3.5 text-sky-400" />
                          <span>Stack Teknologi</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {formTechnologies.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white"
                            >
                              <span>{tech}</span>
                              <button
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
                            className="flex-1 px-3 py-1.5 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
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
                    <div className="p-5 rounded-3xl bg-[#1e1e1e] border border-white/10 space-y-4 shadow-xl">
                      <div className="border-b border-white/10 pb-3">
                        <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#FFD600]" />
                          <span>Identitas &amp; Pengaturan Proyek</span>
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Informasi metadata, relasi klien, cover media, dan status publikasi.
                        </p>
                      </div>

                      {/* Judul & Slug */}
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Judul Portofolio
                        </label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="Judul proyek studi kasus..."
                          className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Slug URL Publik
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-neutral-500">/portofolio/</span>
                          <input
                            type="text"
                            value={formSlug}
                            onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                            placeholder="slug-proyek"
                            className="flex-1 px-3 py-2 text-xs font-mono bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>
                      </div>

                      {/* Client & Year */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                            Klien / Mitra
                          </label>
                          <input
                            type="text"
                            value={formClient}
                            onChange={(e) => setFormClient(e.target.value)}
                            placeholder="Nama Klien Korporat..."
                            className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                            Tahun
                          </label>
                          <input
                            type="number"
                            value={formYear}
                            onChange={(e) => setFormYear(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono bg-[#141414] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>
                      </div>

                      {/* Kategori */}
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Kategori Industri
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FFD600]"
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
                              <Layers className="w-3 h-3 text-sky-400" />
                              <span>Galeri Media</span>
                            </button>
                            <label className="cursor-pointer px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-white flex items-center gap-1 transition-colors">
                              <Upload className="w-3 h-3 text-emerald-400" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
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
                                className="px-2.5 py-1 rounded-lg bg-[#FFD600]/20 hover:bg-[#FFD600]/30 text-[10px] text-[#FFD600] flex items-center gap-1 backdrop-blur-sm"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>Edit Alt Text</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={formHeroImage}
                            onChange={(e) => setFormHeroImage(e.target.value)}
                            placeholder="/images/portfolio/..."
                            className="w-full px-3 py-2 text-xs font-mono bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                          />
                        </div>

                        {/* Dedicated Alt Text Input (Required for Publication Gate) */}
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono text-neutral-300 font-semibold">
                                Alt Text [ID]
                              </span>
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
                              <button
                                type="button"
                                onClick={() => {
                                  const auto = `${formTitle || 'Portofolio'} - Solusi Rekayasa Digital UNIMASI`.slice(0, 120)
                                  setFormHeroAlt(auto)
                                }}
                                className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-0.5"
                                title="Generate Alt Text dengan AI"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>AI</span>
                              </button>
                              <button
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
                              type="text"
                              value={formHeroAlt}
                              onChange={(e) => setFormHeroAlt(e.target.value)}
                              placeholder="Deskripsi visual untuk pembaca layar & Google Images..."
                              className="w-full px-3 py-2 text-xs bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600] pr-14"
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
                      {showCoverAltModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                          <div className="w-full max-w-lg rounded-2xl bg-[#141414] border border-white/15 shadow-2xl p-5 space-y-4 text-left">
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600]">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-semibold text-white">Kelola Cover & Alt Text Portofolio</h3>
                                  <p className="text-[11px] text-neutral-400">Hubungkan gambar cover dan pastikan Alt Text valid untuk gerbang publikasi.</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowCoverAltModal(false)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

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
                                    setMediaPickerOpen(true)
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5"
                                >
                                  <Layers className="w-3.5 h-3.5 text-sky-400" />
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
                                <label className="text-xs font-mono font-semibold text-neutral-300">
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
                              <textarea
                                value={formHeroAlt}
                                onChange={(e) => setFormHeroAlt(e.target.value)}
                                rows={3}
                                placeholder="Tuliskan deskripsi visual representasi cover untuk screen reader dan SEO..."
                                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-[#FFD600]"
                              />
                            </div>

                            {/* Preset Pills */}
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                `${formTitle || 'Portofolio'} - Implementasi Sistem Digital UNIMASI`,
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

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                              <button
                                type="button"
                                onClick={() => setShowCoverAltModal(false)}
                                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
                              >
                                Selesai
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Live Demo URL */}
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                          Tautan Proyek Live / Demo
                        </label>
                        <input
                          type="url"
                          value={formLiveUrl}
                          onChange={(e) => setFormLiveUrl(e.target.value)}
                          placeholder="https://client-demo.com"
                          className="w-full px-3 py-2 text-xs font-mono bg-[#141414] border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
                        />
                      </div>

                      {/* Status & Featured */}
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        <div>
                          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                            Status Publikasi
                          </label>
                          <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs font-mono bg-[#141414] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FFD600]"
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
                            className="w-4 h-4 rounded text-[#FFD600] focus:ring-0 bg-black/40 border-white/20"
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
                    <div className="p-5 rounded-3xl bg-[#1e1e1e] border border-white/10 space-y-4 shadow-xl">
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

        {/* Studio AI Copilot Drawer */}
        {aiOpen && (
          <StudioAiSidebar
            isOpen={aiOpen}
            onClose={() => setAiOpen(false)}
            variant="drawer"
            pageContext={{
              title: formTitle,
              slug: formSlug,
              status: formStatus,
              category: formCategory,
            }}
          />
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER 2: LIST DASHBOARD (STUDIO PORTFOLIO CATALOG)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Compact Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari studi kasus berdasarkan judul, nama klien, atau kategori..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-400">
            {items.length} item
          </span>

          <Tooltip label="Muat Ulang" hint="Segarkan data portofolio dari basis data">
            <button
              type="button"
              onClick={fetchPortfolios}
              className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>

          <Tooltip label="Tambah Portofolio" hint="Buat studi kasus atau entri portofolio baru">
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFD600] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#FFE855] transition-all shadow-sm"
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari studi kasus berdasarkan judul, nama klien, atau kategori..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#1e1e1e] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFD600]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-[#FFD600] text-[#191919] font-bold'
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
                    ? 'bg-[#FFD600] text-[#191919] font-bold'
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
          <RefreshCw className="w-4 h-4 animate-spin text-[#FFD600]" />
          <span>Memuat data portofolio dari basis data SQLite...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#1e1e1e] border border-dashed border-white/10 space-y-3">
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
              } catch {}
            }

            return (
              <div
                key={item.slug}
                className="p-5 rounded-3xl bg-[#1e1e1e] border border-white/10 hover:border-[#FFD600]/40 transition-all flex flex-col justify-between group shadow-xl"
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
                        <div className="absolute inset-0 bg-[radial-gradient(#FFD60018_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/30 uppercase tracking-wider">
                            UNIMASI MOTION
                          </span>
                          <span className="text-[9px] font-mono text-sky-300/80">
                            16:9 DCI
                          </span>
                        </div>
                        <div className="relative z-10 text-center my-auto py-2">
                          <div className="w-11 h-11 rounded-2xl bg-[#FFD600]/10 border border-[#FFD600]/30 mx-auto flex items-center justify-center text-[#FFD600] font-syne font-bold text-sm mb-1.5 shadow-[0_0_15px_rgba(255,214,0,0.2)] group-hover:scale-110 transition-transform">
                            ▶
                          </div>
                          <p className="text-[11px] font-syne font-bold text-white/90 truncate max-w-[200px] mx-auto">
                            {item.title}
                          </p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-neutral-400 border-t border-white/5 pt-1.5">
                          <span>SHOWREEL</span>
                          <span className="text-[#FFD600] font-semibold">4K RENDER</span>
                        </div>
                      </div>
                    )}
                    {item.featured && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-500/90 text-amber-950 font-bold text-[9px] font-mono shadow-sm">
                        Featured
                      </span>
                    )}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-mono border border-white/10">
                      {item.year || 2026}
                    </span>
                  </div>

                  {/* Metadata Header */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
                      <span className="text-[#FFD600] font-semibold uppercase truncate max-w-[160px]">
                        {item.client || 'Mitra Korporat'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium text-[10px] border border-emerald-500/20 uppercase">
                        {item.status || 'published'}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-white group-hover:text-[#FFD600] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.summary || 'Studi kasus inovasi rekayasa digital dari tim UNIMASI.'}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-white/5 truncate max-w-[140px]">
                        /portofolio/{item.slug}
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
                    href={`${siteConfig.url}/portofolio/${item.slug}`}
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
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#FFD600] hover:text-[#FFE855] font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Studi Kasus &amp; Blok</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.slug, item.title)}
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
    </div>
  )
}
