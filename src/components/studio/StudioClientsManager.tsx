'use client'

import React, { useState, useEffect } from 'react'
import { EditorDialog, dialogButton } from '@/components/studio/editor/EditorDialog'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react'

type FieldErrors = Partial<Record<'name' | 'logoUrl' | 'altText' | 'order', string>>

/** Readable message from an API error body (`error` / `message`). */
function apiError(json: unknown, fallback: string): string {
  if (json && typeof json === 'object') {
    const b = json as { error?: unknown; message?: unknown }
    if (typeof b.error === 'string' && b.error !== 'Forbidden' && b.error !== 'Unauthorized') return b.error
    if (typeof b.message === 'string') return b.message
  }
  return fallback
}

/** Field-level messages from a 422 body (`issues: [{ field, message }]`). */
function apiFieldErrors(json: unknown): FieldErrors {
  const out: FieldErrors = {}
  if (json && typeof json === 'object' && Array.isArray((json as { issues?: unknown }).issues)) {
    for (const issue of (json as { issues: unknown[] }).issues) {
      if (issue && typeof issue === 'object') {
        const { field, message } = issue as { field?: unknown; message?: unknown }
        if ((field === 'name' || field === 'logoUrl' || field === 'altText' || field === 'order') && typeof message === 'string') {
          out[field] = message
        }
      }
    }
  }
  return out
}

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

const FIELD_IDS = {
  name: 'client-name',
  logoUrl: 'client-logo-url',
  altText: 'client-alt-text',
  order: 'client-order',
} as const

/** Mirrors DELETE /api/clients: editors may add and edit logos, not delete them. */
const DELETE_ROLES: ReadonlySet<string> = new Set(['SUPER_ADMIN', 'CONTENT_ADMIN'])

export function StudioClientsManager() {
  const { role } = useAuth()
  const canDelete = DELETE_ROLES.has(role)
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>('')

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
        showToast(apiError(json, 'Gagal memuat logo klien.'), 'error')
      }
    } catch (err) {
      console.error('[clients] load failed:', err)
      showToast('Gagal menghubungi server untuk memuat logo klien.', 'error')
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
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: ClientLogo) => {
    setEditingLogo(item)
    setName(item.name)
    setLogoUrl(item.logoUrl)
    setAltText(item.altText || '')
    setOrder(item.order ?? 0)
    setIsActive(item.isActive ?? true)
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const local: FieldErrors = {}
    if (!name.trim()) local.name = 'Nama klien wajib diisi.'
    if (!logoUrl.trim()) local.logoUrl = 'URL logo wajib diisi.'
    if (Object.keys(local).length > 0) {
      setFieldErrors(local)
      setFormError('')
      document.getElementById(local.name ? FIELD_IDS.name : FIELD_IDS.logoUrl)?.focus()
      return
    }

    setSaving(true)
    setFieldErrors({})
    setFormError('')
    try {
      const payload = {
        ...(editingLogo?.id ? { id: editingLogo.id } : {}),
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        altText: altText.trim() || name.trim(),
        order: Number(order) || 0,
        isActive,
      }

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok) {
        showToast(json.message || 'Logo klien berhasil disimpan.')
        setIsModalOpen(false)
        fetchLogos()
      } else {
        const fields = apiFieldErrors(json)
        setFieldErrors(fields)
        setFormError(Object.keys(fields).length > 0 ? 'Periksa kolom yang ditandai.' : apiError(json, 'Gagal menyimpan logo klien.'))
        const first = (['name', 'logoUrl', 'altText', 'order'] as const).find((k) => fields[k])
        if (first) document.getElementById(FIELD_IDS[first])?.focus()
      }
    } catch (err) {
      console.error('[clients] save failed:', err)
      setFormError('Gagal mengirim data ke server.')
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
        showToast(apiError(json, 'Gagal menghapus logo klien.'), 'error')
      }
    } catch (err) {
      console.error('[clients] delete failed:', err)
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
      } else {
        const json = await res.json().catch(() => ({}))
        showToast(apiError(json, 'Gagal memperbarui status aktif.'), 'error')
      }
    } catch (err) {
      console.error('[clients] toggle failed:', err)
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
      <div role="status" aria-live="polite">
        {actionMessage?.type === 'success' && (
          <div className="p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between motion-safe:animate-fadeIn bg-[#F68609]/15 border-[#F68609]/30 text-orange-200">
            <span>Berhasil: {actionMessage.text}</span>
            <button type="button" aria-label="Tutup pesan" onClick={() => setActionMessage(null)} className="text-neutral-300 hover:text-white">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        )}
      </div>
      {actionMessage?.type === 'error' && (
        <div role="alert" className="p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between bg-red-500/15 border-red-500/30 text-red-200">
          <span>Gagal: {actionMessage.text}</span>
          <button type="button" aria-label="Tutup pesan" onClick={() => setActionMessage(null)} className="text-neutral-300 hover:text-white">
            <span aria-hidden="true">✕</span>
          </button>
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
              Kelola logo klien institusi dan mitra enterprise yang tampil di strip mitra beranda. Data tersimpan di PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchLogos}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F68609] to-[#d96f00] hover:from-[#ff9f2e] hover:to-[#F68609] text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
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
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              type="search"
              aria-label="Cari logo klien"
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
                      aria-label={`${item.name}: ${item.isActive !== false ? 'Aktif' : 'Nonaktif'}. Klik untuk ${item.isActive !== false ? 'menonaktifkan' : 'mengaktifkan'}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-colors ${
                        item.isActive !== false
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-500'
                      }`}
                    >
                      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${item.isActive !== false ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                      <span>{item.isActive !== false ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                      title="Edit Logo"
                      aria-label={`Edit logo ${item.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                      title="Hapus Logo"
                      aria-label={`Hapus logo ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    )}
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

      {/* Modal Add / Edit: native dialog — focus trapped, Escape closes, focus returns to the opener. */}
      <EditorDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLogo ? 'Edit Logo Klien' : 'Tambah Logo Klien Baru'}
        icon={<Building2 className="w-4 h-4 text-[#F68609]" />}
        dismissible={!saving}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className={dialogButton.secondary}>
              Batal
            </button>
            <button type="submit" form="client-logo-form" disabled={saving} className={dialogButton.primary}>
              {saving ? 'Menyimpan…' : editingLogo ? 'Perbarui Logo' : 'Simpan Logo'}
            </button>
          </>
        }
      >
        <form id="client-logo-form" onSubmit={handleSave} noValidate className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-100">
              {formError}
            </p>
          )}
          <div>
            <label htmlFor={FIELD_IDS.name} className="block text-xs font-mono text-neutral-300 mb-1">
              Nama Klien / Mitra <span className="text-[#F68609]" aria-hidden="true">*</span>
              <span className="sr-only">(wajib)</span>
            </label>
            <input
              id={FIELD_IDS.name}
              type="text"
              required
              placeholder="Nama institusi atau mitra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? `${FIELD_IDS.name}-error` : undefined}
              className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F68609] aria-[invalid=true]:border-red-400"
            />
            {fieldErrors.name && (
              <p id={`${FIELD_IDS.name}-error`} className="mt-1 text-xs text-red-200">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor={FIELD_IDS.logoUrl} className="block text-xs font-mono text-neutral-300 mb-1">
              URL / Path Logo <span className="text-[#F68609]" aria-hidden="true">*</span>
              <span className="sr-only">(wajib)</span>
            </label>
            <input
              id={FIELD_IDS.logoUrl}
              type="text"
              required
              placeholder="/brand/... , /uploads/... atau https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              aria-invalid={fieldErrors.logoUrl ? true : undefined}
              aria-describedby={fieldErrors.logoUrl ? `${FIELD_IDS.logoUrl}-error` : undefined}
              className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F68609] aria-[invalid=true]:border-red-400"
            />
            {fieldErrors.logoUrl && (
              <p id={`${FIELD_IDS.logoUrl}-error`} className="mt-1 text-xs text-red-200">{fieldErrors.logoUrl}</p>
            )}
          </div>

          {/* Live Preview Box */}
          {logoUrl && (
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-between gap-4">
              <span className="text-[11px] font-mono text-neutral-300">Pratinjau Logo:</span>
              <div className="h-10 w-28 bg-black/60 border border-white/10 rounded-lg p-1.5 flex items-center justify-center">
                {/* Plain <img>: arbitrary URL typed by the editor; decorative preview of the field above. */}
                <img
                  src={logoUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain filter grayscale"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor={FIELD_IDS.altText} className="block text-xs font-mono text-neutral-300 mb-1">
              Teks Alternatif (Alt Text)
            </label>
            <input
              id={FIELD_IDS.altText}
              type="text"
              placeholder="Deskripsi logo untuk aksesibilitas dan SEO"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              aria-invalid={fieldErrors.altText ? true : undefined}
              aria-describedby={`${FIELD_IDS.altText}-help${fieldErrors.altText ? ` ${FIELD_IDS.altText}-error` : ''}`}
              className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F68609] aria-[invalid=true]:border-red-400"
            />
            <p id={`${FIELD_IDS.altText}-help`} className="mt-1 text-[11px] text-neutral-400">Kosongkan untuk memakai nama klien.</p>
            {fieldErrors.altText && (
              <p id={`${FIELD_IDS.altText}-error`} className="mt-1 text-xs text-red-200">{fieldErrors.altText}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={FIELD_IDS.order} className="block text-xs font-mono text-neutral-300 mb-1">
                Urutan Tampil
              </label>
              <input
                id={FIELD_IDS.order}
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                aria-invalid={fieldErrors.order ? true : undefined}
                aria-describedby={fieldErrors.order ? `${FIELD_IDS.order}-error` : undefined}
                className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F68609] aria-[invalid=true]:border-red-400"
              />
              {fieldErrors.order && (
                <p id={`${FIELD_IDS.order}-error`} className="mt-1 text-xs text-red-200">{fieldErrors.order}</p>
              )}
            </div>

            <div className="flex items-center sm:pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-neutral-300 select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-[#F68609] bg-neutral-900"
                />
                <span>Aktif di Slider</span>
              </label>
            </div>
          </div>
        </form>
      </EditorDialog>
    </div>
  )
}
