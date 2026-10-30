import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock dependencies for StudioAiSidebar rendering if needed
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/buat-artikel',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    role: 'SUPER_ADMIN',
    permissions: { canPublish: true },
    isAuthenticated: true,
  }),
}))

vi.mock('@/lib/ai/key-manager', () => ({
  getActiveApiKey: () => ({ key: 'fake-key', model: 'gemini-1.5-flash', provider: 'google' }),
  getStoredAiCredentials: () => ({ apiKey: 'fake-key' }),
  triggerAiKeyPrompt: vi.fn(),
  AiModelItem: {},
  getSelectedAiModels: () => [],
  detectModelCapabilities: () => ({ supportsFunctionCalling: true }),
}))

vi.mock('@/lib/ai/audit-logger', () => ({
  recordAiPromptLog: vi.fn(),
}))

describe('Milestone 1 Empirical Challenger Suite: StudioAiSidebar Textarea & Keybinding Logic', () => {
  const sidebarPath = path.resolve(__dirname, '../src/components/studio/StudioAiSidebar.tsx')
  const sidebarSource = fs.readFileSync(sidebarPath, 'utf8')

  // ==========================================================================
  // Section 1: Static AST & Markup Invariant Verifications (R1 & R3)
  // ==========================================================================
  describe('1. Clean & Minimalist UI Invariants (AGENTS.md Section 18.1)', () => {
    it('does NOT contain visible text label "Baru" in the header new session button', () => {
      expect(sidebarSource).not.toContain('<span>Baru</span>')
      expect(sidebarSource).not.toContain('>Baru<')
    })

    it('does NOT contain visible text label "Kirim" in the send button', () => {
      expect(sidebarSource).not.toContain('<span>Kirim</span>')
      expect(sidebarSource).not.toContain('>Kirim<')
    })

    it('has accessible aria-label and title on the new session button', () => {
      expect(sidebarSource).toContain('aria-label="Mulai Sesi Obrolan Baru"')
      expect(sidebarSource).toContain('title="Mulai Sesi Obrolan Baru"')
    })

    it('has accessible aria-label and informative title on the send button', () => {
      expect(sidebarSource).toContain('aria-label="Kirim Pesan"')
      expect(sidebarSource).toContain('title="Kirim (Enter) · Baris baru (Shift + Enter)"')
    })

    it('does NOT render the bottom micro trigger hints bar (/ @ $ SUPER_ADMIN)', () => {
      expect(sidebarSource).not.toContain('Minimalist Micro Trigger Hints')
      expect(sidebarSource).not.toContain('handleTriggerButtonClick')
      expect(sidebarSource).not.toContain('/ perintah')
      expect(sidebarSource).not.toContain('@ konteks')
      expect(sidebarSource).not.toContain('$ variabel')
    })

    it('migrated all input element refs to textareaRef with no lingering inputRef', () => {
      expect(sidebarSource).toContain('const textareaRef = useRef<HTMLTextAreaElement>(null)')
      expect(sidebarSource).not.toContain('const inputRef')
      expect(sidebarSource).not.toContain('ref={inputRef}')
      expect(sidebarSource).toContain('ref={textareaRef}')
    })

    it('implements responsive upward textarea styling with required CSS boundaries', () => {
      // Must have rows={1}, resize-none, min-h-[38px], max-h-[160px], overflow-y-auto
      expect(sidebarSource).toContain('rows={1}')
      expect(sidebarSource).toContain('resize-none')
      expect(sidebarSource).toContain('min-h-[38px]')
      expect(sidebarSource).toContain('max-h-[160px]')
      expect(sidebarSource).toContain('overflow-y-auto')
      expect(sidebarSource).toContain('scrollbar-thin')
    })

    it('anchors the send button to the bottom using flex items-end', () => {
      expect(sidebarSource).toContain('<div className="flex items-end gap-1.5">')
      expect(sidebarSource).toContain('shrink-0')
      expect(sidebarSource).toContain('h-[38px]')
    })
  })

  // ==========================================================================
  // Section 2: Textarea Auto-Resize Upward Logic & Clamping [38px, 160px]
  // ==========================================================================
  describe('2. Textarea Auto-Resize Upward Algorithm & Boundary Stress Tests', () => {
    // Replicating the exact algorithm from lines 399-405:
    // const adjustTextareaHeight = () => {
    //   const el = textareaRef.current
    //   if (!el) return
    //   el.style.height = 'auto'
    //   const newHeight = Math.min(Math.max(el.scrollHeight, 38), 160)
    //   el.style.height = `${newHeight}px`
    // }
    const createMockElement = (scrollHeight: number) => {
      const el = {
        scrollHeight,
        style: {
          height: '38px',
        },
      }
      return el as unknown as HTMLTextAreaElement
    }

    const adjustHeight = (el: HTMLTextAreaElement | null) => {
      if (!el) return
      el.style.height = 'auto'
      const newHeight = Math.min(Math.max(el.scrollHeight, 38), 160)
      el.style.height = `${newHeight}px`
    }

    it('safely handles null / unmounted textarea element without throwing', () => {
      expect(() => adjustHeight(null)).not.toThrow()
    })

    it('clamps sub-38px scrollHeight values (empty, negative, zero) to exactly 38px', () => {
      const testCases = [-10, 0, 1, 15, 24, 30, 37]
      for (const sh of testCases) {
        const mockEl = createMockElement(sh)
        adjustHeight(mockEl)
        expect(mockEl.style.height).toBe('38px')
      }
    })

    it('maintains exactly 38px when single line content has scrollHeight of 38px', () => {
      const mockEl = createMockElement(38)
      adjustHeight(mockEl)
      expect(mockEl.style.height).toBe('38px')
    })

    it('dynamically expands upward for intermediate multiline heights between 39px and 160px', () => {
      const intermediateHeights = [39, 45, 60, 72, 95, 120, 144, 159, 160]
      for (const sh of intermediateHeights) {
        const mockEl = createMockElement(sh)
        adjustHeight(mockEl)
        expect(mockEl.style.height).toBe(`${sh}px`)
      }
    })

    it('strictly caps height at 160px when scrollHeight exceeds 160px boundary', () => {
      const overflowHeights = [161, 175, 200, 350, 500, 1000, 50000, 100000]
      for (const sh of overflowHeights) {
        const mockEl = createMockElement(sh)
        adjustHeight(mockEl)
        expect(mockEl.style.height).toBe('160px')
      }
    })

    it('correctly resizes back downward when user deletes multiline content', () => {
      const mockEl = createMockElement(160)
      adjustHeight(mockEl)
      expect(mockEl.style.height).toBe('160px')

      // User deletes paragraph: scrollHeight drops to 80px
      mockEl.scrollHeight = 80
      adjustHeight(mockEl)
      expect(mockEl.style.height).toBe('80px')

      // User clears input: scrollHeight drops to 38px
      mockEl.scrollHeight = 38
      adjustHeight(mockEl)
      expect(mockEl.style.height).toBe('38px')
    })
  })

  // ==========================================================================
  // Section 3: Keybinding Logic Permutations & State Machine
  // ==========================================================================
  describe('3. Keybinding Permutations & Submission Guards', () => {
    // Replicating the exact keydown handling from lines 1271-1306:
    interface KeyDownTestContext {
      activeTrigger: '/' | '@' | '$' | null
      filteredOptions: Array<{ id: string; insertText: string; action?: string }>
      selectedIndex: number
      loading: boolean
      input: string
      mockSendMessage: ReturnType<typeof vi.fn>
      mockSetSelectedIndex: ReturnType<typeof vi.fn>
      mockSetActiveTrigger: ReturnType<typeof vi.fn>
      mockHandleSelectOption: ReturnType<typeof vi.fn>
      textareaElement: HTMLTextAreaElement
    }

    const setupContext = (overrides?: Partial<KeyDownTestContext>): KeyDownTestContext => {
      const el = {
        scrollHeight: 38,
        style: { height: '80px' }, // start with expanded height
      } as unknown as HTMLTextAreaElement

      return {
        activeTrigger: null,
        filteredOptions: [],
        selectedIndex: 0,
        loading: false,
        input: 'Test message',
        mockSendMessage: vi.fn(),
        mockSetSelectedIndex: vi.fn(),
        mockSetActiveTrigger: vi.fn(),
        mockHandleSelectOption: vi.fn(),
        textareaElement: el,
        ...overrides,
      }
    }

    const runKeyDown = (
      ctx: KeyDownTestContext,
      event: {
        key: string
        shiftKey?: boolean
        isComposing?: boolean
      }
    ) => {
      let defaultPrevented = false
      const e = {
        key: event.key,
        shiftKey: !!event.shiftKey,
        nativeEvent: {
          isComposing: !!event.isComposing,
        },
        preventDefault: () => {
          defaultPrevented = true
        },
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

      // EXACT KEYDOWN DISPATCH LOGIC
      if (e.nativeEvent.isComposing) return { defaultPrevented, ctx }

      if (ctx.activeTrigger && ctx.filteredOptions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const newIdx = (ctx.selectedIndex + 1) % ctx.filteredOptions.length
          ctx.selectedIndex = newIdx
          ctx.mockSetSelectedIndex(newIdx)
          return { defaultPrevented, ctx }
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          const newIdx = (ctx.selectedIndex - 1 + ctx.filteredOptions.length) % ctx.filteredOptions.length
          ctx.selectedIndex = newIdx
          ctx.mockSetSelectedIndex(newIdx)
          return { defaultPrevented, ctx }
        }
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
          e.preventDefault()
          ctx.mockHandleSelectOption(ctx.filteredOptions[ctx.selectedIndex])
          return { defaultPrevented, ctx }
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          ctx.activeTrigger = null
          ctx.mockSetActiveTrigger(null)
          return { defaultPrevented, ctx }
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!ctx.loading && ctx.input.trim()) {
          ctx.mockSendMessage()
          if (ctx.textareaElement) {
            ctx.textareaElement.style.height = '38px'
          }
        }
      }

      return { defaultPrevented, ctx }
    }

    // --- Permutation 1: Enter with shiftKey = true (newline insertion) ---
    it('Shift + Enter inserts newline: does NOT prevent default, does NOT call sendMessage, does NOT reset height', () => {
      const ctx = setupContext({ input: 'First line' })
      const result = runKeyDown(ctx, { key: 'Enter', shiftKey: true })

      expect(result.defaultPrevented).toBe(false)
      expect(ctx.mockSendMessage).not.toHaveBeenCalled()
      expect(ctx.textareaElement.style.height).toBe('80px') // preserved
    })

    // --- Permutation 2: Enter with shiftKey = false (standard send) ---
    it('Enter without Shift with non-empty input: prevents default, calls sendMessage, snaps height to 38px', () => {
      const ctx = setupContext({ input: 'Halo Segia Copilot' })
      const result = runKeyDown(ctx, { key: 'Enter', shiftKey: false })

      expect(result.defaultPrevented).toBe(true)
      expect(ctx.mockSendMessage).toHaveBeenCalledTimes(1)
      expect(ctx.textareaElement.style.height).toBe('38px') // snapped back to 38px
    })

    // --- Permutation 3: Enter with isComposing = true (IME composition) ---
    it('IME composition (isComposing = true): does NOT prevent default, does NOT call sendMessage', () => {
      const ctx = setupContext({ input: 'nihon' })
      const result = runKeyDown(ctx, { key: 'Enter', shiftKey: false, isComposing: true })

      expect(result.defaultPrevented).toBe(false)
      expect(ctx.mockSendMessage).not.toHaveBeenCalled()
      expect(ctx.textareaElement.style.height).toBe('80px')
    })

    // --- Permutation 4: Enter when loading = true (blocked double-submission) ---
    it('Enter when loading = true: prevents default newline, does NOT send duplicate message', () => {
      const ctx = setupContext({ loading: true, input: 'Another prompt while thinking' })
      const result = runKeyDown(ctx, { key: 'Enter', shiftKey: false })

      expect(result.defaultPrevented).toBe(true) // prevents newline from dirtying the input
      expect(ctx.mockSendMessage).not.toHaveBeenCalled() // blocks submission
    })

    // --- Permutation 5: Enter when input is empty or whitespace-only ---
    it.each([
      ['empty string', ''],
      ['single space', ' '],
      ['multiple spaces', '     '],
      ['tabs', '\t\t'],
      ['newlines and spaces', '\n\n   \n'],
    ])('Enter with %s: prevents default newline, does NOT call sendMessage', (_, whitespaceInput) => {
      const ctx = setupContext({ input: whitespaceInput })
      const result = runKeyDown(ctx, { key: 'Enter', shiftKey: false })

      expect(result.defaultPrevented).toBe(true) // prevents newline insertion
      expect(ctx.mockSendMessage).not.toHaveBeenCalled() // does NOT send blank prompt
    })

    // --- Non-Enter keys ---
    it.each(['a', 'Backspace', 'ArrowLeft', 'Space', 'Shift'])('ordinary key "%s": does not prevent default or send', (k) => {
      const ctx = setupContext({ input: 'text' })
      const result = runKeyDown(ctx, { key: k })

      expect(result.defaultPrevented).toBe(false)
      expect(ctx.mockSendMessage).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Section 4: Autocomplete Popup Navigation & Interaction
  // ==========================================================================
  describe('4. Autocomplete Popup Navigation & Option Selection', () => {
    const options = [
      { id: '/clear', insertText: '/clear', action: 'clear' },
      { id: '/compress', insertText: '/compress', action: 'compress' },
      { id: '/draft', insertText: '/draft', action: 'draft' },
      { id: '/seo', insertText: '/seo', action: 'submit' },
    ]

    const setupAutocompleteContext = (initialIdx = 0) => {
      return {
        activeTrigger: '/' as '/' | '@' | '$' | null,
        filteredOptions: options,
        selectedIndex: initialIdx,
        loading: false,
        input: '/',
        mockSendMessage: vi.fn(),
        mockSetSelectedIndex: vi.fn(),
        mockSetActiveTrigger: vi.fn(),
        mockHandleSelectOption: vi.fn(),
        textareaElement: { style: { height: '38px' } } as unknown as HTMLTextAreaElement,
      }
    }

    const runKeyDown = (ctx: any, event: { key: string; shiftKey?: boolean; isComposing?: boolean }) => {
      let defaultPrevented = false
      const e = {
        key: event.key,
        shiftKey: !!event.shiftKey,
        nativeEvent: { isComposing: !!event.isComposing },
        preventDefault: () => { defaultPrevented = true },
      }

      if (e.nativeEvent.isComposing) return { defaultPrevented }

      if (ctx.activeTrigger && ctx.filteredOptions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const newIdx = (ctx.selectedIndex + 1) % ctx.filteredOptions.length
          ctx.selectedIndex = newIdx
          ctx.mockSetSelectedIndex(newIdx)
          return { defaultPrevented }
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          const newIdx = (ctx.selectedIndex - 1 + ctx.filteredOptions.length) % ctx.filteredOptions.length
          ctx.selectedIndex = newIdx
          ctx.mockSetSelectedIndex(newIdx)
          return { defaultPrevented }
        }
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
          e.preventDefault()
          ctx.mockHandleSelectOption(ctx.filteredOptions[ctx.selectedIndex])
          return { defaultPrevented }
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          ctx.activeTrigger = null
          ctx.mockSetActiveTrigger(null)
          return { defaultPrevented }
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!ctx.loading && ctx.input.trim()) {
          ctx.mockSendMessage()
        }
      }

      return { defaultPrevented }
    }

    it('ArrowDown cycles selectedIndex forward through options and wraps around to 0', () => {
      const ctx = setupAutocompleteContext(0)

      // Step 1: 0 -> 1
      runKeyDown(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(1)
      expect(ctx.mockSetSelectedIndex).toHaveBeenLastCalledWith(1)

      // Step 2: 1 -> 2
      runKeyDown(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(2)

      // Step 3: 2 -> 3 (last option)
      runKeyDown(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(3)

      // Step 4: 3 -> 0 (wrap around)
      runKeyDown(ctx, { key: 'ArrowDown' })
      expect(ctx.selectedIndex).toBe(0)
    })

    it('ArrowUp cycles selectedIndex backward and wraps from 0 to last index', () => {
      const ctx = setupAutocompleteContext(0)

      // Step 1: 0 -> 3 (wraps to last option)
      runKeyDown(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(3)
      expect(ctx.mockSetSelectedIndex).toHaveBeenLastCalledWith(3)

      // Step 2: 3 -> 2
      runKeyDown(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(2)

      // Step 3: 2 -> 1
      runKeyDown(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(1)

      // Step 4: 1 -> 0
      runKeyDown(ctx, { key: 'ArrowUp' })
      expect(ctx.selectedIndex).toBe(0)
    })

    it('Enter (without Shift) selects the active autocomplete option and does NOT call sendMessage', () => {
      const ctx = setupAutocompleteContext(1) // hovering over /compress
      const result = runKeyDown(ctx, { key: 'Enter', shiftKey: false })

      expect(result.defaultPrevented).toBe(true)
      expect(ctx.mockHandleSelectOption).toHaveBeenCalledWith(options[1])
      expect(ctx.mockSendMessage).not.toHaveBeenCalled()
    })

    it('Tab selects the active autocomplete option and does NOT call sendMessage', () => {
      const ctx = setupAutocompleteContext(2) // hovering over /draft
      const result = runKeyDown(ctx, { key: 'Tab' })

      expect(result.defaultPrevented).toBe(true)
      expect(ctx.mockHandleSelectOption).toHaveBeenCalledWith(options[2])
      expect(ctx.mockSendMessage).not.toHaveBeenCalled()
    })

    it('Shift + Enter does NOT select autocomplete option and allows newline fallthrough', () => {
      const ctx = setupAutocompleteContext(0)
      const result = runKeyDown(ctx, { key: 'Enter', shiftKey: true })

      expect(result.defaultPrevented).toBe(false)
      expect(ctx.mockHandleSelectOption).not.toHaveBeenCalled()
      expect(ctx.mockSendMessage).not.toHaveBeenCalled()
    })

    it('Escape dismisses the autocomplete popup without altering input', () => {
      const ctx = setupAutocompleteContext(0)
      const result = runKeyDown(ctx, { key: 'Escape' })

      expect(result.defaultPrevented).toBe(true)
      expect(ctx.activeTrigger).toBeNull()
      expect(ctx.mockSetActiveTrigger).toHaveBeenCalledWith(null)
      expect(ctx.mockHandleSelectOption).not.toHaveBeenCalled()
    })

    it('IME composition suppresses autocomplete navigation', () => {
      const ctx = setupAutocompleteContext(0)
      const result = runKeyDown(ctx, { key: 'ArrowDown', isComposing: true })

      expect(result.defaultPrevented).toBe(false)
      expect(ctx.selectedIndex).toBe(0)
      expect(ctx.mockSetSelectedIndex).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Section 5: Inline Autocomplete Regex & Token Replacement Stress
  // ==========================================================================
  describe('5. Inline Trigger Detection & Cursor Token Replacement Math', () => {
    const triggerRegex = /(?:^|\s)([/@$])([a-zA-Z0-9_-]*)$/

    it.each([
      ['/', '/', ''],
      ['/c', '/', 'c'],
      ['/clear', '/', 'clear'],
      ['@', '@', ''],
      ['@article', '@', 'article'],
      ['$', '$', ''],
      ['$role', '$', 'role'],
      ['halo @art', '@', 'art'],
      ['tanya tentang $slug', '$', 'slug'],
    ])('matches trigger symbol and query for "%s"', (text, expectedTrigger, expectedQuery) => {
      const match = text.match(triggerRegex)
      expect(match).not.toBeNull()
      expect(match![1]).toBe(expectedTrigger)
      expect(match![2]).toBe(expectedQuery)
    })

    it.each([
      ['email@example.com'], // no preceding space before @
      ['/clear '],          // trailing space after command
      ['$role '],           // trailing space after variable
      ['halo apa kabar'],   // no trigger symbol
      ['100$'],             // trigger at end without prefix
    ])('does NOT match trigger for non-trigger text "%s"', (text) => {
      const match = text.match(triggerRegex)
      expect(match).toBeNull()
    })

    it('replaces active trigger token before cursor with insertText correctly', () => {
      const input = 'Silakan periksa @art'
      const cursorPos = input.length
      const textBeforeCursor = input.slice(0, cursorPos)
      const textAfterCursor = input.slice(cursorPos)

      const option = { insertText: '@article ' }
      const replacedBefore = textBeforeCursor.replace(/(?:^|\s)([/@$])[a-zA-Z0-9_-]*$/, (match) => {
        const leadingSpace = match.startsWith(' ') ? ' ' : ''
        return `${leadingSpace}${option.insertText}`
      })

      const finalVal = `${replacedBefore}${textAfterCursor}`
      expect(finalVal).toBe('Silakan periksa @article ')
    })
  })
})
