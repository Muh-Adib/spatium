'use client'

import React, { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

interface EditorDialogProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  /** `sheet` docks to the inline-end edge at full height (used for the inspector on narrow screens). */
  variant?: 'center' | 'sheet'
  size?: 'sm' | 'md' | 'lg'
  /** Block Escape / backdrop close (e.g. while a save is in flight). */
  dismissible?: boolean
  /** Element id to focus on open; defaults to the first focusable control after the close button. */
  initialFocusId?: string
  className?: string
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' } as const

/**
 * Native `<dialog>` opened with `showModal()`: the rest of the page becomes inert, focus is
 * trapped by the browser, Escape closes it, and focus returns to the element that opened it.
 */
export function EditorDialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  variant = 'center',
  size = 'md',
  dismissible = true,
  initialFocusId,
  className = '',
}: EditorDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  /** Set when the parent closed the dialog via `open=false`, so `onClose` is not echoed back. */
  const closedByPropRef = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      const target = initialFocusId ? document.getElementById(initialFocusId) : null
      if (target) {
        target.focus()
      } else {
        const first = dialog.querySelector<HTMLElement>(
          ':is([data-dialog-body], [data-dialog-footer]) :is(input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"])):not([disabled])',
        )
        first?.focus()
      }
    } else if (!open && dialog.open) {
      closedByPropRef.current = true
      dialog.close()
    }
  }, [open, initialFocusId])

  // Restore focus to the opener when the dialog closes for any reason.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => {
      const target = returnFocusRef.current
      returnFocusRef.current = null
      if (target && target.isConnected) target.focus()
      if (closedByPropRef.current) {
        closedByPropRef.current = false
        return
      }
      onCloseRef.current()
    }
    const handleCancel = (e: Event) => {
      if (!dismissible) e.preventDefault()
    }
    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [dismissible])

  const layout =
    variant === 'sheet'
      ? 'ms-auto me-0 my-0 h-[100dvh] max-h-[100dvh] w-full max-w-[420px] rounded-none border-y-0 border-e-0'
      : `m-auto w-[calc(100%-2rem)] ${SIZES[size]} max-h-[calc(100dvh-2rem)] rounded-2xl`

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onMouseDown={(e) => {
        // Click on the ::backdrop (the dialog element itself, outside its content box).
        if (dismissible && e.target === e.currentTarget) ref.current?.close()
      }}
      className={`studio-admin border border-white/15 bg-surface-overlay p-0 text-white shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm ${layout} ${className}`}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
            {icon && <span className="mt-0.5 shrink-0" aria-hidden="true">{icon}</span>}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-sm font-bold text-white">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-xs leading-relaxed text-neutral-300">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={() => ref.current?.close()}
                aria-label="Tutup dialog"
                className="-me-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {children && (
            <div data-dialog-body className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          )}
          {footer && (
            <div data-dialog-footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</div>
          )}
        </div>
      )}
    </dialog>
  )
}

/** Button styles shared by editor dialogs (one primary per dialog). */
export const dialogButton = {
  primary:
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-xs font-bold text-accent-950 hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60',
  danger:
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-400/50 bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60',
} as const
