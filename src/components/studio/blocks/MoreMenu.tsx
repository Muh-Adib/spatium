'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, FOCUS_RING } from './ui'

export type MoreMenuItem = { label: string; icon: LucideIcon; danger?: boolean; onSelect: () => void }

/** "Lainnya" disclosure menu: Escape closes and returns focus to the button. */
export function MoreMenu({ items }: { items: MoreMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('button')?.focus()
    const onDown = (e: MouseEvent) => {
      if (!listRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (items.length === 0) return null
  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }

  return (
    <div className="relative" onKeyDown={(e) => e.key === 'Escape' && open && (e.stopPropagation(), close(true))}>
      <Button ref={buttonRef} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        Lainnya
        <ChevronDown className={`h-4 w-4 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Button>
      {open ? (
        <ul
          ref={listRef}
          id={id}
          className="absolute right-0 top-[calc(100%+0.375rem)] z-30 w-64 max-w-[calc(100vw-2rem)] space-y-0.5 rounded-xl border border-white/15 bg-surface-overlay p-1 shadow-2xl"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node) && e.relatedTarget !== buttonRef.current) setOpen(false)
          }}
        >
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  close(false)
                  item.onSelect()
                }}
                className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm ${
                  item.danger ? 'text-red-200 hover:bg-red-500/15' : 'text-neutral-100 hover:bg-white/[0.08]'
                } ${FOCUS_RING}`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
