import { describe, it, expect, beforeEach, beforeAll } from 'vitest'

class MockStorage {
  private store: Record<string, string> = {}
  getItem(key: string) {
    return this.store[key] || null
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value)
  }
  removeItem(key: string) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
}

const mockListeners: Record<string, ((e: any) => void)[]> = {}

beforeAll(() => {
  const storage = new MockStorage()
  const customWindow: any = {
    localStorage: storage,
    addEventListener: (type: string, listener: any) => {
      if (!mockListeners[type]) mockListeners[type] = []
      mockListeners[type].push(listener)
    },
    removeEventListener: (type: string, listener: any) => {
      if (!mockListeners[type]) return
      mockListeners[type] = mockListeners[type].filter((l) => l !== listener)
    },
    dispatchEvent: (event: any) => {
      const list = mockListeners[event.type] || []
      list.forEach((l) => l(event))
      return true
    },
  }

  // Provide window, CustomEvent, and localStorage in node test environment
  ;(globalThis as any).window = customWindow
  ;(globalThis as any).localStorage = storage
  if (typeof (globalThis as any).CustomEvent === 'undefined') {
    class CustomEventPolyfill {
      type: string
      detail: any
      constructor(type: string, params?: { detail?: any }) {
        this.type = type
        this.detail = params?.detail
      }
    }
    ;(globalThis as any).CustomEvent = CustomEventPolyfill
  }
})

import {
  getStoredAiCredentials,
  hasActiveAiKey,
  saveApiKeyItem,
  triggerAiKeyPrompt,
} from '@/lib/ai/key-manager'

describe('Studio AI Key Manager & Prompt Automation', () => {
  beforeEach(() => {
    ;(globalThis as any).window.localStorage.clear()
    Object.keys(mockListeners).forEach((k) => delete mockListeners[k])
  })

  it('correctly reports hasActiveAiKey = false when no key is configured', () => {
    const creds = getStoredAiCredentials()
    expect(creds.hasKey).toBe(false)
    expect(creds.apiKey).toBe('')
    expect(hasActiveAiKey()).toBe(false)
  })

  it('stores and retrieves dynamic API keys via saveApiKeyItem', () => {
    saveApiKeyItem({
      name: 'Google Gemini Test',
      provider: 'google',
      key: 'AIzaSyTestDynamicKey123',
      isActive: true,
    })

    const creds = getStoredAiCredentials('google')
    expect(creds.hasKey).toBe(true)
    expect(creds.apiKey).toBe('AIzaSyTestDynamicKey123')
    expect(creds.provider).toBe('google')
    expect(hasActiveAiKey('google')).toBe(true)
  })

  it('triggers custom event segiatech:open-ai-key-modal on triggerAiKeyPrompt', () => {
    let eventFired = false
    let eventDetail: any = null

    const listener = (e: any) => {
      eventFired = true
      eventDetail = e.detail
    }

    ;(globalThis as any).window.addEventListener('segiatech:open-ai-key-modal', listener)

    triggerAiKeyPrompt({
      featureName: 'Saran SEO Otomatis',
      reason: 'Masukkan API Key untuk melanjutkan',
      provider: 'google',
    })

    expect(eventFired).toBe(true)
    expect(eventDetail?.featureName).toBe('Saran SEO Otomatis')
    expect(eventDetail?.reason).toBe('Masukkan API Key untuk melanjutkan')

    ;(globalThis as any).window.removeEventListener('segiatech:open-ai-key-modal', listener)
  })

  it('falls back seamlessly to available provider when preferred provider key is missing', () => {
    saveApiKeyItem({
      name: 'OpenRouter Backup',
      provider: 'openrouter',
      key: 'sk-or-v1-testkey999',
      isActive: true,
    })

    // Requesting google credentials should fall back to openrouter credentials
    const creds = getStoredAiCredentials('google')
    expect(creds.hasKey).toBe(true)
    expect(creds.apiKey).toBe('sk-or-v1-testkey999')
    expect(creds.provider).toBe('openrouter')
  })
})
