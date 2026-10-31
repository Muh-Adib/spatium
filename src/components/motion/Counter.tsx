'use client'

/**
 * Animated numeric stat. Renders the final value in the server HTML (SEO and
 * no-JS safe); when motion is allowed the number counts up once, the first
 * time it scrolls into view.
 */

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

type CounterProps = {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

function format(value: number, decimals: number, prefix: string, suffix: string) {
  return `${prefix}${value.toFixed(decimals)}${suffix}`
}

export function Counter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.4,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      // ScrollTrigger is registered inside this client effect only.
      gsap.registerPlugin(ScrollTrigger)

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = format(value, decimals, prefix, suffix)
        return
      }

      const state = { current: 0 }
      el.textContent = format(0, decimals, prefix, suffix)

      const tween = gsap.to(state, {
        current: value,
        duration,
        ease: 'power2.out',
        snap: decimals === 0 ? { current: 1 } : undefined,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = format(state.current, decimals, prefix, suffix)
        },
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { dependencies: [value, decimals, duration, prefix, suffix] },
  )

  return (
    <span ref={ref} className={className}>
      {format(value, decimals, prefix, suffix)}
    </span>
  )
}

export default Counter
