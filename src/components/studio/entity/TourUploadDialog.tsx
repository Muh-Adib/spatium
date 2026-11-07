'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button, Dialog, FieldError, FieldHelp, describedBy, inputClass } from '../blocks/ui'
import { LABEL_CLASS, RequiredMark } from './fields'

type Props = {
  open: boolean
  onClose: () => void
  /** Called after a successful upload (the list should reload). */
  onUploaded: (slug: string | null) => void
  categories: readonly string[]
}

type Result = { message: string; liveUrl: string | null; slug: string | null }

const str = (v: unknown) => (typeof v === 'string' ? v : null)

/**
 * Upload a spatial tour package (.zip / .html) or register a SuperSplat scene
 * (`POST /api/portfolio/upload-tour`). The portfolio lands as a draft.
 */
export function TourUploadDialog({ open, onClose, onUploaded, categories }: Props) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [client, setClient] = useState('')
  const [category, setCategory] = useState('')
  const [splatId, setSplatId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setSlug('')
    setClient('')
    setCategory('')
    setSplatId('')
    setExternalUrl('')
    setFile(null)
    setError(null)
    setTitleError(null)
    setResult(null)
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!title.trim()) {
      setTitleError('Isi judul proyek.')
      titleRef.current?.focus()
      return
    }
    if (!file && !splatId.trim() && !externalUrl.trim()) {
      setError('Pilih berkas .zip/.html, atau isi ID scene SuperSplat atau URL eksternal.')
      return
    }
    setTitleError(null)
    setError(null)
    setBusy(true)
    const data = new FormData()
    data.append('title', title.trim())
    const optional: [string, string][] = [
      ['slug', slug],
      ['client', client],
      ['category', category],
      ['splatId', splatId],
      ['externalUrl', externalUrl],
    ]
    for (const [k, v] of optional) if (v.trim()) data.append(k, v.trim())
    if (file) data.append('file', file)
    try {
      const res = await fetch('/api/portfolio/upload-tour', { method: 'POST', body: data })
      let json: unknown = null
      try {
        json = await res.json()
      } catch (parseErr) {
        console.warn('[tour-upload] non-JSON response:', parseErr)
      }
      const body: Record<string, unknown> = json && typeof json === 'object' && !Array.isArray(json) ? Object.fromEntries(Object.entries(json)) : {}
      if (!res.ok || body.success !== true) {
        setError(str(body.error) ?? `Unggahan gagal (HTTP ${res.status}). Periksa berkas lalu coba lagi.`)
        return
      }
      const uploaded: Result = { message: str(body.message) ?? 'Tur tersimpan sebagai draf.', liveUrl: str(body.liveUrl), slug: str(body.slug) }
      setResult(uploaded)
      onUploaded(uploaded.slug)
    } catch (err) {
      console.error('[tour-upload] upload failed:', err)
      setError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}, help?: string) => (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input id={id} type="text" autoComplete="off" value={value} onChange={(e) => set(e.target.value)} aria-describedby={help ? `${id}-help` : undefined} className={inputClass(false, 'h-10')} {...extra} />
      {help ? <FieldHelp id={`${id}-help`}>{help}</FieldHelp> : null}
    </div>
  )

  return (
    <Dialog
      open={open}
      onClose={() => (busy ? undefined : onClose())}
      title="Unggah tur spasial"
      description="Paket .zip (HTML + aset), berkas .html, atau scene SuperSplat. Hasilnya tersimpan sebagai draf portofolio."
      width={36}
      initialFocusRef={titleRef}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          <Button variant="primary" type="submit" form="tour-upload-form" icon={Upload} busy={busy}>
            {busy ? 'Mengunggah…' : 'Unggah dan simpan draf'}
          </Button>
        </>
      }
    >
      <form id="tour-upload-form" noValidate onSubmit={submit} className="space-y-4">
        {error ? (
          <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}
        {result ? (
          <p role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {result.message}
            {result.liveUrl ? (
              <>
                {' '}
                <a href={result.liveUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Buka tur<span className="sr-only"> (tab baru)</span>
                </a>
              </>
            ) : null}
          </p>
        ) : null}
        <div>
          <label htmlFor="tour-title" className={LABEL_CLASS}>
            Judul proyek
            <RequiredMark />
          </label>
          <input
            ref={titleRef}
            id="tour-title"
            type="text"
            autoComplete="off"
            value={title}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={describedBy(titleError && 'tour-title-error')}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass(Boolean(titleError), 'h-10')}
          />
          <FieldError id="tour-title-error" messages={titleError ? [titleError] : undefined} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('tour-client', 'Klien (opsional)', client, setClient)}
          {field('tour-category', 'Kategori (opsional)', category, setCategory, { list: 'tour-categories' })}
        </div>
        <datalist id="tour-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {field('tour-slug', 'Slug (opsional)', slug, setSlug, { spellCheck: false, className: inputClass(false, 'h-10 font-mono') }, 'Kosong = dibuat dari judul. Slug yang sudah ada diperbarui, bukan diganti.')}
        <div>
          <label htmlFor="tour-file" className={LABEL_CLASS}>
            Berkas tur (.zip atau .html)
          </label>
          <input
            id="tour-file"
            type="file"
            accept=".zip,.html,.htm"
            aria-describedby="tour-file-help"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-neutral-200 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:text-sm file:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
          />
          <FieldHelp id="tour-file-help">Maksimal 250 MB. Tur lokal tidak disematkan di blok scene; untuk viewer 3D gunakan SuperSplat.</FieldHelp>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('tour-splat', 'Atau ID scene SuperSplat', splatId, setSplatId, { spellCheck: false })}
          {field('tour-url', 'Atau URL eksternal', externalUrl, setExternalUrl, { inputMode: 'url', spellCheck: false })}
        </div>
      </form>
    </Dialog>
  )
}
