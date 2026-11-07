'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { slugify } from '@/lib/pages/page-schema'
import { Button, Dialog, FieldError, FieldHelp, describedBy, inputClass } from '../blocks/ui'
import { entityApi } from './client'
import { LABEL_CLASS, RequiredMark } from './fields'
import { ENTITY_LABEL, SLUG_PATTERN, type EntityKind, type EntityRow } from './model'

type Props = {
  kind: EntityKind
  open: boolean
  onClose: () => void
  onCreated: (id: number) => void
  /** Existing rows of this kind (slug clash check) and categories (service parent). */
  existing: readonly EntityRow[]
  categories: readonly EntityRow[]
}

type Errors = { title?: string; slug?: string; categoryId?: string; form?: string }

const PREFIX: Record<EntityKind, string> = { 'service-category': '/services/', service: '/services/…/', portfolio: '/portfolio/' }

/**
 * Creates the entity as a draft right away (the API stores the block preset),
 * then the editor opens on it. Saving first keeps one simple, robust editor:
 * the live preview always has an id to load.
 */
export function CreateEntityDialog({ kind, open, onClose, onCreated, existing, categories }: Props) {
  const label = ENTITY_LABEL[kind]
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const slugRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const ids = { title: `create-${kind}-title`, slug: `create-${kind}-slug`, category: `create-${kind}-category` }

  useEffect(() => {
    if (!open) return
    setTitle('')
    setSlug('')
    setSlugEdited(false)
    setCategoryId('')
    setErrors({})
    setBusy(false)
  }, [open])

  const validate = (): Errors => {
    const found: Errors = {}
    if (!title.trim()) found.title = kind === 'service' ? 'Isi nama layanan.' : 'Isi judul.'
    const s = slug.trim()
    if (!s) found.slug = 'Isi slug, mis. pemindaian-gedung.'
    else if (!SLUG_PATTERN.test(s)) found.slug = 'Gunakan huruf kecil, angka, dan tanda hubung saja.'
    else if (existing.some((r) => r.slug === s)) found.slug = `Slug “${s}” sudah dipakai. Pilih slug lain.`
    if (kind === 'service' && !categoryId) found.categoryId = 'Pilih kategori induk.'
    return found
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    const found = validate()
    setErrors(found)
    if (found.title) return titleRef.current?.focus()
    if (found.categoryId) return categoryRef.current?.focus()
    if (found.slug) return slugRef.current?.focus()
    setBusy(true)
    const payload: Record<string, unknown> =
      kind === 'service' ? { name: title.trim(), slug: slug.trim(), categoryId: Number(categoryId) } : { title: title.trim(), slug: slug.trim() }
    const res = await entityApi.save(kind, payload)
    setBusy(false)
    if (res.ok) {
      onCreated(res.data.id)
      return
    }
    if (res.failure.status === 409) {
      setErrors({ slug: res.failure.error })
      slugRef.current?.focus()
    } else {
      setErrors({ form: [res.failure.error, ...res.failure.issues, ...res.failure.fieldIssues.map((i) => i.message)].join(' ') })
    }
  }

  const host = siteConfig.url.replace(/^https?:\/\//, '')
  const parentSlug = categories.find((c) => String(c.id) === categoryId)?.slug
  const prefix = kind === 'service' && parentSlug ? `/services/${parentSlug}/` : PREFIX[kind]
  const formId = `create-${kind}-form`

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Buat ${label.one}`}
      description="Disimpan sebagai draf dengan susunan blok bawaan. Lengkapi isi dan SEO di editor sebelum menerbitkan."
      width={32}
      initialFocusRef={titleRef}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" form={formId} icon={Plus} busy={busy}>
            {busy ? 'Membuat…' : 'Buat dan buka editor'}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="space-y-4">
        {errors.form ? (
          <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
            {errors.form}
          </p>
        ) : null}
        <div>
          <label htmlFor={ids.title} className={LABEL_CLASS}>
            {kind === 'service' ? 'Nama' : 'Judul'}
            <RequiredMark />
          </label>
          <input
            ref={titleRef}
            id={ids.title}
            type="text"
            autoComplete="off"
            value={title}
            maxLength={200}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy(errors.title && `${ids.title}-error`)}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugEdited) setSlug(slugify(e.target.value))
            }}
            className={inputClass(Boolean(errors.title), 'h-10')}
          />
          <FieldError id={`${ids.title}-error`} messages={errors.title ? [errors.title] : undefined} />
        </div>
        {kind === 'service' ? (
          <div>
            <label htmlFor={ids.category} className={LABEL_CLASS}>
              Kategori induk
              <RequiredMark />
            </label>
            <select
              ref={categoryRef}
              id={ids.category}
              value={categoryId}
              aria-invalid={errors.categoryId ? true : undefined}
              aria-describedby={describedBy(errors.categoryId && `${ids.category}-error`)}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass(Boolean(errors.categoryId), 'h-10')}
            >
              <option value="">Pilih kategori…</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {typeof c.title === 'string' && c.title ? c.title : c.slug}
                </option>
              ))}
            </select>
            <FieldError id={`${ids.category}-error`} messages={errors.categoryId ? [errors.categoryId] : undefined} />
          </div>
        ) : null}
        <div>
          <label htmlFor={ids.slug} className={LABEL_CLASS}>
            Slug
            <RequiredMark />
          </label>
          <div className="flex items-stretch">
            <span title={prefix} className="inline-flex min-w-0 max-w-[60%] shrink-0 items-center rounded-l-lg border border-r-0 border-white/15 bg-white/[0.06] px-2.5 font-mono text-xs text-neutral-300" aria-hidden="true">
              <span className="truncate">{prefix}</span>
            </span>
            <input
              ref={slugRef}
              id={ids.slug}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={slug}
              aria-invalid={errors.slug ? true : undefined}
              aria-describedby={describedBy(errors.slug && `${ids.slug}-error`, `${ids.slug}-help`)}
              onChange={(e) => {
                setSlugEdited(true)
                setSlug(e.target.value)
              }}
              className={inputClass(Boolean(errors.slug), 'h-10 rounded-l-none font-mono')}
            />
          </div>
          <FieldError id={`${ids.slug}-error`} messages={errors.slug ? [errors.slug] : undefined} />
          <FieldHelp id={`${ids.slug}-help`}>
            Dibuat dari judul. Alamat publik: <span className="font-mono [overflow-wrap:anywhere]">{host}{prefix}{slug || '…'}</span>
          </FieldHelp>
        </div>
      </form>
    </Dialog>
  )
}
