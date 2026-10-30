import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isContinuationIntent, executeCopilotAgentRunner } from '@/lib/ai/copilot-agent-runner'
import { handleAiAssistantChat } from '@/lib/ai/chat'

// Mock prisma database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    orm: {
      public: {
        Article: {
          aggregate: vi.fn(async () => ({ count: 878 })),
          where: () => ({
            first: async () => null,
          }),
        },
      },
    },
  },
  prisma: {
    orm: {
      public: {
        Article: {
          aggregate: vi.fn(async () => ({ count: 878 })),
          where: () => ({
            aggregate: vi.fn(async () => ({ count: 10 })),
            include: vi.fn(() => ({
              include: vi.fn(() => ({
                first: vi.fn(async () => null),
              })),
              first: vi.fn(async () => null),
            })),
            first: async () => null,
          }),
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
        AiSession: {
          where: () => ({
            all: async () => [],
            first: async () => null,
          }),
        },
        AiSessionMessage: {
          where: () => ({
            all: async () => [],
          }),
        },
      },
    },
  },
}))

describe('Copilot Resumption & Continuity Engine', () => {
  describe('Intent Recognition (`isContinuationIntent`)', () => {
    it('detects common Indonesian continuation prompts', () => {
      expect(isContinuationIntent('lanjutkan')).toBe(true)
      expect(isContinuationIntent('lanjut')).toBe(true)
      expect(isContinuationIntent('teruskan')).toBe(true)
      expect(isContinuationIntent('sambung')).toBe(true)
      expect(isContinuationIntent('lanjutkan yang tadi')).toBe(true)
      expect(isContinuationIntent('teruskan pekerjaan tadi')).toBe(true)
      expect(isContinuationIntent('lanjutkan draf')).toBe(true)
      expect(isContinuationIntent('lanjutkan pekerjaan yang terputus')).toBe(true)
    })

    it('detects English continuation keywords', () => {
      expect(isContinuationIntent('continue')).toBe(true)
      expect(isContinuationIntent('resume')).toBe(true)
      expect(isContinuationIntent('next')).toBe(true)
    })

    it('distinguishes continuation from fresh creation intent', () => {
      expect(isContinuationIntent('lanjutkan penulisan artikel tadi')).toBe(true)
      expect(isContinuationIntent('teruskan draf artikel')).toBe(true)
      expect(isContinuationIntent('lanjutkan')).toBe(true)
      expect(isContinuationIntent('buatkan artikel tentang WebGL')).toBe(false)
    })

    it('rejects unrelated conversational queries', () => {
      expect(isContinuationIntent('halo')).toBe(false)
      expect(isContinuationIntent('siapa namamu?')).toBe(false)
      expect(isContinuationIntent('perbaiki penulisan')).toBe(false)
    })
  })

  describe('Zero-Mock Resumption & API Error Guard', () => {
    it('halts transparently when API key is unconfigured without inventing fake continuation content', async () => {
      const existingArticle = {
        title: 'Arsitektur Web Modern',
        slug: 'arsitektur-web-modern',
        focusKeyphrase: 'arsitektur web',
        category: 'Website Development',
        content: '<h2>Pengantar</h2><p>Penerapan arsitektur web modern sangat krusial bagi skalabilitas.</p>',
      }

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'lanjutkan pekerjaan yang terputus tadi' }],
        {
          article: existingArticle,
        },
        {
          provider: 'google',
          apiKey: '', // No keys: must NOT hallucinate mock text
        }
      )

      expect(res.reply).toContain('Eksekusi Agen AI Terhenti')
      expect(res.proposedChanges).toBeFalsy()
    })
  })
})
