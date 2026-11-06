'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const HISTORY_LIMIT = 100
/** Consecutive edits to the same field within this window become one undo step. */
const COALESCE_MS = 1200

export type ApplyOptions = {
  /** Same key within COALESCE_MS → merged into one undo step (typing in one field). */
  coalesceKey?: string
}

/**
 * Undo/redo for a controlled value. History stores references (updates are
 * immutable), so nothing is deep-cloned or serialized per keystroke. When the
 * parent replaces the value with something this hook did not emit (e.g. a
 * different record loaded), history resets.
 */
export function useUndoable<T>(value: T, onChange: (next: T) => void) {
  const past = useRef<T[]>([])
  const future = useRef<T[]>([])
  const lastEmitted = useRef<T>(value)
  const lastCoalesce = useRef<{ key: string; at: number } | null>(null)
  const [, setVersion] = useState(0)
  const bump = () => setVersion((v) => v + 1)

  if (value !== lastEmitted.current) {
    // External replacement: start a fresh history for the new value.
    past.current = []
    future.current = []
    lastCoalesce.current = null
    lastEmitted.current = value
  }

  const valueRef = useRef(value)
  valueRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const emit = (next: T) => {
    lastEmitted.current = next
    onChangeRef.current(next)
  }

  const apply = useCallback((next: T, options: ApplyOptions = {}) => {
    const now = Date.now()
    const prevCoalesce = lastCoalesce.current
    const merge = Boolean(options.coalesceKey && prevCoalesce && prevCoalesce.key === options.coalesceKey && now - prevCoalesce.at < COALESCE_MS)
    if (!merge) {
      past.current = [...past.current, valueRef.current].slice(-HISTORY_LIMIT)
    }
    future.current = []
    lastCoalesce.current = options.coalesceKey ? { key: options.coalesceKey, at: now } : null
    emit(next)
    bump()
  }, [])

  const undo = useCallback((): boolean => {
    const prev = past.current[past.current.length - 1]
    if (past.current.length === 0) return false
    past.current = past.current.slice(0, -1)
    future.current = [valueRef.current, ...future.current]
    lastCoalesce.current = null
    emit(prev)
    bump()
    return true
  }, [])

  const redo = useCallback((): boolean => {
    if (future.current.length === 0) return false
    const [next, ...rest] = future.current
    future.current = rest
    past.current = [...past.current, valueRef.current]
    lastCoalesce.current = null
    emit(next)
    bump()
    return true
  }, [])

  return { apply, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 }
}

export type StoredDraft<T> = { savedAt: number; value: T }

function readDraft<T>(key: string): StoredDraft<T> | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'savedAt' in parsed && 'value' in parsed) {
      return parsed as StoredDraft<T>
    }
    return null
  } catch (err) {
    console.warn('[block-editor] unreadable local draft, ignoring:', err)
    return null
  }
}

/**
 * Autosaves `value` to localStorage (debounced) while it differs from
 * `baseline` (the last saved server state), and offers a stored draft that
 * differs from the baseline for recovery. Serialization happens only in the
 * debounced write, never on every keystroke.
 */
export function useLocalDraft<T>(key: string | null, value: T, baseline: T, delay = 1000) {
  const [recoverable, setRecoverable] = useState<StoredDraft<T> | null>(null)

  // Offer a stored draft once per key.
  useEffect(() => {
    if (!key) return
    const stored = readDraft<T>(key)
    if (stored && JSON.stringify(stored.value) !== JSON.stringify(baseline)) setRecoverable(stored)
    else setRecoverable(null)
    // baseline intentionally read once per key: later saves must not re-offer the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!key) return
    const handle = window.setTimeout(() => {
      try {
        if (value === baseline || JSON.stringify(value) === JSON.stringify(baseline)) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), value }))
        }
      } catch (err) {
        console.warn('[block-editor] could not write local draft:', err)
      }
    }, delay)
    return () => window.clearTimeout(handle)
  }, [key, value, baseline, delay])

  const clear = useCallback(() => {
    setRecoverable(null)
    if (!key) return
    try {
      window.localStorage.removeItem(key)
    } catch (err) {
      console.warn('[block-editor] could not clear local draft:', err)
    }
  }, [key])

  const dismiss = useCallback(() => setRecoverable(null), [])

  return { recoverable, clear, dismiss }
}

/** Warns before leaving the page while `dirty`. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
}

/** True when the user asked the OS for reduced motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** "⌘" on Apple platforms, "Ctrl" elsewhere; resolved after mount to keep SSR markup stable. */
export function useModKeyLabel(): string {
  const [label, setLabel] = useState('Ctrl')
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setLabel('⌘')
  }, [])
  return label
}
