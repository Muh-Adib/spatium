import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import {
  isExploratoryQuery,
  getToolCallSignature,
  executeCopilotAgentRunner,
} from '@/lib/ai/copilot-agent-runner'

describe('Copilot Loop Guard & Circuit Breaker Engine (Milestone 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // Test 1: Query Classification & Tool Call Signature
  // =========================================================================
  describe('Test 1: Intent Classification & Deterministic Signature', () => {
    it('classifies exploratory vs mutation vs continuation queries accurately', () => {
      // 1. Exploratory questions -> true
      expect(isExploratoryQuery('Berapa banyak artikel di database?')).toBe(true)
      expect(isExploratoryQuery('Cari studi kasus WebGL dan jelaskan')).toBe(true)
      expect(isExploratoryQuery('Apa itu Next.js 16 App Router?')).toBe(true)
      expect(isExploratoryQuery('Bagaimana performa SEO bulan ini?')).toBe(true)
      expect(isExploratoryQuery('Riset keyword untuk cloud hosting')).toBe(true)
      expect(isExploratoryQuery('Cek status indeks google')).toBe(true)

      // 2. Article creation and mutation intents -> false
      expect(isExploratoryQuery('Buatkan artikel tentang Three.js')).toBe(false)
      expect(isExploratoryQuery('Tulis draf baru dengan judul Modern SEO')).toBe(false)
      expect(isExploratoryQuery('Terapkan perubahan draf ke editor')).toBe(false)
      expect(isExploratoryQuery('Tuliskan artikel lengkap seputar AI')).toBe(false)
      expect(isExploratoryQuery('Perbaiki artikel ini agar lolos Yoast')).toBe(false)
      expect(isExploratoryQuery('Ganti heading artikel')).toBe(false)

      // 3. Continuation intents -> false
      expect(isExploratoryQuery('Lanjutkan')).toBe(false)
      expect(isExploratoryQuery('lanjut')).toBe(false)
      expect(isExploratoryQuery('teruskan')).toBe(false)
      expect(isExploratoryQuery('continue')).toBe(false)
      expect(isExploratoryQuery('resume')).toBe(false)
      expect(isExploratoryQuery('lanjutkan yang tadi')).toBe(false)

      // 4. Fallback / edge cases
      expect(isExploratoryQuery('')).toBe(true)
      expect(isExploratoryQuery(null as any)).toBe(true)
      expect(isExploratoryQuery(undefined as any)).toBe(true)
    })

    it('generates deterministic tool call signatures regardless of key ordering', () => {
      const sig1 = getToolCallSignature('web_search_multi_query', {
        queries: ['nextjs', 'react'],
        searchScope: 'all',
      })
      const sig2 = getToolCallSignature('web_search_multi_query', {
        searchScope: 'all',
        queries: ['nextjs', 'react'],
      })
      expect(sig1).toBe(sig2)
      expect(sig1).toBe('web_search_multi_query:{"queries":["nextjs","react"],"searchScope":"all"}')

      // Deep / nested objects
      const deep1 = getToolCallSignature('custom_tool', {
        b: { z: 9, y: 8 },
        a: 1,
      })
      const deep2 = getToolCallSignature('custom_tool', {
        a: 1,
        b: { y: 8, z: 9 },
      })
      expect(deep1).toBe(deep2)
    })
  })

  // =========================================================================
  // Test 2: Exploratory 3-Tool Cap
  // =========================================================================
  describe('Test 2: Exploratory 3-Tool Cap', () => {
    it('terminates exploratory queries after 3 tool calls and triggers final synthesis', async () => {
      mockCallLlm
        // Turn 1 (step 0): model calls web_search_multi_query query 1
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 100,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_1',
              name: 'web_search_multi_query',
              arguments: { queries: ['arsitektur web modern 2026'] },
            },
          ],
        })
        // Turn 2 (step 1): model calls web_search_multi_query query 2
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 100,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_2',
              name: 'web_search_multi_query',
              arguments: { queries: ['performa nextjs 16 turbopack'] },
            },
          ],
        })
        // Turn 3 (step 2): model calls web_search_multi_query query 3
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 100,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_3',
              name: 'web_search_multi_query',
              arguments: { queries: ['prisma 8 orm postgres benchmark'] },
            },
          ],
        })
        // Turn 4: Circuit breaker synthesis turn (tools: [])
        .mockResolvedValueOnce({
          reply: 'Berdasarkan data observasi, Next.js 16 Turbopack dan Prisma 8 memberikan peningkatan performa hingga 70%.',
          durationMs: 150,
          provider: 'google',
          model: 'gemini-3.8-flash',
        })

      const result = await executeCopilotAgentRunner({
        provider: 'google',
        apiKey: 'test-key',
        model: 'gemini-3.8-flash',
        messages: [{ role: 'user', content: 'Berapa banyak artikel di database dan bagaimana performa sistem?' }],
        systemInstruction: 'You are SegiaTech Assistant',
        maxSteps: 6,
      })

      // Exactly 3 tools executed
      expect(result.executedTools).toHaveLength(3)
      expect(result.executedTools.map((t) => t.name)).toEqual([
        'web_search_multi_query',
        'web_search_multi_query',
        'web_search_multi_query',
      ])

      // Circuit breaker tripped with exact reason
      expect(result.circuitBreaker).toBeDefined()
      expect(result.circuitBreaker?.triggered).toBe(true)
      expect(result.circuitBreaker?.reason).toBe(
        'Batas maksimal 3 eksekusi tool untuk kueri eksploratori telah tercapai.'
      )

      // Verified synthesis call was made with tools: []
      expect(mockCallLlm).toHaveBeenCalledTimes(4)
      const synthesisCallArgs = mockCallLlm.mock.calls[3][0]
      expect(synthesisCallArgs.tools).toEqual([])
      expect(synthesisCallArgs.messages.slice(-1)[0].content).toContain('[SISTEM — CIRCUIT BREAKER AKTIF]')

      // Coherent final answer returned
      expect(result.reply).toBe(
        'Berdasarkan data observasi, Next.js 16 Turbopack dan Prisma 8 memberikan peningkatan performa hingga 70%.'
      )
    })
  })

  // =========================================================================
  // Test 3: Sequential Duplicate Repetition Breaker
  // =========================================================================
  describe('Test 3: Sequential Duplicate Repetition Breaker', () => {
    it('halts immediately when consecutive tool calls have identical signatures', async () => {
      mockCallLlm
        // Turn 1: model calls search with { queries: ['nextjs'] }
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 90,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_1',
              name: 'web_search_multi_query',
              arguments: { queries: ['nextjs'] },
            },
          ],
        })
        // Turn 2: model loops and repeats the EXACT SAME call
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 90,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_2',
              name: 'web_search_multi_query',
              arguments: { queries: ['nextjs'] },
            },
          ],
        })
        // Turn 3: Synthesis turn
        .mockResolvedValueOnce({
          reply: 'Riset Next.js telah dirangkum: Next.js 16 mengintegrasikan Turbopack secara default.',
          durationMs: 120,
          provider: 'google',
          model: 'gemini-3.8-flash',
        })

      const result = await executeCopilotAgentRunner({
        provider: 'google',
        apiKey: 'test-key',
        model: 'gemini-3.8-flash',
        messages: [{ role: 'user', content: 'Cari informasi Next.js' }],
        systemInstruction: 'You are SegiaTech Assistant',
      })

      // The duplicate was stopped BEFORE execution: only 1 tool was executed
      expect(result.executedTools).toHaveLength(1)
      expect(result.circuitBreaker?.triggered).toBe(true)
      expect(result.circuitBreaker?.reason).toBe(
        'Terdeteksi pemanggilan berulang berurutan pada tool "web_search_multi_query" dengan argumen identik.'
      )

      // Final synthesis called with tools: []
      expect(mockCallLlm).toHaveBeenCalledTimes(3)
      expect(mockCallLlm.mock.calls[2][0].tools).toEqual([])
      expect(result.reply).toBe(
        'Riset Next.js telah dirangkum: Next.js 16 mengintegrasikan Turbopack secara default.'
      )
    })
  })

  // =========================================================================
  // Test 4: Session Duplicate Repetition Breaker
  // =========================================================================
  describe('Test 4: Session Duplicate Repetition Breaker', () => {
    it('halts when the same tool is invoked twice with identical arguments in a non-consecutive cycle', async () => {
      mockCallLlm
        // Turn 1: tool A
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 100,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_1',
              name: 'web_search_multi_query',
              arguments: { queries: ['threejs'] },
            },
          ],
        })
        // Turn 2: tool B
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 100,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_2',
              name: 'fetch_web_evidence',
              arguments: { url: 'https://threejs.org' },
            },
          ],
        })
        // Turn 3: tool A called AGAIN with identical arguments (seenCount becomes 2)
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 100,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_3',
              name: 'web_search_multi_query',
              arguments: { queries: ['threejs'] },
            },
          ],
        })
        // Turn 4: Synthesis
        .mockResolvedValueOnce({
          reply: 'Three.js adalah pustaka JavaScript WebGL terkemuka untuk rendering grafik 3D interaktif.',
          durationMs: 110,
          provider: 'google',
          model: 'gemini-3.8-flash',
        })

      const result = await executeCopilotAgentRunner({
        provider: 'google',
        apiKey: 'test-key',
        model: 'gemini-3.8-flash',
        messages: [{ role: 'user', content: 'Buatkan artikel tentang Three.js' }],
        systemInstruction: 'You are SegiaTech Assistant',
      })

      // Turn 1 and Turn 2 executed; Turn 3 was intercepted
      expect(result.executedTools).toHaveLength(2)
      expect(result.circuitBreaker?.triggered).toBe(true)
      expect(result.circuitBreaker?.reason).toBe(
        'Tool "web_search_multi_query" telah dipanggil 2 kali dengan argumen yang identik. Sirkuit dihentikan untuk mencegah loop.'
      )
      expect(result.reply).toBe(
        'Three.js adalah pustaka JavaScript WebGL terkemuka untuk rendering grafik 3D interaktif.'
      )
    })
  })

  // =========================================================================
  // Test 5: Hallucinated Tool Rejection & Defense
  // =========================================================================
  describe('Test 5: Hallucinated Tool Rejection & Defense', () => {
    it('gracefully handles hallucinated tools ("example_function_name", "...") and trips breaker after consecutive attempts', async () => {
      mockCallLlm
        // Turn 1: model hallucinates "example_function_name"
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 80,
          provider: 'openrouter',
          model: 'openrouter/free-model',
          toolCalls: [
            {
              id: 'call_h1',
              name: 'example_function_name',
              arguments: { dummy: true },
            },
          ],
        })
        // Turn 2: model hallucinates "..."
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 80,
          provider: 'openrouter',
          model: 'openrouter/free-model',
          toolCalls: [
            {
              id: 'call_h2',
              name: '...',
              arguments: {},
            },
          ],
        })
        // Turn 3: Synthesis turn
        .mockResolvedValueOnce({
          reply: 'Maaf atas kendala tool fiktif. Berikut penjelasan lengkap mengenai arsitektur web modern yang Anda minta.',
          durationMs: 130,
          provider: 'openrouter',
          model: 'openrouter/free-model',
        })

      const result = await executeCopilotAgentRunner({
        provider: 'openrouter',
        apiKey: 'test-key',
        model: 'openrouter/free-model',
        messages: [{ role: 'user', content: 'Jelaskan arsitektur web' }],
        systemInstruction: 'You are SegiaTech Assistant',
      })

      // No unhandled exception thrown
      expect(result.executedTools).toHaveLength(2)

      // Both hallucinated calls recorded with INVALID_TOOL_NAME
      expect(result.executedTools[0].result).toEqual(
        expect.objectContaining({
          error: true,
          code: 'INVALID_TOOL_NAME',
          message: expect.stringContaining('tidak valid atau tidak terdaftar'),
        })
      )
      expect(result.executedTools[1].result).toEqual(
        expect.objectContaining({
          error: true,
          code: 'INVALID_TOOL_NAME',
          message: expect.stringContaining('tidak valid atau tidak terdaftar'),
        })
      )

      // Circuit breaker tripped due to consecutive hallucinations
      expect(result.circuitBreaker?.triggered).toBe(true)
      expect(result.circuitBreaker?.reason).toBe(
        'Model berulang kali memanggil nama tool fiktif / placeholder.'
      )

      // Successfully synthesized answer
      expect(result.reply).toBe(
        'Maaf atas kendala tool fiktif. Berikut penjelasan lengkap mengenai arsitektur web modern yang Anda minta.'
      )
    })

    it('resets hallucination counter when a valid tool is called in between', async () => {
      mockCallLlm
        // Turn 1: hallucinated tool 1
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 80,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_h1',
              name: 'placeholder_tool',
              arguments: {},
            },
          ],
        })
        // Turn 2: valid tool (resets consecutive counter to 0)
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 80,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'call_v1',
              name: 'web_search_multi_query',
              arguments: { queries: ['arsitektur'] },
            },
          ],
        })
        // Turn 3: final answer
        .mockResolvedValueOnce({
          reply: 'Arsitektur selesai dianalisis.',
          durationMs: 90,
          provider: 'google',
          model: 'gemini-3.8-flash',
        })

      const result = await executeCopilotAgentRunner({
        provider: 'google',
        apiKey: 'test-key',
        model: 'gemini-3.8-flash',
        messages: [{ role: 'user', content: 'Analisis arsitektur' }],
        systemInstruction: 'You are SegiaTech Assistant',
      })

      // Did not trip breaker because valid tool reset consecutive counter
      expect(result.circuitBreaker?.triggered).toBe(false)
      expect(result.reply).toBe('Arsitektur selesai dianalisis.')
    })
  })

  // =========================================================================
  // Test 6: Final Synthesis Guarantee & Synthesis Fallback
  // =========================================================================
  describe('Test 6: Final Synthesis Guarantee & Fallback', () => {
    it('guarantees tools: [] is passed to synthesis call when step limit is reached', async () => {
      mockCallLlm
        // Step 0: calls tool A
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 50,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'c1',
              name: 'web_search_multi_query',
              arguments: { queries: ['query-a'] },
            },
          ],
        })
        // Step 1: calls tool B (maxSteps reached: 2)
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 50,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'c2',
              name: 'web_search_multi_query',
              arguments: { queries: ['query-b'] },
            },
          ],
        })
        // Synthesis turn
        .mockResolvedValueOnce({
          reply: 'Jawaban akhir komprehensif setelah step limit tercapai.',
          durationMs: 70,
          provider: 'google',
          model: 'gemini-3.8-flash',
        })

      const result = await executeCopilotAgentRunner({
        provider: 'google',
        apiKey: 'test-key',
        model: 'gemini-3.8-flash',
        messages: [{ role: 'user', content: 'Tulis draf artikel' }],
        systemInstruction: 'You are SegiaTech Assistant',
        maxSteps: 2,
      })

      expect(result.circuitBreaker?.triggered).toBe(true)
      expect(result.circuitBreaker?.reason).toBe('Batas maksimal langkah (2) telah tercapai.')
      expect(result.reply).toBe('Jawaban akhir komprehensif setelah step limit tercapai.')

      // Confirm tools: [] was enforced on the synthesis turn
      const synthesisCall = mockCallLlm.mock.calls[2][0]
      expect(synthesisCall.tools).toEqual([])
    })

    it('falls back gracefully to deterministic summary if synthesis LLM call fails', async () => {
      mockCallLlm
        // Step 0: calls tool
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 50,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'c1',
              name: 'web_search_multi_query',
              arguments: { queries: ['test-fallback'] },
            },
          ],
        })
        // Step 1: repeated tool triggers circuit breaker
        .mockResolvedValueOnce({
          reply: '',
          durationMs: 50,
          provider: 'google',
          model: 'gemini-3.8-flash',
          toolCalls: [
            {
              id: 'c2',
              name: 'web_search_multi_query',
              arguments: { queries: ['test-fallback'] },
            },
          ],
        })
        // Synthesis call rejects with network failure
        .mockRejectedValueOnce(new Error('Downstream network outage during synthesis'))

      const result = await executeCopilotAgentRunner({
        provider: 'google',
        apiKey: 'test-key',
        model: 'gemini-3.8-flash',
        messages: [{ role: 'user', content: 'Cek data' }],
        systemInstruction: 'You are SegiaTech Assistant',
      })

      // Does not crash; provides structured summary
      expect(result.circuitBreaker?.triggered).toBe(true)
      expect(result.reply).toContain('Circuit Breaker Aktif')
      expect(result.reply).toContain('Terdeteksi pemanggilan berulang berurutan')
      expect(result.reply).toContain('web_search_multi_query')
    })
  })
})

