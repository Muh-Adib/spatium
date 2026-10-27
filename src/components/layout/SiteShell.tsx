'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress, ClientLayoutEffects } from '@/components/layout/ScrollProgress'

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="app-shell">
      <ClientLayoutEffects />
      <Header />
      <ScrollProgress />
      <main id="main" className="app-main">
        {children}
      </main>
      <Footer />
    </div>
  )
}
