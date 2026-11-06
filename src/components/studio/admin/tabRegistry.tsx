'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { AdminTab } from '@/lib/admin/tabs'

function TabLoading() {
  return (
    <p role="status" className="py-16 text-center text-sm text-neutral-300">
      Memuat…
    </p>
  )
}


/**
 * One lazily loaded component per tab: a tab's code and data are fetched only
 * when it is opened. Each tab component owns its own state and fetching.
 */
export const TAB_COMPONENTS: Record<AdminTab, React.ComponentType> = {
  overview: dynamic(() => import('./OverviewTab'), { loading: TabLoading }),
  articles: dynamic(() => import('./ArticlesTab'), { loading: TabLoading }),
  pages: dynamic(() => import('@/components/studio/pages/StudioPagesManager'), { loading: TabLoading }),
  portfolio: dynamic(() => import('@/components/studio/StudioPortfolioManager').then((m) => m.StudioPortfolioManager), { loading: TabLoading }),
  services: dynamic(() => import('@/components/studio/StudioServicesManager').then((m) => m.StudioServicesManager), { loading: TabLoading }),
  solutions: dynamic(() => import('@/components/studio/StudioSolutionsManager').then((m) => m.StudioSolutionsManager), { loading: TabLoading }),
  blocks: dynamic(() => import('@/components/studio/StudioBlocksCatalog').then((m) => m.StudioBlocksCatalog), { loading: TabLoading }),
  clients: dynamic(() => import('@/components/studio/StudioClientsManager').then((m) => m.StudioClientsManager), { loading: TabLoading }),
  media: dynamic(() => import('@/components/studio/StudioMediaManager').then((m) => m.StudioMediaManager), { loading: TabLoading }),
  cta: dynamic(() => import('@/components/studio/StudioCtaManager').then((m) => m.StudioCtaManager), { loading: TabLoading }),
  calendar: dynamic(() => import('@/components/studio/StudioCalendar').then((m) => m.StudioCalendar), { loading: TabLoading }),
  keywords: dynamic(() => import('@/components/studio/StudioKeywordPlanner').then((m) => m.StudioKeywordPlanner), { loading: TabLoading }),
  audit: dynamic(() => import('@/components/studio/StudioSiteAudit').then((m) => m.StudioSiteAudit), { loading: TabLoading }),
  perf: dynamic(() => import('@/components/studio/StudioPerformanceManager').then((m) => m.StudioPerformanceManager), { loading: TabLoading }),
  gsc: dynamic(() => import('@/components/studio/StudioGscDashboard').then((m) => m.StudioGscDashboard), { loading: TabLoading }),
  redirects: dynamic(() => import('./RedirectsTab'), { loading: TabLoading }),
  migration: dynamic(() => import('./MigrationTab'), { loading: TabLoading }),
  system: dynamic(() => import('./SystemTab'), { loading: TabLoading }),
  mcp: dynamic(() => import('@/components/studio/mcp/StudioMcpManager'), { loading: TabLoading }),
  users: dynamic(() => import('@/components/studio/StudioUsersManager'), { loading: TabLoading }),
  settings: dynamic(() => import('@/components/studio/StudioSettings').then((m) => m.StudioSettings), { loading: TabLoading }),
}
