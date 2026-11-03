'use client'

import React from 'react'
import {
  Layers,
  ArrowLeft,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Cpu,
  HelpCircle,
  MessageSquare,
  FolderKanban,
  Zap,
  ShieldCheck,
  Terminal,
  BarChart3,
  Database,
  Sliders,
  Info,
  Check,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import StudioImageControl from './StudioImageControl'

function FieldHeader({
  label,
  tooltip,
  badge,
}: {
  label: string
  tooltip?: string
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between gap-1.5 mb-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono font-medium text-neutral-300">{label}</span>
        {tooltip && (
          <Tooltip hint={tooltip} side="top">
            <Info className="w-3 h-3 text-neutral-500 hover:text-[#FFD600] cursor-help transition-colors" />
          </Tooltip>
        )}
      </div>
      {badge && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
          {badge}
        </span>
      )}
    </div>
  )
}

interface StudioBlockPropertiesProps {
  block: any
  onUpdateBlock: (updatedFields: any) => void
  onDeselect: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  allPortfolios?: Array<{ id: number; slug: string; title: string; client?: string; heroImage?: any }>
}

export default function StudioBlockProperties({
  block,
  onUpdateBlock,
  onDeselect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  allPortfolios = [],
}: StudioBlockPropertiesProps) {
  if (!block) return null

  const type = block.type || 'paragraph'
  const [animationExpanded, setAnimationExpanded] = React.useState(false)

  // Helper for updating a specific field
  const setField = (field: string, value: any) => {
    const update: any = { [field]: value }
    if (block.data && typeof block.data === 'object') {
      update.data = { ...block.data, [field]: value }
    }
    onUpdateBlock(update)
  }

  // Helper for updating animation field
  const setAnimationField = (field: string, value: any) => {
    onUpdateBlock({
      animation: {
        ...(block.animation || {}),
        [field]: value,
      },
    })
  }

  // Get human-friendly label and icon
  const getBlockMeta = () => {
    switch (type) {
      case 'hero-cinema':
        return { label: 'Hero Sinematik 3D', icon: Sparkles, desc: 'Header sinematik imersif dengan showcase motion reel & 3D' }
      case 'hero-portfolio':
      case 'hero-case-study':
        return { label: 'Hero Portofolio / Kasus', icon: FolderKanban, desc: 'Header studi kasus animasi dengan klien, tahun, dan video/poster' }
      case 'portfolio-case-study':
        return { label: 'Studi Kasus Naratif', icon: Layers, desc: 'Grid tantangan, pendekatan artistik, solusi teknis, dan hasil' }
      case 'hero-solution':
        return { label: 'Hero Solusi Industri', icon: Zap, desc: 'Header solusi dengan badge industri, manfaat utama, dan dual CTA' }
      case 'process-timeline':
        return { label: 'Timeline Produksi Animasi', icon: Layers, desc: 'Tahapan pipeline kreatif produksi 3D end-to-end' }
      case 'stats-ticker':
        return { label: 'Ticker Metrik Studio', icon: BarChart3, desc: 'Pencapaian jam tayang, proyek animasi, dan audiens' }
      case 'interactive-cta':
        return { label: 'CTA Kolaborasi Kreatif', icon: Sparkles, desc: 'Ajakan aksi memulai proyek animasi dan motion' }
      case 'text-editorial':
        return { label: 'Editorial Narrative', icon: MessageSquare, desc: 'Narasi editorial dengan lead paragraph dan multi-kolom teks' }
      case 'hero-department':
        return { label: 'Hero Departemen', icon: Layers, desc: 'Header utama dengan 3 Key Outcome Cards' }
      case 'hero-service':
        return { label: 'Hero Layanan', icon: Zap, desc: 'Header spesifikasi dengan media showcase dan metrik' }
      case 'feature-bento-grid':
        return { label: 'Feature Bento Grid', icon: CheckCircle2, desc: 'Grid kapabilitas fitur dan standar sistem' }
      case 'engineering-pillars':
        return { label: '3 Pilar Rekayasa', icon: Cpu, desc: 'Pilar arsitektur dan metodologi teknis' }
      case 'workflow-phases':
        return { label: 'Alur Kerja / Metodologi', icon: Sparkles, desc: '4 tahapan pelaksanaan proyek agile' }
      case 'portfolio-proof-grid':
        return { label: 'Bukti Portofolio Terkait', icon: FolderKanban, desc: 'Studi kasus nyata yang terhubung secara relasional' }
      case 'executive-quote-card':
        return { label: 'Ikhtisar Quote Eksekutif', icon: Sparkles, desc: 'Pernyataan strategis dengan garis specular' }
      case 'tech-stack-chips':
        return { label: 'Teknologi & Tools', icon: Cpu, desc: 'Badge framework dan standar teknologi pendukung' }
      case 'faq-accordion':
        return { label: 'FAQ Accordion', icon: HelpCircle, desc: 'Tanya jawab dengan schema FAQPage JSON-LD' }
      case 'comparison-matrix':
        return { label: 'Standar Rekayasa (Matrix)', icon: ShieldCheck, desc: 'Komparasi parameter teknis UNIMASI vs Konvensional' }
      case 'architecture-blueprint':
        return { label: '4-Layer Architecture Blueprint', icon: Terminal, desc: 'Spesifikasi arsitektur end-to-end multi-layer' }
      case 'client-stats-impact':
        return { label: 'Metrik Performa & Dampak', icon: BarChart3, desc: 'Display metrik pembuktian SLA, TTFB, dan CWV' }
      case 'deliverables-checklist':
        return { label: 'Checklist Serah Terima & Garansi', icon: CheckCircle2, desc: 'Transparansi ruang lingkup kepemilikan kode' }
      case 'interactive-tech-matrix':
        return { label: 'Matriks Standar Teknologi', icon: Database, desc: 'Framework & stack terklasifikasi 4 kategori' }
      case 'department-service-list':
        return { label: 'Sub-Layanan Departemen', icon: Layers, desc: 'Daftar 4 spesialisasi layanan dengan visual thumbnail' }
      case 'visual-showcase-gallery':
        return { label: 'Galeri Rekayasa Visual', icon: Sparkles, desc: 'Display antarmuka, live mockup, dan metrik produk' }
      case 'media-showcase':
      case 'editorial-image':
      case 'image':
        return { label: 'Showcase Media & Gambar', icon: ImageIcon, desc: 'Tangkapan layar antarmuka sistem dengan bingkai minimalis immersive dan caption konteks' }
      case 'paragraph':
      default:
        return { label: 'Paragraf Editorial', icon: Layers, desc: 'Teks narasi konten' }
    }
  }

  const meta = getBlockMeta()
  const Icon = meta.icon

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-white/10 select-none text-white overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#191919]">
        <Tooltip label="Kembali ke Dokumen" hint="Deselect blok aktif dan kembali ke susunan kanvas" side="bottom">
          <button
            type="button"
            onClick={onDeselect}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-[#FFD600] p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Kembali</span>
          </button>
        </Tooltip>

        {/* Quick Block Actions */}
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <Tooltip label="Pindah ke Atas" side="bottom">
              <button
                type="button"
                onClick={onMoveUp}
                aria-label="Pindah ke Atas"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
          {onMoveDown && (
            <Tooltip label="Pindah ke Bawah" side="bottom">
              <button
                type="button"
                onClick={onMoveDown}
                aria-label="Pindah ke Bawah"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
          {onDuplicate && (
            <Tooltip label="Duplikasi Blok" side="bottom">
              <button
                type="button"
                onClick={onDuplicate}
                aria-label="Duplikasi Blok"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip label="Hapus Blok" side="bottom">
              <button
                type="button"
                onClick={onDelete}
                aria-label="Hapus Blok"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Block Badge & Info */}
      <div className="px-4 py-3 border-b border-white/5 bg-[#141414] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600]">
            <Icon className="w-4 h-4" />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{meta.label}</span>
              <Tooltip hint={meta.desc} side="bottom">
                <Info className="w-3 h-3 text-neutral-500 hover:text-[#FFD600] cursor-help shrink-0" />
              </Tooltip>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 truncate block">
              {block.id}
            </span>
          </div>
        </div>
      </div>

      {/* Form Properties Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* ─── Shared: Animasi & Efek Immersive (GSAP / CSS) ──────────────── */}
        <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setAnimationExpanded(!animationExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono font-bold text-white">Animasi &amp; Efek Immersive</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                {block.animation?.type && block.animation.type !== 'none'
                  ? `${block.animation.type} • ${block.animation.duration || 'normal'}`
                  : 'Tanpa Animasi'}
              </span>
              {animationExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </div>
          </button>

          {animationExpanded && (
            <div className="p-4 border-t border-white/10 space-y-3.5 bg-[#121212]/80">
              <div>
                <FieldHeader label="Preset" tooltip="Gaya transisi animasi saat blok memasuki viewport" />
                <select
                  value={block.animation?.type || 'none'}
                  onChange={(e) => setAnimationField('type', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181818] border border-white/10 text-[#FFD600] text-xs font-mono"
                >
                  <option value="none">Tanpa Animasi (Normal Static)</option>
                  <option value="fade-up">Fade Up Reveal (Smooth Modern)</option>
                  <option value="scale-in">Scale In Subtle (Zoom Halus)</option>
                  <option value="slide-in">Slide In (Lateral Entrance)</option>
                  <option value="blur-reveal">Blur to Focus (Cinematic Editorial)</option>
                  <option value="glow-pulse">Specular Glow Pulse (Highlight)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldHeader label="Durasi" tooltip="Kecepatan transisi animasi" />
                  <select
                    value={block.animation?.duration || 'normal'}
                    onChange={(e) => setAnimationField('duration', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#181818] border border-white/10 text-white text-xs font-mono"
                  >
                    <option value="fast">Cepat (0.3s)</option>
                    <option value="normal">Normal (0.6s)</option>
                    <option value="slow">Lambat (1.0s)</option>
                  </select>
                </div>
                <div>
                  <FieldHeader label="Delay" tooltip="Penundaan waktu sebelum transisi dimulai" />
                  <select
                    value={block.animation?.delay || 'none'}
                    onChange={(e) => setAnimationField('delay', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#181818] border border-white/10 text-white text-xs font-mono"
                  >
                    <option value="none">Langsung (0ms)</option>
                    <option value="short">Singkat (150ms)</option>
                    <option value="medium">Sedang (300ms)</option>
                    <option value="long">Panjang (500ms)</option>
                  </select>
                </div>
              </div>

              <div>
                <FieldHeader label="Padding" tooltip="Jarak spasi vertikal responsif atas dan bawah blok" />
                <select
                  value={block.animation?.responsivePadding || 'normal'}
                  onChange={(e) => setAnimationField('responsivePadding', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#181818] border border-white/10 text-white text-xs font-mono"
                >
                  <option value="compact">Kompak (py-10)</option>
                  <option value="normal">Standar Editorial (py-16)</option>
                  <option value="spacious">Lega &amp; Immersive (py-24)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-white/5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(block.animation?.immersiveGlow)}
                    onChange={(e) => setAnimationField('immersiveGlow', e.target.checked)}
                    className="rounded text-[#FFD600] accent-[#FFD600]"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-200">Ambient Glow</span>
                    <Tooltip hint="Efek pendaran cahaya kromatik halus di belakang blok" side="top">
                      <Info className="w-3 h-3 text-neutral-500 hover:text-[#FFD600] cursor-help" />
                    </Tooltip>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ─── 0. HERO CINEMA (UNIMASI DEDICATED) ─────────────────────────── */}
        {type === 'hero-cinema' && (
          <>
            <div>
              <FieldHeader label="Badge Studio" tooltip="Label sinematik studio di atas judul" />
              <input
                type="text"
                value={block.badge || block.data?.badge || ''}
                onChange={(e) => setField('badge', e.target.value)}
                placeholder="UNIMASI ANIMATION STUDIO"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
              />
            </div>

            <div>
              <FieldHeader label="Headline Judul" tooltip="Judul karya / showreel animasi" />
              <input
                type="text"
                value={block.headline || block.title || block.data?.headline || ''}
                onChange={(e) => {
                  setField('headline', e.target.value)
                  setField('title', e.target.value)
                }}
                placeholder="Cinematic Motion & 3D Animation Showcase"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono font-bold"
              />
            </div>

            <div>
              <FieldHeader label="Deskripsi / Sinopsis" tooltip="Narasi kreatif cerita atau tujuan animasi" />
              <textarea
                rows={3}
                value={block.subheadline || block.description || block.data?.subheadline || ''}
                onChange={(e) => {
                  setField('subheadline', e.target.value)
                  setField('description', e.target.value)
                }}
                placeholder="Eksplorasi visual imersif, animasi 3D fidelitas tinggi..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-neutral-300 text-xs leading-relaxed"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <FieldHeader label="Tombol CTA Utama" tooltip="Tautan aksi penonton" />
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="text"
                  value={block.primaryCta?.label || block.data?.primaryCta?.label || 'Tonton Showreel'}
                  onChange={(e) => setField('primaryCta', { ...(block.primaryCta || block.data?.primaryCta || {}), label: e.target.value })}
                  placeholder="Label Tombol"
                  className="px-3 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-xs text-white font-mono"
                />
                <input
                  type="text"
                  value={block.primaryCta?.href || block.data?.primaryCta?.href || '#reel'}
                  onChange={(e) => setField('primaryCta', { ...(block.primaryCta || block.data?.primaryCta || {}), href: e.target.value })}
                  placeholder="Tautan URL"
                  className="px-3 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-xs text-[#FFD600] font-mono"
                />
              </div>
            </div>
          </>
        )}

        {/* ─── 0b. PROCESS TIMELINE (UNIMASI DEDICATED) ──────────────────────── */}
        {type === 'process-timeline' && (
          <>
            <div>
              <FieldHeader label="Badge" tooltip="Label penanda seksi" />
              <input
                type="text"
                value={block.badge || block.data?.badge || ''}
                onChange={(e) => setField('badge', e.target.value)}
                placeholder="CREATIVE PRODUCTION PIPELINE"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
              />
            </div>
            <div>
              <FieldHeader label="Judul Pipeline" tooltip="Judul alur kerja studio animasi" />
              <input
                type="text"
                value={block.headline || block.title || block.data?.headline || ''}
                onChange={(e) => {
                  setField('headline', e.target.value)
                  setField('title', e.target.value)
                }}
                placeholder="Dari Konseptual Hingga Rendering Resolusi 4K"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Keterangan metodologi produksi animasi" />
              <textarea
                rows={3}
                value={block.subheadline || block.description || block.data?.subheadline || ''}
                onChange={(e) => {
                  setField('subheadline', e.target.value)
                  setField('description', e.target.value)
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-neutral-300 text-xs leading-relaxed"
              />
            </div>
          </>
        )}

        {/* ─── 0c. STATS TICKER (UNIMASI DEDICATED) ───────────────────────────── */}
        {type === 'stats-ticker' && (
          <>
            <div>
              <FieldHeader label="Judul Metrik" tooltip="Judul pencapaian produksi animasi" />
              <input
                type="text"
                value={block.headline || block.title || block.data?.headline || ''}
                onChange={(e) => {
                  setField('headline', e.target.value)
                  setField('title', e.target.value)
                }}
                placeholder="Pencapaian Produksi Studio Animasi"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Keterangan metrik" />
              <textarea
                rows={3}
                value={block.subheadline || block.description || block.data?.subheadline || ''}
                onChange={(e) => {
                  setField('subheadline', e.target.value)
                  setField('description', e.target.value)
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-neutral-300 text-xs leading-relaxed"
              />
            </div>
          </>
        )}

        {/* ─── 0d. INTERACTIVE CTA (UNIMASI DEDICATED) ────────────────────────── */}
        {type === 'interactive-cta' && (
          <>
            <div>
              <FieldHeader label="Judul Ajakan Aksi" tooltip="Headline CTA utama animasi" />
              <input
                type="text"
                value={block.headline || block.title || block.data?.headline || ''}
                onChange={(e) => {
                  setField('headline', e.target.value)
                  setField('title', e.target.value)
                }}
                placeholder="Siap Mewujudkan Visi Animasi Anda?"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi CTA" tooltip="Penjelasan kolaborasi produksi studio" />
              <textarea
                rows={3}
                value={block.subheadline || block.description || block.data?.subheadline || ''}
                onChange={(e) => {
                  setField('subheadline', e.target.value)
                  setField('description', e.target.value)
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-neutral-300 text-xs leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldHeader label="Teks Tombol" tooltip="Label tombol" />
                <input
                  type="text"
                  value={block.ctaText || block.data?.ctaText || 'Mulai Kolaborasi Studio'}
                  onChange={(e) => setField('ctaText', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
                />
              </div>
              <div>
                <FieldHeader label="Tautan URL" tooltip="URL tujuan tombol" />
                <input
                  type="text"
                  value={block.ctaLink || block.data?.ctaLink || '/kontak'}
                  onChange={(e) => setField('ctaLink', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
                />
              </div>
            </div>
          </>
        )}

        {/* ─── 0e. TEXT EDITORIAL (UNIMASI DEDICATED) ─────────────────────────── */}
        {type === 'text-editorial' && (
          <>
            <div>
              <FieldHeader label="Lead Paragraph" tooltip="Paragraf pembuka / penekanan editorial" />
              <textarea
                rows={3}
                value={block.leadText || block.lead || block.data?.leadText || block.data?.lead || ''}
                onChange={(e) => {
                  setField('leadText', e.target.value)
                  setField('lead', e.target.value)
                }}
                placeholder="Paragraf pengantar bernada editorial..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs leading-relaxed"
              />
            </div>
            <div>
              <FieldHeader label="Isi Narasi / Body" tooltip="Teks isi narasi editorial lengkap" />
              <textarea
                rows={6}
                value={block.body || block.content || block.data?.body || block.data?.content || ''}
                onChange={(e) => {
                  setField('body', e.target.value)
                  setField('content', e.target.value)
                }}
                placeholder="Isi narasi, penjelasan konteks karya, atau esai kreatif..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-neutral-300 text-xs leading-relaxed"
              />
            </div>
            <div>
              <FieldHeader label="Jumlah Kolom" tooltip="Tata letak pembagian kolom narasi" />
              <select
                aria-label="Jumlah Kolom Editorial"
                value={block.columns || block.data?.columns || 1}
                onChange={(e) => setField('columns', Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
              >
                <option value={1}>1 Kolom (Default Full Width)</option>
                <option value={2}>2 Kolom Editorial</option>
              </select>
            </div>
          </>
        )}

        {/* ─── 1. HERO DEPARTMENT ───────────────────────────────────────── */}
        {type === 'hero-department' && (
          <>
            <div>
              <FieldHeader label="Varian" tooltip="Pilihan gaya presentasi visual hero" />
              <select
                name="heroVariant"
                aria-label="Varian Tampilan Hero"
                value={block.variant || 'cinematic'}
                onChange={(e) => setField('variant', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
              >
                <option value="cinematic">Cinematic Ambient Glow (Default)</option>
                <option value="showcase">Split Headline &amp; Standard Box (Showcase)</option>
              </select>
            </div>
            <div>
              <FieldHeader label="Badge" tooltip="Label penanda atau tagline di atas judul" />
              <input
                type="text"
                name="badge"
                aria-label="Badge Tagline"
                value={block.badge || ''}
                onChange={(e) => setField('badge', e.target.value)}
                placeholder="DEPARTEMEN SPESIALISASI"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
              />
            </div>
            <div>
              <FieldHeader label="Judul" tooltip="Judul utama departemen (gunakan '&' untuk teks italic)" />
              <input
                type="text"
                name="title"
                aria-label="Judul Departemen"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Software & Product Engineering"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian narasi nilai strategis departemen" />
              <textarea
                name="description"
                aria-label="Deskripsi Singkat Departemen"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={3}
                placeholder="Deskripsi nilai strategis..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            {/* Key Outcomes Cards */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Key Outcome Cards (3 Metrik)</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.keyOutcomes || []
                    setField('keyOutcomes', [...current, { label: 'Metrik Baru', value: '100%' }])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>
              <div className="space-y-2">
                {(block.keyOutcomes || []).map((metric: any, mIdx: number) => (
                  <div key={mIdx} className="p-3 rounded-xl bg-[#141414] border border-white/10 flex items-center gap-2">
                    <label className="flex-1">
                      <span className="sr-only">Label Metrik {mIdx + 1}</span>
                      <input
                        type="text"
                        name={`metricLabel_${mIdx}`}
                        aria-label={`Label Metrik ${mIdx + 1}`}
                        value={metric.label || ''}
                        onChange={(e) => {
                          const copy = [...(block.keyOutcomes || [])]
                          copy[mIdx] = { ...copy[mIdx], label: e.target.value }
                          setField('keyOutcomes', copy)
                        }}
                        placeholder="Label (mis. Sub-Detik LCP)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                      />
                    </label>
                    <label className="w-24">
                      <span className="sr-only">Nilai Metrik {mIdx + 1}</span>
                      <input
                        type="text"
                        name={`metricValue_${mIdx}`}
                        aria-label={`Nilai Metrik ${mIdx + 1}`}
                        value={metric.value || ''}
                        onChange={(e) => {
                          const copy = [...(block.keyOutcomes || [])]
                          copy[mIdx] = { ...copy[mIdx], value: e.target.value }
                          setField('keyOutcomes', copy)
                        }}
                        placeholder="Value (mis. < 1.2s)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] font-bold text-xs"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Hapus metrik ${mIdx + 1}`}
                      onClick={() => {
                        const copy = (block.keyOutcomes || []).filter((_: any, i: number) => i !== mIdx)
                        setField('keyOutcomes', copy)
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup Showcase Browser Image Settings */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <StudioImageControl
                label="Media Showcase Immersive Hero"
                description="Tangkapan layar antarmuka sistem nyata yang ditampilkan dalam bingkai minimalis immersive."
                value={block.heroImage || ''}
                onChange={(url) => setField('heroImage', url)}
                altText={block.altText || ''}
                onChangeAltText={(alt) => setField('altText', alt)}
                aspectHint="16:9 atau 16:10"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    <span className="block mb-1">Label / Keterangan Showcase</span>
                    <input
                      type="text"
                      value={block.imageCaption || block.windowTitle || ''}
                      onChange={(e) => {
                        setField('imageCaption', e.target.value)
                        setField('windowTitle', e.target.value)
                      }}
                      placeholder="Karya Nyata Klien: Portal..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    <span className="block mb-1">Badge Status Showcase</span>
                    <input
                      type="text"
                      value={block.imageBadge || block.windowBadge || ''}
                      onChange={(e) => {
                        setField('imageBadge', e.target.value)
                        setField('windowBadge', e.target.value)
                      }}
                      placeholder="Akses Cepat & Responsif"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                    />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── 2. HERO SERVICE ─────────────────────────────────────────── */}
        {type === 'hero-service' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldHeader label="Indeks" tooltip="Nomor urut seksi (contoh: 01)" />
                <input
                  type="text"
                  name="indexNumber"
                  aria-label="Nomor Indeks"
                  value={block.indexNumber || block.index || ''}
                  onChange={(e) => setField('indexNumber', e.target.value)}
                  placeholder="01"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
                />
              </div>
              <div>
                <FieldHeader label="Badge" tooltip="Label kategori atau status spesialisasi" />
                <input
                  type="text"
                  name="categoryBadge"
                  aria-label="Badge Kategori"
                  value={block.categoryBadge || block.badge || ''}
                  onChange={(e) => {
                    setField('categoryBadge', e.target.value)
                    setField('badge', e.target.value)
                  }}
                  placeholder="ENTERPRISE SOLUTION"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <FieldHeader label="Judul" tooltip="Nama layanan atau judul utama studi kasus" />
              <input
                type="text"
                name="name"
                aria-label="Nama Layanan"
                value={block.name || block.title || ''}
                onChange={(e) => {
                  setField('name', e.target.value)
                  setField('title', e.target.value)
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>

            <div>
              <FieldHeader label="Aksen Teks" tooltip="Kata atau frasa yang diberikan efek gradien italic" />
              <input
                type="text"
                name="highlightWord"
                aria-label="Aksen Teks"
                value={block.highlightWord || ''}
                onChange={(e) => setField('highlightWord', e.target.value)}
                placeholder="& Berkecepatan Tinggi"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
              />
            </div>

            <div>
              <FieldHeader label="Deskripsi" tooltip="Ringkasan nilai strategis atau penjelasan layanan" />
              <textarea
                name="shortDescription"
                aria-label="Value Proposition Singkat"
                value={block.shortDescription || block.description || block.summary || ''}
                onChange={(e) => {
                  setField('shortDescription', e.target.value)
                  setField('description', e.target.value)
                  setField('summary', e.target.value)
                }}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            <div>
              <FieldHeader label="Prompt WA" tooltip="Pesan pembuka otomatis saat tombol WhatsApp diklik" />
              <input
                type="text"
                name="whatsappPrompt"
                aria-label="Pesan Prompt WhatsApp"
                value={block.whatsappPrompt || ''}
                onChange={(e) => setField('whatsappPrompt', e.target.value)}
                placeholder="Halo UNIMASI, saya ingin konsultasi..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            {/* Primary Media Settings */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <StudioImageControl
                label="Media Cover"
                description="Tangkapan layar antarmuka atau foto resolusi tinggi."
                value={block.heroImage || block.primaryMedia?.imageUrl || ''}
                onChange={(url) => {
                  setField('heroImage', url)
                  const current = block.primaryMedia || {}
                  setField('primaryMedia', { ...current, imageUrl: url })
                }}
                altText={block.altText || block.primaryMedia?.altText || ''}
                onChangeAltText={(alt) => {
                  setField('altText', alt)
                  const current = block.primaryMedia || {}
                  setField('primaryMedia', { ...current, altText: alt })
                }}
                aspectHint="16:9 atau 21:9"
              />
            </div>

            {/* Metrik Bar */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Metrik Kinerja (3 Bar)</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.metrics || []
                    setField('metrics', [...current, { label: 'Metrik Baru', value: '99%' }])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>
              <div className="space-y-2">
                {(block.metrics || []).map((m: any, mIdx: number) => (
                  <div key={mIdx} className="p-3 rounded-xl bg-[#141414] border border-white/10 flex items-center gap-2">
                    <label className="flex-1">
                      <span className="sr-only">Label Metrik {mIdx + 1}</span>
                      <input
                        type="text"
                        name={`serviceMetricLabel_${mIdx}`}
                        aria-label={`Label Metrik ${mIdx + 1}`}
                        value={m.label || ''}
                        onChange={(e) => {
                          const copy = [...(block.metrics || [])]
                          copy[mIdx] = { ...copy[mIdx], label: e.target.value }
                          setField('metrics', copy)
                        }}
                        placeholder="Label (SLA Uptime)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                      />
                    </label>
                    <label className="w-24">
                      <span className="sr-only">Nilai Metrik {mIdx + 1}</span>
                      <input
                        type="text"
                        name={`serviceMetricValue_${mIdx}`}
                        aria-label={`Nilai Metrik ${mIdx + 1}`}
                        value={m.value || ''}
                        onChange={(e) => {
                          const copy = [...(block.metrics || [])]
                          copy[mIdx] = { ...copy[mIdx], value: e.target.value }
                          setField('metrics', copy)
                        }}
                        placeholder="Value (99.9%)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] font-bold text-xs"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Hapus metrik ${mIdx + 1}`}
                      onClick={() => {
                        const copy = (block.metrics || []).filter((_: any, i: number) => i !== mIdx)
                        setField('metrics', copy)
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── 2B. HERO PORTFOLIO / CASE STUDY ──────────────────────── */}
        {(type === 'hero-portfolio' || type === 'hero-case-study') && (
          <>
            <div>
              <FieldHeader label="Judul Proyek" tooltip="Judul utama studi kasus portofolio" />
              <input
                type="text"
                value={block.title || block.headline || ''}
                onChange={(e) => {
                  setField('title', e.target.value)
                  setField('headline', e.target.value)
                }}
                placeholder="cth: Wilmar Replanting Sawit 3D Explainer"
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldHeader label="Nama Klien" tooltip="Perusahaan atau brand klien" />
                <input
                  type="text"
                  value={block.client || ''}
                  onChange={(e) => setField('client', e.target.value)}
                  placeholder="cth: Wilmar International"
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldHeader label="Tahun Rilis" tooltip="Tahun produksi selesai" />
                <input
                  type="text"
                  value={block.year || ''}
                  onChange={(e) => setField('year', e.target.value)}
                  placeholder="2024"
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldHeader label="Kategori" tooltip="Kategori animasi (3D, 2D, Motion)" />
                <input
                  type="text"
                  value={block.category || ''}
                  onChange={(e) => setField('category', e.target.value)}
                  placeholder="3D Industrial"
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldHeader label="Disiplin" tooltip="Spesialisasi rekayasa visual" />
                <input
                  type="text"
                  value={block.discipline || ''}
                  onChange={(e) => setField('discipline', e.target.value)}
                  placeholder="Visual Production"
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <FieldHeader label="Ringkasan Eksekutif" tooltip="Paragraf naratif pengantar studi kasus" />
              <textarea
                rows={3}
                value={block.summary || block.description || ''}
                onChange={(e) => {
                  setField('summary', e.target.value)
                  setField('description', e.target.value)
                }}
                placeholder="Penjelasan ringkas tentang brief proyek..."
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="URL Hero Image / Poster" tooltip="Path gambar poster resolusi tinggi" />
              <input
                type="text"
                value={block.heroImage || block.posterUrl || ''}
                onChange={(e) => {
                  setField('heroImage', e.target.value)
                  setField('posterUrl', e.target.value)
                }}
                placeholder="/images/portfolio/cover.jpg"
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldHeader label="URL Video Embed" tooltip="YouTube, Vimeo, atau MP4 embed" />
                <input
                  type="text"
                  value={block.videoUrl || ''}
                  onChange={(e) => setField('videoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldHeader label="Live URL" tooltip="Tautan eksternal proyek" />
                <input
                  type="text"
                  value={block.liveUrl || ''}
                  onChange={(e) => setField('liveUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </>
        )}

        {/* ─── 2C. PORTFOLIO CASE STUDY NARRATIVE ────────────────────── */}
        {type === 'portfolio-case-study' && (
          <>
            <div>
              <FieldHeader label="Judul Bagian" tooltip="Judul narasi studi kasus" />
              <input
                type="text"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Tantangan, Pendekatan & Solusi Produksi"
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="01. The Challenge (Tantangan)" tooltip="Masalah atau kebutuhan klien" />
              <textarea
                rows={4}
                value={block.challenge || ''}
                onChange={(e) => setField('challenge', e.target.value)}
                placeholder="Jelaskan tantangan teknis / komunikasi yang dihadapi..."
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="02. Creative Approach (Pendekatan)" tooltip="Arah kreatif dan seni visual" />
              <textarea
                rows={4}
                value={block.approach || ''}
                onChange={(e) => setField('approach', e.target.value)}
                placeholder="Jelaskan pendekatan storytelling dan art direction..."
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="03. Technical Solution (Solusi CGI)" tooltip="Eksekusi software dan pipeline" />
              <textarea
                rows={4}
                value={block.solution || ''}
                onChange={(e) => setField('solution', e.target.value)}
                placeholder="Jelaskan tools 3D, simulasi partikel, dan compositing..."
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="04. Impact & Result (Hasil Akhir)" tooltip="Dampak dan apresiasi hasil" />
              <textarea
                rows={4}
                value={block.result || ''}
                onChange={(e) => setField('result', e.target.value)}
                placeholder="Jelaskan hasil terukur atau dampak komunikasi bagi klien..."
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
          </>
        )}

        {/* ─── 2D. HERO SOLUTION ───────────────────────────────────────── */}
        {type === 'hero-solution' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldHeader label="Badge Solusi" tooltip="Label kecil di atas judul" />
                <input
                  type="text"
                  value={block.badge || ''}
                  onChange={(e) => setField('badge', e.target.value)}
                  placeholder="Solusi Industri"
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldHeader label="Kategori" tooltip="Sektor target industri" />
                <input
                  type="text"
                  value={block.category || ''}
                  onChange={(e) => setField('category', e.target.value)}
                  placeholder="Enterprise"
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <FieldHeader label="Judul Solusi" tooltip="Headline utama solusi bisnis" />
              <input
                type="text"
                value={block.title || block.headline || ''}
                onChange={(e) => {
                  setField('title', e.target.value)
                  setField('headline', e.target.value)
                }}
                placeholder="cth: Solusi Visualisasi 3D Manufaktur"
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi Singkat" tooltip="Pengantar solusi dan problem statement" />
              <textarea
                rows={3}
                value={block.shortDescription || block.description || ''}
                onChange={(e) => {
                  setField('shortDescription', e.target.value)
                  setField('description', e.target.value)
                }}
                placeholder="Jelaskan bagaimana solusi ini mengatasi hambatan industri..."
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="Daftar Manfaat Utama (1 per baris)" tooltip="Poin-poin benefit solusi" />
              <textarea
                rows={4}
                value={
                  Array.isArray(block.keyBenefits)
                    ? block.keyBenefits.join('\n')
                    : typeof block.keyBenefits === 'string'
                    ? block.keyBenefits
                    : ''
                }
                onChange={(e) => setField('keyBenefits', e.target.value.split('\n').filter(Boolean))}
                placeholder="Simulasi aman tanpa downtime pabrik&#10;Edukasi operator 3x lebih cepat"
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldHeader label="URL Hero Image" tooltip="Gambar visual solusi" />
              <input
                type="text"
                value={block.heroImage || ''}
                onChange={(e) => setField('heroImage', e.target.value)}
                placeholder="/images/solutions/hero.jpg"
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent"
              />
            </div>
          </>
        )}

        {/* ─── 3. FEATURE BENTO GRID ───────────────────────────────────── */}
        {type === 'feature-bento-grid' && (
          <>
            <div>
              <FieldHeader label="Varian" tooltip="Pilihan layout bento: asimetris dengan spotlight atau 3 kolom simetris" />
              <select
                name="bentoVariant"
                aria-label="Varian Layout Bento"
                value={block.variant || 'asymmetric-bento'}
                onChange={(e) => setField('variant', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
              >
                <option value="asymmetric-bento">Asymmetric Bento (Hero Spotlight Card + Grid)</option>
                <option value="three-column">3-Column Uniform Matrix (Simetris)</option>
              </select>
            </div>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi fitur utama & standar rekayasa" />
              <input
                type="text"
                name="bentoTitle"
                aria-label="Judul Seksi Bento"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Fitur Utama & Standar Rekayasa"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian ringkas keunggulan fitur dan nilai teknis" />
              <textarea
                name="bentoDescription"
                aria-label="Deskripsi Ringkas Bento"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Daftar Fitur Bento</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.features || []
                    setField('features', [...current, { title: 'Fitur Baru', description: 'Uraian teknis...' }])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>
              <div className="space-y-3">
                {(block.features || []).map((f: any, fIdx: number) => (
                  <div key={fIdx} className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-400">
                        {fIdx === 0 ? 'Fitur #1 (Spotlight Card)' : `Fitur #${fIdx + 1}`}
                      </span>
                      <button
                        type="button"
                        aria-label={`Hapus fitur ${fIdx + 1}`}
                        onClick={() => {
                          const copy = (block.features || []).filter((_: any, i: number) => i !== fIdx)
                          setField('features', copy)
                        }}
                        className="text-neutral-400 hover:text-red-400 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Spotlight image for Feature #1 */}
                    {fIdx === 0 && (
                      <StudioImageControl
                        label="Gambar Spotlight Bento #1"
                        description="Pratinjau visual antarmuka pada kartu utama bento."
                        value={f.image || '/images/portfolio/telkom-dfe.webp'}
                        onChange={(url) => {
                          const copy = [...(block.features || [])]
                          copy[0] = { ...copy[0], image: url }
                          setField('features', copy)
                        }}
                        altText={f.title || ''}
                        aspectHint="16:9"
                      />
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <FieldHeader label="Judul" tooltip="Nama fitur atau kapabilitas sistem" />
                        <input
                          type="text"
                          name={`featureTitle_${fIdx}`}
                          aria-label={`Judul Fitur ${fIdx + 1}`}
                          value={f.title || ''}
                          onChange={(e) => {
                            const copy = [...(block.features || [])]
                            copy[fIdx] = { ...copy[fIdx], title: e.target.value }
                            setField('features', copy)
                          }}
                          placeholder="Judul Fitur"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <FieldHeader label="Badge" tooltip="Label penanda status atau keunggulan" />
                        <input
                          type="text"
                          name={`featureBadge_${fIdx}`}
                          aria-label={`Badge Fitur ${fIdx + 1}`}
                          value={f.badge || ''}
                          onChange={(e) => {
                            const copy = [...(block.features || [])]
                            copy[fIdx] = { ...copy[fIdx], badge: e.target.value }
                            setField('features', copy)
                          }}
                          placeholder="Solusi Unggulan"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldHeader label="Uraian" tooltip="Rincian keunggulan dan fungsionalitas fitur" />
                      <textarea
                        name={`featureDescription_${fIdx}`}
                        aria-label={`Uraian Fitur ${fIdx + 1}`}
                        value={f.description || ''}
                        onChange={(e) => {
                          const copy = [...(block.features || [])]
                          copy[fIdx] = { ...copy[fIdx], description: e.target.value }
                          setField('features', copy)
                        }}
                        rows={2}
                        placeholder="Uraian keunggulan..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── 4. ENGINEERING PILLARS ──────────────────────────────────── */}
        {type === 'engineering-pillars' && (
          <>
            <div>
              <FieldHeader label="Varian" tooltip="Pilihan gaya presentasi visual 3 pilar rekayasa" />
              <select
                name="pillarsVariant"
                aria-label="Varian Tampilan Pilar"
                value={block.variant || 'blueprint'}
                onChange={(e) => setField('variant', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
              >
                <option value="blueprint">Blueprint Glow Cards (Modern Obsidian)</option>
                <option value="cards">Classic Technical Cards</option>
              </select>
            </div>
            <div>
              <FieldHeader label="Judul" tooltip="Judul utama seksi 3 pilar rekayasa" />
              <input
                type="text"
                name="pillarsTitle"
                aria-label="Judul Seksi Pilar Rekayasa"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="3 Pilar Rekayasa Kami"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Penjelasan arsitektural dan filosofi metodologi teknis" />
              <textarea
                name="pillarsDescription"
                aria-label="Deskripsi Arsitektur Pilar"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={3}
                placeholder="Penjelasan detail arsitektur..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Pilar Utama</span>
                <span className="text-[10px] font-mono text-neutral-500">{(block.pillars || []).length} Pilar</span>
              </div>
              <div className="space-y-3">
                {(block.pillars || []).map((p: any, pIdx: number) => (
                  <div key={pIdx} className="p-3 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                    <FieldHeader label={`Pilar #${pIdx + 1}`} tooltip={`Detail spesifikasi pilar ke-${pIdx + 1}`} />
                    <input
                      type="text"
                      name={`pillarTitle_${pIdx}`}
                      aria-label={`Nama Pilar ${pIdx + 1}`}
                      value={p.title || ''}
                      onChange={(e) => {
                        const copy = [...(block.pillars || [])]
                        copy[pIdx] = { ...copy[pIdx], title: e.target.value }
                        setField('pillars', copy)
                      }}
                      placeholder="Nama Pilar"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold"
                    />
                    <textarea
                      name={`pillarDescription_${pIdx}`}
                      aria-label={`Deskripsi Pilar ${pIdx + 1}`}
                      value={p.description || p.desc || ''}
                      onChange={(e) => {
                        const copy = [...(block.pillars || [])]
                        copy[pIdx] = { ...copy[pIdx], description: e.target.value, desc: e.target.value }
                        setField('pillars', copy)
                      }}
                      rows={2}
                      placeholder="Deskripsi standar pilar..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── 5. WORKFLOW PHASES ──────────────────────────────────────── */}
        {type === 'workflow-phases' && (
          <>
            <div>
              <FieldHeader label="Varian" tooltip="Pilihan alur kerja: garis alur terhubung atau 4 fase modular" />
              <select
                name="workflowVariant"
                aria-label="Varian Alur Kerja"
                value={block.variant || 'timeline-connected'}
                onChange={(e) => setField('variant', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
              >
                <option value="timeline-connected">Connected Step Pulse (Garis Alur Terhubung)</option>
                <option value="cards-grid">4-Phases Modular Grid</option>
              </select>
            </div>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi metodologi pelaksanaan proyek" />
              <input
                type="text"
                name="workflowTitle"
                aria-label="Judul Metodologi"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Metodologi Pelaksanaan Proyek"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian pendekatan iteratif dan jaminan delivery tepat waktu" />
              <textarea
                name="workflowDescription"
                aria-label="Deskripsi Metodologi"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            <div className="pt-2 border-t border-white/10 space-y-3">
              <span className="text-xs font-mono font-semibold text-[#FFD600] block">4 Fase Agile Pelaksanaan</span>
              {(block.phases || []).map((ph: any, phIdx: number) => (
                <div key={phIdx} className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FFD600]/20 text-[#FFD600] font-bold">
                      FASE {ph.step || `0${phIdx + 1}`}
                    </span>
                    <label className="flex-1">
                      <span className="sr-only">Nama Fase {ph.step || phIdx + 1}</span>
                      <input
                        type="text"
                        name={`phaseTitle_${phIdx}`}
                        aria-label={`Nama Fase ${ph.step || phIdx + 1}`}
                        value={ph.title || ''}
                        onChange={(e) => {
                          const copy = [...(block.phases || [])]
                          copy[phIdx] = { ...copy[phIdx], title: e.target.value }
                          setField('phases', copy)
                        }}
                        placeholder="Nama Fase"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold"
                      />
                    </label>
                  </div>
                  <div>
                    <FieldHeader label="Uraian" tooltip={`Uraian tugas dan deliverables fase ke-${phIdx + 1}`} />
                    <textarea
                      name={`phaseDescription_${phIdx}`}
                      aria-label={`Uraian Fase ${ph.step || phIdx + 1}`}
                      value={ph.description || ''}
                      onChange={(e) => {
                        const copy = [...(block.phases || [])]
                        copy[phIdx] = { ...copy[phIdx], description: e.target.value }
                        setField('phases', copy)
                      }}
                      rows={2}
                      placeholder="Uraian fase kerja..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── 6. PORTFOLIO PROOF GRID ─────────────────────────────────── */}
        {type === 'portfolio-proof-grid' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi bukti kinerja dan studi kasus" />
              <input
                type="text"
                name="portfolioProofTitle"
                aria-label="Judul Seksi Portofolio"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Bukti Kinerja Nyata & Studi Kasus"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <span className="text-xs font-mono font-semibold text-[#FFD600] block mb-2">
                Pilih Studi Kasus Terkait (Relasional)
              </span>
              <p className="text-[11px] text-neutral-400 mb-3">
                Centang portofolio yang ingin ditampilkan di blok ini.
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {allPortfolios.map((p) => {
                  const currentIds: number[] = Array.isArray(block.portfolioIds)
                    ? block.portfolioIds
                    : (block.portfolios || []).map((x: any) => x.id)
                  const isChecked = currentIds.includes(p.id)

                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#FFD600]/10 border-[#FFD600]/40 text-white'
                          : 'bg-[#141414] border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="portfolioSelection"
                        aria-label={`Pilih portofolio ${p.title}`}
                        checked={isChecked}
                        onChange={(e) => {
                          let nextIds: number[]
                          if (e.target.checked) {
                            nextIds = [...currentIds, p.id]
                          } else {
                            nextIds = currentIds.filter((id) => id !== p.id)
                          }
                          const nextPortfolios = allPortfolios.filter((x) => nextIds.includes(x.id))
                          onUpdateBlock({
                            portfolioIds: nextIds,
                            portfolios: nextPortfolios,
                          })
                        }}
                        className="rounded border-white/20 text-[#FFD600] focus:ring-0"
                      />
                      <div className="overflow-hidden flex-1">
                        <div className="text-xs font-semibold truncate text-white">{p.title}</div>
                        <div className="text-[10px] font-mono text-neutral-400 truncate">{p.client || p.slug}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── 7. EXECUTIVE QUOTE CARD ─────────────────────────────────── */}
        {type === 'executive-quote-card' && (
          <>
            <div>
              <FieldHeader label="Kutipan" tooltip="Pernyataan komitmen kualitas rekayasa sistem atau kutipan pimpinan" />
              <textarea
                name="quote"
                aria-label="Teks Kutipan atau Ikhtisar"
                value={block.quote || ''}
                onChange={(e) => setField('quote', e.target.value)}
                rows={4}
                placeholder="Pernyataan komitmen kualitas rekayasa..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs leading-relaxed"
              />
            </div>
            <div>
              <FieldHeader label="Nama Tokoh" tooltip="Nama eksekutif, arsitek sistem, atau klien narasumber" />
              <input
                type="text"
                name="author"
                aria-label="Nama Tokoh atau Pimpinan"
                value={block.author || ''}
                onChange={(e) => setField('author', e.target.value)}
                placeholder="Muh Adib"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldHeader label="Jabatan" tooltip="Peran profesional tokoh narasumber" />
                <input
                  type="text"
                  name="role"
                  aria-label="Jabatan atau Role"
                  value={block.role || ''}
                  onChange={(e) => setField('role', e.target.value)}
                  placeholder="Lead System Architect"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <FieldHeader label="Organisasi" tooltip="Perusahaan atau institusi afiliasi" />
                <input
                  type="text"
                  name="company"
                  aria-label="Perusahaan"
                  value={block.company || ''}
                  onChange={(e) => setField('company', e.target.value)}
                  placeholder="UNIMASI"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
                />
              </div>
            </div>
          </>
        )}

        {/* ─── 8. TECH STACK CHIPS ─────────────────────────────────────── */}
        {type === 'tech-stack-chips' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi teknologi dan standar industri" />
              <input
                type="text"
                name="techStackTitle"
                aria-label="Judul Seksi Teknologi"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Teknologi & Standar Industri"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <FieldHeader label="Teknologi" tooltip="Daftar teknologi yang dipisahkan dengan tanda koma" />
              <textarea
                name="technologies"
                aria-label="Daftar Teknologi"
                value={
                  Array.isArray(block.technologies)
                    ? block.technologies
                        .map((t: any) => (typeof t === 'string' ? t : t?.name || ''))
                        .filter(Boolean)
                        .join(', ')
                    : block.technologies || ''
                }
                onChange={(e) => {
                  const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  setField('technologies', arr)
                }}
                rows={3}
                placeholder="Next.js 16, TypeScript, Docker, SQLite, Tailwind CSS"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
              />
            </div>
          </>
        )}

        {/* ─── 9. FAQ ACCORDION ────────────────────────────────────────── */}
        {type === 'faq-accordion' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi FAQ atau pertanyaan umum" />
              <input
                type="text"
                name="faqTitle"
                aria-label="Judul Seksi FAQ"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Pertanyaan yang Sering Diajukan"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-semibold"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Item Tanya Jawab</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.faqs || []
                    setField('faqs', [...current, { question: 'Pertanyaan baru?', answer: 'Jawaban detail...' }])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>
              <div className="space-y-3">
                {(block.faqs || []).map((faq: any, qIdx: number) => (
                  <div key={qIdx} className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-400">FAQ #{qIdx + 1}</span>
                      <button
                        type="button"
                        aria-label={`Hapus FAQ ${qIdx + 1}`}
                        onClick={() => {
                          const copy = (block.faqs || []).filter((_: any, i: number) => i !== qIdx)
                          setField('faqs', copy)
                        }}
                        className="text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <FieldHeader label="Pertanyaan" tooltip={`Pertanyaan yang sering diajukan ke-${qIdx + 1}`} />
                      <input
                        type="text"
                        name={`faqQuestion_${qIdx}`}
                        aria-label={`Pertanyaan FAQ ${qIdx + 1}`}
                        value={faq.question || ''}
                        onChange={(e) => {
                          const copy = [...(block.faqs || [])]
                          copy[qIdx] = { ...copy[qIdx], question: e.target.value }
                          setField('faqs', copy)
                        }}
                        placeholder="Pertanyaan"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Jawaban" tooltip={`Uraian jawaban transparan dan komprehensif ke-${qIdx + 1}`} />
                      <textarea
                        name={`faqAnswer_${qIdx}`}
                        aria-label={`Jawaban FAQ ${qIdx + 1}`}
                        value={faq.answer || ''}
                        onChange={(e) => {
                          const copy = [...(block.faqs || [])]
                          copy[qIdx] = { ...copy[qIdx], answer: e.target.value }
                          setField('faqs', copy)
                        }}
                        rows={2}
                        placeholder="Jawaban"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── 10. STUDIO CTA ──────────────────────────────────────────── */}
        {type === 'studio-cta' && (
          <>
            <div>
              <FieldHeader label="Headline" tooltip="Judul ajakan tindakan utama (Call-to-Action)" />
              <input
                type="text"
                name="ctaTitle"
                aria-label="Headline CTA"
                value={block.title || block.headline || ''}
                onChange={(e) => {
                  setField('title', e.target.value)
                  setField('headline', e.target.value)
                }}
                placeholder="Mulai Proyek Anda Bersama Kami"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Subheadline" tooltip="Deskripsi penjelasan ajakan konsultasi atau proposal teknis" />
              <textarea
                name="ctaDescription"
                aria-label="Subheadline atau Deskripsi CTA"
                value={block.description || block.subheadline || ''}
                onChange={(e) => {
                  setField('description', e.target.value)
                  setField('subheadline', e.target.value)
                }}
                rows={3}
                placeholder="Uraian ajakan konsultasi arsitektur..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <FieldHeader label="Label Tombol" tooltip="Teks pada tombol aksi utama" />
              <input
                type="text"
                name="ctaButtonLabel"
                aria-label="Label Tombol CTA"
                value={block.buttonText || ''}
                onChange={(e) => setField('buttonText', e.target.value)}
                placeholder="Konsultasi via WhatsApp"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <FieldHeader label="Tautan / WA" tooltip="URL tujuan atau link wa.me dengan pesan pembuka" />
              <input
                type="text"
                name="ctaButtonUrl"
                aria-label="URL atau Link WhatsApp CTA"
                value={block.buttonUrl || ''}
                onChange={(e) => setField('buttonUrl', e.target.value)}
                placeholder="https://wa.me/6285227702811"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
              />
            </div>
          </>
        )}

        {/* ─── COMPARISON MATRIX ────────────────────────────────────── */}
        {type === 'comparison-matrix' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi komparasi standar rekayasa vs konvensional" />
              <input
                type="text"
                name="comparisonTitle"
                aria-label="Judul Seksi Komparasi"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Standar Rekayasa UNIMASI vs Konvensional"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian ringkas keunggulan komparatif dan jaminan standar industri" />
              <textarea
                name="comparisonDescription"
                aria-label="Deskripsi Ringkas Komparasi"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Baris Parameter Komparasi</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.rows || []
                    setField('rows', [
                      ...current,
                      {
                        feature: 'Parameter Baru',
                        segia: 'Standar UNIMASI Modern',
                        traditional: 'Pendekatan Tradisional',
                      },
                    ])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah Baris
                </button>
              </div>
              <div className="space-y-3">
                {(block.rows || []).map((row: any, rIdx: number) => (
                  <div key={rIdx} className="p-3 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-400">Parameter #{rIdx + 1}</span>
                      <button
                        type="button"
                        aria-label={`Hapus baris komparasi ${rIdx + 1}`}
                        onClick={() => {
                          const copy = (block.rows || []).filter((_: any, i: number) => i !== rIdx)
                          setField('rows', copy)
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Nama Parameter</span>
                      <input
                        type="text"
                        name={`rowFeature-${rIdx}`}
                        aria-label={`Nama Parameter ${rIdx + 1}`}
                        value={row.feature || ''}
                        onChange={(e) => {
                          const copy = [...(block.rows || [])]
                          copy[rIdx] = { ...copy[rIdx], feature: e.target.value }
                          setField('rows', copy)
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                      />
                    </label>
                    <label className="block text-[11px] font-mono text-[#FFD600]">
                      <span className="block mb-1">Standar UNIMASI</span>
                      <input
                        type="text"
                        name={`rowSegia-${rIdx}`}
                        aria-label={`Standar UNIMASI ${rIdx + 1}`}
                        value={row.segia || ''}
                        onChange={(e) => {
                          const copy = [...(block.rows || [])]
                          copy[rIdx] = { ...copy[rIdx], segia: e.target.value }
                          setField('rows', copy)
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-[#FFD600]/30 text-[#FFD600] text-xs font-mono"
                      />
                    </label>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Pendekatan Konvensional</span>
                      <input
                        type="text"
                        name={`rowTraditional-${rIdx}`}
                        aria-label={`Pendekatan Konvensional ${rIdx + 1}`}
                        value={row.traditional || ''}
                        onChange={(e) => {
                          const copy = [...(block.rows || [])]
                          copy[rIdx] = { ...copy[rIdx], traditional: e.target.value }
                          setField('rows', copy)
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-neutral-300 text-xs font-mono"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── ARCHITECTURE BLUEPRINT ────────────────────────────────── */}
        {type === 'architecture-blueprint' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul spesifikasi blueprint arsitektur sistem multi-layer" />
              <input
                type="text"
                name="blueprintTitle"
                aria-label="Judul Blueprint Arsitektur"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Spesifikasi Arsitektur Sistem 4-Layer"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian filosofi arsitektur, decoupled resilience, dan throughput sistem" />
              <textarea
                name="blueprintDescription"
                aria-label="Deskripsi Blueprint Arsitektur"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Layers Arsitektur</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.layers || []
                    setField('layers', [
                      ...current,
                      {
                        level: `Layer 0${current.length + 1}`,
                        title: 'Layer Baru',
                        badge: 'Active',
                        desc: 'Deskripsi kapabilitas layer...',
                        tech: 'Teknologi pendukung',
                      },
                    ])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah Layer
                </button>
              </div>
              <div className="space-y-3">
                {(block.layers || []).map((layer: any, lIdx: number) => (
                  <div key={lIdx} className="p-3 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#FFD600]">{layer.level || `Layer 0${lIdx + 1}`}</span>
                      <button
                        type="button"
                        aria-label={`Hapus layer ${lIdx + 1}`}
                        onClick={() => {
                          const copy = (block.layers || []).filter((_: any, i: number) => i !== lIdx)
                          setField('layers', copy)
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Nama Layer & Level</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name={`layerLevel-${lIdx}`}
                          aria-label={`Level Layer ${lIdx + 1}`}
                          value={layer.level || ''}
                          onChange={(e) => {
                            const copy = [...(block.layers || [])]
                            copy[lIdx] = { ...copy[lIdx], level: e.target.value }
                            setField('layers', copy)
                          }}
                          placeholder="Layer 01"
                          className="w-24 px-2 py-1 rounded bg-black/40 border border-white/10 text-xs font-mono"
                        />
                        <input
                          type="text"
                          name={`layerTitle-${lIdx}`}
                          aria-label={`Judul Layer ${lIdx + 1}`}
                          value={layer.title || ''}
                          onChange={(e) => {
                            const copy = [...(block.layers || [])]
                            copy[lIdx] = { ...copy[lIdx], title: e.target.value }
                            setField('layers', copy)
                          }}
                          placeholder="Presentation & UI Engine"
                          className="flex-1 px-2 py-1 rounded bg-black/40 border border-white/10 text-xs font-bold"
                        />
                      </div>
                    </label>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Badge Status</span>
                      <input
                        type="text"
                        name={`layerBadge-${lIdx}`}
                        aria-label={`Badge Status Layer ${lIdx + 1}`}
                        value={layer.badge || ''}
                        onChange={(e) => {
                          const copy = [...(block.layers || [])]
                          copy[lIdx] = { ...copy[lIdx], badge: e.target.value }
                          setField('layers', copy)
                        }}
                        placeholder="Turbopack Edge"
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                      />
                    </label>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Deskripsi Layer</span>
                      <textarea
                        name={`layerDesc-${lIdx}`}
                        aria-label={`Deskripsi Layer ${lIdx + 1}`}
                        value={layer.desc || ''}
                        onChange={(e) => {
                          const copy = [...(block.layers || [])]
                          copy[lIdx] = { ...copy[lIdx], desc: e.target.value }
                          setField('layers', copy)
                        }}
                        rows={2}
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-xs"
                      />
                    </label>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Tech Stack Ringkas</span>
                      <input
                        type="text"
                        name={`layerTech-${lIdx}`}
                        aria-label={`Tech Stack Layer ${lIdx + 1}`}
                        value={layer.tech || ''}
                        onChange={(e) => {
                          const copy = [...(block.layers || [])]
                          copy[lIdx] = { ...copy[lIdx], tech: e.target.value }
                          setField('layers', copy)
                        }}
                        placeholder="Next.js 16, React 19, Turbopack"
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-neutral-300 text-xs font-mono"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Showcase Image & HUD Metrics Settings */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <span className="text-xs font-mono font-semibold text-[#FFD600] block">
                Visual Showcase Karya Nyata
              </span>
              <StudioImageControl
                label="Gambar Showcase Arsitektur"
                description="Tangkapan layar sistem yang ditampilkan berdampingan dengan 4 pilar arsitektur."
                value={block.image || ''}
                onChange={(url) => setField('image', url)}
                altText={block.altText || block.imageLabel || ''}
                onChangeAltText={(alt) => setField('altText', alt)}
                aspectHint="Rasio 4:3 atau 4:5"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    <span className="block mb-1">Label Showcase</span>
                    <input
                      type="text"
                      value={block.imageLabel || ''}
                      onChange={(e) => setField('imageLabel', e.target.value)}
                      placeholder="Karya Nyata Klien: Portal..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    <span className="block mb-1">Badge Showcase</span>
                    <input
                      type="text"
                      value={block.imageBadge || ''}
                      onChange={(e) => setField('imageBadge', e.target.value)}
                      placeholder="Hasil Produksi Aktif"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                    />
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-[11px] font-mono text-neutral-300 font-semibold block">
                  Indikator HUD Metrik Gambar
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={block.hudTitle || ''}
                    onChange={(e) => setField('hudTitle', e.target.value)}
                    placeholder="Judul HUD (Kecepatan Akses)"
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={block.hudMetric || ''}
                    onChange={(e) => setField('hudMetric', e.target.value)}
                    placeholder="Nilai (< 1 Detik)"
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-emerald-400 font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={block.hudDesc || ''}
                  onChange={(e) => setField('hudDesc', e.target.value)}
                  placeholder="Keterangan singkat metrik..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300"
                />
              </div>
            </div>
          </>
        )}

        {/* ─── CLIENT STATS IMPACT ───────────────────────────────────── */}
        {type === 'client-stats-impact' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi dampak performa dan metrik teruji" />
              <input
                type="text"
                name="statsImpactTitle"
                aria-label="Judul Seksi Metrik Dampak"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Dampak Performa Nyata & Metrik Teruji"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian ringkas pembuktian hasil kerja dan dampak bisnis" />
              <textarea
                name="statsImpactDescription"
                aria-label="Deskripsi Metrik Dampak"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Metrik Angka & KPI</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.stats || []
                    setField('stats', [
                      ...current,
                      { value: '100%', label: 'Label KPI', detail: 'Keterangan pembuktian' },
                    ])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah KPI
                </button>
              </div>
              <div className="space-y-3">
                {(block.stats || []).map((s: any, sIdx: number) => (
                  <div key={sIdx} className="p-3 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-400">Metrik #{sIdx + 1}</span>
                      <button
                        type="button"
                        aria-label={`Hapus metrik ${sIdx + 1}`}
                        onClick={() => {
                          const copy = (block.stats || []).filter((_: any, i: number) => i !== sIdx)
                          setField('stats', copy)
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <FieldHeader label="Angka" tooltip="Nilai capaian kuantitatif (contoh: 99.9% atau <1.2s)" />
                        <input
                          type="text"
                          name={`statValue-${sIdx}`}
                          aria-label={`Nilai Angka ${sIdx + 1}`}
                          value={s.value || ''}
                          onChange={(e) => {
                            const copy = [...(block.stats || [])]
                            copy[sIdx] = { ...copy[sIdx], value: e.target.value }
                            setField('stats', copy)
                          }}
                          placeholder="99.98%"
                          className="w-full px-2 py-1 rounded bg-black/40 border border-[#FFD600]/30 text-[#FFD600] font-bold text-xs"
                        />
                      </div>
                      <div>
                        <FieldHeader label="Label" tooltip="Nama indikator atau parameter metrik" />
                        <input
                          type="text"
                          name={`statLabel-${sIdx}`}
                          aria-label={`Label Metrik ${sIdx + 1}`}
                          value={s.label || ''}
                          onChange={(e) => {
                            const copy = [...(block.stats || [])]
                            copy[sIdx] = { ...copy[sIdx], label: e.target.value }
                            setField('stats', copy)
                          }}
                          placeholder="Uptime SLA"
                          className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <FieldHeader label="Keterangan" tooltip="Penjelasan metodologi pengujian atau konteks capaian" />
                      <input
                        type="text"
                        name={`statDetail-${sIdx}`}
                        aria-label={`Detail Keterangan ${sIdx + 1}`}
                        value={s.detail || ''}
                        onChange={(e) => {
                          const copy = [...(block.stats || [])]
                          copy[sIdx] = { ...copy[sIdx], detail: e.target.value }
                          setField('stats', copy)
                        }}
                        placeholder="Monitoring proaktif 24/7"
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-neutral-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── DELIVERABLES CHECKLIST ────────────────────────────────── */}
        {type === 'deliverables-checklist' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul checklist serah terima dan garansi organisasi" />
              <input
                type="text"
                name="deliverablesTitle"
                aria-label="Judul Checklist Serah Terima"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Ruang Lingkup Serah Terima & Garansi Organisasi"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian komitmen transparansi serah terima kode sumber dan lisensi" />
              <textarea
                name="deliverablesDescription"
                aria-label="Deskripsi Checklist Serah Terima"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Item Garansi & Deliverable</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.items || []
                    setField('items', [
                      ...current,
                      { title: 'Item Deliverable Baru', desc: 'Uraian spesifikasi garansi...' },
                    ])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah Item
                </button>
              </div>
              <div className="space-y-3">
                {(block.items || []).map((it: any, iIdx: number) => (
                  <div key={iIdx} className="p-3 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-400">Item #{iIdx + 1}</span>
                      <button
                        type="button"
                        aria-label={`Hapus item deliverable ${iIdx + 1}`}
                        onClick={() => {
                          const copy = (block.items || []).filter((_: any, i: number) => i !== iIdx)
                          setField('items', copy)
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Judul Deliverable</span>
                      <input
                        type="text"
                        name={`itemTitle-${iIdx}`}
                        aria-label={`Judul Deliverable ${iIdx + 1}`}
                        value={it.title || ''}
                        onChange={(e) => {
                          const copy = [...(block.items || [])]
                          copy[iIdx] = { ...copy[iIdx], title: e.target.value }
                          setField('items', copy)
                        }}
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white font-bold text-xs"
                      />
                    </label>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Uraian Garansi</span>
                      <textarea
                        name={`itemDesc-${iIdx}`}
                        aria-label={`Uraian Garansi ${iIdx + 1}`}
                        value={it.desc || ''}
                        onChange={(e) => {
                          const copy = [...(block.items || [])]
                          copy[iIdx] = { ...copy[iIdx], desc: e.target.value }
                          setField('items', copy)
                        }}
                        rows={2}
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-xs"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── INTERACTIVE TECH MATRIX ───────────────────────────────── */}
        {type === 'interactive-tech-matrix' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul matriks standar teknologi dan kapabilitas rekayasa" />
              <input
                type="text"
                name="techMatrixTitle"
                aria-label="Judul Matriks Teknologi"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Matriks Standar Teknologi UNIMASI"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian ringkas standar stack teknologi produksi" />
              <textarea
                name="techMatrixDescription"
                aria-label="Deskripsi Matriks Teknologi"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">Kategori Stack (Maks 4)</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.categories || []
                    setField('categories', [
                      ...current,
                      { name: 'Kategori Baru', badge: 'Stack', items: ['Teknologi 1', 'Teknologi 2'] },
                    ])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah Kategori
                </button>
              </div>
              <div className="space-y-3">
                {(block.categories || []).map((cat: any, cIdx: number) => (
                  <div key={cIdx} className="p-3 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-400">Kategori #{cIdx + 1}</span>
                      <button
                        type="button"
                        aria-label={`Hapus kategori ${cIdx + 1}`}
                        onClick={() => {
                          const copy = (block.categories || []).filter((_: any, i: number) => i !== cIdx)
                          setField('categories', copy)
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-[11px] font-mono text-neutral-400">
                        <span className="block mb-1">Nama Kategori</span>
                        <input
                          type="text"
                          name={`catName-${cIdx}`}
                          aria-label={`Nama Kategori ${cIdx + 1}`}
                          value={cat.name || ''}
                          onChange={(e) => {
                            const copy = [...(block.categories || [])]
                            copy[cIdx] = { ...copy[cIdx], name: e.target.value }
                            setField('categories', copy)
                          }}
                          placeholder="Frontend & UI"
                          className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white font-bold text-xs"
                        />
                      </label>
                      <label className="block text-[11px] font-mono text-neutral-400">
                        <span className="block mb-1">Badge Tag</span>
                        <input
                          type="text"
                          name={`catBadge-${cIdx}`}
                          aria-label={`Badge Tag ${cIdx + 1}`}
                          value={cat.badge || ''}
                          onChange={(e) => {
                            const copy = [...(block.categories || [])]
                            copy[cIdx] = { ...copy[cIdx], badge: e.target.value }
                            setField('categories', copy)
                          }}
                          placeholder="Core UI"
                          className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                        />
                      </label>
                    </div>
                    <label className="block text-[11px] font-mono text-neutral-400">
                      <span className="block mb-1">Daftar Tools & Library (Pisahkan dengan koma)</span>
                      <input
                        type="text"
                        name={`catItems-${cIdx}`}
                        aria-label={`Daftar Tools ${cIdx + 1}`}
                        value={
                          Array.isArray(cat.items)
                            ? cat.items
                                .map((t: any) => (typeof t === 'string' ? t : t?.name || ''))
                                .filter(Boolean)
                                .join(', ')
                            : cat.items || ''
                        }
                        onChange={(e) => {
                          const splitted = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                          const copy = [...(block.categories || [])]
                          copy[cIdx] = { ...copy[cIdx], items: splitted }
                          setField('categories', copy)
                        }}
                        placeholder="Next.js 16, React 19, Tailwind CSS"
                        className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-[#DBD7D5] text-xs font-mono"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── DEPARTMENT SERVICE LIST ───────────────────────────────── */}
        {type === 'department-service-list' && (
          <>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi daftar sub-layanan spesialisasi" />
              <input
                type="text"
                name="deptServiceTitle"
                aria-label="Judul Seksi Sub-Layanan"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Layanan Unggulan Rekayasa Sistem"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian ringkas ragam layanan teknis spesialisasi departemen" />
              <textarea
                name="deptServiceDescription"
                aria-label="Deskripsi Sub-Layanan"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            {/* List Item Sub-Layanan */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">
                  Item Sub-Layanan ({(block.services || []).length > 0 ? (block.services || []).length : 'Default Bawaan'})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.services || [
                      {
                        slug: '2d-animation',
                        name: '2D Animation & Explainer Video',
                        badge: 'Storytelling Visual',
                        description: 'Produksi animasi 2D explainer, edukasi, karakter, dan infografis naratif berkualitas tinggi.',
                        image: '/images/portfolio/3d-short-film.webp',
                        tags: ['2D Explainer', 'Karakter & Cerita', 'Frame-by-Frame'],
                      },
                      {
                        slug: '3d-animation-production',
                        name: '3D Animation & Visual Production',
                        badge: 'CGI & Rekonstruksi',
                        description: 'Visualisasi 3D produk, simulasi mesin industri CNC CAD, dan rendering sinematik photorealistic.',
                        image: '/images/portfolio/pt-ypti-3d.webp',
                        tags: ['3D Industrial', 'Sinematik 4K', 'Substance & Octane'],
                      },
                      {
                        slug: 'motion-graphics',
                        name: 'Motion Graphics & Kinetic Typography',
                        badge: 'Dinamis & Modern',
                        description: 'Pengembangan grafis gerak korporat, infografis animasi, logo motion, dan paket video grafis.',
                        image: '/images/portfolio/telkom-dfe.webp',
                        tags: ['Kinetic Typography', 'Brand Motion', 'High-Retention'],
                      },
                      {
                        slug: 'digital-visual-assets-ai',
                        name: 'Digital Visual Assets & AI-Assisted Production',
                        badge: 'Aset Digital Cepat',
                        description: 'Library aset visual 3D real-time dan pipeline produksi visual skala besar berbantuan AI terkontrol.',
                        image: '/images/portfolio/ugm.webp',
                        tags: ['3D Library', 'High-Volume', 'Real-Time Engine'],
                      },
                    ]
                    setField('services', [
                      ...current,
                      {
                        slug: 'layanan-baru',
                        name: 'Sub-Layanan Tambahan',
                        badge: 'Solusi Unggulan',
                        description: 'Deskripsi lengkap keunggulan sub-layanan animasi ini bagi klien...',
                        image: '/images/portfolio/pt-ypti-3d.webp',
                        tags: ['Fitur Utama', 'Spesialis Senior'],
                      },
                    ])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah Sub-Layanan
                </button>
              </div>

              {(block.services || []).length > 0 && (
                <div className="space-y-4">
                  {(block.services || []).map((srv: any, sIdx: number) => (
                    <div key={sIdx} className="p-3.5 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[#FFD600] font-semibold">
                          Sub-Layanan #{sIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = (block.services || []).filter((_: any, i: number) => i !== sIdx)
                            setField('services', copy)
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Hapus Sub-Layanan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <StudioImageControl
                        label={`Gambar Thumbnail #${sIdx + 1}`}
                        description="Thumbnail kartu preview sub-layanan."
                        value={srv.image || ''}
                        onChange={(url) => {
                          const copy = [...(block.services || [])]
                          copy[sIdx] = { ...copy[sIdx], image: url }
                          setField('services', copy)
                        }}
                        altText={srv.name || ''}
                        aspectHint="16:9"
                      />

                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                          Nama Sub-Layanan
                        </label>
                        <input
                          type="text"
                          value={srv.name || ''}
                          onChange={(e) => {
                            const copy = [...(block.services || [])]
                            copy[sIdx] = { ...copy[sIdx], name: e.target.value }
                            setField('services', copy)
                          }}
                          placeholder="Website Korporat & Landing Page"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                            Badge
                          </label>
                          <input
                            type="text"
                            value={srv.badge || ''}
                            onChange={(e) => {
                              const copy = [...(block.services || [])]
                              copy[sIdx] = { ...copy[sIdx], badge: e.target.value }
                              setField('services', copy)
                            }}
                            placeholder="Tingkatkan Kredibilitas"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                            Slug Tautan
                          </label>
                          <input
                            type="text"
                            value={srv.slug || ''}
                            onChange={(e) => {
                              const copy = [...(block.services || [])]
                              copy[sIdx] = { ...copy[sIdx], slug: e.target.value }
                              setField('services', copy)
                            }}
                            placeholder="2d-animation"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-neutral-300 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                          Deskripsi
                        </label>
                        <textarea
                          rows={2}
                          value={srv.description || ''}
                          onChange={(e) => {
                            const copy = [...(block.services || [])]
                            copy[sIdx] = { ...copy[sIdx], description: e.target.value }
                            setField('services', copy)
                          }}
                          placeholder="Deskripsi manfaat bagi klien..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── VISUAL SHOWCASE GALLERY ───────────────────────────────── */}
        {type === 'visual-showcase-gallery' && (
          <>
            <div>
              <FieldHeader label="Badge" tooltip="Label penanda atau tagline di atas judul galeri" />
              <input
                type="text"
                value={block.badge || ''}
                onChange={(e) => setField('badge', e.target.value)}
                placeholder="Bukti Portofolio Nyata"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
              />
            </div>
            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi galeri visual hasil pengerjaan nyata klien" />
              <input
                type="text"
                name="visualGalleryTitle"
                aria-label="Judul Galeri Visual"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Bukti Hasil Pengerjaan Nyata untuk Klien Kami"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>
            <div>
              <FieldHeader label="Deskripsi" tooltip="Uraian ringkas portofolio dan hasil pengerjaan" />
              <textarea
                name="visualGalleryDescription"
                aria-label="Deskripsi Galeri"
                value={block.description || ''}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            {/* List Kartu Gambar Galeri */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#FFD600]">
                  Kartu Showcase Gambar ({(block.items || []).length} Item)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.items || []
                    setField('items', [
                      ...current,
                      {
                        title: 'Proyek Klien Baru',
                        category: 'Sektor Industri',
                        image: '/images/portfolio/sanata-dharma.webp',
                        desc: 'Deskripsi hasil pengerjaan dan solusi...',
                        metric: '100% Hak Milik',
                      },
                    ])
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFD600] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Tambah Kartu
                </button>
              </div>

              <div className="space-y-4">
                {(block.items || []).map((item: any, gIdx: number) => (
                  <div key={gIdx} className="p-3.5 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#FFD600] font-semibold">
                        Kartu #{gIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = (block.items || []).filter((_: any, i: number) => i !== gIdx)
                          setField('items', copy)
                        }}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors"
                        title="Hapus Kartu Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Image Control Per Item */}
                    <StudioImageControl
                      label={`Gambar Kartu #${gIdx + 1}`}
                      description="Pilih screenshot karya proyek yang relevan."
                      value={item.image || ''}
                      onChange={(url) => {
                        const copy = [...(block.items || [])]
                        copy[gIdx] = { ...copy[gIdx], image: url }
                        setField('items', copy)
                      }}
                      altText={item.title || ''}
                      aspectHint="16:10"
                    />

                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Judul Proyek / Klien
                      </label>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => {
                          const copy = [...(block.items || [])]
                          copy[gIdx] = { ...copy[gIdx], title: e.target.value }
                          setField('items', copy)
                        }}
                        placeholder="Contoh: Portal PMB UMBY"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                          Kategori Sektor
                        </label>
                        <input
                          type="text"
                          value={item.category || ''}
                          onChange={(e) => {
                            const copy = [...(block.items || [])]
                            copy[gIdx] = { ...copy[gIdx], category: e.target.value }
                            setField('items', copy)
                          }}
                          placeholder="Pendidikan Tinggi"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                          Badge Metrik
                        </label>
                        <input
                          type="text"
                          value={item.metric || ''}
                          onChange={(e) => {
                            const copy = [...(block.items || [])]
                            copy[gIdx] = { ...copy[gIdx], metric: e.target.value }
                            setField('items', copy)
                          }}
                          placeholder="Ribuan Pendaftar"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-emerald-400 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                        Deskripsi Singkat Hasil Pengerjaan
                      </label>
                      <textarea
                        rows={2}
                        value={item.desc || ''}
                        onChange={(e) => {
                          const copy = [...(block.items || [])]
                          copy[gIdx] = { ...copy[gIdx], desc: e.target.value }
                          setField('items', copy)
                        }}
                        placeholder="Uraian solusi yang dibangun..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-neutral-300 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── MEDIA SHOWCASE / EDITORIAL IMAGE ───────────────────────── */}
        {(type === 'media-showcase' || type === 'editorial-image' || type === 'image') && (
          <>
            <div>
              <FieldHeader label="Gaya Tampilan" tooltip="Pilihan gaya bingkai: Immersive specular, clean floating card, atau borderless" />
              <select
                value={block.frameStyle === 'browser' ? 'immersive' : (block.frameStyle || 'immersive')}
                onChange={(e) => setField('frameStyle', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-[#FFD600] text-xs font-mono"
              >
                <option value="immersive">Immersive Editorial Surface (Bersih, Refined Specular Border)</option>
                <option value="floating-card">Clean Floating Card (Kartu Melayang dengan Padding)</option>
                <option value="borderless">Borderless (Edge-to-Edge Bersih)</option>
              </select>
            </div>

            <div>
              <FieldHeader label="Rasio Aspek" tooltip="Proporsi aspek tampilan media (16:10 laptop, 16:9 widescreen, 21:9 ultrawide)" />
              <select
                value={block.aspectRatio || '16/10'}
                onChange={(e) => setField('aspectRatio', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-mono"
              >
                <option value="16/10">16:10 (Standar Layar Laptop Modern)</option>
                <option value="16/9">16:9 (Widescreen Standar HD)</option>
                <option value="21/9">21:9 (Ultrawide Cinematic)</option>
                <option value="4/3">4:3 (Klasik Tablet)</option>
                <option value="1/1">1:1 (Persegi Square)</option>
              </select>
            </div>

            {/* Universal Image Control */}
            <StudioImageControl
              label="Gambar / Tangkapan Layar Utama"
              description="Unggah file gambar atau pilih dari galeri karya nyata UNIMASI."
              value={block.image || block.imageUrl || ''}
              onChange={(url) => {
                setField('image', url)
                setField('imageUrl', url)
              }}
              altText={block.alt || block.altText || ''}
              onChangeAltText={(alt) => {
                setField('alt', alt)
                setField('altText', alt)
              }}
              caption={block.caption || ''}
              onChangeCaption={(cap) => setField('caption', cap)}
              showCaptionInput={true}
              aspectHint={block.aspectRatio || '16:10'}
              required={true}
            />

            <div>
              <FieldHeader label="Judul" tooltip="Judul seksi media showcase (opsional)" />
              <input
                type="text"
                value={block.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Pratinjau Antarmuka Sistem Produksi"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs font-bold"
              />
            </div>

            <div>
              <FieldHeader label="Subjudul" tooltip="Deskripsi ringkas konteks implementasi di lapangan (opsional)" />
              <input
                type="text"
                value={block.subtitle || ''}
                onChange={(e) => setField('subtitle', e.target.value)}
                placeholder="Deskripsi ringkas konteks implementasi di lapangan..."
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  <span className="block mb-1">Badge Kategori</span>
                  <input
                    type="text"
                    value={block.badge || ''}
                    onChange={(e) => setField('badge', e.target.value)}
                    placeholder="Showcase Visual"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#FFD600] text-xs font-mono"
                  />
                </label>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  <span className="block mb-1">Label Konteks Media</span>
                  <input
                    type="text"
                    value={block.imageLabel || block.windowTitle || ''}
                    onChange={(e) => {
                      setField('imageLabel', e.target.value)
                      setField('windowTitle', e.target.value)
                    }}
                    placeholder="Dokumentasi Visual Antarmuka"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-mono"
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {/* ─── 11. EDITORIAL TEXT BLOCKS ──────────────────────────────── */}
        {(type === 'paragraph' || type === 'heading2' || type === 'heading3') && (
          <div>
            <FieldHeader
              label={type === 'paragraph' ? 'Paragraf' : 'Subjudul'}
              tooltip="Teks konten editorial narasi"
            />
            <textarea
              name="editorialText"
              aria-label={type === 'paragraph' ? 'Isi Teks Paragraf' : 'Teks Subjudul'}
              value={block.text || ''}
              onChange={(e) => setField('text', e.target.value)}
              rows={type === 'paragraph' ? 6 : 2}
              className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Bottom Done Button */}
      <div className="p-3 border-t border-white/10 bg-[#191919]">
        <Tooltip label="Selesai" hint="Simpan perubahan dan tutup panel inspector blok" side="top">
          <button
            type="button"
            onClick={onDeselect}
            className="w-full py-2 rounded-xl bg-[#FFD600] text-[#191919] hover:bg-[#ffe855] text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(255, 214, 0,0.2)] flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Selesai Mengedit</span>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
