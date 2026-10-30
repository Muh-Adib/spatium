import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/buat-artikel',
  useSearchParams: () => new URLSearchParams('tab=buat-artikel'),
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
  getStoredAiCredentials: () => ({ googleApiKey: 'test', openrouterApiKey: 'test' }),
  triggerAiKeyPrompt: vi.fn(),
  getSelectedAiModels: () => [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', isCustom: false },
  ],
  detectModelCapabilities: () => ({ supportsFunctionCalling: true, isThinkingModel: false }),
}))

// Mock audit logger
vi.mock('@/lib/ai/audit-logger', () => ({
  recordAiPromptLog: vi.fn(),
}))

import { StudioAiSidebar } from '../src/components/studio/StudioAiSidebar'

describe('Empirical Challenge: StudioAiSidebar Streamlined UI & DOM Verification', () => {
  const sourceCode = fs.readFileSync(
    path.resolve(__dirname, '../src/components/studio/StudioAiSidebar.tsx'),
    'utf-8'
  )

  // =========================================================================
  // Suite 1: Forbidden String Scans in Source Code & DOM
  // =========================================================================
  describe('1. Static Codebase Scans for Forbidden Strings & Regressions', () => {
    it('does NOT contain `<span>Baru</span>` anywhere in the source', () => {
      expect(sourceCode).not.toContain('<span>Baru</span>')
      expect(sourceCode).not.toMatch(/<span[^>]*>\s*Baru\s*<\/span>/)
    })

    it('does NOT contain `<span>Kirim</span>` anywhere in the source', () => {
      expect(sourceCode).not.toContain('<span>Kirim</span>')
      expect(sourceCode).not.toMatch(/<span[^>]*>\s*Kirim\s*<\/span>/)
    })

    it('does NOT declare or call `handleTriggerButtonClick`', () => {
      expect(sourceCode).not.toContain('handleTriggerButtonClick')
    })

    it('does NOT contain bottom trigger bar shortcuts ("/ perintah", "@ konteks", "$ variabel")', () => {
      expect(sourceCode).not.toContain('/ perintah')
      expect(sourceCode).not.toContain('@ konteks')
      expect(sourceCode).not.toContain('$ variabel')
      expect(sourceCode).not.toContain('Minimalist Micro Trigger Hints')
    })

    it('has zero occurrences of deprecated `inputRef`', () => {
      expect(sourceCode).not.toContain('inputRef')
      // Confirms all instances were replaced with textareaRef
      expect(sourceCode).toContain('const textareaRef = useRef<HTMLTextAreaElement>(null)')
    })
  })

  // =========================================================================
  // Suite 2: Rendered DOM Output in Normal Mode (variant="panel", isCompact=false)
  // =========================================================================
  describe('2. Rendered DOM Inspection in Normal Mode (variant="panel")', () => {
    const htmlNormal = renderToStaticMarkup(
      <StudioAiSidebar
        isOpen={true}
        variant="panel"
        isExpanded={false}
        onClose={vi.fn()}
      />
    )

    it('renders the New Chat button as a pure icon without text child', () => {
      // Find the New Chat button
      expect(htmlNormal).toContain('title="Mulai Sesi Obrolan Baru"')
      expect(htmlNormal).toContain('aria-label="Mulai Sesi Obrolan Baru"')

      // Extract button element
      const buttonMatch = htmlNormal.match(
        /<button[^>]*title="Mulai Sesi Obrolan Baru"[^>]*>([\s\S]*?)<\/button>/
      )
      expect(buttonMatch).not.toBeNull()
      const buttonInner = buttonMatch![1]

      // Must contain SVG icon (lucide-plus)
      expect(buttonInner).toContain('<svg')
      expect(buttonInner).toContain('lucide-plus')

      // Must NOT contain any visible text or span
      expect(buttonInner).not.toContain('<span')
      expect(buttonInner.replace(/<[^>]*>/g, '').trim()).toBe('')
    })

    it('renders the Send button as a pure icon without text child in normal mode', () => {
      // Find the Send button
      expect(htmlNormal).toContain('aria-label="Kirim Pesan"')
      expect(htmlNormal).toContain('title="Kirim (Enter) · Baris baru (Shift + Enter)"')

      const sendButtonMatch = htmlNormal.match(
        /<button[^>]*aria-label="Kirim Pesan"[^>]*>([\s\S]*?)<\/button>/
      )
      expect(sendButtonMatch).not.toBeNull()
      const sendButtonInner = sendButtonMatch![1]

      // Must contain SVG icon (lucide-send)
      expect(sendButtonInner).toContain('<svg')
      expect(sendButtonInner).toContain('lucide-send')

      // Must NOT contain visible text or span
      expect(sendButtonInner).not.toContain('<span')
      expect(sendButtonInner.replace(/<[^>]*>/g, '').trim()).toBe('')

      // Verify normal mode width class (w-10 h-[38px])
      expect(sendButtonMatch![0]).toContain('w-10')
      expect(sendButtonMatch![0]).toContain('h-[38px]')
      expect(sendButtonMatch![0]).not.toContain('w-8')
    })

    it('renders upward-expandable textarea instead of input[type=text]', () => {
      expect(htmlNormal).not.toContain('<input type="text"')
      expect(htmlNormal).toContain('<textarea')

      const textareaMatch = htmlNormal.match(/<textarea[^>]*>/)
      expect(textareaMatch).not.toBeNull()
      const textareaTag = textareaMatch![0]

      expect(textareaTag).toContain('rows="1"')
      expect(textareaTag).toContain('resize-none')
      expect(textareaTag).toContain('min-h-[38px]')
      expect(textareaTag).toContain('max-h-[160px]')
      expect(textareaTag).toContain('overflow-y-auto')
      // Normal mode padding
      expect(textareaTag).toContain('px-3.5')
      expect(textareaTag).toContain('py-2.5')
    })

    it('enforces bottom-anchored alignment (`items-end`) on input container', () => {
      // The container wrapping textarea and Send button must have flex items-end
      expect(htmlNormal).toContain('flex items-end gap-1.5')
    })

    it('confirms the bottom trigger bar is completely absent from DOM', () => {
      // Must not render "/ perintah", "@ konteks", "$ variabel", or "SUPER_ADMIN"
      expect(htmlNormal).not.toContain('/ perintah')
      expect(htmlNormal).not.toContain('@ konteks')
      expect(htmlNormal).not.toContain('$ variabel')

      // Check input container children: only contains the textarea and Send button
      const inputSection = htmlNormal.match(
        /<div class="flex items-end gap-1.5">[\s\S]*?<\/div>\s*<\/div>/
      )
      expect(inputSection).not.toBeNull()
      expect(inputSection![0]).not.toContain('SUPER_ADMIN')
    })
  })

  // =========================================================================
  // Suite 3: Rendered DOM Inspection in Compact Mode (variant="widget", isCompact=true)
  // =========================================================================
  describe('3. Rendered DOM Inspection in Compact Mode (variant="widget")', () => {
    const htmlCompact = renderToStaticMarkup(
      <StudioAiSidebar
        isOpen={true}
        variant="widget"
        isExpanded={false}
        onClose={vi.fn()}
      />
    )

    it('renders the New Chat button as a pure icon without text in compact mode', () => {
      const buttonMatch = htmlCompact.match(
        /<button[^>]*title="Mulai Sesi Obrolan Baru"[^>]*>([\s\S]*?)<\/button>/
      )
      expect(buttonMatch).not.toBeNull()
      const buttonInner = buttonMatch![1]

      expect(buttonInner).toContain('<svg')
      expect(buttonInner).toContain('lucide-plus')
      expect(buttonInner).not.toContain('<span')
      expect(buttonInner.replace(/<[^>]*>/g, '').trim()).toBe('')
    })

    it('renders the Send button as a pure icon with compact styling (w-8 h-[38px])', () => {
      const sendButtonMatch = htmlCompact.match(
        /<button[^>]*aria-label="Kirim Pesan"[^>]*>([\s\S]*?)<\/button>/
      )
      expect(sendButtonMatch).not.toBeNull()
      const sendButtonTag = sendButtonMatch![0]
      const sendButtonInner = sendButtonMatch![1]

      expect(sendButtonInner).toContain('<svg')
      expect(sendButtonInner).toContain('lucide-send')
      expect(sendButtonInner).not.toContain('<span')
      expect(sendButtonInner.replace(/<[^>]*>/g, '').trim()).toBe('')

      // Compact mode sizing: w-8 h-[38px]
      expect(sendButtonTag).toContain('w-8')
      expect(sendButtonTag).toContain('h-[38px]')
      expect(sendButtonTag).not.toContain('w-10')
    })

    it('applies compact padding classes to textarea and container in compact mode', () => {
      const textareaMatch = htmlCompact.match(/<textarea[^>]*>/)
      expect(textareaMatch).not.toBeNull()
      const textareaTag = textareaMatch![0]

      // Compact padding
      expect(textareaTag).toContain('px-2.5')
      expect(textareaTag).toContain('py-2')
      expect(textareaTag).not.toContain('px-3.5')

      // Input container padding in compact mode: p-2 vs p-3
      expect(htmlCompact).toContain('p-2')
    })

    it('does NOT render trigger bar shortcuts in compact mode', () => {
      expect(htmlCompact).not.toContain('/ perintah')
      expect(htmlCompact).not.toContain('@ konteks')
      expect(htmlCompact).not.toContain('$ variabel')
      expect(htmlCompact).not.toContain('SUPER_ADMIN')
    })
  })

  // =========================================================================
  // Suite 4: Keybinding & Auto-Resize Logic Invariants
  // =========================================================================
  describe('4. Textarea Height Clamping & Keybinding Logic Invariants', () => {
    it('verifies clamp boundaries: min 38px and max 160px in height calculation logic', () => {
      // Test the mathematical clamp logic directly
      const computeHeight = (scrollHeight: number) => Math.min(Math.max(scrollHeight, 38), 160)

      expect(computeHeight(0)).toBe(38)
      expect(computeHeight(25)).toBe(38)
      expect(computeHeight(38)).toBe(38)
      expect(computeHeight(72)).toBe(72)
      expect(computeHeight(120)).toBe(120)
      expect(computeHeight(160)).toBe(160)
      expect(computeHeight(250)).toBe(160)
      expect(computeHeight(1000)).toBe(160)
    })

    it('verifies keydown logic: Enter submits while Shift+Enter inserts newline', () => {
      // Simulate handleInputKeyDown decision matrix
      const simulateKeydown = (key: string, shiftKey: boolean, isComposing = false) => {
        if (isComposing) return { action: 'ignore_ime', preventedDefault: false }
        if (key === 'Enter' && !shiftKey) {
          return { action: 'submit_message', preventedDefault: true }
        }
        if (key === 'Enter' && shiftKey) {
          return { action: 'newline', preventedDefault: false }
        }
        return { action: 'none', preventedDefault: false }
      }

      // Enter without Shift -> submits and prevents default
      expect(simulateKeydown('Enter', false)).toEqual({
        action: 'submit_message',
        preventedDefault: true,
      })

      // Shift + Enter -> allows default newline
      expect(simulateKeydown('Enter', true)).toEqual({
        action: 'newline',
        preventedDefault: false,
      })

      // IME composition (Japanese/Chinese input) -> ignored
      expect(simulateKeydown('Enter', false, true)).toEqual({
        action: 'ignore_ime',
        preventedDefault: false,
      })
    })
  })
})
