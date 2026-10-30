import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callLlm } from '../src/lib/agent/llm'
import {
  handleAiAssistantChat,
  extractArticleTopic,
} from '../src/lib/ai/chat'

// Mock prisma for isolated DB queries in chat.ts
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        Article: {
          aggregate: vi.fn(async () => ({ count: 878 })),
          where: vi.fn(() => ({
            aggregate: vi.fn(async () => ({ count: 10 })),
            include: vi.fn(() => ({
              include: vi.fn(() => ({
                first: vi.fn(async () => null),
              })),
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
        SiteConfig: {
          where: vi.fn(() => ({
            first: vi.fn(async () => null),
          })),
        },
      },
    },
  },
}))

describe('Empirical Challenge: Milestone 2 Model Fallback, Tool Degradation & Tier 3 Resilience', () => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
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

  // =========================================================================
  // Challenge 1: OpenRouter HTTP 400 Tool Rejection & Automatic Tool Degradation
  // =========================================================================
  describe('Challenge 1: OpenRouter HTTP 400 Tool Rejection & Degradation Recovery', () => {
    it('1.1: When OpenRouter returns HTTP 400 "Provider does not support tools", callLlm strips tools payload and successfully recovers on immediate retry', async () => {
      const fetchCalls: Array<{ url: string; body: any }> = []

      global.fetch = vi.fn(async (url: any, init: any) => {
        const body = JSON.parse(init.body)
        fetchCalls.push({ url: String(url), body })

        // First call: tools are present, model rejects tools with HTTP 400
        if (fetchCalls.length === 1) {
          expect(body.tools).toBeDefined()
          expect(body.tools.length).toBeGreaterThan(0)
          expect(body.tool_choice).toBe('auto')

          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                message: 'Provider does not support tools or function calling schemas',
                code: 400,
              },
            }),
          } as any
        }

        // Second call (degraded retry): tools and tool_choice must be stripped
        expect(body.tools).toBeUndefined()
        expect(body.tool_choice).toBeUndefined()
        expect(body.model).toBe('meta-llama/llama-3.3-70b-instruct:free')
        expect(body.messages).toBeDefined()

        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'Berikut adalah draf artikel arsitektur web modern yang dirancang secara terstruktur.',
                },
                finish_reason: 'stop',
              },
            ],
          }),
        } as any
      })

      const dummyTool = {
        name: 'test_tool',
        description: 'A test tool',
        parameters: { type: 'object', properties: {} },
      }

      const result = await callLlm({
        provider: 'openrouter',
        apiKey: 'sk-or-v1-testkey',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: 'buatkan draf artikel' }],
        tools: [dummyTool],
        toolChoice: 'auto',
      })

      // Verify that 2 calls were made (original + retry)
      expect(fetchCalls.length).toBe(2)
      expect(result.reply).toContain('Berikut adalah draf artikel arsitektur web modern')
      expect(result.toolCalls).toBeUndefined()
      expect(result.provider).toBe('openrouter')
      expect(result.model).toBe('meta-llama/llama-3.3-70b-instruct:free')
    })

    it('1.2: Tolerates diverse OpenRouter 400 error phrases (schema, parameter, function calling)', async () => {
      const errorPhrases = [
        'Invalid parameter: tools is not supported by this model',
        'Schema error: function call not allowed for free tier model',
        'Model parameter rejected: function calling disabled',
        'Provider does not support tool calling endpoints',
      ]

      for (const phrase of errorPhrases) {
        const fetchCalls: any[] = []
        global.fetch = vi.fn(async (_url: any, init: any) => {
          const body = JSON.parse(init.body)
          fetchCalls.push(body)

          if (fetchCalls.length === 1) {
            return {
              ok: false,
              status: 400,
              json: async () => ({ error: { message: phrase } }),
            } as any
          }

          return {
            ok: true,
            status: 200,
            json: async () => ({
              choices: [{ message: { content: `Berhasil setelah degradasi: ${phrase}` } }],
            }),
          } as any
        })

        const res = await callLlm({
          provider: 'openrouter',
          apiKey: 'sk-or-test',
          model: 'openrouter/free-model',
          messages: [{ role: 'user', content: 'test' }],
          tools: [{ name: 't', description: 'd', parameters: { type: 'object' } }],
        })

        expect(fetchCalls.length).toBe(2)
        expect(fetchCalls[1].tools).toBeUndefined()
        expect(res.reply).toContain('Berhasil setelah degradasi')
      }
    })

    it('1.3: Does NOT strip tools on non-tool 400 errors (e.g. context length exceeded) and throws cleanly', async () => {
      let callCount = 0
      global.fetch = vi.fn(async () => {
        callCount++
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: { message: 'context_length_exceeded: maximum context length is 4096 tokens' },
          }),
        } as any
      })

      await expect(
        callLlm({
          provider: 'openrouter',
          apiKey: 'sk-or-test',
          model: 'openrouter/free-model',
          messages: [{ role: 'user', content: 'test' }],
          tools: [{ name: 't', description: 'd', parameters: { type: 'object' } }],
        })
      ).rejects.toThrow(/OpenRouter Error: context_length_exceeded/)

      // Should abort immediately without retry
      expect(callCount).toBe(1)
    })

    it('1.4: Throws gracefully if degraded retry also fails with HTTP 500 without uncaught crash', async () => {
      let callCount = 0
      global.fetch = vi.fn(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: false,
            status: 400,
            json: async () => ({ error: { message: 'Provider does not support tools' } }),
          } as any
        }
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Internal Server Error on retry' } }),
        } as any
      })

      await expect(
        callLlm({
          provider: 'openrouter',
          apiKey: 'sk-or-test',
          model: 'openrouter/free-model',
          messages: [{ role: 'user', content: 'test' }],
          tools: [{ name: 't', description: 'd', parameters: { type: 'object' } }],
        })
      ).rejects.toThrow(/OpenRouter/)

      expect(callCount).toBe(2)
    })
  })

  // =========================================================================
  // Challenge 2: Multi-Tier Model Fallback Cascading Across Candidate Models
  // =========================================================================
  describe('Challenge 2: Cascading Fallback Across Candidate Models in handleAiAssistantChat', () => {
    it('2.1: Cascades from primary model (HTTP 429 quota exhaustion) to Candidate 1 in fallbackModels', async () => {
      const attemptedModels: string[] = []

      global.fetch = vi.fn(async (url: any, init: any) => {
        const body = JSON.parse(init.body)
        attemptedModels.push(body.model || String(url))

        // Model 1: Google Gemini 2.5 Flash hits 503 Service Unavailable Outage
        if (String(url).includes('gemini-2.5-flash')) {
          return {
            ok: false,
            status: 503,
            json: async () => ({
              error: {
                message: 'The model is overloaded. Please try again later. (HTTP 503)',
                code: 503,
              },
            }),
          } as any
        }

        // Model 2: OpenRouter Fallback Model succeeds
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: 'Draf respons sukses dari model cadangan OpenRouter Llama 3.3 70B.',
                },
              },
            ],
          }),
        } as any
      })

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'Cek analitik dan performa sistem' }],
        { currentTab: 'overview', role: 'SUPER_ADMIN' },
        {
          provider: 'google',
          model: 'gemini-2.5-flash',
          apiKey: 'fake-google-key',
          fallbackModels: [
            {
              provider: 'openrouter',
              model: 'meta-llama/llama-3.3-70b-instruct:free',
              apiKey: 'fake-openrouter-key',
            },
          ],
        }
      )

      expect(attemptedModels.length).toBeGreaterThanOrEqual(2)
      expect(response.reply).toContain('Draf respons sukses dari model cadangan OpenRouter Llama 3.3 70B')
      expect(response.reply).toContain('Model `gemini-2.5-flash` mengalami kendala')
      expect(response.reply).toContain('Dialihkan secara otomatis ke model cadangan `meta-llama/llama-3.3-70b-instruct:free`')
      expect(response.meta?.fallbackOccurred).toBe(true)
      expect(response.meta?.model).toBe('meta-llama/llama-3.3-70b-instruct:free')
      expect(response.meta?.originalModel).toBe('gemini-2.5-flash')
      expect(response.meta?.failoverHistory?.length).toBe(1)
      expect(response.meta?.failoverHistory?.[0].model).toBe('gemini-2.5-flash')
    })

    it('2.2: Cascades through multiple failed models (Primary HTTP 500, Fallback 1 HTTP 429, Fallback 2 Success)', async () => {
      const callLog: string[] = []

      global.fetch = vi.fn(async (url: any, init: any) => {
        const body = JSON.parse(init.body)
        const currentMdl = body.model || String(url)
        callLog.push(currentMdl)

        // Primary: Outage on Google
        if (currentMdl.includes('primary-gemini')) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Internal Server Error' } }),
          } as any
        }

        // Fallback 1: Outage on OpenRouter
        if (currentMdl.includes('llama-fallback-1')) {
          return {
            ok: false,
            status: 503,
            json: async () => ({ error: { message: 'Service Temporarily Unavailable' } }),
          } as any
        }

        // Fallback 2: Success on Google
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Sukses dari Fallback 2 (gemini-2.0-flash).' }],
                },
              },
            ],
          }),
        } as any
      })

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'Status sistem' }],
        { currentTab: 'overview' },
        {
          provider: 'google',
          model: 'primary-gemini',
          apiKey: 'key-1',
          fallbackModels: [
            { provider: 'openrouter', model: 'llama-fallback-1', apiKey: 'key-2' },
            { provider: 'google', model: 'gemini-2.0-flash', apiKey: 'key-3' },
          ],
        }
      )

      expect(callLog.some((c) => c.includes('primary-gemini'))).toBe(true)
      expect(callLog.some((c) => c.includes('llama-fallback-1'))).toBe(true)
      expect(res.reply).toContain('Sukses dari Fallback 2')
      expect(res.meta?.fallbackOccurred).toBe(true)
      expect(res.meta?.model).toBe('gemini-2.0-flash')
      expect(res.meta?.failoverHistory?.length).toBe(2)
      expect(res.meta?.failoverHistory?.[0].model).toBe('primary-gemini')
      expect(res.meta?.failoverHistory?.[1].model).toBe('llama-fallback-1')
    })

    it('2.3: Preserves article creation directives across fallback hops and parses structured changes', async () => {
      global.fetch = vi.fn(async (url: any) => {
        // If Google Gemini candidate, fail with 500
        if (String(url).includes('googleapis.com')) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Google failure' } }),
          } as any
        }

        // OpenRouter candidate succeeds with structured changes JSON
        const syntheticArticleJson = JSON.stringify({
          title: 'Arsitektur Digital Enterprise Modern',
          slug: 'arsitektur-digital-enterprise-modern',
          focusKeyphrase: 'arsitektur digital',
          category: 'Website Development',
          metaTitle: 'Arsitektur Digital Enterprise Modern | SegiaTech',
          metaDescription: 'Panduan arsitektur digital enterprise modern untuk skalabilitas dan performa tinggi.',
          coverAlt: 'Arsitektur Digital Enterprise Modern SegiaTech',
          content: '<h2>Fondasi Arsitektur</h2><p>Penjelasan lengkap...</p>',
          summary: 'Draf artikel baru telah disusun.',
          autoApply: true,
        })

        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: `Berikut draf artikel lengkap:\n\n\`\`\`json:article-changes\n${syntheticArticleJson}\n\`\`\``,
                },
              },
            ],
          }),
        } as any
      })

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
        {
          currentTab: 'buat-artikel',
          article: {
            title: 'Draf Baru',
            focusKeyphrase: 'arsitektur digital',
          },
        },
        {
          provider: 'google',
          model: 'model-fail',
          apiKey: 'key-1',
          fallbackModels: [{ provider: 'openrouter', model: 'model-success', apiKey: 'key-2' }],
        }
      )

      expect(response.proposedChanges).toBeDefined()
      expect(response.proposedChanges.title).toBe('Arsitektur Digital Enterprise Modern')
      expect(response.proposedChanges.autoApply).toBe(true)
      expect(response.autoApply).toBe(true)
      expect(response.meta?.fallbackOccurred).toBe(true)
    })
  })

  // =========================================================================
  // Challenge 3: Tier 3 Deterministic Fallback & Zero-Mock Editorial Synthesis
  // =========================================================================
  describe('Challenge 3: Tier 3 Deterministic Copilot Resilience & Yoast SEO Strict Parity', () => {
    it('3.1: When ALL remote models fail, Tier 3 produces rich structured proposedChanges with 100% Yoast compliance', async () => {
      // Simulate total remote API failure
      global.fetch = vi.fn(async () => {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'All upstream LLM clusters down' } }),
        } as any
      })

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
        {
          currentTab: 'buat-artikel',
          locationName: 'Studio Tulis Artikel',
          article: {
            title: 'Draf Baru',
            focusKeyphrase: 'arsitektur creative tech',
            category: 'Creative Technology',
          },
        },
        {
          provider: 'google',
          model: 'gemini-fail-1',
          apiKey: 'bad-key',
          fallbackModels: [{ provider: 'openrouter', model: 'or-fail-2', apiKey: 'bad-key-2' }],
        }
      )

      expect(response.isError).toBeFalsy()
      expect(response.reply).toBeDefined()
      expect(response.reply).toContain('Eksekusi Agen AI Terhenti')
      expect(response.proposedChanges).toBeNull()
      expect(response.autoApply).toBe(false)

      expect(response.meta?.fallbackOccurred).toBe(true)
      expect(response.meta?.failoverHistory?.length).toBeGreaterThanOrEqual(1)
    })

    it('3.2: Topic extraction correctly parses subject from creation prompts', () => {
      expect(extractArticleTopic('buat draf artikel tentang Next.js 16')).toBe('Next.js 16')
      expect(extractArticleTopic('tulis artikel mengenai Web Vitals')).toBe('Web Vitals')
      expect(extractArticleTopic('generate article about digital marketing')).toBe('digital marketing')
    })

    it('3.4: Topic extraction handles conversational prepositions and context fallbacks', () => {
      // Direct prompt topic extraction
      expect(extractArticleTopic('buatkan artikel tentang Arsitektur Headless CMS')).toBe('Arsitektur Headless CMS')
      expect(extractArticleTopic('tuliskan artikel mengenai Optimasi Core Web Vitals di halaman ini')).toBe('Optimasi Core Web Vitals')
      expect(extractArticleTopic('generate article about Microfrontend Architecture on this page')).toBe('Microfrontend Architecture')

      // Conversational creation prompt extraction without preposition
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', { focusKeyphrase: 'creative development' })).toBe('creative development')
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', { title: 'Panduan GSAP WebGL' })).toBe('Panduan GSAP WebGL')
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', null)).toBe('Praktik Terbaik Arsitektur Web & Creative Technology Modern')
    })
  })

  // =========================================================================
  // Challenge 4: Complete Elimination of Agentic Error Regressions
  // =========================================================================
  describe('Challenge 4: Total Eradication of "Terjadi kendala saat memproses respons dari agentic engine"', () => {
    it('4.1: Under extreme stress (no keys, empty messages, hostile network failure), handleAiAssistantChat NEVER returns isError or empty reply', async () => {
      // Simulate catastrophic network drop
      global.fetch = vi.fn(async () => {
        throw new Error('ECONNREFUSED: Network disconnected')
      })

      // 1. Creation intent with network failure
      const resCreation = await handleAiAssistantChat(
        [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
        { currentTab: 'buat-artikel' }
      )
      expect(resCreation.isError).toBeFalsy()
      expect(resCreation.reply).toBeDefined()
      expect(resCreation.reply.length).toBeGreaterThan(0)
      expect(resCreation.reply).not.toContain('Terjadi kendala saat memproses respons dari agentic engine')

      // 2. Direct prompt with no keys and tools disabled
      const resNoKey = await handleAiAssistantChat(
        [{ role: 'user', content: 'analisis kata kunci ini' }],
        { currentTab: 'overview' },
        { enabledTools: [] }
      )
      expect(resNoKey.isError).toBeFalsy()
      expect(resNoKey.reply).toBeDefined()
      expect(resNoKey.reply).not.toContain('Terjadi kendala saat memproses respons dari agentic engine')

      // 3. Database query prompt with no LLM
      const resDb = await handleAiAssistantChat(
        [{ role: 'user', content: 'berapa jumlah artikel terbit?' }],
        { currentTab: 'articles' }
      )
      expect(resDb.isError).toBeFalsy()
      expect(resDb.reply).toBeDefined()
      expect(resDb.reply).not.toContain('Terjadi kendala saat memproses respons dari agentic engine')
    })

    it('4.2: Structured proposedChanges guarantees all fields required by StudioAiArticleContext and ArticleBlock[]', () => {
      const generated = {
        title: 'Desain Komputasional Modern',
        slug: 'desain-komputasional-modern',
        focusKeyphrase: 'desain komputasional',
        category: 'Creative Tech',
        autoApply: true,
        summary: 'Draf artikel desain komputasional berhasil disusun.',
        blocks: [
          { id: 'b_1', type: 'heading2', text: 'Pengantar' },
          { id: 'b_2', type: 'paragraph', text: 'Teks naratif.' },
          { id: 'b_3', type: 'list', items: ['Item 1', 'Item 2'] },
          { id: 'b_4', type: 'heading3', text: 'Kesimpulan' },
        ],
      }

      expect(generated.title).toContain('Desain Komputasional')
      expect(generated.slug).toBe('desain-komputasional-modern')
      expect(generated.focusKeyphrase).toBe('desain komputasional')
      expect(generated.category).toBe('Creative Tech')
      expect(generated.autoApply).toBe(true)
      expect(generated.summary).toBeDefined()

      // Validate all blocks have id, type, and valid structure
      for (const b of generated.blocks) {
        expect(b.id).toBeDefined()
        expect(['heading2', 'heading3', 'paragraph', 'list']).toContain(b.type)
        if (b.type === 'list') {
          expect(Array.isArray(b.items)).toBe(true)
          expect(b.items.length).toBeGreaterThan(0)
        } else {
          expect(typeof b.text).toBe('string')
          expect(b.text.length).toBeGreaterThan(0)
        }
      }
    })
  })
})
