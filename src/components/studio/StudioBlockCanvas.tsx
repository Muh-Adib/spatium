import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
  Type,
  Heading2 as H2Icon,
  Heading3 as H3Icon,
  Image as ImageIcon,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  MessageSquare,
  FolderKanban,
  Save,
  Check,
  X,
  Zap,
  Sliders,
  ShieldCheck,
  BarChart3,
  Database,
  Terminal,
  ExternalLink,
  ArrowUpRight,
  Eye,
} from 'lucide-react'

export interface StudioBlock {
  id: string
  type: string
  [key: string]: any
}

interface StudioBlockCanvasProps {
  blocks: StudioBlock[]
  onChangeBlocks: (newBlocks: StudioBlock[]) => void
  targetType?: 'department' | 'service' | 'portfolio' | 'solution' | 'article'
  allPortfolios?: Array<{ id: number; slug: string; title: string; client?: string; heroImage?: any }>
  selectedBlockId?: string | null
  onSelectBlock?: (id: string | null) => void
}

/**
 * Auto-resizing Textarea (Swiss Minimalist / Notion canvas standard)
 * Grows and shrinks dynamically with no jumpy internal scrollbars.
 */
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  minHeight = 36,
  ...props
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  [key: string]: any
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.max(minHeight, el.scrollHeight)
    el.style.height = `${newHeight}px`
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        adjustHeight()
      }}
      placeholder={placeholder}
      className={`resize-none overflow-hidden transition-colors ${className}`}
      style={{ minHeight }}
      {...props}
    />
  )
}

export function blocksToPlainText(blocks: StudioBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks
    .map((b) => {
      if (b.type === 'paragraph' || b.type === 'heading2' || b.type === 'heading3') {
        return b.text || ''
      }
      if (b.type === 'hero-department' || b.type === 'hero-service') {
        return `${b.title || b.name || ''}. ${b.description || ''}`
      }
      if (b.type === 'feature-bento-grid') {
        return `${b.title || ''}. ${(b.features || []).map((f: any) => `${f.title}: ${f.description || ''}`).join('. ')}`
      }
      if (b.type === 'engineering-pillars') {
        return `${b.title || ''}. ${(b.pillars || []).map((p: any) => `${p.title}: ${p.description || ''}`).join('. ')}`
      }
      if (b.type === 'workflow-phases') {
        return `${b.title || ''}. ${(b.phases || []).map((p: any) => `${p.title}: ${p.description || ''}`).join('. ')}`
      }
      if (b.type === 'faq-accordion') {
        return (b.faqs || []).map((f: any) => `${f.question} ${f.answer}`).join('. ')
      }
      if (b.type === 'executive-quote-card') {
        return `${b.quote || ''} — ${b.author || ''}`
      }
      if (b.type === 'comparison-matrix') {
        return `${b.title || ''}. ${(b.rows || []).map((r: any) => `${r.feature}: UNIMASI (${r.segia}) vs Traditional (${r.traditional})`).join('. ')}`
      }
      if (b.type === 'architecture-blueprint') {
        return `${b.title || ''}. ${(b.layers || []).map((l: any) => `${l.level} ${l.title}: ${l.desc} (${l.tech})`).join('. ')}`
      }
      if (b.type === 'department-service-list') {
        return `${b.title || ''}. ${b.description || ''}`
      }
      if (b.type === 'visual-showcase-gallery') {
        return `${b.title || ''}. ${(b.items || []).map((i: any) => `${i.title}: ${i.category} - ${i.desc}`).join('. ')}`
      }
      if (b.type === 'client-stats-impact') {
        return `${b.title || ''}. ${(b.stats || []).map((s: any) => `${s.label}: ${s.value} (${s.detail})`).join('. ')}`
      }
      if (b.type === 'deliverables-checklist') {
        return `${b.title || ''}. ${(b.items || []).map((i: any) => `${i.title}: ${i.desc}`).join('. ')}`
      }
      if (b.type === 'interactive-tech-matrix') {
        return `${b.title || ''}. ${(b.categories || []).map((c: any) => `${c.name}: ${(c.items || []).join(', ')}`).join('. ')}`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export default function StudioBlockCanvas({
  blocks,
  onChangeBlocks,
  targetType = 'service',
  allPortfolios = [],
  selectedBlockId,
  onSelectBlock,
}: StudioBlockCanvasProps) {
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null)

  // Fetch templates when modal opens
  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch(`/api/templates?targetType=${targetType}`)
      const json = await res.json()
      if (json.success && json.data) {
        setSavedTemplates(json.data)
      }
    } catch {}
    setLoadingTemplates(false)
  }

  const handleOpenTemplates = () => {
    setTemplateModalOpen(true)
    fetchTemplates()
  }

  const handleApplyTemplate = (tplBlocks: StudioBlock[]) => {
    if (confirm('Terapkan template ini? Susunan blok saat ini akan digantikan.')) {
      const cloned = tplBlocks.map((b, i) => ({
        ...b,
        id: `blk-${Date.now()}-${i}`,
      }))
      onChangeBlocks(cloned)
      setTemplateModalOpen(false)
      if (onSelectBlock && cloned[0]) {
        onSelectBlock(cloned[0].id)
      }
    }
  }

  const handleSaveCurrentAsTemplate = async () => {
    if (!newTemplateName.trim()) return
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          targetType,
          description: `Custom template dengan ${blocks.length} blok`,
          blocks,
        }),
      })
      const json = await res.json()
      if (json.success) {
        alert('Template berhasil disimpan ke library!')
        setSaveTemplateModalOpen(false)
        setNewTemplateName('')
      }
    } catch {
      alert('Gagal menyimpan template.')
    }
  }

  // Block manipulations
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= blocks.length) return
    const updated = [...blocks]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    onChangeBlocks(updated)
  }

  const deleteBlock = (index: number) => {
    if (confirm('Hapus blok ini?')) {
      const targetId = blocks[index]?.id
      const updated = blocks.filter((_, i) => i !== index)
      onChangeBlocks(updated)
      if (selectedBlockId === targetId && onSelectBlock) {
        onSelectBlock(null)
      }
    }
  }

  const duplicateBlock = (index: number) => {
    const target = blocks[index]
    const cloned = {
      ...JSON.parse(JSON.stringify(target)),
      id: `blk-${Date.now()}`,
    }
    const updated = [...blocks]
    updated.splice(index + 1, 0, cloned)
    onChangeBlocks(updated)
    if (onSelectBlock) {
      onSelectBlock(cloned.id)
    }
  }

  const updateBlockField = (index: number, field: string, value: any) => {
    const updated = [...blocks]
    updated[index] = { ...updated[index], [field]: value }
    onChangeBlocks(updated)
  }

  const addBlockAt = (index: number, type: string) => {
    const newBlock: StudioBlock = {
      id: `blk-${Date.now()}`,
      type,
    }

    if (type === 'paragraph') newBlock.text = 'Tulis paragraf naratif di sini...'
    if (type === 'heading2') newBlock.text = 'Subjudul H2 Baru'
    if (type === 'heading3') newBlock.text = 'Subjudul H3 Baru'
    if (type === 'feature-bento-grid') {
      newBlock.title = 'Fitur & Standar Arsitektur'
      newBlock.description = 'Deskripsi ruang lingkup dan kapabilitas...'
      newBlock.features = [
        { title: 'Fitur Utama 01', description: 'Uraian keunggulan teknis...' },
        { title: 'Fitur Utama 02', description: 'Uraian keunggulan teknis...' },
      ]
    }
    if (type === 'tech-stack-chips') {
      newBlock.title = 'Teknologi & Standar Industri'
      newBlock.technologies = ['Next.js 16', 'TypeScript', 'Docker', 'SQLite']
    }
    if (type === 'executive-quote-card') {
      newBlock.quote = 'Komitmen kualitas rekayasa tanpa kompromi performa.'
      newBlock.author = 'Nama Pimpinan'
      newBlock.role = 'Role'
      newBlock.company = 'UNIMASI'
    }
    if (type === 'engineering-pillars') {
      newBlock.title = '3 Pilar Rekayasa Kami'
      newBlock.description = 'Standar arsitektur sistematis'
      newBlock.pillars = [
        { title: 'Modern Architecture', description: 'Edge deployment & SSR' },
        { title: 'Zero Technical Debt', description: 'TypeScript strict mode' },
        { title: 'High Availability', description: 'Uptime 99.9%' },
      ]
    }
    if (type === 'workflow-phases') {
      newBlock.title = 'Metodologi Eksekusi'
      newBlock.description = 'Alur kerja terstruktur sejak hari pertama'
      newBlock.phases = [
        { step: '01', title: 'Architectural Discovery', description: 'Scoping & arsitektur' },
        { step: '02', title: 'Design Tokens', description: 'Figma & UI prototype' },
        { step: '03', title: 'Agile Engineering', description: 'Sprint dua mingguan' },
        { step: '04', title: 'QA & Deployment', description: 'Audit CWV & rilis' },
      ]
    }
    if (type === 'faq-accordion') {
      newBlock.title = 'Pertanyaan Umum'
      newBlock.faqs = [
        { question: 'Berapa lama estimasi pengerjaan proyek?', answer: 'Rata-rata 2 hingga 8 minggu kerja.' },
      ]
    }
    if (type === 'studio-cta') {
      newBlock.title = 'Mulai Proyek Anda Bersama Kami'
      newBlock.description = 'Diskusikan arsitektur dan kebutuhan spesifik sistem Anda.'
      newBlock.buttonText = 'Konsultasi Sekarang'
      newBlock.buttonUrl = 'https://wa.me/6285227702811'
    }
    if (type === 'portfolio-proof-grid') {
      newBlock.title = 'Bukti Kinerja Nyata & Studi Kasus'
      newBlock.portfolioIds = allPortfolios.slice(0, 2).map((p) => p.id)
      newBlock.portfolios = allPortfolios.slice(0, 2)
    }
    if (type === 'comparison-matrix') {
      newBlock.title = 'Standar Rekayasa UNIMASI vs Konvensional'
      newBlock.description = 'Komparasi parameter teknis dan jaminan kualitas arsitektur sistem kami'
      newBlock.rows = [
        {
          feature: 'Arsitektur Rendering & Framework',
          segia: 'Next.js 16 App Router (RSC + Turbopack)',
          traditional: 'Legacy SPA / Monolitik Tanpa Edge',
        },
        {
          feature: 'Database Architecture & Security',
          segia: 'PostgreSQL & Prisma 8 ORM (Type-Safe)',
          traditional: 'Eksternal Network Roundtrip (> 80ms)',
        },
        {
          feature: 'Type Safety & Code Quality',
          segia: 'Strict TypeScript & Schema Validation',
          traditional: 'Dynamic JS tanpa validasi schema',
        },
        {
          feature: 'Skor Core Web Vitals & Kecepatan',
          segia: 'Optimasi Core Web Vitals & Performa Tinggi',
          traditional: 'Lambat, skor 40-60',
        },
        {
          feature: 'Kepemilikan Kode & Source Repository',
          segia: 'Full Ownership Tanpa Lock-in',
          traditional: 'Lisensi sewa bulanan / proprietary lock',
        },
      ]
    }
    if (type === 'architecture-blueprint') {
      newBlock.title = 'Spesifikasi Arsitektur Sistem 4-Layer'
      newBlock.title = '4 Jaminan Kualitas untuk Pertumbuhan Bisnis Anda'
      newBlock.description = 'Standar mutu pengerjaan untuk memastikan sistem bisnis Anda cepat, aman, dan mudah dikelola'
      newBlock.image = '/images/portfolio/website-smk-pb-soedirman-2.png'
      newBlock.imageLabel = 'Karya Nyata Klien: Portal Edukasi & Informasi'
      newBlock.imageBadge = 'Hasil Produksi Aktif'
      newBlock.hudTitle = 'Kecepatan Akses Nyata'
      newBlock.hudMetric = 'Waktu Muat < 1 Detik'
      newBlock.hudDesc = 'Pengunjung langsung masuk tanpa menunggu loading'
      newBlock.layers = [
        {
          level: 'Pilar 01',
          title: 'Kecepatan Akses Maksimal (< 1 Detik)',
          badge: 'Tingkatkan Konversi',
          desc: '53% calon konsumen menutup website jika loading lebih dari 3 detik. Kami memastikan website Anda langsung terbuka dalam hitungan milidetik.',
          tech: 'Pengunjung nyaman, waktu tinggal lebih lama, dan peluang penjualan meningkat.',
        },
        {
          level: 'Pilar 02',
          title: 'Desain Eksklusif & Ramah Pengguna',
          badge: 'Citra Kredibel',
          desc: 'Antarmuka dirancang khusus sesuai identitas brand Anda, nyaman dilihat di smartphone, tablet, maupun laptop.',
          tech: 'Navigasi intuitif, tipografi elegan, dan interaksi yang menyenangkan.',
        },
        {
          level: 'Pilar 03',
          title: 'Pengelolaan Mandiri yang Sangat Mudah',
          badge: 'Praktis & Mandiri',
          desc: 'Dashboard administrasi intuitif berbahasa Indonesia. Tim Anda dapat memperbarui berita, produk, dan portofolio dalam hitungan detik tanpa perlu menguasai koding.',
          tech: 'Editor visual simpel, manajemen media cepat, dan bebas biaya tambahan tiap update.',
        },
        {
          level: 'Pilar 04',
          title: '100% Hak Milik & Keamanan Terjamin',
          badge: 'Bebas Lock-in',
          desc: 'Seluruh kode sumber, aset desain, dan data diserahkan seutuhnya kepada Anda. Dilengkapi proteksi keamanan data dan garansi purna jual.',
          tech: 'Aset digital seutuhnya milik perusahaan Anda, tanpa biaya sewa tersembunyi.',
        },
      ]
    }
    if (type === 'department-service-list') {
      newBlock.title = 'Layanan Pembuatan Website & Aplikasi yang Kami Sediakan'
      newBlock.description = 'Pilihan solusi digital terpadu untuk kebutuhan perkembangan bisnis Anda'
    }
    if (type === 'visual-showcase-gallery') {
      newBlock.title = 'Bukti Hasil Pengerjaan Nyata untuk Klien Kami'
      newBlock.description = 'Lihat bagaimana sistem yang kami bangun telah aktif digunakan dan membantu kemajuan operasional klien'
      newBlock.badge = 'Bukti Portofolio Nyata'
      newBlock.items = [
        {
          title: 'Portal PMB Universitas Mercu Buana Yogyakarta',
          category: 'Sektor Pendidikan Tinggi',
          image: '/images/portfolio/website-pmb-umby.png',
          metric: 'Ribuan Pendaftar',
          desc: 'Sistem pendaftaran online berkecepatan tinggi yang menangani ribuan calon mahasiswa baru tanpa kendala server down.',
        },
        {
          title: 'Platform Digital SMK PB Soedirman 2 Jakarta',
          category: 'Institusi Pendidikan',
          image: '/images/portfolio/website-smk-pb-soedirman-2.png',
          metric: 'Responsif Ponsel',
          desc: 'Website profil sekolah interaktif yang memudahkan orang tua dan calon murid menjelajahi program keahlian dan info akademik.',
        },
        {
          title: 'Katalog Properti Eksklusif Kalasan Valley',
          category: 'Properti & Real Estate',
          image: '/images/portfolio/website-kalasan-valley.webp',
          metric: 'Leads WhatsApp',
          desc: 'Katalog hunian visual beresolusi tinggi dengan formulir pendaftaran leads instan yang langsung terhubung ke tim penjualan.',
        },
      ]
    }
    if (type === 'client-stats-impact') {
      newBlock.title = 'Keuntungan Nyata untuk Perkembangan Bisnis Anda'
      newBlock.description = 'Setiap sistem yang kami bangun difokuskan untuk memecahkan masalah operasional dan mempercepat pertumbuhan organisasi Anda'
      newBlock.stats = [
        { value: '99.9%', label: 'Uptime & Keandalan', detail: 'Sistem tetap stabil saat pengunjung membeludak' },
        { value: '< 1 Detik', label: 'Waktu Buka Halaman', detail: 'Pengunjung tidak kabur menunggu loading' },
        { value: '100%', label: 'Hak Milik Kode & Aset', detail: 'Bebas biaya sewa bulanan software' },
        { value: '90 Hari', label: 'Garansi Bug-Free', detail: 'Jaminan purna jual & pendampingan tim' },
      ]
    }
    if (type === 'deliverables-checklist') {
      newBlock.title = 'Ruang Lingkup Serah Terima & Garansi Organisasi'
      newBlock.description = 'Transparansi deliverables tanpa biaya tersembunyi sejak hari pertama'
      newBlock.items = [
        {
          title: 'Full Git Source Code & Repository Transfer',
          desc: '100% kepemilikan kode sumber diserahkan ke akun GitHub/GitLab organisasi Anda.',
        },
        {
          title: 'Containerized Production Docker Stack',
          desc: 'Docker compose multi-stage build yang ringan, teruji, dan siap dijalankan.',
        },
        {
          title: 'OpenAPI & Type-Safe Architecture Documentation',
          desc: 'Dokumentasi komprehensif struktur API, schema database, dan manual setup.',
        },
        {
          title: 'Garansi 90 Hari Bug-Free & Core Web Vitals',
          desc: 'Jaminan pemeliharaan purna jual dan optimasi performa aktif pasca serah terima.',
        },
      ]
    }
    if (type === 'interactive-tech-matrix') {
      newBlock.title = 'Matriks Standar Teknologi UNIMASI'
      newBlock.description = 'Teknologi modern yang dipilih dengan pertimbangan skalabilitas jangka panjang'
      newBlock.categories = [
        {
          name: 'Frontend & Presentation',
          items: ['Next.js 16 (App Router)', 'React 19', 'Tailwind CSS', 'GSAP Motion', 'Turbopack'],
          badge: 'Core UI',
        },
        {
          name: 'Backend, API & Persistence',
          items: ['TypeScript Strict', 'Embedded SQLite', 'Drizzle ORM', 'Zod Schema Validation'],
          badge: 'Data Layer',
        },
        {
          name: 'Security & Edge Routing',
          items: ['proxy.ts Route Guard', 'CSRF Protection', 'Session RBAC', 'Sanitized Headers'],
          badge: 'Zero-Trust',
        },
        {
          name: 'DevOps & Infrastructure',
          items: ['Docker Multi-stage', 'Coolify Edge Proxy', 'GitHub Actions CI/CD', 'Automated Backup'],
          badge: 'Self-Hosted',
        },
      ]
    }

    const updated = [...blocks]
    updated.splice(index, 0, newBlock)
    onChangeBlocks(updated)
    setInsertAtIndex(null)
    if (onSelectBlock) {
      onSelectBlock(newBlock.id)
    }
  }

  // HTML5 Drag-and-drop
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
  }

  const handleDrop = (targetIdx: number) => {
    if (draggedIndex === null || draggedIndex === targetIdx) return
    const updated = [...blocks]
    const item = updated.splice(draggedIndex, 1)[0]
    updated.splice(targetIdx, 0, item)
    onChangeBlocks(updated)
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Template Library & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-400">Total Blok:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FFD600]/20 text-xs font-mono font-bold text-[#FFD600]">
              {blocks.length}
            </span>
          </div>
          {selectedBlockId && (
            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
              • Blok Terpilih: <span className="text-[#FFD600]">{selectedBlockId}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenTemplates}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-200 hover:text-[#FFD600] hover:border-[#FFD600]/40 transition-colors"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-[#FFD600]" />
            <span>Pustaka Template (Elementor Presets)</span>
          </button>

          <button
            type="button"
            onClick={() => setSaveTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-200 hover:text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Preset</span>
          </button>
        </div>
      </div>

      {/* Block List Canvas */}
      {blocks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-white/10 bg-[#191919]">
          <Layers className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
          <h3 className="font-syne text-lg font-bold text-white">Belum Ada Blok Konten</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Mulai susun halaman ini dengan memilih template bawaan atau menambahkan blok pertama Anda.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenTemplates}
              className="px-4 py-2 rounded-xl bg-[#FFD600] text-[#191919] font-medium text-xs hover:bg-[#ffe855] transition-all"
            >
              Muat Template Bawaan
            </button>
            <button
              type="button"
              onClick={() => addBlockAt(0, targetType === 'department' ? 'hero-department' : 'hero-service')}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white font-medium text-xs hover:bg-white/20 transition-all"
            >
              + Tambah Hero Block
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, idx) => {
            const isSelected = selectedBlockId === block.id

            return (
              <div key={block.id || idx} className="space-y-3">
                {/* Block Card Container */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onClick={() => onSelectBlock && onSelectBlock(block.id)}
                  className={`rounded-2xl border transition-all duration-200 cursor-pointer ${
                    draggedIndex === idx
                      ? 'opacity-40 border-dashed border-[#FFD600]'
                      : isSelected
                      ? 'ring-2 ring-[#FFD600] border-[#FFD600]/60 bg-[#1c1c1c] shadow-[0_0_30px_rgba(255, 214, 0,0.18)]'
                      : 'border-white/10 bg-[#191919] hover:border-white/25 hover:bg-[#1b1b1b]'
                  }`}
                >
                  {/* Block Header (Draggable Handle & Controls) */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] rounded-t-2xl border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
                        title="Geser untuk mengatur urutan blok"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-[10px] text-[#FFD600] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#FFD600]/10 border border-[#FFD600]/20">
                        {block.type}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">#{idx + 1}</span>

                      {isSelected && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFD600]/20 border border-[#FFD600]/40 text-[10px] font-mono text-[#FFD600] font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600]" />
                          AKTIF DI INSPECTOR
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                        title="Pindahkan ke atas"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                        title="Pindahkan ke bawah"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateBlock(idx)}
                        className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10"
                        title="Duplikasi blok ini"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlock(idx)}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        title="Hapus blok"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Block Body / Inline Editor */}
                  <div className="p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
                    {/* 1. Paragraph */}
                    {block.type === 'paragraph' && (
                      <div>
                        <label htmlFor={`blk-${block.id}-p`} className="block text-xs font-mono text-neutral-400 mb-1.5">Teks Paragraf</label>
                        <AutoResizeTextarea
                          id={`blk-${block.id}-p`}
                          name="paragraphText"
                          aria-label="Teks Paragraf"
                          onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                          value={block.text || ''}
                          onChange={(val) => updateBlockField(idx, 'text', val)}
                          className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD600]"
                          placeholder="Ketik paragraf konten di sini..."
                        />
                      </div>
                    )}

                    {/* 2. Heading2 & Heading3 */}
                    {(block.type === 'heading2' || block.type === 'heading3') && (
                      <div>
                        <label htmlFor={`blk-${block.id}-h`} className="block text-xs font-mono text-neutral-400 mb-1.5">
                          {block.type === 'heading2' ? 'Subjudul H2' : 'Subjudul H3'}
                        </label>
                        <input
                          id={`blk-${block.id}-h`}
                          name="headingText"
                          aria-label={block.type === 'heading2' ? 'Subjudul H2' : 'Subjudul H3'}
                          onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                          type="text"
                          value={block.text || ''}
                          onChange={(e) => updateBlockField(idx, 'text', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white font-bold text-base focus:outline-none focus:border-[#FFD600]"
                        />
                      </div>
                    )}

                    {/* 3. Hero Department */}
                    {block.type === 'hero-department' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`blk-${block.id}-deptitle`} className="block text-xs font-mono text-neutral-400 mb-1">Judul Departemen</label>
                            <input
                              id={`blk-${block.id}-deptitle`}
                              name="departmentTitle"
                              aria-label="Judul Departemen"
                              onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                              type="text"
                              value={block.title || ''}
                              onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-semibold"
                            />
                          </div>
                          <div>
                            <label htmlFor={`blk-${block.id}-tagline`} className="block text-xs font-mono text-neutral-400 mb-1">Badge Tagline</label>
                            <input
                              id={`blk-${block.id}-tagline`}
                              name="badgeTagline"
                              aria-label="Badge Tagline"
                              onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                              type="text"
                              value={block.badge || ''}
                              onChange={(e) => updateBlockField(idx, 'badge', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor={`blk-${block.id}-depdesc`} className="block text-xs font-mono text-neutral-400 mb-1">Deskripsi Strategis</label>
                          <AutoResizeTextarea
                            id={`blk-${block.id}-depdesc`}
                            name="strategicDescription"
                            aria-label="Deskripsi Strategis"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            value={block.description || ''}
                            onChange={(val) => updateBlockField(idx, 'description', val)}
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm leading-relaxed"
                          />
                        </div>
                        {/* Compact Outcome Chips */}
                        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2 items-center">
                          <span className="text-[11px] font-mono text-neutral-400">Key Outcomes:</span>
                          {(block.keyOutcomes || []).map((m: any, mIdx: number) => (
                            <span
                              key={mIdx}
                              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#FFD600]"
                            >
                              {m.label}: <strong>{m.value}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Hero Service */}
                    {block.type === 'hero-service' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label htmlFor={`blk-${block.id}-svcname`} className="block text-xs font-mono text-neutral-400 mb-1">Nama Layanan</label>
                            <input
                              id={`blk-${block.id}-svcname`}
                              name="serviceName"
                              aria-label="Nama Layanan"
                              onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                              type="text"
                              value={block.name || block.title || ''}
                              onChange={(e) => {
                                updateBlockField(idx, 'name', e.target.value)
                                updateBlockField(idx, 'title', e.target.value)
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-semibold"
                            />
                          </div>
                          <div>
                            <label htmlFor={`blk-${block.id}-idx`} className="block text-xs font-mono text-neutral-400 mb-1">Nomor Indeks</label>
                            <input
                              id={`blk-${block.id}-idx`}
                              name="indexNumber"
                              aria-label="Nomor Indeks"
                              onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                              type="text"
                              value={block.indexNumber || block.index || ''}
                              onChange={(e) => updateBlockField(idx, 'indexNumber', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label htmlFor={`blk-${block.id}-catbadge`} className="block text-xs font-mono text-neutral-400 mb-1">Category Badge</label>
                            <input
                              id={`blk-${block.id}-catbadge`}
                              name="categoryBadge"
                              aria-label="Category Badge"
                              onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                              type="text"
                              value={block.categoryBadge || ''}
                              onChange={(e) => updateBlockField(idx, 'categoryBadge', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor={`blk-${block.id}-valprop`} className="block text-xs font-mono text-neutral-400 mb-1">Value Proposition Singkat</label>
                          <AutoResizeTextarea
                            id={`blk-${block.id}-valprop`}
                            name="valueProposition"
                            aria-label="Value Proposition Singkat"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            value={block.shortDescription || block.description || ''}
                            onChange={(val) => {
                              updateBlockField(idx, 'shortDescription', val)
                              updateBlockField(idx, 'description', val)
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm leading-relaxed"
                          />
                        </div>

                        {/* Compact Metrics Bar */}
                        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2 items-center">
                          <span className="text-[11px] font-mono text-neutral-400">Metrik Kinerja:</span>
                          {(block.metrics || []).map((m: any, mIdx: number) => (
                            <span
                              key={mIdx}
                              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#FFD600]"
                            >
                              {m.label}: <strong>{m.value}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. Feature Bento Grid */}
                    {block.type === 'feature-bento-grid' && (
                      <div className="space-y-3">
                        <input
                          id={`blk-${block.id}-bentotitle`}
                          name="bentoTitle"
                          aria-label="Judul Fitur Bento Grid"
                          onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                          type="text"
                          value={block.title || ''}
                          onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                          placeholder="Judul Fitur Bento Grid"
                          className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(block.features || []).map((f: any, fIdx: number) => (
                            <div key={fIdx} className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                              <span className="text-xs font-bold text-white block">{f.title}</span>
                              <p className="text-[11px] text-neutral-400 line-clamp-2">{f.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. Engineering Pillars */}
                    {block.type === 'engineering-pillars' && (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`blk-${block.id}-pillarstitle`} className="block text-xs font-mono text-neutral-400 mb-1">
                            Judul 3 Pilar Rekayasa
                          </label>
                          <input
                            id={`blk-${block.id}-pillarstitle`}
                            name="pillarsTitle"
                            aria-label="3 Pilar Rekayasa Kami"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="3 Pilar Rekayasa Kami"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(block.pillars || []).map((p: any, pIdx: number) => (
                            <div key={pIdx} className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                              <span className="text-xs font-bold text-[#FFD600] block">{p.title}</span>
                              <p className="text-[11px] text-neutral-400 line-clamp-2">{p.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 7. Workflow Phases */}
                    {block.type === 'workflow-phases' && (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`blk-${block.id}-workflowtitle`} className="block text-xs font-mono text-neutral-400 mb-1">
                            Judul Metodologi Proyek
                          </label>
                          <input
                            id={`blk-${block.id}-workflowtitle`}
                            name="workflowTitle"
                            aria-label="Metodologi Pelaksanaan Proyek"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Metodologi Pelaksanaan Proyek"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(block.phases || []).map((ph: any, phIdx: number) => (
                            <div key={phIdx} className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                              <span className="text-[10px] font-mono text-[#FFD600] block">FASE {ph.step || `0${phIdx + 1}`}</span>
                              <span className="text-xs font-bold text-white block truncate">{ph.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 8. Portfolio Proof Grid */}
                    {block.type === 'portfolio-proof-grid' && (
                      <div className="space-y-2">
                        <div>
                          <label htmlFor={`blk-${block.id}-prooftitle`} className="block text-xs font-mono text-neutral-400 mb-1">
                            Judul Portofolio &amp; Studi Kasus
                          </label>
                          <input
                            id={`blk-${block.id}-prooftitle`}
                            name="portfolioProofTitle"
                            aria-label="Bukti Kinerja Nyata & Studi Kasus"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Bukti Kinerja Nyata & Studi Kasus"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 items-center text-xs font-mono text-neutral-400">
                          <span>Studi Kasus Terhubung:</span>
                          {(block.portfolios || []).length > 0 ? (
                            (block.portfolios || []).map((p: any) => (
                              <span
                                key={p.id}
                                className="px-2.5 py-1 rounded-lg bg-[#FFD600]/10 border border-[#FFD600]/30 text-white"
                              >
                                {p.title}
                              </span>
                            ))
                          ) : (
                            <span className="italic text-neutral-500">Pilih dari panel kiri (Properties)</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 9. Executive Quote Card */}
                    {block.type === 'executive-quote-card' && (
                      <div className="space-y-2">
                        <div>
                          <label htmlFor={`blk-${block.id}-quote`} className="block text-xs font-mono text-neutral-400 mb-1">
                            Teks Kutipan Eksekutif
                          </label>
                          <AutoResizeTextarea
                            id={`blk-${block.id}-quote`}
                            name="quoteText"
                            aria-label="Teks ikhtisar eksekutif"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            value={block.quote || ''}
                            onChange={(val) => updateBlockField(idx, 'quote', val)}
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm italic leading-relaxed"
                            placeholder="Teks ikhtisar eksekutif..."
                          />
                        </div>
                        <div className="text-xs font-mono text-[#FFD600]">
                          — {block.author || 'Pimpinan UNIMASI'} {block.role ? `(${block.role})` : ''}
                        </div>
                      </div>
                    )}

                    {/* 10. Tech Stack Chips */}
                    {block.type === 'tech-stack-chips' && (
                      <div className="space-y-2">
                        <div>
                          <label htmlFor={`blk-${block.id}-techtitle`} className="block text-xs font-mono text-neutral-400 mb-1">
                            Judul Seksi Teknologi
                          </label>
                          <input
                            id={`blk-${block.id}-techtitle`}
                            name="techStackTitle"
                            aria-label="Teknologi & Standar Industri"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Teknologi & Standar Industri"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(block.technologies || []).map((t: any, tIdx: number) => {
                            const label = typeof t === 'string' ? t : (t?.name || t?.title || '')
                            if (!label) return null
                            return (
                              <span key={tIdx} className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-neutral-300">
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 11. FAQ Accordion */}
                    {block.type === 'faq-accordion' && (
                      <div className="space-y-2">
                        <div>
                          <label htmlFor={`blk-${block.id}-faqtitle`} className="block text-xs font-mono text-neutral-400 mb-1">
                            Judul FAQ Accordion
                          </label>
                          <input
                            id={`blk-${block.id}-faqtitle`}
                            name="faqTitle"
                            aria-label="Pertanyaan yang Sering Diajukan"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Pertanyaan yang Sering Diajukan"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="text-xs font-mono text-neutral-400">
                          {block.faqs?.length || 0} Pertanyaan &amp; Jawaban terdaftar (Edit lengkap di panel kiri)
                        </div>
                      </div>
                    )}

                    {/* 12. Studio CTA */}
                    {block.type === 'studio-cta' && (
                      <div className="space-y-2">
                        <div>
                          <label htmlFor={`blk-${block.id}-ctatitle`} className="block text-xs font-mono text-neutral-400 mb-1">
                            Headline Banner CTA
                          </label>
                          <input
                            id={`blk-${block.id}-ctatitle`}
                            name="ctaTitle"
                            aria-label="Headline Banner CTA"
                            onFocus={() => onSelectBlock && onSelectBlock(block.id)}
                            type="text"
                            value={block.title || block.headline || ''}
                            onChange={(e) => {
                              updateBlockField(idx, 'title', e.target.value)
                              updateBlockField(idx, 'headline', e.target.value)
                            }}
                            placeholder="Headline Banner CTA"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2">{block.description || block.subheadline}</p>
                      </div>
                    )}

                    {/* 13. Architecture Blueprint */}
                    {block.type === 'architecture-blueprint' && (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Blueprint Arsitektur</label>
                            <input
                              type="text"
                              value={block.title || ''}
                              onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                              placeholder="4 Jaminan Kualitas untuk Pertumbuhan Bisnis Anda"
                              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                            />
                          </div>
                          {block.image && (
                            <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0">
                              <Image src={block.image} alt={block.imageLabel || 'Showcase'} fill className="object-cover" />
                            </div>
                          )}
                        </div>

                        {/* 4 Layers preview pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {(block.layers || []).slice(0, 4).map((layer: any, lIdx: number) => (
                            <div key={lIdx} className="p-2 rounded-xl bg-[#141414] border border-white/5 space-y-0.5">
                              <span className="text-[10px] font-mono text-[#FFD600] block font-semibold">{layer.level || `Layer 0${lIdx + 1}`}</span>
                              <p className="text-xs font-semibold text-white truncate">{layer.title}</p>
                              <span className="text-[10px] text-neutral-400 block truncate">{layer.badge || 'Active'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 14. Media Showcase & Editorial Image */}
                    {(block.type === 'media-showcase' || block.type === 'editorial-image' || block.type === 'image') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-mono text-neutral-400 mb-1">Label Media Showcase</label>
                            <input
                              type="text"
                              value={block.imageLabel || block.windowTitle || block.title || ''}
                              onChange={(e) => {
                                updateBlockField(idx, 'imageLabel', e.target.value)
                                updateBlockField(idx, 'title', e.target.value)
                              }}
                              placeholder="Dokumentasi Visual Antarmuka"
                              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-semibold"
                            />
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#FFD600]/15 border border-[#FFD600]/30 text-[#FFD600] whitespace-nowrap">
                            Mode: {block.frameStyle || 'immersive'}
                          </span>
                        </div>

                        {/* Image preview strip */}
                        <div className="relative aspect-[16/9] max-h-52 w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 group">
                          {block.imageUrl || block.image || block.url ? (
                            <>
                              <Image
                                src={block.imageUrl || block.image || block.url}
                                alt={block.altText || block.imageLabel || 'Media'}
                                fill
                                className="object-cover object-top"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-mono text-neutral-300">
                                <span className="truncate">{block.caption || block.imageLabel || 'Media Aktif'}</span>
                                <span className="text-[#FFD600] shrink-0 font-semibold">{block.badge || 'Terverifikasi'}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                              <ImageIcon className="w-8 h-8 text-neutral-600 mb-1" />
                              <span className="text-xs text-neutral-400">Belum ada gambar (Pilih di panel inspektor)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 15. Visual Showcase Gallery */}
                    {block.type === 'visual-showcase-gallery' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Galeri Portofolio Nyata</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Bukti Hasil Pengerjaan Nyata untuk Klien Kami"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        {/* 3 Project item thumbnails strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {(block.items || []).slice(0, 3).map((item: any, itIdx: number) => (
                            <div key={itIdx} className="rounded-xl bg-[#141414] border border-white/10 overflow-hidden flex flex-col justify-between">
                              {item.image && (
                                <div className="relative aspect-[16/10] w-full bg-black">
                                  <Image src={item.image} alt={item.title || 'Item'} fill className="object-cover" />
                                </div>
                              )}
                              <div className="p-2.5">
                                <span className="text-[10px] font-mono text-[#FFD600] block truncate">{item.category}</span>
                                <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                                {item.metric && (
                                  <span className="text-[10px] font-mono text-emerald-400 font-semibold block mt-1">
                                    {item.metric}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 16. Comparison Matrix */}
                    {block.type === 'comparison-matrix' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Komparasi Standar</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Standar Rekayasa UNIMASI vs Konvensional"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="p-3 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/5 pb-1.5">
                            <span>Parameter Teknis</span>
                            <span className="text-[#FFD600] font-semibold">Standar UNIMASI</span>
                          </div>
                          {(block.rows || []).slice(0, 3).map((row: any, rIdx: number) => (
                            <div key={rIdx} className="flex items-center justify-between text-xs">
                              <span className="text-neutral-300 truncate max-w-[200px]">{row.feature}</span>
                              <span className="text-[#FFD600] font-mono text-[11px] truncate max-w-[200px] font-semibold">{row.segia}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 17. Client Stats Impact */}
                    {block.type === 'client-stats-impact' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Metrik Kinerja</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Keuntungan Nyata untuk Perkembangan Bisnis Anda"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(block.stats || []).map((st: any, sIdx: number) => (
                            <div key={sIdx} className="p-2.5 rounded-xl bg-[#141414] border border-white/10 text-center">
                              <span className="font-syne text-base font-bold text-[#FFD600] block">{st.value}</span>
                              <span className="text-[11px] text-neutral-300 font-medium block truncate mt-0.5">{st.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 18. Deliverables Checklist */}
                    {block.type === 'deliverables-checklist' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Checklist Serah Terima</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Ruang Lingkup Serah Terima & Garansi"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(block.items || []).slice(0, 4).map((it: any, itIdx: number) => (
                            <div key={itIdx} className="p-2.5 rounded-xl bg-[#141414] border border-white/10 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#FFD600] shrink-0 mt-0.5" />
                              <div className="truncate">
                                <p className="text-xs font-semibold text-white truncate">{it.title}</p>
                                <p className="text-[11px] text-neutral-400 truncate">{it.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 19. Department Service List */}
                    {block.type === 'department-service-list' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Katalog Sub-Layanan</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Daftar Layanan Spesialisasi"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#FFD600]" />
                          <span>{(block.services || []).length || 4} Layanan Spesialisasi Terdaftar (Konfigurasi di Panel Kiri)</span>
                        </div>
                      </div>
                    )}

                    {/* 20. Interactive Tech Matrix */}
                    {block.type === 'interactive-tech-matrix' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-mono text-neutral-400 mb-1">Judul Matriks Teknologi</label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlockField(idx, 'title', e.target.value)}
                            placeholder="Matriks Standar Teknologi UNIMASI"
                            className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/10 text-white text-sm font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(block.categories || []).map((cat: any, cIdx: number) => (
                            <div key={cIdx} className="p-2 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                              <span className="text-[10px] font-mono text-[#FFD600] font-semibold block">{cat.name}</span>
                              <div className="flex flex-wrap gap-1">
                                {(cat.items || []).slice(0, 2).map((item: any, iIdx: number) => {
                                  const label = typeof item === 'string' ? item : (item?.name || item?.title || '')
                                  if (!label) return null
                                  return (
                                    <span key={iIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-300">
                                      {label}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generic Fallback for Any Unhandled Custom Block */}
                    {![
                      'paragraph',
                      'heading2',
                      'heading3',
                      'hero-department',
                      'hero-service',
                      'feature-bento-grid',
                      'engineering-pillars',
                      'workflow-phases',
                      'portfolio-proof-grid',
                      'executive-quote-card',
                      'tech-stack-chips',
                      'faq-accordion',
                      'studio-cta',
                      'architecture-blueprint',
                      'media-showcase',
                      'editorial-image',
                      'image',
                      'visual-showcase-gallery',
                      'comparison-matrix',
                      'client-stats-impact',
                      'deliverables-checklist',
                      'department-service-list',
                      'interactive-tech-matrix',
                    ].includes(block.type) && (
                      <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-white block">{block.title || block.name || `Blok ${block.type}`}</span>
                          <span className="text-[11px] text-neutral-400 mt-0.5 block">
                            {block.description || 'Pilih blok ini untuk mengedit konfigurasi lengkap pada panel inspector.'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#FFD600] shrink-0">
                          Edit di Inspector
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Insert Button Between Blocks */}
                <div className="flex justify-center -my-1 relative z-10 group">
                  <button
                    type="button"
                    onClick={() => setInsertAtIndex(insertAtIndex === idx + 1 ? null : idx + 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1e1e] border border-white/10 text-[11px] font-mono text-neutral-400 hover:text-[#FFD600] hover:border-[#FFD600]/40 transition-all shadow-md group-hover:scale-105"
                  >
                    <Plus className="w-3 h-3 text-[#FFD600]" />
                    <span>Sisipkan Blok di Sini</span>
                  </button>
                </div>

                {/* Inserter Popover if active */}
                {insertAtIndex === idx + 1 && (
                  <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#FFD600]/40 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-[#FFD600]">Pilih Jenis Blok untuk Disisipkan:</span>
                      <button
                        type="button"
                        onClick={() => setInsertAtIndex(null)}
                        className="p-1 rounded text-neutral-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'comparison-matrix')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-[#FFD600]/30 text-left transition-all group"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#FFD600] mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-white">Standar Rekayasa</div>
                        <div className="text-[10px] text-[#FFD600]">Matrix Komparasi</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'architecture-blueprint')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-[#FFD600]/30 text-left transition-all group"
                      >
                        <Terminal className="w-4 h-4 text-[#FFD600] mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-white">4-Layer Blueprint</div>
                        <div className="text-[10px] text-[#FFD600]">Arsitektur sistem</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'client-stats-impact')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-[#FFD600]/30 text-left transition-all group"
                      >
                        <BarChart3 className="w-4 h-4 text-[#FFD600] mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-white">Metrik Dampak</div>
                        <div className="text-[10px] text-[#FFD600]">SLA & TTFB stats</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'deliverables-checklist')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-[#FFD600]/30 text-left transition-all group"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#FFD600] mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-white">Checklist Garansi</div>
                        <div className="text-[10px] text-[#FFD600]">Scope serah terima</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'department-service-list')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-[#FFD600]/30 text-left transition-all group"
                      >
                        <Layers className="w-4 h-4 text-[#FFD600] mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-white">Sub-Layanan Dept</div>
                        <div className="text-[10px] text-[#FFD600]">Grid 4 kartu visual</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'visual-showcase-gallery')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-[#FFD600]/30 text-left transition-all group"
                      >
                        <ImageIcon className="w-4 h-4 text-[#FFD600] mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-white">Galeri Visual</div>
                        <div className="text-[10px] text-[#FFD600]">Mockup antarmuka</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'interactive-tech-matrix')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all group"
                      >
                        <Database className="w-4 h-4 text-[#FFD600] mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-white">Matriks Teknologi</div>
                        <div className="text-[10px] text-neutral-400">Stack 4 kategori</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'feature-bento-grid')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">Feature Bento</div>
                        <div className="text-[10px] text-neutral-400">Grid kapabilitas</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'engineering-pillars')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <Cpu className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">3 Pilar Rekayasa</div>
                        <div className="text-[10px] text-neutral-400">Arsitektur sistem</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'workflow-phases')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">Workflow Phases</div>
                        <div className="text-[10px] text-neutral-400">4 fase metodologi</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'portfolio-proof-grid')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <FolderKanban className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">Portofolio Relasi</div>
                        <div className="text-[10px] text-neutral-400">Studi kasus nyata</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'executive-quote-card')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <Type className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">Executive Quote</div>
                        <div className="text-[10px] text-neutral-400">Kutipan strategis</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'tech-stack-chips')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <Cpu className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">Tech Stack</div>
                        <div className="text-[10px] text-neutral-400">Framework chips</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'faq-accordion')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <HelpCircle className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">FAQ Accordion</div>
                        <div className="text-[10px] text-neutral-400">Tanya jawab SEO</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlockAt(idx + 1, 'studio-cta')}
                        className="p-2.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 text-left transition-all"
                      >
                        <MessageSquare className="w-4 h-4 text-[#FFD600] mb-1" />
                        <div className="text-xs font-bold text-white">Studio CTA</div>
                        <div className="text-[10px] text-neutral-400">Banner konversi</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom Action: Add More Blocks */}
      <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-mono text-neutral-400">Tambah blok ke bagian akhir kanvas:</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'paragraph')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            + Paragraf
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'heading2')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            + Subjudul H2
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'comparison-matrix')}
            className="px-3 py-1.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 text-xs font-mono text-[#FFD600] hover:bg-[#FFD600]/20 transition-colors"
          >
            + Standar Rekayasa Matrix
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'architecture-blueprint')}
            className="px-3 py-1.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 text-xs font-mono text-[#FFD600] hover:bg-[#FFD600]/20 transition-colors"
          >
            + 4-Layer Blueprint
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'department-service-list')}
            className="px-3 py-1.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 text-xs font-mono text-[#FFD600] hover:bg-[#FFD600]/20 transition-colors"
          >
            + Sub-Layanan Dept
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'visual-showcase-gallery')}
            className="px-3 py-1.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 text-xs font-mono text-[#FFD600] hover:bg-[#FFD600]/20 transition-colors"
          >
            + Galeri Visual
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'client-stats-impact')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-[#FFD600] hover:bg-white/10 transition-colors"
          >
            + Metrik Dampak
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'deliverables-checklist')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-[#FFD600] hover:bg-white/10 transition-colors"
          >
            + Checklist Garansi
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'interactive-tech-matrix')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-[#FFD600] hover:bg-white/10 transition-colors"
          >
            + Matriks Teknologi
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'feature-bento-grid')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-[#FFD600] hover:bg-white/10 transition-colors"
          >
            + Feature Bento
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'faq-accordion')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 hover:text-[#FFD600] hover:bg-white/10 transition-colors"
          >
            + FAQ Accordion
          </button>
          <button
            type="button"
            onClick={() => addBlockAt(blocks.length, 'studio-cta')}
            className="px-3 py-1.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 text-xs font-mono text-[#FFD600] hover:bg-[#FFD600]/20 transition-colors"
          >
            + Studio CTA
          </button>
        </div>
      </div>

      {/* ─── MODAL 1: PUSTAKA TEMPLATE (ELEMENTOR PRESETS) ─────────── */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#1e1e1e] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#191919]">
              <div>
                <span className="text-[10px] font-mono text-[#FFD600] uppercase tracking-wider font-semibold">
                  Elementor-Style Preset Library
                </span>
                <h3 className="font-syne text-lg font-bold text-white">Pustaka Template Blok</h3>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-neutral-400">
                Pilih susunan blok siap pakai untuk menyusun halaman secara instan.
              </p>

              {loadingTemplates ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400 animate-pulse">
                  Memuat template dari database...
                </div>
              ) : savedTemplates.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-black/20 border border-white/5 text-xs text-neutral-400">
                  Belum ada template tersimpan. Simpan susunan blok Anda saat ini untuk menjadikannya template reusable.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {savedTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-4 rounded-2xl bg-[#141414] border border-white/10 hover:border-[#FFD600]/50 transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{tpl.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-neutral-300">
                            {tpl.blocks?.length || 0} Blok
                          </span>
                        </div>
                        {tpl.description && (
                          <p className="text-xs text-neutral-400 mt-1">{tpl.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(tpl.blocks)}
                        className="px-4 py-2 rounded-xl bg-[#FFD600] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#ffe855] transition-all shrink-0 ml-4"
                      >
                        Terapkan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SIMPAN SUSUNAN JADI TEMPLATE ────────────────── */}
      {saveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#1e1e1e] border border-white/10 shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="font-syne text-lg font-bold text-white">Simpan Sebagai Preset Template</h3>
            <p className="text-xs text-neutral-400">
              Susunan {blocks.length} blok saat ini akan disimpan ke library database agar dapat dipakai ulang di halaman lain.
            </p>
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">Nama Template</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="mis. Template Standard Departemen UNIMASI"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 rounded-xl bg-[#FFD600] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#ffe855] disabled:opacity-50"
              >
                Simpan ke Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
