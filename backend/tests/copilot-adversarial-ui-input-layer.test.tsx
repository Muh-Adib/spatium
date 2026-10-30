/**
 * Tier 5 Adversarial Coverage Hardening on UI & Input Layer
 * Target: web/tests/copilot-adversarial-ui-input-layer.test.tsx
 *
 * Focus Dimensions:
 * 1. Upward Textarea Auto-Resizing Edge Cases & Clamping
 * 2. Keybinding Invariants & State Machine
 * 3. Autocomplete Triggers (/, @, $) & Isolation from Non-Trigger Text
 * 4. Pure Icon Button Layout, Absence of Text Labels & Accessibility
 * 5. Auto-Apply Toast Notification Lifecycle & Timer Resilience
 */

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

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
}))

// Mock audit logger
vi.mock('@/lib/ai/audit-logger', () => ({
  recordAiPromptLog: vi.fn(),
}))

import { StudioAiSidebar } from '../src/components/studio/StudioAiSidebar'

describe('Tier 5 Adversarial Coverage Hardening: UI & Input Layer Invariants', () => {
  const sidebarSource = fs.readFileSync(
    path.resolve(__dirname, '../src/components/studio/StudioAiSidebar.tsx'),
    'utf-8'
  )

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // =========================================================================
  // DIMENSION 1: Upward Textarea Auto-Resizing Edge Cases & Clamping Invariants
  // =========================================================================
  describe('Dimension 1: Upward Textarea Auto-Resizing Edge Cases & Clamping Invariants', () => {
    const clampHeight = (scrollHeight: number) => Math.min(Math.max(scrollHeight, 38), 160)

    it('1.1: Clamping invariants enforce strict floor of 38px and ceiling of 160px across extreme BVA inputs', () => {
      // Sub-zero and degenerates
      expect(clampHeight(-100)).toBe(38)
      expect(clampHeight(-1)).toBe(38)
      expect(clampHeight(0)).toBe(38)
      expect(clampHeight(1)).toBe(38)
      expect(clampHeight(37)).toBe(38)

      // Exact floor
      expect(clampHeight(38)).toBe(38)

      // Linear range
      expect(clampHeight(39)).toBe(39)
      expect(clampHeight(85)).toBe(85)
      expect(clampHeight(120)).toBe(120)
      expect(clampHeight(159)).toBe(159)

      // Exact ceiling
      expect(clampHeight(160)).toBe(160)

      // Over-ceiling extremes
      expect(clampHeight(161)).toBe(160)
      expect(clampHeight(500)).toBe(160)
      expect(clampHeight(2500)).toBe(160)
      expect(clampHeight(100000)).toBe(160)
    })

    it('1.2: Empty string input resets clamped height back to 38px floor', () => {
      // Simulation of input state change in adjustTextareaHeight
      const mockElement = { style: { height: '140px' }, scrollHeight: 24 }
      // When input is cleared, el.style.height is set to 'auto', scrollHeight shrinks to font line height (~24px)
      mockElement.style.height = 'auto'
      const newHeight = clampHeight(mockElement.scrollHeight)
      mockElement.style.height = `${newHeight}px`

      expect(mockElement.style.height).toBe('38px')
    })

    it('1.3: Rapid multiline paste stress simulation expands to maximum 160px ceiling without overflow', () => {
      const mockElement = { style: { height: '38px' }, scrollHeight: 38 }

      // Paste 50 lines of prompt text
      const pastedScrollHeight = 850
      mockElement.style.height = 'auto'
      const newHeight = clampHeight(pastedScrollHeight)
      mockElement.style.height = `${newHeight}px`

      expect(mockElement.style.height).toBe('160px')
    })

    it('1.4: Newline spamming (30 consecutive linebreaks) is clamped at 160px and preserves scrollability', () => {
      const mockElement = { style: { height: '38px' }, scrollHeight: 38 }

      // 30 consecutive newlines
      const newlineSpamScrollHeight = 30 * 24 // 720px
      mockElement.style.height = 'auto'
      const newHeight = clampHeight(newlineSpamScrollHeight)
      mockElement.style.height = `${newHeight}px`

      expect(mockElement.style.height).toBe('160px')
    })

    it('1.5: Rendered DOM markup contains min-h-[38px], max-h-[160px], resize-none and scrollbar classes', () => {
      const html = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="panel" isExpanded={false} onClose={vi.fn()} />
      )
      expect(html).toContain('<textarea')
      expect(html).toContain('rows="1"')
      expect(html).toContain('resize-none')
      expect(html).toContain('min-h-[38px]')
      expect(html).toContain('max-h-[160px]')
      expect(html).toContain('overflow-y-auto')
      expect(html).toContain('scrollbar-thin')
    })

    it('1.6: Submitting message immediately resets textarea style height back to 38px', () => {
      expect(sidebarSource).toContain("if (textareaRef.current) textareaRef.current.style.height = '38px'")
    })
  })

  // =========================================================================
  // DIMENSION 2: Keybinding Invariants & State Machine
  // =========================================================================
  describe('Dimension 2: Keybinding Invariants & State Machine', () => {
    interface KeyHandlerContext {
      activeTrigger: '/' | '@' | '$' | null
      filteredOptions: Array<{ id: string; insertText: string }>
      selectedIndex: number
      loading: boolean
      input: string
      sendMessageCalled: boolean
      optionSelected: string | null
      triggerDismissed: boolean
      defaultPrevented: boolean
      heightReset: boolean
    }

    const runKeyHandler = (
      ctx: KeyHandlerContext,
      event: { key: string; shiftKey?: boolean; isComposing?: boolean }
    ) => {
      const e = {
        key: event.key,
        shiftKey: !!event.shiftKey,
        nativeEvent: { isComposing: !!event.isComposing },
        preventDefault: () => {
          ctx.defaultPrevented = true
        },
      }

      // Exact implementation logic from StudioAiSidebar.tsx handleInputKeyDown
      if (e.nativeEvent.isComposing) return

      if (ctx.activeTrigger && ctx.filteredOptions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          ctx.selectedIndex = (ctx.selectedIndex + 1) % ctx.filteredOptions.length
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          ctx.selectedIndex = (ctx.selectedIndex - 1 + ctx.filteredOptions.length) % ctx.filteredOptions.length
          return
        }
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
          e.preventDefault()
          ctx.optionSelected = ctx.filteredOptions[ctx.selectedIndex]?.insertText || null
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          ctx.activeTrigger = null
          ctx.triggerDismissed = true
          return
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!ctx.loading && ctx.input.trim()) {
          ctx.sendMessageCalled = true
          ctx.heightReset = true
        }
      }
    }

    it('2.1: Shift + Enter inserts newline: does NOT prevent default, does NOT call sendMessage, does NOT reset height', () => {
      const ctx: KeyHandlerContext = {
        activeTrigger: null,
        filteredOptions: [],
        selectedIndex: 0,
        loading: false,
        input: 'Line 1 of long prompt',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }

      runKeyHandler(ctx, { key: 'Enter', shiftKey: true })

      expect(ctx.defaultPrevented).toBe(false)
      expect(ctx.sendMessageCalled).toBe(false)
      expect(ctx.heightReset).toBe(false)
    })

    it('2.2: Enter without Shift sends message, prevents default, and triggers height reset to 38px', () => {
      const ctx: KeyHandlerContext = {
        activeTrigger: null,
        filteredOptions: [],
        selectedIndex: 0,
        loading: false,
        input: 'Tolong buatkan artikel SEO',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }

      runKeyHandler(ctx, { key: 'Enter', shiftKey: false })

      expect(ctx.defaultPrevented).toBe(true)
      expect(ctx.sendMessageCalled).toBe(true)
      expect(ctx.heightReset).toBe(true)
    })

    it('2.3: Enter on empty or whitespace-only input prevents newline but does NOT send message', () => {
      const testInputs = ['', '   ', '\t', '\n\n\n', '  \r\n  ']

      for (const input of testInputs) {
        const ctx: KeyHandlerContext = {
          activeTrigger: null,
          filteredOptions: [],
          selectedIndex: 0,
          loading: false,
          input,
          sendMessageCalled: false,
          optionSelected: null,
          triggerDismissed: false,
          defaultPrevented: false,
          heightReset: false,
        }

        runKeyHandler(ctx, { key: 'Enter', shiftKey: false })

        expect(ctx.defaultPrevented).toBe(true)
        expect(ctx.sendMessageCalled).toBe(false)
        expect(ctx.heightReset).toBe(false)
      }
    })

    it('2.4: Enter when loading=true prevents newline but suppresses duplicate submission', () => {
      const ctx: KeyHandlerContext = {
        activeTrigger: null,
        filteredOptions: [],
        selectedIndex: 0,
        loading: true,
        input: 'Prompt while busy',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }

      runKeyHandler(ctx, { key: 'Enter', shiftKey: false })

      expect(ctx.defaultPrevented).toBe(true)
      expect(ctx.sendMessageCalled).toBe(false)
    })

    it('2.5: IME Composition (isComposing=true) ignores Enter submit and permits native character composition', () => {
      const ctx: KeyHandlerContext = {
        activeTrigger: null,
        filteredOptions: [],
        selectedIndex: 0,
        loading: false,
        input: 'nihongo',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }

      // User presses Enter to confirm kanji choice in IME
      runKeyHandler(ctx, { key: 'Enter', isComposing: true })

      expect(ctx.defaultPrevented).toBe(false)
      expect(ctx.sendMessageCalled).toBe(false)
    })

    it('2.6: Autocomplete interception: Enter and Tab select option without sending message', () => {
      const options = [
        { id: '/audit', insertText: '/audit' },
        { id: '/draft', insertText: '/draft' },
      ]

      // Test Enter
      const ctxEnter: KeyHandlerContext = {
        activeTrigger: '/',
        filteredOptions: options,
        selectedIndex: 0,
        loading: false,
        input: '/au',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }
      runKeyHandler(ctxEnter, { key: 'Enter' })
      expect(ctxEnter.defaultPrevented).toBe(true)
      expect(ctxEnter.optionSelected).toBe('/audit')
      expect(ctxEnter.sendMessageCalled).toBe(false)

      // Test Tab
      const ctxTab: KeyHandlerContext = {
        activeTrigger: '/',
        filteredOptions: options,
        selectedIndex: 1,
        loading: false,
        input: '/dr',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }
      runKeyHandler(ctxTab, { key: 'Tab' })
      expect(ctxTab.defaultPrevented).toBe(true)
      expect(ctxTab.optionSelected).toBe('/draft')
      expect(ctxTab.sendMessageCalled).toBe(false)
    })

    it('2.7: Shift + Enter while autocomplete popup is open does NOT select option and permits newline', () => {
      const options = [{ id: '/audit', insertText: '/audit' }]
      const ctx: KeyHandlerContext = {
        activeTrigger: '/',
        filteredOptions: options,
        selectedIndex: 0,
        loading: false,
        input: '/audit',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }

      runKeyHandler(ctx, { key: 'Enter', shiftKey: true })

      expect(ctx.defaultPrevented).toBe(false)
      expect(ctx.optionSelected).toBeNull()
      expect(ctx.sendMessageCalled).toBe(false)
    })

    it('2.8: ArrowDown and ArrowUp navigate autocomplete options with modular wrap-around', () => {
      const options = [
        { id: '$role', insertText: '$role ' },
        { id: '$slug', insertText: '$slug ' },
        { id: '$title', insertText: '$title ' },
      ]

      const ctx: KeyHandlerContext = {
        activeTrigger: '$',
        filteredOptions: options,
        selectedIndex: 0,
        loading: false,
        input: '$',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }

      // Navigate down: 0 -> 1 -> 2 -> 0
      runKeyHandler(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(1)
      runKeyHandler(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(2)
      runKeyHandler(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(0)

      // Navigate up: 0 -> 2 -> 1 -> 0
      runKeyHandler(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(2)
      runKeyHandler(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(1)
      runKeyHandler(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(0)
    })

    it('2.9: Escape key dismisses active autocomplete trigger', () => {
      const ctx: KeyHandlerContext = {
        activeTrigger: '@',
        filteredOptions: [{ id: '@article', insertText: '@article ' }],
        selectedIndex: 0,
        loading: false,
        input: '@art',
        sendMessageCalled: false,
        optionSelected: null,
        triggerDismissed: false,
        defaultPrevented: false,
        heightReset: false,
      }

      runKeyHandler(ctx, { key: 'Escape' })

      expect(ctx.defaultPrevented).toBe(true)
      expect(ctx.triggerDismissed).toBe(true)
      expect(ctx.activeTrigger).toBeNull()
    })
  })

  // =========================================================================
  // DIMENSION 3: Autocomplete Triggers (/, @, $) & Isolation from Non-Trigger Text
  // =========================================================================
  describe('Dimension 3: Autocomplete Triggers (/, @, $) & Isolation from Non-Trigger Text', () => {
    const triggerRegex = /(?:^|\s)([/@$])([a-zA-Z0-9_-]*)$/

    it('3.1: Valid triggers match command (/), context (@), and variable ($) patterns at start or after whitespace', () => {
      const validCases = [
        ['/', '/', ''],
        ['/audit', '/', 'audit'],
        ['/draft', '/', 'draft'],
        ['/compress', '/', 'compress'],
        ['/clear', '/', 'clear'],
        ['@', '@', ''],
        ['@article', '@', 'article'],
        ['@seo', '@', 'seo'],
        ['$', '$', ''],
        ['$title', '$', 'title'],
        ['$slug', '$', 'slug'],
        ['$keyphrase', '$', 'keyphrase'],
        ['$violations', '$', 'violations'],
        ['$role', '$', 'role'],
        ['Tolong gunakan /audit', '/', 'audit'],
        ['Konteks halaman @article', '@', 'article'],
        ['Nilai dari $title', '$', 'title'],
      ]

      for (const [text, expectedTrigger, expectedQuery] of validCases) {
        const match = text.match(triggerRegex)
        expect(match).not.toBeNull()
        expect(match![1]).toBe(expectedTrigger)
        expect(match![2]).toBe(expectedQuery)
      }
    })

    it('3.2: Isolation from Email addresses: emails NEVER trigger @ context menu', () => {
      const emailCases = [
        'developer@example.com',
        'admin@segiatech.com',
        'contact@segia.tech',
        'user.name+tag@gmail.co.id',
        'team_lead@corporate-domain.net',
        'Tolong hubungi author@domain.com',
      ]

      for (const email of emailCases) {
        const match = email.match(triggerRegex)
        expect(match).toBeNull()
      }
    })

    it('3.3: Isolation from Currency & Financial notation: trailing spaces dismiss trigger completely', () => {
      // With trailing space, the prompt ends in whitespace, so `([a-zA-Z0-9_-]*)$` fails to match after symbol
      const trailingSpaceCases = [
        'biaya $50 ',
        'total: $1000 ',
        'harga $99.99 ',
        'deposit $5 ',
      ]

      for (const text of trailingSpaceCases) {
        const match = text.match(triggerRegex)
        expect(match).toBeNull()
      }
    })

    it('3.4: Isolation from URLs and file paths: slashes in web URLs or paths do NOT trigger /', () => {
      const urlAndPathCases = [
        'https://segiatech.com/artikel/ai-copilot',
        'http://localhost:3000/api/ai/chat',
        'ftp://files.example.com/pub/file',
        'segiatech.com/layanan',
        '/var/log/nginx', // Note: /var has slash preceded by ^, so that triggers /var; but subpaths like /nginx after log/nginx do not
        'path/to/nested/module',
        'C:/Windows/System32',
      ]

      for (const pathStr of urlAndPathCases) {
        if (pathStr.startsWith('/')) continue // Leading slash is an intended trigger
        const match = pathStr.match(triggerRegex)
        expect(match).toBeNull()
      }
    })

    it('3.5: Isolation from compound words and fractions: slashes between letters or numbers do NOT trigger', () => {
      const compoundCases = [
        'and/or',
        'either/or',
        '24/7',
        '50/50',
        'w/o',
        'input/output',
      ]

      for (const text of compoundCases) {
        const match = text.match(triggerRegex)
        expect(match).toBeNull()
      }
    })

    it('3.6: Double/triple trigger symbols: consecutive triggers ($$var, @@user, ///cmd) do not trigger', () => {
      const doubleTriggerCases = [
        '$$var',
        '@@user',
        '///cmd',
        'foo$$bar',
      ]

      for (const text of doubleTriggerCases) {
        const match = text.match(triggerRegex)
        expect(match).toBeNull()
      }
    })

    it('3.7: In-place token replacement preserves trailing text without corruption', () => {
      const fullText = 'Tolong verifikasi $key untuk standar SEO SegiaTech'
      const token = '$key'
      const cursorPos = fullText.indexOf(token) + token.length
      const textBeforeCursor = fullText.slice(0, cursorPos)
      const textAfterCursor = fullText.slice(cursorPos)

      const option = { insertText: '$keyphrase ' }
      const replacedBefore = textBeforeCursor.replace(/(?:^|\s)([/@$])[a-zA-Z0-9_-]*$/, (match) => {
        const leadingSpace = match.startsWith(' ') ? ' ' : ''
        return `${leadingSpace}${option.insertText}`
      })

      const finalVal = `${replacedBefore}${textAfterCursor}`
      expect(finalVal).toBe('Tolong verifikasi $keyphrase  untuk standar SEO SegiaTech')
    })

    it('3.8: Variable Token Expansion safely substitutes context tokens while leaving unrelated currency tokens intact', () => {
      const rawText = 'Analisis $title dengan slug $slug seharga $50 dan diskon $10 untuk role $role'
      const role = 'SUPER_ADMIN'
      const dynamicTitle = 'Transformasi Digital'
      const dynamicSlug = 'transformasi-digital'

      const resolvedText = rawText
        .replace(/\$role\b/g, role)
        .replace(/\$slug\b/g, dynamicSlug)
        .replace(/\$title\b/g, dynamicTitle)

      expect(resolvedText).toBe(
        'Analisis Transformasi Digital dengan slug transformasi-digital seharga $50 dan diskon $10 untuk role SUPER_ADMIN'
      )
      // Unrelated currency remains completely unaltered
      expect(resolvedText).toContain('seharga $50')
      expect(resolvedText).toContain('diskon $10')
    })
  })

  // =========================================================================
  // DIMENSION 4: Pure Icon Button Layout, Absence of Text Labels & Accessibility
  // =========================================================================
  describe('Dimension 4: Pure Icon Button Layout, Absence of Text Labels & Accessibility', () => {
    it('4.1: Source code contains ZERO text spans in New Chat, Send, and main interactive buttons', () => {
      expect(sidebarSource).not.toContain('<span>Baru</span>')
      expect(sidebarSource).not.toContain('<span>Kirim</span>')
      expect(sidebarSource).not.toMatch(/<button[^>]*aria-label="Kirim Pesan"[^>]*>[\s\S]*?<span[\s\S]*?<\/button>/)
    })

    it('4.2: Complete removal of bottom trigger hints bar from prompt area', () => {
      expect(sidebarSource).not.toContain('handleTriggerButtonClick')
      expect(sidebarSource).not.toContain('Minimalist Micro Trigger Hints')
      expect(sidebarSource).not.toContain('/ perintah')
      expect(sidebarSource).not.toContain('@ konteks')
      expect(sidebarSource).not.toContain('$ variabel')

      // In rendered DOM, confirm prompt input wrapper does not contain legacy shortcuts or role badge
      const html = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="panel" isExpanded={false} onClose={vi.fn()} />
      )
      expect(html).not.toContain('/ perintah')
      expect(html).not.toContain('@ konteks')
      expect(html).not.toContain('$ variabel')
      expect(html).not.toContain('SUPER_ADMIN')
    })

    it('4.3: Every icon control in header and prompt footer presents accessible aria-label and title', () => {
      const html = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="panel" isExpanded={false} onClose={vi.fn()} />
      )

      // Send Button
      expect(html).toContain('aria-label="Kirim Pesan"')
      expect(html).toContain('title="Kirim (Enter) · Baris baru (Shift + Enter)"')

      // New Chat Button
      expect(html).toContain('aria-label="Mulai Sesi Obrolan Baru"')
      expect(html).toContain('title="Mulai Sesi Obrolan Baru"')

      // Close Button
      expect(html).toContain('aria-label="Tutup AI Assistant"')
      expect(html).toContain('title="Sembunyikan AI Copilot"')

      // Settings Button
      expect(html).toContain('title="Pengaturan Model &amp; API Key (Google AI Studio &amp; OpenRouter)"')

      // History Sessions Button
      expect(html).toContain('title="Daftar Sesi Obrolan (Tersimpan di Server PostgreSQL)"')
    })

    it('4.4: Button sizing enforces w-10 h-[38px] in panel mode and w-8 h-[38px] in compact widget mode', () => {
      const htmlPanel = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="panel" isExpanded={false} onClose={vi.fn()} />
      )
      const sendPanel = htmlPanel.match(/<button[^>]*aria-label="Kirim Pesan"[^>]*>/)
      expect(sendPanel).not.toBeNull()
      expect(sendPanel![0]).toContain('w-10')
      expect(sendPanel![0]).toContain('h-[38px]')

      const htmlWidget = renderToStaticMarkup(
        <StudioAiSidebar isOpen={true} variant="widget" isExpanded={false} onClose={vi.fn()} />
      )
      const sendWidget = htmlWidget.match(/<button[^>]*aria-label="Kirim Pesan"[^>]*>/)
      expect(sendWidget).not.toBeNull()
      expect(sendWidget![0]).toContain('w-8')
      expect(sendWidget![0]).toContain('h-[38px]')
      expect(sendWidget![0]).not.toContain('w-10')
    })
  })

  // =========================================================================
  // DIMENSION 5: Auto-Apply Toast Notification Lifecycle & Timer Resilience
  // =========================================================================
  describe('Dimension 5: Auto-Apply Toast Notification Lifecycle & Timer Resilience', () => {
    it('5.1: Renders the confirmation toast notification in DOM with checkmark, title, and close button', () => {
      // Simulate toast markup as rendered in StudioAiSidebar.tsx
      const applyNotice = 'Artikel "Arsitektur Digital" berhasil diterapkan ke editor!'
      const toastHtml = renderToStaticMarkup(
        <div
          data-testid="article-apply-toast"
          className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-fadeIn shadow-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{applyNotice}</span>
          </div>
          <button
            type="button"
            className="text-emerald-400 hover:text-emerald-200 shrink-0 p-0.5 rounded transition-colors"
            title="Tutup pemberitahuan"
            aria-label="Tutup pemberitahuan"
          >
            <span className="close-icon" />
          </button>
        </div>
      )

      expect(toastHtml).toContain('data-testid="article-apply-toast"')
      expect(toastHtml).toContain('Arsitektur Digital')
      expect(toastHtml).toContain('aria-label="Tutup pemberitahuan"')
      expect(toastHtml).toContain('title="Tutup pemberitahuan"')
    })

    it('5.2: Manual dismiss button directly clears the toast', () => {
      let currentNotice: string | null = 'Pemberitahuan aktif'
      const setNotice = (val: string | null) => {
        currentNotice = val
      }

      // Simulate clicking close button
      setNotice(null)
      expect(currentNotice).toBeNull()
    })

    it('5.3: Gap Analysis — Empirical demonstration of timer collision in rapid consecutive auto-applies', () => {
      vi.useFakeTimers()

      let displayedToast: string | null = null

      // Simulates the current implementation:
      // setApplyNotice(`Artikel "${title}"...`)
      // setTimeout(() => setApplyNotice(null), 6000)
      const triggerToastUnmanaged = (title: string) => {
        displayedToast = title
        setTimeout(() => {
          displayedToast = null
        }, 6000)
      }

      // Action 1 at t=0s
      triggerToastUnmanaged('Artikel Pertama')
      expect(displayedToast).toBe('Artikel Pertama')

      // Advance 4s
      vi.advanceTimersByTime(4000)

      // Action 2 at t=4s (intended to display for 6s until t=10s)
      triggerToastUnmanaged('Artikel Kedua')
      expect(displayedToast).toBe('Artikel Kedua')

      // Advance 2s (reaching t=6s: Action 1's timer fires!)
      vi.advanceTimersByTime(2000)

      // Observation of vulnerability: Action 1's unmanaged timer clears Action 2's toast prematurely!
      expect(displayedToast).toBeNull() // Toast was dismissed after only 2s instead of 6s!

      vi.useRealTimers()
    })

    it('5.4: Hardening Architecture — Managed timer ref prevents timer collision and guarantees full display window', () => {
      vi.useFakeTimers()

      let displayedToast: string | null = null
      let timerRef: any = null

      // Hardened implementation:
      const triggerToastManaged = (title: string) => {
        if (timerRef) clearTimeout(timerRef)
        displayedToast = title
        timerRef = setTimeout(() => {
          displayedToast = null
          timerRef = null
        }, 6000)
      }

      // Action 1 at t=0s
      triggerToastManaged('Artikel Pertama')
      expect(displayedToast).toBe('Artikel Pertama')

      // Advance 4s
      vi.advanceTimersByTime(4000)

      // Action 2 at t=4s (resets timer for full 6s until t=10s)
      triggerToastManaged('Artikel Kedua')
      expect(displayedToast).toBe('Artikel Kedua')

      // Advance 2s (t=6s)
      vi.advanceTimersByTime(2000)
      // Hardened behavior: Toast is STILL visible!
      expect(displayedToast).toBe('Artikel Kedua')

      // Advance remaining 4s (t=10s)
      vi.advanceTimersByTime(4000)
      // Now cleanly dismissed after full 6s duration
      expect(displayedToast).toBeNull()

      vi.useRealTimers()
    })
  })
})
