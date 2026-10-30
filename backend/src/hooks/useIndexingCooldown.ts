'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface IndexingProviderStatus {
  status: 'accepted' | 'success' | 'failed' | 'rate_limited' | 'unconfigured' | 'in_progress' | 'none' | string | null
  httpStatus: number | null
  submittedAt?: string | null
  trigger?: 'auto' | 'automated' | 'manual' | 'bulk' | 'mcp' | string | null
  actor?: string | null
  response?: any
}

export interface IndexingStatusApiResponse {
  url: string
  entity: {
    type: 'article' | 'page' | 'custom'
    id: number | null
    status: string
  }
  providers: {
    indexnow: IndexingProviderStatus | null
    google: IndexingProviderStatus | null
  }
  cooldown: {
    inCooldown: boolean
    remainingSeconds: number
    remainingFormatted: string
    lastSubmittedAt: string | null
    nextAvailableAt: string | null
  }
  canRetrigger: boolean
  retriggerBlockedReason: string | null
}

export interface RetriggerResult {
  success: boolean
  url?: string
  data?: any
  error?: string
  cooldownActive?: boolean
}

export interface UseIndexingCooldownOptions {
  url?: string
  slug?: string
  type?: 'article' | 'page' | 'custom'
  idOrSlug?: string | number
  provider?: 'all' | 'indexnow' | 'google'
  entityType?: 'article' | 'page' | 'custom'
  entityStatus?: string
  initialSeconds?: number
  initialRemainingSeconds?: number
  initialNextAvailableAt?: string | null
  initialGoogle?: IndexingProviderStatus | null
  initialIndexNow?: IndexingProviderStatus | null
  initialStatus?: IndexingStatusApiResponse | null
  enabled?: boolean
  onSuccess?: (msg: string | any) => void
  onError?: (err: string | Error) => void
  onExpire?: () => void
}

/**
 * Formats duration in seconds into human-readable Indonesian text:
 * - 0 -> "0 detik"
 * - < 60 -> "X detik"
 * - < 3600 -> "M menit S detik"
 * - >= 3600 -> "H jam M menit"
 */
export function formatRemainingTimeIndonesian(seconds: number): string {
  if (seconds <= 0) return '0 detik'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) return `${hours} jam ${minutes} menit`
  if (minutes > 0) return `${minutes} menit ${secs} detik`
  return `${secs} detik`
}

export const formatCountdownIndonesian = formatRemainingTimeIndonesian
export const formatCooldownTime = formatRemainingTimeIndonesian

export function useIndexingCooldown(
  urlOrOptions?: string | UseIndexingCooldownOptions
) {
  const options: UseIndexingCooldownOptions =
    typeof urlOrOptions === 'string'
      ? { url: urlOrOptions }
      : urlOrOptions || {}

  const {
    url,
    slug,
    type,
    idOrSlug,
    provider = 'all',
    entityType = type || 'article',
    entityStatus = 'published',
    initialSeconds = 0,
    initialRemainingSeconds = initialSeconds,
    initialNextAvailableAt = null,
    initialGoogle = null,
    initialIndexNow = null,
    initialStatus = null,
    enabled = true,
    onSuccess,
    onError,
    onExpire,
  } = options

  const resolvedIdOrSlug = idOrSlug ?? slug

  const [status, setStatus] = useState<IndexingStatusApiResponse | null>(initialStatus)
  const [googleStatus, setGoogleStatus] = useState<IndexingProviderStatus | null>(
    initialGoogle || initialStatus?.providers?.google || null
  )
  const [indexnowStatus, setIndexnowStatus] = useState<IndexingProviderStatus | null>(
    initialIndexNow || initialStatus?.providers?.indexnow || null
  )
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    initialRemainingSeconds || initialStatus?.cooldown?.remainingSeconds || 0
  )
  const [nextAvailableAt, setNextAvailableAt] = useState<string | null>(
    initialNextAvailableAt || initialStatus?.cooldown?.nextAvailableAt || null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [retriggering, setRetriggering] = useState<boolean>(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const targetAvailableTimeRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inFlightFetchRef = useRef<string | null>(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const inCooldown = remainingSeconds > 0
  const isPublished = entityStatus === 'published'
  const canRetrigger = isPublished && !inCooldown && !retriggering

  // Initialize target timestamp from nextAvailableAt or remainingSeconds
  useEffect(() => {
    if (nextAvailableAt) {
      targetAvailableTimeRef.current = new Date(nextAvailableAt).getTime()
    } else if (remainingSeconds > 0) {
      targetAvailableTimeRef.current = Date.now() + remainingSeconds * 1000
    }
  }, [nextAvailableAt, remainingSeconds])

  // Reset cooldown manually
  const resetCooldown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRemainingSeconds(0)
    setNextAvailableAt(null)
    targetAvailableTimeRef.current = null
  }, [])

  // Start cooldown manually
  const startCooldown = useCallback((targetTime: string | Date, durationSeconds?: number) => {
    const targetDate = typeof targetTime === 'string' ? new Date(targetTime) : targetTime
    const now = Date.now()
    const diffSecs = Math.max(0, Math.ceil((targetDate.getTime() - now) / 1000))
    const initialSecs = durationSeconds ?? diffSecs

    setNextAvailableAt(targetDate.toISOString())
    setRemainingSeconds(initialSecs)
    targetAvailableTimeRef.current = targetDate.getTime()
  }, [])

  // 1-Second Interval Tick Countdown (Drift-free)
  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const tick = () => {
      if (targetAvailableTimeRef.current) {
        const diffMs = targetAvailableTimeRef.current - Date.now()
        const diffSecs = Math.max(0, Math.ceil(diffMs / 1000))
        if (diffSecs <= 0) {
          setRemainingSeconds(0)
          setNextAvailableAt(null)
          targetAvailableTimeRef.current = null
          if (timerRef.current) clearInterval(timerRef.current)
          onExpireRef.current?.()
          return
        }
        setRemainingSeconds(diffSecs)
      } else {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            onExpireRef.current?.()
            return 0
          }
          return prev - 1
        })
      }
    }

    timerRef.current = setInterval(tick, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [remainingSeconds > 0])

  // Fetch initial/refreshed status from /api/indexing/status
  const fetchStatus = useCallback(async () => {
    if (!enabled || (!url && !resolvedIdOrSlug)) return

    const fetchKey = `${url || ''}|${resolvedIdOrSlug || ''}|${entityType || ''}|${provider || ''}`
    if (inFlightFetchRef.current === fetchKey) return
    inFlightFetchRef.current = fetchKey

    setLoading(true)
    setActionError(null)

    try {
      const params = new URLSearchParams()
      if (url) params.set('url', url)
      if (entityType) params.set('type', entityType)
      if (resolvedIdOrSlug !== undefined && resolvedIdOrSlug !== '') {
        params.set('idOrSlug', String(resolvedIdOrSlug))
      }
      if (provider) params.set('provider', provider)

      const res = await fetch(`/api/indexing/status?${params.toString()}`)
      if (res.status === 404) {
        // Content not yet saved in database
        setStatus(null)
        setRemainingSeconds(0)
        setNextAvailableAt(null)
        return
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || errJson.error || `HTTP ${res.status}`)
      }

      const data: IndexingStatusApiResponse = await res.json()
      setStatus(data)
      if (data.providers?.google) setGoogleStatus(data.providers.google)
      if (data.providers?.indexnow) setIndexnowStatus(data.providers.indexnow)

      if (data.cooldown?.inCooldown && data.cooldown.remainingSeconds > 0) {
        setRemainingSeconds(data.cooldown.remainingSeconds)
        setNextAvailableAt(data.cooldown.nextAvailableAt || null)
        if (data.cooldown.nextAvailableAt) {
          targetAvailableTimeRef.current = new Date(data.cooldown.nextAvailableAt).getTime()
        } else {
          targetAvailableTimeRef.current = Date.now() + data.cooldown.remainingSeconds * 1000
        }
      } else {
        setRemainingSeconds(0)
        setNextAvailableAt(null)
        targetAvailableTimeRef.current = null
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal memuat status pengindeksan.'
      setActionError(msg)
      onErrorRef.current?.(err)
    } finally {
      inFlightFetchRef.current = null
      setLoading(false)
    }
  }, [enabled, url, resolvedIdOrSlug, entityType, provider])

  // Use a ref to always hold the latest fetchStatus without it causing useEffect re-runs
  const fetchStatusRef = useRef(fetchStatus)
  useEffect(() => {
    fetchStatusRef.current = fetchStatus
  })

  useEffect(() => {
    fetchStatusRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url, resolvedIdOrSlug, entityType, provider])

  // Retrigger Action
  const triggerRetrigger = useCallback(
    async (providerOverride?: 'all' | 'indexnow' | 'google'): Promise<RetriggerResult> => {
      if (!canRetrigger) {
        return {
          success: false,
          error: !isPublished
            ? `Konten belum berstatus 'published' (status: '${entityStatus}').`
            : inCooldown
            ? `Masa jeda 24 jam masih aktif (${formatRemainingTimeIndonesian(remainingSeconds)} tersisa).`
            : 'Retrigger tidak dapat dijalankan.',
        }
      }

      setRetriggering(true)
      setActionError(null)

      // Optimistic update
      setGoogleStatus((prev) => ({
        status: 'in_progress',
        httpStatus: null,
        submittedAt: new Date().toISOString(),
        trigger: 'manual',
        actor: 'user',
        response: prev?.response,
      }))
      setIndexnowStatus((prev) => ({
        status: 'in_progress',
        httpStatus: null,
        submittedAt: new Date().toISOString(),
        trigger: 'manual',
        actor: 'user',
        response: prev?.response,
      }))

      try {
        const body: Record<string, any> = {
          provider: providerOverride || provider || 'all',
        }
        if (url) body.url = url
        if (entityType) body.type = entityType
        if (resolvedIdOrSlug !== undefined && resolvedIdOrSlug !== '') {
          body.idOrSlug = resolvedIdOrSlug
        }

        const res = await fetch('/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        // 429 Too Many Requests: Rate Limited with RFC 7231 Retry-After sync
        if (res.status === 429) {
          const retryAfterHeader = res.headers.get('Retry-After')
          const data = await res.json().catch(() => ({}))
          const seconds = retryAfterHeader ? Number(retryAfterHeader) : (data.remainingSeconds || 86400)
          const nextAt = data.nextAvailableAt || new Date(Date.now() + seconds * 1000).toISOString()

          setRemainingSeconds(seconds)
          setNextAvailableAt(nextAt)
          targetAvailableTimeRef.current = new Date(nextAt).getTime()

          const errMsg = data.error || data.message || `Masa jeda 24 jam masih aktif (${formatRemainingTimeIndonesian(seconds)} tersisa).`
          setActionError(errMsg)
          onError?.(errMsg)
          return { success: false, error: errMsg, cooldownActive: true }
        }

        if (res.status === 422) {
          const data = await res.json().catch(() => ({}))
          const errMsg = data.message || data.error || 'Hanya konten berstatus published yang dapat diindeks.'
          setActionError(errMsg)
          onError?.(errMsg)
          return { success: false, error: errMsg }
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const errMsg = data.message || data.error || `Retrigger gagal (HTTP ${res.status})`
          setActionError(errMsg)
          onError?.(errMsg)
          return { success: false, error: errMsg }
        }

        const data = await res.json()
        const durationSecs = data.cooldown?.durationSeconds || 86400
        const nextAt = data.cooldown?.nextAvailableAt || new Date(Date.now() + durationSecs * 1000).toISOString()

        setRemainingSeconds(durationSecs)
        setNextAvailableAt(nextAt)
        targetAvailableTimeRef.current = new Date(nextAt).getTime()

        if (data.providers?.google) setGoogleStatus(data.providers.google)
        if (data.providers?.indexnow) setIndexnowStatus(data.providers.indexnow)

        onSuccessRef.current?.(data)
        // Refresh status to synchronize fully
        await fetchStatus()

        return { success: true, url: data.url, data }
      } catch (err: any) {
        const msg = err.message || 'Terjadi kesalahan jaringan saat retrigger.'
        setActionError(msg)
        onErrorRef.current?.(msg)
        return { success: false, error: msg }
      } finally {
        setRetriggering(false)
      }
    },
    [canRetrigger, isPublished, entityStatus, inCooldown, remainingSeconds, provider, url, entityType, resolvedIdOrSlug, fetchStatus]
  )

  const retriggerBlockedReason = !isPublished
    ? `Konten belum berstatus 'published' (status: '${entityStatus}').`
    : inCooldown
    ? `Masa jeda 24 jam masih aktif (${formatRemainingTimeIndonesian(remainingSeconds)} tersisa).`
    : null

  return {
    remainingSeconds,
    remainingFormatted: formatRemainingTimeIndonesian(remainingSeconds),
    nextAvailableAt,
    inCooldown,
    cooldownActive: inCooldown,
    canRetrigger,
    retriggerBlockedReason,
    googleStatus,
    indexnowStatus,
    status,
    loading,
    retriggering,
    isRetriggering: retriggering,
    actionError,
    error: actionError,
    retrigger: triggerRetrigger,
    fetchStatus,
    refresh: fetchStatus,
    startCooldown,
    resetCooldown,
  }
}
