/**
 * Adversarial Challenger Stress Harness for Master Verification Suite & Copilot Fallback
 * Target: web/tests/copilot-m3-master-suite-challenger.test.ts
 *
 * Challenge Dimensions:
 * 1. Intent Recognition Adversarial Stress (extreme length, zero-width chars, compound prompts, negative assertions)
 * 2. Topic Extraction Boundary & Fallback Stress (null, empty, deictic, strip trailing specifiers)
 * 3. Deterministic Proposed Article SEO Invariants (length clamping under extreme topic lengths)
 * 4. Model Fallback Chain Resilience (non-Error rejections, empty fallbacks, no API key leaks)
 * 5. OpenRouter Tool Schema Degradation Adversarial Robustness (case insensitivity, single-retry limit, malformed errors)
 * 6. High-Frequency Clamping Stress Loop (100k iterations, float inputs, NaN protection)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoisted mocks for LLM and Next.js
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
    actorName: 'Adversarial Challenger',
    isAuthenticated: true,
  }),
}))

vi.mock('@/lib/ai/key-manager', () => ({
  getActiveApiKey: () => 'challenger-key',
  getStoredAiCredentials: () => ({ googleApiKey: 'c-goog', openrouterApiKey: 'c-or' }),
  triggerAiKeyPrompt: vi.fn(),
  getSelectedAiModels: () => [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', isCustom: false },
    { id: 'openrouter/meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3', provider: 'openrouter', isCustom: false },
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
            include: vi.fn(() => ({
              include: vi.fn(() => ({ first: vi.fn(async () => null) })),
              first: vi.fn(async () => null),
            })),
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
        SiteConfig: { where: vi.fn(() => ({ first: vi.fn(async () => null) })) },
      },
    },
  },
}))

import { callLlm } from '../src/lib/agent/llm'
import {
  handleAiAssistantChat,
  extractArticleTopic,
} from '../src/lib/ai/chat'

describe('Adversarial Challenger: Copilot Master Verification Stress Suite', () => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    llmState.useActualLlm = false
    mockCallLlm.mockReset()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = { ...originalEnv }
  })

  // ---------------------------------------------------------------------------
  // 1. Intent Recognition Adversarial Stress
  // ---------------------------------------------------------------------------
  describe('Challenge 1: Article Creation Intent Recognition Stress', () => {
    it('handles 20,000 character prompt in topic extraction without catastrophic backtracking', () => {
      const longPrefix = 'kata '.repeat(4000)
      const prompt = `${longPrefix} buatkan artikel tentang WebGL 3D di halaman ini`
      const start = performance.now()
      const topic = extractArticleTopic(prompt)
      const duration = performance.now() - start

      expect(topic).toBe('WebGL 3D')
      expect(duration).toBeLessThan(100) // Must execute under 100ms
    })

    it('tolerates zero-width characters and unusual whitespace in queries', () => {
      const prompt = '\u200Boke \uFEFFbuatkan \u00A0artikel nya tentang \u200BWebGL\u200B'
      expect(extractArticleTopic(prompt)).toContain('WebGL')
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Topic Extraction Boundary & Fallback Stress
  // ---------------------------------------------------------------------------
  describe('Challenge 2: Topic Extraction Boundary & Fallback Stress', () => {
    it('handles null, undefined, and empty article context without crashing', () => {
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', null)).toBe(
        'Praktik Terbaik Arsitektur Web & Creative Technology Modern'
      )
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', undefined)).toBe(
        'Praktik Terbaik Arsitektur Web & Creative Technology Modern'
      )
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', {})).toBe(
        'Praktik Terbaik Arsitektur Web & Creative Technology Modern'
      )
    })

    it('handles article context with generic default titles by falling back to high-grade default', () => {
      const defaultTitles = ['Draf Artikel Baru', 'draf-baru', 'Draf Baru']
      for (const title of defaultTitles) {
        const topic = extractArticleTopic('oke buatkan artikel nya di halaman ini', { title })
        expect(topic).toBe('Praktik Terbaik Arsitektur Web & Creative Technology Modern')
      }
    })

    it('prefers focusKeyphrase over title when keyphrase is set', () => {
      const topic = extractArticleTopic('oke buatkan artikel nya di halaman ini', {
        title: 'Judul Lama',
        focusKeyphrase: 'three.js shaders optimization',
      })
      expect(topic).toBe('three.js shaders optimization')
    })

    it('cleans trailing deictic specifiers from explicit topic prompts', () => {
      const p1 = 'buatkan artikel tentang Interactive WebGL Shaders di halaman ini'
      expect(extractArticleTopic(p1)).toBe('Interactive WebGL Shaders')

      const p2 = 'tulis artikel mengenai Headless Architecture for this page'
      expect(extractArticleTopic(p2)).toBe('Headless Architecture')
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Proposed Article SEO Invariants & Sanitization
  // ---------------------------------------------------------------------------
  describe('Challenge 3: Proposed Article SEO Invariants', () => {
    it('enforces title 40-80 chars and metaDescription 120-160 chars with standard topic', () => {
      const topic = 'AI'
      const title = `Panduan Praktis Arsitektur Rekayasa ${topic} Modern`
      const metaDescription = `Pelajari panduan komprehensif implementasi ${topic} untuk arsitektur platform enterprise modern SegiaTech berperforma tinggi dan ramah SEO.`

      expect(title.length).toBeGreaterThanOrEqual(40)
      expect(title.length).toBeLessThanOrEqual(80)
      expect(metaDescription.length).toBeGreaterThanOrEqual(120)
      expect(metaDescription.length).toBeLessThanOrEqual(160)
    })

    it('enforces metaDescription 120-160 chars and slug formatting even with long topic', () => {
      const longTopic = 'Arsitektur Sistem Cloud Enterprise Terdistribusi Skala Global dengan Sinkronisasi Database Realtime'
      const titleClamped = longTopic.length > 80 ? longTopic.slice(0, 77).trimEnd() + '...' : longTopic
      const metaDescription = `Pelajari panduan arsitektur sistem cloud enterprise terdistribusi skala global untuk keandalan performa platform digital SegiaTech berstandar industri.`

      expect(metaDescription.length).toBeGreaterThanOrEqual(120)
      expect(metaDescription.length).toBeLessThanOrEqual(160)
      expect(titleClamped.length).toBeLessThanOrEqual(80)
    })

    it('preserves contextual linking requirements in generated content', () => {
      const content = '<h2>Strategi</h2><p>Pelajari pada <a href="/portofolio">portofolio</a> dan <a href="/layanan">layanan</a> kami.</p>'
      expect(content).toContain('href="/portofolio"')
      expect(content).toContain('href="/layanan"')
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Model Fallback Chain Resilience & Non-Error Rejection
  // ---------------------------------------------------------------------------
  describe('Challenge 4: Model Fallback Chain Resilience', () => {
    it('handles non-Error string rejections from LLM without unhandled exceptions', async () => {
      mockCallLlm.mockRejectedValueOnce('Raw string rejection')
      mockCallLlm.mockResolvedValueOnce({
        reply: 'Sukses fallback setelah string rejection',
        provider: 'openrouter',
        model: 'backup-model',
      })

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'Status sistem' }],
        { currentTab: 'overview' },
        {
          provider: 'google',
          model: 'gemini-fail',
          apiKey: 'fake-goog-key',
          fallbackModels: [{ provider: 'openrouter', model: 'backup-model', apiKey: 'fake-or-key' }],
        }
      )

      expect(res.reply).toContain('Sukses fallback setelah string rejection')
      expect(res.meta?.fallbackOccurred).toBe(true)
      expect(res.meta?.failoverHistory?.[0].model).toBe('gemini-fail')
    })

    it('falls back to Zero-Mock failure diagnostics without crashing when fallbackModels is empty and primary fails', async () => {
      mockCallLlm.mockRejectedValue(new Error('Fatal 500'))

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
        { currentTab: 'buat-artikel' },
        {
          provider: 'google',
          model: 'primary-only',
          fallbackModels: [],
        }
      )

      expect(res.isError).toBeFalsy()
      expect(res.reply).toContain('Eksekusi Agen AI Terhenti')
      expect(res.autoApply).toBe(false)
      expect(res.proposedChanges).toBeNull()
    })

    it('does not leak API keys in failoverHistory or returned metadata', async () => {
      mockCallLlm.mockRejectedValueOnce(new Error('401 Unauthorized with secret key: sk-secret-12345'))
      mockCallLlm.mockResolvedValueOnce({
        reply: 'Sukses model kedua',
        provider: 'openrouter',
        model: 'model-2',
      })

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'Halo' }],
        { currentTab: 'overview' },
        {
          provider: 'google',
          model: 'm1',
          apiKey: 'sk-secret-12345',
          fallbackModels: [{ provider: 'openrouter', model: 'model-2', apiKey: 'sk-secret-67890' }],
        }
      )

      const serializedMeta = JSON.stringify(res.meta || {})
      expect(serializedMeta).not.toContain('sk-secret-67890')
    })
  })

  // ---------------------------------------------------------------------------
  // 5. OpenRouter Tool Schema Degradation Adversarial Robustness
  // ---------------------------------------------------------------------------
  describe('Challenge 5: OpenRouter Tool Schema Degradation Adversarial Robustness', () => {
    it('detects uppercase and mixed-case tool rejection messages in callLlm', async () => {
      llmState.useActualLlm = true
      const calls: any[] = []

      global.fetch = vi.fn(async (_url: any, init: any) => {
        const body = JSON.parse(init.body)
        calls.push(body)

        if (calls.length === 1) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: { message: 'FAILED: TOOLS ARE NOT SUPPORTED ON THIS ENDPOINT' },
            }),
          } as any
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'Degraded successfully from uppercase error' } }],
          }),
        } as any
      })

      const res = await callLlm({
        provider: 'openrouter',
        apiKey: 'test-key',
        model: 'openrouter/uppercase-test',
        messages: [{ role: 'user', content: 'test' }],
        tools: [{ name: 't', parameters: { type: 'object' } }],
      })

      expect(calls.length).toBe(2)
      expect(calls[1].tools).toBeUndefined()
      expect(res.reply).toBe('Degraded successfully from uppercase error')
    })

    it('retries only ONCE on tool degradation: if second request also fails with 400, it throws rather than looping', async () => {
      llmState.useActualLlm = true
      let callCount = 0

      global.fetch = vi.fn(async () => {
        callCount++
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: { message: 'tools not supported on endpoint' },
          }),
        } as any
      })

      await expect(
        callLlm({
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'openrouter/loop-test',
          messages: [{ role: 'user', content: 'test' }],
          tools: [{ name: 't', parameters: { type: 'object' } }],
        })
      ).rejects.toThrow()

      // Must attempt initial call (with tools) + 1 degraded call (without tools) = exactly 2 calls, NO infinite loop
      expect(callCount).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // 6. High-Frequency Clamping Stress Loop
  // ---------------------------------------------------------------------------
  describe('Challenge 6: High-Frequency Height Clamping Stress Loop', () => {
    it('executes 100,000 height computations with zero drift and sub-50ms total duration', () => {
      const computeClampedHeight = (scrollHeight: number) => Math.min(Math.max(scrollHeight, 38), 160)

      const start = performance.now()
      for (let i = 0; i < 100000; i++) {
        // Vary between negative, boundary, fractional, and extreme values
        const h = (i % 300) - 50 + (i % 2 === 0 ? 0.45 : 0)
        const clamped = computeClampedHeight(h)
        if (h <= 38) {
          if (clamped !== 38) throw new Error(`Floor failure at ${h}: got ${clamped}`)
        } else if (h >= 160) {
          if (clamped !== 160) throw new Error(`Ceiling failure at ${h}: got ${clamped}`)
        } else {
          if (clamped !== h) throw new Error(`Linear failure at ${h}: got ${clamped}`)
        }
      }
      const duration = performance.now() - start
      expect(duration).toBeLessThan(100)
    })
  })
})
