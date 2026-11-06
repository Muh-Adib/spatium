'use client'

import React from 'react'
import Link from 'next/link'
import { History } from 'lucide-react'
import { tabHref } from '@/lib/admin/tabs'

/**
 * Legacy URL registry. SPATIUM has no recorded legacy-site migration yet, so
 * this shows an honest empty state instead of a fabricated audit. Old URLs
 * that must keep working are handled as 301 rules in the Redirect tab.
 */
export default function MigrationTab() {
  return (
    <section aria-labelledby="migration-empty" className="space-y-3 rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-8 text-center">
      <History className="mx-auto h-8 w-8 text-neutral-300" aria-hidden="true" />
      <h2 id="migration-empty" className="text-base font-semibold">
        Belum ada pemetaan URL lama
      </h2>
      <p className="mx-auto max-w-prose text-sm text-neutral-300">
        Belum ada migrasi dari situs lama yang tercatat. Untuk URL lama yang harus tetap bisa dibuka, buat aturan 301 di tab Redirect.
      </p>
      <Link href={tabHref('redirects')} className="inline-flex min-h-10 items-center rounded-xl border border-white/15 px-4 text-xs font-semibold hover:bg-white/10">
        Buka Redirect
      </Link>
    </section>
  )
}
