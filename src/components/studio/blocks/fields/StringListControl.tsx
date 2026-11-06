'use client'

import { Plus } from 'lucide-react'
import type { BlockField } from '@/lib/blocks/catalog'
import { Button, FieldError, inputClass } from '../ui'
import { type FieldPath, moveItem, readField, removeItem } from '../model'
import { type Ctx, type FieldChangeOptions, asList, asString, errorsAt, fieldId } from './context'
import { ItemActions } from './ItemActions'
import { Label } from './Label'

export function StringListControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'stringList' }>; path: FieldPath }) {
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
