'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Check, ChevronDown, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'

/* ------------------------------------------------------------------ */
/* Icon button / link — the main interaction primitive                 */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const BTN_TONES: Record<Tone, string> = {
  neutral: 'text-neutral-400 hover:text-white hover:bg-white/10',
  primary: 'bg-sky-500 text-white hover:bg-sky-400',
  success: 'text-emerald-400 hover:bg-emerald-500/15',
  warning: 'text-amber-400 hover:bg-amber-500/15',
  danger: 'text-red-400 hover:bg-red-500/15',
  info: 'text-sky-400 hover:bg-sky-500/15',
  purple: 'text-purple-400 hover:bg-purple-500/15',
}

interface IconButtonProps {
  icon: LucideIcon
  label: string
  hint?: string
  tone?: Tone
  size?: 'sm' | 'md'
  side?: 'top' | 'bottom' | 'left' | 'right'
  href?: string
  external?: boolean
  onClick?: () => void
  disabled?: boolean
  spinning?: boolean
  active?: boolean
  className?: string
}

export function IconButton({
  icon: Icon,
  label,
  hint,
  tone = 'neutral',
  size = 'md',
  side = 'top',
  href,
  external,
  onClick,
  disabled,
  spinning,
  active,
  className = '',
}: IconButtonProps) {
  const cls = `inline-flex ${size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? 'bg-white/10 text-white' : BTN_TONES[tone]
  } ${className}`
  const icon = <Icon className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} aria-hidden="true" />

  return (
    <Tooltip label={label} hint={hint} side={side}>
      {href ? (
        <Link href={href} aria-label={label} target={external ? '_blank' : undefined} className={cls}>
          {icon}
        </Link>
      ) : (
        <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={cls}>
          {icon}
        </button>
      )}
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/[0.08] bg-[#1B1B1B] ${className}`}>{children}</div>
}

const STAT_TONES = {
  sky: 'bg-sky-500/10 text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  purple: 'bg-purple-500/10 text-purple-400',
  amber: 'bg-amber-500/10 text-amber-400',
} as const

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = 'sky',
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  hint?: string
  href?: string
  tone?: keyof typeof STAT_TONES
}) {
  const body = (
    <div className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#1B1B1B] p-5 transition-colors hover:border-white/20 hover:bg-[#202020]">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-2xl font-semibold tabular-nums text-white">{value}</span>
        <span className="block truncate text-xs text-neutral-400">{label}</span>
      </span>
    </div>
  )
  return (
    <Tooltip label={label} hint={hint} side="bottom" className="w-full">
      {href ? (
        <Link href={href} className="block w-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </Tooltip>
  )
}

const PILL_TONES = {
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  purple: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  slate: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
  red: 'bg-red-500/10 text-red-300 border-red-500/25',
} as const

export function StatusPill({
  icon: Icon,
  label,
  tone,
  hint,
}: {
  icon?: LucideIcon
  label: string
  tone: keyof typeof PILL_TONES
  hint?: string
}) {
  return (
    <Tooltip label={label} hint={hint} side="top">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${PILL_TONES[tone]}`}>
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
        {label}
      </span>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Form helpers                                                        */
/* ------------------------------------------------------------------ */

export const fieldCls =
  'h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-neutral-500 transition-colors focus:border-sky-400/60 focus:bg-white/[0.05] focus:outline-none'

export function SearchField({
  icon: Icon,
  value,
  onChange,
  placeholder,
  onEnter,
  mono,
}: {
  icon: LucideIcon
  value: string
  onChange: (v: string) => void
  placeholder: string
  onEnter?: () => void
  mono?: boolean
}) {
  return (
    <div className="relative w-full">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${fieldCls} pl-10 ${mono ? 'font-mono text-xs' : ''}`}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {options.map((o) => (
        <Tooltip key={o.id} label={o.hint} side="top">
          <button
            type="button"
            onClick={() => onChange(o.id)}
            className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
              value === o.id ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {o.label}
          </button>
        </Tooltip>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Select & Dropdown Components                                       */
/* ------------------------------------------------------------------ */

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  hint?: string
  badge?: string
  icon?: LucideIcon
}

export function SelectDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi…',
  icon: Icon,
  className = '',
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
}: {
  value: T
  onChange: (val: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  icon?: LucideIcon
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  // Close on outside click & escape
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
      } else if (e.key === 'Enter' && highlightedIndex >= 0 && options[highlightedIndex]) {
        e.preventDefault()
        onChange(options[highlightedIndex].value)
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, highlightedIndex, options, onChange])

  const heightCls = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-3.5 text-sm'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((prev) => !prev)
          const currIdx = options.findIndex((o) => o.value === value)
          setHighlightedIndex(currIdx >= 0 ? currIdx : 0)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        className={`group flex w-full items-center justify-between gap-2 rounded-xl border transition-all text-left select-none focus:outline-none ${heightCls} ${
          open
            ? 'border-sky-400/60 bg-white/[0.06] text-white ring-2 ring-sky-400/20 shadow-lg shadow-sky-950/20'
            : 'border-white/10 bg-white/[0.03] text-neutral-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
        } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                open ? 'text-sky-400' : 'text-neutral-500 group-hover:text-neutral-400'
              }`}
              aria-hidden="true"
            />
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
          )}
          <span className={`truncate ${selectedOption ? 'font-medium text-white' : 'text-neutral-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ease-out ${
            open ? 'rotate-180 text-sky-400' : 'group-hover:text-neutral-300'
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Floating Dropdown Listbox */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-full w-max max-w-sm rounded-xl border border-white/10 bg-[#1A1A1A]/95 p-1 text-white shadow-2xl shadow-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto scrollbar-thin"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value
            const isHighlighted = idx === highlightedIndex
            const ItemIcon = opt.icon

            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-sky-500/15 text-sky-300 font-semibold'
                    : isHighlighted
                    ? 'bg-white/[0.08] text-white'
                    : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {ItemIcon && (
                    <ItemIcon
                      className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-neutral-400'}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {opt.badge && (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Styled Native Select wrapper with custom chevron indicator & dark styling
 */
export function NativeSelectField({
  value,
  onChange,
  children,
  className = '',
  icon: Icon,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  className?: string
  icon?: LucideIcon
  'aria-label'?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          aria-hidden="true"
        />
      )}
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className={`${fieldCls} appearance-none pr-9 ${Icon ? 'pl-10' : 'pl-3.5'} cursor-pointer`}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

const MODAL_ICON_TONES: Record<string, string> = {
  neutral: 'bg-white/10 text-neutral-200',
  danger: 'bg-red-500/15 text-red-400',
  warning: 'bg-amber-500/15 text-amber-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  info: 'bg-sky-500/15 text-sky-400',
}

export function Modal({
  open,
  onClose,
  title,
  icon: Icon,
  tone = 'neutral',
  children,
  footer,
  className = '',
}: {
  open: boolean
  onClose: () => void
  title: string
  icon?: LucideIcon
  tone?: keyof typeof MODAL_ICON_TONES
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative my-auto w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#1E1E1E] p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin ${className}`}
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${MODAL_ICON_TONES[tone]}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <h3 className="min-w-0 flex-1 pt-2 text-sm font-semibold text-white">{title}</h3>
          <IconButton icon={X} label="Tutup" size="sm" onClick={onClose} />
        </div>
        {children}
        {footer && <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export function TextButton({
  children,
  onClick,
  tone = 'neutral',
  type = 'button',
  disabled = false,
  form,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  tone?: 'neutral' | 'primary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  form?: string
  className?: string
}) {
  const t =
    tone === 'primary'
      ? 'bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500'
      : tone === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-400 disabled:opacity-50 disabled:hover:bg-red-500'
      : 'text-neutral-300 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent'
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 rounded-xl px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${t} ${className}`}
    >
      {children}
    </button>
  )
}
