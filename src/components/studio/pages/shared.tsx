'use client'

import React from 'react'
import { Archive, Clock, FilePen, Globe } from 'lucide-react'
import type { PageStatus } from '@/lib/pages/page-schema'
import { Badge } from '../blocks/ui'

export const STATUS_META: Record<PageStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'info'; icon: typeof Globe }> = {
  draft: { label: 'Draf', tone: 'neutral', icon: FilePen },
  in_review: { label: 'Menunggu review', tone: 'warning', icon: Clock },
  published: { label: 'Terbit', tone: 'success', icon: Globe },
  archived: { label: 'Diarsipkan', tone: 'info', icon: Archive },
}

export function StatusBadge({ status }: { status: PageStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  )
}

const DATE_FMT = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : DATE_FMT.format(d)
}

export function DateTime({ iso }: { iso: string | null | undefined }) {
  return iso ? <time dateTime={iso}>{formatDate(iso)}</time> : <span>—</span>
}
