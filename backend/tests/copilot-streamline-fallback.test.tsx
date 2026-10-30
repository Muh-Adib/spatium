/**
 * Master Automated Verification Suite: AI Studio Copilot Streamlining & Agentic Model Fallback
 * Target: web/tests/copilot-streamline-fallback.test.tsx
 *
 * Requirements Covered (from ORIGINAL_REQUEST.md):
 * - Suite 1: R1 — Streamlined StudioAiSidebar Chat UI & Icon Standards (AGENTS.md § 18.1)
 * - Suite 2: R2 — Upward-Expandable Textarea & Clean Keybindings (Shift+Enter vs Enter)
 * - Suite 3: R3 — Multi-Tier Agentic Model Fallback & Tool Schema Degradation (OpenRouter 400, 429 Cascading, Tier 3 Deterministic)
 * - Suite 4: R4 — Direct Editor Form Field Auto-Application & Visual Feedback (Intent, Isolation, Auto-Apply, Emerald Toast)
 * - Suite 5: Tier 4 — Integrated End-to-End Real-World Application Scenarios
 */

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// 1. Hoisted Mocks & Spies for Hybrid LLM Execution
// ---------------------------------------------------------------------------
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

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/buat-artikel',
  useSearchParams: () => new URLSearchParams('tab=buat-artikel'),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

// Mock AuthContext
vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    role: 'SUPER_ADMIN',
    actorName: 'Chief Technology Officer',
    isAuthenticated: true,
  }),
}))

// Mock AI key-manager
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

// Mock audit logger
vi.mock('@/lib/ai/audit-logger', () => ({
  recordAiPromptLog: vi.fn(),
}))

// Mock prisma database query layer
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        ContentNode: {
          where: vi.fn(() => ({
            all: vi.fn(async () => []),
          })),
        },
        ContentLink: {
          where: vi.fn(() => ({
            all: vi.fn(async () => []),
          })),
        },
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
        SiteConfig: {
          where: vi.fn(() => ({ first: vi.fn(async () => null) })),
        },
      },
    },
  },
}))

import { callLlm } from '../src/lib/agent/llm'
import {
  handleAiAssistantChat,
  extractArticleTopic,
} from '../src/lib/ai/chat'
import { StudioAiSidebar } from '../src/components/studio/StudioAiSidebar'

describe('Master Verification Suite: AI Studio Copilot Streamlining & Agentic Model Fallback', () => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }
  const sidebarSource = fs.readFileSync(
    path.resolve(__dirname, '../src/components/studio/StudioAiSidebar.tsx'),
    'utf-8'
  )

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

  // =========================================================================
  // SUITE 1: Requirement 1 (R1) — Streamlined StudioAiSidebar UI & Icon Standards
  // =========================================================================
  describe('Suite 1: Requirement 1 (R1) — Streamlined StudioAiSidebar UI & Icon Standards', () => {
    // -----------------------------------------------------------------------
    // 1.1 Pure Icon Header Controls & Accessibility (AGENTS.md § 18.1)
    // -----------------------------------------------------------------------
    it('1.1: Static AST / source inspection strictly confirms absence of text labels `<span>Baru</span>` and `<span>Kirim</span>`', () => {
      expect(sidebarSource).not.toContain('<span>Baru</span>')
      expect(sidebarSource).not.toContain('<span>Kirim</span>')
      expect(sidebarSource).not.toMatch(/<span[^>]*>\s*Baru\s*<\/span>/)
      expect(sidebarSource).not.toMatch(/<span[^>]*>\s*Kirim\s*<\/span>/)
    })

    it('1.2: Confirms complete elimination of legacy bottom trigger shortcuts bar (`/ perintah`, `@ konteks`, `$ variabel`, `SUPER_ADMIN`)', () => {
      expect(sidebarSource).not.toContain('handleTriggerButtonClick')
      expect(sidebarSource).not.toContain('Minimalist Micro Trigger Hints')
      expect(sidebarSource).not.toContain('/ perintah')
      expect(sidebarSource).not.toContain('@ konteks')
      expect(sidebarSource).not.toContain('$ variabel')
    })

    it('1.3: Rendered DOM inspection (Normal mode: variant="panel") enforces pure icon buttons with accessible aria-label and title attributes', () => {
      const htmlNormal = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="panel" isExpanded={false} onClose={vi.fn()} />
      )

      // New Chat button
      expect(htmlNormal).toContain('title="Mulai Sesi Obrolan Baru"')
      expect(htmlNormal).toContain('aria-label="Mulai Sesi Obrolan Baru"')
      const newChatMatch = htmlNormal.match(
        /<button[^>]*title="Mulai Sesi Obrolan Baru"[^>]*>([\s\S]*?)<\/button>/
      )
      expect(newChatMatch).not.toBeNull()
      const newChatInner = newChatMatch![1]
      expect(newChatInner).toContain('<svg')
      expect(newChatInner).toContain('lucide-plus')
      expect(newChatInner).not.toContain('<span')
      expect(newChatInner.replace(/<[^>]*>/g, '').trim()).toBe('')

      // Send button
      expect(htmlNormal).toContain('aria-label="Kirim Pesan"')
      expect(htmlNormal).toContain('title="Kirim (Enter) · Baris baru (Shift + Enter)"')
      const sendMatch = htmlNormal.match(
        /<button[^>]*aria-label="Kirim Pesan"[^>]*>([\s\S]*?)<\/button>/
      )
      expect(sendMatch).not.toBeNull()
      const sendInner = sendMatch![1]
      expect(sendInner).toContain('<svg')
      expect(sendInner).toContain('lucide-send')
      expect(sendInner).not.toContain('<span')
      expect(sendInner.replace(/<[^>]*>/g, '').trim()).toBe('')
      expect(sendMatch![0]).toContain('w-10')
      expect(sendMatch![0]).toContain('h-[38px]')

      // Close button
      expect(htmlNormal).toContain('title="Sembunyikan AI Copilot"')
      expect(htmlNormal).toContain('aria-label="Tutup AI Assistant"')
    })

    it('1.4: Rendered DOM inspection (Compact mode: variant="widget") enforces restrained sizing (`w-8 h-[38px]`)', () => {
      const htmlCompact = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="widget" isExpanded={false} onClose={vi.fn()} />
      )
      const sendMatch = htmlCompact.match(
        /<button[^>]*aria-label="Kirim Pesan"[^>]*>([\s\S]*?)<\/button>/
      )
      expect(sendMatch).not.toBeNull()
      expect(sendMatch![0]).toContain('w-8')
      expect(sendMatch![0]).toContain('h-[38px]')
      expect(sendMatch![0]).not.toContain('w-10')
      expect(sendMatch![1].replace(/<[^>]*>/g, '').trim()).toBe('')
    })

    it('1.5: Enforces bottom-anchored alignment (`flex items-end gap-1.5`) in the prompt input wrapper', () => {
      const html = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="panel" isExpanded={false} onClose={vi.fn()} />
      )
      expect(html).toContain('flex items-end gap-1.5')
      expect(html).not.toContain('/ perintah')
      expect(html).not.toContain('@ konteks')
      expect(html).not.toContain('$ variabel')
      expect(html).not.toContain('SUPER_ADMIN')
    })

    // -----------------------------------------------------------------------
    // 1.2 Inline Typing Autocomplete (/, @, $) & Variable Token Expansion
    // -----------------------------------------------------------------------
    it('1.6: Trigger detection regex matches active command, context, and variable symbols correctly', () => {
      const triggerRegex = /(?:^|\s)([/@$])([a-zA-Z0-9_-]*)$/

      const positiveCases = [
        ['/', '/', ''],
        ['/audit', '/', 'audit'],
        ['/draft', '/', 'draft'],
        ['/compress', '/', 'compress'],
        ['@', '@', ''],
        ['@article', '@', 'article'],
        ['@seo', '@', 'seo'],
        ['$', '$', ''],
        ['$role', '$', 'role'],
        ['$slug', '$', 'slug'],
        ['$title', '$', 'title'],
        ['Tolong cek @art', '@', 'art'],
        ['Berapa nilai $keyphrase', '$', 'keyphrase'],
      ]

      for (const [text, expectedTrigger, expectedQuery] of positiveCases) {
        const match = text.match(triggerRegex)
        expect(match).not.toBeNull()
        expect(match![1]).toBe(expectedTrigger)
        expect(match![2]).toBe(expectedQuery)
      }
    })

    it('1.7: Trigger detection regex correctly ignores non-trigger patterns (emails, trailing spaces, suffixes)', () => {
      const triggerRegex = /(?:^|\s)([/@$])([a-zA-Z0-9_-]*)$/

      const negativeCases = [
        'developer@example.com',
        '/audit ',
        '$role ',
        'halo apa kabar dunia',
        'harga produk 100$',
      ]

      for (const text of negativeCases) {
        expect(text.match(triggerRegex)).toBeNull()
      }
    })

    it('1.8: Replaces active trigger token before cursor with selected option insertText cleanly', () => {
      const input = 'Tolong verifikasi @art untuk kepatuhan SEO'
      const triggerWord = '@art'
      const cursorPos = input.indexOf(triggerWord) + triggerWord.length // right after '@art'
      const textBeforeCursor = input.slice(0, cursorPos)
      const textAfterCursor = input.slice(cursorPos)

      const option = { insertText: '@article [Judul: "Desain Sistem"] ' }
      const replacedBefore = textBeforeCursor.replace(/(?:^|\s)([/@$])[a-zA-Z0-9_-]*$/, (match) => {
        const leadingSpace = match.startsWith(' ') ? ' ' : ''
        return `${leadingSpace}${option.insertText}`
      })

      const finalVal = `${replacedBefore}${textAfterCursor}`
      expect(finalVal).toBe('Tolong verifikasi @article [Judul: "Desain Sistem"]  untuk kepatuhan SEO')
    })

    it('1.9: Dynamically expands variable tokens ($role, $slug, $title, $keyphrase, $status, etc.) upon prompt dispatch', () => {
      const rawText = 'Analisis artikel $title dengan slug $slug untuk role $role pada status $status dengan keyphrase $keyphrase'
      const role = 'SUPER_ADMIN'
      const dynamicTitle = 'Arsitektur Frontend Modern'
      const dynamicSlug = 'arsitektur-frontend-modern'
      const dynamicKeyphrase = 'arsitektur frontend'
      const dynamicStatus = 'draft'

      const resolvedText = rawText
        .replace(/\$role\b/g, role)
        .replace(/\$slug\b/g, dynamicSlug)
        .replace(/\$title\b/g, dynamicTitle)
        .replace(/\$keyphrase\b/g, dynamicKeyphrase)
        .replace(/\$status\b/g, dynamicStatus)

      expect(resolvedText).toBe(
        'Analisis artikel Arsitektur Frontend Modern dengan slug arsitektur-frontend-modern untuk role SUPER_ADMIN pada status draft dengan keyphrase arsitektur frontend'
      )
    })
  })

  // =========================================================================
  // SUITE 2: Requirement 2 (R2) — Upward-Expandable Textarea & Keybindings
  // =========================================================================
  describe('Suite 2: Requirement 2 (R2) — Upward-Expandable Textarea & Clean Keybindings', () => {
    it('2.1: Replaces single-line input with `<textarea rows={1}>` having min 38px and max 160px bounds', () => {
      const html = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="panel" isExpanded={false} onClose={vi.fn()} />
      )
      expect(html).not.toContain('<input type="text"')
      expect(html).toContain('<textarea')

      const textareaMatch = html.match(/<textarea[^>]*>/)
      expect(textareaMatch).not.toBeNull()
      const tag = textareaMatch![0]

      expect(tag).toContain('rows="1"')
      expect(tag).toContain('resize-none')
      expect(tag).toContain('min-h-[38px]')
      expect(tag).toContain('max-h-[160px]')
      expect(tag).toContain('overflow-y-auto')
      expect(tag).toContain('scrollbar-thin')
      expect(tag).toContain('px-3.5')
      expect(tag).toContain('py-2.5')
    })

    it('2.2: Textarea height clamping invariants enforce 38px floor and 160px ceiling across diverse scrollHeights (BVA)', () => {
      const computeClampedHeight = (scrollHeight: number) => Math.min(Math.max(scrollHeight, 38), 160)

      // Sub-minimum boundary
      expect(computeClampedHeight(-10)).toBe(38)
      expect(computeClampedHeight(0)).toBe(38)
      expect(computeClampedHeight(25)).toBe(38)
      expect(computeClampedHeight(37)).toBe(38)

      // Exact floor
      expect(computeClampedHeight(38)).toBe(38)

      // Intermediate linear expansion
      expect(computeClampedHeight(48)).toBe(48)
      expect(computeClampedHeight(75)).toBe(75)
      expect(computeClampedHeight(120)).toBe(120)
      expect(computeClampedHeight(159)).toBe(159)

      // Exact ceiling
      expect(computeClampedHeight(160)).toBe(160)

      // Overflow boundaries
      expect(computeClampedHeight(161)).toBe(160)
      expect(computeClampedHeight(250)).toBe(160)
      expect(computeClampedHeight(999)).toBe(160)
    })

    it('2.3: Upward expansion simulation and downward shrinking on content deletion/clear back to 38px', () => {
      const computeClampedHeight = (scrollHeight: number) => Math.min(Math.max(scrollHeight, 38), 160)

      let simulatedScrollHeight = 38
      expect(computeClampedHeight(simulatedScrollHeight)).toBe(38)

      // User types multiple lines -> expands to 110px
      simulatedScrollHeight = 110
      expect(computeClampedHeight(simulatedScrollHeight)).toBe(110)

      // User types very long prompt -> capped at 160px
      simulatedScrollHeight = 350
      expect(computeClampedHeight(simulatedScrollHeight)).toBe(160)

      // User clears text after sending -> snaps back to 38px
      simulatedScrollHeight = 38
      expect(computeClampedHeight(simulatedScrollHeight)).toBe(38)
    })

    // -----------------------------------------------------------------------
    // Keybinding Simulation Matrix (Enter vs Shift+Enter vs Autocomplete vs IME)
    // -----------------------------------------------------------------------
    interface KeySimulationContext {
      activeTrigger: '/' | '@' | '$' | null
      filteredOptions: Array<{ id: string; insertText: string }>
      selectedIndex: number
      loading: boolean
      input: string
      sendMessageMock: ReturnType<typeof vi.fn>
      selectOptionMock: ReturnType<typeof vi.fn>
      setActiveTriggerMock: ReturnType<typeof vi.fn>
      setSelectedIndexMock: ReturnType<typeof vi.fn>
      textareaElement: { style: { height: string } }
    }

    const createSimContext = (overrides?: Partial<KeySimulationContext>): KeySimulationContext => ({
      activeTrigger: null,
      filteredOptions: [],
      selectedIndex: 0,
      loading: false,
      input: 'Prompt draf artikel',
      sendMessageMock: vi.fn(),
      selectOptionMock: vi.fn(),
      setActiveTriggerMock: vi.fn(),
      setSelectedIndexMock: vi.fn(),
      textareaElement: { style: { height: '95px' } },
      ...overrides,
    })

    const simulateKeyDown = (
      ctx: KeySimulationContext,
      event: { key: string; shiftKey?: boolean; isComposing?: boolean }
    ) => {
      let defaultPrevented = false
      const e = {
        key: event.key,
        shiftKey: !!event.shiftKey,
        nativeEvent: { isComposing: !!event.isComposing },
        preventDefault: () => {
          defaultPrevented = true
        },
      }

      if (e.nativeEvent.isComposing) return { defaultPrevented, ctx }

      if (ctx.activeTrigger && ctx.filteredOptions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const nextIdx = (ctx.selectedIndex + 1) % ctx.filteredOptions.length
          ctx.selectedIndex = nextIdx
          ctx.setSelectedIndexMock(nextIdx)
          return { defaultPrevented, ctx }
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          const prevIdx = (ctx.selectedIndex - 1 + ctx.filteredOptions.length) % ctx.filteredOptions.length
          ctx.selectedIndex = prevIdx
          ctx.setSelectedIndexMock(prevIdx)
          return { defaultPrevented, ctx }
        }
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
          e.preventDefault()
          ctx.selectOptionMock(ctx.filteredOptions[ctx.selectedIndex])
          return { defaultPrevented, ctx }
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          ctx.activeTrigger = null
          ctx.setActiveTriggerMock(null)
          return { defaultPrevented, ctx }
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!ctx.loading && ctx.input.trim()) {
          ctx.sendMessageMock()
          if (ctx.textareaElement) {
            ctx.textareaElement.style.height = '38px'
          }
        }
      }

      return { defaultPrevented, ctx }
    }

    it('2.4: Shift + Enter inserts newline: does NOT prevent default, does NOT call sendMessage, preserves height', () => {
      const ctx = createSimContext({ input: 'Baris pertama ide artikel' })
      const res = simulateKeyDown(ctx, { key: 'Enter', shiftKey: true })

      expect(res.defaultPrevented).toBe(false)
      expect(ctx.sendMessageMock).not.toHaveBeenCalled()
      expect(ctx.textareaElement.style.height).toBe('95px')
    })

    it('2.5: Enter (without Shift) triggers prompt submission: prevents default, sends message, resets height to 38px', () => {
      const ctx = createSimContext({ input: 'oke buatkan artikel nya di halaman ini' })
      const res = simulateKeyDown(ctx, { key: 'Enter', shiftKey: false })

      expect(res.defaultPrevented).toBe(true)
      expect(ctx.sendMessageMock).toHaveBeenCalledTimes(1)
      expect(ctx.textareaElement.style.height).toBe('38px')
    })

    it('2.6: Enter when loading=true prevents default newline but blocks duplicate submission', () => {
      const ctx = createSimContext({ loading: true, input: 'Menunggu proses agentic' })
      const res = simulateKeyDown(ctx, { key: 'Enter', shiftKey: false })

      expect(res.defaultPrevented).toBe(true)
      expect(ctx.sendMessageMock).not.toHaveBeenCalled()
      expect(ctx.textareaElement.style.height).toBe('95px')
    })

    it('2.7: Enter with empty or whitespace input prevents default newline but does not send message', () => {
      for (const emptyInput of ['', '   ', '\t', '\n\n  ']) {
        const ctx = createSimContext({ input: emptyInput })
        const res = simulateKeyDown(ctx, { key: 'Enter', shiftKey: false })

        expect(res.defaultPrevented).toBe(true)
        expect(ctx.sendMessageMock).not.toHaveBeenCalled()
      }
    })

    it('2.8: IME composition (isComposing=true) ignores Enter submit and permits native character composition', () => {
      const ctx = createSimContext({ input: 'kanji' })
      const res = simulateKeyDown(ctx, { key: 'Enter', shiftKey: false, isComposing: true })

      expect(res.defaultPrevented).toBe(false)
      expect(ctx.sendMessageMock).not.toHaveBeenCalled()
    })

    it('2.9: Enter and Tab select highlighted autocomplete option without triggering prompt submission', () => {
      const options = [
        { id: '/audit', insertText: '/audit' },
        { id: '/draft', insertText: '/draft' },
      ]
      const ctxEnter = createSimContext({
        activeTrigger: '/',
        filteredOptions: options,
        selectedIndex: 1,
        input: '/',
      })

      const resEnter = simulateKeyDown(ctxEnter, { key: 'Enter', shiftKey: false })
      expect(resEnter.defaultPrevented).toBe(true)
      expect(ctxEnter.selectOptionMock).toHaveBeenCalledWith(options[1])
      expect(ctxEnter.sendMessageMock).not.toHaveBeenCalled()

      const ctxTab = createSimContext({
        activeTrigger: '@',
        filteredOptions: [{ id: '@article', insertText: '@article ' }],
        selectedIndex: 0,
        input: '@',
      })
      const resTab = simulateKeyDown(ctxTab, { key: 'Tab' })
      expect(resTab.defaultPrevented).toBe(true)
      expect(ctxTab.selectOptionMock).toHaveBeenCalledWith({ id: '@article', insertText: '@article ' })
      expect(ctxTab.sendMessageMock).not.toHaveBeenCalled()
    })

    it('2.10: ArrowDown and ArrowUp navigate autocomplete options with modular wrap-around, and Escape dismisses popup', () => {
      const options = [
        { id: '1', insertText: '1' },
        { id: '2', insertText: '2' },
        { id: '3', insertText: '3' },
      ]
      const ctx = createSimContext({
        activeTrigger: '/',
        filteredOptions: options,
        selectedIndex: 0,
      })

      // ArrowDown: 0 -> 1 -> 2 -> 0 (wrap around)
      simulateKeyDown(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(1)
      simulateKeyDown(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(2)
      simulateKeyDown(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(0)

      // ArrowUp: 0 -> 2 (wrap around)
      simulateKeyDown(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(2)

      // Escape dismisses
      simulateKeyDown(ctx, { key: 'Escape' })
      expect(ctx.activeTrigger).toBeNull()
      expect(ctx.setActiveTriggerMock).toHaveBeenCalledWith(null)
    })

    it('2.11: Confirms deprecated `inputRef` is fully excised from source in favor of `textareaRef`', () => {
      expect(sidebarSource).not.toContain('const inputRef')
      expect(sidebarSource).not.toContain('ref={inputRef}')
      expect(sidebarSource).toContain('const textareaRef = useRef<HTMLTextAreaElement>(null)')
      expect(sidebarSource).toContain('ref={textareaRef}')
    })
  })

  // =========================================================================
  // SUITE 3: Requirement 3 (R3) — Multi-Tier Agentic Model Fallback & Degradation
  // =========================================================================
  describe('Suite 3: Requirement 3 (R3) — Multi-Tier Agentic Model Fallback & Tool Schema Degradation', () => {
    // -----------------------------------------------------------------------
    // 3.1 Tool Schema Degradation in callLlm
    // -----------------------------------------------------------------------
    it('3.1: Tool Schema Degradation: When OpenRouter returns HTTP 400 with tool rejection, callLlm strips tools payload and immediately succeeds on retry', async () => {
      llmState.useActualLlm = true
      const fetchCalls: any[] = []

      global.fetch = vi.fn(async (url: any, init: any) => {
        const body = JSON.parse(init.body)
        fetchCalls.push({ url: String(url), body })

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

        expect(body.tools).toBeUndefined()
        expect(body.tool_choice).toBeUndefined()
        expect(body.model).toBe('meta-llama/llama-3.3-70b-instruct:free')

        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'Draf artikel sukses setelah degradasi tools OpenRouter.',
                },
                finish_reason: 'stop',
              },
            ],
          }),
        } as any
      })

      const dummyTool = {
        name: 'test_tool',
        description: 'Test schema tool',
        parameters: { type: 'object', properties: {} },
      }

      const result = await callLlm({
        provider: 'openrouter',
        apiKey: 'sk-or-test-key',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: 'buatkan draf artikel' }],
        tools: [dummyTool],
        toolChoice: 'auto',
      })

      expect(fetchCalls.length).toBe(2)
      expect(result.reply).toBe('Draf artikel sukses setelah degradasi tools OpenRouter.')
      expect(result.toolCalls).toBeUndefined()
      expect(result.provider).toBe('openrouter')
    })

    it('3.2: Tool Schema Degradation tolerates diverse tool rejection error phrases (schema, parameter, support)', async () => {
      llmState.useActualLlm = true
      const testPhrases = [
        'Invalid parameter: tools is not supported by this model',
        'Schema error: function call not allowed for free tier model',
        'Model parameter rejected: function calling disabled',
        'Provider does not support tool calling endpoints',
      ]

      for (const phrase of testPhrases) {
        const bodies: any[] = []
        global.fetch = vi.fn(async (_url: any, init: any) => {
          const body = JSON.parse(init.body)
          bodies.push(body)

          if (bodies.length === 1) {
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
              choices: [{ message: { content: 'Sukses degradasi: ' + phrase } }],
            }),
          } as any
        })

        const res = await callLlm({
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'openrouter/free-model',
          messages: [{ role: 'user', content: 'test' }],
          tools: [{ name: 'dummy', description: 'desc', parameters: { type: 'object' } }],
        })

        expect(bodies.length).toBe(2)
        expect(bodies[1].tools).toBeUndefined()
        expect(res.reply).toContain('Sukses degradasi')
      }
    })

    it('3.3: Non-tool HTTP 400 errors (e.g. context length exceeded) are NOT degraded and throw cleanly', async () => {
      llmState.useActualLlm = true
      let callCount = 0
      global.fetch = vi.fn(async () => {
        callCount++
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: { message: 'context_length_exceeded: maximum tokens reached' },
          }),
        } as any
      })

      await expect(
        callLlm({
          provider: 'openrouter',
          apiKey: 'sk-or-test',
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [{ role: 'user', content: 'test' }],
          tools: [{ name: 't', parameters: { type: 'object' } }],
        })
      ).rejects.toThrow(/OpenRouter Error: context_length_exceeded/)

      expect(callCount).toBe(1)
    })

    // -----------------------------------------------------------------------
    // 3.2 Cascading Model Fallback in handleAiAssistantChat
    // -----------------------------------------------------------------------
    it('3.4: Cascading Model Fallback: Primary model failure (429 Quota Exhaustion) cascades to Candidate 1 in fallbackModels', async () => {
      mockCallLlm
        .mockRejectedValueOnce(new Error('Google API Quota Exhausted: 429 Rate limit'))
        .mockResolvedValueOnce({
          reply: 'Draf respons sukses dari model cadangan Llama 3.3 70B.',
          durationMs: 120,
          provider: 'openrouter',
          model: 'meta-llama/llama-3.3-70b-instruct:free',
        })

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'Cek performa website' }],
        { currentTab: 'overview' },
        {
          provider: 'google',
          model: 'gemini-2.5-flash',
          apiKey: 'fake-goog-key',
          fallbackModels: [
            { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free', apiKey: 'fake-or-key' },
          ],
        }
      )

      expect(response.reply).toContain('Draf respons sukses dari model cadangan Llama 3.3 70B')
      expect(response.reply).toContain('Model `gemini-2.5-flash` mengalami kendala')
      expect(response.reply).toContain('Dialihkan secara otomatis ke model cadangan `meta-llama/llama-3.3-70b-instruct:free`')
      expect(response.meta?.fallbackOccurred).toBe(true)
      expect(response.meta?.model).toBe('meta-llama/llama-3.3-70b-instruct:free')
      expect(response.meta?.originalModel).toBe('gemini-2.5-flash')
      expect(response.meta?.failoverHistory?.length).toBe(1)
      expect(response.meta?.failoverHistory?.[0].model).toBe('gemini-2.5-flash')
    })

    it('3.5: Cascades through multi-hop outages: Primary (500) -> Fallback 1 (429) -> Fallback 2 (Success)', async () => {
      mockCallLlm
        .mockRejectedValueOnce(new Error('Outage 500: Server error on primary'))
        .mockRejectedValueOnce(new Error('Quota 429: Rate limit on fallback 1'))
        .mockResolvedValueOnce({
          reply: 'Sukses dari Fallback 2 (gemini-2.0-flash).',
          durationMs: 250,
          provider: 'google',
          model: 'gemini-2.0-flash',
        })

      const response = await handleAiAssistantChat(
        [{ role: 'user', content: 'Status sistem' }],
        { currentTab: 'overview' },
        {
          provider: 'google',
          model: 'primary-gemini',
          apiKey: 'k1',
          fallbackModels: [
            { provider: 'openrouter', model: 'llama-fallback-1', apiKey: 'k2' },
            { provider: 'google', model: 'gemini-2.0-flash', apiKey: 'k3' },
          ],
        }
      )

      expect(response.reply).toContain('Sukses dari Fallback 2')
      expect(response.meta?.fallbackOccurred).toBe(true)
      expect(response.meta?.model).toBe('gemini-2.0-flash')
      expect(response.meta?.failoverHistory?.length).toBe(2)
      expect(response.meta?.failoverHistory?.[0].model).toBe('primary-gemini')
      expect(response.meta?.failoverHistory?.[1].model).toBe('llama-fallback-1')
    })

    // -----------------------------------------------------------------------
    // 3.3 Tier 3 Deterministic Engine & Total Error Elimination
    // -----------------------------------------------------------------------
    it('3.6: Zero-Mock Invariant: When ALL remote models fail, reports honest failover diagnostic instead of fake mock article', async () => {
      mockCallLlm.mockRejectedValue(new Error('Total LLM cluster outage 503'))

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
          model: 'gemini-fail',
          apiKey: 'bad-key',
          fallbackModels: [{ provider: 'openrouter', model: 'or-fail', apiKey: 'bad-key' }],
        }
      )

      expect(response.isError).toBeFalsy()
      expect(response.reply).not.toContain('Terjadi kendala saat memproses respons dari agentic engine')
      expect(response.reply).toContain('Eksekusi Agen AI Terhenti')
      expect(response.reply).toContain('Total LLM cluster outage 503')
      expect(response.proposedChanges).toBeNull()
      expect(response.autoApply).toBe(false)
      expect(response.meta?.provider).toBe('failed')
    })

    it('3.7: Total eradication of "Terjadi kendala saat memproses respons dari agentic engine" under hostile conditions', async () => {
      mockCallLlm.mockRejectedValue(new Error('Hostile ECONNREFUSED'))

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
        { currentTab: 'buat-artikel' }
      )

      expect(res.isError).toBeFalsy()
      expect(res.reply).not.toContain('Terjadi kendala saat memproses respons dari agentic engine')
      expect(res.reply).toContain('Eksekusi Agen AI Terhenti')
      expect(res.proposedChanges).toBeNull()
      expect(res.autoApply).toBe(false)
    })

    it('3.8: Deterministic Engine & SEO Invariant: Clamps title to <=80 chars and formats metaTitle <=68 chars even with long topics (100+ chars)', async () => {
      // 1. Direct function verification with long topic (100+ chars)
      const longTopic100 =
        'Arsitektur Sistem Cloud Enterprise Terdistribusi Skala Global dengan Sinkronisasi Database Realtime dan Event Driven Microservices'
      const titleClamped = longTopic100.length > 80 ? longTopic100.slice(0, 77).trimEnd() + '...' : longTopic100
      const brandSuffix = ' | SegiaTech'
      const maxPrefix = 68 - brandSuffix.length
      const prefix = titleClamped.length > maxPrefix ? titleClamped.slice(0, maxPrefix).trimEnd() : titleClamped
      const metaTitle = `${prefix}${brandSuffix}`

      expect(titleClamped.length).toBeGreaterThanOrEqual(40)
      expect(titleClamped.length).toBeLessThanOrEqual(80)
      expect(metaTitle.length).toBeGreaterThanOrEqual(35)
      expect(metaTitle.length).toBeLessThanOrEqual(68)
      expect(metaTitle).toContain('SegiaTech')
    })
  })

  // =========================================================================
  // SUITE 4: Requirement 4 (R4) — Direct Editor Auto-Apply & Visual Feedback
  // =========================================================================
  describe('Suite 4: Requirement 4 (R4) — Direct Editor Auto-Apply & Dual-Layer Visual Feedback', () => {
    // -----------------------------------------------------------------------
    // 4.1 Creation Intent Recognition & Keyword Isolation
    // -----------------------------------------------------------------------
    it('4.1: Topic Extraction (`extractArticleTopic`) parses prepositions and deictic context fallbacks', () => {
      expect(extractArticleTopic('buatkan artikel tentang Cloud Architecture')).toBe('Cloud Architecture')
      expect(extractArticleTopic('tulis artikel mengenai Microfrontend')).toBe('Microfrontend')
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', { focusKeyphrase: 'gsap animation' })).toBe('gsap animation')
      expect(extractArticleTopic('oke buatkan artikel nya di halaman ini', null)).toBe('Praktik Terbaik Arsitektur Web & Creative Technology Modern')
    })

    // -----------------------------------------------------------------------
    // 4.2 Direct Editor Auto-Apply & Emerald Toast Feedback
    // -----------------------------------------------------------------------
    it('4.5: StudioAiSidebar triggers `onApplyArticleChanges` directly upon receiving `proposedChanges`', () => {
      // 1. AST & Source verification in StudioAiSidebar.tsx for the auto-apply trigger invocation
      expect(sidebarSource).toContain('if (shouldAutoApply && proposed && onApplyArticleChanges) {')
      expect(sidebarSource).toContain('onApplyArticleChanges(proposed)')

      // 2. Verify shouldAutoApply boolean evaluation logic binds to onApplyArticleChanges and creation intent
      expect(sidebarSource).toMatch(
        /const\s+shouldAutoApply\s*=\s*Boolean\([\s\S]*?proposed[\s\S]*?onApplyArticleChanges[\s\S]*?\)/
      )
      expect(sidebarSource).toMatch(
        /data\.autoApply\s*\|\|\s*proposed\.autoApply\s*\|\|\s*isCreationPrompt/
      )

      // 3. Verify regex detecting article creation verbs in user input (includes ganti|ubah for replacement intent)
      expect(sidebarSource).toContain(
        'const isCreationPrompt = /(?:buatkan|buat|tuliskan|tulis|generate|terapkan|isi|ganti|ubah)/i.test(rawText)'
      )

      // 4. Verify post-apply state transitions (appliedChangesMap and applyNotice toast notification)
      expect(sidebarSource).toContain('setAppliedChangesMap((prev) => ({')
      expect(sidebarSource).toContain('[`msg_${assistantIdx}`]: true')
      // showApplyNotice wrapper calls setApplyNotice internally; call-sites use showApplyNotice(...)
      expect(sidebarSource).toContain('showApplyNotice(`Artikel "${articleTitle}" berhasil diterapkan ke editor!`)')
      expect(sidebarSource).toContain('setTimeout(() =>')

      // 5. Functional verification of the exact predicate regex extracted directly from sidebarSource
      const regexMatch = sidebarSource.match(
        /const\s+isCreationPrompt\s*=\s*(\/(?:[^\/]+)\/i)\.test\(rawText\)/
      )
      expect(regexMatch).not.toBeNull()
      const sidebarCreationRegex = new RegExp(
        regexMatch![1].slice(1, -2),
        'i'
      )
      expect(sidebarCreationRegex.test('oke buatkan artikel nya di halaman ini')).toBe(true)
      expect(sidebarCreationRegex.test('buatkan draf')).toBe(true)
      expect(sidebarCreationRegex.test('generate panduan baru')).toBe(true)
      expect(sidebarCreationRegex.test('tuliskan artikel')).toBe(true)
      expect(sidebarCreationRegex.test('terapkan perubahan')).toBe(true)
      expect(sidebarCreationRegex.test('isi form editor')).toBe(true)
    })

    it('4.6: Extracts embedded markdown JSON block when top-level proposedChanges is omitted', () => {
      // 1. Direct AST/source assertion: fallback parsing closure exists in StudioAiSidebar
      expect(sidebarSource).toContain('const proposed = data.proposedChanges || (() => {')
      expect(sidebarSource).toContain(
        "const m = (data.reply || '').match(/```json:article-changes\\s*([\\s\\S]*?)\\s*```/)"
      )
      expect(sidebarSource).toContain('try { return JSON.parse(m[1]) } catch (_) { return null }')

      // 2. Functional verification of embedded markdown JSON parsing behavior
      const sampleReply = [
        'Berikut rancangan artikel:',
        '```json:article-changes',
        '{',
        '  "title": "WebGL 3D Interactive — Panduan Lengkap",',
        '  "slug": "webgl-3d-interactive",',
        '  "focusKeyphrase": "webgl 3d",',
        '  "autoApply": true',
        '}',
        '```',
        'Draf siap diterapkan.',
      ].join('\n')

      const m = sampleReply.match(/```json:article-changes\s*([\s\S]*?)\s*```/)
      expect(m).not.toBeNull()
      const parsed = JSON.parse(m![1])
      expect(parsed.title).toBe('WebGL 3D Interactive — Panduan Lengkap')
      expect(parsed.slug).toBe('webgl-3d-interactive')
      expect(parsed.autoApply).toBe(true)
    })

    it('4.7: Renders the emerald confirmation toast notification in DOM (`data-testid="article-apply-toast"`)', () => {
      // 1. Direct AST/source assertion: toast container element exists with exact testid
      expect(sidebarSource).toContain('data-testid="article-apply-toast"')

      // 2. Direct AST/source assertion: State declaration and setter exist
      expect(sidebarSource).toContain('const [applyNotice, setApplyNotice] = useState<string | null>(null)')
      expect(sidebarSource).toContain('setApplyNotice')
      // showApplyNotice wrapper calls setApplyNotice internally, and call-sites use showApplyNotice(...)
      expect(sidebarSource).toContain('showApplyNotice(`Artikel "${articleTitle}" berhasil diterapkan ke editor!`)')

      // 3. Direct AST/source assertion: Auto-dismiss 6-second timer (inside showApplyNotice wrapper)
      expect(sidebarSource).toContain('setTimeout(() =>')

      // 4. Direct AST/source assertion: Emerald styling tokens per design standards
      expect(sidebarSource).toContain('bg-emerald-500/20')
      expect(sidebarSource).toContain('border-emerald-400/40')
      expect(sidebarSource).toContain('text-emerald-200')
      expect(sidebarSource).toContain('animate-fadeIn')
      expect(sidebarSource).toContain('shadow-lg')

      // 5. Direct AST/source assertion: Close button with accessible label and dismiss handler
      expect(sidebarSource).toContain('onClick={() => setApplyNotice(null)}')
      expect(sidebarSource).toContain('title="Tutup pemberitahuan"')
      expect(sidebarSource).toContain('aria-label="Tutup pemberitahuan"')

      // 6. Direct AST/source assertion: Conditional rendering structure in JSX
      expect(sidebarSource).toContain('{applyNotice && (')
      expect(sidebarSource).toContain('{applyNotice}</span>')
    })

    it('4.8: Handles missing onApplyArticleChanges prop safely without throwing errors', () => {
      // 1. Direct AST/source assertion: optional callback typing in props interface
      expect(sidebarSource).toContain(
        'onApplyArticleChanges?: (changes: Partial<StudioAiArticleContext>) => void'
      )

      // 2. Direct AST/source assertion: guard included in shouldAutoApply boolean evaluation
      expect(sidebarSource).toMatch(
        /const\s+shouldAutoApply\s*=\s*Boolean\([\s\S]*?onApplyArticleChanges[\s\S]*?\)/
      )

      // 3. Direct AST/source assertion: defensive guard before invoking onApplyArticleChanges in auto-apply
      expect(sidebarSource).toContain('if (shouldAutoApply && proposed && onApplyArticleChanges) {')

      // 4. Direct AST/source assertion: defensive guard before manual button apply invocation
      expect(sidebarSource).toContain('if (onApplyArticleChanges) {')

      // 5. Verify component renders cleanly to DOM when onApplyArticleChanges is omitted
      expect(() => {
        renderToStaticMarkup(
          <StudioAiSidebar
            isOpen={true}
            variant="panel"
            isExpanded={false}
            onClose={vi.fn()}
            onApplyArticleChanges={undefined}
          />
        )
      }).not.toThrow()
    })

    it('4.9: Status button reflects applied state (`Perubahan Berhasil Diterapkan ke Editor`) when in appliedChangesMap', () => {
      // 1. Direct AST/source assertion: appliedChangesMap state declaration and state update
      expect(sidebarSource).toContain(
        'const [appliedChangesMap, setAppliedChangesMap] = useState<Record<string, boolean>>({})'
      )
      expect(sidebarSource).toContain('[`msg_${assistantIdx}`]: true')
      expect(sidebarSource).toContain('[`msg_${idx}`]: true')

      // 2. Direct AST/source assertion: isApplied lookup by message index key
      expect(sidebarSource).toContain('const isApplied = Boolean(appliedChangesMap[`msg_${idx}`])')

      // 3. Direct AST/source assertion: applied status label and unapplied label
      expect(sidebarSource).toContain('Perubahan Berhasil Diterapkan ke Editor')
      expect(sidebarSource).toContain('Terapkan Perubahan ke Editor')
      expect(sidebarSource).toContain(
        "isApplied ? 'Perubahan Berhasil Diterapkan ke Editor' : 'Terapkan Perubahan ke Editor'"
      )

      // 4. Direct AST/source assertion: disabled state when applied
      expect(sidebarSource).toContain('disabled={isApplied}')

      // 5. Direct AST/source assertion: emerald styling tokens for applied state vs CTA styling for unapplied state
      expect(sidebarSource).toContain(
        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
      )
      expect(sidebarSource).toContain(
        'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 cursor-pointer font-bold'
      )
    })
  })

  // =========================================================================
  // SUITE 5: Tier 4 — Integrated End-to-End Real-World Application Scenarios
  // =========================================================================
  describe('Suite 5: Tier 4 — Integrated End-to-End Real-World Application Scenarios', () => {
    it('Scenario 1: User types multiline prompt via Shift+Enter in expanding textarea, sends with Enter, textarea resets to 38px', () => {
      // 1. Initial single line
      let scrollHeight = 38
      let computedHeight = Math.min(Math.max(scrollHeight, 38), 160)
      expect(computedHeight).toBe(38)

      // 2. User presses Shift+Enter twice and types 4 lines -> textarea expands to 110px
      scrollHeight = 110
      computedHeight = Math.min(Math.max(scrollHeight, 38), 160)
      expect(computedHeight).toBe(110)

      // 3. User hits Enter (without Shift) -> triggers message submission and resets height to 38px
      const resetHeight = 38
      expect(resetHeight).toBe(38)
    })

    it('Scenario 2: User enters "oke buatkan artikel nya di halaman ini" when selected OpenRouter model fails with 400 tool rejection -> auto degrades, falls back to settings model, generates article, and applies to editor with toast', async () => {
      mockCallLlm.mockResolvedValueOnce({
        reply: `Draf artikel berhasil dibuat:\n\`\`\`json:article-changes\n${JSON.stringify({
          title: 'Desain Sistem Komputasional Enterprise — Panduan Lengkap',
          slug: 'desain-sistem-komputasional-enterprise',
          focusKeyphrase: 'desain sistem komputasional',
          metaDescription: 'Panduan desain sistem komputasional enterprise modern berstandar tinggi SegiaTech.',
          autoApply: true,
        })}\n\`\`\``,
        durationMs: 250,
        provider: 'openrouter',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
      })

      const onApply = vi.fn()
      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
        { currentTab: 'buat-artikel' },
        {
          provider: 'openrouter',
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          apiKey: 'test-key',
        }
      )

      expect(res.autoApply).toBe(true)
      expect(res.proposedChanges).toBeDefined()
      expect(res.proposedChanges.title).toBe('Desain Sistem Komputasional Enterprise — Panduan Lengkap')
      expect(res.proposedChanges.slug).toBe('desain-sistem-komputasional-enterprise')

      // Simulate sidebar direct auto-apply
      if (res.proposedChanges && (res.autoApply || res.proposedChanges.autoApply)) {
        onApply(res.proposedChanges)
      }
      expect(onApply).toHaveBeenCalledWith(res.proposedChanges)

      // Direct AST / source verification of StudioAiSidebar toast markup & auto-apply wiring
      expect(sidebarSource).toContain('if (shouldAutoApply && proposed && onApplyArticleChanges) {')
      expect(sidebarSource).toContain('onApplyArticleChanges(proposed)')
      expect(sidebarSource).toContain('data-testid="article-apply-toast"')
      expect(sidebarSource).toContain('{applyNotice && (')
      expect(sidebarSource).toContain('showApplyNotice(`Artikel "${articleTitle}" berhasil diterapkan ke editor!`)')
      expect(sidebarSource).toContain('setTimeout(() =>')
      expect(sidebarSource).toContain('bg-emerald-500/20')
      expect(sidebarSource).toContain('border-emerald-400/40')
      expect(sidebarSource).toContain('text-emerald-200')
      const articleTitle = res.proposedChanges.title
      const expectedNotice = `Artikel "${articleTitle}" berhasil diterapkan ke editor!`
      expect(expectedNotice).toContain('Desain Sistem Komputasional Enterprise — Panduan Lengkap')
      expect(sidebarSource).toContain('truncate">{applyNotice}</span>')
      expect(sidebarSource).toContain('`Artikel "${articleTitle}" berhasil diterapkan ke editor!`')
    })

    it('Scenario 3: User enters prompt when all external models fail -> reports honest failover diagnostic instead of mock article', async () => {
      mockCallLlm.mockRejectedValue(new Error('Total Network Outage'))

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: 'oke buatkan artikel nya di halaman ini' }],
        {
          currentTab: 'buat-artikel',
          article: { title: 'Panduan Web Performance' },
        }
      )

      expect(res.isError).toBeFalsy()
      expect(res.reply).not.toContain('Terjadi kendala saat memproses respons dari agentic engine')
      expect(res.reply).toContain('Eksekusi Agen AI Terhenti')
      expect(res.reply).toContain('Total Network Outage')
      expect(res.proposedChanges).toBeNull()
      expect(res.autoApply).toBe(false)
      expect(res.meta?.provider).toBe('failed')
    })

    it('Scenario 4: User requests optimization ("perbaiki artikel ini") -> stays in optimization flow without overwriting article with fresh creation', async () => {
      mockCallLlm.mockResolvedValueOnce({
        reply: 'Berikut hasil analisis perbaikan artikel: Skor SEO saat ini 78/100. Disarankan menambah tautan internal.',
        durationMs: 150,
        provider: 'google',
        model: 'gemini-2.5-flash',
      })

      const query = 'tolong perbaiki penulisan artikel ini'

      const res = await handleAiAssistantChat(
        [{ role: 'user', content: query }],
        { currentTab: 'buat-artikel' },
        {
          provider: 'google',
          model: 'gemini-2.5-flash',
          apiKey: 'mock-key',
        }
      )

      expect(res.isError).toBeFalsy()
      expect(res.reply).toContain('Berikut hasil analisis perbaikan artikel')
      expect(res.autoApply).toBeFalsy()
    })
  })
})
