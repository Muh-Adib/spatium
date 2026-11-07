'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress, ClientLayoutEffects } from '@/components/layout/ScrollProgress'
import type { UseCaseMenuItem } from '@/lib/content/spatium-types'
import type { PublicContact } from '@/lib/contact/public-contact'

export function SiteShell({
  children,
  useCases,
  contact,
}: {
  children: React.ReactNode
  useCases: UseCaseMenuItem[]
  contact: PublicContact
}) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="app-shell">
      <ClientLayoutEffects />
      <Header useCases={useCases} contact={contact} />
      <ScrollProgress />
      <main id="main" className="app-main">
        {children}
      </main>
      <Footer useCases={useCases} contact={contact} />
    </div>
  )
}
