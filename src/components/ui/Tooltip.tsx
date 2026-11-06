'use client'

import React, { useEffect, useRef, useState } from 'react'

type Side = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  content?: React.ReactNode
  side?: Side
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

const SHIFT: Record<Side, string> = {
  top: '-translate-x-1/2 -translate-y-full',
  bottom: '-translate-x-1/2',
  left: '-translate-x-full -translate-y-1/2',
  right: '-translate-y-1/2',
}

/**
 * Tooltip dengan posisi `fixed`, jadi tidak terpotong oleh sidebar / container
 * yang punya overflow. Muncul saat hover dan fokus keyboard.
 */
export function Tooltip({ label, hint, content, side = 'top', disabled, className = '', children }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const effectiveHint = hint || content

  // WCAG 1.4.13: a visible tooltip must be dismissible without moving focus or pointer.
  useEffect(() => {
    if (!pos) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPos(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pos])

  if (disabled || (!label && !effectiveHint)) return <>{children}</>

  const show = () => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140)
    setPos(
      side === 'right'
        ? { x: r.right + 10, y: r.top + r.height / 2 }
        : side === 'left'
        ? { x: r.left - 10, y: r.top + r.height / 2 }
        : side === 'top'
        ? { x: cx, y: r.top - 8 }
        : { x: cx, y: r.bottom + 8 }
    )
  }
  const hide = () => setPos(null)

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={hide}
      className={`inline-flex ${className}`}
    >
      {children}
      {pos && (
        <span
          role="tooltip"
          style={{ left: pos.x, top: pos.y }}
          className={`pointer-events-none fixed z-[100] w-max max-w-[260px] rounded-lg border border-white/10 bg-[#0E0E0E] px-3 py-2 text-xs leading-snug text-neutral-100 shadow-xl shadow-black/50 ${SHIFT[side]}`}
        >
          {label && <span className="block font-medium">{label}</span>}
          {effectiveHint && <span className={`block text-neutral-400 ${label ? 'mt-0.5' : ''}`}>{effectiveHint}</span>}
        </span>
      )}
    </span>
  )
}
