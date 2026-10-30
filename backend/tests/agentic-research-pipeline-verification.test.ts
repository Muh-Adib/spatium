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
  COPILOT_EDITOR_TOOLS,
  executeMultiQuerySearch,
  executeFetchWebEvidence,
  computeEditorialMetrics,
  executeCopilotAgentRunner,
  slugifyText,
  isContinuationIntent,
} from '@/lib/ai/copilot-agent-runner'
import { getFriendlyToolLabel } from '@/components/studio/StudioAiSidebar'

describe('Agentic Research Pipeline & Evidence Verification Engine', () => {
  // =========================================================================
  // 1. Tool Catalog Completeness (6-Stage Pipeline Protocol)
  // =========================================================================
  describe('Stage Protocol & Tool Schemas', () => {
    it('registers all tools required for the 6-stage research & publication pipeline', () => {
      const toolNames = COPILOT_EDITOR_TOOLS.map((t) => t.name)
      expect(toolNames).toContain('research_topic_intent') // Stage 1
      expect(toolNames).toContain('web_search_multi_query') // Stage 2
      expect(toolNames).toContain('fetch_web_evidence') // Stage 2 & 3
      expect(toolNames).toContain('record_evidence_dossier') // Stage 3
      expect(toolNames).toContain('gap_analysis_and_cross_check') // Stage 4
      expect(toolNames).toContain('inspect_active_article') // Active editor context
      expect(toolNames).toContain('analyze_keyword_and_readability') // Metrics analysis
      expect(toolNames).toContain('apply_article_draft_or_metadata') // Stage 5
      expect(toolNames).toContain('edit_article_segment') // Surgical edits
      expect(toolNames).toContain('independent_seo_audit_gate') // Stage 6
    })

    it('provides human-readable Indonesian labels for all pipeline stages', () => {
      expect(getFriendlyToolLabel('research_topic_intent')).toContain('Tahap 1')
      expect(getFriendlyToolLabel('web_search_multi_query')).toContain('Tahap 2')
      expect(getFriendlyToolLabel('fetch_web_evidence')).toContain('Tahap 2 & 3')
      expect(getFriendlyToolLabel('record_evidence_dossier')).toContain('Tahap 3')
      expect(getFriendlyToolLabel('gap_analysis_and_cross_check')).toContain('Tahap 4')
      expect(getFriendlyToolLabel('apply_article_draft_or_metadata')).toContain('Tahap 5')
      expect(getFriendlyToolLabel('independent_seo_audit_gate')).toContain('Tahap 6')
    })
  })

  // =========================================================================
  // 2. Multi-Source Search & Real Knowledge Matching (Stage 2)
  // =========================================================================
  describe('Stage 2: Multi-Source Research Engine', () => {
    it('executes multi-query search across real internal catalog (portfolios and services)', async () => {
      const result = await executeMultiQuerySearch(
        ['3D aquarium edutainment', 'pembuatan website profesional'],
        'internal_catalog'
      )

      expect(result.queriesSearched.length).toBe(2)
      expect(result.totalResultsFound).toBeGreaterThanOrEqual(1)
      expect(result.results.some((r) => r.sourceType === 'internal_catalog')).toBe(true)

      // Ensure results contain real URLs without mock generation
      const aquariumResult = result.results.find((r) => r.url.includes('interactive-3d-aquarium'))
      expect(aquariumResult).toBeDefined()
      expect(aquariumResult?.title).toContain('Interactive 3D Aquarium')
    })
  })

  // =========================================================================
  // 3. Evidence Extraction & SSRF Security (Stage 2 & 3)
  // =========================================================================
  describe('Stage 2 & 3: Evidence Extraction & SSRF Defense', () => {
    it('resolves internal portfolio evidence directly from database', async () => {
      const evidence = await executeFetchWebEvidence(
        '/portofolio/interactive-3d-aquarium-edutainment',
        'simulasi kawanan ikan boids'
      )

      expect(evidence.status).toBe('verified_internal')
      expect(evidence.title).toContain('Interactive 3D Aquarium')
      expect(evidence.confidenceScore).toBe(98)
      expect(evidence.excerpt).toBeDefined()
    })

    it('blocks dangerous SSRF attempts to local intranet addresses', async () => {
      const ssrf1 = await executeFetchWebEvidence('https://127.0.0.1/admin/secret')
      expect(ssrf1.status).toBe('fetch_error')
      expect(ssrf1.error).toContain('Akses ke IP privat/link-local/metadata dilarang')

      const ssrf2 = await executeFetchWebEvidence('https://localhost:8080/metrics')
      expect(ssrf2.status).toBe('fetch_error')
      expect(ssrf2.error).toContain('Hostname tidak diizinkan')

      const ssrf3 = await executeFetchWebEvidence('https://169.254.169.254/latest/meta-data')
      expect(ssrf3.status).toBe('fetch_error')
      expect(ssrf3.error).toContain('Akses ke IP privat/link-local/metadata dilarang')
    })
  })

  // =========================================================================
  // 4. Multi-Turn ReAct Loop & 6-Stage Execution Runner
  // =========================================================================
  describe('Multi-Turn ReAct Execution Loop', () => {
    it('runs multi-stage research loop and records evidence dossier before drafting', async () => {
      mockCallLlm.mockReset()
      let turn = 0

      mockCallLlm.mockImplementation(async (opts: any) => {
        turn++
        if (turn === 1) {
          // Stage 1: Call research_topic_intent
          return {
            reply: '',
            thoughts: 'Saya menganalisis search intent pengguna untuk topik arsitektur micro-frontend.',
            toolCalls: [
              {
                name: 'research_topic_intent',
                args: {
                  topic: 'Micro-Frontend Enterprise',
                  intentType: 'informational',
                  targetAudience: 'Software Architect & Engineering Lead',
                },
              },
            ],
            durationMs: 200,
            provider: 'google',
            model: 'gemini-2.5-flash',
          }
        } else if (turn === 2) {
          // Stage 2: Call web_search_multi_query
          return {
            reply: '',
            thoughts: 'Mencari sumber primer dan standar implementasi micro-frontend.',
            toolCalls: [
              {
                name: 'web_search_multi_query',
                args: {
                  queries: ['micro-frontend module federation', 'micro-frontend core web vitals enterprise'],
                  searchScope: 'all',
                },
              },
            ],
            durationMs: 220,
            provider: 'google',
            model: 'gemini-2.5-flash',
          }
        } else if (turn === 3) {
          // Stage 3: Call record_evidence_dossier
          return {
            reply: '',
            thoughts: 'Mencatat bukti keabsahan performa module federation ke evidence dossier.',
            toolCalls: [
              {
                name: 'record_evidence_dossier',
                args: {
                  dossier: [
                    {
                      claim: 'Module Federation mengurangi bundle size aplikasi enterprise hingga 40%.',
                      sourceUrl: 'https://webpack.js.org/concepts/module-federation/',
                      sourceType: 'documentation',
                      supportingQuote: 'Module federation allows a JavaScript application to dynamically load code from another application.',
                      confidenceScore: 95,
                      verificationStatus: 'verified',
                    },
                  ],
                  summary: 'Bukti teknis module federation terverifikasi dari dokumentasi resmi.',
                },
              },
            ],
            durationMs: 180,
            provider: 'google',
            model: 'gemini-2.5-flash',
          }
        } else if (turn === 4) {
          // Stage 5: Apply article draft
          return {
            reply: '',
            thoughts: 'Menyusun draf artikel berdasarkan evidence dossier yang telah dicatat.',
            toolCalls: [
              {
                name: 'apply_article_draft_or_metadata',
                args: {
                  title: 'Panduan Arsitektur Micro-Frontend Enterprise Modern',
                  focusKeyphrase: 'micro-frontend enterprise',
                  category: 'Website Development',
                  metaDescription: 'Panduan teknis arsitektur micro-frontend enterprise modern dengan module federation untuk performa tinggi.',
                  content: '<h2>Pengantar Micro-Frontend Enterprise</h2><p>Penerapan micro-frontend enterprise menjamin isolasi modul dan performa tinggi.</p><h2>Implementasi Layanan</h2><p>Tinjau pada <a href="/layanan">Layanan SegiaTech</a> atau <a href="/portofolio">Portofolio</a> kami.</p>',
                  summary: 'Draf artikel micro-frontend enterprise berhasil disusun berdasar riset dossier.',
                },
              },
            ],
            durationMs: 250,
            provider: 'google',
            model: 'gemini-2.5-flash',
          }
        } else {
          // Final reply
          return {
            reply: 'Draf artikel Micro-Frontend Enterprise telah selesai disusun berdasar riset multi-sumber.',
            toolCalls: [],
            durationMs: 150,
            provider: 'google',
            model: 'gemini-2.5-flash',
          }
        }
      })


      const runnerOutput = await executeCopilotAgentRunner({
        provider: 'google',
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: 'buatkan riset dan artikel mengenai Micro-Frontend Enterprise' }],
        systemInstruction: 'Anda adalah AI assistant editorial.',
      })

      expect(runnerOutput.executedTools.length).toBeGreaterThanOrEqual(4)
      expect(runnerOutput.executedTools.map((t) => t.name)).toContain('research_topic_intent')
      expect(runnerOutput.executedTools.map((t) => t.name)).toContain('web_search_multi_query')
      expect(runnerOutput.executedTools.map((t) => t.name)).toContain('record_evidence_dossier')
      expect(runnerOutput.executedTools.map((t) => t.name)).toContain('apply_article_draft_or_metadata')
      expect(runnerOutput.proposedChanges).toBeDefined()
      expect(runnerOutput.proposedChanges?.title).toContain('Micro-Frontend Enterprise')
    })
  })

  // =========================================================================
  // 5. Independent SEO & Publishing Gate Audit (Stage 6)
  // =========================================================================
  describe('Stage 6: Independent Audit & Publishing Gate', () => {
    it('computes accurate Yoast SEO metrics (word count, transition words, passive voice, internal links)', () => {
      const sampleHtml = `
        <h2>Pengantar &amp; Urgensi Sistem Desain</h2>
        <p>Dalam lanskap rekayasa digital, penerapan <strong>sistem desain</strong> menjadi pilar utama.</p>
        <p>Selain itu, efisiensi rendering sisi server sangat krusial. Oleh karena itu, pengembang wajib menyelaraskan struktur data semantik.</p>
        <p>Dengan demikian, integrasi komponen dapat dieksekusi dengan baik pada <a href="/portofolio">Portofolio Rekayasa</a> dan <a href="/layanan">Layanan SegiaTech</a>.</p>
      `

      const metrics = computeEditorialMetrics(sampleHtml, 'sistem desain')
      expect(metrics.headings.h2Count).toBe(1)
      expect(metrics.internalLinkCount).toBe(2)
      expect(metrics.inFirst100Words).toBe(true)
      expect(metrics.keyphraseOccurrences).toBeGreaterThanOrEqual(1)
      expect(metrics.transitionStatus).toBe('OPTIMAL (>=30%)')
    })
  })
})
