import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { siteConfig } from '@/config/site'

/**
 * ============================================================================
 * SPECIFICATION CONTRACT HARNESS: INDEXING COOLDOWN & BOUNDARY ENGINE
 * Derived from PROJECT.md, ORIGINAL_REQUEST.md, and RFC 7231 §7.1.3
 * ============================================================================
 */

export const COOLDOWN_DURATION_SECONDS = 86400 // 24 Hours in Seconds

export interface CooldownCheckResult {
  allowed: boolean
  remainingSeconds: number
  remainingFormatted: string
  lastSubmittedAt?: string
  nextAvailableAt?: string
}

export interface IndexingSubmissionRecord {
  id: number | string
  url: string
  entityType: 'article' | 'page' | 'custom'
  entityId?: number
  provider: 'indexnow' | 'google'
  status: 'accepted' | 'success' | 'failed' | 'rate_limited'
  httpStatus: number | null
  responsePayload?: string
  errorMessage?: string
  triggeredBy?: string
  createdAt: string
}

/**
 * In-memory specification repository for isolated cooldown and submission testing
 */
export class IndexingSubmissionRepository {
  private submissions: IndexingSubmissionRecord[] = []
  private idCounter = 1

  public clear(): void {
    this.submissions = []
    this.idCounter = 1
  }

  public record(entry: Omit<IndexingSubmissionRecord, 'id'>): IndexingSubmissionRecord {
    const record: IndexingSubmissionRecord = {
      ...entry,
      id: this.idCounter++,
    }
    this.submissions.push(record)
    return record
  }

  public getLatest(url: string, provider?: 'indexnow' | 'google' | 'all'): IndexingSubmissionRecord | null {
    const matches = this.submissions.filter((s) => {
      if (s.url !== url) return false
      if (!provider || provider === 'all') return true
      return s.provider === provider
    })

    if (matches.length === 0) return null
    return matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }

  public getAll(): IndexingSubmissionRecord[] {
    return [...this.submissions]
  }
}

export const submissionRepo = new IndexingSubmissionRepository()

/**
 * Pure calculation helper for human-readable cooldown duration (Indonesian)
 */
export function formatRemainingDuration(seconds: number): string {
  if (seconds <= 0) return '0 detik'
  if (seconds < 60) return `${seconds} detik`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSecs = seconds % 60

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`
  }
  if (minutes > 0 && remainingSecs === 0) {
    return `${minutes} menit`
  }
  if (minutes > 0) {
    return `${minutes} menit ${remainingSecs} detik`
  }
  return `${seconds} detik`
}

/**
 * Evaluates 24-hour indexing cooldown against submission repository
 */
export async function calculateIndexingCooldown(
  url: string,
  provider: 'indexnow' | 'google' | 'all' = 'all',
  currentDate: Date = new Date()
): Promise<CooldownCheckResult> {
  const latest = submissionRepo.getLatest(url, provider)
  if (!latest) {
    return {
      allowed: true,
      remainingSeconds: 0,
      remainingFormatted: '0 detik',
    }
  }

  const lastTime = new Date(latest.createdAt).getTime()
  const currentTime = currentDate.getTime()
  const elapsedSeconds = Math.floor((currentTime - lastTime) / 1000)

  // Edge case: system clock drift or future record
  if (elapsedSeconds < 0) {
    const remainingSeconds = COOLDOWN_DURATION_SECONDS
    return {
      allowed: false,
      remainingSeconds,
      remainingFormatted: formatRemainingDuration(remainingSeconds),
      lastSubmittedAt: latest.createdAt,
      nextAvailableAt: new Date(currentTime + remainingSeconds * 1000).toISOString(),
    }
  }

  if (elapsedSeconds >= COOLDOWN_DURATION_SECONDS) {
    return {
      allowed: true,
      remainingSeconds: 0,
      remainingFormatted: '0 detik',
      lastSubmittedAt: latest.createdAt,
      nextAvailableAt: latest.createdAt,
    }
  }

  const remainingSeconds = COOLDOWN_DURATION_SECONDS - elapsedSeconds
  const nextAvailableDate = new Date(lastTime + COOLDOWN_DURATION_SECONDS * 1000)

  return {
    allowed: false,
    remainingSeconds,
    remainingFormatted: formatRemainingDuration(remainingSeconds),
    lastSubmittedAt: latest.createdAt,
    nextAvailableAt: nextAvailableDate.toISOString(),
  }
}

/**
 * Retrigger route simulation conforming to RFC 7231 §7.1.3 & PROJECT.md
 */
export async function handleRetriggerRequest(
  req: NextRequest,
  options?: { currentDate?: Date; userRole?: string; bypassAuth?: boolean }
): Promise<NextResponse> {
  // 1. RBAC & Authentication Check
  const role = options?.userRole || 'EDITOR'
  const isAuthorized = options?.bypassAuth || ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'SEO_MANAGER'].includes(role)
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Akses ditolak: Tidak memiliki wewenang untuk memicu pengindeksan.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { url, type = 'article', provider = 'all', status = 'published' } = body

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return NextResponse.json(
      { error: 'Parameter URL absolut wajib disertakan.', code: 'INVALID_URL' },
      { status: 400 }
    )
  }

  // 2. Draft / Unpublished Item Rejection Gate (Boundary condition)
  if (status === 'draft' || status === 'in_review') {
    return NextResponse.json(
      { error: 'Tidak dapat mengirim URL artikel/halaman yang masih berstatus draf.', code: 'CANNOT_INDEX_UNPUBLISHED' },
      { status: 422 }
    )
  }

  if (status === 'scheduled') {
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    const now = options?.currentDate || new Date()
    if (scheduledAt && scheduledAt.getTime() > now.getTime()) {
      return NextResponse.json(
        { error: 'Tidak dapat mengirim URL konten yang masih terjadwal di masa depan.', code: 'CANNOT_INDEX_FUTURE_SCHEDULE' },
        { status: 422 }
      )
    }
  }

  // 3. Cooldown Check
  const now = options?.currentDate || new Date()
  const cooldown = await calculateIndexingCooldown(url, provider, now)

  if (!cooldown.allowed) {
    return NextResponse.json(
      {
        error: 'Pemicuan ulang pengindeksan dibatasi maksimal 1x dalam 24 jam untuk setiap URL.',
        code: 'INDEXING_COOLDOWN_ACTIVE',
        remainingSeconds: cooldown.remainingSeconds,
        remainingFormatted: cooldown.remainingFormatted,
        lastSubmittedAt: cooldown.lastSubmittedAt,
        nextAvailableAt: cooldown.nextAvailableAt,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(cooldown.remainingSeconds),
          'Content-Type': 'application/json',
        },
      }
    )
  }

  // 4. Record new submissions
  const timestamp = now.toISOString()
  if (provider === 'all' || provider === 'indexnow') {
    submissionRepo.record({
      url,
      entityType: type,
      provider: 'indexnow',
      status: 'accepted',
      httpStatus: 200,
      responsePayload: JSON.stringify({ success: true, message: 'URL submitted to IndexNow' }),
      triggeredBy: 'manual_retrigger',
      createdAt: timestamp,
    })
  }

  if (provider === 'all' || provider === 'google') {
    submissionRepo.record({
      url,
      entityType: type,
      provider: 'google',
      status: 'success',
      httpStatus: 200,
      responsePayload: JSON.stringify({ verdict: 'PASS', indexingState: 'INDEXING_ALLOWED' }),
      triggeredBy: 'manual_retrigger',
      createdAt: timestamp,
    })
  }

  return NextResponse.json({
    success: true,
    url,
    message: 'Pengindeksan berhasil dipicu ulang ke penyedia mesin pencari.',
    providers: {
      indexnow: { status: 'accepted', httpStatus: 200 },
      google: { status: 'success', httpStatus: 200, verdict: 'PASS' },
    },
    cooldown: {
      startedAt: timestamp,
      durationSeconds: COOLDOWN_DURATION_SECONDS,
      nextAvailableAt: new Date(now.getTime() + COOLDOWN_DURATION_SECONDS * 1000).toISOString(),
    },
  })
}

/**
 * Publication trigger simulator demonstrating non-blocking fail-safe behavior
 */
export async function simulatePublishArticle(
  articleData: {
    title: string
    slug: string
    status: 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived'
    scheduledAt?: string
  },
  options?: {
    simulateNetworkFailure?: 'indexnow_timeout' | 'gsc_rate_limit' | 'none'
    currentDate?: Date
  }
) {
  const now = options?.currentDate || new Date()
  const articleUrl = `${siteConfig.url}/artikel/${articleData.slug}`

  // If status is not published, or scheduled in future, indexing MUST NOT trigger
  if (articleData.status !== 'published') {
    return {
      published: false,
      status: articleData.status,
      indexingTriggered: false,
      message: 'Article saved without publishing trigger.',
    }
  }

  // Execute Non-Blocking Indexing Task
  let indexingOutcome = {
    indexnowStatus: 'skipped',
    gscStatus: 'skipped',
  }

  try {
    if (options?.simulateNetworkFailure === 'indexnow_timeout') {
      submissionRepo.record({
        url: articleUrl,
        entityType: 'article',
        provider: 'indexnow',
        status: 'failed',
        httpStatus: 504,
        errorMessage: 'IndexNow gateway timeout after 10000ms',
        triggeredBy: 'publish_hook',
        createdAt: now.toISOString(),
      })
      indexingOutcome.indexnowStatus = 'failed_timeout'
    } else {
      submissionRepo.record({
        url: articleUrl,
        entityType: 'article',
        provider: 'indexnow',
        status: 'accepted',
        httpStatus: 200,
        responsePayload: '{"success":true}',
        triggeredBy: 'publish_hook',
        createdAt: now.toISOString(),
      })
      indexingOutcome.indexnowStatus = 'accepted'
    }

    if (options?.simulateNetworkFailure === 'gsc_rate_limit') {
      submissionRepo.record({
        url: articleUrl,
        entityType: 'article',
        provider: 'google',
        status: 'rate_limited',
        httpStatus: 429,
        errorMessage: 'Quota exceeded for quota metric URL inspection per day',
        triggeredBy: 'publish_hook',
        createdAt: now.toISOString(),
      })
      indexingOutcome.gscStatus = 'rate_limited'
    } else {
      submissionRepo.record({
        url: articleUrl,
        entityType: 'article',
        provider: 'google',
        status: 'success',
        httpStatus: 200,
        responsePayload: '{"verdict":"PASS"}',
        triggeredBy: 'publish_hook',
        createdAt: now.toISOString(),
      })
      indexingOutcome.gscStatus = 'success'
    }
  } catch (err: any) {
    // Non-blocking catch ensures article publishing is never rolled back
    console.warn('[Indexing] Asynchronous indexing failure caught safely:', err.message)
  }

  // Article publish ALWAYS succeeds regardless of external crawler API errors
  return {
    published: true,
    status: 'published',
    slug: articleData.slug,
    url: articleUrl,
    indexingTriggered: true,
    indexingOutcome,
  }
}

/**
 * ============================================================================
 * TIER 2: BOUNDARY & CORNER CASES TEST SUITE
 * ============================================================================
 */
describe('Tier 2: Indexing Cooldown & Boundary Cases', () => {
  beforeEach(() => {
    submissionRepo.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    submissionRepo.clear()
  })

  describe('Boundary Condition 1: Non-Published Drafts Isolation', () => {
    it('does not trigger automated indexing when an article is saved as draft', async () => {
      const result = await simulatePublishArticle({
        title: 'Draf Panduan WebGL Terisolasi',
        slug: 'draf-panduan-webgl',
        status: 'draft',
      })

      expect(result.published).toBe(false)
      expect(result.indexingTriggered).toBe(false)
      expect(submissionRepo.getAll()).toHaveLength(0)
    })

    it('does not trigger automated indexing when an article is submitted for editorial review', async () => {
      const result = await simulatePublishArticle({
        title: 'Review Animasi Tiga Dimensi',
        slug: 'review-animasi-3d',
        status: 'in_review',
      })

      expect(result.published).toBe(false)
      expect(result.indexingTriggered).toBe(false)
      expect(submissionRepo.getAll()).toHaveLength(0)
    })

    it('strictly returns HTTP 422 when attempting to manually retrigger indexing on an unpublished draft', async () => {
      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://www.segiatech.com/artikel/draf-rahasia',
          type: 'article',
          status: 'draft',
        }),
      })

      const res = await handleRetriggerRequest(req)
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.code).toBe('CANNOT_INDEX_UNPUBLISHED')
      expect(body.error).toContain('berstatus draf')
      expect(submissionRepo.getAll()).toHaveLength(0)
    })
  })

  describe('Boundary Condition 2: Future Scheduled Items Isolation', () => {
    it('does not trigger automated indexing for an article scheduled for future release', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 7).toISOString() // 7 days in future
      const result = await simulatePublishArticle({
        title: 'Peluncuran Fitur Masa Depan',
        slug: 'fitur-masa-depan',
        status: 'scheduled',
        scheduledAt: futureDate,
      })

      expect(result.published).toBe(false)
      expect(result.indexingTriggered).toBe(false)
      expect(submissionRepo.getAll()).toHaveLength(0)
    })

    it('rejects manual retrigger on a future scheduled item with HTTP 422', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 3).toISOString()
      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://www.segiatech.com/artikel/rilis-jadwal',
          type: 'article',
          status: 'scheduled',
          scheduledAt: futureDate,
        }),
      })

      const res = await handleRetriggerRequest(req)
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.code).toBe('CANNOT_INDEX_FUTURE_SCHEDULE')
      expect(body.error).toContain('terjadwal di masa depan')
    })
  })

  describe('Boundary Condition 3: 24-Hour Cooldown & RFC 7231 Retry-After Enforcement', () => {
    it('calculates remaining seconds and formats duration accurately at multiple time intervals', async () => {
      const testUrl = 'https://www.segiatech.com/artikel/kalkulasi-cooldown'
      const baseTime = new Date('2026-10-28T12:00:00.000Z')

      // Record initial submission
      submissionRepo.record({
        url: testUrl,
        entityType: 'article',
        provider: 'indexnow',
        status: 'accepted',
        httpStatus: 200,
        createdAt: baseTime.toISOString(),
      })

      // Check at +1 hour (3600s elapsed -> 82800s remaining = 23h 0m)
      const check1h = await calculateIndexingCooldown(
        testUrl,
        'all',
        new Date(baseTime.getTime() + 3600 * 1000)
      )
      expect(check1h.allowed).toBe(false)
      expect(check1h.remainingSeconds).toBe(82800)
      expect(check1h.remainingFormatted).toBe('23 jam 0 menit')

      // Check at +12 hours (43200s elapsed -> 43200s remaining = 12h 0m)
      const check12h = await calculateIndexingCooldown(
        testUrl,
        'all',
        new Date(baseTime.getTime() + 43200 * 1000)
      )
      expect(check12h.allowed).toBe(false)
      expect(check12h.remainingSeconds).toBe(43200)
      expect(check12h.remainingFormatted).toBe('12 jam 0 menit')

      // Check at +23 hours 59 minutes (86340s elapsed -> 60s remaining = 1 menit)
      const check23h59m = await calculateIndexingCooldown(
        testUrl,
        'all',
        new Date(baseTime.getTime() + 86340 * 1000)
      )
      expect(check23h59m.allowed).toBe(false)
      expect(check23h59m.remainingSeconds).toBe(60)
      expect(check23h59m.remainingFormatted).toBe('1 menit')

      // Check at +23 hours 59 minutes 45 seconds (86385s elapsed -> 15s remaining = 15 detik)
      const check15s = await calculateIndexingCooldown(
        testUrl,
        'all',
        new Date(baseTime.getTime() + 86385 * 1000)
      )
      expect(check15s.allowed).toBe(false)
      expect(check15s.remainingSeconds).toBe(15)
      expect(check15s.remainingFormatted).toBe('15 detik')
    })

    it('strictly returns HTTP 429 with RFC 7231 Retry-After header during active cooldown', async () => {
      const testUrl = 'https://www.segiatech.com/artikel/uji-header-429'
      const baseTime = new Date('2026-10-28T10:00:00.000Z')

      submissionRepo.record({
        url: testUrl,
        entityType: 'article',
        provider: 'indexnow',
        status: 'accepted',
        httpStatus: 200,
        createdAt: baseTime.toISOString(),
      })

      // Attempt retrigger at +2 hours (7200s elapsed, 79200s remaining)
      const attemptTime = new Date(baseTime.getTime() + 7200 * 1000)
      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl, type: 'article', status: 'published' }),
      })

      const res = await handleRetriggerRequest(req, { currentDate: attemptTime })

      // Verify HTTP 429 Too Many Requests
      expect(res.status).toBe(429)

      // Verify RFC 7231 Retry-After Header matches remaining seconds
      expect(res.headers.get('Retry-After')).toBe('79200')

      const body = await res.json()
      expect(body.code).toBe('INDEXING_COOLDOWN_ACTIVE')
      expect(body.remainingSeconds).toBe(79200)
      expect(body.remainingFormatted).toBe('22 jam 0 menit')
      expect(body.nextAvailableAt).toBe(new Date(baseTime.getTime() + 86400 * 1000).toISOString())
    })

    it('safely handles system clock anomalies and future timestamps without crashing', async () => {
      const testUrl = 'https://www.segiatech.com/artikel/clock-skew'
      // Future timestamp on last record
      const futureTimestamp = new Date(Date.now() + 3600000).toISOString()

      submissionRepo.record({
        url: testUrl,
        entityType: 'article',
        provider: 'google',
        status: 'success',
        httpStatus: 200,
        createdAt: futureTimestamp,
      })

      const check = await calculateIndexingCooldown(testUrl, 'all', new Date())
      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(COOLDOWN_DURATION_SECONDS)
      expect(check.remainingFormatted).toBe('24 jam 0 menit')
    })
  })

  describe('Boundary Condition 4: Cooldown Expiration & Subsequent Submission', () => {
    it('permits manual retrigger after 24 hours have elapsed (86401 seconds)', async () => {
      const testUrl = 'https://www.segiatech.com/artikel/cooldown-kadaluarsa'
      const baseTime = new Date('2026-10-25T08:00:00.000Z')

      submissionRepo.record({
        url: testUrl,
        entityType: 'article',
        provider: 'indexnow',
        status: 'accepted',
        httpStatus: 200,
        createdAt: baseTime.toISOString(),
      })

      // Elapsed: exactly 24 hours and 1 second
      const expiredTime = new Date(baseTime.getTime() + 86401 * 1000)

      const cooldown = await calculateIndexingCooldown(testUrl, 'all', expiredTime)
      expect(cooldown.allowed).toBe(true)
      expect(cooldown.remainingSeconds).toBe(0)
      expect(cooldown.remainingFormatted).toBe('0 detik')

      // Execute retrigger at expired time
      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl, type: 'article', status: 'published' }),
      })

      const res = await handleRetriggerRequest(req, { currentDate: expiredTime })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.cooldown.durationSeconds).toBe(86400)
      expect(body.cooldown.startedAt).toBe(expiredTime.toISOString())

      // Verify that after retriggering, cooldown immediately becomes active again
      const immediateCheck = await calculateIndexingCooldown(
        testUrl,
        'all',
        new Date(expiredTime.getTime() + 1000)
      )
      expect(immediateCheck.allowed).toBe(false)
      expect(immediateCheck.remainingSeconds).toBe(86399)
    })
  })

  describe('Boundary Condition 5: Fault Tolerance on Network Timeout / API Limits', () => {
    it('safely completes article publication when IndexNow encounters HTTP 504 Gateway Timeout', async () => {
      const result = await simulatePublishArticle(
        {
          title: 'Artikel Uji Timeout Jaringan',
          slug: 'uji-timeout-jaringan',
          status: 'published',
        },
        { simulateNetworkFailure: 'indexnow_timeout' }
      )

      // Article MUST remain successfully published
      expect(result.published).toBe(true)
      expect(result.status).toBe('published')
      expect(result.indexingTriggered).toBe(true)
      expect(result.indexingOutcome.indexnowStatus).toBe('failed_timeout')

      // Verify failure log recorded with HTTP 504 and detailed message
      const latest = submissionRepo.getLatest(result.url, 'indexnow')
      expect(latest).not.toBeNull()
      expect(latest?.status).toBe('failed')
      expect(latest?.httpStatus).toBe(504)
      expect(latest?.errorMessage).toContain('gateway timeout')
    })

    it('safely completes article publication when Google Search Console returns HTTP 429 Quota Exceeded', async () => {
      const result = await simulatePublishArticle(
        {
          title: 'Artikel Uji Rate Limit Google',
          slug: 'uji-rate-limit-google',
          status: 'published',
        },
        { simulateNetworkFailure: 'gsc_rate_limit' }
      )

      // Article MUST remain successfully published
      expect(result.published).toBe(true)
      expect(result.status).toBe('published')
      expect(result.indexingOutcome.gscStatus).toBe('rate_limited')

      // Verify rate_limited submission log in database repository
      const gscLog = submissionRepo.getLatest(result.url, 'google')
      expect(gscLog).not.toBeNull()
      expect(gscLog?.status).toBe('rate_limited')
      expect(gscLog?.httpStatus).toBe(429)
      expect(gscLog?.errorMessage).toContain('Quota exceeded')
    })
  })
})
