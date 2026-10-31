'use client'

/**
 * GSAP-driven scroll reveal layer for the home page.
 *
 * Coexists with the site-wide IntersectionObserver reveal in `src/hooks`:
 * both systems agree on the `[data-visible="true"]` contract. When this hook
 * takes over an element it sets `data-visible` itself, disables the CSS
 * transition inline while the tween runs, and clears inline props on complete
 * so the stylesheet returns to being the source of truth.
 *
 * - `[data-reveal]`: batched entrance (y 24px, opacity 0, stagger, once).
 * - `[data-parallax="N"]`: restrained yPercent scrub (±N% of element height).
 * - Reduced motion: no tweens at all — every element is marked visible.
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

export function useScrollReveal() {
  useGSAP(() => {
    if (typeof window === 'undefined') return
    // ScrollTrigger is registered inside this client effect only.
    gsap.registerPlugin(ScrollTrigger)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      document
        .querySelectorAll<HTMLElement>('[data-reveal]:not([data-visible="true"])')
        .forEach((el) => el.setAttribute('data-visible', 'true'))
      return
    }

    /* -------------------- [data-reveal] batched entrance -------------------- */
    const pending = gsap.utils.toArray<HTMLElement>('[data-reveal]:not([data-visible="true"])')
    if (pending.length > 0) {
      ScrollTrigger.batch(pending, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          batch.forEach((el) => el.setAttribute('data-visible', 'true'))
          gsap.fromTo(
            batch,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: 'power3.out',
              stagger: 0.08,
              overwrite: 'auto',
              onStart: () => {
                // GSAP owns the element while it animates: stop the CSS
                // transition from fighting the per-frame inline styles.
                gsap.set(batch, { transition: 'none' })
              },
              onComplete: () => {
                gsap.set(batch, { clearProps: 'opacity,transform,transition,visibility' })
              },
            },
          )
        },
      })
    }

    /* --------------------- [data-parallax] scrubbed drift -------------------- */
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
      const strength = Number.parseFloat(el.dataset.parallax ?? '') || 10
      gsap.fromTo(
        el,
        { yPercent: -strength },
        {
          yPercent: strength,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    })
  })
}

export default useScrollReveal
