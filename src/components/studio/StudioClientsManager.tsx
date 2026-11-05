'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Eye,
  X,
  Check,
} from 'lucide-react'

export interface ClientLogo {
  id: number
  name: string
  logoUrl: string
  altText?: string | null
  order?: number | null
  isActive?: boolean | null
  createdAt?: string
  updatedAt?: string
}

export function StudioClientsManager() {
  const [logos, setLogos] = useState<ClientLogo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingLogo, setEditingLogo] = useState<ClientLogo | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form State
  const [name, setName] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [altText, setAltText] = useState<string>('')
  const [order, setOrder] = useState<number>(0)
  const [isActive, setIsActive] = useState<boolean>(true)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type })
    setTimeout(() => setActionMessage(null), 4000)
  }

  const fetchLogos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clients')
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setLogos(json.data)
      } else {
        showToast(json.error || 'Gagal memuat logo klien', 'error')
      }
    } catch {
      showToast('Gagal menghubungi server untuk memuat logo klien', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogos()
  }, [])

  const handleOpenAddModal = () => {
    setEditingLogo(null)
    setName('')
    setLogoUrl('')
    setAltText('')
    setOrder(logos.length + 1)
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: ClientLogo) => {
    setEditingLogo(item)
    setName(item.name)
    setLogoUrl(item.logoUrl)
    setAltText(item.altText || '')
    setOrder(item.order ?? 0)
    setIsActive(item.isActive ?? true)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !logoUrl.trim()) {
      showToast('Nama dan URL Logo wajib diisi.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        altText: altText.trim() || name.trim(),
        order: Number(order) || 0,
        isActive,
      }
      if (editingLogo?.id) {
        payload.id = editingLogo.id
      }

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok) {
        showToast(json.message || 'Logo klien berhasil disimpan!')
        setIsModalOpen(false)
        fetchLogos()
      } else {
        showToast(json.error || 'Gagal menyimpan logo klien.', 'error')
      }
    } catch {
      showToast('Gagal mengirim data ke server.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, logoName: string) => {
    if (!confirm(`Hapus logo klien "${logoName}" secara permanen?`)) return

    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        showToast(json.message || 'Logo klien berhasil dihapus.')
        fetchLogos()
      } else {
        showToast(json.error || 'Gagal menghapus logo klien.', 'error')
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error')
    }
  }

  const handleToggleActive = async (item: ClientLogo) => {
    try {
      const updatedActive = !(item.isActive ?? true)
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          logoUrl: item.logoUrl,
          altText: item.altText,
          order: item.order,
          isActive: updatedActive,
        }),
      })
      if (res.ok) {
        setLogos((prev) =>
          prev.map((l) => (l.id === item.id ? { ...l, isActive: updatedActive } : l))
        )
        showToast(`Status logo "${item.name}" diubah ke ${updatedActive ? 'Aktif' : 'Nonaktif'}.`)
      }
    } catch {
      showToast('Gagal memperbarui status aktif.', 'error')
    }
  }

  const filteredLogos = logos.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.altText && l.altText.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const activeCount = logos.filter((l) => l.isActive !== false).length

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Toast Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between animate-fadeIn ${
            actionMessage.type === 'error'
              ? 'bg-red-500/15 border-red-500/30 text-red-300'
              : 'bg-[#F68609]/15 border-[#F68609]/30 text-orange-200'
          }`}
        >
          <span>{actionMessage.type === 'error' ? '✕ ' : '✓ '}{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Panel */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-[#F68609]/30 text-[#F68609] text-xs font-mono mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Brand Assets &amp; Trust Signals</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Manajemen Logo Klien &amp; Mitra
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
              Kelola logo klien institusi dan mitra enterprise yang tampil di slider beranda dan halaman tentang dengan data tersimpan di PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchLogos}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F68609] to-[#d96f00] hover:from-[#ff9f2e] hover:to-[#F68609] text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Logo Klien</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Total Entitas Logo</span>
            <p className="text-2xl font-bold text-white mt-1">{logos.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Logo Aktif di Slider</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Penyimpanan Data</span>
            <p className="text-2xl font-bold text-[#F68609] mt-1">PostgreSQL DB</p>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama atau teks alt klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-900 pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F68609]"
            />
          </div>
          <div className="text-xs font-mono text-neutral-400">
            Menampilkan {filteredLogos.length} dari {logos.length} logo
          </div>
        </div>

        {/* Logo Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 font-mono text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Urutan</th>
                <th className="py-3 px-4">Pratinjau</th>
                <th className="py-3 px-4">Nama Mitra / Klien</th>
                <th className="py-3 px-4">Teks Alternatif (Alt)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogos.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-neutral-400">
                    #{item.order ?? 0}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-10 w-24 bg-neutral-900 border border-white/10 rounded-lg p-1.5 flex items-center justify-center relative overflow-hidden">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.altText || item.name}
                          className="max-h-full max-w-full object-contain filter grayscale hover:grayscale-0 transition-all"
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-neutral-600" />
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px] truncate max-w-xs">
                    {item.altText || item.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-colors ${
                        item.isActive !== false
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isActive !== false ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                      <span>{item.isActive !== false ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                      title="Edit Logo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                      title="Hapus Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 font-mono text-xs">
                    {loading ? 'Memuat logo klien...' : 'Tidak ada logo klien yang cocok dengan pencarian.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#181818] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#F68609]" />
                <span>{editingLogo ? 'Edit Logo Klien' : 'Tambah Logo Klien Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Nama Klien / Mitra <span className="text-[#F68609]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Mandiri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#F68609]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  URL / Path Logo <span className="text-[#F68609]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="/images/clients/unified-gray/mandiri.svg atau https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#F68609]"
                />
              </div>

              {/* Live Preview Box */}
              {logoUrl && (
                <div className="p-3 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-between gap-4">
                  <span className="text-[11px] font-mono text-neutral-400">Pratinjau Logo:</span>
                  <div className="h-10 w-28 bg-black/60 border border-white/10 rounded-lg p-1.5 flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt={altText || name || 'Preview'}
                      className="max-h-full max-w-full object-contain filter grayscale"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Teks Alternatif (Alt Text)
                </label>
                <input
                  type="text"
                  placeholder="Deskripsi logo untuk aksesibilitas dan SEO"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#F68609]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F68609]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-neutral-300 select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 text-[#F68609] focus:ring-[#F68609] focus:ring-offset-0 bg-neutral-900"
                    />
                    <span>Aktif di Slider</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F68609] to-[#d96f00] hover:from-[#ff9f2e] hover:to-[#F68609] text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  {saving ? 'Menyimpan...' : editingLogo ? 'Perbarui Logo' : 'Simpan Logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
