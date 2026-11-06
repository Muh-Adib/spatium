'use client'

import React, { useState, useEffect, useRef } from 'react'
import { EditorDialog, dialogButton } from '@/components/studio/editor/EditorDialog'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  AlertTriangle,
  Info,
  RefreshCw,
  Trash2,
  Layers,
  FileText,
  Check,
} from 'lucide-react'

interface MediaItem {
  id: number
  fileName: string
  url: string
  altText: { id: string; en: string }
  title?: string
  caption?: string
  description?: string
  decorative?: boolean
  focalPoint?: { x: number; y: number }
  credit?: string
  width?: number
  height?: number
  size?: number
  mimeType?: string
  usedIn?: string[]
  createdAt?: string
  updatedAt?: string
}

interface MediaAuditReport {
  totalScanned: number
  missingAltCount: number
  oversizedCount: number
  badFilenameCount: number
  unusedCount: number
  issues: Array<{
    id: string
    mediaId: number
    url: string
    fileName: string
    type: string
    severity: 'critical' | 'warning' | 'info'
    message: string
  }>
  scannedAt: string
}

/** First readable error from an API body (`errors: string[]`, `error`, or `message`). */
function errorText(json: unknown, fallback: string): string {
  if (json && typeof json === 'object') {
    const b = json as { errors?: unknown; error?: unknown; message?: unknown }
    if (Array.isArray(b.errors) && typeof b.errors[0] === 'string') return b.errors.join(' ')
    if (typeof b.message === 'string') return b.message
    if (typeof b.error === 'string') return b.error
  }
  return fallback
}

export function StudioMediaManager() {
  const [activeTab, setActiveTab] = useState<'library' | 'audit'>('library')
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'missing_alt' | 'unused' | 'oversized'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [auditReport, setAuditReport] = useState<MediaAuditReport | null>(null)
  const [auditLoading, setAuditLoading] = useState<boolean>(false)

  // Drawer edit state
  const [altId, setAltId] = useState<string>('')
  const [altEn, setAltEn] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [caption, setCaption] = useState<string>('')
  const [decorative, setDecorative] = useState<boolean>(false)
  const [newFileName, setNewFileName] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [renameWarning, setRenameWarning] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  /** Library-level feedback (load / upload), announced via role=status or alert. */
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  /** Drawer-level error (save / rename / delete). */
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/media?filter=${filter}&search=${encodeURIComponent(search)}&pageSize=48`)
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setItems(json.data)
      } else {
        setNotice({ tone: 'error', text: errorText(json, 'Gagal memuat media.') })
      }
    } catch (err) {
      console.error('Failed to load media:', err)
      setNotice({ tone: 'error', text: 'Tidak dapat terhubung ke server untuk memuat media.' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAudit = async () => {
    setAuditLoading(true)
    try {
      const res = await fetch('/api/media?action=audit')
      const json = await res.json()
      if (res.ok && json.data) {
        setAuditReport(json.data)
      } else {
        setNotice({ tone: 'error', text: errorText(json, 'Gagal menjalankan audit media.') })
      }
    } catch (err) {
      console.error('Failed to load media audit:', err)
      setNotice({ tone: 'error', text: 'Tidak dapat terhubung ke server untuk audit media.' })
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [filter, search])

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAudit()
    }
  }, [activeTab])

  const openDrawer = (item: MediaItem) => {
    setSelectedMedia(item)
    setAltId(item.altText?.id || '')
    setAltEn(item.altText?.en || '')
    setTitle(item.title || '')
    setCaption(item.caption || '')
    setDecorative(Boolean(item.decorative))
    setNewFileName(item.fileName)
    setRenameWarning(null)
    setSaveSuccess(false)
    setDrawerError(null)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setNotice(null)
    const failed: string[] = []
    let uploaded = 0
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fd = new FormData()
        fd.append('file', file)
        try {
          const res = await fetch('/api/media', { method: 'POST', body: fd })
          const json = await res.json().catch(() => ({}))
          if (res.ok) uploaded++
          else failed.push(`${file.name}: ${errorText(json, 'gagal diunggah.')}`)
        } catch (err) {
          console.error('Upload failed:', err)
          failed.push(`${file.name}: tidak dapat terhubung ke server.`)
        }
      }
      await fetchMedia()
      setNotice(
        failed.length > 0
          ? { tone: 'error', text: `${uploaded} file terunggah, ${failed.length} gagal. ${failed.join(' ')}` }
          : { tone: 'success', text: `${uploaded} file berhasil diunggah. Lengkapi alt text sebelum dipakai.` }
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveMetadata = async () => {
    if (!selectedMedia) return
    setSaving(true)
    setSaveSuccess(false)
    setDrawerError(null)
    try {
      const res = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMedia.id,
          altText: { id: altId, en: altEn },
          title,
          caption,
          decorative,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setSelectedMedia(json.data)
        setItems((prev) => prev.map((m) => (m.id === json.data.id ? json.data : m)))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setDrawerError(errorText(json, 'Gagal menyimpan metadata.'))
      }
    } catch (err) {
      console.error('Failed to update media:', err)
      setDrawerError('Tidak dapat terhubung ke server. Metadata belum disimpan.')
    } finally {
      setSaving(false)
    }
  }

  const handleRename = async () => {
    if (!selectedMedia || !newFileName || newFileName === selectedMedia.fileName) return
    if ((selectedMedia.usedIn?.length || 0) > 0 && !renameWarning) {
      setRenameWarning(
        `Gambar ini digunakan di ${selectedMedia.usedIn?.length} artikel/konten. Mengubah nama file akan memperbarui referensi dan mendaftarkan 301 redirect otomatis.`
      )
      return
    }

    setSaving(true)
    setDrawerError(null)
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          id: selectedMedia.id,
          newFileName,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setSelectedMedia(json.data)
        setNewFileName(json.data.fileName)
        setRenameWarning(null)
        setItems((prev) => prev.map((m) => (m.id === json.data.id ? json.data : m)))
        setSaveSuccess(true)
      } else {
        setDrawerError(errorText(json, 'Gagal mengganti nama file.'))
      }
    } catch (err) {
      console.error('Rename failed:', err)
      setDrawerError('Tidak dapat terhubung ke server. Nama file belum diganti.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMedia) return
    const used = selectedMedia.usedIn?.length || 0
    const warning = used > 0 ? ` Gambar ini tercatat dipakai di ${used} konten.` : ''
    if (!window.confirm(`Hapus "${selectedMedia.fileName}" secara permanen?${warning}`)) return
    setDeleting(true)
    setDrawerError(null)
    try {
      const res = await fetch(`/api/media?id=${selectedMedia.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        const name = selectedMedia.fileName
        setItems((prev) => prev.filter((m) => m.id !== selectedMedia.id))
        setSelectedMedia(null)
        setNotice({ tone: 'success', text: `"${name}" dihapus.` })
      } else {
        setDrawerError(errorText(json, 'Gagal menghapus media.'))
      }
    } catch (err) {
      console.error('Delete failed:', err)
      setDrawerError('Tidak dapat terhubung ke server. Media belum dihapus.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={activeTab === 'library'}
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-info/20 text-info-300 border border-info/30 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Media Library ({items.length})
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'audit'}
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            Audit Media {auditReport && `(${auditReport.issues.length})`}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            multiple
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-info to-blue-600 text-white rounded-lg text-sm font-medium hover:from-info-400 hover:to-blue-500 transition-all shadow-md disabled:opacity-50"
          >
            {isUploading ? <RefreshCw className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
            <span>{isUploading ? 'Mengunggah…' : 'Upload Media'}</span>
          </button>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {notice?.tone === 'success' && (
          <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-xs text-emerald-100">{notice.text}</p>
        )}
      </div>
      {notice?.tone === 'error' && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-100">
          <p>{notice.text}</p>
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 underline">
            Tutup
          </button>
        </div>
      )}

      {activeTab === 'library' ? (
        <>
          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/60 border border-white/5 p-3 rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Cari media"
                  placeholder="Cari media berdasarkan nama file, URL, atau alt text..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-accent-500/50"
                />
              </div>

              <select
                aria-label="Filter media"
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'missing_alt' | 'unused' | 'oversized')}
                className="bg-black/40 border border-white/10 rounded-lg text-sm text-neutral-300 px-3 py-1.5 focus:outline-none focus:border-accent-500/50"
              >
                <option value="all">Semua Media</option>
                <option value="missing_alt">Tanpa Alt Text (Wajib)</option>
                <option value="oversized">Ukuran Besar (&gt;800 KB)</option>
                <option value="unused">Belum Digunakan</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Tampilan grid"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                title="Tampilan Grid"
              >
                <Layers className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Tampilan list"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg border transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                title="Tampilan List"
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Media Items Grid / List */}
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-info animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-400">Memuat berkas media...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-900/30">
              <ImageIcon className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
              <p className="text-sm text-neutral-300 font-medium">Tidak ada berkas media ditemukan</p>
              <p className="text-xs text-neutral-500 mt-1">Upload gambar atau sesuaikan filter pencarian Anda.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((item) => {
                const missingAlt = !item.decorative && (!item.altText?.id || !item.altText?.en)
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => openDrawer(item)}
                    aria-label={`${item.fileName}${missingAlt ? ' — alt text belum lengkap' : ''}. Buka detail`}
                    className="group relative block w-full text-left bg-neutral-900/80 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-info/50 hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
                  >
                    <div className="aspect-square relative bg-neutral-950 flex items-center justify-center overflow-hidden">
                      <Image
                        src={item.url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-cover motion-safe:group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-300"
                        unoptimized={item.url.endsWith('.svg')}
                      />

                      {missingAlt && (
                        <div className="absolute top-2 right-2 bg-rose-500/90 text-white p-1 rounded-md shadow-md" title="Alt text belum lengkap" aria-hidden="true">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="p-2.5">
                      <p className="text-xs font-medium text-neutral-200 truncate" title={item.fileName}>
                        {item.fileName}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1">
                        <span>{item.size ? `${Math.round(item.size / 1024)} KB` : 'WebP'}</span>
                        <span>{item.width && item.height ? `${item.width}×${item.height}` : ''}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="bg-neutral-900/70 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-black/40 text-neutral-400 font-mono text-[11px] uppercase border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Pratinjau</th>
                    <th className="py-3 px-4">Nama File</th>
                    <th className="py-3 px-4">Alt Text (ID)</th>
                    <th className="py-3 px-4">Alt Text (EN)</th>
                    <th className="py-3 px-4">Dimensi / Ukuran</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openDrawer(item)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-black/60">
                          <Image src={item.url} alt="" fill sizes="40px" className="object-cover" unoptimized={item.url.endsWith('.svg')} />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-info-300">{item.fileName}</td>
                      <td className="py-2.5 px-4">
                        {item.altText?.id ? (
                          <span className="text-neutral-200 truncate max-w-[200px] block">{item.altText.id}</span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-mono text-[11px]">
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Wajib diisi
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {item.altText?.en ? (
                          <span className="text-neutral-200 truncate max-w-[200px] block">{item.altText.en}</span>
                        ) : (
                          <span className="text-amber-400 font-mono text-[11px]">Belum diisi</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-neutral-400">
                        {item.width}×{item.height} ({item.size ? Math.round(item.size / 1024) : 0} KB)
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openDrawer(item)
                          }}
                          type="button"
                          aria-label={`Detail ${item.fileName}`}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-neutral-200 rounded-md transition-all text-xs"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Media Audit Tab (Section 5.5) */
        <div className="space-y-6">
          {auditLoading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-400">Menjalankan audit media lengkap...</p>
            </div>
          ) : auditReport ? (
            <>
              {/* Audit Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5">
                  <div className="text-xs font-mono text-neutral-400">Total Berkas Dipindai</div>
                  <div className="text-2xl font-bold text-white mt-1">{auditReport.totalScanned}</div>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-xs font-mono text-rose-300">Tanpa Alt Text (Kritis)</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{auditReport.missingAltCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs font-mono text-amber-300">Ukuran Besar (&gt;800 KB)</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{auditReport.oversizedCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                  <div className="text-xs font-mono text-info-300">Nama File Kurang Deskriptif</div>
                  <div className="text-2xl font-bold text-info mt-1">{auditReport.badFilenameCount}</div>
                </div>
              </div>

              {/* Issues List */}
              <div className="bg-neutral-900/70 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Daftar Masalah Audit Media</h3>
                  <button
                    type="button"
                    onClick={fetchAudit}
                    className="flex items-center gap-1.5 text-xs text-info hover:text-info-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Pindai Ulang</span>
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {auditReport.issues.map((iss) => (
                    <div key={iss.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3">
                        {iss.severity === 'critical' ? (
                          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg mt-0.5">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg mt-0.5">
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-neutral-200">{iss.message}</p>
                          <p className="text-xs font-mono text-neutral-500 mt-0.5">{iss.url}</p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/media?id=${iss.mediaId}`)
                            const json = await res.json()
                            if (json.data) {
                              setActiveTab('library')
                              openDrawer(json.data)
                            }
                          } catch (err) {
                            console.warn('[media] opening audit item failed:', err)
                            setNotice({ tone: 'error', text: 'Tidak dapat membuka media ini.' })
                          }
                        }}
                        type="button"
                        aria-label={`Perbaiki ${iss.fileName}`}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-neutral-200 rounded-md text-xs font-medium transition-all"
                      >
                        Perbaiki
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Media Detail Drawer (Section 5.2 & 5.3): modal sheet — focus trapped, Escape closes, focus returns. */}
      <EditorDialog
        open={selectedMedia !== null}
        onClose={() => setSelectedMedia(null)}
        variant="sheet"
        title="Detail & Metadata SEO Gambar"
        description={selectedMedia?.fileName}
        dismissible={!saving && !deleting}
        footer={
          selectedMedia ? (
            <>
              <span role="status" className="me-auto text-xs text-neutral-300">
                {saveSuccess ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <Check className="w-4 h-4" aria-hidden="true" /> Metadata disimpan.
                  </span>
                ) : (
                  `ID: ${selectedMedia.id}`
                )}
              </span>
              <button type="button" onClick={handleDelete} disabled={saving || deleting} className={dialogButton.danger}>
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {deleting ? 'Menghapus…' : 'Hapus'}
              </button>
              <button type="button" onClick={handleSaveMetadata} disabled={saving || deleting} className={dialogButton.primary}>
                {saving ? 'Menyimpan…' : 'Simpan Metadata'}
              </button>
            </>
          ) : null
        }
      >
        {selectedMedia && (
          <div className="space-y-6">
            {drawerError && (
              <p role="alert" className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-100">
                {drawerError}
              </p>
            )}

            {/* Image Preview */}
            <div className="aspect-video relative rounded-xl overflow-hidden bg-black/60 border border-white/10">
              <Image
                src={selectedMedia.url}
                alt={altId || selectedMedia.fileName}
                fill
                sizes="420px"
                className="object-contain"
                unoptimized={selectedMedia.url.endsWith('.svg')}
              />
            </div>

            {/* Quick Stats */}
            <dl className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-neutral-900/60 p-2.5 rounded-lg border border-white/5">
              <div>
                <dt className="text-neutral-400 block">Ukuran</dt>
                <dd className="text-neutral-200 font-semibold">{Math.round((selectedMedia.size || 0) / 1024)} KB</dd>
              </div>
              <div>
                <dt className="text-neutral-400 block">Resolusi</dt>
                <dd className="text-neutral-200 font-semibold">
                  {selectedMedia.width && selectedMedia.height ? `${selectedMedia.width}×${selectedMedia.height}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400 block">Format</dt>
                <dd className="text-neutral-200 font-semibold">{selectedMedia.mimeType?.split('/')[1]?.toUpperCase() || '—'}</dd>
              </div>
            </dl>

            {/* Rename File with Auto 301 Redirect (Section 5.3) */}
            <div className="space-y-2">
              <label htmlFor="media-rename" className="text-xs font-mono text-neutral-300 uppercase">
                Nama File (Slug-Friendly URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="media-rename"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  aria-describedby="media-rename-help"
                  className="min-w-0 flex-1 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-accent-500"
                />
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={saving || newFileName === selectedMedia.fileName}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                >
                  Rename &amp; 301
                </button>
              </div>
              <p id="media-rename-help" className="text-[11px] text-neutral-400">
                Ekstensi file tetap. URL lama dialihkan 301 ke URL baru.
              </p>
              {renameWarning && (
                <div role="alert" className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200">
                  <p>{renameWarning}</p>
                  <button
                    type="button"
                    onClick={() => handleRename()}
                    className="mt-2 px-2.5 py-1 bg-amber-500 text-black font-semibold rounded text-[11px]"
                  >
                    Lanjutkan Rename &amp; Update Referensi
                  </button>
                </div>
              )}
            </div>

            {/* Alt Text ID (Mandatory per Section 3.4 & 16.4) */}
            <div className="space-y-2">
              <label htmlFor="media-alt-id" className="text-xs font-mono text-neutral-300 uppercase flex items-center gap-1.5">
                <span>Alt Text [ID]</span>
                <span className="text-rose-300 font-bold">*Wajib</span>
              </label>
              <textarea
                id="media-alt-id"
                rows={2}
                value={altId}
                onChange={(e) => setAltId(e.target.value)}
                aria-describedby="media-alt-id-count"
                placeholder="Deskripsi gambar untuk pembaca tuna netra & SEO Google Gambar..."
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-accent-500 resize-none"
              />
              <div id="media-alt-id-count" className="flex justify-between text-[11px] text-neutral-400">
                <span>Ideal maksimal 125 karakter</span>
                <span>{altId.length}/125</span>
              </div>
            </div>

            {/* Alt Text EN (Multi-language per Section 16.4) */}
            <div className="space-y-2">
              <label htmlFor="media-alt-en" className="text-xs font-mono text-neutral-300 uppercase">
                Alt Text [EN]
              </label>
              <textarea
                id="media-alt-en"
                rows={2}
                value={altEn}
                onChange={(e) => setAltEn(e.target.value)}
                placeholder="Image description in English..."
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-accent-500 resize-none"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="media-title" className="text-xs font-mono text-neutral-300 uppercase">
                Judul Gambar
              </label>
              <input
                id="media-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-accent-500"
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <label htmlFor="media-caption" className="text-xs font-mono text-neutral-300 uppercase">
                Caption / Keterangan Gambar
              </label>
              <input
                id="media-caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Teks keterangan yang tampil di bawah gambar..."
                className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-accent-500"
              />
            </div>

            {/* Decorative Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="dec_check"
                checked={decorative}
                onChange={(e) => setDecorative(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-info"
              />
              <label htmlFor="dec_check" className="text-xs text-neutral-300 select-none cursor-pointer">
                Tandai sebagai elemen dekoratif semata (alt=&quot;&quot; valid)
              </label>
            </div>
          </div>
        )}
      </EditorDialog>
    </div>
  )
}
