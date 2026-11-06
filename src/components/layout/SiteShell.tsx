'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress, ClientLayoutEffects } from '@/components/layout/ScrollProgress'
import type { SocialLink, UseCaseMenuItem } from '@/lib/content/spatium-types'

export function SiteShell({
  children,
  useCases,
  socials,
}: {
  children: React.ReactNode
  useCases: UseCaseMenuItem[]
  socials: SocialLink[]
}) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="app-shell">
      <ClientLayoutEffects />
      <Header useCases={useCases} />
      <ScrollProgress />
      <main id="main" className="app-main">
        {children}
      </main>
      <Footer useCases={useCases} socials={socials} />
    </div>
  )
}
