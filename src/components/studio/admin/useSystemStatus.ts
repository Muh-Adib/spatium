'use client'

import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { fetchJson } from './fetchJson'

const countsSchema = z.object({
  articles: z.number(),
  portfolios: z.number(),
  services: z.number(),
  serviceCategories: z.number(),
  solutions: z.number(),
  pages: z.number(),
  redirects: z.number(),
})

export const systemStatusSchema = z.object({
  online: z.boolean(),
  latency: z.string().nullable(),
  database: z.string(),
  engine: z.string(),
  checkedAt: z.string().optional(),
  counts: countsSchema.nullable(),
  message: z.string().optional(),
})
export type SystemStatus = z.infer<typeof systemStatusSchema>
export type ContentCounts = z.infer<typeof countsSchema>

export type SystemStatusState =
  | { phase: 'loading' }
  | { phase: 'ready'; data: SystemStatus }
  | { phase: 'error'; message: string }

/** Reads `/api/system/status` (real Prisma counts). The 503 body is still a valid status. */
export function useSystemStatus() {
  const [state, setState] = useState<SystemStatusState>({ phase: 'loading' })
  const [checking, setChecking] = useState(false)

  const check = useCallback(async (signal?: AbortSignal) => {
    setChecking(true)
    const r = await fetchJson('/api/system/status', systemStatusSchema, {
      signal,
      cache: 'no-store',
      fallbackError: 'Status database belum bisa diperiksa.',
    })
    if (signal?.aborted) return
    setChecking(false)
    if (r.ok) setState({ phase: 'ready', data: r.data })
    else if (r.status === 503)
      setState({ phase: 'ready', data: { online: false, latency: null, database: 'PostgreSQL', engine: 'Prisma', counts: null, message: r.error } })
    else setState({ phase: 'error', message: r.error })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    check(controller.signal)
    return () => controller.abort()
  }, [check])

  return { state, checking, recheck: () => check() }
}

export const formatCheckedAt = (iso?: string) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
