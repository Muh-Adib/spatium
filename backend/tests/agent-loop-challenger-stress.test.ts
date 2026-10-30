import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseCandidateParts,
  normalizeToolCall,
  callLlm,
  type ExtractedCandidateParts,
} from '../src/lib/agent/llm'
import {
  runAgenticLoopEngine,
  executeAgenticArticleLoop,
  executeWithResilientRotation,
  maskApiKey,
  formatSseEvent,
  parseSseStream,
} from '../src/lib/ai/agent-loop'

/**
 * ============================================================================
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 1 AGENTIC LOOP & CANDIDATE PARSING
 * ============================================================================
 */

describe('Challenger M1: Adversarial Stress Testing on Candidate Parsing & Loop Invariants', () => {

  // ==========================================================================
  // Section 1: Malformed & Adversarial Gemini Payloads (parseCandidateParts)
  // ==========================================================================
  describe('1. Gemini Candidate Parsing Stress & Edge Cases', () => {
    it('handles completely empty or non-object candidate inputs gracefully', () => {
      const emptyInputs = [null, undefined, '', 0, false, {}, { content: null }, { content: {} }, { content: { parts: null } }, { content: { parts: 'not-an-array' } }]

      for (const input of emptyInputs) {
        const res = parseCandidateParts(input)
        expect(res).toEqual({
          text: '',
          thoughts: [],
          functionCalls: [],
          hasContent: false,
        })
      }
    })

    it('handles empty parts array without error', () => {
      const res = parseCandidateParts({ content: { parts: [] } })
      expect(res).toEqual({
        text: '',
        thoughts: [],
        functionCalls: [],
        hasContent: false,
      })
    })

    it('parses candidate with only thinking part (no text, no toolCalls)', () => {
      const candidate = {
        content: {
          parts: [
            { thought: true, text: 'Saya sedang menganalisis kepadatan kata kunci dan struktur kalimat...' },
          ],
        },
      }
      const res = parseCandidateParts(candidate)
      expect(res.text).toBe('')
      expect(res.thoughts).toHaveLength(1)
      expect(res.thoughts[0]).toContain('menganalisis')
      expect(res.functionCalls).toHaveLength(0)
      expect(res.hasContent).toBe(true) // Crucial invariant: hasContent MUST be true!
    })

    it('parses candidate with both thinking and functionCall parts (no regular text)', () => {
      const candidate = {
        content: {
          parts: [
            { thought: true, text: 'Rencana: Panggil tool inspect_article_seo terlebih dahulu.' },
            {
              functionCall: {
                name: 'inspect_article_seo',
                args: { slug: 'interactive-3d-aquarium' },
              },
            },
          ],
        },
      }
      const res = parseCandidateParts(candidate)
      expect(res.text).toBe('')
      expect(res.thoughts).toHaveLength(1)
      expect(res.thoughts[0]).toContain('Rencana:')
      expect(res.functionCalls).toHaveLength(1)
      expect(res.functionCalls[0].name).toBe('inspect_article_seo')
      expect(res.functionCalls[0].args).toEqual({ slug: 'interactive-3d-aquarium' })
      expect(res.hasContent).toBe(true)
    })

    it('handles parts with undefined or null text attributes', () => {
      const candidate = {
        content: {
          parts: [
            { text: undefined },
            { text: null },
            {},
            { thought: true, text: undefined },
            { thought: true, text: null },
            { functionCall: { name: 'test_tool', args: undefined } },
          ],
        },
      }
      const res = parseCandidateParts(candidate)
      expect(res.text).toBe('')
      expect(res.thoughts).toHaveLength(0)
      expect(res.functionCalls).toHaveLength(1)
      expect(res.functionCalls[0].name).toBe('test_tool')
      expect(res.functionCalls[0].args).toEqual({})
      expect(res.hasContent).toBe(true)
    })

    it('handles parts array containing null/undefined items without throwing TypeError', () => {
      const res = parseCandidateParts({
        content: {
          parts: [null as any, undefined as any, { text: 'Teks valid' }],
        },
      })
      expect(res.text).toBe('Teks valid')
      expect(res.hasContent).toBe(true)
    })

    it('handles whitespace-only text and whitespace-only thoughts', () => {
      const candidate = {
        content: {
          parts: [
            { text: '   \n  \t  ' },
            { thought: true, text: '   ' },
          ],
        },
      }
      const res = parseCandidateParts(candidate)
      expect(res.text).toBe('')
      expect(res.thoughts).toHaveLength(0) // whitespace thoughts are filtered
      expect(res.hasContent).toBe(false)
    })

    it('extracts multiple functionCalls in order', () => {
      const candidate = {
        content: {
          parts: [
            { functionCall: { name: 'inspect_article_seo', args: { slug: 'a' } } },
            { functionCall: { name: 'suggest_internal_links', args: { topic: 'WebGL' } } },
            { functionCall: { name: 'update_article_content', args: { title: 'New' } } },
          ],
        },
      }
      const res = parseCandidateParts(candidate)
      expect(res.functionCalls).toHaveLength(3)
      expect(res.functionCalls.map((f) => f.name)).toEqual([
        'inspect_article_seo',
        'suggest_internal_links',
        'update_article_content',
      ])
    })
  })

  // ==========================================================================
  // Section 2: Invariant Check: Zero-Empty Response Guard
  // ==========================================================================
  describe('2. Invariant: Under NO circumstances return "Tidak ada respons teks yang dihasilkan." when toolCalls or thoughts exist', () => {
    it('Gemini: reply is empty string (NOT error string) when toolCalls are present but text is empty', () => {
      const candidate = {
        content: {
          parts: [
            { functionCall: { name: 'update_article_content', args: { title: 'Test' } } },
          ],
        },
      }
      const parsed = parseCandidateParts(candidate)
      const toolCalls = parsed.functionCalls.length > 0 ? parsed.functionCalls : undefined
      const thoughts = parsed.thoughts.length > 0 ? parsed.thoughts.join('\n\n') : undefined

      let reply = parsed.text
      if (!reply && !toolCalls && !thoughts) {
        reply = 'Tidak ada respons teks yang dihasilkan.'
      }

      expect(reply).toBe('')
      expect(reply).not.toBe('Tidak ada respons teks yang dihasilkan.')
      expect(toolCalls).toBeDefined()
      expect(toolCalls).toHaveLength(1)
    })

    it('Gemini: reply is empty string (NOT error string) when thoughts are present but text is empty', () => {
      const candidate = {
        content: {
          parts: [
            { thought: true, text: 'Thinking about optimization...' },
          ],
        },
      }
      const parsed = parseCandidateParts(candidate)
      const toolCalls = parsed.functionCalls.length > 0 ? parsed.functionCalls : undefined
      const thoughts = parsed.thoughts.length > 0 ? parsed.thoughts.join('\n\n') : undefined

      let reply = parsed.text
      if (!reply && !toolCalls && !thoughts) {
        reply = 'Tidak ada respons teks yang dihasilkan.'
      }

      expect(reply).toBe('')
      expect(reply).not.toBe('Tidak ada respons teks yang dihasilkan.')
      expect(thoughts).toBe('Thinking about optimization...')
    })

    it('Gemini: returns error string ONLY when candidate has NO text, NO toolCalls, and NO thoughts', () => {
      const candidate = {
        content: {
          parts: [],
        },
      }
      const parsed = parseCandidateParts(candidate)
      const toolCalls = parsed.functionCalls.length > 0 ? parsed.functionCalls : undefined
      const thoughts = parsed.thoughts.length > 0 ? parsed.thoughts.join('\n\n') : undefined

      let reply = parsed.text
      if (!reply && !toolCalls && !thoughts) {
        reply = 'Tidak ada respons teks yang dihasilkan.'
      }

      expect(reply).toBe('Tidak ada respons teks yang dihasilkan.')
    })

    it('OpenRouter: reply is empty string when tool_calls are present and content is null', () => {
      const choice = {
        message: {
          content: null,
          tool_calls: [
            {
              id: 'call_123',
              type: 'function',
              function: { name: 'inspect_article_seo', arguments: '{"slug":"test"}' },
            },
          ],
        },
      }

      const rawToolCalls = choice.message.tool_calls
      const toolCalls = Array.isArray(rawToolCalls) && rawToolCalls.length > 0 ? rawToolCalls : undefined
      const thoughts = undefined

      let reply = (typeof choice.message.content === 'string' ? choice.message.content : '').trim()
      if (!reply && (!toolCalls || toolCalls.length === 0) && !thoughts) {
        reply = 'Tidak ada respons teks yang dihasilkan.'
      }

      expect(reply).toBe('')
      expect(reply).not.toBe('Tidak ada respons teks yang dihasilkan.')
      expect(toolCalls).toHaveLength(1)
    })

    it('OpenRouter: reply is empty string when reasoning is present and content is empty', () => {
      const choice = {
        message: {
          content: '',
          reasoning: 'Deep chain-of-thought analysis...',
        },
      }

      const rawToolCalls = (choice.message as any).tool_calls
      const toolCalls = Array.isArray(rawToolCalls) && rawToolCalls.length > 0 ? rawToolCalls : undefined
      const thoughts = (typeof choice.message.reasoning === 'string' ? choice.message.reasoning : '').trim() || undefined

      let reply = (typeof choice.message.content === 'string' ? choice.message.content : '').trim()
      if (!reply && (!toolCalls || toolCalls.length === 0) && !thoughts) {
        reply = 'Tidak ada respons teks yang dihasilkan.'
      }

      expect(reply).toBe('')
      expect(reply).not.toBe('Tidak ada respons teks yang dihasilkan.')
      expect(thoughts).toBe('Deep chain-of-thought analysis...')
    })
  })

  // ==========================================================================
  // Section 3: End-to-End callLlm Mocked Network Invariant Tests
  // ==========================================================================
  describe('3. End-to-End callLlm Output Invariants under Real Provider Payloads', () => {
    const originalFetch = global.fetch

    afterEach(() => {
      global.fetch = originalFetch
    })

    it('Gemini callLlm returns non-error empty reply with extracted toolCalls when API returns functionCall without text', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [
                  { thought: true, text: 'Thinking about inspecting article...' },
                  { functionCall: { name: 'inspect_article_seo', args: { slug: 'test' } } },
                ],
              },
            },
          ],
        }),
      })

      const res = await callLlm({
        provider: 'google',
        apiKey: 'AIzaSyFakeKeyForTesting1234567890',
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: 'Cek artikel' }],
      })

      expect(res.reply).toBe('')
      expect(res.reply).not.toBe('Tidak ada respons teks yang dihasilkan.')
      expect(res.thoughts).toBe('Thinking about inspecting article...')
      expect(res.toolCalls).toEqual([{ name: 'inspect_article_seo', args: { slug: 'test' } }])
    })

    it('OpenRouter callLlm returns non-error empty reply with extracted toolCalls when content is null', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              finish_reason: 'tool_calls',
              message: {
                role: 'assistant',
                content: null,
                reasoning: 'Analyzing keyword density...',
                tool_calls: [
                  {
                    id: 'call_999',
                    type: 'function',
                    function: {
                      name: 'update_article_content',
                      arguments: '{"slug":"test","title":"New Title"}',
                    },
                  },
                ],
              },
            },
          ],
        }),
      })

      const res = await callLlm({
        provider: 'openrouter',
        apiKey: 'sk-or-fake-key-for-testing-123456',
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: 'Update artikel' }],
      })

      expect(res.reply).toBe('')
      expect(res.reply).not.toBe('Tidak ada respons teks yang dihasilkan.')
      expect(res.thoughts).toBe('Analyzing keyword density...')
      expect(res.toolCalls).toHaveLength(1)
      expect(res.toolCalls?.[0].function.name).toBe('update_article_content')
    })

    it('Gemini callLlm returns fallback error string ONLY when candidates have zero text, zero thoughts, and zero toolCalls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'OTHER',
              content: {
                parts: [],
              },
            },
          ],
        }),
      })

      const res = await callLlm({
        provider: 'google',
        apiKey: 'AIzaSyFakeKeyForTesting1234567890',
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: 'Halo' }],
      })

      expect(res.reply).toBe('Tidak ada respons teks yang dihasilkan.')
      expect(res.thoughts).toBeUndefined()
      expect(res.toolCalls).toBeUndefined()
    })
  })

  // ==========================================================================
  // Section 4: Tool Call Normalization Robustness (normalizeToolCall)
  // ==========================================================================
  describe('4. Tool Call Normalization Robustness (normalizeToolCall)', () => {
    it('safely handles non-object, null, and undefined inputs', () => {
      expect(normalizeToolCall(null)).toEqual({ name: '', arguments: {} })
      expect(normalizeToolCall(undefined)).toEqual({ name: '', arguments: {} })
      expect(normalizeToolCall('string')).toEqual({ name: '', arguments: {} })
      expect(normalizeToolCall(123)).toEqual({ name: '', arguments: {} })
    })

    it('normalizes OpenAI format with valid JSON string arguments', () => {
      const tc = {
        id: 'call_abc123',
        type: 'function',
        function: {
          name: 'update_article_content',
          arguments: '{"slug":"aquarium","title":"New Title"}',
        },
      }
      const normalized = normalizeToolCall(tc)
      expect(normalized).toEqual({
        id: 'call_abc123',
        name: 'update_article_content',
        arguments: { slug: 'aquarium', title: 'New Title' },
      })
    })

    it('normalizes OpenAI format with malformed/broken JSON string arguments without crashing', () => {
      const tc = {
        id: 'call_err',
        type: 'function',
        function: {
          name: 'inspect_seo',
          arguments: '{"slug": broken json...}',
        },
      }
      const normalized = normalizeToolCall(tc)
      expect(normalized).toEqual({
        id: 'call_err',
        name: 'inspect_seo',
        arguments: {}, // Gracefully defaults to empty object
      })
    })

    it('normalizes Google Gemini format with pre-parsed object arguments', () => {
      const tc = {
        id: 'call_gemini',
        name: 'suggest_internal_links',
        args: { topic: 'WebGL', limit: 3 },
      }
      const normalized = normalizeToolCall(tc)
      expect(normalized).toEqual({
        id: 'call_gemini',
        name: 'suggest_internal_links',
        arguments: { topic: 'WebGL', limit: 3 },
      })
    })

    it('normalizes Google Gemini format with JSON string arguments', () => {
      const tc = {
        name: 'suggest_internal_links',
        args: '{"topic":"WebGL"}',
      }
      const normalized = normalizeToolCall(tc)
      expect(normalized).toEqual({
        id: undefined,
        name: 'suggest_internal_links',
        arguments: { topic: 'WebGL' },
      })
    })
  })

  // ==========================================================================
  // Section 5: Loop Termination Invariants & Clamping (runAgenticLoopEngine)
  // ==========================================================================
  describe('5. Loop Termination Invariants & Boundary Clamping', () => {
    it('strictly clamps maxSteps = 15 to exactly 10 iterations', async () => {
      let stepCounter = 0
      const stepsExecuted: number[] = []

      const result = await runAgenticLoopEngine({
        slug: 'test-clamp-upper',
        targetSeoScore: 100, // unreachable target
        targetReadabilityScore: 100,
        maxSteps: 15, // should be clamped to 10
        timeoutMs: 10000,
        stepExecutor: async (step, scores) => {
          stepCounter++
          stepsExecuted.push(step)
          return {
            mutated: true,
            newScores: { seo: 50, readability: 50 }, // below target
            summary: `Step ${step}`,
          }
        },
      })

      expect(stepCounter).toBe(10)
      expect(stepsExecuted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(result.totalStepsExecuted).toBe(10)
      expect(result.reachedMaxSteps).toBe(true)
      expect(result.completedCleanly).toBe(true)
    })

    it('strictly clamps maxSteps = 2 to exactly 5 iterations', async () => {
      let stepCounter = 0
      const stepsExecuted: number[] = []

      const result = await runAgenticLoopEngine({
        slug: 'test-clamp-lower',
        targetSeoScore: 100, // unreachable target
        targetReadabilityScore: 100,
        maxSteps: 2, // should be clamped to 5
        timeoutMs: 10000,
        stepExecutor: async (step, scores) => {
          stepCounter++
          stepsExecuted.push(step)
          return {
            mutated: true,
            newScores: { seo: 50, readability: 50 }, // below target
            summary: `Step ${step}`,
          }
        },
      })

      expect(stepCounter).toBe(5)
      expect(stepsExecuted).toEqual([1, 2, 3, 4, 5])
      expect(result.totalStepsExecuted).toBe(5)
      expect(result.reachedMaxSteps).toBe(true)
      expect(result.completedCleanly).toBe(true)
    })

    it('strictly clamps negative or zero maxSteps to floor 5', async () => {
      for (const invalidMax of [-5, 0, 1]) {
        let stepCounter = 0
        const result = await runAgenticLoopEngine({
          slug: 'test-clamp-zero',
          targetSeoScore: 100,
          targetReadabilityScore: 100,
          maxSteps: invalidMax,
          timeoutMs: 10000,
          stepExecutor: async (step) => {
            stepCounter++
            return {
              mutated: true,
              newScores: { seo: 50, readability: 50 },
              summary: `Step ${step}`,
            }
          },
        })

        expect(stepCounter).toBe(5)
        expect(result.totalStepsExecuted).toBe(5)
      }
    })

    it('halts immediately at step N when target criteria are met, regardless of maxSteps', async () => {
      let stepCounter = 0

      const result = await runAgenticLoopEngine({
        slug: 'test-early-stop',
        targetSeoScore: 85,
        targetReadabilityScore: 85,
        maxSteps: 10,
        timeoutMs: 10000,
        stepExecutor: async (step) => {
          stepCounter++
          if (step === 2) {
            // Target satisfied on step 2
            return {
              mutated: true,
              newScores: { seo: 95, readability: 90 },
              summary: 'Target met on step 2',
            }
          }
          return {
            mutated: true,
            newScores: { seo: 60, readability: 60 },
            summary: 'Step 1 partial',
          }
        },
      })

      expect(stepCounter).toBe(2)
      expect(result.totalStepsExecuted).toBe(2)
      expect(result.reachedMaxSteps).toBe(false)
      expect(result.finalScores).toEqual({ seo: 95, readability: 90 })
    })
  })

  // ==========================================================================
  // Section 6: Timeout Invariant & Clean Abort
  // ==========================================================================
  describe('6. Timeout Invariant & Execution Abort', () => {
    it('immediately rejects when timeoutMs <= 0', async () => {
      await expect(
        runAgenticLoopEngine({
          slug: 'test-zero-timeout',
          timeoutMs: 0,
          stepExecutor: async () => ({
            mutated: true,
            newScores: { seo: 50, readability: 50 },
            summary: '',
          }),
        })
      ).rejects.toThrow('Agent loop timeout exceeded (timeoutMs <= 0)')

      await expect(
        runAgenticLoopEngine({
          slug: 'test-negative-timeout',
          timeoutMs: -500,
          stepExecutor: async () => ({
            mutated: true,
            newScores: { seo: 50, readability: 50 },
            summary: '',
          }),
        })
      ).rejects.toThrow('Agent loop timeout exceeded (timeoutMs <= 0)')
    })

    it('aborts cleanly during loop execution when elapsed time exceeds timeoutMs', async () => {
      let stepCounter = 0

      await expect(
        runAgenticLoopEngine({
          slug: 'test-timeout-trigger',
          timeoutMs: 50, // very tight 50ms timeout
          maxSteps: 10,
          stepExecutor: async (step) => {
            stepCounter++
            // Simulate slow step execution
            await new Promise((resolve) => setTimeout(resolve, 40))
            return {
              mutated: true,
              newScores: { seo: 50, readability: 50 },
              summary: `Slow step ${step}`,
            }
          },
        })
      ).rejects.toThrow(/Agent loop timeout exceeded \(50ms\) at step \d/)

      // Verifies stepCounter ran at least 1 step before timeout caught it on step 2
      expect(stepCounter).toBeGreaterThanOrEqual(1)
    })
  })

  // ==========================================================================
  // Section 7: In-Memory Draft Context Fallback (Canvas Studio Mode)
  // ==========================================================================
  describe('7. In-Memory Draft Context Fallback for Unsaved Canvas Articles', () => {
    it('successfully runs agentic loop on unsaved in-memory draft without database record', async () => {
      const mockCanvasDraft = {
        title: 'Draf WebGL Baru Belum Tersimpan',
        content: '<p>Ini adalah konten baru yang belum tersimpan ke database.</p>',
        excerpt: 'Ringkasan draf',
        status: 'draft',
        focusKeyphrase: 'WebGL Baru',
        seoTitle: 'Draf WebGL Baru',
        metaDescription: 'Deskripsi meta draf',
        coverAlt: 'Alt text cover',
        category: 'Teknologi',
      }

      const eventsEmitted: string[] = []

      const result = await executeAgenticArticleLoop({
        slug: 'draf-webgl-baru-unsaved',
        articleContext: mockCanvasDraft,
        targetSeoScore: 80,
        targetReadabilityScore: 80,
        maxSteps: 5,
        onEvent: (event) => eventsEmitted.push(event),
      })

      expect(result.success).toBe(true)
      expect(result.completedCleanly).toBe(true)
      expect(result.proposedChanges).toBeDefined()
      expect(result.proposedChanges.title).toBeDefined()
      expect(result.reply).toContain('Optimasi Artikel Mandiri Selesai')
      expect(eventsEmitted).toContain('thinking')
      expect(eventsEmitted).toContain('article_mutation')
      expect(eventsEmitted).toContain('done')
    })
  })
})
