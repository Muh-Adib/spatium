'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Upload,
  FolderOpen,
  X,
  Check,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Copy,
  CheckCheck,
  Eye,
  Info,
  Maximize2,
  Filter,
} from 'lucide-react'
import MediaPickerModal from './MediaPickerModal'

// Preset template visual nyata dari UNIMASI Studio Animasi & Motion Design
export const UNIMASI_IMAGE_PRESETS = [
  {
    name: 'Telkom Digital Future Enterprise (DFE)',
    url: '/images/portfolio/telkom-dfe.webp',
    category: 'Motion Graphics',
    defaultAlt: 'Animasi Motion Graphics Telkom Digital Future Enterprise UNIMASI',
  },
  {
    name: 'PT Yogya Presisi Tehnikatama Industri (YPTI)',
    url: '/images/portfolio/pt-ypti-3d.webp',
    category: '3D Industrial',
    defaultAlt: 'Animasi 3D CGI Mesin Manufaktur Presisi Tinggi PT YPTI',
  },
  {
    name: 'Sanata Dharma Heritage Foundation (In Memoriam)',
    url: '/images/portfolio/sanata-dharma.webp',
    category: '3D Animation',
    defaultAlt: 'Visualisasi 3D Sinematik Dokumenter Sejarah Sanata Dharma',
  },
  {
    name: 'Wilmar International Sawit Replanting',
    url: '/images/portfolio/motion-stills-1.png',
    category: 'Motion Graphics',
    defaultAlt: 'Animasi Motion Graphics Edukasi Replanting Sawit Wilmar',
  },
  {
    name: 'My Safe Harbor Short Animation Film',
    url: '/images/portfolio/3d-short-film.webp',
    category: '2D & 3D Character',
    defaultAlt: 'Visualisasi Film Pendek Animasi 3D Karakter My Safe Harbor',
  },
  {
    name: 'Transformasi Akademik Mercu Buana',
    url: '/images/portfolio/mercu-buana.webp',
    category: '3D Visualization',
    defaultAlt: 'Animasi 3D Visualisasi Kampus Modern Universitas Mercu Buana',
  },
  {
    name: 'Visualisasi Riset & Inovasi Teknologi UGM',
    url: '/images/portfolio/ugm.webp',
    category: 'Spatial & 3D Experience',
    defaultAlt: 'Virtual Exhibition 3D & Inovasi Teknologi Universitas Gadjah Mada',
  },
  {
    name: 'ITOKOH Presisi Pengecoran Logam Berkelanjutan',
    url: '/images/portfolio/itokoh.png',
    category: '3D Industrial',
    defaultAlt: 'Visualisasi 3D Proses Pengecoran Logam Berkelanjutan ITOKOH',
  },
  {
    name: '3D Anamorphic Videotron Display Production',
    url: '/images/portfolio/3d-anamorphic.webp',
    category: '3D Anamorphic',
    defaultAlt: 'Produksi Animasi 3D Anamorphic Videotron Display UNIMASI',
  },
  {
    name: '3D Commercial CGI Advertising Production',
    url: '/images/portfolio/3d-commercial.webp',
    category: '3D Commercial',
    defaultAlt: 'Produksi Iklan Komersial 3D CGI Sinematik UNIMASI',
  },
]

export const SEGIA_IMAGE_PRESETS = UNIMASI_IMAGE_PRESETS

export interface StudioImageControlProps {
  label: string
  description?: string
  value: string
  onChange: (url: string) => void
  altText?: string
  onChangeAltText?: (alt: string) => void
  caption?: string
  onChangeCaption?: (caption: string) => void
  aspectHint?: string
  showCaptionInput?: boolean
  required?: boolean
}

export default function StudioImageControl({
  label,
  description,
  value,
  onChange,
  altText = '',
  onChangeAltText,
  caption = '',
  onChangeCaption,
  aspectHint = 'Rekomendasi 16:9 atau 16:10',
  showCaptionInput = false,
  required = false,
}: StudioImageControlProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false)
  const [presetCategory, setPresetCategory] = useState<string>('Semua')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewAspect, setPreviewAspect] = useState<'16/9' | '16/10' | '4/3' | '1/1'>('16/9')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Direct upload handler
  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'showcase')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success && data.url) {
        onChange(data.url)
        if (onChangeAltText && !altText) {
          const autoAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ')
          onChangeAltText(autoAlt)
        }
      } else {
        setUploadError(data.error || 'Gagal mengunggah file gambar.')
      }
    } catch {
      setUploadError('Terjadi kesalahan jaringan saat mengunggah.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file)
    }
  }

  const handleCopyUrl = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleSelectPreset = (preset: typeof SEGIA_IMAGE_PRESETS[0]) => {
    onChange(preset.url)
    if (onChangeAltText && (!altText || altText === '')) {
      onChangeAltText(preset.defaultAlt)
    }
    setShowPresetsDropdown(false)
  }

  const categories = ['Semua', ...Array.from(new Set(SEGIA_IMAGE_PRESETS.map((p) => p.category)))]
  const filteredPresets =
    presetCategory === 'Semua'
      ? SEGIA_IMAGE_PRESETS
      : SEGIA_IMAGE_PRESETS.filter((p) => p.category === presetCategory)

  const hasImage = Boolean(value && value.trim())

  return (
    <div className="space-y-3.5 p-4 rounded-2xl bg-[#141414] border border-white/10 hover:border-white/15 transition-all shadow-lg">
      {/* Header Label, SEO Status & Aspect Ratio Switcher */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#FFD600]" />
            <span className="text-xs font-mono font-semibold text-white">
              {label} {required && <span className="text-rose-400">*</span>}
            </span>

            {/* SEO Alt Status Indicator */}
            {hasImage && (
              altText && altText.trim().length > 3 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
                  <Check className="w-2.5 h-2.5" /> Alt Text Siap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium animate-pulse">
                  <Info className="w-2.5 h-2.5" /> Isi Alt Text
                </span>
              )
            )}
          </div>
          {description && (
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Aspect Ratio Switcher for Previewing */}
        {hasImage && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono">
            {(['16/9', '16/10', '4/3', '1/1'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setPreviewAspect(ratio)}
                title={`Pratinjau Aspek Rasio ${ratio}`}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  previewAspect === ratio
                    ? 'bg-[#FFD600] text-[#191919] font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visual Image Preview Box with Drag & Drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl overflow-hidden border transition-all duration-300 bg-black/60 group ${
          isDragOver
            ? 'border-[#FFD600] ring-2 ring-[#FFD600]/50 scale-[1.01]'
            : 'border-white/10 hover:border-white/25'
        }`}
      >
        {hasImage ? (
          <div
            className={`relative w-full transition-all duration-300 ${
              previewAspect === '16/9'
                ? 'aspect-[16/9]'
                : previewAspect === '16/10'
                ? 'aspect-[16/10]'
                : previewAspect === '4/3'
                ? 'aspect-[4/3]'
                : 'aspect-square max-h-56'
            }`}
          >
            <Image
              src={value}
              alt={altText || label}
              fill
              className="object-cover object-top transition-transform group-hover:scale-105 duration-500"
              sizes="400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-80 group-hover:opacity-95 transition-opacity pointer-events-none" />

            {/* Quick Action Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1 shadow-md">
                <Check className="w-3 h-3" />
                Gambar Terpasang
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="p-1 rounded-lg bg-black/80 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors border border-white/10 shadow-md flex items-center gap-1 text-[10px] px-1.5 font-mono"
                  title="Salin URL Gambar"
                >
                  {copiedUrl ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1 rounded-lg bg-black/80 hover:bg-rose-500/80 text-white/80 hover:text-white transition-colors border border-white/10 shadow-md"
                  title="Hapus Gambar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Overlay Info */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white/90 z-10">
              <span className="truncate max-w-[200px] text-neutral-300">{value}</span>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#FFD600] inline-flex items-center gap-1 text-[10px] bg-black/60 px-2 py-0.5 rounded border border-white/10"
              >
                <span>Lihat Asli</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="aspect-[16/9] w-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent group-hover:border-[#FFD600]/40 transition-colors">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-2 group-hover:scale-105 group-hover:border-[#FFD600]/40 group-hover:text-[#FFD600] transition-all">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-neutral-300">Tarik &amp; Lepaskan Gambar ke Sini</p>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-xs leading-relaxed">
              Atau klik tombol di bawah untuk unggah file, buka pustaka media, atau pakai preset karya.
            </p>
          </div>
        )}

        {/* Uploading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20 text-white">
            <RefreshCw className="w-6 h-6 animate-spin text-[#FFD600]" />
            <span className="text-xs font-mono text-neutral-300">Mengunggah ke server...</span>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs font-mono text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
          {uploadError}
        </p>
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id={`file-upload-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono inline-flex items-center justify-center gap-1.5 border border-white/10 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-[#FFD600]" />
          <span>Unggah File</span>
        </button>

        {/* Media Picker Button */}
        <button
          type="button"
          onClick={() => setShowMediaPicker(true)}
          className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono inline-flex items-center justify-center gap-1.5 border border-white/10 transition-colors shadow-sm"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>Pustaka Media</span>
        </button>

        {/* Presets Button with Drawer */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
            className="py-2 px-3 rounded-xl bg-[#FFD600]/15 hover:bg-[#FFD600]/25 text-[#FFD600] text-xs font-mono inline-flex items-center gap-1.5 border border-[#FFD600]/40 transition-colors shadow-sm font-semibold"
            title="Pilih gambar studi kasus nyata UNIMASI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Karya</span>
          </button>

          {showPresetsDropdown && (
            <div className="absolute right-0 bottom-full mb-2 w-80 rounded-2xl bg-[#1C1C1C] border border-white/15 shadow-2xl p-3 z-50 space-y-2.5 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[11px] font-mono text-[#FFD600] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Katalog Karya UNIMASI
                </span>
                <button
                  type="button"
                  onClick={() => setShowPresetsDropdown(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1 pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategory(cat)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                      presetCategory === cat
                        ? 'bg-[#FFD600] text-[#191919] font-bold'
                        : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Preset Cards List */}
              <div className="space-y-1.5">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full p-2 rounded-xl text-left hover:bg-white/10 transition-colors flex items-center gap-2.5 group border border-transparent hover:border-white/10"
                  >
                    <div className="relative w-12 h-8 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10">
                      <Image
                        src={preset.url}
                        alt={preset.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="truncate flex-1">
                      <span className="text-xs font-semibold text-white block truncate group-hover:text-[#FFD600] transition-colors">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 block truncate">
                        {preset.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual URL Input */}
      <div>
        <label className="block text-[11px] font-mono text-neutral-400 mb-1">
          Path / URL Gambar:
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/portfolio/nama-file.png atau https://..."
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#FFD600] transition-colors"
        />
      </div>

      {/* Alt Text Input (Crucial for SEO & Accessibility) */}
      {onChangeAltText && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-mono text-neutral-300 flex items-center gap-1">
              <span>Alt Text (SEO &amp; Aksesibilitas)</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] font-mono text-neutral-400">
              Wajib untuk indeks Google Gambar
            </span>
          </div>
          <input
            type="text"
            value={altText || ''}
            onChange={(e) => onChangeAltText(e.target.value)}
            placeholder="Deskripsikan gambar dengan jelas untuk mesin pencari..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FFD600] transition-colors"
          />
        </div>
      )}

      {/* Caption Input (Optional) */}
      {showCaptionInput && onChangeCaption && (
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 mb-1">
            Keterangan Gambar (Caption di Bawah Visual):
          </label>
          <input
            type="text"
            value={caption || ''}
            onChange={(e) => onChangeCaption(e.target.value)}
            placeholder="Contoh: Implementasi antarmuka pada layar tablet dan desktop..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FFD600] transition-colors"
          />
        </div>
      )}

      {/* Caption Input (Optional) */}
      {showCaptionInput && onChangeCaption && (
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 mb-1">
            Keterangan Gambar (Caption di Bawah Visual):
          </label>
          <input
            type="text"
            value={caption || ''}
            onChange={(e) => onChangeCaption(e.target.value)}
            placeholder="Contoh: Implementasi antarmuka pada layar tablet dan desktop..."
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#FFD600]"
          />
        </div>
      )}

      {/* Modal Media Picker */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(selectedUrl) => {
          onChange(selectedUrl)
          setShowMediaPicker(false)
        }}
        currentUrl={value}
        title={`Pilih Media untuk ${label}`}
      />
    </div>
  )
}
