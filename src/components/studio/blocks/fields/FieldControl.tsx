'use client'

import type { ComponentType } from 'react'
import { Plus } from 'lucide-react'
import type { BlockField, BlockFieldKind } from '@/lib/blocks/catalog'
import { Button, FieldError } from '../ui'
import { type FieldPath, moveItem, newListItem, readField, removeItem } from '../model'
import { BooleanControl } from './BooleanControl'
import { type ControlProps, type Ctx, type FieldChangeOptions, asList, errorsAt, fieldId } from './context'
import { ImageControl } from './ImageControl'
import { ItemActions } from './ItemActions'
import { Label } from './Label'
import { LinkControl } from './LinkControl'
import { SelectControl } from './SelectControl'
import { StringListControl } from './StringListControl'
import { TableControl } from './TableControl'
import { TextControl } from './TextControl'

/**
 * Field kind → control. The mapped type requires a control for every kind in
 * `BlockField`, so adding a kind without a control fails type-checking.
 */
const CONTROLS: { readonly [K in BlockFieldKind]: ComponentType<ControlProps<K>> } = {
  text: TextControl,
  textarea: TextControl,
  url: TextControl,
  number: TextControl,
  boolean: BooleanControl,
  select: SelectControl,
  image: ImageControl,
  link: LinkControl,
  stringList: StringListControl,
  list: ListControl,
  table: TableControl,
}

function controlFor<K extends BlockFieldKind>(kind: K): ComponentType<ControlProps<K>> {
  return CONTROLS[kind]
}

/** Renders the control for one field definition at `path`. */
export function FieldControl({ ctx, field, path }: { ctx: Ctx; field: BlockField; path: FieldPath }) {
  const Control = controlFor(field.kind)
  return <Control ctx={ctx} field={field} path={path} />
}

/** Repeatable objects; each item renders its sub-fields through `FieldControl` (kept here to avoid an import cycle). */
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
