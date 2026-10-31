'use client'

import type { ReactNode } from 'react'
import { useScrollReveal } from './useScrollReveal'

/**
 * Client wrapper that activates the GSAP scroll-reveal layer for everything
 * rendered inside it, so the home page itself can remain a Server Component.
 */
export function RevealProvider({ children }: { children: ReactNode }) {
  useScrollReveal()
  return <>{children}</>
}

export default RevealProvider
