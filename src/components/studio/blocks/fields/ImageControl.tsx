'use client'

import { useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { BlockField } from '@/lib/blocks/catalog'
import MediaPickerModal from '@/components/studio/MediaPickerModal'
import { Button, FieldError, FieldHelp, describedBy, inputClass } from '../ui'
import { type FieldPath, readField } from '../model'
import { type Ctx, asString, errorsAt, fieldId } from './context'
import { Label } from './Label'

export function ImageControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'image' }>; path: FieldPath }) {
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
