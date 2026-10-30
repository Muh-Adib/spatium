import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockCallLlm } = vi.hoisted(() => ({
  mockCallLlm: vi.fn(),
}))

vi.mock('@/lib/agent/llm', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    callLlm: (...args: any[]) => mockCallLlm(...args),
  }
})

vi.mock('@/lib/auth/rbac', () => ({
  requireUser: async () => ({
    user: {
      id: 'usr_test_m3',
      name: 'Studio Test User',
      email: 'studio@segiatech.com',
      role: 'SUPER_ADMIN',
      authenticated: true,
      source: 'session_token',
    },
    error: null,
  }),
}))

vi.mock('@/lib/ai/sessions', () => ({
  getAiSessionById: vi.fn().mockResolvedValue({
    id: 'sess_quota_123',
    title: 'Sesi Uji Kuota & Streaming',
    model: 'gemini-2.5-flash',
    summary: 'Ringkasan sesi pengujian',
  }),
  createAiSession: vi.fn().mockResolvedValue({
    id: 'sess_quota_123',
    title: 'Sesi Uji Kuota & Streaming',
    model: 'gemini-2.5-flash',
  }),
  appendSessionMessage: vi.fn().mockResolvedValue({ id: 'msg_123' }),
  getUserAiMemories: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        Article: {
          aggregate: vi.fn().mockResolvedValue({ count: 12 }),
        },
      },
    },
  },
}))

vi.mock('@/lib/content/queries', () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    siteName: 'SegiaTech',
    siteTagline: 'Creative Technology Platform',
  }),
}))

import { classifyAiError } from '@/lib/agent/llm'
import { handleAiAssistantChat } from '@/lib/ai/chat'
import { POST } from '../src/app/api/ai/chat/route'

describe('Milestone 3: Quota Classification, Failover Termination & Live NDJSON Streaming', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // Test 1: Centralized AI Error Classification (classifyAiError)
  // =========================================================================
  describe('Test 1: Centralized AI Error Classification (classifyAiError)', () => {
    it('accurately detects Google Gemini 429 Quota Exceeded with Limit 0 and RPC QuotaFailure details', () => {
      const googleQuotaError = {
        status: 429,
        error: {
          code: 429,
          message: 'Resource has been exhausted (e.g. check quota).',
          status: 'RESOURCE_EXHAUSTED',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
              violations: [
                {
                  description:
                    "Quota exceeded for quota metric 'Generate Content API requests' and limit 'Generate Content API requests per day' of service 'generativelanguage.googleapis.com' for consumer 'project_number:123456789'. Limit 0.",
                },
              ],
            },
          ],
        },
      }

      const res = classifyAiError(googleQuotaError, 'google', 'gemini-2.5-flash')

      expect(res.isQuotaOrRateLimit).toBe(true)
      expect(res.isQuotaExceeded).toBe(true)
      expect(res.isRateLimited).toBe(true)
      expect(res.isLimitZero).toBe(true)
      expect(res.status).toBe(429)
      expect(res.code).toBe('RESOURCE_EXHAUSTED')
      expect(res.message).toContain('Limit 0')
      expect(res.provider).toBe('google')
      expect(res.model).toBe('gemini-2.5-flash')
    })

    it('accurately detects OpenRouter HTTP 429 Rate Limit error string', () => {
      const openRouterRateLimitErr = new Error(
        'OpenRouter Transient Error (429): Rate limit exceeded. Please wait 10s.'
      )

      const res = classifyAiError(openRouterRateLimitErr, 'openrouter', 'meta-llama/llama-3.3-70b-instruct:free')

      expect(res.isQuotaOrRateLimit).toBe(true)
      expect(res.isRateLimited).toBe(true)
      expect(res.isLimitZero).toBe(false)
      expect(res.status).toBe(429)
      expect(res.provider).toBe('openrouter')
      expect(res.model).toBe('meta-llama/llama-3.3-70b-instruct:free')
    })

    it('accurately detects OpenRouter HTTP 402 Credits Exhausted error', () => {
      const openRouter402Err = {
        status: 402,
        code: 'insufficient_quota',
        message: 'OpenRouter Error: HTTP 402: Credits exhausted. Please add balance to continue.',
      }

      const res = classifyAiError(openRouter402Err, 'openrouter', 'anthropic/claude-3.5-sonnet')

      expect(res.isQuotaOrRateLimit).toBe(true)
      expect(res.isQuotaExceeded).toBe(true)
      expect(res.isRateLimited).toBe(false)
      expect(res.isLimitZero).toBe(false)
      expect(res.status).toBe(402)
      expect(res.code).toBe('insufficient_quota')
    })

    it('does NOT flag ordinary non-quota errors (404 Not Found, 400 Bad Request, Network Errors)', () => {
      const notFoundErr = new Error('Google Gemini Error (404 Not Found): Model "gemini-unknown" tidak ditemukan')
      const res404 = classifyAiError(notFoundErr, 'google', 'gemini-unknown')
      expect(res404.isQuotaOrRateLimit).toBe(false)
      expect(res404.isQuotaExceeded).toBe(false)
      expect(res404.isRateLimited).toBe(false)
      expect(res404.isLimitZero).toBe(false)

      const netErr = new Error('ECONNRESET: Socket closed unexpectedly')
      const resNet = classifyAiError(netErr, 'google', 'gemini-2.5-flash')
      expect(resNet.isQuotaOrRateLimit).toBe(false)
      expect(resNet.isQuotaExceeded).toBe(false)
      expect(resNet.isRateLimited).toBe(false)
    })
  })

  // =========================================================================
  // Test 2: Immediate Failover Termination in handleAiAssistantChat
  // =========================================================================
  describe('Test 2: Immediate Failover Termination on Quota / 429 Errors', () => {
    it('halts immediately on 429 Quota Exceeded error on candidate 1 without attempting subsequent candidates', async () => {
      // Candidate 1 fails with Google Quota Exceeded (Limit 0)
      mockCallLlm.mockRejectedValueOnce(
        new Error(
          "Google API Quota Error (429): Resource has been exhausted (e.g. check quota). (Quota exceeded for quota metric 'Generate Content API requests' and limit 'Generate Content API requests per day'. Limit 0.)"
        )
      )

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'Cek performa website dan buat draf artikel' }],
        { currentTab: 'overview', role: 'SUPER_ADMIN' },
        {
          provider: 'google',
          model: 'gemini-2.5-flash',
          apiKey: 'fake-goog-key',
          fallbackModels: [
            { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free', apiKey: 'fake-or-key-1' },
            { provider: 'openrouter', model: 'nvidia/nemotron-3.5-lightning:free', apiKey: 'fake-or-key-2' },
          ],
        }
      )

      // Invariant: mockCallLlm must only be called ONCE (candidate 1). Subsequent candidates must NOT be attempted!
      expect(mockCallLlm).toHaveBeenCalledTimes(1)

      // Structured failure contract
      expect(response.failoverHalted).toBe(true)
      expect(response.errorType).toBe('QUOTA_EXCEEDED')
      expect(response.quotaError?.isQuotaOrRateLimit).toBe(true)
      expect(response.quotaError?.isLimitZero).toBe(true)
      expect(response.failoverHistory).toHaveLength(1)
      expect(response.failoverHistory?.[0].model).toBe('gemini-2.5-flash')
      expect(response.failoverHistory?.[0].provider).toBe('google')
      expect(response.reply).toContain('Batas Kuota / Rate Limit Tercapai')
      expect(response.reply).toContain('gemini-2.5-flash')
      expect(response.meta?.failoverHalted).toBe(true)
      expect(response.proposedChanges).toBeNull()
    })

    it('halts immediately on 429 Rate Limit error from OpenRouter and stops cascade', async () => {
      mockCallLlm.mockRejectedValueOnce(
        new Error('OpenRouter Transient Error (429): Rate limit exceeded. Too many requests in 60s.')
      )

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'Analisis kata kunci SEO' }],
        { currentTab: 'overview', role: 'SUPER_ADMIN' },
        {
          provider: 'openrouter',
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          apiKey: 'fake-or-key',
          fallbackModels: [
            { provider: 'google', model: 'gemini-2.0-flash', apiKey: 'fake-goog-key' },
          ],
        }
      )

      // Verified: Halts at candidate 1
      expect(mockCallLlm).toHaveBeenCalledTimes(1)
      expect(response.failoverHalted).toBe(true)
      expect(response.errorType).toBe('RATE_LIMITED')
      expect(response.quotaError?.isRateLimited).toBe(true)
      expect(response.failoverHistory).toHaveLength(1)
      expect(response.reply).toContain('Batas Kuota / Rate Limit Tercapai')
    })
  })

  // =========================================================================
  // Test 3: NDJSON Live Streaming Route Support (/api/ai/chat)
  // =========================================================================
  describe('Test 3: NDJSON Live Streaming Route Support (/api/ai/chat)', () => {
    it('returns Content-Type application/x-ndjson and streams sequential NDJSON event lines when stream: true', async () => {
      mockCallLlm.mockResolvedValueOnce({
        reply: 'Halo! Ini adalah respons streaming langsung dari Studio AI Copilot.',
        thoughts: 'Menganalisis kebutuhan konten pengguna...',
        durationMs: 95,
        provider: 'google',
        model: 'gemini-2.5-flash',
      })

      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-ndjson',
        },
        body: JSON.stringify({
          stream: true,
          model: 'gemini-2.5-flash',
          messages: [{ role: 'user', content: 'Halo Copilot, jelaskan arsitektur web modern' }],
          context: { currentTab: 'overview' },
          aiConfig: { provider: 'google', apiKey: 'fake-test-key' },
        }),
      })

      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('application/x-ndjson')

      // Read streamed body chunks
      const reader = res.body?.getReader()
      expect(reader).toBeDefined()

      const decoder = new TextDecoder()
      let fullStreamText = ''

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        fullStreamText += decoder.decode(value, { stream: true })
      }

      const lines = fullStreamText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)

      expect(lines.length).toBeGreaterThanOrEqual(2)

      const events = lines.map((l) => JSON.parse(l))
      const eventTypes = events.map((e) => e.type)

      // Verify essential NDJSON event types
      expect(eventTypes).toContain('status')
      expect(eventTypes).toContain('done')

      const doneEvent = events.find((e) => e.type === 'done')
      expect(doneEvent.reply).toContain('Halo! Ini adalah respons streaming')
    })

    it('emits error NDJSON event when candidate encounters quota exhaustion during stream', async () => {
      mockCallLlm.mockRejectedValueOnce(
        new Error('Google API Quota Error (429): Resource has been exhausted. Limit 0.')
      )

      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream: true,
          model: 'gemini-2.5-flash',
          messages: [{ role: 'user', content: 'Tulis artikel baru' }],
          aiConfig: { provider: 'google', apiKey: 'exhausted-key' },
        }),
      })

      const res = await POST(req)
      expect(res.headers.get('content-type')).toContain('application/x-ndjson')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
      }

      const lines = fullText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)

      const events = lines.map((l) => JSON.parse(l))
      const errorEvent = events.find((e) => e.type === 'error')

      expect(errorEvent).toBeDefined()
      expect(errorEvent.errorType).toBe('QUOTA_EXCEEDED')
      expect(errorEvent.quotaError?.isLimitZero).toBe(true)

      const doneEvent = events.find((e) => e.type === 'done')
      expect(doneEvent).toBeDefined()
      expect(doneEvent.reply).toContain('Batas Kuota / Rate Limit Tercapai')
    })

    it('preserves backward compatibility with synchronous JSON response when stream is false', async () => {
      mockCallLlm.mockResolvedValueOnce({
        reply: 'Respons JSON standar tanpa streaming.',
        durationMs: 50,
        provider: 'google',
        model: 'gemini-2.5-flash',
      })

      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream: false,
          model: 'gemini-2.5-flash',
          messages: [{ role: 'user', content: 'Pertanyaan biasa' }],
          aiConfig: { provider: 'google', apiKey: 'test-key' },
        }),
      })

      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('application/json')

      const data = await res.json()
      expect(data.reply).toBe('Respons JSON standar tanpa streaming.')
      expect(data.sessionId).toBe('sess_quota_123')
    })
  })
})

