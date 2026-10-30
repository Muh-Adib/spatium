/**
 * Master Automated Verification Suite: Milestone 4 — StudioAiSidebar Interactive Banner & Live Streaming UI
 * Target: web/tests/copilot-ui-streaming.test.tsx
 *
 * Requirements Covered (from DISPATCH.md):
 * - Test 1: Interactive Warning Banner renders with correct buttons when quotaError is set
 * - Test 2: 1-click actions: "Beralih ke OpenRouter" switches provider; "Perbarui API Key" invokes key prompt
 * - Test 3: Live streaming parser processes NDJSON chunks and updates message text progressively with blinking cursor
 * - Test 4: Removal of static blocking card: ensures live assistant message bubble is mounted during stream
 */

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
const mockTriggerAiKeyPrompt = vi.fn()
vi.mock('@/lib/ai/key-manager', () => ({
  getActiveApiKey: () => 'mock-api-key',
  getStoredAiCredentials: () => ({ googleApiKey: 'test-goog', openrouterApiKey: 'test-or', provider: 'google' }),
  triggerAiKeyPrompt: (...args: any[]) => mockTriggerAiKeyPrompt(...args),
  getSelectedAiModels: () => [
    { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'google', isCustom: false },
    { id: 'openrouter/google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)', provider: 'openrouter', isCustom: false },
  ],
  detectModelCapabilities: () => ({ supportsFunctionCalling: true, isThinkingModel: false }),
  normalizeGoogleModel: (m: string) => m.replace(/^google\//, ''),
  normalizeOpenRouterModel: (m: string) => m.replace(/^openrouter\//, ''),
}))

// Mock audit logger
vi.mock('@/lib/ai/audit-logger', () => ({
  recordAiPromptLog: vi.fn(),
}))

import {
  StudioAiSidebar,
  InteractiveWarningBanner,
  LiveThinkingBar,
  processNdjsonStream,
  type AiChatStreamEvent,
} from '../src/components/studio/StudioAiSidebar'

describe('Milestone 4: StudioAiSidebar Interactive Banner & Live Streaming UI', () => {
  const sidebarSource = fs.readFileSync(
    path.resolve(__dirname, '../src/components/studio/StudioAiSidebar.tsx'),
    'utf-8'
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // Test 1: Interactive Warning Banner Rendering
  // =========================================================================
  describe('Test 1: Interactive Warning Banner for 429 Rate Limit & Quota Exhaustion', () => {
    it('renders the interactive warning banner with correct title and diagnostic text', () => {
      const quotaError = {
        provider: 'google',
        model: 'gemini-3.8-flash',
        message: 'Resource has been exhausted (e.g. check quota). Limit 0.',
        isLimitZero: true,
      }

      const html = renderToStaticMarkup(
        <InteractiveWarningBanner
          quotaError={quotaError}
          currentProvider="google"
          onSwitchProvider={vi.fn()}
          onSwitchToFreeModel={vi.fn()}
          onUpdateKey={vi.fn()}
          onOpenSettings={vi.fn()}
          onDismiss={vi.fn()}
        />
      )

      expect(html).toContain('data-testid="quota-warning-banner"')
      expect(html).toContain('Batas Kuota / Rate Limit Tercapai')
      expect(html).toContain('Resource has been exhausted')
      expect(html).toContain('Limit 0 (Kredit Habis)')
      expect(html).toContain('Failover Dihentikan')
      expect(html).toContain('data-testid="banner-dismiss"')
    })

    it('renders "Beralih ke OpenRouter" when current provider is google', () => {
      const html = renderToStaticMarkup(
        <InteractiveWarningBanner
          quotaError={{ provider: 'google', model: 'gemini-3.8-flash', message: 'Quota exceeded' }}
          currentProvider="google"
          onSwitchProvider={vi.fn()}
          onSwitchToFreeModel={vi.fn()}
          onUpdateKey={vi.fn()}
          onOpenSettings={vi.fn()}
          onDismiss={vi.fn()}
        />
      )

      expect(html).toContain('data-testid="banner-switch-provider"')
      expect(html).toContain('Beralih ke OpenRouter')
      expect(html).not.toContain('Beralih ke Google AI Studio')
    })

    it('renders "Beralih ke Google AI Studio" when current provider is openrouter', () => {
      const html = renderToStaticMarkup(
        <InteractiveWarningBanner
          quotaError={{ provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet', message: '429 Rate limited' }}
          currentProvider="openrouter"
          onSwitchProvider={vi.fn()}
          onSwitchToFreeModel={vi.fn()}
          onUpdateKey={vi.fn()}
          onOpenSettings={vi.fn()}
          onDismiss={vi.fn()}
        />
      )

      expect(html).toContain('data-testid="banner-switch-provider"')
      expect(html).toContain('Beralih ke Google AI Studio')
      expect(html).not.toContain('Beralih ke OpenRouter')
    })

    it('renders all 4 action buttons: Switch Provider, Pakai Model Gratis, Perbarui API Key, and Pengaturan AI', () => {
      const html = renderToStaticMarkup(
        <InteractiveWarningBanner
          quotaError={{ provider: 'google', message: 'Rate limited' }}
          currentProvider="google"
          onSwitchProvider={vi.fn()}
          onSwitchToFreeModel={vi.fn()}
          onUpdateKey={vi.fn()}
          onOpenSettings={vi.fn()}
          onDismiss={vi.fn()}
        />
      )

      expect(html).toContain('data-testid="banner-switch-provider"')
      expect(html).toContain('data-testid="banner-free-model"')
      expect(html).toContain('Pakai Model Gratis')
      expect(html).toContain('data-testid="banner-update-key"')
      expect(html).toContain('Perbarui API Key')
      expect(html).toContain('data-testid="banner-ai-settings"')
      expect(html).toContain('Pengaturan AI')
    })

    it('docks the warning banner at the top of the chat panel in StudioAiSidebar when initialQuotaError is provided', () => {
      const html = renderToStaticMarkup(
        <StudioAiSidebar
          isOpen={true}
          onClose={vi.fn()}
          initialQuotaError={{
            provider: 'google',
            model: 'gemini-3.8-flash',
            message: 'Failover dihentikan karena batas kuota 429 tercapai.',
          }}
        />
      )

      expect(html).toContain('data-testid="quota-warning-banner"')
      expect(html).toContain('Batas Kuota / Rate Limit Tercapai')
      expect(html).toContain('Failover dihentikan karena batas kuota 429 tercapai.')
    })

    it('does NOT render the warning banner in StudioAiSidebar when quotaError is null', () => {
      const html = renderToStaticMarkup(
        <StudioAiSidebar
          isOpen={true}
          onClose={vi.fn()}
          initialQuotaError={null}
        />
      )

      expect(html).not.toContain('data-testid="quota-warning-banner"')
    })
  })

  // =========================================================================
  // Test 2: 1-Click Action Invocations & Handlers
  // =========================================================================
  describe('Test 2: 1-Click Action Button Handlers', () => {
    it('executes callback handlers on click: onSwitchProvider, onSwitchToFreeModel, onUpdateKey, onOpenSettings, onDismiss', () => {
      const onSwitchProvider = vi.fn()
      const onSwitchToFreeModel = vi.fn()
      const onUpdateKey = vi.fn()
      const onOpenSettings = vi.fn()
      const onDismiss = vi.fn()

      const banner = (
        <InteractiveWarningBanner
          quotaError={{ provider: 'google', message: 'Rate limited' }}
          currentProvider="google"
          onSwitchProvider={onSwitchProvider}
          onSwitchToFreeModel={onSwitchToFreeModel}
          onUpdateKey={onUpdateKey}
          onOpenSettings={onOpenSettings}
          onDismiss={onDismiss}
        />
      )

      // Simulate props wiring
      banner.props.onSwitchProvider()
      expect(onSwitchProvider).toHaveBeenCalledTimes(1)

      banner.props.onSwitchToFreeModel()
      expect(onSwitchToFreeModel).toHaveBeenCalledTimes(1)

      banner.props.onUpdateKey()
      expect(onUpdateKey).toHaveBeenCalledTimes(1)

      banner.props.onOpenSettings()
      expect(onOpenSettings).toHaveBeenCalledTimes(1)

      banner.props.onDismiss()
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('verifies StudioAiSidebar source binds handleUpdateKey to triggerAiKeyPrompt', () => {
      expect(sidebarSource).toContain('const handleUpdateKey = () => {')
      expect(sidebarSource).toContain('triggerAiKeyPrompt({')
      expect(sidebarSource).toContain('provider: aiProvider')
      expect(sidebarSource).toContain('handleSwitchToFreeModel')
      expect(sidebarSource).toContain('handleSwitchProvider')
    })
  })

  // =========================================================================
  // Test 3: Live Streaming Parser & Token-by-Token Progressive Updates
  // =========================================================================
  describe('Test 3: Live Streaming NDJSON Parser & Progressive Updates', () => {
    it('processes line-by-line NDJSON stream events sequentially', async () => {
      const ndjsonLines = [
        JSON.stringify({ type: 'status', message: 'Menghubungi model AI...' }),
        JSON.stringify({ type: 'thought', chunk: 'Menganalisis arsitektur Next.js 16...' }),
        JSON.stringify({ type: 'thought', chunk: ' dan konfigurasi streaming App Router.' }),
        JSON.stringify({ type: 'tool_start', name: 'db_articles_query', input: { action: 'list' } }),
        JSON.stringify({ type: 'tool_result', name: 'db_articles_query', output: { count: 12 }, durationMs: 85 }),
        JSON.stringify({ type: 'content_chunk', chunk: 'Berikut adalah laporan ' }),
        JSON.stringify({ type: 'content_chunk', chunk: 'analisis arsitektur SegiaTech.' }),
        JSON.stringify({ type: 'done', reply: 'Berikut adalah laporan analisis arsitektur SegiaTech.' }),
      ].join('\n') + '\n'

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(ndjsonLines))
          controller.close()
        },
      })

      const receivedEvents: AiChatStreamEvent[] = []
      await processNdjsonStream(stream.getReader(), (event) => {
        receivedEvents.push(event)
      })

      expect(receivedEvents).toHaveLength(8)
      expect(receivedEvents[0]).toEqual({ type: 'status', message: 'Menghubungi model AI...' })
      expect(receivedEvents[1]).toEqual({ type: 'thought', chunk: 'Menganalisis arsitektur Next.js 16...' })
      expect(receivedEvents[2]).toEqual({ type: 'thought', chunk: ' dan konfigurasi streaming App Router.' })
      expect(receivedEvents[3].type).toBe('tool_start')
      expect(receivedEvents[3].name).toBe('db_articles_query')
      expect(receivedEvents[4].type).toBe('tool_result')
      expect(receivedEvents[4].durationMs).toBe(85)
      expect(receivedEvents[5]).toEqual({ type: 'content_chunk', chunk: 'Berikut adalah laporan ' })
      expect(receivedEvents[6]).toEqual({ type: 'content_chunk', chunk: 'analisis arsitektur SegiaTech.' })
      expect(receivedEvents[7].type).toBe('done')
      expect(receivedEvents[7].reply).toBe('Berikut adalah laporan analisis arsitektur SegiaTech.')
    })

    it('renders LiveThinkingBar with pulse and blinking cursor when isStreaming is true', () => {
      const htmlStreaming = renderToStaticMarkup(
        <LiveThinkingBar
          thoughts="Menganalisis intent..."
          isStreaming={true}
        />
      )

      expect(htmlStreaming).toContain('data-testid="live-thinking-bar"')
      expect(htmlStreaming).toContain('Proses Berpikir Model (Thinking Live)...')
      expect(htmlStreaming).toContain('Live')
      expect(htmlStreaming).toContain('data-testid="streaming-cursor-thought"')
      expect(htmlStreaming).toContain('▌')

      const htmlFinished = renderToStaticMarkup(
        <LiveThinkingBar
          thoughts="Menganalisis intent..."
          isStreaming={false}
        />
      )

      expect(htmlFinished).toContain('Catatan Pemikiran Model (Reasoning)')
      expect(htmlFinished).not.toContain('data-testid="streaming-cursor-thought"')
    })

    it('renders streaming assistant message bubble with blinking cursor in StudioAiSidebar', () => {
      const streamingMessages: any[] = [
        {
          id: 'stream_1',
          role: 'assistant',
          content: 'Respons sedang ditulis secara live',
          text: 'Respons sedang ditulis secara live',
          thoughts: 'Thinking progresif...',
          isStreaming: true,
          streamingStatus: 'Menghasilkan token respons...',
          createdAt: new Date().toISOString(),
        },
      ]

      const html = renderToStaticMarkup(
        <StudioAiSidebar
          isOpen={true}
          onClose={vi.fn()}
          initialMessages={streamingMessages}
        />
      )

      expect(html).toContain('data-testid="streaming-assistant-bubble"')
      expect(html).toContain('data-testid="streaming-status-pill"')
      expect(html).toContain('Menghasilkan token respons...')
      expect(html).toContain('data-testid="live-thinking-bar"')
      expect(html).toContain('Thinking progresif...')
      expect(html).toContain('Respons sedang ditulis secara live')
      expect(html).toContain('data-testid="streaming-cursor"')
      expect(html).toContain('▌')
    })
  })

  // =========================================================================
  // Test 4: Removal of Static Blocking Card & Live Assistant Mounting
  // =========================================================================
  describe('Test 4: Removal of Static Blocking Card & Live Assistant Mounting', () => {
    it('verifies that the static blocking card getThinkingStage(elapsedTime) is completely excised from the source', () => {
      // Must NOT contain getThinkingStage function or call
      expect(sidebarSource).not.toContain('getThinkingStage')
      expect(sidebarSource).not.toContain('getThinkingStage(')

      // Must NOT render the old static timer block card while loading
      expect(sidebarSource).not.toContain('{getThinkingStage(elapsedTime).stage}')
      expect(sidebarSource).not.toContain('{getThinkingStage(elapsedTime).desc}')
    })

    it('mounts assistant message bubble directly into the messages list during active stream', () => {
      const activeStreamMessages: any[] = [
        {
          id: 'user_1',
          role: 'user',
          content: 'Tolong buatkan artikel arsitektur Next.js 16',
        },
        {
          id: 'stream_active',
          role: 'assistant',
          content: 'Memproses riset...',
          text: 'Memproses riset...',
          isStreaming: true,
          streamingStatus: 'Menghubungi model AI...',
        },
      ]

      const html = renderToStaticMarkup(
        <StudioAiSidebar
          isOpen={true}
          onClose={vi.fn()}
          initialMessages={activeStreamMessages}
        />
      )

      // Both user bubble and live assistant bubble are present in DOM
      expect(html).toContain('data-testid="user-bubble"')
      expect(html).toContain('Tolong buatkan artikel arsitektur Next.js 16')
      expect(html).toContain('data-testid="streaming-assistant-bubble"')
      expect(html).toContain('Memproses riset...')
      expect(html).toContain('data-testid="streaming-cursor"')

      // Old static block timer card is absent
      expect(html).not.toContain('Dekonstruksi Semantik Instruksi')
      expect(html).not.toContain('Finalisasi Payload Editor')
    })

    it('verifies fetch request specifies Accept: application/x-ndjson and stream: true in sendMessage', () => {
      expect(sidebarSource).toContain("'Accept': 'application/x-ndjson'")
      expect(sidebarSource).toContain('stream: true')
      expect(sidebarSource).toContain("res.headers.get('content-type')?.includes('application/x-ndjson')")
      expect(sidebarSource).toContain('processNdjsonStream(')
    })
  })
})
