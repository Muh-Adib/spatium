'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  X,
  FileText,
  Sliders,
  Check,
} from 'lucide-react'
import { getStoredAiCredentials, triggerAiKeyPrompt } from '@/lib/ai/key-manager'

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
  const [aiSuggesting, setAiSuggesting] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/media?filter=${filter}&search=${encodeURIComponent(search)}&pageSize=48`)
      const json = await res.json()
      if (json.data) {
        setItems(json.data)
      }
    } catch (err) {
      console.error('Failed to load media:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAudit = async () => {
    setAuditLoading(true)
    try {
      const res = await fetch('/api/media?action=audit')
      const json = await res.json()
      if (json.data) {
        setAuditReport(json.data)
      }
    } catch (err) {
      console.error('Failed to load media audit:', err)
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
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fd = new FormData()
        fd.append('file', file)
        await fetch('/api/media', {
          method: 'POST',
          body: fd,
        })
      }
      await fetchMedia()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveMetadata = async () => {
    if (!selectedMedia) return
    setSaving(true)
    setSaveSuccess(false)
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
      if (json.data) {
        setSelectedMedia(json.data)
        setItems((prev) => prev.map((m) => (m.id === json.data.id ? json.data : m)))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to update media:', err)
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
      if (json.data) {
        setSelectedMedia(json.data)
        setNewFileName(json.data.fileName)
        setRenameWarning(null)
        setItems((prev) => prev.map((m) => (m.id === json.data.id ? json.data : m)))
        setSaveSuccess(true)
      }
    } catch (err) {
      console.error('Rename failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAiAlt = async (targetLocale: 'id' | 'en') => {
    if (!selectedMedia) return
    const creds = getStoredAiCredentials()
    if (!creds.hasKey) {
      triggerAiKeyPrompt({
        featureName: 'Generator Alt Text Gambar (AI)',
        reason: 'Silakan tambahkan API Key Google AI Studio atau OpenRouter Anda untuk membuat Alt Text gambar secara otomatis dengan AI.',
        provider: creds.provider,
        onSuccess: () => {
          handleGenerateAiAlt(targetLocale)
        },
      })
      return
    }

    setAiSuggesting(true)
    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'altText',
          title: title || selectedMedia.fileName,
          locale: targetLocale,
          extraParams: { fileName: selectedMedia.fileName },
          aiConfig: {
            provider: creds.provider,
            apiKey: creds.apiKey,
            model: creds.model,
            proxyUrl: creds.proxyUrl,
          },
        }),
      })
      const json = await res.json()
      if (json.needsKey) {
        triggerAiKeyPrompt({
          featureName: 'Generator Alt Text Gambar (AI)',
          reason: 'Kunci API belum diisi atau tidak valid. Silakan periksa kembali API Key Anda.',
          provider: creds.provider,
        })
        return
      }
      const val = json.data?.value || json.value || json.altText
      if (val) {
        if (targetLocale === 'id') setAltId(val)
        else setAltEn(val)
      }
    } catch (err) {
      console.error('AI Alt suggestion error:', err)
    } finally {
      setAiSuggesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Media Library ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
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
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-sky-400 hover:to-blue-500 transition-all shadow-md disabled:opacity-50"
          >
            {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/60 border border-white/5 p-3 rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari media berdasarkan nama file, URL, atau alt text..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-black/40 border border-white/10 rounded-lg text-sm text-neutral-300 px-3 py-1.5 focus:outline-none focus:border-sky-500/50"
              >
                <option value="all">Semua Media</option>
                <option value="missing_alt">Tanpa Alt Text (Wajib)</option>
                <option value="oversized">Ukuran Besar (&gt;800 KB)</option>
                <option value="unused">Belum Digunakan</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                title="Tampilan Grid"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg border transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                title="Tampilan List"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Items Grid / List */}
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
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
                  <div
                    key={item.id}
                    onClick={() => openDrawer(item)}
                    className="group relative bg-neutral-900/80 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-sky-500/50 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square relative bg-neutral-950 flex items-center justify-center overflow-hidden">
                      <Image
                        src={item.url}
                        alt={item.altText?.id || item.fileName}
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={item.url.endsWith('.svg')}
                      />

                      {missingAlt && (
                        <div className="absolute top-2 right-2 bg-rose-500/90 text-white p-1 rounded-md shadow-md" title="Alt text belum lengkap">
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
                  </div>
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
                          <Image src={item.url} alt={item.fileName} fill className="object-cover" />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-sky-300">{item.fileName}</td>
                      <td className="py-2.5 px-4">
                        {item.altText?.id ? (
                          <span className="text-neutral-200 truncate max-w-[200px] block">{item.altText.id}</span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-mono text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> Wajib diisi
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
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <div className="text-xs font-mono text-sky-300">Nama File Kurang Deskriptif</div>
                  <div className="text-2xl font-bold text-sky-400 mt-1">{auditReport.badFilenameCount}</div>
                </div>
              </div>

              {/* Issues List */}
              <div className="bg-neutral-900/70 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Daftar Masalah Audit Media</h3>
                  <button
                    onClick={fetchAudit}
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
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
                          } catch {}
                        }}
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

      {/* Media Detail Drawer / Side Panel (Section 5.2 & 5.3) */}
      {selectedMedia && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-neutral-950 border-l border-white/10 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Detail &amp; Metadata SEO Gambar</h3>
            <button
              onClick={() => setSelectedMedia(null)}
              className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Image Preview */}
            <div className="aspect-video relative rounded-xl overflow-hidden bg-black/60 border border-white/10">
              <Image
                src={selectedMedia.url}
                alt={altId || selectedMedia.fileName}
                fill
                className="object-contain"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-neutral-900/60 p-2.5 rounded-lg border border-white/5">
              <div>
                <span className="text-neutral-500 block">Ukuran</span>
                <span className="text-neutral-300 font-semibold">{Math.round((selectedMedia.size || 0) / 1024)} KB</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Resolusi</span>
                <span className="text-neutral-300 font-semibold">{selectedMedia.width}×{selectedMedia.height}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Format</span>
                <span className="text-neutral-300 font-semibold">{selectedMedia.mimeType?.split('/')[1]?.toUpperCase() || 'WEBP'}</span>
              </div>
            </div>

            {/* Rename File with Auto 301 Redirect (Section 5.3) */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-400 uppercase">Nama File (Slug-Friendly URL)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleRename}
                  disabled={saving || newFileName === selectedMedia.fileName}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                >
                  Rename &amp; 301
                </button>
              </div>
              {renameWarning && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                  <p>{renameWarning}</p>
                  <button
                    onClick={() => {
                      setRenameWarning(null)
                      handleRename()
                    }}
                    className="mt-2 px-2.5 py-1 bg-amber-500 text-black font-semibold rounded text-[11px]"
                  >
                    Lanjutkan Rename &amp; Update Referensi
                  </button>
                </div>
              )}
            </div>

            {/* Alt Text ID (Mandatory per Section 3.4 & 16.4) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-neutral-400 uppercase flex items-center gap-1.5">
                  <span>Alt Text [ID]</span>
                  <span className="text-rose-400 font-bold">*Wajib</span>
                </label>
                <button
                  onClick={() => handleGenerateAiAlt('id')}
                  disabled={aiSuggesting}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Saran AI Vision</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={altId}
                onChange={(e) => setAltId(e.target.value)}
                placeholder="Deskripsi gambar untuk pembaca tuna netra & SEO Google Gambar..."
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-sky-500 resize-none"
              />
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Maksimal 125 karakter</span>
                <span>{altId.length}/125</span>
              </div>
            </div>

            {/* Alt Text EN (Multi-language per Section 16.4) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-neutral-400 uppercase">Alt Text [EN]</label>
                <button
                  onClick={() => handleGenerateAiAlt('en')}
                  disabled={aiSuggesting}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Saran AI Vision (EN)</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={altEn}
                onChange={(e) => setAltEn(e.target.value)}
                placeholder="Image description in English..."
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            {/* Title & Caption */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-400 uppercase">Caption / Keterangan Gambar</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Teks keterangan yang tampil di bawah gambar..."
                className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Decorative Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="dec_check"
                checked={decorative}
                onChange={(e) => setDecorative(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-sky-500 focus:ring-0"
              />
              <label htmlFor="dec_check" className="text-xs text-neutral-300 select-none cursor-pointer">
                Tandai sebagai elemen dekoratif semata (alt=&quot;&quot; valid)
              </label>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-neutral-900/40 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Metadata disimpan!
              </span>
            ) : (
              <span className="text-xs text-neutral-500">ID: {selectedMedia.id}</span>
            )}

            <button
              onClick={handleSaveMetadata}
              disabled={saving}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold transition-all shadow-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Metadata'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
