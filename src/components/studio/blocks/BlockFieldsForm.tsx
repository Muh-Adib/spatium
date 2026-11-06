'use client'

import React, { memo, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react'
import type { BlockField } from '@/lib/blocks/catalog'
import MediaPickerModal from '@/components/studio/MediaPickerModal'
import { Button, FieldError, FieldHelp, IconButton, describedBy, inputClass } from './ui'
import {
  type BlockIssueGroup,
  type EditorBlock,
  type FieldPath,
  isRecord,
  moveItem,
  newListItem,
  pathKey,
  readField,
  removeItem,
} from './model'

export type FieldChangeOptions = {
  /** Merge with the previous edit of the same field into one undo step (typing). */
  coalesce?: boolean
  /** Shown in the undo toast for destructive edits, e.g. "Tahap 2 dihapus". */
  undoLabel?: string
  /** Polite screen-reader announcement, e.g. "Tahap dipindah ke posisi 3". */
  announce?: string
}

export type FieldChange = (path: FieldPath, value: unknown, options?: FieldChangeOptions) => void

type Ctx = {
  block: EditorBlock
  idPrefix: string
  issues: BlockIssueGroup | undefined
  onChange: FieldChange
}

const fieldId = (ctx: Ctx, path: FieldPath) => `${ctx.idPrefix}-${pathKey(path).replace(/\./g, '-')}`
const errorsAt = (ctx: Ctx, path: FieldPath) => ctx.issues?.byPath.get(pathKey(path))

function asString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

function asList(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function Label({ htmlFor, field, as = 'label' }: { htmlFor?: string; field: BlockField; as?: 'label' | 'legend' }) {
  const content = (
    <>
      {field.label}
      {field.required ? (
        <span className="ml-1 text-red-300" aria-hidden="true">
          *
        </span>
      ) : null}
      {field.required ? <span className="sr-only"> (wajib)</span> : null}
    </>
  )
  const cls = 'mb-1.5 block text-sm font-medium text-neutral-100'
  return as === 'legend' ? (
    <legend className={cls}>{content}</legend>
  ) : (
    <label htmlFor={htmlFor} className={cls}>
      {content}
    </label>
  )
}

/** The scalar member of BlockField (text, textarea, url, number, boolean). */
type ScalarField = Exclude<BlockField, { kind: 'select' | 'image' | 'link' | 'stringList' | 'list' | 'table' }>

function TextControl({ ctx, field, path }: { ctx: Ctx; field: ScalarField; path: FieldPath }) {
  const id = fieldId(ctx, path)
  const errors = errorsAt(ctx, path)
  const value = readField(ctx.block, path)
  const helpId = field.help ? `${id}-help` : null
  const errId = errors?.length ? `${id}-error` : null
  const max = field.max
  const common = {
    id,
    name: pathKey(path),
    'aria-invalid': errors?.length ? true : undefined,
    'aria-describedby': describedBy(errId, helpId),
    'aria-required': field.required || undefined,
  } as const

  return (
    <div>
      <Label htmlFor={id} field={field} />
      {field.kind === 'textarea' ? (
        <textarea
          {...common}
          rows={3}
          value={asString(value)}
          maxLength={max}
          onChange={(e) => ctx.onChange(path, e.target.value, { coalesce: true })}
          className={inputClass(Boolean(errId), 'min-h-[5.5rem] max-h-[24rem] resize-y py-2 leading-relaxed [field-sizing:content]')}
        />
      ) : field.kind === 'number' ? (
        <input
          {...common}
          type="number"
          value={asString(value)}
          onChange={(e) => ctx.onChange(path, e.target.value === '' ? undefined : Number(e.target.value), { coalesce: true })}
          className={inputClass(Boolean(errId), 'h-10')}
        />
      ) : (
        <input
          {...common}
          type="text"
          inputMode={field.kind === 'url' ? 'url' : undefined}
          spellCheck={field.kind === 'url' ? false : undefined}
          autoComplete="off"
          value={asString(value)}
          maxLength={max}
          placeholder={field.kind === 'url' ? '/halaman atau https://…' : undefined}
          onChange={(e) => ctx.onChange(path, e.target.value, { coalesce: true })}
          className={inputClass(Boolean(errId), 'h-10')}
        />
      )}
      {errId ? <FieldError id={errId} messages={errors} /> : null}
      {helpId ? <FieldHelp id={helpId}>{field.help}</FieldHelp> : null}
    </div>
  )
}

function BooleanControl({ ctx, field, path }: { ctx: Ctx; field: BlockField; path: FieldPath }) {
  const id = fieldId(ctx, path)
  const helpId = field.help ? `${id}-help` : null
  return (
    <div>
      <label htmlFor={id} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-neutral-100">
        <input
          id={id}
          type="checkbox"
          checked={readField(ctx.block, path) === true}
          aria-describedby={helpId ?? undefined}
          onChange={(e) => ctx.onChange(path, e.target.checked ? true : undefined)}
          className="h-4 w-4 rounded border-white/30 bg-transparent accent-[#FFD600] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        />
        {field.label}
      </label>
      {helpId ? <FieldHelp id={helpId}>{field.help}</FieldHelp> : null}
    </div>
  )
}

function SelectControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'select' }>; path: FieldPath }) {
  const id = fieldId(ctx, path)
  const errors = errorsAt(ctx, path)
  const errId = errors?.length ? `${id}-error` : null
  const helpId = field.help ? `${id}-help` : null
  return (
    <div>
      <Label htmlFor={id} field={field} />
      <select
        id={id}
        value={asString(readField(ctx.block, path))}
        aria-invalid={errId ? true : undefined}
        aria-describedby={describedBy(errId, helpId)}
        onChange={(e) => ctx.onChange(path, e.target.value || undefined)}
        className={inputClass(Boolean(errId), 'h-10')}
      >
        {field.required ? null : <option value="">— Tidak dipilih —</option>}
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {errId ? <FieldError id={errId} messages={errors} /> : null}
      {helpId ? <FieldHelp id={helpId}>{field.help}</FieldHelp> : null}
    </div>
  )
}

function ImageControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'image' }>; path: FieldPath }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const id = fieldId(ctx, path)
  const altPath = [...path.slice(0, -1), field.altKey]
  const altId = fieldId(ctx, altPath)
  const src = asString(readField(ctx.block, path))
  const alt = asString(readField(ctx.block, altPath))
  const errors = errorsAt(ctx, path)
  const altErrors = errorsAt(ctx, altPath)
  const errId = errors?.length ? `${id}-error` : null
  const altErrId = altErrors?.length ? `${altId}-error` : null
  const helpId = field.help ? `${id}-help` : null

  return (
    <fieldset className="min-w-0 rounded-xl border border-white/10 p-3">
      <Label field={field} as="legend" />
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {src ? (
            // Plain <img>: editor thumbnail of an arbitrary URL (decorative; the alt text is edited below).
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="px-2 text-center text-[11px] text-neutral-400">Belum ada gambar</span>
          )}
        </div>
        <div className="min-w-[12rem] flex-1 space-y-2">
          <label htmlFor={id} className="sr-only">
            URL {field.label}
          </label>
          <input
            id={id}
            type="text"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            value={src}
            placeholder="/images/… atau https://…"
            aria-invalid={errId ? true : undefined}
            aria-describedby={describedBy(errId, helpId)}
            onChange={(e) => ctx.onChange(path, e.target.value, { coalesce: true })}
            className={inputClass(Boolean(errId), 'h-10')}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={ImagePlus} onClick={() => setPickerOpen(true)}>
              Pilih dari media
            </Button>
            {src ? (
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => ctx.onChange(path, undefined, { undoLabel: `${field.label} dihapus` })}>
                Hapus gambar
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {errId ? <FieldError id={errId} messages={errors} /> : null}
      {helpId ? <FieldHelp id={helpId}>{field.help}</FieldHelp> : null}
      <div className="mt-3">
        <label htmlFor={altId} className="mb-1.5 block text-sm font-medium text-neutral-100">
          Teks alternatif{src ? <span className="ml-1 text-red-300" aria-hidden="true">*</span> : null}
          {src ? <span className="sr-only"> (wajib bila gambar dipakai)</span> : null}
        </label>
        <input
          id={altId}
          type="text"
          value={alt}
          aria-invalid={altErrId ? true : undefined}
          aria-describedby={describedBy(altErrId, `${altId}-help`)}
          onChange={(e) => ctx.onChange(altPath, e.target.value, { coalesce: true })}
          className={inputClass(Boolean(altErrId), 'h-10')}
        />
        {altErrId ? <FieldError id={altErrId} messages={altErrors} /> : null}
        <FieldHelp id={`${altId}-help`}>Jelaskan isi gambar untuk pembaca layar dan mesin pencari.</FieldHelp>
      </div>
      {pickerOpen ? (
        <MediaPickerModal
          isOpen
          currentUrl={src}
          title={`Pilih ${field.label.toLowerCase()}`}
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => ctx.onChange(path, url)}
        />
      ) : null}
    </fieldset>
  )
}

function LinkControl({ ctx, field, path }: { ctx: Ctx; field: BlockField; path: FieldPath }) {
  const labelPath = [...path, 'label']
  const hrefPath = [...path, 'href']
  const raw = readField(ctx.block, path)
  const link = isRecord(raw) ? raw : {}
  const hrefValue = asString(link.href) || asString(link.url)
  const labelId = fieldId(ctx, labelPath)
  const hrefId = fieldId(ctx, hrefPath)
  const errors = [...(errorsAt(ctx, path) ?? []), ...(errorsAt(ctx, labelPath) ?? []), ...(errorsAt(ctx, hrefPath) ?? [])]
  const errId = errors.length ? `${fieldId(ctx, path)}-error` : null

  const update = (key: 'label' | 'href', value: string) => {
    const next: Record<string, unknown> = { ...link, [key]: value }
    if (key === 'href') delete next.url
    const empty = !asString(next.label) && !asString(next.href)
    ctx.onChange(path, empty ? undefined : next, { coalesce: true })
  }

  return (
    <fieldset className="min-w-0">
      <Label field={field} as="legend" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2">
        <div>
          <label htmlFor={labelId} className="mb-1 block text-xs text-neutral-300">
            Teks tombol
          </label>
          <input
            id={labelId}
            type="text"
            value={asString(link.label)}
            aria-invalid={errId ? true : undefined}
            aria-describedby={errId ?? undefined}
            onChange={(e) => update('label', e.target.value)}
            className={inputClass(Boolean(errId), 'h-10')}
          />
        </div>
        <div>
          <label htmlFor={hrefId} className="mb-1 block text-xs text-neutral-300">
            Tujuan (URL)
          </label>
          <input
            id={hrefId}
            type="text"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            value={hrefValue}
            aria-invalid={errId ? true : undefined}
            aria-describedby={errId ?? undefined}
            onChange={(e) => update('href', e.target.value)}
            className={inputClass(Boolean(errId), 'h-10')}
          />
        </div>
      </div>
      {errId ? <FieldError id={errId} messages={errors} /> : null}
    </fieldset>
  )
}

/** Up / down / remove controls for one item of a repeatable field. */
function ItemActions({ index, count, itemName, onMove, onRemove }: { index: number; count: number; itemName: string; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center" role="group" aria-label={`Tindakan ${itemName}`}>
      <IconButton icon={ArrowUp} size="sm" label={`Naikkan ${itemName}`} disabled={index === 0} onClick={() => onMove(index - 1)} />
      <IconButton icon={ArrowDown} size="sm" label={`Turunkan ${itemName}`} disabled={index === count - 1} onClick={() => onMove(index + 1)} />
      <IconButton icon={Trash2} size="sm" tone="danger" label={`Hapus ${itemName}`} onClick={onRemove} />
    </div>
  )
}

function StringListControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'stringList' }>; path: FieldPath }) {
  const items = asList(readField(ctx.block, path)).map(asString)
  const errors = errorsAt(ctx, path)
  const errId = errors?.length ? `${fieldId(ctx, path)}-error` : null
  const set = (next: string[], options?: FieldChangeOptions) => ctx.onChange(path, next.length ? next : undefined, options)

  return (
    <fieldset className="min-w-0">
      <Label field={field} as="legend" />
      {items.length === 0 ? <p className="mb-2 text-xs text-neutral-400">Belum ada {field.itemLabel.toLowerCase()}.</p> : null}
      <ol className="space-y-2">
        {items.map((item, i) => {
          const itemPath = [...path, i]
          const id = fieldId(ctx, itemPath)
          const itemErrors = errorsAt(ctx, itemPath)
          const itemErrId = itemErrors?.length ? `${id}-error` : null
          const name = `${field.itemLabel} ${i + 1}`
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
                  aria-invalid={itemErrId ? true : undefined}
                  aria-describedby={itemErrId ?? undefined}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = e.target.value
                    ctx.onChange(path, next, { coalesce: true })
                  }}
                  className={inputClass(Boolean(itemErrId), 'h-10')}
                />
                {itemErrId ? <FieldError id={itemErrId} messages={itemErrors} /> : null}
              </div>
              <ItemActions
                index={i}
                count={items.length}
                itemName={name}
                onMove={(to) => set(moveItem(items, i, to), { announce: `${name} dipindah ke posisi ${to + 1}.` })}
                onRemove={() => set(removeItem(items, i), { undoLabel: `${name} dihapus` })}
              />
            </li>
          )
        })}
      </ol>
      <Button size="sm" icon={Plus} className="mt-2" onClick={() => set([...items, ''], { announce: `${field.itemLabel} ditambahkan.` })}>
        Tambah {field.itemLabel.toLowerCase()}
      </Button>
      {errId ? <FieldError id={errId} messages={errors} /> : null}
    </fieldset>
  )
}

function ListControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'list' }>; path: FieldPath }) {
  const items = asList(readField(ctx.block, path))
  const errors = errorsAt(ctx, path)
  const errId = errors?.length ? `${fieldId(ctx, path)}-error` : null
  const full = field.max !== undefined && items.length >= field.max
  const set = (next: unknown[], options?: FieldChangeOptions) => ctx.onChange(path, next, options)

  return (
    <fieldset className="min-w-0">
      <Label field={field} as="legend" />
      {items.length === 0 ? <p className="mb-2 text-xs text-neutral-400">Belum ada {field.itemLabel.toLowerCase()}.</p> : null}
      <ol className="space-y-3">
        {items.map((_, i) => {
          const name = `${field.itemLabel} ${i + 1}`
          const headingId = `${fieldId(ctx, [...path, i])}-heading`
          return (
            <li key={i} aria-labelledby={headingId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 id={headingId} className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  {name}
                </h4>
                <ItemActions
                  index={i}
                  count={items.length}
                  itemName={name}
                  onMove={(to) => set(moveItem(items, i, to), { announce: `${name} dipindah ke posisi ${to + 1}.` })}
                  onRemove={() => set(removeItem(items, i), { undoLabel: `${name} dihapus` })}
                />
              </div>
              <div className="space-y-3">
                {field.fields.map((sub) => (
                  <FieldControl key={sub.key} ctx={ctx} field={sub} path={[...path, i, sub.key]} />
                ))}
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" icon={Plus} disabled={full} onClick={() => set([...items, newListItem(field)], { announce: `${field.itemLabel} ditambahkan.` })}>
          Tambah {field.itemLabel.toLowerCase()}
        </Button>
        {field.max !== undefined ? (
          <span className="text-xs text-neutral-400">
            {items.length} dari maksimal {field.max}
          </span>
        ) : null}
      </div>
      {errId ? <FieldError id={errId} messages={errors} /> : null}
    </fieldset>
  )
}

function TableControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'table' }>; path: FieldPath }) {
  const columns = asList(readField(ctx.block, [...path.slice(0, -1), field.columnsKey])).map(asString)
  const rows = asList(readField(ctx.block, path)).map((r) => asList(r).map(asString))
  const colCount = Math.max(columns.length, ...rows.map((r) => r.length), 1)
  const errors = errorsAt(ctx, path)
  const errId = errors?.length ? `${fieldId(ctx, path)}-error` : null
  const set = (next: string[][], options?: FieldChangeOptions) => ctx.onChange(path, next, options)
  const colName = (c: number) => columns[c] || `Kolom ${c + 1}`

  return (
    <fieldset className="min-w-0">
      <Label field={field} as="legend" />
      {rows.length === 0 ? <p className="mb-2 text-xs text-neutral-400">Belum ada baris. Isi kolom di atas lalu tambahkan baris.</p> : null}
      <ol className="space-y-3">
        {rows.map((row, r) => {
          const name = `Baris ${r + 1}`
          return (
            <li key={r} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-300">{name}</span>
                <ItemActions
                  index={r}
                  count={rows.length}
                  itemName={name}
                  onMove={(to) => set(moveItem(rows, r, to), { announce: `${name} dipindah ke posisi ${to + 1}.` })}
                  onRemove={() => set(removeItem(rows, r), { undoLabel: `${name} dihapus` })}
                />
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
                {Array.from({ length: colCount }, (_, c) => {
                  const id = fieldId(ctx, [...path, r, c])
                  return (
                    <div key={c}>
                      <label htmlFor={id} className="mb-1 block text-xs text-neutral-300">
                        {colName(c)}
                      </label>
                      <input
                        id={id}
                        type="text"
                        value={row[c] ?? ''}
                        onChange={(e) => {
                          const next = rows.map((x) => [...x])
                          const target = next[r]
                          while (target.length <= c) target.push('')
                          target[c] = e.target.value
                          set(next, { coalesce: true })
                        }}
                        className={inputClass(false, 'h-10')}
                      />
                    </div>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>
      <Button size="sm" icon={Plus} className="mt-2" onClick={() => set([...rows, Array.from({ length: colCount }, () => '')], { announce: 'Baris ditambahkan.' })}>
        Tambah baris
      </Button>
      {errId ? <FieldError id={errId} messages={errors} /> : null}
    </fieldset>
  )
}

function FieldControl({ ctx, field, path }: { ctx: Ctx; field: BlockField; path: FieldPath }) {
  switch (field.kind) {
    case 'text':
    case 'textarea':
    case 'url':
    case 'number':
      return <TextControl ctx={ctx} field={field} path={path} />
    case 'boolean':
      return <BooleanControl ctx={ctx} field={field} path={path} />
    case 'select':
      return <SelectControl ctx={ctx} field={field} path={path} />
    case 'image':
      return <ImageControl ctx={ctx} field={field} path={path} />
    case 'link':
      return <LinkControl ctx={ctx} field={field} path={path} />
    case 'stringList':
      return <StringListControl ctx={ctx} field={field} path={path} />
    case 'list':
      return <ListControl ctx={ctx} field={field} path={path} />
    case 'table':
      return <TableControl ctx={ctx} field={field} path={path} />
    default: {
      const unreachable: never = field
      return unreachable
    }
  }
}

type FormProps = {
  block: EditorBlock
  fields: readonly BlockField[]
  issues: BlockIssueGroup | undefined
  idPrefix: string
  onChange: FieldChange
}

/**
 * Generic, schema-driven form for one block, generated from the catalogue's
 * `fields`. Every control is labelled; errors are inline and referenced via
 * aria-describedby; repeatable items reorder with buttons (no drag needed).
 */
export const BlockFieldsForm = memo(function BlockFieldsForm({ block, fields, issues, idPrefix, onChange }: FormProps) {
  const ctx: Ctx = { block, idPrefix, issues, onChange }
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FieldControl key={field.key} ctx={ctx} field={field} path={[field.key]} />
      ))}
    </div>
  )
})

