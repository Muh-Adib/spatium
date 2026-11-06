'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { pageSlugSchema, slugify } from '@/lib/pages/page-schema'
import { siteConfig } from '@/config/site'
import { Button, Dialog, FieldError, FieldHelp, describedBy, inputClass } from '../blocks/ui'
import { pagesApi, type PageDto } from './client'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (page: PageDto) => void
  existingSlugs: ReadonlySet<string>
}

type Errors = { title?: string; slug?: string; form?: string }

/** Validates on submit (and live once a field has been touched), never by disabling submit. */
function validate(title: string, slug: string, existing: ReadonlySet<string>): Errors {
  const errors: Errors = {}
  if (!title.trim()) errors.title = 'Isi judul halaman.'
  const parsed = pageSlugSchema.safeParse(slug)
  if (!parsed.success) errors.slug = parsed.error.issues[0]?.message ?? 'Slug tidak valid.'
  else if (existing.has(parsed.data)) errors.slug = `Slug “${parsed.data}” sudah dipakai halaman lain.`
  return errors
}

export function CreatePageDialog({ open, onClose, onCreated, existingSlugs }: Props) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [touched, setTouched] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const slugRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setSlug('')
      setSlugEdited(false)
      setTouched(false)
      setErrors({})
      setBusy(false)
    }
  }, [open])

  const update = (nextTitle: string, nextSlug: string) => {
    if (touched) setErrors(validate(nextTitle, nextSlug, existingSlugs))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setTouched(true)
    const found = validate(title, slug, existingSlugs)
    setErrors(found)
    if (found.title) return titleRef.current?.focus()
    if (found.slug) return slugRef.current?.focus()
    setBusy(true)
    const res = await pagesApi.create({ title: title.trim(), slug: slug.trim(), blocks: [] })
    setBusy(false)
    if (res.ok) {
      onCreated(res.data.page)
      return
    }
    if (res.failure.code === 'slug_taken') {
      setErrors({ slug: res.failure.error })
      slugRef.current?.focus()
    } else {
      setErrors({ form: [res.failure.error, ...(res.failure.issues ?? [])].join(' ') })
    }
  }

  const host = siteConfig.url.replace(/^https?:\/\//, '')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Buat halaman"
      description="Halaman baru disimpan sebagai draf. Anda bisa menyusun blok dan mengisi SEO sebelum menerbitkannya."
      width={30}
      initialFocusRef={titleRef}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" form="create-page-form" icon={Plus} busy={busy}>
            {busy ? 'Membuat…' : 'Buat dan buka editor'}
          </Button>
        </>
      }
    >
      <form id="create-page-form" noValidate onSubmit={submit} className="space-y-4">
        {errors.form ? (
          <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
            {errors.form}
          </p>
        ) : null}
        <div>
          <label htmlFor="new-page-title" className="mb-1.5 block text-sm font-medium text-neutral-100">
            Judul halaman
          </label>
          <input
            ref={titleRef}
            id="new-page-title"
            name="title"
            type="text"
            autoComplete="off"
            value={title}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy(errors.title && 'new-page-title-error')}
            onChange={(e) => {
              const t = e.target.value
              const s = slugEdited ? slug : slugify(t)
              setTitle(t)
              if (!slugEdited) setSlug(s)
              update(t, s)
            }}
            className={inputClass(Boolean(errors.title), 'h-10')}
          />
          <FieldError id="new-page-title-error" messages={errors.title ? [errors.title] : undefined} />
        </div>
        <div>
          <label htmlFor="new-page-slug" className="mb-1.5 block text-sm font-medium text-neutral-100">
            Slug (alamat URL)
          </label>
          <div className="flex items-stretch">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-white/15 bg-white/[0.06] px-2.5 font-mono text-xs text-neutral-300" aria-hidden="true">
              /
            </span>
            <input
              ref={slugRef}
              id="new-page-slug"
              name="slug"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={slug}
              aria-invalid={errors.slug ? true : undefined}
              aria-describedby={describedBy(errors.slug && 'new-page-slug-error', 'new-page-slug-help')}
              onChange={(e) => {
                setSlugEdited(true)
                setSlug(e.target.value)
                update(title, e.target.value)
              }}
              className={inputClass(Boolean(errors.slug), 'h-10 rounded-l-none font-mono')}
            />
          </div>
          <FieldError id="new-page-slug-error" messages={errors.slug ? [errors.slug] : undefined} />
          <FieldHelp id="new-page-slug-help">
            Dibuat otomatis dari judul. Alamat publik: <span className="font-mono [overflow-wrap:anywhere]">{host}/{slug || '…'}</span>
          </FieldHelp>
        </div>
      </form>
    </Dialog>
  )
}
