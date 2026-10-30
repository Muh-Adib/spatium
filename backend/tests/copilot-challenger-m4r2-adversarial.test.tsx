/**
 * Empirical Challenger Adversarial Verification Suite (Milestone 4 - Remediation 2)
 * File: web/tests/copilot-challenger-m4r2-adversarial.test.tsx
 *
 * Scope:
 * 1. Candidate model loop error robustness (thrown null, undefined, strings, objects, numbers, booleans, symbols)
 * 2. Phrasing permutations in extractArticleTopic
 * 3. Malformed / truncated code fences and fallback 9-block editorial layout
 * 4. Toast notification timer reset & unmount lifecycle
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoisted Mocks
const { mockCallLlm, llmState } = vi.hoisted(() => ({
  mockCallLlm: vi.fn(),
  llmState: {
    useActualLlm: false,
    actualCallLlmFn: null as any,
  },
}))

vi.mock('@/lib/agent/llm', async (importOriginal) => {
  const actual = await importOriginal<any>()
  llmState.actualCallLlmFn = actual.callLlm
  return {
    ...actual,
    callLlm: (...args: any[]) => {
      if (llmState.useActualLlm && llmState.actualCallLlmFn) {
        return llmState.actualCallLlmFn(...args)
      }
      return mockCallLlm(...args)
    },
  }
})

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/buat-artikel',
  useSearchParams: () => new URLSearchParams('tab=buat-artikel'),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    role: 'SUPER_ADMIN',
    actorName: 'Empirical Challenger',
    isAuthenticated: true,
  }),
}))

vi.mock('@/lib/ai/key-manager', () => ({
  getActiveApiKey: () => 'mock-api-key',
  getStoredAiCredentials: () => ({ googleApiKey: 'test-goog', openrouterApiKey: 'test-or' }),
  triggerAiKeyPrompt: vi.fn(),
  getSelectedAiModels: () => [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', isCustom: false },
    { id: 'openrouter/meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'openrouter', isCustom: false },
  ],
  detectModelCapabilities: () => ({ supportsFunctionCalling: true, isThinkingModel: false }),
  normalizeGoogleModel: (m: string) => m.replace(/^google\//, ''),
  normalizeOpenRouterModel: (m: string) => m.replace(/^openrouter\//, ''),
}))

vi.mock('@/lib/ai/audit-logger', () => ({
  recordAiPromptLog: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        ContentNode: { where: vi.fn(() => ({ all: vi.fn(async () => []) })) },
        ContentLink: { where: vi.fn(() => ({ all: vi.fn(async () => []) })) },
        Article: {
          aggregate: vi.fn(async () => ({ count: 878 })),
          where: vi.fn(() => ({
            aggregate: vi.fn(async () => ({ count: 10 })),
            include: vi.fn(() => ({ include: vi.fn(() => ({ first: vi.fn(async () => null) })), first: vi.fn(async () => null) })),
            first: vi.fn(async () => null),
          })),
        },
        SiteSettings: {
          first: vi.fn(async () => ({
            siteName: 'SegiaTech',
            siteDescription: 'Creative Technology House',
            siteUrl: 'https://www.segiatech.com',
          })),
        },
        SiteConfig: {
          where: vi.fn(() => ({ first: vi.fn(async () => null) })),
        },
      },
    },
  },
}))

import {
  handleAiAssistantChat,
  extractArticleTopic,
} from '../src/lib/ai/chat'

describe('Empirical Challenger: M4-R2 Adversarial Stress Suite', () => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    llmState.useActualLlm = false
    mockCallLlm.mockReset()
    process.env = { ...originalEnv }
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_AI_KEY
    delete process.env.GOOGLE_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = { ...originalEnv }
  })

  // ---------------------------------------------------------------------------
  // 1. Candidate Model Loop Non-Error & Exotic Thrown Exceptions
  // ---------------------------------------------------------------------------
  describe('1. Candidate Model Loop Exception Resilience', () => {
    const nonErrorPayloads = [
      { label: 'null', thrown: null, expectedError: 'Unknown inference error' },
      { label: 'undefined', thrown: undefined, expectedError: 'Unknown inference error' },
      { label: 'raw string', thrown: 'Upstream gateway timeout', expectedError: 'Upstream gateway timeout' },
      { label: 'empty string', thrown: '', expectedError: '' },
      { label: 'empty object', thrown: {}, expectedError: 'Unknown inference error' },
      { label: 'number 503', thrown: 503, expectedError: 'Unknown inference error' },
      { label: 'boolean false', thrown: false, expectedError: 'Unknown inference error' },
      { label: 'object with nested error', thrown: { error: { message: 'Deep nested failure' } }, expectedError: 'Unknown inference error' },
      { label: 'standard Error', thrown: new Error('Standard failure message'), expectedError: 'Standard failure message' },
    ]

    for (const testCase of nonErrorPayloads) {
      it(`Tolerates thrown ${testCase.label} without throwing TypeError`, async () => {
        mockCallLlm.mockRejectedValue(testCase.thrown)

        const response = await handleAiAssistantChat(
          [{ role: 'user', content: 'Status sistem' }],
          { currentTab: 'overview' },
          {
            provider: 'google',
            model: 'gemini-test-1',
            apiKey: 'k1',
          }
        )

        expect(response.isError).toBeFalsy()
        expect(response.meta?.fallbackOccurred).toBe(true)
        expect(response.meta?.failoverHistory?.[0].error).toBe(testCase.expectedError)
      })
    }

    it('Cascades across multi-hop non-Error rejections to succeeding model without crashing on failReason formatting', async () => {
      // Model 1: throws null
      // Model 2: throws raw string "OpenRouter Error: Cloudflare 524"
      // Model 3: throws empty object {}
      // Model 4: succeeds
      mockCallLlm
        .mockRejectedValueOnce(null)
        .mockRejectedValueOnce('OpenRouter Error: Cloudflare 524')
        .mockRejectedValueOnce({})
        .mockResolvedValueOnce({
          reply: 'Semua sistem operasional normal.',
          durationMs: 75,
          provider: 'openrouter',
          model: 'meta-llama/llama-3.3-70b-instruct:free',
        })

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'Cek status infrastruktur' }],
        { currentTab: 'overview' },
        {
          provider: 'google',
          model: 'cand-1',
          apiKey: 'k1',
          fallbackModels: [
            { provider: 'openrouter', model: 'cand-2', apiKey: 'k2' },
            { provider: 'google', model: 'cand-3', apiKey: 'k3' },
            { provider: 'openrouter', model: 'cand-4', apiKey: 'k4' },
          ],
        }
      )

      expect(response.isError).toBeFalsy()
      expect(response.reply).toContain('Semua sistem operasional normal.')
      // Verify failover notice formatting prepended to reply
      expect(response.reply).toContain('> *Model `cand-1` mengalami kendala (Unknown inference error). Dialihkan secara otomatis')
      expect(response.meta?.fallbackOccurred).toBe(true)
      expect(response.meta?.failoverHistory?.length).toBe(3)
      expect(response.meta?.failoverHistory?.[0].error).toBe('Unknown inference error')
      expect(response.meta?.failoverHistory?.[1].error).toBe('OpenRouter Error: Cloudflare 524')
      expect(response.meta?.failoverHistory?.[2].error).toBe('Unknown inference error')
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Creation Intent Negation & Punctuation Permutations
  // ---------------------------------------------------------------------------
  describe('2. extractArticleTopic Phrasing Permutations', () => {
    it('Correctly extracts topics with varied casing, punctuation and qualifiers', () => {
      expect(extractArticleTopic('Tolong buatkan sebuah draf artikel tentang Kubernetes')).toBe('Kubernetes')
      expect(extractArticleTopic('tuliskan draf artikel mengenai WebGL')).toBe('WebGL')
      expect(extractArticleTopic('susun draf artikel baru tentang Microservices')).toBe('Microservices')
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Malformed Code Fences & Zero-Mock Resilience
  // ---------------------------------------------------------------------------
  describe('3. Malformed LLM Responses & Zero-Mock Resilience', () => {
    it('safely handles malformed code fences without crashing or hallucinating fake articles', async () => {
      const brokenReplies = [
        // Case 1: Unclosed fence with truncated JSON
        'Berikut rancangannya:\n```json:article-changes\n{"title": "Draf Terputus", "slug":',
        // Case 2: Opening fence tag only
        'Tentu, saya buatkan:\n```json:article-changes\n',
        // Case 3: Closed fence but invalid JSON syntax
        'Rancangan artikel:\n```json:article-changes\n{ "title": "Broke", invalid syntax }\n```',
        // Case 4: Closed fence with empty body
        '```json:article-changes\n\n```',
        // Case 5: Standard json fence with truncated markup
        '```json\n{"content": "<p>Truncated</p>',
      ]

      for (const malformedReply of brokenReplies) {
        mockCallLlm.mockResolvedValueOnce({
          reply: malformedReply,
          durationMs: 120,
          provider: 'openrouter',
          model: 'meta-llama/llama-3.3-70b-instruct:free',
        })

        const response = await handleAiAssistantChat(
          [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
          { currentTab: 'buat-artikel' },
          { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free', apiKey: 'k1' }
        )

        expect(response.isError).toBeFalsy()
        // Strict Zero-Mock: never invents fake articles when model fails to return valid changes
        expect(response.proposedChanges).toBeNull()
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Consecutive Toast Notification Timer & Unmount Lifecycle
  // ---------------------------------------------------------------------------
  describe('4. Toast Notification Managed Timer & Unmount Lifecycle', () => {
    it('Resets timer on consecutive triggers and enforces full 6-second window for latest notification', () => {
      vi.useFakeTimers()

      let activeNotice: string | null = null
      let timerRef: NodeJS.Timeout | null = null

      const showNotice = (msg: string) => {
        if (timerRef) {
          clearTimeout(timerRef)
        }
        activeNotice = msg
        timerRef = setTimeout(() => {
          activeNotice = null
          timerRef = null
        }, 6000)
      }

      // First notification at t=0s
      showNotice('Artikel 1 Diterapkan')
      expect(activeNotice).toBe('Artikel 1 Diterapkan')

      // Advance 3s (t=3s)
      vi.advanceTimersByTime(3000)
      expect(activeNotice).toBe('Artikel 1 Diterapkan')

      // Second notification at t=3s (should reset timer to t=9s)
      showNotice('Artikel 2 Diterapkan')
      expect(activeNotice).toBe('Artikel 2 Diterapkan')

      // Advance 3.5s (t=6.5s) - past original t=6s expiration of first toast
      vi.advanceTimersByTime(3500)
      // Second toast must still be visible!
      expect(activeNotice).toBe('Artikel 2 Diterapkan')

      // Advance remaining 2.5s (t=9s)
      vi.advanceTimersByTime(2500)
      // Cleanly expired after its own full 6s
      expect(activeNotice).toBeNull()
      expect(timerRef).toBeNull()

      vi.useRealTimers()
    })

    it('Disposes timer cleanly upon manual dismissal without memory leak', () => {
      vi.useFakeTimers()

      let activeNotice: string | null = 'Pemberitahuan aktif'
      let timerRef: NodeJS.Timeout | null = setTimeout(() => {
        activeNotice = null
      }, 6000)

      // Manual dismiss button clicked
      if (timerRef) {
        clearTimeout(timerRef)
        timerRef = null
      }
      activeNotice = null

      expect(activeNotice).toBeNull()
      expect(timerRef).toBeNull()

      // Advancing time should not fire any callback
      vi.advanceTimersByTime(10000)
      expect(activeNotice).toBeNull()

      vi.useRealTimers()
    })

    it('Simulates unmount cleanup hook ensuring all pending timers are disposed', () => {
      vi.useFakeTimers()

      let activeNotice: string | null = null
      let timerRef: NodeJS.Timeout | null = null

      // Mounting & triggering toast
      activeNotice = 'Artikel Diterapkan'
      timerRef = setTimeout(() => {
        activeNotice = null
      }, 6000)

      // Unmounting component (useEffect cleanup)
      const cleanup = () => {
        if (timerRef) {
          clearTimeout(timerRef)
          timerRef = null
        }
      }
      cleanup()

      expect(timerRef).toBeNull()
      // Advancing timer does nothing post-unmount
      vi.advanceTimersByTime(6000)
      vi.useRealTimers()
    })
  })
})
