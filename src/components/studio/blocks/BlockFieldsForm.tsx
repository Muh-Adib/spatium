'use client'

import { memo } from 'react'
import type { BlockField } from '@/lib/blocks/catalog'
import type { BlockIssueGroup, EditorBlock } from './model'
import type { Ctx, FieldChange } from './fields/context'
import { FieldControl } from './fields/FieldControl'

export type { FieldChange, FieldChangeOptions } from './fields/context'

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

