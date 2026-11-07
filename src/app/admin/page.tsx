'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { canSeeTab, resolveAdminTab } from '@/lib/admin/tabs'
import { TAB_COMPONENTS } from '@/components/studio/admin/tabRegistry'
import { useAuth } from '@/lib/auth/AuthContext'

/**
 * Studio Admin entry. The `?tab=` search param is the single source of truth
 * (back/forward work); valid values come from `src/lib/admin/tabs.ts`. The
 * heading, document title and focus move are handled by the admin layout.
 */
function AdminTabPanel() {
  const searchParams = useSearchParams()
  const { role, isAuthenticated } = useAuth()
  const tab = resolveAdminTab(searchParams?.get('tab'))
  const Panel = TAB_COMPONENTS[tab]
  if (isAuthenticated && !canSeeTab(tab, role)) {
    return (
      <p role="status" className="py-16 text-center text-sm text-neutral-300">
        Peran Anda tidak memiliki akses ke bagian ini.
      </p>
    )
  }
  // `key` remounts the panel on tab change so each tab starts with fresh state.
  return (
    <div className="pb-16 text-white">
      <Panel key={tab} />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-neutral-300">Memuat Studio…</p>}>
      <AdminTabPanel />
    </Suspense>
  )
}
