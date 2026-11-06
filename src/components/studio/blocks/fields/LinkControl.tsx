'use client'

import type { BlockField } from '@/lib/blocks/catalog'
import { FieldError, inputClass } from '../ui'
import { type FieldPath, isRecord, readField } from '../model'
import { type Ctx, asString, errorsAt, fieldId } from './context'
import { Label } from './Label'

export function LinkControl({ ctx, field, path }: { ctx: Ctx; field: BlockField; path: FieldPath }) {
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
