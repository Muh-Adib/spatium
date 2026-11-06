'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { BLOCK_CATEGORY_LABEL, listBlocksFor, type BlockCategory, type BlockTarget } from '@/lib/blocks/catalog'
import { filterBlocks } from './model'
import { Dialog, Kbd } from './ui'
import { CategoryIcon } from './icons'

type Props = {
  open: boolean
  target: BlockTarget
  /** Where the block will go, e.g. "di akhir halaman" or "setelah blok 3". */
  placement: string
  onClose: () => void
  onPick: (type: string) => void
}

const CATEGORY_ORDER: BlockCategory[] = ['hero', 'spatial', 'content', 'media', 'proof', 'conversion', 'navigation']


/**
 * Searchable block picker (APG combobox + listbox): typing filters, arrow keys
 * move the active option, Enter inserts it, Escape closes. Focus stays in the
 * search field; the active option is exposed via aria-activedescendant.
 */
export function BlockPalette({ open, target, placement, onClose, onPick }: Props) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const listId = `${baseId}-list`
  const entries = useMemo(() => listBlocksFor(target), [target])
  const results = useMemo(() => filterBlocks(entries, query), [entries, query])

  // Grouped for display, flat order for keyboard navigation.
  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({ cat, items: results.filter((e) => e.category === cat) })).filter((g) => g.items.length > 0),
    [results],
  )
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const optionId = (type: string) => `${baseId}-opt-${type}`
  const activeEntry = flat[active]

  useEffect(() => {
    if (!activeEntry) return
    const el = document.getElementById(optionId(activeEntry.type))
    el?.scrollIntoView({ block: 'nearest' })
    // optionId is derived from baseId, stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntry])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Home' && e.ctrlKey) {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End' && e.ctrlKey) {
      e.preventDefault()
      setActive(flat.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeEntry) onPick(activeEntry.type)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tambah blok"
      description={`Blok akan disisipkan ${placement}.`}
      width={40}
      initialFocusRef={inputRef}
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <label htmlFor={`${baseId}-q`} className="sr-only">
            Cari blok
          </label>
          <input
            ref={inputRef}
            id={`${baseId}-q`}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeEntry ? optionId(activeEntry.type) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Cari: hero, splat, FAQ, galeri…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] pl-9 pr-3 text-base text-white placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-400 sm:text-sm"
          />
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span role="status">{flat.length === 0 ? 'Tidak ada blok yang cocok.' : `${flat.length} blok tersedia`}</span>
          <span aria-hidden="true" className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> pilih · <Kbd>Enter</Kbd> sisipkan · <Kbd>Esc</Kbd> tutup
          </span>
        </p>

        <div ref={listRef} id={listId} role="listbox" aria-label="Jenis blok" className="space-y-4">
          {flat.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-neutral-300">
              Tidak ada blok untuk “{query}”. Coba kata lain, misalnya “gambar” atau “ajakan”.
            </p>
          ) : null}
          {groups.map((group) => (
            <div key={group.cat} role="group" aria-labelledby={`${baseId}-g-${group.cat}`}>
              <div id={`${baseId}-g-${group.cat}`} className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {BLOCK_CATEGORY_LABEL[group.cat]}
              </div>
              <div className="space-y-1">
                {group.items.map((entry) => {
                  const index = flat.indexOf(entry)
                  const isActive = index === active
                  return (
                    <div
                      key={entry.type}
                      id={optionId(entry.type)}
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseMove={() => setActive(index)}
                      onClick={() => onPick(entry.type)}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${
                        isActive ? 'border-accent-400/70 bg-accent-500/10' : 'border-transparent hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-neutral-200">
                        <CategoryIcon category={entry.category} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-white">{entry.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-300">{entry.description}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
