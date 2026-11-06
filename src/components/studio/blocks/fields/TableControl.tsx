'use client'

import { Plus } from 'lucide-react'
import type { BlockField } from '@/lib/blocks/catalog'
import { Button, FieldError, inputClass } from '../ui'
import { type FieldPath, moveItem, readField, removeItem } from '../model'
import { type Ctx, type FieldChangeOptions, asList, asString, errorsAt, fieldId } from './context'
import { ItemActions } from './ItemActions'
import { Label } from './Label'

export function TableControl({ ctx, field, path }: { ctx: Ctx; field: Extract<BlockField, { kind: 'table' }>; path: FieldPath }) {
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
