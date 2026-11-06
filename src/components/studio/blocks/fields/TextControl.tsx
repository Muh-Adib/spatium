'use client'

import type { BlockField } from '@/lib/blocks/catalog'
import { FieldError, FieldHelp, describedBy, inputClass } from '../ui'
import { type FieldPath, pathKey, readField } from '../model'
import { type Ctx, asString, errorsAt, fieldId } from './context'
import { Label } from './Label'

/** The scalar member of BlockField (text, textarea, url, number, boolean). */
type ScalarField = Exclude<BlockField, { kind: 'select' | 'image' | 'link' | 'stringList' | 'list' | 'table' }>

export function TextControl({ ctx, field, path }: { ctx: Ctx; field: ScalarField; path: FieldPath }) {
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
