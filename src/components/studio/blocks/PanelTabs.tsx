'use client'

import type React from 'react'
import type { BlockEditorPanel } from './BlockEditor'

/** Tab list for the editor column (Blok, SEO, …): arrow keys, Home and End move between tabs. */
export function PanelTabs({ baseId, panels, active, onChange }: { baseId: string; panels: BlockEditorPanel[]; active: string; onChange: (id: string) => void }) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % panels.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + panels.length) % panels.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = panels.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(panels[next].id)
    document.getElementById(`${baseId}-tab-${panels[next].id}`)?.focus()
  }
  return (
    <div role="tablist" aria-label="Bagian editor" className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-3 pt-2">
      {panels.map((p, i) => {
        const selected = p.id === active
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${p.id}`}
            aria-selected={selected}
            aria-controls={`${baseId}-panel-${p.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(p.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm ${
              selected ? 'border-accent-400 text-white' : 'border-transparent text-neutral-300 hover:text-white'
            } focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-400`}
          >
            {p.label}
            {p.badge !== undefined && p.badge !== null ? <span className="rounded-full bg-white/10 px-1.5 text-xs text-neutral-200">{p.badge}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
