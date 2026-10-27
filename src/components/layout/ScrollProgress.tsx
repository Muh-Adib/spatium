'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useScrollReveal, useScrollToTopOnNavigate } from '@/hooks'

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}

export function ClientLayoutEffects() {
  useScrollReveal()
  useScrollToTopOnNavigate()
  return null
}
