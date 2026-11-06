import { prisma } from '@/lib/db/prisma'
import { siteConfig } from '@/config/site'
import { NextResponse } from 'next/server'

export const INDEXING_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours (86,400,000 ms)

export type IndexingProvider = 'indexnow' | 'google' | 'all'

export interface CooldownCheckResult {
  allowed: boolean
  remainingSeconds: number
  remainingFormatted: string
  lastSubmittedAt?: string
  nextAvailableAt?: string
  url: string
  provider: IndexingProvider
}

export interface IndexingRateLimitErrorPayload {
  error: string
  code: 'INDEXING_COOLDOWN_ACTIVE'
  message: string
  remainingSeconds: number
  remainingFormatted: string
  nextAvailableAt?: string
  cooldown: {
    url: string
    provider: IndexingProvider
    remainingSeconds: number
    remainingFormatted: string
    lastSubmittedAt?: string
    nextAvailableAt?: string
  }
}

/**
 * Normalizes input URL to canonical absolute URL representation:
 * - Strips trailing slashes (except root '/')
 * - Forces HTTPS and lowercase host
 * - Removes query parameters and hash anchors
 * - Resolves relative paths against siteConfig.url
 */
export function normalizeIndexingUrl(rawUrl: string, baseSiteUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('URL tidak boleh kosong.')
  }

  const base = baseSiteUrl || siteConfig.url || 'https://spatium.id'
  const trimmed = rawUrl.trim()

  let urlObj: URL
  try {
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      urlObj = new URL(trimmed)
    } else if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      urlObj = new URL(trimmed)
    } else if (trimmed.startsWith('//')) {
      urlObj = new URL(`https:${trimmed}`)
    } else {
      const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
      urlObj = new URL(cleanPath, base)
    }
  } catch {
    throw new Error(`Format URL tidak valid: "${rawUrl}"`)
  }

  if (!['http:', 'https:'].includes(urlObj.protocol.toLowerCase())) {
    throw new Error(`Protokol URL tidak didukung: "${urlObj.protocol}"`)
  }

  // Force HTTPS if matching main site domain or if scheme is insecure
  const canonicalBase = new URL(base)
  if (urlObj.hostname.toLowerCase() === canonicalBase.hostname.toLowerCase()) {
    urlObj.protocol = canonicalBase.protocol
  }

  // Normalize host & remove query/hash
  urlObj.hostname = urlObj.hostname.toLowerCase()
  urlObj.search = ''
  urlObj.hash = ''

  // Normalize pathname: collapse consecutive slashes & strip trailing slash (except root)
  let cleanPath = urlObj.pathname.toLowerCase().replace(/\/{2,}/g, '/')
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1)
  }
  if (!cleanPath) {
    cleanPath = '/'
  }

  return `${urlObj.protocol}//${urlObj.host}${cleanPath}`
}

/**
 * Concurrency gating for simultaneous in-flight cooldown evaluations on the same URL.
 * Protects against TOCTOU race conditions when multiple concurrent requests attempt
 * to evaluate checkIndexingCooldown simultaneously before persistent DB records are written.
 */
const inFlightOperations = new Map<string, number>()

export function _resetIndexingConcurrencyState(): void {
  inFlightOperations.clear()
}

/**
 * Formats duration in seconds into human-readable Indonesian text:
 * "X jam Y menit Z detik"
 */
export function formatRemainingDurationIndonesian(seconds: number): string {
  if (seconds <= 0) return '0 detik'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours} jam ${minutes} menit ${secs} detik`
}

/**
 * Checks whether a URL is currently under 24-hour indexing cooldown for the specified provider.
 *
 * @param url Target URL (relative or absolute)
 * @param provider 'indexnow' | 'google' | 'all' (default: 'all')
 * @param nowMs Optional custom timestamp in ms for deterministic unit testing
 * @param options Optional configuration (e.g. readonly check without concurrency gating)
 */
export async function checkIndexingCooldown(
  url: string,
  provider: IndexingProvider = 'all',
  nowMs?: number,
  options?: { readonly?: boolean }
): Promise<CooldownCheckResult> {
  const normalizedUrl = normalizeIndexingUrl(url)
  const now = typeof nowMs === 'number' ? nowMs : Date.now()

  // Concurrency Gate: detect simultaneous in-flight requests on the same URL
  if (!options?.readonly) {
    const currentCount = inFlightOperations.get(normalizedUrl) || 0
    inFlightOperations.set(normalizedUrl, currentCount + 1)
  }

  try {
    if (!options?.readonly) {
      const activeCount = inFlightOperations.get(normalizedUrl) || 0
      if (activeCount > 1) {
        return {
          allowed: false,
          remainingSeconds: INDEXING_COOLDOWN_MS / 1000,
          remainingFormatted: formatRemainingDurationIndonesian(INDEXING_COOLDOWN_MS / 1000),
          lastSubmittedAt: new Date(now).toISOString(),
          nextAvailableAt: new Date(now + INDEXING_COOLDOWN_MS).toISOString(),
          url: normalizedUrl,
          provider,
        }
      }
    }

    const whereClause: { url: string; provider?: string } = {
      url: normalizedUrl,
    }

    if (provider !== 'all') {
      whereClause.provider = provider
    }

    // 1. Primary lookup by exact normalized URL with defensive error handling
    let latest: any = null
    try {
      if ((prisma as unknown as { orm?: { public?: { IndexingSubmission?: unknown } } }).orm?.public?.IndexingSubmission) {
        latest = await prisma.orm.public.IndexingSubmission
          .where(whereClause)
          .orderBy((s: any) => s.submittedAt.desc())
          .first()

        // 2. Trailing slash resilience: if not found, check with trailing slash
        if (!latest && !normalizedUrl.endsWith('/')) {
          latest = await prisma.orm.public.IndexingSubmission
            .where({ ...whereClause, url: `${normalizedUrl}/` })
            .orderBy((s: any) => s.submittedAt.desc())
            .first()
        }
      }
    } catch (queryErr) {
      console.warn('[Indexing Rate Limit] Cooldown query fallback:', queryErr)
      latest = null
    }

    // Edge case 1: Never submitted
    if (!latest) {
      return {
        allowed: true,
        remainingSeconds: 0,
        remainingFormatted: '',
        url: normalizedUrl,
        provider,
      }
    }

    const lastTime = new Date(latest.submittedAt).getTime()
    const elapsed = now - lastTime

    // Edge case 2: Submitted > 24 hours ago
    if (elapsed >= INDEXING_COOLDOWN_MS) {
      return {
        allowed: true,
        remainingSeconds: 0,
        remainingFormatted: '',
        lastSubmittedAt: latest.submittedAt,
        nextAvailableAt: new Date(lastTime + INDEXING_COOLDOWN_MS).toISOString(),
        url: normalizedUrl,
        provider,
      }
    }

    // Edge case 3: Active cooldown (< 24 hours ago)
    // Clamp remaining time against clock skew
    const effectiveRemainingMs = Math.min(INDEXING_COOLDOWN_MS, Math.max(0, INDEXING_COOLDOWN_MS - elapsed))
    const remainingSeconds = Math.ceil(effectiveRemainingMs / 1000)
    const remainingFormatted = formatRemainingDurationIndonesian(remainingSeconds)
    const nextAvailableAt = new Date(lastTime + INDEXING_COOLDOWN_MS).toISOString()

    return {
      allowed: false,
      remainingSeconds,
      remainingFormatted,
      lastSubmittedAt: latest.submittedAt,
      nextAvailableAt,
      url: normalizedUrl,
      provider,
    }
  } finally {
    if (!options?.readonly) {
      const active = inFlightOperations.get(normalizedUrl) || 1
      if (active <= 1) {
        inFlightOperations.delete(normalizedUrl)
      } else {
        inFlightOperations.set(normalizedUrl, active - 1)
      }
    }
  }
}

/**
 * Generates an HTTP 429 Too Many Requests response with standard RFC 7231 Retry-After header
 * and structured JSON payload.
 */
export function createIndexingCooldownResponse(
  cooldown: CooldownCheckResult,
  customMessage?: string
): NextResponse<IndexingRateLimitErrorPayload> {
  const message =
    customMessage ??
    `Pengiriman ulang indexing untuk URL ini masih dalam masa jeda 24 jam. Silakan coba kembali dalam ${cooldown.remainingFormatted}.`

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      code: 'INDEXING_COOLDOWN_ACTIVE',
      message,
      remainingSeconds: cooldown.remainingSeconds,
      remainingFormatted: cooldown.remainingFormatted,
      nextAvailableAt: cooldown.nextAvailableAt,
      cooldown: {
        url: cooldown.url,
        provider: cooldown.provider,
        remainingSeconds: cooldown.remainingSeconds,
        remainingFormatted: cooldown.remainingFormatted,
        lastSubmittedAt: cooldown.lastSubmittedAt,
        nextAvailableAt: cooldown.nextAvailableAt,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(cooldown.remainingSeconds),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  )
}
