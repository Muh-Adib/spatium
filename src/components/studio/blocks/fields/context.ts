/**
 * Shared types and helpers for the generated block form controls. Each field
 * kind (`BlockField['kind']`) has one control in this folder; `FieldControl`
 * maps kinds to controls.
 */
import type { BlockField } from '@/lib/blocks/catalog'
import { type BlockIssueGroup, type EditorBlock, type FieldPath, pathKey } from '../model'

export type FieldChangeOptions = {
  /** Merge with the previous edit of the same field into one undo step (typing). */
  coalesce?: boolean
  /** Shown in the undo toast for destructive edits, e.g. "Tahap 2 dihapus". */
  undoLabel?: string
  /** Polite screen-reader announcement, e.g. "Tahap dipindah ke posisi 3". */
  announce?: string
}

export type FieldChange = (path: FieldPath, value: unknown, options?: FieldChangeOptions) => void

export type Ctx = {
  block: EditorBlock
  idPrefix: string
  issues: BlockIssueGroup | undefined
  onChange: FieldChange
}

/** The field definition of one kind (e.g. `FieldOfKind<'image'>` has `altKey`). */
export type FieldOfKind<K extends BlockField['kind']> = BlockField & { kind: K }

/** Props every control receives. */
export type ControlProps<K extends BlockField['kind']> = { ctx: Ctx; field: FieldOfKind<K>; path: FieldPath }

export const fieldId = (ctx: Ctx, path: FieldPath) => `${ctx.idPrefix}-${pathKey(path).replace(/\./g, '-')}`
export const errorsAt = (ctx: Ctx, path: FieldPath) => ctx.issues?.byPath.get(pathKey(path))

export function asString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

export function asList(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}
