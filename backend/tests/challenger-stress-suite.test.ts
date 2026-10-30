import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  checkIndexingCooldown,
  createIndexingCooldownResponse,
  normalizeIndexingUrl,
  formatRemainingDurationIndonesian,
  INDEXING_COOLDOWN_MS,
} from '../src/lib/seo/indexing-rate-limit'

// Hoisted state for mocking Prisma and dependencies in stress test harness
const mockDb = vi.hoisted(() => {
  const records: any[] = []
  let autoId = 1
  return {
    records,
    clear: () => {
      records.length = 0
      autoId = 1
    },
    insert: (data: any) => {
      const rec = {
        id: autoId++,
        url: data.url,
        provider: data.provider || 'indexnow',
        status: data.status || 'accepted',
        submittedAt: data.submittedAt || new Date().toISOString(),
      }
      records.push(rec)
      return rec
    },
    findLatest: (clause: any) => {
      let matched = records.filter((r) => {
        if (clause.url && r.url !== clause.url) return false
        if (clause.provider && r.provider !== clause.provider) return false
        return true
      })
      if (matched.length === 0) return null
      return [...matched].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )[0]
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        IndexingSubmission: {
          create: vi.fn(async (data: any) => mockDb.insert(data)),
          where: (clause: any) => ({
            orderBy: () => ({
              first: vi.fn(async () => mockDb.findLatest(clause)),
            }),
            first: vi.fn(async () => mockDb.findLatest(clause)),
          }),
        },
      },
    },
  },
}))

vi.mock('@/config/site', () => ({
  siteConfig: {
    url: 'https://www.segiatech.com',
  },
}))

describe('EMPIRICAL CHALLENGER SUITE: Cooldown, Evasion & Concurrency Stress Test', () => {
  const T0 = new Date('2026-10-28T12:00:00.000Z').getTime()
  const CANONICAL_URL = 'https://www.segiatech.com/artikel/interactive-3d-aquarium'

  beforeEach(() => {
    mockDb.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockDb.clear()
  })

  /**
   * ==========================================================================
   * 1. BOUNDARY TESTING
   * ==========================================================================
   */
  describe('Dimension 1: Exact Boundary & Timing Mathematics', () => {
    it('B1.1: Verification at T0 (initial state before submission) succeeds immediately', async () => {
      const checkT0 = await checkIndexingCooldown(CANONICAL_URL, 'all', T0)
      expect(checkT0.allowed).toBe(true)
      expect(checkT0.remainingSeconds).toBe(0)
      expect(checkT0.remainingFormatted).toBe('')
      expect(checkT0.lastSubmittedAt).toBeUndefined()
    })

    it('B1.2: Verification at T0 + 10s is blocked with HTTP 429 and Retry-After: 86390', async () => {
      // Record submission at T0
      mockDb.insert({
        url: CANONICAL_URL,
        provider: 'indexnow',
        status: 'accepted',
        submittedAt: new Date(T0).toISOString(),
      })

      // Evaluate at T0 + 10 seconds (10,000 ms elapsed)
      const evaluationTime = T0 + 10_000
      const check = await checkIndexingCooldown(CANONICAL_URL, 'all', evaluationTime)

      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(86390)
      expect(check.remainingFormatted).toBe('23 jam 59 menit 50 detik')

      const response = createIndexingCooldownResponse(check)
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('86390')

      const body = await response.json()
      expect(body.code).toBe('INDEXING_COOLDOWN_ACTIVE')
      expect(body.remainingSeconds).toBe(86390)
      expect(body.nextAvailableAt).toBe(new Date(T0 + INDEXING_COOLDOWN_MS).toISOString())
    })

    it('B1.3: Verification at T0 + 86399s (exactly 1s left) is blocked with HTTP 429 and Retry-After: 1', async () => {
      // Record submission at T0
      mockDb.insert({
        url: CANONICAL_URL,
        provider: 'google',
        status: 'success',
        submittedAt: new Date(T0).toISOString(),
      })

      // Evaluate at T0 + 86,399 seconds (86,399,000 ms elapsed)
      const evaluationTime = T0 + 86399 * 1000
      const check = await checkIndexingCooldown(CANONICAL_URL, 'google', evaluationTime)

      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(1)
      expect(check.remainingFormatted).toBe('0 jam 0 menit 1 detik')

      const response = createIndexingCooldownResponse(check)
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('1')

      const body = await response.json()
      expect(body.code).toBe('INDEXING_COOLDOWN_ACTIVE')
      expect(body.remainingSeconds).toBe(1)
    })

    it('B1.4: Verification at T0 + 86400s (exact boundary) and T0 + 86401s succeeds with HTTP 200 and resets cooldown', async () => {
      mockDb.insert({
        url: CANONICAL_URL,
        provider: 'indexnow',
        status: 'accepted',
        submittedAt: new Date(T0).toISOString(),
      })

      // Evaluate at exact boundary: T0 + 86400s
      const exactBoundary = T0 + 86400 * 1000
      const check86400 = await checkIndexingCooldown(CANONICAL_URL, 'indexnow', exactBoundary)
      expect(check86400.allowed).toBe(true)
      expect(check86400.remainingSeconds).toBe(0)

      // Evaluate at T0 + 86401s (expired by 1s)
      const afterBoundary = T0 + 86401 * 1000
      const check86401 = await checkIndexingCooldown(CANONICAL_URL, 'indexnow', afterBoundary)
      expect(check86401.allowed).toBe(true)
      expect(check86401.remainingSeconds).toBe(0)

      // Retrigger submission at T0 + 86401s resets cooldown
      mockDb.insert({
        url: CANONICAL_URL,
        provider: 'indexnow',
        status: 'accepted',
        submittedAt: new Date(afterBoundary).toISOString(),
      })

      // Re-evaluating 1 second later (T0 + 86402s) must now be in cooldown with 86399s remaining
      const checkReset = await checkIndexingCooldown(CANONICAL_URL, 'indexnow', afterBoundary + 1000)
      expect(checkReset.allowed).toBe(false)
      expect(checkReset.remainingSeconds).toBe(86399)
    })

    it('B1.5: Clock skew / Future submission timestamp is safely clamped', async () => {
      // Future timestamp (clock jumped 1 hour ahead when record was saved)
      const futureTime = T0 + 3600_000
      mockDb.insert({
        url: CANONICAL_URL,
        provider: 'indexnow',
        status: 'accepted',
        submittedAt: new Date(futureTime).toISOString(),
      })

      // Evaluation at current time T0
      const check = await checkIndexingCooldown(CANONICAL_URL, 'all', T0)
      expect(check.allowed).toBe(false)
      // Clamped to max cooldown duration (86400 seconds)
      expect(check.remainingSeconds).toBe(86400)
      expect(check.remainingFormatted).toBe('24 jam 0 menit 0 detik')
    })
  })

  /**
   * ==========================================================================
   * 2. NORMALIZATION EVASION STRESS TEST
   * ==========================================================================
   */
  describe('Dimension 2: Normalization Evasion Resistance', () => {
    beforeEach(() => {
      // Baseline submission exists for canonical URL at T0
      mockDb.insert({
        url: CANONICAL_URL,
        provider: 'indexnow',
        status: 'accepted',
        submittedAt: new Date(T0).toISOString(),
      })
    })

    const evaluationTime = T0 + 10_000 // 10s after T0 -> must be blocked if normalized properly

    it('E2.1: Trailing slash variation does NOT bypass cooldown', async () => {
      const slashVariant = 'https://www.segiatech.com/artikel/interactive-3d-aquarium/'
      const check = await checkIndexingCooldown(slashVariant, 'indexnow', evaluationTime)
      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(86390)
    })

    it('E2.2: Query parameters variation does NOT bypass cooldown', async () => {
      const queryVariant = 'https://www.segiatech.com/artikel/interactive-3d-aquarium?utm_source=facebook&fbclid=IwAR0xyz'
      const check = await checkIndexingCooldown(queryVariant, 'indexnow', evaluationTime)
      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(86390)
    })

    it('E2.3: Hash anchor variation does NOT bypass cooldown', async () => {
      const hashVariant = 'https://www.segiatech.com/artikel/interactive-3d-aquarium#comments-section'
      const check = await checkIndexingCooldown(hashVariant, 'indexnow', evaluationTime)
      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(86390)
    })

    it('E2.4: Relative path variations do NOT bypass cooldown', async () => {
      const rel1 = '/artikel/interactive-3d-aquarium'
      const rel2 = 'artikel/interactive-3d-aquarium'
      const rel3 = '//www.segiatech.com/artikel/interactive-3d-aquarium'

      const check1 = await checkIndexingCooldown(rel1, 'indexnow', evaluationTime)
      expect(check1.allowed).toBe(false)
      expect(check1.remainingSeconds).toBe(86390)

      const check2 = await checkIndexingCooldown(rel2, 'indexnow', evaluationTime)
      expect(check2.allowed).toBe(false)
      expect(check2.remainingSeconds).toBe(86390)

      const check3 = await checkIndexingCooldown(rel3, 'indexnow', evaluationTime)
      expect(check3.allowed).toBe(false)
      expect(check3.remainingSeconds).toBe(86390)
    })

    it('E2.5: Redundant slashes variation does NOT bypass cooldown', async () => {
      const redundantSlashes = 'https://www.segiatech.com//artikel///interactive-3d-aquarium'
      const check = await checkIndexingCooldown(redundantSlashes, 'indexnow', evaluationTime)
      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(86390)
    })

    it('E2.6: Uppercase hostname variation does NOT bypass cooldown', async () => {
      const uppercaseHost = 'HTTPS://WWW.SEGIATECH.COM/artikel/interactive-3d-aquarium'
      const check = await checkIndexingCooldown(uppercaseHost, 'indexnow', evaluationTime)
      expect(check.allowed).toBe(false)
      expect(check.remainingSeconds).toBe(86390)
    })

    /**
     * VULNERABILITY PROBE: Path Case Sensitivity Evasion
     * Attack hypothesis: If path case is not normalized to lowercase,
     * an attacker can bypass the 24-hour rate limit by capitalizing letters in the slug or subpath.
     */
    it('E2.7 [ADVERSARIAL CHALLENGE]: Varying path case MUST NOT bypass cooldown', async () => {
      const variations = [
        'https://www.segiatech.com/Artikel/interactive-3d-aquarium',
        'https://www.segiatech.com/ARTIKEL/interactive-3d-aquarium',
        'https://www.segiatech.com/artikel/Interactive-3D-Aquarium',
        'https://www.segiatech.com/artikel/INTERACTIVE-3D-AQUARIUM',
        '/Artikel/interactive-3d-aquarium',
        '/artikel/Interactive-3d-aquarium',
      ]

      for (const variant of variations) {
        const check = await checkIndexingCooldown(variant, 'indexnow', evaluationTime)
        // If the vulnerability exists, check.allowed will be true!
        // We assert that it MUST be blocked (allowed: false).
        expect(
          check.allowed,
          `VULNERABILITY DETECTED: Path case variation "${variant}" bypassed the 24-hour cooldown!`
        ).toBe(false)
      }
    })
  })

  /**
   * ==========================================================================
   * 3. CONCURRENCY & RACE CONDITION TEST
   * ==========================================================================
   */
  describe('Dimension 3: Concurrency & TOCTOU Race Condition', () => {
    it('C3.1: Sequential evaluations correctly enforce cooldown', async () => {
      // Sequential evaluation: Call 1 -> records -> Call 2 -> blocked
      const check1 = await checkIndexingCooldown(CANONICAL_URL, 'all', T0)
      expect(check1.allowed).toBe(true)

      mockDb.insert({
        url: CANONICAL_URL,
        provider: 'indexnow',
        status: 'accepted',
        submittedAt: new Date(T0).toISOString(),
      })

      const check2 = await checkIndexingCooldown(CANONICAL_URL, 'all', T0 + 100)
      expect(check2.allowed).toBe(false)
    })

    it('C3.2 [ADVERSARIAL CHALLENGE]: High-concurrency simultaneous retrigger requests', async () => {
      // Simulate 10 simultaneous incoming retrigger requests hitting the check before any write completes
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        requestId: i + 1,
        url: CANONICAL_URL,
      }))

      // In an unprotected TOCTOU architecture where checking and writing are not atomic:
      const results = await Promise.all(
        concurrentRequests.map(async (req) => {
          // Check cooldown
          const cooldown = await checkIndexingCooldown(req.url, 'all', T0)
          if (cooldown.allowed) {
            // Simulating 5ms async I/O before write
            await new Promise((r) => setTimeout(r, 5))
            mockDb.insert({
              url: req.url,
              provider: 'indexnow',
              status: 'accepted',
              submittedAt: new Date(T0).toISOString(),
            })
            return { id: req.requestId, status: 'dispatched' }
          }
          return { id: req.requestId, status: 'blocked_429' }
        })
      )

      const dispatched = results.filter((r) => r.status === 'dispatched')
      const blocked = results.filter((r) => r.status === 'blocked_429')

      console.log(`[Concurrency Probe] Dispatched: ${dispatched.length}, Blocked: ${blocked.length}`)

      // If the race condition exists without concurrency gating/locking, all 10 will be dispatched!
      // In an ideal rate-limited system, EXACTLY 1 should be dispatched and 9 should be blocked!
      expect(
        dispatched.length,
        `RACE CONDITION DETECTED: ${dispatched.length} concurrent requests were dispatched simultaneously instead of 1!`
      ).toBe(1)
      expect(blocked.length).toBe(9)
    })
  })
})
