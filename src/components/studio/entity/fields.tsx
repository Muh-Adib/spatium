'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import MediaPickerModal from '@/components/studio/MediaPickerModal'
import { Button, FieldError, FieldHelp, describedBy, inputClass } from '../blocks/ui'
import { ItemActions } from '../blocks/fields/ItemActions'
import { moveItem, removeItem } from '../blocks/model'
import { fieldDomId, type FieldErrors } from './model'

/**
 * Form controls of the entity editor. Every control is labelled by a visible
 * <label>; errors are inline (aria-invalid + aria-describedby); helper text
 * uses text-neutral-300 (contrast ≥ 4.5:1 on the Studio surfaces).
 */

export const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-neutral-100'

export function RequiredMark() {
  return (
    <>
      <span className="ml-1 text-red-300" aria-hidden="true">
        *
      </span>
      <span className="sr-only"> (wajib)</span>
    </>
  )
}

export function Section({ id, title, description, children }: { id: string; title: string; description?: React.ReactNode; children: React.ReactNode }) {
  const headingId = `entity-section-${id}`
  return (
    <section aria-labelledby={headingId} className="space-y-4 rounded-xl border border-white/10 bg-surface-elevated p-3 sm:p-4">
      <div>
        <h3 id={headingId} className="text-sm font-semibold text-white">
          {title}
        </h3>
        {description ? <p className="mt-1 text-xs leading-relaxed text-neutral-300">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

type FieldShellProps = {
  field: string
  label: string
  required?: boolean
  help?: React.ReactNode
  errors: FieldErrors
  /** Extra ids to describe the control (e.g. a counter). */
  extraDescribedBy?: string
  children: (control: { id: string; invalid: boolean; describedBy: string | undefined }) => React.ReactNode
}

/** Label + control + inline error + help, wired with ids. */
export function FieldShell({ field, label, required, help, errors, extraDescribedBy, children }: FieldShellProps) {
  const id = fieldDomId(field)
  const error = errors[field]
  const errorId = error ? `${id}-error` : null
  const helpId = help ? `${id}-help` : null
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children({ id, invalid: Boolean(error), describedBy: describedBy(errorId, extraDescribedBy, helpId) })}
      {errorId ? <FieldError id={errorId} messages={error ? [error] : undefined} /> : null}
      {helpId ? <FieldHelp id={helpId}>{help}</FieldHelp> : null}
    </div>
  )
}

type TextProps = {
  field: string
  label: string
  value: string
  onChange: (value: string) => void
  errors: FieldErrors
  required?: boolean
  help?: React.ReactNode
  placeholder?: string
  maxLength?: number
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  mono?: boolean
  prefix?: string
  list?: string
  counter?: { min: number; ideal: number; max: number }
}

export function TextField({ field, label, value, onChange, errors, required, help, placeholder, maxLength, inputMode, mono, prefix, list, counter }: TextProps) {
  const counterId = counter ? `${fieldDomId(field)}-count` : undefined
  return (
    <FieldShell field={field} label={label} required={required} help={help} errors={errors} extraDescribedBy={counterId}>
      {({ id, invalid, describedBy: desc }) => (
        <>
          <div className="flex items-stretch">
            {prefix ? (
              <span
                title={prefix}
                className="inline-flex min-w-0 max-w-[60%] shrink-0 items-center rounded-l-lg border border-r-0 border-white/15 bg-white/[0.06] px-2.5 font-mono text-xs text-neutral-300"
                aria-hidden="true"
              >
                <span className="truncate">{prefix}</span>
              </span>
            ) : null}
            <input
              id={id}
              type="text"
              value={value}
              maxLength={maxLength}
              placeholder={placeholder}
              inputMode={inputMode}
              list={list}
              spellCheck={mono ? false : undefined}
              autoComplete="off"
              aria-invalid={invalid || undefined}
              aria-describedby={desc}
              onChange={(e) => onChange(e.target.value)}
              className={inputClass(invalid, `h-10 ${mono ? 'font-mono' : ''} ${prefix ? 'rounded-l-none' : ''}`)}
            />
          </div>
          {counter && counterId ? <Counter id={counterId} value={value} {...counter} /> : null}
        </>
      )}
    </FieldShell>
  )
}

export function TextAreaField({
  field,
  label,
  value,
  onChange,
  errors,
  required,
  help,
  placeholder,
  maxLength,
  rows = 3,
  counter,
}: Omit<TextProps, 'inputMode' | 'mono' | 'prefix' | 'list'> & { rows?: number }) {
  const counterId = counter ? `${fieldDomId(field)}-count` : undefined
  return (
    <FieldShell field={field} label={label} required={required} help={help} errors={errors} extraDescribedBy={counterId}>
      {({ id, invalid, describedBy: desc }) => (
        <>
          <textarea
            id={id}
            rows={rows}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            aria-describedby={desc}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass(invalid, 'min-h-[5.5rem] resize-y py-2 leading-relaxed [field-sizing:content]')}
          />
          {counter && counterId ? <Counter id={counterId} value={value} {...counter} /> : null}
        </>
      )}
    </FieldShell>
  )
}

export function SelectField({
  field,
  label,
  value,
  onChange,
  errors,
  required,
  help,
  options,
}: {
  field: string
  label: string
  value: string
  onChange: (value: string) => void
  errors: FieldErrors
  required?: boolean
  help?: React.ReactNode
  options: readonly { value: string; label: string }[]
}) {
  return (
    <FieldShell field={field} label={label} required={required} help={help} errors={errors}>
      {({ id, invalid, describedBy: desc }) => (
        <select
          id={id}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={desc}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(invalid, 'h-10')}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  )
}

export function CheckboxField({ field, label, checked, onChange, help }: { field: string; label: string; checked: boolean; onChange: (v: boolean) => void; help?: React.ReactNode }) {
  const id = fieldDomId(field)
  const helpId = help ? `${id}-help` : undefined
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/30 bg-white/[0.03] accent-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        />
        <label htmlFor={id} className="text-sm font-medium text-neutral-100">
          {label}
        </label>
      </div>
      {helpId ? (
        <div className="pl-[1.875rem]">
          <FieldHelp id={helpId}>{help}</FieldHelp>
        </div>
      ) : null}
    </div>
  )
}

/** Length counter: number + state word, never colour alone. */
export function Counter({ id, value, min, ideal, max }: { id: string; value: string; min: number; ideal: number; max: number }) {
  const n = value.trim().length
  const state = n === 0 ? 'Kosong' : n < min ? `Terlalu pendek (min. ${min})` : n > max ? `Terlalu panjang (maks. ${max})` : n > ideal ? 'Mungkin terpotong di Google' : 'Panjang pas'
  const ok = n >= min && n <= ideal
  return (
    <p id={id} className={`mt-1.5 flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-200' : 'text-neutral-300'}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
      {n} karakter · {state}
    </p>
  )
}

/** Ordered list of short strings (deliverables, tools): one input per item, buttons to reorder/remove. */
export function StringListField({
  field,
  legend,
  itemLabel,
  items,
  onChange,
  help,
  errors,
}: {
  field: string
  legend: string
  itemLabel: string
  items: readonly string[]
  onChange: (next: string[]) => void
  help?: React.ReactNode
  errors: FieldErrors
}) {
  const baseId = fieldDomId(field)
  const focusIndex = useRef<number | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const helpId = help ? `${baseId}-help` : undefined
  const error = errors[field]

  useEffect(() => {
    const i = focusIndex.current
    if (i === null) return
    focusIndex.current = null
    listRef.current?.querySelectorAll<HTMLInputElement>('input')[i]?.focus()
  })

  return (
    <fieldset className="min-w-0" aria-describedby={describedBy(helpId, error ? `${baseId}-error` : null)}>
      <legend className={LABEL_CLASS}>{legend}</legend>
      {items.length === 0 ? <p className="mb-2 text-xs text-neutral-300">Belum ada {itemLabel.toLowerCase()}.</p> : null}
      <ol ref={listRef} className="space-y-2">
        {items.map((item, i) => {
          const id = i === 0 ? baseId : `${baseId}-${i}`
          const name = `${itemLabel} ${i + 1}`
          return (
            <li key={i} className="flex items-start gap-1">
              <div className="min-w-0 flex-1">
                <label htmlFor={id} className="sr-only">
                  {name}
                </label>
                <input
                  id={id}
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = e.target.value
                    onChange(next)
                  }}
                  className={inputClass(false, 'h-10')}
                />
              </div>
              <ItemActions
                index={i}
                count={items.length}
                itemName={name}
                onMove={(to) => onChange(moveItem(items, i, to))}
                onRemove={() => {
                  focusIndex.current = Math.max(0, i - 1)
                  onChange(removeItem(items, i))
                }}
              />
            </li>
          )
        })}
      </ol>
      <Button
        size="sm"
        icon={Plus}
        className="mt-2"
        onClick={() => {
          focusIndex.current = items.length
          onChange([...items, ''])
        }}
      >
        Tambah {itemLabel.toLowerCase()}
      </Button>
      {error ? <FieldError id={`${baseId}-error`} messages={[error]} /> : null}
      {helpId ? <FieldHelp id={helpId}>{help}</FieldHelp> : null}
    </fieldset>
  )
}

/** Short tags (technologies): chips with a named remove button, Enter adds. */
export function ChipsField({
  field,
  legend,
  items,
  onChange,
  help,
}: {
  field: string
  legend: string
  items: readonly string[]
  onChange: (next: string[]) => void
  help?: React.ReactNode
}) {
  const [draft, setDraft] = useState('')
  const id = fieldDomId(field)
  const helpId = help ? `${id}-help` : undefined
  const inputRef = useRef<HTMLInputElement>(null)
  const add = () => {
    const value = draft.trim()
    if (!value) return
    if (!items.includes(value)) onChange([...items, value])
    setDraft('')
  }
  return (
    <fieldset className="min-w-0">
      <legend className={LABEL_CLASS}>{legend}</legend>
      {items.length ? (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label={`${legend} terpilih`}>
          {items.map((item, i) => (
            <li key={item} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] py-0.5 pl-2.5 pr-0.5 text-sm text-neutral-100">
              {item}
              <button
                type="button"
                aria-label={`Hapus ${item}`}
                onClick={() => {
                  onChange(removeItem(items, i))
                  inputRef.current?.focus()
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-300 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-xs text-neutral-300">Belum ada.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <label htmlFor={id} className="sr-only">
          Tambah ke {legend.toLowerCase()}
        </label>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          aria-describedby={helpId}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className={inputClass(false, 'h-10 min-w-[10rem] flex-1')}
        />
        <Button size="md" icon={Plus} onClick={add}>
          Tambah
        </Button>
      </div>
      {helpId ? <FieldHelp id={helpId}>{help}</FieldHelp> : null}
    </fieldset>
  )
}

const ALT_MAX = 125

/**
 * The only cover-image UI: URL, media picker (library / upload / URL), remove,
 * and the alt text (required when an image is set; never filled in for you).
 * Stores `heroImage` + `seoData.coverAlt`.
 */
export function CoverField({
  image,
  alt,
  onImageChange,
  onAltChange,
  errors,
  help,
}: {
  image: string
  alt: string
  onImageChange: (url: string) => void
  onAltChange: (alt: string) => void
  errors: FieldErrors
  help?: React.ReactNode
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [focusAlt, setFocusAlt] = useState(false)
  const imageId = fieldDomId('heroImage')
  const altId = fieldDomId('coverAlt')
  const altError = errors.coverAlt
  const imageError = errors.heroImage

  useEffect(() => {
    if (!focusAlt || pickerOpen) return
    setFocusAlt(false)
    document.getElementById(altId)?.focus()
  }, [focusAlt, pickerOpen, altId])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {image ? (
            // Plain <img>: thumbnail of an arbitrary URL; decorative here (the alt text is edited below).
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-neutral-300">Belum ada gambar</span>
          )}
        </div>
        <div className="min-w-[12rem] flex-1 space-y-2">
          <label htmlFor={imageId} className={LABEL_CLASS}>
            URL gambar sampul
          </label>
          <input
            id={imageId}
            type="text"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder="/uploads/… atau https://…"
            value={image}
            aria-invalid={imageError ? true : undefined}
            aria-describedby={describedBy(imageError && `${imageId}-error`, help ? `${imageId}-help` : null)}
            onChange={(e) => onImageChange(e.target.value)}
            className={inputClass(Boolean(imageError), 'h-10')}
          />
          <FieldError id={`${imageId}-error`} messages={imageError ? [imageError] : undefined} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={ImagePlus} onClick={() => setPickerOpen(true)}>
              Pilih atau unggah
            </Button>
            {image ? (
              <Button
                size="sm"
                variant="ghost"
                icon={Trash2}
                onClick={() => {
                  onImageChange('')
                  document.getElementById(imageId)?.focus()
                }}
              >
                Hapus gambar
              </Button>
            ) : null}
          </div>
          {help ? <FieldHelp id={`${imageId}-help`}>{help}</FieldHelp> : null}
        </div>
      </div>
      <div>
        <label htmlFor={altId} className={LABEL_CLASS}>
          Teks alternatif
          {image ? <RequiredMark /> : null}
        </label>
        <input
          id={altId}
          type="text"
          value={alt}
          maxLength={300}
          aria-invalid={altError ? true : undefined}
          aria-describedby={describedBy(altError && `${altId}-error`, `${altId}-help`)}
          onChange={(e) => onAltChange(e.target.value)}
          className={inputClass(Boolean(altError), 'h-10')}
        />
        <FieldError id={`${altId}-error`} messages={altError ? [altError] : undefined} />
        <FieldHelp id={`${altId}-help`}>
          Jelaskan isi gambar untuk pembaca layar. {alt.trim().length}/{ALT_MAX} karakter
          {alt.trim().length > ALT_MAX ? ' · lebih ringkas lebih baik' : ''}.
        </FieldHelp>
      </div>
      {pickerOpen ? (
        <MediaPickerModal
          isOpen
          currentUrl={image}
          title="Pilih gambar sampul"
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => {
            onImageChange(url)
            setPickerOpen(false)
            setFocusAlt(true)
          }}
        />
      ) : null}
    </div>
  )
}
