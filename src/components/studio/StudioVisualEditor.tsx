'use client'

import React, { useState, useRef } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Settings,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  X,
  Search,
  LayoutTemplate,
  Boxes,
  FileText,
  HelpCircle,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Sliders,
  Check,
  ArrowUpRight,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Undo2,
  Redo2,
  History,
  Gauge,
  Zap,
  Columns,
  PenSquare,
  Save,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { parseBlocks } from '@/lib/blocks/schema'
import { auditBlocksPerformance } from '@/lib/blocks/perf-budget'
import StudioLivePreview from './StudioLivePreview'

export type StudioViewMode = 'canvas' | 'split-preview' | 'full-preview'

export interface StudioBlock {
  id: string
  type: string
  [key: string]: any
}

interface StudioVisualEditorProps {
  blocks: StudioBlock[]
  onChangeBlocks: (newBlocks: StudioBlock[]) => void
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  targetType?: 'department' | 'service' | 'portfolio' | 'solution'
  contextData?: {
    portfolios?: any[]
    subServices?: any[]
  }
  title?: string
  slug?: string
  onToggleInspector?: () => void
  isInspectorOpen?: boolean
  onValidationChange?: (isValid: boolean, issues: string[]) => void
  viewMode?: StudioViewMode
  onViewModeChange?: (mode: StudioViewMode) => void
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

interface BlockDefinition {
  type: string
  name: string
  category: 'hero' | 'services' | 'value' | 'conversion' | 'editorial'
  badge: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // 1. UNIMASI Dedicated Cinema Blocks
  {
    type: 'hero-cinema',
    name: 'Hero Cinematic Showcase',
    category: 'hero',
    badge: 'UNIMASI Cinema',
    description: 'Header hero visual besar dengan headline tegas, badge studio, dan dua tombol CTA aksi berlatar grid sinematik.',
    icon: Sparkles,
  },
  {
    type: 'process-timeline',
    name: 'Pipeline Produksi Animasi 3D',
    category: 'value',
    badge: 'UNIMASI Pipeline',
    description: 'Timeline 4 tahapan produksi: Konsep & Storyboard, 3D Modeling & Rigging, Animasi & Simulasi Fisika, hingga Lighting & Render 4K.',
    icon: ShieldCheck,
  },
  {
    type: 'stats-ticker',
    name: 'Ticker Metrik Produksi Studio',
    category: 'value',
    badge: 'UNIMASI Stats',
    description: 'Metrik jam komputasi render, frame terkirim, penghargaan festival, dan aset 3D orisinal.',
    icon: BarChart3,
  },
  {
    type: 'interactive-cta',
    name: 'Komisi Proyek UNIMASI',
    category: 'conversion',
    badge: 'Konversi',
    description: 'Banner konversi interaktif untuk konsultasi komisi pembuatan animasi 3D, CGI, dan billboard videotron.',
    icon: ArrowUpRight,
  },

  // 2. Hero Departemen & Layanan
  {
    type: 'hero-department',
    name: 'Hero Departemen',
    category: 'hero',
    badge: 'Header',
    description: 'Headline utama dengan badge solusi, metrik hasil, dan mockup browser hasil karya nyata klien.',
    icon: Layers,
  },
  {
    type: 'hero-service',
    name: 'Hero Layanan Spesifik',
    category: 'hero',
    badge: 'Header',
    description: 'Header halaman layanan dengan highlight kata, deskripsi solusi, dan tombol konsultasi WhatsApp.',
    icon: Sparkles,
  },
  {
    type: 'hero-portfolio',
    name: 'Hero Portofolio / Kasus',
    category: 'hero',
    badge: 'Studi Kasus',
    description: 'Header studi kasus animasi dengan klien, tahun rilis, disiplin visual, video player, dan hero cover.',
    icon: Sparkles,
  },
  {
    type: 'portfolio-case-study',
    name: 'Studi Kasus Naratif',
    category: 'value',
    badge: 'Problem-Solution',
    description: 'Grid modular 4 bagian: Challenge, Approach Artistik, Technical Solution CGI, dan Result.',
    icon: LayoutTemplate,
  },
  {
    type: 'hero-solution',
    name: 'Hero Solusi Industri',
    category: 'hero',
    badge: 'Solusi Bisnis',
    description: 'Header solusi dengan badge industri, daftar poin manfaat utama, dan tombol aksi konsultasi.',
    icon: Zap,
  },

  // 2. Layanan & Portofolio
  {
    type: 'department-service-list',
    name: 'Daftar Layanan Unggulan',
    category: 'services',
    badge: 'Katalog',
    description: 'Grid kartu layanan dengan gambar portofolio nyata, badge spesialisasi, dan tautan detail.',
    icon: Boxes,
  },
  {
    type: 'visual-showcase-gallery',
    name: 'Galeri Hasil Karya Nyata',
    category: 'services',
    badge: 'Portofolio',
    description: 'Showcase proyek nyata yang aktif berjalan dengan metrik hasil dan pratinjau antarmuka.',
    icon: Eye,
  },
  {
    type: 'portfolio-proof-grid',
    name: 'Grid Studi Kasus Portofolio',
    category: 'services',
    badge: 'Studi Kasus',
    description: 'Menampilkan portofolio relevan yang diambil langsung dari database sistem.',
    icon: ArrowUpRight,
  },
  {
    type: 'media-showcase',
    name: 'Showcase Media & Tangkapan Layar',
    category: 'services',
    badge: 'Media Visual',
    description: 'Tampilan screenshot antarmuka sistem dalam bingkai minimalis immersive atau kartu rounded, lengkap dengan caption dan alt text.',
    icon: ImageIcon,
  },

  // 3. Nilai & Solusi Bisnis
  {
    type: 'feature-bento-grid',
    name: 'Fitur Unggulan Bento',
    category: 'value',
    badge: 'Fitur',
    description: 'Tata letak bento asimetris dengan pratinjau multi-perangkat dan fitur unggulan produk.',
    icon: Sliders,
  },
  {
    type: 'architecture-blueprint',
    name: '4 Jaminan Kualitas Sistem',
    category: 'value',
    badge: 'Keandalan',
    description: 'Pilar solusi bisnis: waktu muat < 1s, ramah pengguna, 100% hak milik, dan keamanan data.',
    icon: ShieldCheck,
  },
  {
    type: 'comparison-matrix',
    name: 'Perbandingan Kualitas UNIMASI',
    category: 'value',
    badge: 'Komparasi',
    description: 'Tabel perbandingan transparan keunggulan UNIMASI 3D Cinema vs template animasi konvensional.',
    icon: CheckCircle2,
  },
  {
    type: 'interactive-tech-matrix',
    name: 'Standar Kualitas & Keandalan',
    category: 'value',
    badge: 'Standar Mutu',
    description: 'Matriks 4 pilar kualitas: antarmuka responsif, dashboard mandiri, keamanan, dan garansi.',
    icon: BarChart3,
  },
  {
    type: 'engineering-pillars',
    name: '3 Pilar Rekayasa',
    category: 'value',
    badge: 'Pilar',
    description: 'Tiga pilar keunggulan sistematis yang mendasari setiap sistem.',
    icon: Layers,
  },

  // 4. Alur & Konversi
  {
    type: 'workflow-phases',
    name: 'Alur Pengerjaan Transparan',
    category: 'conversion',
    badge: 'Metodologi',
    description: 'Timeline 4 tahap kerja terstruktur: Konsultasi, Desain, Pembangunan, Peluncuran.',
    icon: Check,
  },
  {
    type: 'client-stats-impact',
    name: 'Keuntungan Nyata & Metrik SLA',
    category: 'conversion',
    badge: 'Metrik',
    description: 'Kartu metrik teruji: Keandalan sistem, waktu muat optimal, hak milik penuh, dan kode teruji.',
    icon: BarChart3,
  },
  {
    type: 'deliverables-checklist',
    name: 'Ruang Lingkup Serah Terima',
    category: 'conversion',
    badge: 'Garansi',
    description: 'Checklist kepastian penyerahan kode sumber, pelatihan staf, dan garansi 90 hari.',
    icon: CheckCircle2,
  },
  {
    type: 'executive-quote-card',
    name: 'Kutipan Komitmen Pimpinan',
    category: 'conversion',
    badge: 'Trust',
    description: 'Pernyataan komitmen kualitas dari pimpinan teknis untuk membangun kredibilitas.',
    icon: MessageSquare,
  },
  {
    type: 'faq-accordion',
    name: 'Tanya Jawab Populer (FAQ)',
    category: 'conversion',
    badge: 'FAQ',
    description: 'Accordion tanya-jawab untuk menjawab keraguan calon klien secara transparan.',
    icon: HelpCircle,
  },
  {
    type: 'studio-cta',
    name: 'Ajakan Bertindak (CTA)',
    category: 'conversion',
    badge: 'Konversi',
    description: 'Banner ajakan konsultasi WhatsApp dengan tombol kontak langsung.',
    icon: MessageSquare,
  },

  // 5. Editorial & Teks
  {
    type: 'heading2',
    name: 'Subjudul H2',
    category: 'editorial',
    badge: 'Teks',
    description: 'Judul seksi ukuran besar untuk membagi topik pembahasan.',
    icon: FileText,
  },
  {
    type: 'heading3',
    name: 'Subjudul H3',
    category: 'editorial',
    badge: 'Teks',
    description: 'Judul bagian tingkat menengah.',
    icon: FileText,
  },
  {
    type: 'paragraph',
    name: 'Paragraf Naratif',
    category: 'editorial',
    badge: 'Teks',
    description: 'Teks penjelasan naratif atau editorial.',
    icon: FileText,
  },
  {
    type: 'text-editorial',
    name: 'Editorial Narrative Multi-Kolom',
    category: 'editorial',
    badge: 'UNIMASI Narasi',
    description: 'Narasi editorial dengan lead paragraph beraksen tebal dan pembagian 1 atau 2 kolom teks.',
    icon: FileText,
  },
  {
    type: 'tech-stack-chips',
    name: 'Chips Fitur / Kategori',
    category: 'editorial',
    badge: 'Badge List',
    description: 'Daftar badge singkat fitur atau kategori keahlian.',
    icon: Sliders,
  },
]

function BlockMiniWireframe({ type }: { type: string }) {
  switch (type) {
    case 'hero-department':
    case 'hero-service':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-2.5 flex flex-col justify-between overflow-hidden relative group-hover:border-[#FFD600]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="w-10 h-1.5 rounded-full bg-[#FFD600]/70" />
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="w-3/4 h-2 rounded bg-white/80" />
            <div className="w-1/2 h-1.5 rounded bg-white/30" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 h-3.5 rounded bg-[#FFD600]/80" />
            <span className="w-8 h-3.5 rounded bg-white/10" />
          </div>
        </div>
      )
    case 'department-service-list':
    case 'portfolio-proof-grid':
    case 'visual-showcase-gallery':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-2 grid grid-cols-2 gap-2 overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          <div className="rounded-lg bg-white/5 border border-white/5 p-1.5 flex flex-col justify-between">
            <div className="w-full h-6 rounded bg-neutral-800 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFD600]/50" />
            </div>
            <div className="w-3/4 h-1.5 rounded bg-white/60 mt-1" />
            <div className="w-1/2 h-1 rounded bg-white/20" />
          </div>
          <div className="rounded-lg bg-white/5 border border-white/5 p-1.5 flex flex-col justify-between">
            <div className="w-full h-6 rounded bg-neutral-800 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFD600]/50" />
            </div>
            <div className="w-3/4 h-1.5 rounded bg-white/60 mt-1" />
            <div className="w-1/2 h-1 rounded bg-white/20" />
          </div>
        </div>
      )
    case 'feature-bento-grid':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-2 grid grid-cols-3 gap-1.5 overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          <div className="col-span-2 rounded-lg bg-white/5 border border-[#FFD600]/20 p-1.5 flex flex-col justify-between">
            <div className="w-1/3 h-1.5 rounded bg-[#FFD600]/70" />
            <div className="w-4/5 h-2 rounded bg-white/70" />
            <div className="w-2/3 h-1.5 rounded bg-white/30" />
          </div>
          <div className="col-span-1 rounded-lg bg-white/5 border border-white/5 p-1.5 flex flex-col justify-between">
            <div className="w-3 h-3 rounded bg-white/20" />
            <div className="w-full h-1.5 rounded bg-white/40" />
          </div>
        </div>
      )
    case 'architecture-blueprint':
    case 'engineering-pillars':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-1.5 flex flex-col justify-between overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-1 rounded bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600]" />
                <span className="w-16 h-1.5 rounded bg-white/60" />
              </div>
              <span className="w-8 h-1.5 rounded bg-[#FFD600]/30" />
            </div>
          ))}
        </div>
      )
    case 'comparison-matrix':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-2 flex flex-col justify-between overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          <div className="grid grid-cols-3 gap-1 pb-1 border-b border-white/10">
            <span className="h-1.5 rounded bg-white/20" />
            <span className="h-1.5 rounded bg-[#FFD600]/60" />
            <span className="h-1.5 rounded bg-white/20" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-1 items-center py-0.5">
              <span className="h-1.5 w-10 rounded bg-white/40" />
              <span className="h-1.5 w-3 rounded-full bg-emerald-400 mx-auto" />
              <span className="h-1.5 w-3 rounded bg-white/20 mx-auto" />
            </div>
          ))}
        </div>
      )
    case 'workflow-phases':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-2 flex items-center justify-between overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          {[1, 2, 3, 4].map((step, idx) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-[#FFD600]/20 border border-[#FFD600] flex items-center justify-center text-[8px] font-mono text-[#FFD600]">
                  {step}
                </div>
                <div className="w-6 h-1 rounded bg-white/30" />
              </div>
              {idx < 3 && <div className="flex-1 h-[1px] bg-white/15 mx-0.5" />}
            </React.Fragment>
          ))}
        </div>
      )
    case 'client-stats-impact':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-1.5 grid grid-cols-4 gap-1 items-center overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          {['99%', '<1s', '10x', '100%'].map((val, idx) => (
            <div key={idx} className="p-1 rounded bg-white/5 text-center flex flex-col items-center justify-center h-full">
              <span className="text-[10px] font-bold font-mono text-[#FFD600]">{val}</span>
              <span className="w-4 h-1 rounded bg-white/30 mt-1" />
            </div>
          ))}
        </div>
      )
    case 'deliverables-checklist':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-2 grid grid-cols-2 gap-1.5 overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1.5 p-1 rounded bg-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400/40 border border-emerald-400 flex items-center justify-center text-[6px] text-emerald-300">✓</span>
              <span className="flex-1 h-1.5 rounded bg-white/60" />
            </div>
          ))}
        </div>
      )
    case 'faq-accordion':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-1.5 flex flex-col justify-between overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-1 rounded bg-white/5 border border-white/5">
              <div className="w-3/4 h-1.5 rounded bg-white/60" />
              <span className="text-[10px] text-[#FFD600] leading-none">+</span>
            </div>
          ))}
        </div>
      )
    case 'studio-cta':
      return (
        <div className="w-full h-20 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-white/10 p-2 flex flex-col items-center justify-center text-center overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          <div className="w-3/4 h-1.5 rounded bg-white/80 mb-1" />
          <div className="w-1/2 h-1 rounded bg-white/30 mb-2" />
          <div className="w-16 h-3.5 rounded bg-[#FFD600] flex items-center justify-center text-[8px] font-bold text-neutral-950">
            Hubungi
          </div>
        </div>
      )
    case 'media-showcase':
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-1.5 flex flex-col justify-between overflow-hidden group-hover:border-[#FFD600]/40 transition-colors relative">
          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-black/60 border border-white/5">
            <span className="w-8 h-1 rounded bg-white/30" />
            <div className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-red-400/60" />
              <span className="w-1 h-1 rounded-full bg-amber-400/60" />
              <span className="w-1 h-1 rounded-full bg-emerald-400/60" />
            </div>
          </div>
          <div className="flex-1 my-1 rounded bg-neutral-900 border border-dashed border-white/10 flex items-center justify-center">
            <span className="text-[8px] font-mono text-[#FFD600]">Media Screenshot</span>
          </div>
        </div>
      )
    default:
      return (
        <div className="w-full h-20 rounded-xl bg-[#0e0e0e] border border-white/10 p-2.5 flex flex-col justify-center gap-1.5 overflow-hidden group-hover:border-[#FFD600]/40 transition-colors">
          <div className="w-3/4 h-2 rounded bg-white/70" />
          <div className="w-full h-1.5 rounded bg-white/30" />
          <div className="w-2/3 h-1.5 rounded bg-white/20" />
        </div>
      )
  }
}

export default function StudioVisualEditor({
  blocks,
  onChangeBlocks,
  selectedBlockId,
  onSelectBlock,
  targetType = 'service',
  contextData,
  title = 'Pratinjau Halaman',
  slug = '',
  onToggleInspector,
  isInspectorOpen = true,
  onValidationChange,
  viewMode: viewModeProp,
  onViewModeChange,
}: StudioVisualEditorProps) {
  const [internalViewMode, setInternalViewMode] = useState<StudioViewMode>('canvas')
  const viewMode = viewModeProp ?? internalViewMode
  const setViewMode = (mode: StudioViewMode) => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  const [device, setDevice] = useState<DeviceMode>('desktop')
  const [refreshKey, setRefreshKey] = useState(0)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [insertTargetIndex, setInsertTargetIndex] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)

  // Live Auto-detection of canvas container width from sidepanel resizing
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState<number>(0)

  React.useEffect(() => {
    if (!canvasContainerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(Math.round(entry.contentRect.width))
      }
    })
    ro.observe(canvasContainerRef.current)
    return () => ro.disconnect()
  }, [])

  // Real-time block validation via Zod discriminated union schema (L3-T1)
  const validationResult = React.useMemo(() => {
    return parseBlocks(blocks)
  }, [blocks])

  // A parent may pass an inline callback or rebuild an equivalent blocks array.
  // Notify only when validation changes, while always calling the latest handler.
  const reportValidation = React.useEffectEvent((valid: boolean, issues: string[]) => {
    onValidationChange?.(valid, issues)
  })
  const validationIssuesKey = JSON.stringify(validationResult.issues || [])
  React.useEffect(() => {
    reportValidation(validationResult.ok, JSON.parse(validationIssuesKey))
  }, [validationResult.ok, validationIssuesKey])

  const issuesByIndex = React.useMemo(() => {
    const map = new Map<number, string[]>()
    if (!validationResult.ok && validationResult.issues) {
      validationResult.issues.forEach((iss) => {
        const match = iss.match(/\[Block (\d+)/)
        const idx = match ? parseInt(match[1], 10) : -1
        if (idx >= 0) {
          const list = map.get(idx) || []
          list.push(iss)
          map.set(idx, list)
        }
      })
    }
    return map
  }, [validationResult])

  // ── Undo / Redo History Stack (L3-T4: >= 50 steps) ──────────────────────
  const historyRef = useRef<StudioBlock[][]>([JSON.parse(JSON.stringify(blocks))])
  const historyIndexRef = useRef<number>(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Local draft recovery state
  const draftKey = `unimasi_draft_${targetType}_${slug || 'default'}`
  const [hasLocalDraft, setHasLocalDraft] = useState(false)

  const pushHistory = (newBlocks: StudioBlock[]) => {
    const curIdx = historyIndexRef.current
    const newHistory = historyRef.current.slice(0, curIdx + 1)
    newHistory.push(JSON.parse(JSON.stringify(newBlocks)))
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      historyIndexRef.current = newHistory.length - 1
    }
    historyRef.current = newHistory
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)

    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          savedAt: Date.now(),
          blocks: newBlocks,
        })
      )
    } catch {}
  }

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1
      const prevBlocks = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]))
      onChangeBlocks(prevBlocks)
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
    }
  }

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1
      const nextBlocks = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]))
      onChangeBlocks(nextBlocks)
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
  }

  // Check local draft on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(draftKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (
          Array.isArray(parsed.blocks) &&
          parsed.blocks.length > 0 &&
          JSON.stringify(parsed.blocks) !== JSON.stringify(blocks)
        ) {
          setHasLocalDraft(true)
        }
      }
    } catch {}
  }, [draftKey])

  const restoreLocalDraft = () => {
    try {
      const stored = localStorage.getItem(draftKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed.blocks)) {
          onChangeBlocks(parsed.blocks)
          pushHistory(parsed.blocks)
          setHasLocalDraft(false)
        }
      }
    } catch {}
  }

  const discardLocalDraft = () => {
    try {
      localStorage.removeItem(draftKey)
    } catch {}
    setHasLocalDraft(false)
  }

  // Global Keyboard shortcuts for Undo/Redo (L3-T4)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target?.tagName) || target?.isContentEditable) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          handleRedo()
        } else {
          e.preventDefault()
          handleUndo()
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo])

  // Template Library State & Operations (L3-T2)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Performance Budget State (L3-T8)
  const [perfModalOpen, setPerfModalOpen] = useState(false)
  const perfAudit = React.useMemo(() => auditBlocksPerformance(blocks), [blocks])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const typeParam = targetType === 'department' ? 'category' : targetType
      const res = await fetch(`/api/templates?targetType=${typeParam}`)
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
      pushHistory(cloned)
      setTemplateModalOpen(false)
      if (cloned[0]) {
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
          targetType: targetType === 'department' ? 'category' : targetType,
          description: `Template visual dengan ${blocks.length} blok`,
          blocks,
        }),
      })
      const json = await res.json()
      if (json.success) {
        alert('Template berhasil disimpan ke library!')
        setSaveTemplateModalOpen(false)
        setNewTemplateName('')
      } else {
        alert(json.error || 'Gagal menyimpan template.')
      }
    } catch {
      alert('Gagal menyimpan template.')
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const previewUrl =
    targetType === 'department' || targetType === 'service'
      ? `/layanan/${slug || 'preview'}`
      : targetType === 'solution'
      ? `/solusi/${slug || 'preview'}`
      : `/portofolio/${slug || 'preview'}`

  // Block Manipulation Helpers with Undo/Redo integration (L3-T4)
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= blocks.length) return
    const updated = [...blocks]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    onChangeBlocks(updated)
    pushHistory(updated)
  }

  const deleteBlock = (index: number) => {
    const target = blocks[index]
    const targetTitle = target?.title || target?.name || target?.type || 'blok ini'
    if (confirm(`Hapus ${targetTitle}?`)) {
      const updated = blocks.filter((_, i) => i !== index)
      onChangeBlocks(updated)
      pushHistory(updated)
      if (selectedBlockId === target?.id) {
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
    pushHistory(updated)
    onSelectBlock(cloned.id)
  }

  const openPaletteAt = (index: number) => {
    setInsertTargetIndex(index)
    setSearchQuery('')
    setActiveCategory('all')
    setPaletteOpen(true)
  }

  const handleInsertBlock = (type: string) => {
    const newBlock: StudioBlock = {
      id: `blk-${Date.now()}`,
      type,
    }

    if (type === 'hero-cinema') {
      const cinemaData = {
        badge: 'UNIMASI Animation Studio',
        headline: 'We make ideas move with iconic 3D CGI.',
        title: 'We make ideas move with iconic 3D CGI.',
        subheadline: 'Studio produksi animasi 3D, videotron billboard fotorealistik, karakter orisinal, dan visual motion berkelas internasional.',
        description: 'Studio produksi animasi 3D, videotron billboard fotorealistik, karakter orisinal, dan visual motion berkelas internasional.',
        primaryCta: { label: 'Lihat Showreel Portofolio', href: '/portfolio' },
        secondaryCta: { label: 'Konsultasi Proyek', href: '/contact' },
      }
      newBlock.data = cinemaData
      Object.assign(newBlock, cinemaData)
      newBlock.settings = { height: 'screen', animation: 'reveal-stagger', alignment: 'left' }
    } else if (type === 'process-timeline') {
      const timelineData = {
        badge: 'UNIMASI Pipeline',
        eyebrow: 'Pipeline Produksi UNIMASI',
        title: 'Alur Kerja Presisi dari Naskah Hingga 4K Render',
        description: 'Metodologi animasi 4 tahapan berstandar bioskop untuk menjamin kualitas narasi dan keindahan visual tanpa kompromi.',
        steps: [
          { number: '01', title: 'Script & Storyboard', description: 'Pengembangan konsep cerita, naskah puitis, dan animatic ritmis.', duration: '1-2 Minggu' },
          { number: '02', title: 'Concept Art & 3D Modeling', description: 'Desain karakter orisinal, environment building, dan rigging ekspresif.', duration: '2-3 Minggu' },
          { number: '03', title: 'Animation & Motion Capture', description: 'Pemberian jiwa pada gerakan, simulasi kain, rambut, dan dinamika fisik.', duration: '2-4 Minggu' },
          { number: '04', title: 'Lighting, VFX & 4K Render', description: 'Tata cahaya sinematik, compositing warna, efek partikel, dan final master.', duration: '1-2 Minggu' },
        ],
      }
      newBlock.data = timelineData
      Object.assign(newBlock, timelineData)
    } else if (type === 'stats-ticker') {
      const statsData = {
        badge: 'UNIMASI Stats',
        eyebrow: 'Metrik Produksi',
        title: 'Dedikasi Karya Dalam Angka Nyata',
        stats: [
          { value: '1,200+', label: 'Jam Render Mesin GPU', suffix: 'Hrs' },
          { value: '45,000+', label: 'Frame 3D Ultra HD Terkirim', suffix: 'Frames' },
          { value: '12+', label: 'Penghargaan & Seleksi Festival', suffix: 'Awards' },
          { value: '100%', label: 'Aset 3D & Karakter Orisinal', suffix: 'IP' },
        ],
        metrics: [
          { value: '1,200+', label: 'Jam Render Mesin GPU', subtext: 'Hrs' },
          { value: '45,000+', label: 'Frame 3D Ultra HD Terkirim', subtext: 'Frames' },
          { value: '12+', label: 'Penghargaan & Seleksi Festival', subtext: 'Awards' },
          { value: '100%', label: 'Aset 3D & Karakter Orisinal', subtext: 'IP' },
        ],
      }
      newBlock.data = statsData
      Object.assign(newBlock, statsData)
    } else if (type === 'interactive-cta') {
      const ctaData = {
        headline: 'Siap Menghidupkan Visi Cerita Anda Bersama UNIMASI?',
        title: 'Siap Menghidupkan Visi Cerita Anda Bersama UNIMASI?',
        subheadline: 'Diskusikan konsep animasi 3D, CGI komersial, atau videotron anamorphic bersama tim direktur kreatif kami.',
        description: 'Diskusikan konsep animasi 3D, CGI komersial, atau videotron anamorphic bersama tim direktur kreatif kami.',
        ctaText: 'Mulai Komisi Proyek via WhatsApp',
        ctaLink: 'https://wa.me/6283121138821?text=Halo%20UNIMASI,%20saya%20ingin%20berkonsultasi%20mengenai%20produksi%20animasi%203D',
        primaryCta: {
          label: 'Mulai Komisi Proyek via WhatsApp',
          href: 'https://wa.me/6283121138821?text=Halo%20UNIMASI,%20saya%20ingin%20berkonsultasi%20mengenai%20produksi%20animasi%203D',
        },
        secondaryCtaText: 'Jelajahi Galeri Portofolio',
        secondaryCtaLink: '/portfolio',
        secondaryCta: {
          label: 'Jelajahi Galeri Portofolio',
          href: '/portfolio',
        },
      }
      newBlock.data = ctaData
      Object.assign(newBlock, ctaData)
    } else if (type === 'text-editorial') {
      const editorialData = {
        leadText: 'UNIMASI memadukan kecanggihan rekayasa grafis komputer dan seni bercerita yang menyentuh nurani.',
        lead: 'UNIMASI memadukan kecanggihan rekayasa grafis komputer dan seni bercerita yang menyentuh nurani.',
        body: 'Dari animasi 3D fotorealistik untuk kampanye komersial global hingga karya intelektual animasi cerita pendek, kami mendedikasikan presisi visual tertinggi pada setiap frame render.',
        content: 'Dari animasi 3D fotorealistik untuk kampanye komersial global hingga karya intelektual animasi cerita pendek, kami mendedikasikan presisi visual tertinggi pada setiap frame render.',
        columns: 1,
      }
      newBlock.data = editorialData
      Object.assign(newBlock, editorialData)
    } else if (type === 'hero-department') {
      newBlock.variant = 'cinematic'
      newBlock.badge = 'Solusi Animasi & Motion Design'
      newBlock.title = 'Produksi Animasi 2D, 3D & Motion Graphics'
      newBlock.description =
        'UNIMASI Studio mengubah konsep teknis yang kompleks menjadi alur visual naratif yang memukau, komunikatif, dan meninggalkan kesan mendalam bagi audiens Anda.'
      newBlock.heroImage = '/images/portfolio/telkom-dfe.webp'
      newBlock.imageCaption = 'Karya Nyata UNIMASI: Telkom Digital Future Enterprise (DFE)'
      newBlock.imageBadge = 'Hasil Produksi Aktif'
      newBlock.keyOutcomes = [
        { label: 'Resolusi Produksi', value: '4K Ultra HD' },
        { label: 'Peningkatan Retensi', value: '+55%' },
        { label: 'Kualitas Aset', value: '100% Hak Cipta Klien' },
      ]
      newBlock.floatingBadges = [
        { label: 'Motion & CGI Specialist' },
        { label: 'Alur Kerja Transparan' },
      ]
    } else if (type === 'hero-service') {
      newBlock.name = 'Produksi Animasi & Motion Design Profesional'
      newBlock.highlightWord = '& Storytelling Sinematik'
      newBlock.categoryBadge = 'Layanan Spesialis'
      newBlock.description =
        'Animasi berkualitas tinggi yang merangkum ide rumit menjadi visual memikat dan mudah dipahami oleh audiens Anda.'
      newBlock.whatsappPrompt = 'Halo UNIMASI, saya ingin konsultasi mengenai layanan animasi ini.'
    } else if (type === 'hero-portfolio' || type === 'hero-case-study') {
      const portData = {
        title: 'Produksi Animasi 3D Sinematik & Visual Storytelling',
        headline: 'Produksi Animasi 3D Sinematik & Visual Storytelling',
        client: 'Mitra Industri UNIMASI',
        year: `${new Date().getFullYear()}`,
        category: '3D Animation',
        discipline: 'CGI & Motion Design',
        summary: 'Penerjemahan brief teknis menjadi narasi visual beresolusi tinggi dengan alur kerja terstruktur dan detail pencahayaan bioskop.',
        primaryCta: { label: 'Konsultasi Proyek Serupa', href: '/contact' },
      }
      newBlock.data = portData
      Object.assign(newBlock, portData)
    } else if (type === 'portfolio-case-study') {
      const caseData = {
        eyebrow: 'Production Case Study',
        title: 'Tantangan, Pendekatan & Solusi Teknis',
        description: 'Bagaimana UNIMASI merancang solusi visual presisi untuk mengatasi hambatan komunikasi ide rumit.',
        challenge: 'Menjelaskan alur kerja mekanik dan proses industri yang tidak dapat didokumentasikan dengan kamera fisik.',
        approach: 'Mengembangkan animasi 3D fotorealistik dengan cutaway perspektif dinamis dan storyboard berorientasi storytelling.',
        solution: 'Penerapan pipeline CGI modern (Maya, Unreal Engine 5, Blender) untuk simulasi partikel presisi dan compositing warna akurat.',
        result: 'Meningkatkan retensi pemahaman audiens hingga 88% dan menjadi standar baru presentasi teknis perusahaan.',
      }
      newBlock.data = caseData
      Object.assign(newBlock, caseData)
    } else if (type === 'hero-solution') {
      const solData = {
        badge: 'Solusi Industri',
        title: 'Solusi Visualisasi 3D untuk Sektor Manufaktur & Industri',
        headline: 'Solusi Visualisasi 3D untuk Sektor Manufaktur & Industri',
        category: 'Enterprise Solution',
        shortDescription: 'Tingkatkan efisiensi komunikasi teknis dan keselamatan operasional melalui simulasi visual 3D fotorealistik.',
        keyBenefits: [
          'Simulasi akurat tanpa risiko kecelakaan kerja operasional',
          'Edukasi tim teknis dan operator mesin 3x lebih cepat',
          'Aset visual reusable untuk berbagai materi pelatihan korporat',
        ],
        primaryCta: { label: 'Konsultasi Solusi Ini', href: '/contact' },
        secondaryCta: { label: 'Jelajahi Portofolio Terkait', href: '/portfolio' },
      }
      newBlock.data = solData
      Object.assign(newBlock, solData)
    } else if (type === 'department-service-list') {
      newBlock.title = 'Layanan Produksi Animasi & Visual yang Kami Sediakan'
      newBlock.description =
        'Pilih solusi kreatif yang paling sesuai dengan kebutuhan komunikasi dan strategi bisnis brand Anda.'
    } else if (type === 'visual-showcase-gallery') {
      newBlock.badge = 'Karya Terpilih UNIMASI'
      newBlock.title = 'Portofolio Produksi Animasi & Motion Design Nyata'
      newBlock.description =
        'Jelajahi bagaimana visualisasi 2D, 3D, dan motion graphics kami membantu berbagai brand mengomunikasikan ide berharga mereka.'
      newBlock.items = [
        {
          title: 'Telkom Digital Future Enterprise (DFE)',
          category: 'Motion Graphics · Tech Explainer',
          image: '/images/portfolio/telkom-dfe.webp',
          metric: '500K+ Views',
          desc: 'Visualisasi jaringan serat optik, gateway satelit, dan hybrid cloud Telkom secara dinamis dan futuristik.',
        },
        {
          title: 'PT Yogya Presisi Tehnikatama Industri (YPTI)',
          category: '3D Animation · Corporate Industrial',
          image: '/images/portfolio/pt-ypti-3d.webp',
          metric: 'Hannover Messe Showcase',
          desc: 'Rekonstruksi model 3D CAD presisi mesin manufaktur CNC 5-axis dan simulasi pemesinan mikro tingkat tinggi.',
        },
        {
          title: 'Sanata Dharma Heritage Foundation',
          category: '3D Animation · Spatial Documentary',
          image: '/images/portfolio/sanata-dharma.webp',
          metric: 'Arsip Sejarah 3D',
          desc: 'Visualisasi 3D sinematik merangkai jejak kehidupan dan warisan sejarah institusi dengan visual megah.',
        },
      ]
    } else if (type === 'media-showcase' || type === 'editorial-image') {
      newBlock.title = 'Visual Sinematik & Standar Mutu Produksi'
      newBlock.subtitle = 'Setiap frame dirancang dengan perhatian mendalam pada storytelling, komposisi warna, dan pencahayaan.'
      newBlock.badge = 'Tangkapan Visual Asli'
      newBlock.image = '/images/portfolio/telkom-dfe.webp'
      newBlock.alt = 'Visual Motion Graphics Telkom DFE UNIMASI'
      newBlock.caption = 'Animasi motion graphics kinetik dengan aksen Bright Yellow (#FFD600) berkecepatan tinggi.'
      newBlock.frameStyle = 'immersive'
      newBlock.aspectRatio = '16/10'
      newBlock.imageLabel = 'Karya Nyata UNIMASI: Telkom Digital Future Enterprise'
      newBlock.floatingBadges = [
        { label: 'Resolusi 4K Sinematik' },
        { label: 'Story-Driven Narrative' },
      ]
    } else if (type === 'architecture-blueprint') {
      newBlock.badge = 'Standar Keunggulan'
      newBlock.title = '4 Jaminan Kualitas untuk Pertumbuhan Bisnis Anda'
      newBlock.description =
        'Kami mengeliminasi kendala teknis agar Anda dapat fokus mengembangkan bisnis dengan tenang dan nyaman.'
      newBlock.image = '/images/portfolio/pt-ypti-3d.webp'
      newBlock.imageLabel = 'Karya Nyata UNIMASI: Visualisasi 3D Mesin Industri PT YPTI'
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
    } else if (type === 'comparison-matrix') {
      newBlock.title = 'Perbandingan Kualitas: Mengapa Memilih UNIMASI'
      newBlock.description =
        'Transparansi bagaimana komitmen pengerjaan kami memberikan hasil yang jauh lebih menguntungkan untuk investasi jangka panjang Anda.'
      newBlock.rows = [
        {
          feature: 'Kecepatan Buka Halaman',
          segia: 'Membuka instan (< 1 detik), pengunjung betah & konversi naik',
          traditional: 'Sering lemot (> 4 detik) akibat tumpukan plugin berat',
        },
        {
          feature: 'Kemudahan Kelola Mandiri',
          segia: 'Dashboard simpel berbahasa Indonesia, siap pakai tanpa coding',
          traditional: 'Antarmuka rumit, butuh panggil programmer tiap update',
        },
        {
          feature: 'Status Kepemilikan Aset',
          segia: '100% Hak Milik Anda seutuhnya, tanpa biaya sewa lisensi',
          traditional: 'Sewa sistem proprietary terkunci, ada biaya tersembunyi',
        },
        {
          feature: 'Kenyamanan Tampilan di HP',
          segia: 'Didesain presisi & responsif di semua ukuran layar smartphone',
          traditional: 'Template standar umum yang sering berantakan di layar ponsel',
        },
        {
          feature: 'Garansi & Pelatihan Tim',
          segia: 'Garansi perbaikan bug & pendampingan operasional tim Anda',
          traditional: 'Lepas tangan setelah proyek selesai tanpa panduan operasional',
        },
      ]
    } else if (type === 'feature-bento-grid') {
      newBlock.variant = 'asymmetric-bento'
      newBlock.title = 'Fitur Unggulan yang Dirancang Khusus untuk Bisnis Anda'
      newBlock.description =
        'Kombinasi kemudahan pengelolaan, kecepatan tinggi, dan estetika visual yang mengangkat kelas brand Anda.'
      newBlock.features = [
        {
          title: 'Pengalaman Visual Modern di Semua Perangkat',
          description:
            'Tampilan website menyesuaikan secara mulus saat dibuka lewat smartphone, tablet, maupun laptop.',
          image: '/images/portfolio/3d-commercial.webp',
        },
        {
          title: 'Optimalisasi SEO Google',
          description:
            'Struktur website dirancang ramah mesin pencari agar bisnis Anda lebih mudah ditemukan oleh calon pelanggan baru di Google.',
        },
        {
          title: 'Integrasi Kontak WhatsApp Instan',
          description:
            'Tombol call-to-action cerdas yang memudahkan pengunjung langsung menghubungi tim penjualan Anda dalam satu sentuhan.',
        },
        {
          title: 'Keamanan Tingkat Tinggi',
          description:
            'Enkripsi data dan proteksi formulir untuk menjaga keamanan data pelanggan dari serangan siber.',
        },
      ]
    } else if (type === 'client-stats-impact') {
      newBlock.title = 'Keuntungan Nyata untuk Perkembangan Bisnis Anda'
      newBlock.description =
        'Setiap sistem yang kami bangun difokuskan untuk memecahkan kendala operasional dan mempercepat pertumbuhan organisasi Anda.'
      newBlock.stats = [
        {
          value: '99.9%',
          label: 'Uptime & Keandalan',
          detail: 'Sistem tetap stabil saat pengunjung membeludak',
        },
        {
          value: '< 1 Detik',
          label: 'Waktu Buka Halaman',
          detail: 'Pengunjung tidak kabur menunggu loading',
        },
        {
          value: '100%',
          label: 'Hak Milik Kode & Aset',
          detail: 'Bebas dari biaya sewa software bulanan',
        },
        {
          value: '90 Hari',
          label: 'Garansi Bug-Free',
          detail: 'Jaminan perbaikan purna jual & pendampingan',
        },
      ]
    } else if (type === 'workflow-phases') {
      newBlock.title = 'Alur Pengerjaan Transparan & Terarah'
      newBlock.description = 'Proses kerja terstruktur dari konsultasi awal hingga peluncuran sistem tanpa ribet.'
      newBlock.phases = [
        {
          step: '01',
          title: 'Konsultasi & Bedah Kebutuhan',
          description: 'Kami mendengarkan target bisnis Anda, masalah yang dihadapi, dan merumuskan fitur paling efektif.',
        },
        {
          step: '02',
          title: 'Perancangan Desain Visual',
          description: 'Penyusunan desain antarmuka elegan agar Anda dapat melihat dan menyetujui tampilan website sebelum dikerjakan.',
        },
        {
          step: '03',
          title: 'Pembangunan Sistem & Uji Coba',
          description: 'Pengerjaan sistem, pengisian materi awal, dan pengujian menyeluruh di berbagai ukuran layar ponsel.',
        },
        {
          step: '04',
          title: 'Peluncuran & Pelatihan Staf',
          description: 'Peluncuran ke domain resmi Anda, disertai panduan penggunaan mandiri dan garansi pendampingan operasional.',
        },
      ]
    } else if (type === 'deliverables-checklist') {
      newBlock.title = 'Apa Saja yang Anda Dapatkan Saat Serah Terima Proyek?'
      newBlock.description = 'Transparansi kepemilikan dan jaminan purna jual tanpa biaya tersembunyi sejak hari pertama.'
      newBlock.items = [
        {
          title: '100% Penyerahan Hak Milik Kode Sumber & Aset',
          desc: 'Seluruh kode program, aset grafis, dan database diserahkan penuh kepada Anda tanpa enkripsi atau penguncian sewa.',
        },
        {
          title: 'Panduan Operasional & Pelatihan Staf',
          desc: 'Sesi pelatihan praktis agar staf Anda dapat mengelola berita, produk, dan portofolio secara mandiri.',
        },
        {
          title: 'Garansi Bug-Free 90 Hari',
          desc: 'Jaminan perbaikan cepat tanpa biaya tambahan jika ditemukan kendala teknis setelah peluncuran.',
        },
        {
          title: 'Dukungan Konsultasi Lanjutan',
          desc: 'Tim teknis kami tetap siap mendampingi dan menjawab pertanyaan teknis tim Anda kapan saja dibutuhkan.',
        },
      ]
    } else if (type === 'executive-quote-card') {
      newBlock.quote =
        'Animasi yang berkesan bukan sekadar gerakan poligon 3D yang mulus, melainkan denyut emosi yang mengikat audiens pada cerita dan karakternya.'
      newBlock.author = 'Creative Director'
      newBlock.role = 'Head of Animation'
      newBlock.company = 'UNIMASI Studio'
    } else if (type === 'faq-accordion') {
      newBlock.title = 'Pertanyaan Seputar Produksi Animasi UNIMASI'
      newBlock.faqs = [
        {
          question: 'Berapa resolusi dan format akhir video yang diserahkan?',
          answer:
            'Kami menyerahkan master video dalam resolusi 4K UHD, ProRes 422 HQ atau MP4 H.265 dengan bitrate tinggi, siap untuk bioskop, videotron billboard, maupun siaran digital.',
        },
        {
          question: 'Apakah karakter dan aset 3D yang dibuat menjadi hak milik klien?',
          answer:
            'Ya, seluruh aset 3D, rig karakter, dan file proyek final menjadi 100% hak cipta dan kepemilikan klien tanpa royalti tersembunyi.',
        },
        {
          question: 'Berapa lama waktu yang dibutuhkan untuk memproduksi animasi 3D?',
          answer:
            'Tergantung durasi dan kompleksitas scene. Rata-rata video animasi 60-90 detik membutuhkan waktu 4 hingga 8 minggu dari storyboard hingga final render.',
        },
        {
          question: 'Apakah UNIMASI dapat mengerjakan videotron 3D anamorphic (ilusi kedalaman)?',
          answer:
            'Tentu! Kami menguasai teknik perhitungan sudut pandang ilusi 3D anamorphic untuk videotron sudut melengkung di pusat perbelanjaan dan gedung perkotaan.',
        },
      ]
    } else if (type === 'studio-cta') {
      newBlock.title = 'Siap Menghidupkan Cerita Visual Anda dalam Kualitas Bioskop?'
      newBlock.description =
        'Diskusikan konsep animasi 3D, CGI komersial, atau videotron bersama tim sutradara kreatif UNIMASI Studio.'
      newBlock.buttonText = 'Konsultasi Produksi via WhatsApp'
      newBlock.buttonUrl =
        'https://wa.me/6283121138821?text=Halo%20UNIMASI,%20saya%20ingin%20berkonsultasi%20mengenai%20produksi%20animasi%203D'
    } else if (type === 'paragraph') {
      newBlock.text =
        'Kami menghadirkan solusi teknologi yang tepat guna dan terukur, dirancang khusus untuk memenuhi standar mutu bisnis Anda.'
    } else if (type === 'heading2') {
      newBlock.text = 'Judul Bagian Pembahasan'
    } else if (type === 'heading3') {
      newBlock.text = 'Subjudul Tambahan'
    } else if (type === 'tech-stack-chips') {
      newBlock.title = 'Kategori & Fitur Unggulan'
      newBlock.technologies = ['Waktu Muat < 1 Detik', '100% Hak Milik', 'SEO Google', 'Responsif Ponsel']
    }

    const updated = [...blocks]
    updated.splice(insertTargetIndex, 0, newBlock)
    onChangeBlocks(updated)
    pushHistory(updated)
    setPaletteOpen(false)
    onSelectBlock(newBlock.id)
  }

  // Filtered block definitions for the modal
  const filteredBlocks = BLOCK_DEFINITIONS.filter((b) => {
    const matchesCategory = activeCategory === 'all' || b.category === activeCategory
    const matchesQuery =
      searchQuery.trim() === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.badge.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesQuery
  })

function getUnimasiBlockMeta(type: string) {
  switch (type) {
    case 'hero-cinema':
      return { label: 'Hero Sinematik 3D & Motion', tag: 'HERO CINEMA', icon: Zap, color: '#FFDE00' }
    case 'process-timeline':
      return { label: 'Alur Pipeline Produksi 3D', tag: 'PIPELINE', icon: History, color: '#FFDE00' }
    case 'stats-ticker':
      return { label: 'Metrik Kreatif & Produksi', tag: 'METRIK STUDIO', icon: BarChart3, color: '#FFDE00' }
    case 'interactive-cta':
      return { label: 'CTA Kolaborasi Kreatif', tag: 'KOLABORASI', icon: ArrowUpRight, color: '#FFDE00' }
    case 'hero-service':
      return { label: 'Hero Layanan Visual', tag: 'HERO', icon: Sparkles, color: '#FFDE00' }
    case 'hero-portfolio':
    case 'hero-case-study':
      return { label: 'Hero Portofolio & Kasus', tag: 'HERO KASUS', icon: Sparkles, color: '#FFDE00' }
    case 'portfolio-case-study':
      return { label: 'Studi Kasus Naratif (Problem-Solution)', tag: 'STUDI NARATIF', icon: LayoutTemplate, color: '#FFDE00' }
    case 'hero-solution':
      return { label: 'Hero Solusi Industri & Bisnis', tag: 'HERO SOLUSI', icon: Zap, color: '#FFDE00' }
    case 'catalog':
      return { label: 'Katalog Layanan Studio', tag: 'KATALOG', icon: Boxes, color: '#FFDE00' }
    case 'service-detail':
      return { label: 'Detail Spesifikasi Visual', tag: 'SPESIFIKASI', icon: FileText, color: '#FFDE00' }
    case 'faq-accordion':
      return { label: 'Tanya Jawab (FAQ)', tag: 'FAQ', icon: HelpCircle, color: '#FFDE00' }
    case 'cta-banner':
      return { label: 'Banner Kontak Studio', tag: 'CTA', icon: MessageSquare, color: '#FFDE00' }
    case 'architecture-blueprint':
      return { label: 'Standar Mutu Produksi', tag: 'STANDAR', icon: ShieldCheck, color: '#FFDE00' }
    case 'comparison-matrix':
      return { label: 'Komparasi Kualitas Render', tag: 'KOMPARASI', icon: Sliders, color: '#FFDE00' }
    case 'feature-bento-grid':
      return { label: 'Fitur Unggulan Studio', tag: 'BENTO', icon: LayoutTemplate, color: '#FFDE00' }
    case 'workflow-phases':
      return { label: 'Tahapan Produksi Studio', tag: 'TAHAPAN', icon: History, color: '#FFDE00' }
    case 'deliverables-checklist':
      return { label: 'Master File & Deliverables', tag: 'DELIVERABLE', icon: CheckCircle2, color: '#FFDE00' }
    case 'executive-quote-card':
      return { label: 'Kutipan Sutradara Kreatif', tag: 'KUTIPAN', icon: FileText, color: '#FFDE00' }
    case 'portfolio-proof-grid':
      return { label: 'Galeri Studi Kasus Animasi', tag: 'PORTOFOLIO', icon: ArrowUpRight, color: '#FFDE00' }
    case 'media-showcase':
      return { label: 'Showcase Frame Sinematik', tag: 'MEDIA', icon: ImageIcon, color: '#FFDE00' }
    default:
      return {
        label: type.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        tag: 'BLOK',
        icon: Layers,
        color: '#FFDE00',
      }
  }
}

  // Canvas renderer for Canvas mode and Split mode
  const renderCanvas = () => (
    <div
      ref={canvasContainerRef}
      className={`flex-1 min-w-0 overflow-y-auto bg-[#0a0a0a] flex justify-center items-start relative w-full scrollbar-thin studio-canvas-root ${device === 'desktop' ? 'p-0' : 'p-4 sm:p-6'}`}
    >
      <div
        key={refreshKey}
        style={{ containerType: 'inline-size' }}
        className={`@container transition-all duration-300 ${
          device === 'desktop'
            ? 'w-full max-w-full'
            : device === 'tablet'
            ? 'w-[768px] max-w-full min-h-[1024px] rounded-[32px] border-[8px] border-[#1C1C1E] shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden bg-black my-4'
            : 'w-[390px] max-w-full min-h-[844px] rounded-[48px] border-[10px] border-[#1C1C1E] shadow-[0_25px_70px_rgba(0,0,0,0.95)] ring-1 ring-white/10 overflow-hidden bg-black my-4'
        }`}
      >
        {/* Real Mobile Bezel (Dynamic Island & Speaker) */}
        {device === 'mobile' && (
          <div className="sticky top-0 left-0 right-0 h-7 bg-[#1C1C1E] flex items-center justify-center z-50 rounded-b-2xl mb-1 px-4">
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-between px-2.5">
              <div className="w-2 h-2 rounded-full bg-neutral-800" />
              <div className="w-2 h-2 rounded-full bg-blue-950/60 ring-1 ring-blue-500/30" />
            </div>
          </div>
        )}

        {/* Real Tablet Bezel (Camera Dot) */}
        {device === 'tablet' && (
          <div className="sticky top-0 left-0 right-0 h-5 bg-[#1C1C1E] flex items-center justify-center z-50 rounded-b-xl mb-1">
            <div className="w-2 h-2 rounded-full bg-neutral-800 ring-1 ring-white/10" />
          </div>
        )}

        {/* Empty Canvas Placeholder */}
        {blocks.length === 0 ? (
          <div className="py-24 px-6 text-center border-2 border-dashed border-white/10 bg-[#121212] m-6">
            <Layers className="w-12 h-12 text-[#FFD600] mx-auto mb-4 opacity-75 animate-bounce" />
            <h3 className="font-syne text-xl font-bold text-white mb-2">
              Halaman Ini Masih Kosong
            </h3>
            <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
              Pilih blok dari katalog untuk mulai menyusun tampilan website visual Anda dengan mudah.
            </p>
            <Tooltip label="Pilih Blok" hint="Buka palet blok pertama">
              <button
                type="button"
                onClick={() => openPaletteAt(0)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FFD600] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#ffe855] transition-all shadow-[0_0_20px_rgba(255, 214, 0,0.25)]"
              >
                <Plus className="w-4 h-4" />
                <span>Pilih Blok Pertama</span>
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            {/* Local Draft Recovery Banner (L3-T4) */}
            {hasLocalDraft && (
              <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Ditemukan draf susunan blok lokal yang belum disimpan dari sesi sebelumnya.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={restoreLocalDraft}
                    className="px-3 py-1 rounded-lg bg-amber-400 text-black font-bold text-[11px] hover:bg-amber-300 transition-colors shadow"
                  >
                    Pulihkan Draf
                  </button>
                  <button
                    type="button"
                    onClick={discardLocalDraft}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-400 text-[11px] hover:text-white transition-colors"
                  >
                    Abaikan
                  </button>
                </div>
              </div>
            )}

            {/* Validation Issues Banner if any */}
            {!validationResult.ok && (
              <div className="p-4 bg-rose-950/80 border-b border-rose-500/50 text-rose-200 text-xs font-mono shadow-xl">
                <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Ditemukan {validationResult.issues?.length} Kesalahan Skema Blok</span>
                </div>
                <p className="text-[11px] text-neutral-300 mb-2">
                  Blok yang bermasalah ditandai garis merah. Harap perbaiki sebelum menyimpan halaman.
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90 max-h-28 overflow-y-auto">
                  {validationResult.issues?.map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Inserter (Before first block) */}
            <div className="group/top relative h-2 hover:h-6 flex items-center justify-center transition-all z-30">
              <div className="absolute inset-x-0 h-px border-t border-dashed border-white/0 group-hover/top:border-[#FFD600]/40 transition-colors" />
              <Tooltip label="Sisipkan di Atas" side="bottom">
                <button
                  type="button"
                  onClick={() => openPaletteAt(0)}
                  className="relative z-10 px-2.5 py-1 rounded-full bg-[#181818] border border-white/15 text-[10px] font-mono text-neutral-400 hover:text-[#FFD600] hover:border-[#FFD600]/60 transition-all opacity-0 group-hover/top:opacity-100 flex items-center gap-1 shadow-lg"
                >
                  <Plus className="w-3 h-3 text-[#FFD600]" />
                  <span>Tambah Blok di Atas</span>
                </button>
              </Tooltip>
            </div>

            {/* Live Rendered Interactive Blocks (100% Contiguous & Seamless) */}
            {blocks.map((block, idx) => {
              const isSelected = selectedBlockId === block.id
              const isHovered = hoveredBlockId === block.id
              const blockErrors = issuesByIndex.get(idx) || []
              const hasBlockError = blockErrors.length > 0
              const meta = getUnimasiBlockMeta(block.type)
              const BlockIcon = meta.icon

              return (
                <div key={block.id || idx} className="w-full relative group/block">
                  {/* Visual Block Wrapper Frame (Zero Rounded for Seamless Web Experience) */}
                  <div
                    onMouseEnter={() => setHoveredBlockId(block.id)}
                    onMouseLeave={() => setHoveredBlockId(null)}
                    onClick={() => onSelectBlock(block.id)}
                    className={`relative rounded-none w-full transition-all duration-200 group cursor-pointer ${
                      hasBlockError
                        ? 'border-y-2 border-rose-500/80 bg-rose-950/20'
                        : isSelected
                        ? 'border-y-2 border-[#FFD600] ring-1 ring-inset ring-[#FFD600]/30 shadow-[0_0_40px_rgba(255, 214, 0,0.12)]'
                        : isHovered
                        ? 'border-y border-white/20'
                        : 'border-y border-transparent'
                    }`}
                  >
                    {/* Integrated Block Action Header Bar */}
                    <div
                      className={`w-full px-3 sm:px-4 py-2 border-b transition-all duration-200 flex items-center justify-between gap-2 select-none ${
                        isSelected
                          ? 'bg-[#181818] border-[#FFD600]/40'
                          : isHovered
                          ? 'bg-[#141414] border-white/15'
                          : 'bg-[#0f0f0f] border-white/5'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectBlock(block.id)
                      }}
                    >
                      {/* Left: Block Identifier Badge with Brand Styling */}
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-neutral-500 shrink-0 cursor-grab" />
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FFD600]/15 border border-[#FFD600]/30 shrink-0">
                          <BlockIcon className="w-3 h-3 text-[#FFD600]" />
                          <span className="text-[#FFD600] font-mono font-bold uppercase tracking-wider text-[10px]">
                            {meta.tag}
                          </span>
                        </div>
                        <span className="text-white text-xs font-semibold truncate hidden sm:inline">
                          {meta.label}
                        </span>
                        <span className="text-neutral-400 font-mono text-[11px] shrink-0">#{idx + 1}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FFD600]/20 text-[#FFD600] text-[9px] font-mono font-bold uppercase shrink-0 border border-[#FFD600]/40">
                            Aktif
                          </span>
                        )}
                        {perfAudit.lcpCandidateBlockIndex === idx && (
                          <Tooltip label="Kandidat LCP" hint="Blok ini memuat hero gambar utama (Largest Contentful Paint)" side="top">
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold cursor-help shrink-0">
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              LCP
                            </span>
                          </Tooltip>
                        )}
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Tooltip label="Pindah ke Atas" side="top">
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Pindah ke Bawah" side="top">
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'down')}
                            disabled={idx === blocks.length - 1}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Duplikasi Blok" side="top">
                          <button
                            type="button"
                            onClick={() => duplicateBlock(idx)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Pengaturan Blok" side="top">
                          <button
                            type="button"
                            onClick={() => onSelectBlock(block.id)}
                            className="p-1.5 rounded-lg text-[#FFD600] hover:bg-[#FFD600]/20 transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Hapus Blok" side="top">
                          <button
                            type="button"
                            onClick={() => deleteBlock(idx)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Actual Block Live Render (Seamless Edge-to-Edge) */}
                    <div className="rounded-none overflow-hidden pointer-events-auto w-full">
                      <BlockRenderer blocks={[block]} contextData={contextData} />
                    </div>

                    {/* Block Schema Issues Box */}
                    {hasBlockError && (
                      <div className="p-3 bg-rose-950/90 border-t border-rose-500/50 flex items-start gap-2 text-rose-300 text-xs font-mono">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 flex-1">
                          <span className="font-bold text-rose-200">Isu Skema pada Blok Ini:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                            {blockErrors.map((err, ei) => (
                              <li key={ei}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Low-profile Inserter Bar between blocks */}
                  <div className="group/inserter relative h-2 hover:h-6 flex items-center justify-center transition-all z-30">
                    <div className="absolute inset-x-0 h-px border-t border-dashed border-white/0 group-hover/inserter:border-[#FFD600]/40 transition-colors" />
                    <Tooltip label="Sisipkan Blok" side="top">
                      <button
                        type="button"
                        onClick={() => openPaletteAt(idx + 1)}
                        className="relative z-10 px-2.5 py-1 rounded-full bg-[#181818] border border-white/15 text-[10px] font-mono text-neutral-400 hover:text-[#FFD600] hover:border-[#FFD600]/60 transition-all opacity-0 group-hover/inserter:opacity-100 flex items-center gap-1 shadow-lg hover:scale-105"
                      >
                        <Plus className="w-3 h-3 text-[#FFD600]" />
                        <span>Sisipkan Blok</span>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              )
            })}

            {/* Bottom Inserter Area */}
            <div className="pt-8 pb-16 text-center border-t border-white/5 bg-[#0e0e0e]/50">
              <Tooltip label="Tambah Blok Baru" hint="Sisipkan blok baru di akhir halaman" side="top">
                <button
                  type="button"
                  onClick={() => openPaletteAt(blocks.length)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#FFD600]/50 text-white hover:text-[#FFD600] font-mono text-xs font-medium transition-all shadow-xl hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4 text-[#FFD600]" />
                  <span>Tambah Blok di Akhir</span>
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Real Smartphone Home Bar Indicator */}
        {device === 'mobile' && (
          <div className="sticky bottom-0 left-0 right-0 flex justify-center pointer-events-none z-50 py-2 bg-gradient-to-t from-black/80 to-transparent">
            <div className="w-28 h-1 rounded-full bg-white/40" />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-[#141414] overflow-hidden select-none">
      {/* ── Top Viewport Controls Bar ────────────────────────────────────────── */}
      <div className="h-12 shrink-0 px-4 sm:px-5 bg-[#191919] border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto select-none no-scrollbar flex-nowrap">
        <div className="flex items-center gap-2.5">
          <Tooltip label="Editor Visual Langsung" hint="Penyusun blok real-time dengan pratinjau instan" side="bottom">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/25 text-[#FFD600] font-mono text-xs font-semibold cursor-help">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EDITOR VISUAL</span>
            </div>
          </Tooltip>

          <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
            {blocks.length} Blok
          </span>

          {validationResult.ok ? (
            <Tooltip label="Skema Valid" hint="Seluruh blok memenuhi standar skema JSON platform" side="bottom">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono cursor-help">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Valid</span>
              </span>
            </Tooltip>
          ) : (
            <Tooltip label="Error Skema" hint={validationResult.issues?.join(' • ') || 'Ditemukan ketidaksesuaian skema'} side="bottom">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-mono animate-pulse cursor-help">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationResult.issues?.length} Error</span>
              </span>
            </Tooltip>
          )}

          {selectedBlockId && (
            <Tooltip label="Blok Terpilih" hint={`Blok aktif yang sedang disunting di inspector: ${selectedBlockId}`} side="bottom">
              <div className="items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#FFD600] hidden md:flex cursor-help">
                <span>Aktif:</span>
                <span className="truncate max-w-[120px] font-bold">{selectedBlockId}</span>
              </div>
            </Tooltip>
          )}
        </div>

        {/* Center: Device Switcher & History (Canvas Viewport Controls) */}
        <div className="flex items-center gap-2">
          {/* Responsive device frames (always accessible) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-white/10">
            <Tooltip label="Desktop" hint={`Viewport adaptif layar lebar (${canvasWidth || 1200}px auto deteksi)`} side="bottom">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-lg transition-all ${
                  device === 'desktop'
                    ? 'bg-[#FFD600] text-[#191919] font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label="Tablet" hint="Viewport tablet nyata (768 × 1024 px • rasio 3:4)" side="bottom">
              <button
                type="button"
                onClick={() => setDevice('tablet')}
                className={`p-1.5 rounded-lg transition-all ${
                  device === 'tablet'
                    ? 'bg-[#FFD600] text-[#191919] font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label="Ponsel" hint="Viewport smartphone nyata (390 × 844 px • rasio 9:19.5)" side="bottom">
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-lg transition-all ${
                  device === 'mobile'
                    ? 'bg-[#FFD600] text-[#191919] font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          {/* Real-time Viewport Dimensions Pill (Auto-detects Sidepanel Width) */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${device === 'mobile' ? 'bg-amber-400' : device === 'tablet' ? 'bg-sky-400' : 'bg-[#FFD600] animate-pulse'}`} />
            <span className="text-neutral-400">Dimensi:</span>
            <span className="text-white font-bold">
              {device === 'mobile'
                ? '390 × 844 px (Ponsel)'
                : device === 'tablet'
                ? '768 × 1024 px (Tablet)'
                : `${canvasWidth || '100%'} px (Auto Deteksi)`}
            </span>
            {isInspectorOpen && device === 'desktop' && (
              <span className="text-[10px] text-[#FFD600] font-medium hidden 2xl:inline">
                • Panel Aktif
              </span>
            )}
          </div>

          {/* Undo & Redo Controls (L3-T4) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-white/10">
            <Tooltip label="Undo" hint="Batalkan perubahan (Ctrl/Cmd+Z)" side="bottom">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip label="Redo" hint="Ulangi perubahan (Ctrl/Cmd+Y)" side="bottom">
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          <Tooltip label="Muat Ulang" hint="Refresh dan re-render seluruh kanvas visual" side="bottom">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Right: Template, Performance Audit, and Add Block */}
        <div className="flex items-center gap-2">
          {/* Template Library Button (L3-T2) */}
          <Tooltip label="Pustaka Template" hint="Pilih preset template susunan blok" side="bottom">
            <button
              type="button"
              onClick={handleOpenTemplates}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#FFD600]/40 text-neutral-300 hover:text-[#FFD600] transition-colors"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Save as Template Button */}
          {blocks.length > 0 && (
            <Tooltip label="Simpan Template" hint="Simpan susunan blok saat ini sebagai template baru" side="bottom">
              <button
                type="button"
                onClick={() => setSaveTemplateModalOpen(true)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#FFD600]/40 text-neutral-400 hover:text-white transition-colors hidden sm:inline-flex"
              >
                <Save className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Performance Budget Indicator Button (L3-T8) */}
          <Tooltip
            label="Anggaran Performa"
            hint={`Status ${perfAudit.status.toUpperCase()} (~${perfAudit.estimatedDomNodes} elemen DOM • Kandidat LCP: ${perfAudit.lcpCandidateBlockIndex !== null ? `#${perfAudit.lcpCandidateBlockIndex + 1}` : 'Tidak ada'})`}
            side="bottom"
          >
            <button
              type="button"
              onClick={() => setPerfModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors border ${
                perfAudit.status === 'optimal'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : perfAudit.status === 'moderate'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="text-[11px]">~{perfAudit.estimatedDomNodes} el</span>
            </button>
          </Tooltip>

          {/* "+ Tambah Blok" Button */}
          <Tooltip label="Tambah Blok" hint="Buka palet blok untuk menyisipkan komponen baru" side="bottom">
            <button
              type="button"
              onClick={() => openPaletteAt(blocks.length)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFD600] text-[#191919] text-xs font-mono font-bold hover:bg-[#ffe855] transition-all shadow-[0_0_15px_rgba(255, 214, 0,0.25)]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Main Visual Body (Canvas / Split / Full Preview) ─────────────────── */}
      {viewMode === 'full-preview' ? (
        <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col">
          <StudioLivePreview
            blocks={blocks}
            contextData={contextData}
            title={title}
            slug={slug}
            targetType={targetType}
            onSwitchToCanvas={() => setViewMode('canvas')}
          />
        </div>
      ) : viewMode === 'split-preview' ? (
        <div className="flex-1 flex flex-col lg:flex-row w-full h-full min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          <div className="w-full lg:w-1/2 h-full flex flex-col min-h-0 overflow-y-auto">
            {renderCanvas()}
          </div>
          <div className="w-full lg:w-1/2 h-full flex flex-col min-h-0 overflow-hidden">
            <StudioLivePreview
              blocks={blocks}
              contextData={contextData}
              title={title}
              slug={slug}
              targetType={targetType}
              onSwitchToCanvas={() => setViewMode('canvas')}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto flex flex-col">
          {renderCanvas()}
        </div>
      )}

      {/* ── Block Palette Modal (Pustaka Blok) ─────────────────────────────────── */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] rounded-3xl bg-[#181818] border border-white/15 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#151515]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD600]/10 border border-[#FFD600]/30 flex items-center justify-center text-[#FFD600]">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-syne text-lg font-bold text-white">
                    Pilih Blok yang Ingin Ditambahkan
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Sisipkan ke posisi #{insertTargetIndex + 1} di halaman
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="p-4 sm:px-6 bg-[#1a1a1a] border-b border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {[
                  { id: 'all', label: 'Semua Blok' },
                  { id: 'hero', label: 'Hero & Header' },
                  { id: 'services', label: 'Layanan & Portofolio' },
                  { id: 'value', label: 'Nilai & Solusi' },
                  { id: 'conversion', label: 'Alur & Garansi' },
                  { id: 'editorial', label: 'Teks & Konten' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#FFD600] text-[#191919] font-bold shadow'
                        : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari blok..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#FFD600]/50 placeholder:text-neutral-500"
                />
              </div>
            </div>

            {/* Block Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBlocks.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-neutral-400 text-xs font-mono">
                  Tidak ditemukan blok yang cocok dengan kata kunci pencarian.
                </div>
              ) : (
                filteredBlocks.map((b) => {
                  const IconComp = b.icon
                  return (
                    <div
                      key={b.type}
                      onClick={() => handleInsertBlock(b.type)}
                      className="group p-4 rounded-2xl bg-[#151515] border border-white/10 hover:border-[#FFD600]/50 hover:bg-[#1a1a1a] transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:-translate-y-0.5"
                    >
                      <div>
                        {/* Mini Visual Wireframe Preview */}
                        <div className="mb-3">
                          <BlockMiniWireframe type={b.type} />
                        </div>

                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD600] group-hover:scale-110 group-hover:bg-[#FFD600]/10 transition-all">
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="font-syne text-sm font-bold text-white group-hover:text-[#FFD600] transition-colors">
                              {b.name}
                            </h4>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#FFD600]">
                            {b.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#DBD7D5] leading-relaxed line-clamp-2">
                          {b.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400 group-hover:text-[#FFD600]">
                        <span className="text-[11px]">Tipe: {b.type}</span>
                        <span className="font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          + Sisipkan Blok
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Template Library Modal (L3-T2) ─────────────────────────────────── */}
      {templateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setTemplateModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-[#181818] border border-white/15 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#151515]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD600]/10 border border-[#FFD600]/30 flex items-center justify-center text-[#FFD600]">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-syne text-lg font-bold text-white">
                    Pustaka Template Blok Halaman
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Gunakan template susunan blok yang telah tersimpan untuk efisiensi pembuatan halaman
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loadingTemplates ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400">
                  Memuat template...
                </div>
              ) : savedTemplates.length === 0 ? (
                <div className="py-12 text-center">
                  <Bookmark className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm font-syne font-bold text-white mb-1">
                    Belum Ada Template Tersimpan
                  </p>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Anda dapat menyimpan susunan blok halaman saat ini dengan tombol &quot;Simpan Template&quot; di toolbar atas.
                  </p>
                </div>
              ) : (
                savedTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-2xl bg-[#151515] border border-white/10 hover:border-[#FFD600]/40 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-syne text-sm font-bold text-white">
                          {tpl.name}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#FFD600]">
                          {tpl.targetType}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {Array.isArray(tpl.blocks) ? tpl.blocks.length : 0} blok
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-1">
                        {tpl.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.blocks)}
                      className="px-4 py-2 rounded-xl bg-[#FFD600] text-[#191919] font-mono text-xs font-bold hover:bg-[#ffe855] transition-all shadow shrink-0"
                    >
                      Terapkan Template
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Save Current as Template Modal (L3-T2) ───────────────────────── */}
      {saveTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSaveTemplateModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#181818] border border-white/15 shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne text-base font-bold text-white">
                Simpan Sebagai Template
              </h3>
              <button
                type="button"
                onClick={() => setSaveTemplateModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Susunan {blocks.length} blok saat ini akan disimpan sebagai template reusable di pustaka.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Nama Template
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Contoh: Template Landing Page Edukasi"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121212] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#FFD600]/60"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 rounded-xl bg-[#FFD600] text-[#191919] font-mono text-xs font-bold hover:bg-[#ffe855] disabled:opacity-40 transition-all"
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Performance Budget Modal (L3-T8) ─────────────────────────────────── */}
      {perfModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPerfModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#181818] border border-white/15 shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-syne text-base font-bold text-white">
                    Anggaran Performa Halaman
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Audit Core Web Vitals, kompleksitas DOM, dan kandidat LCP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPerfModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[11px] font-mono text-neutral-400 mb-1">Perkiraan Elemen DOM</div>
                <div className="text-xl font-bold font-mono text-white">
                  ~{perfAudit.estimatedDomNodes} <span className="text-xs text-neutral-500">/ 800</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[11px] font-mono text-neutral-400 mb-1">Status Optimasi</div>
                <div className={`text-sm font-bold font-mono uppercase ${
                  perfAudit.status === 'optimal'
                    ? 'text-emerald-400'
                    : perfAudit.status === 'moderate'
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}>
                  {perfAudit.status === 'optimal' ? 'Sangat Baik' : perfAudit.status === 'moderate' ? 'Cukup' : 'Perlu Optimasi'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[11px] font-mono text-neutral-400 mb-1">Gambar & Video</div>
                <div className="text-sm font-mono text-white">
                  {perfAudit.imageCount} gambar, {perfAudit.videoCount} video
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[11px] font-mono text-neutral-400 mb-1">Kandidat LCP</div>
                <div className="text-sm font-mono text-[#FFD600]">
                  {perfAudit.lcpCandidateBlockIndex !== null
                    ? `Blok #${perfAudit.lcpCandidateBlockIndex + 1} (Priority)`
                    : 'Belum Terdeteksi'}
                </div>
              </div>
            </div>

            {/* Warnings or Recommendations */}
            {perfAudit.warnings.length > 0 && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Peringatan Performa:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                  {perfAudit.warnings.map((w, wi) => (
                    <li key={wi}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {perfAudit.recommendations.length > 0 && (
              <div className="mb-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs font-mono space-y-1">
                <div className="font-bold text-blue-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rekomendasi:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                  {perfAudit.recommendations.map((r, ri) => (
                    <li key={ri}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPerfModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-mono hover:bg-white/15"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
