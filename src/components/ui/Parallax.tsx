'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ParallaxProps {
  children: React.ReactNode
  speed?: number // -1 to 1 (negative = opposite scroll direction)
  direction?: 'vertical' | 'horizontal'
  scale?: number
  opacity?: boolean
  className?: string
}

export function Parallax({
  children,
  speed = 0.2,
  direction = 'vertical',
  scale,
  opacity,
  className = '',
}: ParallaxProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !triggerRef.current || !targetRef.current) return

    const el = targetRef.current
    const distance = 100 * speed

    const animProps: gsap.TweenVars = {
      ease: 'none',
      scrollTrigger: {
        trigger: triggerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    }

    if (direction === 'vertical') {
      animProps.y = distance
    } else {
      animProps.x = distance
    }

    if (scale !== undefined) {
      animProps.scale = scale
    }

    if (opacity) {
      animProps.opacity = 0.3
    }

    const tween = gsap.to(el, animProps)

    return () => {
      tween.kill()
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === triggerRef.current) t.kill()
      })
    }
  }, [speed, direction, scale, opacity])

  return (
    <div ref={triggerRef} className={`overflow-hidden ${className}`}>
      <div ref={targetRef} className="will-change-transform">
        {children}
      </div>
    </div>
  )
}
