'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'
import { EditorDialog, dialogButton } from '@/components/studio/editor/EditorDialog'
import { useAuth } from '@/lib/auth/AuthContext'
import { Boxes, Plus, Edit2, Trash2, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react'

interface CtaPreset {
  id: number
  name: string
  slug: string
  locale: 'id' | 'en'
  content: {
    title: string
    description: string
    primary: { label: string; href: string; rel: string; target?: string }
    secondary?: { label?: string; href?: string; rel?: string; target?: string }
  }
  style: {
    variant: 'banner' | 'card' | 'inline' | 'sticky' | 'split'
    bg: string
    text: string
    button: string
    radius: 'none' | 'sm' | 'md' | 'lg' | 'full'
    align: 'left' | 'center' | 'right'
  }
  placement?: {
    mode: 'after-paragraph' | 'end-of-article' | 'sidebar' | 'manual'
    index?: number
  }
  active: boolean
}

type FieldKey = 'name' | 'slug' | 'title' | 'description' | 'primaryLabel' | 'primaryHref' | 'paragraphIndex'
type FieldErrors = Partial<Record<FieldKey, string>>

const FIELD_ORDER: FieldKey[] = ['name', 'slug', 'title', 'description', 'primaryLabel', 'primaryHref', 'paragraphIndex']
const FIELD_ID: Record<FieldKey, string> = {
  name: 'cta-name',
  slug: 'cta-slug',
  title: 'cta-title',
  description: 'cta-description',
  primaryLabel: 'cta-primary-label',
  primaryHref: 'cta-primary-href',
  paragraphIndex: 'cta-paragraph-index',
}
/** API issue path → form field. */
const API_FIELD: Record<string, FieldKey> = {
  name: 'name',
  slug: 'slug',
  'content.title': 'title',
  'content.description': 'description',
  'content.primary.label': 'primaryLabel',
  'content.primary.href': 'primaryHref',
  'placement.index': 'paragraphIndex',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function errorText(json: unknown, fallback: string): string {
  if (json && typeof json === 'object') {
    const b = json as { errors?: unknown; error?: unknown; message?: unknown }
    if (Array.isArray(b.errors) && typeof b.errors[0] === 'string') return b.errors.join(' ')
    if (typeof b.message === 'string') return b.message
    if (typeof b.error === 'string') return b.error
  }
  return fallback
}

const inputClass =
  'w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200 placeholder:text-neutral-500 aria-[invalid=true]:border-red-400'

export function StudioCtaManager() {
  const { can } = useAuth()
  const canDelete = can('cta:delete')
  const canEdit = can('cta:manage')
  const [presets, setPresets] = useState<CtaPreset[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [locale, setLocale] = useState<'id' | 'en'>('id')
  const [editingPreset, setEditingPreset] = useState<CtaPreset | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [formError, setFormError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Form State (new presets start empty: no invented marketing copy).
  const [name, setName] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [slugTouched, setSlugTouched] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [primaryLabel, setPrimaryLabel] = useState<string>('')
  const [primaryHref, setPrimaryHref] = useState<string>('')
  const [variant, setVariant] = useState<CtaPreset['style']['variant']>('banner')
  const [placementMode, setPlacementMode] = useState<'after-paragraph' | 'end-of-article' | 'sidebar'>('after-paragraph')
  const [paragraphIndex, setParagraphIndex] = useState<number>(3)

  const fetchPresets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cta?locale=${locale}`)
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) setPresets(json.data)
      else {
        setPresets([])
        setNotice({ tone: 'error', text: errorText(json, 'Gagal memuat preset CTA.') })
      }
    } catch (err) {
      console.error('Failed to load CTA presets:', err)
      setNotice({ tone: 'error', text: 'Tidak dapat terhubung ke server untuk memuat preset CTA.' })
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    void fetchPresets()
  }, [fetchPresets])

  const resetFeedback = () => {
    setFormError('')
    setFieldErrors({})
  }

  const openCreateModal = () => {
    setEditingPreset(null)
    setName('')
    setSlug('')
    setSlugTouched(false)
    setTitle('')
    setDescription('')
    setPrimaryLabel('')
    setPrimaryHref('')
    setVariant('banner')
    setPlacementMode('after-paragraph')
    setParagraphIndex(3)
    resetFeedback()
    setIsModalOpen(true)
  }

  const openEditModal = (p: CtaPreset) => {
    setEditingPreset(p)
    setName(p.name)
    setSlug(p.slug)
    setSlugTouched(true)
    setTitle(p.content.title)
    setDescription(p.content.description)
    setPrimaryLabel(p.content.primary.label)
    setPrimaryHref(p.content.primary.href)
    setVariant(p.style.variant)
    setPlacementMode(p.placement?.mode === 'end-of-article' || p.placement?.mode === 'sidebar' ? p.placement.mode : 'after-paragraph')
    setParagraphIndex(p.placement?.index || 3)
    resetFeedback()
    setIsModalOpen(true)
  }

  const showFieldErrors = (errs: FieldErrors) => {
    setFieldErrors(errs)
    const first = FIELD_ORDER.find((k) => errs[k])
    if (first) requestAnimationFrame(() => document.getElementById(FIELD_ID[first])?.focus())
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const local: FieldErrors = {}
    if (!name.trim()) local.name = 'Nama preset wajib diisi.'
    if (!slug.trim()) local.slug = 'Slug wajib diisi.'
    if (!title.trim()) local.title = 'Judul CTA wajib diisi.'
    if (!primaryLabel.trim()) local.primaryLabel = 'Label tombol wajib diisi.'
    if (!primaryHref.trim()) local.primaryHref = 'Tautan tombol wajib diisi.'
    if (placementMode === 'after-paragraph' && (!Number.isInteger(paragraphIndex) || paragraphIndex < 1)) {
      local.paragraphIndex = 'Isi nomor paragraf mulai dari 1.'
    }
    if (Object.keys(local).length > 0) {
      setFormError('Periksa kolom yang ditandai.')
      showFieldErrors(local)
      return
    }

    setSaving(true)
    resetFeedback()
    try {
      const payload = {
        ...(editingPreset ? { id: editingPreset.id } : {}),
        name: name.trim(),
        slug: slug.trim(),
        locale,
        content: {
          title: title.trim(),
          description: description.trim(),
          primary: { label: primaryLabel.trim(), href: primaryHref.trim(), rel: 'noopener', target: '_self' },
        },
        style: {
          variant,
          bg: 'token:brand-600',
          text: '#ffffff',
          button: 'token:brand-accent',
          radius: 'lg',
          align: 'center',
        },
        placement: {
          mode: placementMode,
          index: paragraphIndex,
        },
        active: true,
      }

      const res = await fetch('/api/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setIsModalOpen(false)
        setNotice({ tone: 'success', text: errorText(json, 'Preset CTA disimpan.') })
        void fetchPresets()
        return
      }
      const fromApi: FieldErrors = {}
      if (Array.isArray(json.issues)) {
        for (const issue of json.issues as { field?: string; message?: string }[]) {
          const key = issue.field ? API_FIELD[issue.field] : undefined
          if (key && issue.message) fromApi[key] = issue.message
        }
      }
      if (res.status === 409) fromApi.slug = errorText(json, 'Slug sudah dipakai.')
      setFormError(errorText(json, 'Gagal menyimpan preset CTA.'))
      showFieldErrors(fromApi)
    } catch (err) {
      console.error('Failed to save CTA preset:', err)
      setFormError('Tidak dapat terhubung ke server. Preset belum disimpan.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingPreset) return
    if (!window.confirm(`Hapus preset CTA "${editingPreset.name}" secara permanen?`)) return
    setDeleting(true)
    setFormError('')
    try {
      const res = await fetch(`/api/cta?id=${editingPreset.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setIsModalOpen(false)
        setNotice({ tone: 'success', text: errorText(json, 'Preset CTA dihapus.') })
        void fetchPresets()
      } else {
        setFormError(errorText(json, 'Gagal menghapus preset CTA.'))
      }
    } catch (err) {
      console.error('Failed to delete CTA preset:', err)
      setFormError('Tidak dapat terhubung ke server. Preset belum dihapus.')
    } finally {
      setDeleting(false)
    }
  }

  const fieldProps = (key: FieldKey, helpId?: string) => ({
    id: FIELD_ID[key],
    'aria-invalid': fieldErrors[key] ? true : undefined,
    'aria-describedby': [helpId, fieldErrors[key] ? `${FIELD_ID[key]}-error` : undefined].filter(Boolean).join(' ') || undefined,
  })
  const fieldError = (key: FieldKey) =>
    fieldErrors[key] ? (
      <p id={`${FIELD_ID[key]}-error`} className="text-xs text-red-200">
        {fieldErrors[key]}
      </p>
    ) : null

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-surface-overlay border border-white/10 shadow-sm">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-info" aria-hidden="true" />
          <span className="text-xs font-mono font-medium text-neutral-300">
            Preset Blok CTA ({presets.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div role="group" aria-label="Bahasa preset" className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl text-xs">
            {(['id', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs ${
                  locale === l ? 'bg-accent-500 text-accent-950 font-semibold' : 'text-neutral-300 hover:text-white'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {canEdit && (
            <Tooltip label="Buat Preset CTA" hint="Tambahkan blok call-to-action baru yang dapat disisipkan di konten">
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500 hover:bg-accent-300 text-accent-950 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Buat Preset</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div role="status" aria-live="polite">
        {notice?.tone === 'success' && (
          <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-xs text-emerald-100">{notice.text}</p>
        )}
      </div>
      {notice?.tone === 'error' && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-100">
          <p>{notice.text}</p>
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 underline">
            Tutup
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-info motion-safe:animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-neutral-300">Memuat preset CTA...</p>
        </div>
      ) : presets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-900/30">
          <Boxes className="w-10 h-10 text-neutral-500 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-neutral-300 font-medium">Belum ada Preset CTA untuk [{locale.toUpperCase()}]</p>
          <p className="text-xs text-neutral-400 mt-1">Buat preset banner konsultasi atau formulir penawaran.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="p-5 rounded-2xl bg-neutral-900/70 border border-white/10 space-y-4 hover:border-info/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white [overflow-wrap:anywhere]">{preset.name}</h3>
                  <span className="text-[11px] font-mono text-neutral-400 [overflow-wrap:anywhere]">slug: {preset.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-info/10 text-info border border-info/20">
                    {preset.style.variant}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openEditModal(preset)}
                      aria-label={`Edit preset ${preset.name}`}
                      className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Card Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-white/10 space-y-2">
                <h4 className="text-xs font-semibold text-white">{preset.content.title}</h4>
                <p className="text-[11px] text-neutral-300 leading-relaxed">{preset.content.description}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-500 text-accent-950 rounded-md text-[11px] font-semibold">
                    <span>{preset.content.primary.label}</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/5">
                <span>
                  Posisi: {preset.placement?.mode || 'after-paragraph'}
                  {preset.placement?.mode === 'after-paragraph' || !preset.placement ? ` (${preset.placement?.index || 3})` : ''}
                </span>
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Aktif
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create / Edit dialog: focus trapped, Escape closes, focus returns to the opener. */}
      <EditorDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingPreset ? 'Edit Preset CTA' : 'Buat Preset CTA Baru'} [${locale.toUpperCase()}]`}
        size="lg"
        dismissible={!saving && !deleting}
        footer={
          <>
            {editingPreset && canDelete && (
              <button type="button" onClick={handleDelete} disabled={saving || deleting} className={`${dialogButton.danger} me-auto`}>
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {deleting ? 'Menghapus…' : 'Hapus'}
              </button>
            )}
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving || deleting} className={dialogButton.secondary}>
              Batal
            </button>
            <button type="submit" form="cta-preset-form" disabled={saving || deleting} className={dialogButton.primary}>
              {saving ? 'Menyimpan…' : 'Simpan Preset'}
            </button>
          </>
        }
      >
        <form id="cta-preset-form" onSubmit={handleSave} noValidate className="space-y-3 text-xs">
          {formError && (
            <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-red-100">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={FIELD_ID.name} className="text-neutral-300 font-mono">Nama Preset</label>
              <input
                type="text"
                {...fieldProps('name')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slugTouched) setSlug(slugify(e.target.value))
                }}
                className={inputClass}
              />
              {fieldError('name')}
            </div>
            <div className="space-y-1">
              <label htmlFor={FIELD_ID.slug} className="text-neutral-300 font-mono">Slug Preset</label>
              <input
                type="text"
                {...fieldProps('slug')}
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugTouched(true)
                }}
                className={`${inputClass} font-mono`}
              />
              {fieldError('slug')}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor={FIELD_ID.title} className="text-neutral-300 font-mono">Judul CTA</label>
            <input type="text" {...fieldProps('title')} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            {fieldError('title')}
          </div>

          <div className="space-y-1">
            <label htmlFor={FIELD_ID.description} className="text-neutral-300 font-mono">Deskripsi / Subteks</label>
            <textarea
              rows={2}
              {...fieldProps('description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
            />
            {fieldError('description')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={FIELD_ID.primaryLabel} className="text-neutral-300 font-mono">Label Tombol Utama</label>
              <input
                type="text"
                {...fieldProps('primaryLabel')}
                value={primaryLabel}
                onChange={(e) => setPrimaryLabel(e.target.value)}
                className={inputClass}
              />
              {fieldError('primaryLabel')}
            </div>
            <div className="space-y-1">
              <label htmlFor={FIELD_ID.primaryHref} className="text-neutral-300 font-mono">Tautan Tombol</label>
              <input
                type="text"
                inputMode="url"
                placeholder="/contact atau https://…"
                {...fieldProps('primaryHref', 'cta-href-help')}
                value={primaryHref}
                onChange={(e) => setPrimaryHref(e.target.value)}
                className={`${inputClass} font-mono`}
              />
              <p id="cta-href-help" className="text-[11px] text-neutral-400">Path internal, URL https, mailto:, atau tel:.</p>
              {fieldError('primaryHref')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="cta-variant" className="text-neutral-300 font-mono">Varian Tampilan</label>
              <select
                id="cta-variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value as CtaPreset['style']['variant'])}
                className={inputClass}
              >
                <option value="banner">Banner Penuh</option>
                <option value="card">Kartu Terkurasi</option>
                <option value="inline">Inline Teks</option>
                <option value="sticky">Sticky Bar</option>
                <option value="split">Split Kolom</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="cta-placement" className="text-neutral-300 font-mono">Posisi Otomatis</label>
              <select
                id="cta-placement"
                value={placementMode}
                onChange={(e) => setPlacementMode(e.target.value as 'after-paragraph' | 'end-of-article' | 'sidebar')}
                className={inputClass}
              >
                <option value="after-paragraph">Setelah Paragraf ke-N</option>
                <option value="end-of-article">Akhir Artikel</option>
                <option value="sidebar">Sidebar Konten</option>
              </select>
            </div>
          </div>

          {placementMode === 'after-paragraph' && (
            <div className="space-y-1 sm:w-1/2">
              <label htmlFor={FIELD_ID.paragraphIndex} className="text-neutral-300 font-mono">Setelah paragraf ke-</label>
              <input
                type="number"
                min={1}
                step={1}
                {...fieldProps('paragraphIndex')}
                value={paragraphIndex}
                onChange={(e) => setParagraphIndex(Number(e.target.value))}
                className={inputClass}
              />
              {fieldError('paragraphIndex')}
            </div>
          )}
        </form>
      </EditorDialog>
    </div>
  )
}
