'use client'

import React from 'react'
import { Archive, CircleHelp, Clock, FilePen, Globe, ThumbsUp } from 'lucide-react'
import { Badge } from '../blocks/ui'
import { isEditorialStatus, type EditorialStatus } from './status'

export { isEditorialStatus, type EditorialStatus } from './status'

type StatusMeta = { label: string; tone: 'neutral' | 'success' | 'warning' | 'info'; icon: typeof Globe }

export const STATUS_META: Record<EditorialStatus, StatusMeta> = {
  draft: { label: 'Draf', tone: 'neutral', icon: FilePen },
  in_review: { label: 'Menunggu review', tone: 'warning', icon: Clock },
  approved: { label: 'Disetujui', tone: 'info', icon: ThumbsUp },
  published: { label: 'Terbit', tone: 'success', icon: Globe },
  archived: { label: 'Diarsipkan', tone: 'info', icon: Archive },
}

const UNKNOWN_STATUS: StatusMeta = { label: 'Status tidak diketahui', tone: 'neutral', icon: CircleHelp }

/** Status pill with icon + text. Unknown or missing statuses say so (no guessed status). */
export function StatusBadge({ status }: { status: EditorialStatus | string | null | undefined }) {
  const meta = isEditorialStatus(status) ? STATUS_META[status] : UNKNOWN_STATUS
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
