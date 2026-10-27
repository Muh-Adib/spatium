'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Observes every [data-reveal] element in the document and adds `.is-visible`
 * once it scrolls into view.
 *
 * A MutationObserver keeps track of elements added later — filter grids, tab
 * panels and route changes all mount new nodes that would otherwise stay
 * hidden at opacity 0.
 */
export function useScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof IntersectionObserver === 'undefined') {
      document
        .querySelectorAll<HTMLElement>('[data-reveal]:not([data-visible="true"])')
        .forEach((node) => node.setAttribute('data-visible', 'true'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          el.setAttribute('data-visible', 'true')
          observer.unobserve(el)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    const observePending = () => {
      document
        .querySelectorAll<HTMLElement>('[data-reveal]:not([data-visible="true"])')
        .forEach((node) => observer.observe(node))
    }

    observePending()

    let frame = 0
    const mutations = new MutationObserver((records) => {
      if (!records.some((record) => record.addedNodes.length > 0)) return
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        observePending()
      })
    })
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      mutations.disconnect()
      observer.disconnect()
    }
  }, [pathname])
}

/** Resets scroll position on navigation (except when a hash target is present). */
export function useScrollToTopOnNavigate() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
}

/** Locks body scroll (mobile nav, modals). */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const { body } = document
    if (locked) {
      const prev = body.style.overflow
      body.classList.add('is-locked')
      body.style.overflow = 'hidden'
      return () => {
        body.classList.remove('is-locked')
        body.style.overflow = prev
      }
    }
    return undefined
  }, [locked])
}

/** True when the visitor prefers reduced motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export type PointerState = { x: number; y: number }

/**
 * Tracks the pointer over an element and publishes normalised coordinates
 * (-0.5 … 0.5) as `--px` / `--py` CSS custom properties on that element, so
 * children can express parallax purely in CSS.
 */
export function usePointerParallax<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)

  const onPointerMove = useCallback((event: React.PointerEvent<T>) => {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    node.style.setProperty('--px', x.toFixed(4))
    node.style.setProperty('--py', y.toFixed(4))
  }, [])

  const onPointerLeave = useCallback(() => {
    const node = ref.current
    if (!node) return
    node.style.setProperty('--px', '0')
    node.style.setProperty('--py', '0')
  }, [])

  return { ref, onPointerMove, onPointerLeave }
}

/** Returns the id of the section currently in view, based on anchors in the DOM. */
export function useActiveAnchor(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node))
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.4, 0.75] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [ids])

  return active
}
