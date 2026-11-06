'use client'

import React, { useState, useEffect, useCallback, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Upload,
  Link2,
  Search,
  X,
  Check,
  Folder,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileImage,
} from 'lucide-react'

export interface MediaItem {
  url: string
  name: string
  size: number
  type: string
  modifiedAt: string
}

interface MediaPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string, item?: MediaItem) => void
  currentUrl?: string
  title?: string
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
  title = 'Pilih Media Visual & Cover',
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library')
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState<'all' | 'uploads' | 'articles' | 'brand'>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MediaItem[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 32, totalPages: 1 })
  const [selectedUrl, setSelectedUrl] = useState<string>(currentUrl || '')

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [customUrlInput, setCustomUrlInput] = useState('')

  // Fetch library items
  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '32',
        folder,
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/upload?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.items || [])
        setPagination(data.pagination || { total: 0, page: 1, limit: 32, totalPages: 1 })
      }
    } catch (err) {
      console.error('Failed to load media:', err)
    } finally {
      setLoading(false)
    }
  }, [page, folder, search])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Native modal dialog: showModal() traps focus and makes the page inert;
  // focus returns to the opener when the picker closes.
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!isOpen || !mounted) return
    const dialog = dialogRef.current
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
      if (opener?.isConnected) opener.focus()
    }
  }, [isOpen, mounted])

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(currentUrl || '')
      fetchMedia()
    }
  }, [isOpen, fetchMedia, currentUrl])


  if (!isOpen || !mounted) return null

  // Handle direct file upload
  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengunggah gambar.')
      }

      setUploadSuccess(`Gambar "${file.name}" berhasil diunggah!`)
      setSelectedUrl(data.url)
      // Refresh library & switch to library view
      fetchMedia()
      setTimeout(() => {
        const uploadedItem: MediaItem = {
          url: data.url,
          name: file.name,
          size: file.size,
          type: file.type,
          modifiedAt: new Date().toISOString(),
        }
        onSelect(data.url, uploadedItem)
        onClose()
      }, 600)
    } catch (err: any) {
      setUploadError(err.message || 'Terjadi kesalahan saat upload.')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const handleConfirmSelect = () => {
    if (selectedUrl) {
      const selectedItem = items.find((it) => it.url === selectedUrl)
      onSelect(selectedUrl, selectedItem)
      onClose()
    }
  }

  const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400'

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-auto w-[calc(100vw-1.5rem)] max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[var(--studio-bg)] p-0 text-neutral-200 shadow-2xl backdrop:bg-black/80"
    >
      <div className="relative flex h-[90dvh] max-h-[820px] w-full flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-500/15 text-accent-400 flex items-center justify-center border border-accent-500/20">
              <ImageIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id={titleId} className="text-sm sm:text-base font-bold text-white tracking-wide">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                Pustaka Media Digital SPATIUM ({pagination.total} Aset Tersedia)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nav Tabs */}
            <div role="group" aria-label="Sumber gambar" className="flex flex-wrap items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs font-mono">
              <button
                type="button"
                aria-pressed={activeTab === 'library'}
                onClick={() => setActiveTab('library')}
                className={`${focusRing} px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'library'
                    ? 'bg-accent-500 text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Pustaka Media</span>
              </button>
              <button
                type="button"
                aria-pressed={activeTab === 'upload'}
                onClick={() => setActiveTab('upload')}
                className={`${focusRing} px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-accent-500 text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Baru</span>
              </button>
              <button
                type="button"
                aria-pressed={activeTab === 'url'}
                onClick={() => setActiveTab('url')}
                className={`${focusRing} px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'url'
                    ? 'bg-accent-500 text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Input URL</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className={`${focusRing} w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-colors border border-white/10 ml-2`}
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[var(--studio-bg)]">
          {/* TAB 1: LIBRARY */}
          {activeTab === 'library' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Filter & Search Bar */}
              <div className="px-6 py-3 border-b border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Kategori" className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider font-semibold" aria-hidden="true">
                    Kategori:
                  </span>
                  {(['all', 'uploads', 'articles', 'brand'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={folder === cat}
                      onClick={() => {
                        setFolder(cat)
                        setPage(1)
                      }}
                      className={`${focusRing} text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        folder === cat
                          ? 'bg-white/15 text-white border-white/30 font-bold'
                          : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat === 'all'
                        ? 'Semua'
                        : cat === 'uploads'
                        ? 'Uploads'
                        : cat === 'articles'
                        ? 'Artikel'
                        : 'Brand'}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative min-w-[min(240px,100%)] flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Cari gambar"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Cari nama gambar atau slug..."
                    className="w-full pl-8 pr-7 py-1.5 text-base sm:text-xs rounded-xl bg-black/50 border border-white/15 text-white placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="Hapus pencarian"
                      onClick={() => setSearch('')}
                      className={`${focusRing} absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white`}
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Images */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3 text-neutral-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-accent-400" />
                    <span className="text-xs font-mono">Memuat aset gambar...</span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3 text-neutral-500">
                    <FileImage className="w-10 h-10 text-neutral-600 stroke-[1.5]" />
                    <p className="text-xs font-mono">Tidak ada gambar yang cocok dengan filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                    {items.map((item) => {
                      const isSelected = selectedUrl === item.url
                      return (
                        <button
                          key={item.url}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={item.name}
                          onClick={() => setSelectedUrl(item.url)}
                          onDoubleClick={() => {
                            onSelect(item.url, item)
                            onClose()
                          }}
                          className={`${focusRing} group relative aspect-[16/10] rounded-xl overflow-hidden border text-left transition-all ${
                            isSelected
                              ? 'ring-2 ring-accent-400 border-accent-400 motion-safe:scale-[1.02] shadow-lg shadow-accent-500/10'
                              : 'border-white/10 hover:border-white/30 bg-black/40'
                          }`}
                        >
                          <Image
                            src={item.url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                            className="object-cover motion-safe:group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-300"
                            loading="lazy"
                          />

                          {/* Selected Overlay Indicator */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-accent-500/25 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-accent-500 text-black flex items-center justify-center shadow-lg font-bold">
                                <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                              </div>
                            </div>
                          )}

                          {/* Hover Details Bar */}
                          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                            <p className="text-[10px] font-mono text-white truncate font-medium">
                              {item.name}
                            </p>
                            <p className="text-[9px] font-mono text-neutral-400">
                              {formatFileSize(item.size)} • {item.type}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>
                    Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} item)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Sebelumnya</span>
                    </button>
                    <button
                      type="button"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD BARU */}
          {activeTab === 'upload' && (
            <div className="flex-1 p-8 flex flex-col items-center justify-center">
              <div className="w-full max-w-xl p-8 rounded-3xl border-2 border-dashed border-white/20 hover:border-accent-400/60 bg-black/30 text-center transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/15 text-accent-400 border border-accent-500/20 flex items-center justify-center mx-auto mb-4">
                  <Upload className={`w-8 h-8 ${uploading ? 'motion-safe:animate-bounce' : ''}`} aria-hidden="true" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  {uploading ? 'Mengunggah Gambar ke Server...' : 'Pilih atau Drag File Gambar'}
                </h4>
                <p className="text-xs text-neutral-400 mb-6 font-mono max-w-sm mx-auto leading-relaxed">
                  Mendukung format WebP, AVIF, PNG, JPG, dan GIF. Otomatis disimpan dan dioptimasi di server SPATIUM.
                </p>

                {uploadError && (
                  <div role="alert" className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-mono">
                    {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                    {uploadSuccess}
                  </div>
                )}

                <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-300 text-black font-bold text-xs cursor-pointer shadow-lg focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-400">
                  <Upload className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  <span>Pilih File dari Komputer</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: INPUT URL LANGSUNG */}
          {activeTab === 'url' && (
            <div className="flex-1 p-8 flex flex-col items-center justify-center">
              <div className="w-full max-w-lg p-6 rounded-3xl bg-black/40 border border-white/15 space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                  <Link2 className="w-4 h-4 text-accent-400" />
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Gunakan URL Gambar Kustom
                  </h4>
                </div>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                  Masukkan path lokal (misal: <code className="text-accent-300">/images/articles/web-architecture.jpg</code>) atau URL eksternal HTTPS yang valid.
                </p>
                <input
                  type="text"
                  inputMode="url"
                  aria-label="URL gambar"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value)
                    setSelectedUrl(e.target.value)
                  }}
                  placeholder="https://contoh.com/gambar-cover.jpg atau /uploads/..."
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-base sm:text-xs font-mono text-white placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
                />

                {/* Mini Preview */}
                {customUrlInput && (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                    {/* Plain <img>: arbitrary external URL; decorative preview of the URL typed above. */}
                    <img src={customUrlInput} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {selectedUrl ? (
              <div className="flex items-center gap-2.5">
                <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0">
                  {/* Plain <img>: the selection may be an arbitrary URL. */}
                  <img src={selectedUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="text-xs min-w-0 max-w-[320px] font-mono [overflow-wrap:anywhere]">
                  <span className="text-neutral-400 block text-[10px]">Terpilih:</span>
                  <span className="text-white font-medium block">{selectedUrl}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-neutral-500 font-mono">Belum ada gambar yang dipilih.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`${focusRing} px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-mono font-medium transition-colors`}
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={handleConfirmSelect}
              className={`${focusRing} px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-300 text-black font-bold text-xs font-sans transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md`}
            >
              Gunakan Gambar Ini
            </button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
