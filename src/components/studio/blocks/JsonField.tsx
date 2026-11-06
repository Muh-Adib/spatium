'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FieldError, FieldHelp, describedBy, inputClass } from './ui'
import { isRecord } from './model'

type Props = {
  id: string
  label: string
  value: Record<string, unknown>
  help?: React.ReactNode
  /** External issues (e.g. schema validation) shown under the field. */
  issues?: readonly string[]
  /** Apply a parsed object; return an error message to reject it. */
  onCommit: (next: Record<string, unknown>) => string | null
}

/**
 * Raw JSON editor for blocks the catalogue cannot describe (legacy types) and
 * for properties outside the generated form. Text is edited freely and only
 * parsed + applied on blur, so typing never fights the validator.
 */
export function JsonField({ id, label, value, help, issues, onCommit }: Props) {
  const serialized = JSON.stringify(value, null, 2)
  const [text, setText] = useState(serialized)
  const [error, setError] = useState<string | null>(null)
  const focused = useRef(false)

  // Follow external changes (undo, restore) unless the user is mid-edit.
  useEffect(() => {
    if (!focused.current) {
      setText(serialized)
      setError(null)
    }
  }, [serialized])

  const commit = () => {
    focused.current = false
    if (text === serialized) {
      setError(null)
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      setError(`JSON tidak valid: ${err instanceof Error ? err.message : 'periksa tanda kutip dan koma.'} Perubahan belum diterapkan.`)
      return
    }
    if (!isRecord(parsed)) {
      setError('Isi harus berupa objek JSON ({ … }). Perubahan belum diterapkan.')
      return
    }
    const rejected = onCommit(parsed)
    setError(rejected)
  }

  const errorMessages = [...(error ? [error] : []), ...(issues ?? [])]
  const errId = errorMessages.length ? `${id}-error` : null
  const helpId = help ? `${id}-help` : null

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-100">
        {label}
      </label>
      <textarea
        id={id}
        value={text}
        spellCheck={false}
        rows={8}
        aria-invalid={errId ? true : undefined}
        aria-describedby={describedBy(errId, helpId)}
        onFocus={() => {
          focused.current = true
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        className={inputClass(Boolean(errId), 'min-h-[10rem] max-h-[28rem] resize-y py-2 font-mono text-xs leading-relaxed [field-sizing:content]')}
      />
      {errId ? <FieldError id={errId} messages={errorMessages} /> : null}
      {helpId ? <FieldHelp id={helpId}>{help}</FieldHelp> : null}
    </div>
  )
}
