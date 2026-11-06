'use client'

import type { BlockField } from '@/lib/blocks/catalog'

export function Label({ htmlFor, field, as = 'label' }: { htmlFor?: string; field: BlockField; as?: 'label' | 'legend' }) {
  const content = (
    <>
      {field.label}
      {field.required ? (
        <span className="ml-1 text-red-300" aria-hidden="true">
          *
        </span>
      ) : null}
      {field.required ? <span className="sr-only"> (wajib)</span> : null}
    </>
  )
  const cls = 'mb-1.5 block text-sm font-medium text-neutral-100'
  return as === 'legend' ? (
    <legend className={cls}>{content}</legend>
  ) : (
    <label htmlFor={htmlFor} className={cls}>
      {content}
    </label>
  )
}
