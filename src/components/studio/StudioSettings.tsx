'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import type { Role } from '@/lib/auth/types'
import { Settings, Globe, Phone, Share2, Database, Save, RefreshCw, Lock } from 'lucide-react'
import { buildWhatsappHref } from '@/lib/contact/public-contact'

/**
 * Site settings editor. Every field here maps to a column of `site_configs`
 * (see `/api/settings`); there are no client-only toggles. Saving sends only
 * the fields shown, so values managed elsewhere are never wiped.
 *
 * The public contact block (email, phone, WhatsApp + default message,
 * address, opening hours, socials) is the only source of contact details on
 * the public site — empty fields are hidden there.
 */

const SETTINGS_ADMINS: readonly Role[] = ['SUPER_ADMIN', 'CONTENT_ADMIN']

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X' },
  { key: 'vimeo', label: 'Vimeo' },
  { key: 'behance', label: 'Behance' },
] as const

type SocialKey = (typeof SOCIAL_FIELDS)[number]['key']

interface SettingsForm {
  name: string
  tagline: string
  description: string
  url: string
  email: string
  phone: string
  whatsapp: string
  whatsappMessage: string
  address: string
  openingHours: string
  logoUrl: string
  faviconUrl: string
  socialLinks: Record<SocialKey, string>
}

type FieldKey = Exclude<keyof SettingsForm, 'socialLinks'> | `socialLinks.${SocialKey}`

const EMPTY_SOCIAL = Object.fromEntries(SOCIAL_FIELDS.map((f) => [f.key, ''])) as Record<SocialKey, string>

const EMPTY_FORM: SettingsForm = {
  name: '',
  tagline: '',
  description: '',
  url: '',
  email: '',
  phone: '',
  whatsapp: '',
  whatsappMessage: '',
  address: '',
  openingHours: '',
  logoUrl: '',
  faviconUrl: '',
  socialLinks: EMPTY_SOCIAL,
}

/** Order used to move focus to the first invalid field. */
const FIELD_ORDER: FieldKey[] = [
  'name', 'tagline', 'url', 'description', 'logoUrl', 'faviconUrl',
  'email', 'phone', 'whatsapp', 'whatsappMessage', 'address', 'openingHours',
  ...SOCIAL_FIELDS.map((f) => `socialLinks.${f.key}` as const),
]

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

function toForm(data: Record<string, unknown>): SettingsForm {
  const rawLinks = data.socialLinks && typeof data.socialLinks === 'object' ? (data.socialLinks as Record<string, unknown>) : {}
  const socialLinks = { ...EMPTY_SOCIAL }
  for (const f of SOCIAL_FIELDS) socialLinks[f.key] = str(rawLinks[f.key])
  return {
    name: str(data.name),
    tagline: str(data.tagline),
    description: str(data.description),
    url: str(data.url),
    email: str(data.email),
    phone: str(data.phone),
    whatsapp: str(data.whatsapp),
    whatsappMessage: str(data.whatsappMessage),
    address: str(data.address),
    openingHours: str(data.openingHours),
    logoUrl: str(data.logoUrl),
    faviconUrl: str(data.faviconUrl),
    socialLinks,
  }
}

const inputClass =
  'w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus:border-accent-400 disabled:opacity-60 aria-[invalid=true]:border-red-400'

interface FieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode
}

function Field({ id, label, hint, error, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-mono text-neutral-300 block mb-1 font-semibold">
        {label}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && (
        <p id={hintId} className="text-[11px] text-neutral-400 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] text-red-300 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

export function StudioSettings() {
  const { role, actorName } = useAuth()
  const canEdit = SETTINGS_ADMINS.includes(role)
  const baseId = useId()
  const fieldId = (key: FieldKey) => `${baseId}-${key.replace('.', '-')}`

  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [flushing, setFlushing] = useState(false)
  const [flushStatus, setFlushStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const pendingFocus = useRef<FieldKey | null>(null)

  const loadSettings = useCallback((signal?: AbortSignal) => {
    return fetch('/api/settings', { signal, cache: 'no-store' })
      .then(async (res) => {
        const json: unknown = await res.json()
        if (!res.ok || !json || typeof json !== 'object' || !('data' in json) || !json.data || typeof json.data !== 'object') {
          throw new Error(`HTTP ${res.status}`)
        }
        setForm(toForm(json.data as Record<string, unknown>))
        setLoadState('ready')
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.warn('[settings] Could not load site settings:', err)
        setLoadState('error')
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadSettings(controller.signal)
    return () => controller.abort()
  }, [loadSettings])

  useEffect(() => {
    const key = pendingFocus.current
    if (!key) return
    pendingFocus.current = null
    document.getElementById(fieldId(key))?.focus()
  })

  const setField = (key: Exclude<keyof SettingsForm, 'socialLinks'>, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }
  const setSocial = (key: SocialKey, value: string) => {
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }))
    const errKey = `socialLinks.${key}` as const
    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: undefined }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canEdit) return
    const nextErrors: Partial<Record<FieldKey, string>> = {}
    if (!form.name.trim()) nextErrors.name = 'Nama situs wajib diisi.'
    if (!form.url.trim()) nextErrors.url = 'URL situs wajib diisi.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      pendingFocus.current = FIELD_ORDER.find((k) => nextErrors[k]) ?? null
      setStatus({ tone: 'error', text: 'Periksa kolom yang ditandai.' })
      return
    }

    setIsSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result: { success?: boolean; error?: string; message?: string; issues?: { field: string; message: string }[] } = await res.json()
      if (res.ok && result.success) {
        setErrors({})
        setStatus({ tone: 'ok', text: `Pengaturan tersimpan oleh ${actorName}.` })
        // Reload so the form shows the stored (normalised) values, e.g. the WhatsApp number.
        void loadSettings()
        return
      }
      const fieldErrors: Partial<Record<FieldKey, string>> = {}
      for (const issue of result.issues ?? []) {
        const key = FIELD_ORDER.find((k) => k === issue.field)
        if (key) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      pendingFocus.current = FIELD_ORDER.find((k) => fieldErrors[k]) ?? null
      setStatus({ tone: 'error', text: result.issues?.length ? 'Periksa kolom yang ditandai.' : result.error || 'Gagal menyimpan pengaturan.' })
    } catch (err: unknown) {
      console.error('[settings] Save failed:', err)
      setStatus({ tone: 'error', text: 'Tidak dapat menghubungi server. Coba lagi.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFlushCache = async () => {
    setFlushing(true)
    setFlushStatus(null)
    try {
      const res = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: ['/', '/sitemap.xml'] }),
      })
      const data: { revalidated?: boolean; error?: string; message?: string } = await res.json()
      if (res.ok && data.revalidated) {
        setFlushStatus({ tone: 'ok', text: 'Cache halaman publik sudah diperbarui.' })
      } else {
        setFlushStatus({ tone: 'error', text: data.message || data.error || `Gagal memperbarui cache (HTTP ${res.status}).` })
      }
    } catch (err: unknown) {
      console.error('[settings] Cache flush failed:', err)
      setFlushStatus({ tone: 'error', text: 'Tidak dapat menghubungi server. Coba lagi.' })
    } finally {
      setFlushing(false)
    }
  }

  const disabled = !canEdit || loadState !== 'ready' || isSaving

  const text = (key: Exclude<keyof SettingsForm, 'socialLinks'>, label: string, opts: { type?: string; hint?: string; placeholder?: string } = {}) => (
    <Field id={fieldId(key)} label={label} hint={opts.hint} error={errors[key]}>
      {(props) => (
        <input
          {...props}
          type={opts.type ?? 'text'}
          disabled={disabled}
          value={form[key]}
          placeholder={opts.placeholder}
          onChange={(e) => setField(key, e.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  )

  const textarea = (key: 'whatsappMessage' | 'address' | 'openingHours', label: string, rows: number, hint?: string) => (
    <Field id={fieldId(key)} label={label} hint={hint} error={errors[key]}>
      {(props) => (
        <textarea
          {...props}
          rows={rows}
          disabled={disabled}
          value={form[key]}
          onChange={(e) => setField(key, e.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  )

  const whatsappPreview = buildWhatsappHref(form.whatsapp)

  const cardTitle = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
      {icon}
      <h3 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">{title}</h3>
    </div>
  )

  return (
    <form className="space-y-6" onSubmit={handleSave} noValidate>
      <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-6 shadow-soft-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent-500/15 border border-accent-400/30 text-accent-400" aria-hidden="true">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-display-xs font-bold text-white">Pengaturan situs</h2>
              <p className="text-body-xs text-neutral-300">
                Identitas, kontak publik, dan akun sosial yang tampil di situs. Kolom kosong disembunyikan di situs.
              </p>
            </div>
          </div>
          {canEdit && (
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-accent-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isSaving ? 'Menyimpan…' : 'Simpan pengaturan'}</span>
            </button>
          )}
        </div>
      </div>

      <div role="status" aria-live="polite" className="empty:hidden">
        {loadState === 'loading' && <p className="text-xs text-neutral-300">Memuat pengaturan…</p>}
        {status && (
          <p className={`p-3 rounded-xl border text-xs ${status.tone === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}>
            {status.tone === 'ok' ? 'Berhasil: ' : 'Gagal: '}
            {status.text}
          </p>
        )}
      </div>
      {loadState === 'error' && (
        <p role="alert" className="p-3 rounded-xl border bg-red-500/10 border-red-500/30 text-xs text-red-200">
          Pengaturan gagal dimuat dari database. Muat ulang halaman untuk mencoba lagi; formulir dikunci agar data tidak tertimpa.
        </p>
      )}

      {!canEdit && (
        <p className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>Hanya baca: peran Anda ({role}) tidak dapat mengubah pengaturan situs. Hubungi Super Admin atau Content Admin.</span>
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <fieldset className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 space-y-4 min-w-0">
          <legend className="sr-only">Identitas situs</legend>
          {cardTitle(<Globe className="w-4 h-4 text-accent-400" aria-hidden="true" />, 'Identitas situs')}
          <div className="space-y-3">
            {text('name', 'Nama situs')}
            {text('tagline', 'Tagline')}
            {text('url', 'URL produksi', { type: 'url', hint: 'Dipakai untuk URL kanonikal, sitemap, dan pengindeksan. Contoh: https://spatium.id' })}
            <Field id={fieldId('description')} label="Deskripsi situs" hint="Deskripsi bawaan untuk metadata dan data terstruktur." error={errors.description}>
              {(props) => (
                <textarea
                  {...props}
                  rows={3}
                  disabled={disabled}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            {text('logoUrl', 'Logo', { hint: 'Path lokal (mis. /brand/logo.svg) atau URL https://.' })}
            {text('faviconUrl', 'Favicon', { hint: 'Path lokal atau URL https://.' })}
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 space-y-4 min-w-0">
          <legend className="sr-only">Kontak publik</legend>
          {cardTitle(<Phone className="w-4 h-4 text-info" aria-hidden="true" />, 'Kontak publik')}
          <div className="space-y-3">
            {text('email', 'Email publik', { type: 'email', hint: 'Tampil di footer, menu, halaman kontak, dan tombol kirim brief lewat email.' })}
            {text('phone', 'Telepon', { type: 'tel', hint: 'Ditampilkan apa adanya dan dipakai untuk tautan tel:. Contoh: +62 21 1234 5678' })}
            {text('whatsapp', 'Nomor WhatsApp', {
              type: 'tel',
              hint: `Disimpan dalam format internasional tanpa spasi; awalan 0 dibaca sebagai +62. ${
                whatsappPreview ? `Tautan: ${whatsappPreview}` : 'Kosongkan untuk menyembunyikan tombol WhatsApp.'
              }`,
            })}
            {textarea('whatsappMessage', 'Pesan awal WhatsApp', 2, 'Opsional. Teks yang terisi otomatis saat pengunjung membuka WhatsApp dari tombol situs.')}
            {textarea('address', 'Alamat', 2)}
            {textarea('openingHours', 'Jam operasional', 2, 'Teks bebas, mis. "Senin–Jumat, 09.00–17.00 WIB".')}
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 space-y-4 min-w-0">
          <legend className="sr-only">Akun sosial</legend>
          {cardTitle(<Share2 className="w-4 h-4 text-amber-400" aria-hidden="true" />, 'Akun sosial')}
          <p className="text-[11px] text-neutral-400">Isi URL profil lengkap (https://). Kolom kosong tidak ditampilkan di situs.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOCIAL_FIELDS.map((f) => {
              const key = `socialLinks.${f.key}` as const
              return (
                <Field key={f.key} id={fieldId(key)} label={f.label} error={errors[key]}>
                  {(props) => (
                    <input
                      {...props}
                      type="url"
                      inputMode="url"
                      disabled={disabled}
                      value={form.socialLinks[f.key]}
                      onChange={(e) => setSocial(f.key, e.target.value)}
                      className={inputClass}
                    />
                  )}
                </Field>
              )
            })}
          </div>
        </fieldset>

        {canEdit && (
          <section className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 space-y-4 min-w-0" aria-labelledby={`${baseId}-cache`}>
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Database className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <h3 id={`${baseId}-cache`} className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
                Cache situs
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400">
              Konten yang terbit sudah memperbarui cache otomatis. Gunakan tombol ini bila halaman publik masih menampilkan versi lama.
            </p>
            <button
              type="button"
              disabled={flushing}
              onClick={handleFlushCache}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium text-white transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent-400 ${flushing ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
              <span>{flushing ? 'Memperbarui cache…' : 'Perbarui cache halaman publik'}</span>
            </button>
            <p role="status" className={`text-[11px] text-center empty:hidden ${flushStatus?.tone === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
              {flushStatus ? `${flushStatus.tone === 'ok' ? 'Berhasil' : 'Gagal'}: ${flushStatus.text}` : ''}
            </p>
          </section>
        )}
      </div>
    </form>
  )
}
