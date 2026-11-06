'use client'

import type { BlockField } from '@/lib/blocks/catalog'
import { FieldHelp } from '../ui'
import { type FieldPath, readField } from '../model'
import { type Ctx, fieldId } from './context'

export function BooleanControl({ ctx, field, path }: { ctx: Ctx; field: BlockField; path: FieldPath }) {
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
