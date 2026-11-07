'use client'

import React, { forwardRef, useEffect, useId, useRef } from 'react'
import { AlertCircle, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'

/**
 * Small, accessible primitives shared by the block editor and the pages
 * manager. Visual language follows the Studio (navy surfaces, yellow accent);
 * focus is always visible via a 2px accent outline on :focus-visible.
 */

export const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400'

const INPUT_BASE =
  'w-full min-w-0 rounded-lg border bg-white/[0.03] px-3 text-base sm:text-sm text-white placeholder:text-neutral-500 transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-400 disabled:opacity-60'

export function inputClass(invalid?: boolean, extra = ''): string {
  return `${INPUT_BASE} ${invalid ? 'border-red-400/80' : 'border-white/15'} ${extra}`
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-500 text-accent-950 hover:bg-accent-300 font-semibold',
  secondary: 'border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/25',
  ghost: 'text-neutral-300 hover:bg-white/[0.08] hover:text-white',
  danger: 'bg-red-500 text-white hover:bg-red-400 font-semibold',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  icon?: LucideIcon
  size?: 'sm' | 'md'
  busy?: boolean
}

/** Text button. `busy` keeps the label (screen readers know which action runs) and ignores repeat clicks. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', icon: Icon, size = 'md', busy, className = '', children, onClick, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-disabled={busy || undefined}
      onClick={(e) => {
        if (busy) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg ${
        size === 'sm' ? 'min-h-8 px-2.5 text-xs' : 'min-h-10 px-3.5 text-sm'
      } transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${FOCUS_RING} ${className}`}
      {...rest}
    >
      {Icon ? <Icon className={`h-4 w-4 shrink-0 ${busy ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" /> : null}
      {children}
    </button>
  )
})

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: LucideIcon
  label: string
  /** Visible in the tooltip, e.g. "Alt+↑". Also exposed via aria-keyshortcuts when `ariaShortcut` is set. */
  shortcut?: string
  ariaShortcut?: string
  tone?: 'neutral' | 'danger'
  size?: 'sm' | 'md'
}

/** Icon-only button with an accessible name, tooltip on hover/focus and optional shortcut hint. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, shortcut, ariaShortcut, tone = 'neutral', size = 'md', className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <Tooltip label={label} hint={shortcut} side="top">
      <button
        ref={ref}
        type={type}
        aria-label={label}
        aria-keyshortcuts={ariaShortcut}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg ${size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'} transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          tone === 'danger' ? 'text-red-300 hover:bg-red-500/15 hover:text-red-200' : 'text-neutral-300 hover:bg-white/10 hover:text-white'
        } ${FOCUS_RING} ${className}`}
        {...rest}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </Tooltip>
  )
})

/** Inline field error: text + icon, referenced by the control's aria-describedby. */
export function FieldError({ id, messages }: { id: string; messages: readonly string[] | undefined }) {
  if (!messages || messages.length === 0) return null
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{messages.join(' ')}</span>
    </p>
  )
}

export function FieldHelp({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-xs leading-relaxed text-neutral-300">
      {children}
    </p>
  )
}

export function describedBy(...ids: (string | false | null | undefined)[]): string | undefined {
  const list = ids.filter(Boolean)
  return list.length ? list.join(' ') : undefined
}

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  /** Max width in rem. */
  width?: number
  /** Element to focus on open; defaults to the first focusable element. */
  initialFocusRef?: React.RefObject<HTMLElement | null>
  /** When false, focus is not restored to the trigger on close (caller moves focus itself). */
  restoreFocus?: boolean
  className?: string
}

/**
 * Modal dialog on the native `<dialog>` element: `showModal()` makes the rest
 * of the page inert (focus trap) and Escape closes it. Focus moves inside on
 * open and returns to the element that had it on close.
 */
export function Dialog({ open, onClose, title, description, children, footer, width = 32, initialFocusRef, restoreFocus = true, className = '' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descId = useId()
  const restoreRef = useRef(restoreFocus)
  restoreRef.current = restoreFocus

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      const target =
        initialFocusRef?.current ??
        dialog.querySelector<HTMLElement>('[autofocus], input:not([type=hidden]), select, textarea, button:not([data-dialog-close])') ??
        dialog.querySelector<HTMLElement>('button')
      target?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    if (!open && returnTo.current) {
      const el = returnTo.current
      returnTo.current = null
      if (restoreRef.current && el.isConnected) el.focus()
    }
  }, [open, initialFocusRef])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{ maxWidth: `min(${width}rem, calc(100vw - 1.5rem))` }}
      className={`m-auto w-full max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl border border-white/15 bg-surface-overlay p-0 text-white shadow-2xl backdrop:bg-black/75 ${className}`}
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col">
          <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-heading text-base font-semibold text-white">
                {title}
              </h2>
              {description ? (
                <div id={descId} className="mt-1 text-sm leading-relaxed text-neutral-300">
                  {description}
                </div>
              ) : null}
            </div>
            <IconButton icon={X} label="Tutup" size="sm" onClick={onClose} data-dialog-close="" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  )
}

/** Status pill with text (never color alone). */
export function Badge({ tone, icon: Icon, children }: { tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; icon?: LucideIcon; children: React.ReactNode }) {
  const tones = {
    neutral: 'border-white/15 bg-white/[0.05] text-neutral-200',
    success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    warning: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    danger: 'border-red-400/30 bg-red-500/10 text-red-200',
    info: 'border-info/30 bg-info/10 text-info-300',
  } as const
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

/** Shortcut key cap. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-white/20 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-neutral-200">{children}</kbd>
}
