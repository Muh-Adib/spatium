'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Plus, Tag } from 'lucide-react'

interface CategoryItem {
  name: string
  slug?: string
}

interface CategoryComboboxProps {
  value: string
  onChange: (value: string) => void
  categoriesList: CategoryItem[]
  placeholder?: string
  className?: string
  variant?: 'canvas' | 'inspector'
}

export function CategoryCombobox({
  value,
  onChange,
  categoriesList,
  placeholder = 'Pilih atau ketik kategori…',
  className = '',
  variant = 'canvas',
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Keep query in sync when value changes from outside
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Filtered categories
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categoriesList
    return categoriesList.filter((cat) => cat.name.toLowerCase().includes(q))
  }, [categoriesList, query])

  // Check if query is an exact match to an existing category
  const hasExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase()
    return categoriesList.some((cat) => cat.name.toLowerCase() === q)
  }, [categoriesList, query])

  const showCreateOption = query.trim().length > 0 && !hasExactMatch

  // Total options count for keyboard navigation
  const totalItems = (showCreateOption ? 1 : 0) + filtered.length

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        // If user typed something new and clicked outside, keep that new category
        if (query.trim() && query.trim() !== value) {
          onChange(query.trim())
        } else if (!query.trim() && value) {
          setQuery(value)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [query, value, onChange])

  const selectCategory = (name: string) => {
    onChange(name)
    setQuery(name)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault()
        setIsOpen(true)
        return
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        if (showCreateOption && highlightedIndex === 0) {
          selectCategory(query.trim())
        } else {
          const catIndex = showCreateOption ? highlightedIndex - 1 : highlightedIndex
          const selected = filtered[catIndex]
          if (selected) selectCategory(selected.name)
        }
      } else if (query.trim()) {
        selectCategory(query.trim())
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery(value || '')
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const isCanvas = variant === 'canvas'

  return (
    <div ref={containerRef} className={`relative ${isCanvas ? 'inline-block min-w-[200px] max-w-[280px]' : 'w-full'} ${className}`}>
      <div
        className={`flex items-center gap-1.5 transition-all ${
          isCanvas
            ? 'bg-white/5 hover:bg-white/10 border border-white/10 focus-within:border-accent-400 rounded-lg px-2.5 py-1 text-xs text-neutral-200'
            : 'w-full rounded-lg bg-black/40 border border-white/15 px-2.5 py-1.5 text-xs text-white focus-within:border-accent-400 focus-within:ring-1 focus-within:ring-accent-400/30'
        }`}
      >
        <Tag className="w-3 h-3 text-accent-400/70 shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-transparent border-0 p-0 text-inherit focus:outline-none focus:ring-0 w-full placeholder:text-neutral-500 font-medium"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev)
            if (!isOpen) inputRef.current?.focus()
          }}
          className="p-0.5 text-neutral-400 hover:text-white shrink-0 focus:outline-none"
          tabIndex={-1}
          aria-label="Buka daftar kategori"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent-400' : ''}`} />
        </button>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full min-w-[240px] overflow-auto rounded-xl border border-white/15 bg-surface-elevated py-1 shadow-2xl backdrop-blur-xl animate-fadeIn text-xs"
        >
          {showCreateOption && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                selectCategory(query.trim())
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-accent-400 hover:bg-white/[0.08] transition-colors border-b border-white/[0.06] font-medium ${
                highlightedIndex === 0 ? 'bg-white/[0.08]' : ''
              }`}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Buat kategori baru: <strong className="text-white">&ldquo;{query.trim()}&rdquo;</strong>
              </span>
            </button>
          )}

          {filtered.length === 0 && !showCreateOption ? (
            <div className="px-3 py-3 text-center text-neutral-500 font-mono text-[11px]">
              Tidak ada kategori yang cocok.
            </div>
          ) : (
            filtered.map((cat, idx) => {
              const itemIdx = showCreateOption ? idx + 1 : idx
              const isSelected = value.toLowerCase() === cat.name.toLowerCase()
              const isHighlighted = highlightedIndex === itemIdx

              return (
                <button
                  key={cat.slug || cat.name}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectCategory(cat.name)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-neutral-200 hover:bg-white/[0.06] transition-colors ${
                    isHighlighted ? 'bg-white/[0.08] text-white' : ''
                  } ${isSelected ? 'font-semibold text-accent-300' : ''}`}
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent-400 shrink-0 ml-2" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

