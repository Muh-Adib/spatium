'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Search,
  ShieldCheck,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { Modal, Panel, IconButton, SearchField, TextButton, SelectDropdown } from '@/components/admin/AdminUi'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAuth } from '@/lib/auth/AuthContext'

interface CategoryData {
  id: number
  documentId?: string
  name: string
  slug: string
  description?: string
  articleCount?: number
}

interface StudioCategoryManagerProps {
  isOpen: boolean
  onClose: () => void
  onCategoriesChanged?: () => void
}

export function StudioCategoryManager({
  isOpen,
  onClose,
  onCategoriesChanged,
}: StudioCategoryManagerProps) {
  const { getAuthHeaders } = useAuth()
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Create form state
  const [isCreating, setIsCreating] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [savingCreate, setSavingCreate] = useState(false)

  // Edit form state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Safe delete dialog state
  const [deletingCategory, setDeletingCategory] = useState<CategoryData | null>(null)
  const [reassignTargetId, setReassignTargetId] = useState<string>('')
  const [savingDelete, setSavingDelete] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/categories', {
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setCategories(json.data || [])
      } else {
        setErrorMessage(json.error || 'Gagal memuat daftar kategori.')
      }
    } catch {
      setErrorMessage('Server tidak dapat dihubungi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      setIsCreating(false)
      setEditingId(null)
      setDeletingCategory(null)
      setErrorMessage('')
      setSuccessMessage('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Auto-generate slug when typing createName
  const handleCreateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCreateName(val)
    const generatedSlug = val
      .normalize('NFKC')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
    setCreateSlug(generatedSlug)
  }

  // Submit Create Category
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) {
      setErrorMessage('Nama kategori wajib diisi.')
      return
    }
    setSavingCreate(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: createName.trim(),
          slug: createSlug.trim() || undefined,
          description: createDescription.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal membuat kategori.')
      }

      setSuccessMessage(`Kategori "${json.data?.name || createName}" berhasil ditambahkan!`)
      setCreateName('')
      setCreateSlug('')
      setCreateDescription('')
      setIsCreating(false)
      await fetchCategories()
      onCategoriesChanged?.()
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat membuat kategori.')
    } finally {
      setSavingCreate(false)
    }
  }

  // Start Edit
  const startEdit = (cat: CategoryData) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditSlug(cat.slug)
    setEditDescription(cat.description || '')
    setErrorMessage('')
  }

  // Cancel Edit
  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditSlug('')
    setEditDescription('')
  }

  // Save Edit
  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      setErrorMessage('Nama kategori tidak boleh kosong.')
      return
    }
    setSavingEdit(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          slug: editSlug.trim() || undefined,
          description: editDescription.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui kategori.')
      }

      setSuccessMessage(`Kategori "${editName}" berhasil diperbarui!`)
      cancelEdit()
      await fetchCategories()
      onCategoriesChanged?.()
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memperbarui kategori.')
    } finally {
      setSavingEdit(false)
    }
  }

  // Start Safe Delete
  const startSafeDelete = (cat: CategoryData) => {
    setDeletingCategory(cat)
    // Find a good default destination category (e.g. 'artikel' or first available)
    const otherCats = categories.filter((c) => c.id !== cat.id)
    const defaultTarget = otherCats.find((c) => c.slug === 'artikel') || otherCats[0]
    setReassignTargetId(defaultTarget ? String(defaultTarget.id) : '')
    setErrorMessage('')
  }

  // Confirm Safe Delete
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    setSavingDelete(true)
    setErrorMessage('')
    try {
      const targetId = reassignTargetId ? Number(reassignTargetId) : undefined
      const res = await fetch(`/api/categories?id=${deletingCategory.id}${targetId ? `&reassignToId=${targetId}` : ''}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus kategori.')
      }

      setSuccessMessage(json.message || `Kategori "${deletingCategory.name}" berhasil dihapus.`)
      setDeletingCategory(null)
      await fetchCategories()
      onCategoriesChanged?.()
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menghapus kategori.')
    } finally {
      setSavingDelete(false)
    }
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return categories
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    )
  }, [categories, searchQuery])

  // Destination options for deletion reassignment
  const destinationOptions = useMemo(() => {
    if (!deletingCategory) return []
    return categories
      .filter((c) => c.id !== deletingCategory.id)
      .map((c) => ({
        value: String(c.id),
        label: `${c.name} (${c.articleCount ?? 0} artikel)`,
      }))
  }, [categories, deletingCategory])

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={`Kelola Kategori Artikel (${categories.length})`}
        icon={FolderTree}
        tone="info"
        className="!max-w-3xl"
      >
        <div className="space-y-5">
          {/* Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-red-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action bar: Search + Add New Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <SearchField
                icon={Search}
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari kategori atau slug…"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <IconButton
                icon={RefreshCw}
                label="Segarkan daftar"
                hint="Muat ulang kategori dari database"
                spinning={loading}
                onClick={fetchCategories}
              />
              <TextButton
                tone={isCreating ? 'neutral' : 'primary'}
                onClick={() => {
                  setIsCreating((prev) => !prev)
                  setErrorMessage('')
                }}
              >
                {isCreating ? (
                  'Tutup Form'
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kategori</span>
                  </span>
                )}
              </TextButton>
            </div>
          </div>

          {/* Create Category Form */}
          {isCreating && (
            <Panel className="p-4 bg-white/[0.03] border-accent-400/30">
              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-semibold text-white font-mono flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-accent-400" />
                    Kategori Baru
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-neutral-500 hover:text-white text-xs"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                      Nama Kategori <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={createName}
                      onChange={handleCreateNameChange}
                      placeholder="e.g. AI & Otomasi Digital"
                      className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                      Slug URL
                    </label>
                    <input
                      type="text"
                      value={createSlug}
                      onChange={(e) => setCreateSlug(e.target.value)}
                      placeholder="e.g. ai-otomasi-digital"
                      className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    Deskripsi Singkat (Opsional)
                  </label>
                  <input
                    type="text"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Wawasan dan panduan implementasi kecerdasan buatan"
                    className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-400"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <TextButton
                    type="submit"
                    tone="primary"
                    disabled={savingCreate || !createName.trim()}
                  >
                    {savingCreate ? 'Menyimpan…' : 'Simpan Kategori'}
                  </TextButton>
                </div>
              </form>
            </Panel>
          )}

          {/* Categories Table */}
          <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden max-h-[440px] overflow-y-auto">
            {loading ? (
              <div className="py-16 text-center font-mono text-xs text-neutral-500">
                Memuat data kategori…
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-500">
                Tidak ada kategori yang ditemukan.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 font-mono text-[11px]">
                    <th className="px-4 py-3 font-medium">Nama Kategori</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium text-center">Jumlah Artikel</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredCategories.map((cat) => {
                    const isEditing = editingId === cat.id

                    if (isEditing) {
                      return (
                        <tr key={cat.id} className="bg-accent-500/[0.07]">
                          <td className="px-4 py-3" colSpan={4}>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-accent-300 text-xs">
                                  Edit Kategori: {cat.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <TextButton
                                    className="!h-7 !px-2.5 !text-[11px]"
                                    tone="neutral"
                                    onClick={cancelEdit}
                                  >
                                    Batal
                                  </TextButton>
                                  <TextButton
                                    className="!h-7 !px-2.5 !text-[11px]"
                                    tone="primary"
                                    disabled={savingEdit || !editName.trim()}
                                    onClick={() => handleSaveEdit(cat.id)}
                                  >
                                    {savingEdit ? 'Menyimpan…' : 'Simpan'}
                                  </TextButton>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Nama</label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full rounded-md bg-black/60 border border-white/20 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-accent-400"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Slug</label>
                                  <input
                                    type="text"
                                    value={editSlug}
                                    onChange={(e) => setEditSlug(e.target.value)}
                                    className="w-full rounded-md bg-black/60 border border-white/20 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-accent-400 font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-neutral-400 block mb-0.5">Deskripsi</label>
                                <input
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full rounded-md bg-black/60 border border-white/20 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-accent-400"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr
                        key={cat.id}
                        className="transition-colors hover:bg-white/[0.02] group"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{cat.name}</div>
                          {cat.description && (
                            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                              {cat.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-neutral-400 text-[11px]">
                          {cat.slug}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full border ${
                              (cat.articleCount ?? 0) > 0
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                                : 'bg-neutral-800 text-neutral-400 border-white/10'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            {cat.articleCount ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <IconButton
                              icon={Pencil}
                              label="Edit kategori"
                              size="sm"
                              onClick={() => startEdit(cat)}
                            />
                            <IconButton
                              icon={Trash2}
                              label="Hapus kategori aman"
                              hint="Hapus kategori dengan perlindungan pengalihan artikel"
                              tone="danger"
                              size="sm"
                              onClick={() => startSafeDelete(cat)}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      {/* --- SAFE DELETE MODAL (Protects all articles) --- */}
      {deletingCategory && (
        <Modal
          open={Boolean(deletingCategory)}
          onClose={() => setDeletingCategory(null)}
          title="Hapus Kategori Aman"
          icon={ShieldCheck}
          tone="warning"
          className="!max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-1">
                  Perlindungan Integritas Artikel Aktif
                </strong>
                Kategori <strong className="text-white">&ldquo;{deletingCategory.name}&rdquo;</strong> saat ini memiliki{' '}
                <strong className="text-white">{deletingCategory.articleCount ?? 0} artikel</strong> terkait.
              </div>
            </div>

            {(deletingCategory.articleCount ?? 0) > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-300 block">
                  Alihkan seluruh {deletingCategory.articleCount} artikel ke kategori:
                </label>
                <SelectDropdown
                  value={reassignTargetId}
                  onChange={setReassignTargetId}
                  placeholder="Pilih kategori tujuan…"
                  options={destinationOptions}
                />
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans mt-2">
                  Artikel tidak akan dihapus. Semua artikel, metadata SEO, dan tautan publiknya akan tetap 100% aman dan dialihkan ke kategori tujuan yang dipilih.
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">
                Kategori ini tidak memiliki artikel terkait. Kategori dapat dihapus langsung tanpa memengaruhi artikel apa pun.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <TextButton
                tone="neutral"
                onClick={() => setDeletingCategory(null)}
                disabled={savingDelete}
              >
                Batal
              </TextButton>
              <TextButton
                tone="danger"
                onClick={handleConfirmDelete}
                disabled={savingDelete || ((deletingCategory.articleCount ?? 0) > 0 && !reassignTargetId && destinationOptions.length > 0)}
              >
                {savingDelete ? 'Memproses Pengalihan…' : (deletingCategory.articleCount ?? 0) > 0 ? 'Hapus & Alihkan Artikel Aman' : 'Hapus Kategori'}
              </TextButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
