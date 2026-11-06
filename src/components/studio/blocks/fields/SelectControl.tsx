'use client'

import type { BlockField } from '@/lib/blocks/catalog'
import { FieldError, FieldHelp, describedBy, inputClass } from '../ui'
import { type FieldPath, readField } from '../model'
import { type Ctx, asString, errorsAt, fieldId } from './context'
import { Label } from './Label'

export function SelectControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'select' }>; path: FieldPath }) {
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
