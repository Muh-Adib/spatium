'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { ArrowRight, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { FormField, IconButton, Modal, StatusMessage, TextButton, fieldCls, type StatusTone } from '@/components/admin/AdminUi'
import { fetchJson, jsonHeaders } from './fetchJson'

const redirectSchema = z.object({
  id: z.number(),
  sourcePath: z.string(),
  destinationPath: z.string(),
  statusCode: z.number().optional(),
  reason: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
})
type RedirectRule = z.infer<typeof redirectSchema>
const listSchema = z.object({ data: z.array(redirectSchema), pagination: z.object({ total: z.number() }).optional() })
const messageSchema = z.object({ message: z.string().optional() }).passthrough()

const normalizePath = (v: string) => {
  const t = v.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : t.startsWith('/') ? t : `/${t}`
}

type FormErrors = Partial<Record<'source' | 'dest', string>>

export default function RedirectsTab() {
  const { can } = useAuth()
  const canDelete = can('redirect:delete')
  const canEdit = can('redirect:manage')

  const [rules, setRules] = useState<RedirectRule[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [notice, setNotice] = useState<{ message: string; tone: StatusTone } | null>(null)

  const [source, setSource] = useState('')
  const [dest, setDest] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const sourceRef = useRef<HTMLInputElement>(null)
  const destRef = useRef<HTMLInputElement>(null)

  const [testPath, setTestPath] = useState('')
  const [deleting, setDeleting] = useState<RedirectRule | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchJson('/api/redirects?limit=100', listSchema, {
      signal: controller.signal,
      fallbackError: 'Daftar redirect belum bisa dimuat.',
    }).then((r) => {
      if (controller.signal.aborted) return
      if (r.ok) {
        setRules(r.data.data)
        setTotal(r.data.pagination?.total ?? r.data.data.length)
        setLoadError(null)
      } else setLoadError(r.error)
      setLoading(false)
    })
    return () => controller.abort()
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const testResult = useMemo(() => {
    const p = normalizePath(testPath).toLowerCase()
    if (!p) return null
    const hit = rules.find((r) => r.sourcePath.toLowerCase() === p || r.sourcePath.toLowerCase() === p.replace(/\/$/, ''))
    return hit
      ? { matched: true, text: `Cocok: ${p} dialihkan (${hit.statusCode ?? 301}) ke ${hit.destinationPath}` }
      : { matched: false, text: `Tidak ada aturan untuk ${p}. Halaman ditangani router seperti biasa.` }
  }, [testPath, rules])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    const s = normalizePath(source)
    const d = normalizePath(dest)
    const next: FormErrors = {}
    if (!s) next.source = 'Isi path asal, misalnya /promo-lama.'
    if (!d) next.dest = 'Isi path atau URL tujuan.'
    else if (s && s.replace(/\/$/, '') === d.replace(/\/$/, '')) next.dest = 'Tujuan tidak boleh sama dengan asal.'
    setErrors(next)
    if (next.source) return sourceRef.current?.focus()
    if (next.dest) return destRef.current?.focus()

    setSaving(true)
    const r = await fetchJson('/api/redirects', messageSchema, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ sourcePath: s, destinationPath: d, statusCode: 301, reason: reason.trim() || 'Aturan redirect dari Studio' }),
      fallbackError: 'Aturan redirect belum tersimpan.',
    })
    setSaving(false)
    if (r.ok) {
      setNotice({ message: r.data.message || `Aturan ${s} → ${d} disimpan.`, tone: 'success' })
      setSource('')
      setDest('')
      setReason('')
      reload()
    } else setNotice({ message: r.error, tone: 'error' })
  }

  const handleDelete = async () => {
    if (!deleting || deleteBusy) return
    setDeleteBusy(true)
    const r = await fetchJson(`/api/redirects?id=${deleting.id}`, messageSchema, {
      method: 'DELETE',
      fallbackError: 'Aturan redirect belum terhapus.',
    })
    setDeleteBusy(false)
    if (r.ok) {
      setNotice({ message: r.data.message || 'Aturan redirect dihapus.', tone: 'success' })
      setDeleting(null)
      reload()
    } else setNotice({ message: r.error, tone: 'error' })
  }

  return (
    <div className="space-y-6">
      <StatusMessage message={notice?.message ?? null} tone={notice?.tone} onDismiss={() => setNotice(null)} />

      {canEdit && (
      <form onSubmit={handleAdd} noValidate aria-labelledby="redirect-add" className="space-y-4 rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5">
        <h2 id="redirect-add" className="text-sm font-semibold">
          Tambah aturan 301
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <FormField label="Path asal" error={errors.source} hint="Contoh: /promo-lama">
            {(p) => (
              <input {...p} ref={sourceRef} type="text" inputMode="url" value={source} onChange={(e) => setSource(e.target.value)} className={`${fieldCls} font-mono text-xs`} />
            )}
          </FormField>
          <FormField label="Tujuan" error={errors.dest} hint="Path internal atau URL lengkap">
            {(p) => (
              <input {...p} ref={destRef} type="text" inputMode="url" value={dest} onChange={(e) => setDest(e.target.value)} className={`${fieldCls} font-mono text-xs`} />
            )}
          </FormField>
          <FormField label="Catatan (opsional)">
            {(p) => <input {...p} type="text" value={reason} onChange={(e) => setReason(e.target.value)} className={fieldCls} />}
          </FormField>
        </div>
        <TextButton type="submit" tone="primary" busy={saving}>
          {saving ? 'Menyimpan…' : 'Simpan aturan'}
        </TextButton>
      </form>
      )}

      <section aria-labelledby="redirect-test" className="space-y-3 rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5">
        <h2 id="redirect-test" className="text-sm font-semibold">
          Uji path
        </h2>
        <FormField label="Path yang ingin diuji" hint="Dicocokkan dengan aturan yang dimuat di bawah.">
          {(p) => <input {...p} type="text" value={testPath} onChange={(e) => setTestPath(e.target.value)} className={`${fieldCls} font-mono text-xs`} />}
        </FormField>
        <p role="status" className="text-xs">
          {testResult && (
            <span className={testResult.matched ? 'text-emerald-200' : 'text-neutral-200'}>
              <span aria-hidden="true">{testResult.matched ? '✓ ' : '○ '}</span>
              {testResult.text}
            </span>
          )}
        </p>
      </section>

      <section aria-labelledby="redirect-list" className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--studio-bg)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
          <h2 id="redirect-list" className="text-sm font-semibold">
            Aturan tersimpan
          </h2>
          <p className="text-xs text-neutral-300">{loading ? 'Memuat…' : `${total} aturan${total > rules.length ? ` (menampilkan ${rules.length})` : ''}`}</p>
        </div>
        {loadError ? (
          <div role="alert" className="space-y-3 px-5 py-8 text-center text-sm text-red-200">
            <p>{loadError}</p>
            <TextButton onClick={reload}>Coba lagi</TextButton>
          </div>
        ) : !loading && rules.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-300">Belum ada aturan redirect.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
                  <span className="break-all text-white">{r.sourcePath}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
                  <span className="sr-only">dialihkan ke</span>
                  <span className="break-all text-accent-300">{r.destinationPath}</span>
                  <span className="font-sans text-[11px] text-neutral-300">({r.statusCode ?? 301}{r.active === false ? ', nonaktif' : ''})</span>
                </div>
                {r.reason && <p className="text-xs text-neutral-300 sm:max-w-xs">{r.reason}</p>}
                {canDelete && (
                  <IconButton icon={Trash2} tone="danger" size="sm" label={`Hapus aturan ${r.sourcePath}`} onClick={() => setDeleting(r)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Hapus aturan redirect?"
        description={
          <>
            {deleting?.sourcePath} tidak akan dialihkan lagi dan bisa menghasilkan 404 bila halamannya sudah tidak ada.
          </>
        }
        icon={Trash2}
        tone="danger"
        footer={
          <>
            <TextButton onClick={() => setDeleting(null)}>Batal</TextButton>
            <TextButton tone="danger" onClick={handleDelete} busy={deleteBusy}>
              {deleteBusy ? 'Menghapus…' : 'Hapus aturan'}
            </TextButton>
          </>
        }
      />
    </div>
  )
}
