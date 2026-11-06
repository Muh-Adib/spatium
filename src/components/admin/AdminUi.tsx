'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
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
  neutral: 'text-neutral-300 hover:text-white hover:bg-white/10',
  primary: 'bg-accent-500 text-accent-950 hover:bg-accent-300',
  success: 'text-emerald-300 hover:bg-emerald-500/15',
  warning: 'text-amber-300 hover:bg-amber-500/15',
  danger: 'text-red-300 hover:bg-red-500/15',
  info: 'text-accent-300 hover:bg-accent-400/15',
  purple: 'text-purple-300 hover:bg-purple-500/15',
}

interface IconButtonProps {
  icon: LucideIcon
  /** Accessible name and tooltip title. Required: icon-only controls must be named. */
  label: string
  hint?: string
  tone?: Tone
  size?: 'sm' | 'md'
  side?: 'top' | 'bottom' | 'left' | 'right'
  href?: string
  external?: boolean
  onClick?: () => void
  /**
   * Unavailable. Rendered with `aria-disabled` (not native `disabled`) so the
   * control stays focusable and its tooltip explaining why stays reachable.
   */
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
  const cls = `inline-flex ${size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-lg transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${
    active ? 'bg-white/10 text-white' : BTN_TONES[tone]
  } ${className}`
  const icon = <Icon className={`h-4 w-4 ${spinning ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />

  return (
    <Tooltip label={label} hint={hint} side={side}>
      {href && !disabled ? (
        <Link
          href={href}
          aria-label={external ? `${label} (tab baru)` : label}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className={cls}
        >
          {icon}
        </Link>
      ) : (
        <button
          type="button"
          aria-label={label}
          aria-disabled={disabled || undefined}
          aria-pressed={active === undefined ? undefined : active}
          onClick={disabled ? undefined : onClick}
          className={cls}
        >
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
  return <div className={`rounded-2xl border border-white/[0.08] bg-surface-elevated ${className}`}>{children}</div>
}

/* ------------------------------------------------------------------ */
/* Live status region                                                  */
/* ------------------------------------------------------------------ */

export type StatusTone = 'success' | 'error' | 'info'

/**
 * Polite live region that is always mounted (so repeated messages are
 * announced). Status is carried by an icon + text, not color alone.
 */
export function StatusMessage({
  message,
  tone = 'info',
  onDismiss,
  className = '',
}: {
  message: string | null
  tone?: StatusTone
  onDismiss?: () => void
  className?: string
}) {
  const toneCls =
    tone === 'success'
      ? 'border-emerald-400/40 bg-emerald-950/70 text-emerald-100'
      : tone === 'error'
      ? 'border-red-400/40 bg-red-950/70 text-red-100'
      : 'border-accent-400/40 bg-accent-950/80 text-white'
  const prefix = tone === 'success' ? 'Berhasil:' : tone === 'error' ? 'Gagal:' : 'Info:'
  return (
    <div role="status" aria-live="polite" className={className}>
      {message ? (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${toneCls}`}>
          <span className="font-semibold">{prefix}</span>
          <span className="min-w-0 flex-1 break-words">{message}</span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="-my-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"
              aria-label="Tutup pesan"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Form helpers                                                        */
/* ------------------------------------------------------------------ */

export const fieldCls =
  'h-10 w-full rounded-xl border border-white/20 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-neutral-400 transition-colors focus:border-accent-400 focus:bg-white/[0.05] aria-[invalid=true]:border-red-400 disabled:opacity-60'

export interface FieldControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

/**
 * Label + control + hint + inline error, wired with `for`/`id`,
 * `aria-invalid` and `aria-describedby`.
 */
export function FormField({
  label,
  hint,
  error,
  action,
  children,
  className = '',
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string | null
  /** Optional control rendered beside the label (e.g. "Buat acak"). */
  action?: React.ReactNode
  children: (props: FieldControlProps) => React.ReactNode
  className?: string
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-neutral-200">
          {label}
        </label>
        {action}
      </div>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && (
        <p id={hintId} className="text-[11px] text-neutral-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] font-medium text-red-300">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
}

export function SearchField({
  icon: Icon,
  value,
  onChange,
  placeholder,
  label,
  onEnter,
  mono,
}: {
  icon: LucideIcon
  value: string
  onChange: (v: string) => void
  placeholder: string
  /** Accessible name; defaults to the placeholder. */
  label?: string
  onEnter?: () => void
  mono?: boolean
}) {
  return (
    <div className="relative w-full">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        aria-label={label || placeholder}
        className={`${fieldCls} pl-10 ${mono ? 'font-mono text-xs' : ''}`}
      />
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
        className={`group flex w-full items-center justify-between gap-2 rounded-xl border transition-all text-left select-none ${heightCls} ${
          open
            ? 'border-accent-400/60 bg-white/[0.06] text-white ring-2 ring-accent-400/20 shadow-lg shadow-accent-950/20'
            : 'border-white/10 bg-white/[0.03] text-neutral-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
        } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                open ? 'text-accent-400' : 'text-neutral-500 group-hover:text-neutral-400'
              }`}
              aria-hidden="true"
            />
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="h-4 w-4 shrink-0 text-accent-400" aria-hidden="true" />
          )}
          <span className={`truncate ${selectedOption ? 'font-medium text-white' : 'text-neutral-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ease-out ${
            open ? 'rotate-180 text-accent-400' : 'group-hover:text-neutral-300'
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
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-full w-max max-w-sm rounded-xl border border-white/10 bg-surface-overlay/95 p-1 text-white shadow-2xl shadow-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto scrollbar-thin"
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
                    ? 'bg-accent-500/15 text-accent-300 font-semibold'
                    : isHighlighted
                    ? 'bg-white/[0.08] text-white'
                    : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {ItemIcon && (
                    <ItemIcon
                      className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-accent-400' : 'text-neutral-400'}`}
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
                  {isSelected && <Check className="h-3.5 w-3.5 text-accent-400 shrink-0" aria-hidden="true" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal — native <dialog>.showModal()                                 */
/* ------------------------------------------------------------------ */

const MODAL_ICON_TONES = {
  neutral: 'bg-white/10 text-neutral-100',
  danger: 'bg-red-500/15 text-red-300',
  warning: 'bg-amber-500/15 text-amber-300',
  success: 'bg-emerald-500/15 text-emerald-300',
  info: 'bg-accent-400/15 text-accent-300',
} as const

/**
 * Modal dialog built on `<dialog>.showModal()`: the background becomes inert,
 * focus is trapped inside, Escape closes (via `onClose`), and focus returns
 * to the element that opened it. Mark the field that should receive initial
 * focus with `data-autofocus`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  tone = 'neutral',
  children,
  footer,
  className = '',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  icon?: LucideIcon
  tone?: keyof typeof MODAL_ICON_TONES
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descId = useId()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      // Prefer an explicit initial-focus target over the first focusable (the close button).
      const preferred = dialog.querySelector<HTMLElement>('[data-autofocus]')
      preferred?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, mounted])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onCancel = (e: Event) => {
      // Let the parent own the open state; Escape requests a close.
      e.preventDefault()
      onCloseRef.current()
    }
    const onDialogClose = () => {
      const target = returnFocusRef.current
      returnFocusRef.current = null
      if (target && target.isConnected) target.focus()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('close', onDialogClose)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('close', onDialogClose)
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onMouseDown={(e) => {
        // A press on the backdrop targets the <dialog> itself.
        if (e.target === e.currentTarget) onClose()
      }}
      className={`studio-admin m-auto w-[min(30rem,calc(100%-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/15 bg-surface-overlay p-0 text-white shadow-2xl backdrop:bg-black/75 ${className}`}
    >
      {open && (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {Icon && (
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${MODAL_ICON_TONES[tone]}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0 flex-1 pt-1.5">
              <h2 id={titleId} className="font-heading text-base font-semibold text-white">
                {title}
              </h2>
              {description && (
                <div id={descId} className="mt-1 text-xs leading-relaxed text-neutral-300">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {children}
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] pt-4">{footer}</div>}
        </div>
      )}
    </dialog>,
    document.body
  )
}

export function TextButton({
  children,
  onClick,
  tone = 'neutral',
  type = 'button',
  disabled = false,
  busy = false,
  form,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  tone?: 'neutral' | 'primary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Request in flight: stays focusable but ignores repeat activation. */
  busy?: boolean
  form?: string
  className?: string
}) {
  const t =
    tone === 'primary'
      ? 'bg-accent-500 text-accent-950 hover:bg-accent-300'
      : tone === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-500'
      : 'border border-white/15 text-neutral-100 hover:bg-white/10 hover:text-white'
  return (
    <button
      type={type}
      form={form}
      onClick={(e) => {
        if (busy) {
          e.preventDefault()
          return
        }
        onClick?.()
      }}
      disabled={disabled}
      aria-busy={busy || undefined}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress aria-busy:opacity-80 ${t} ${className}`}
    >
      {children}
    </button>
  )
}
