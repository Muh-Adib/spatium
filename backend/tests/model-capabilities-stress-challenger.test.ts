import { describe, it, expect } from 'vitest'
import {
  normalizeGoogleModel,
  detectModelCapabilities,
  DEFAULT_SELECTED_MODELS,
  AiModelItem,
} from '@/lib/ai/model-capabilities'

describe('Empirical Challenger M1-2: Capabilities & Model Stress Suite', () => {
  describe('1. Gemini 3.x Models Capability Detection', () => {
    it('detects text, vision, and thinking for gemini-3.8-flash', () => {
      const caps = detectModelCapabilities('gemini-3.8-flash')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).toContain('thinking')
    })

    it('detects text, vision, and thinking for gemini-3-flash', () => {
      const caps = detectModelCapabilities('gemini-3-flash')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).toContain('thinking')
    })

    it('detects text, vision, and thinking for gemini-3.0-pro and gemini-3.0-flash', () => {
      const capsPro = detectModelCapabilities('gemini-3.0-pro')
      expect(capsPro).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))

      const capsFlash = detectModelCapabilities('gemini-3.0-flash')
      expect(capsFlash).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
    })

    it('detects capabilities on raw IDs with google/ prefix and OpenRouter tags', () => {
      const caps = detectModelCapabilities('google/gemini-3.8-flash:free')
      expect(caps).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
    })

    it('is case-insensitive for Gemini 3.x models', () => {
      const capsUpper = detectModelCapabilities('GEMINI-3.8-FLASH')
      expect(capsUpper).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
    })
  })

  describe('2. Gemini 2.5 Models Capability Detection', () => {
    it('detects text, vision, and thinking for google/gemini-2.5-pro:free', () => {
      const caps = detectModelCapabilities('google/gemini-2.5-pro:free')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).toContain('thinking')
    })

    it('detects text, vision, and thinking for gemini-2.5-flash', () => {
      const caps = detectModelCapabilities('gemini-2.5-flash')
      expect(caps).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
    })

    it('detects text, vision, and thinking for models/gemini-2.5-pro:online', () => {
      const caps = detectModelCapabilities('models/gemini-2.5-pro:online')
      expect(caps).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
    })
  })

  describe('3. Gemini 1.5 Baseline Models (Non-Thinking Verification)', () => {
    it('detects text and vision, but NOT thinking for gemini-1.5-flash', () => {
      const caps = detectModelCapabilities('gemini-1.5-flash')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).not.toContain('thinking')
    })

    it('detects text and vision, but NOT thinking for gemini-1.5-pro', () => {
      const caps = detectModelCapabilities('gemini-1.5-pro')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).not.toContain('thinking')
    })

    it('detects text and vision, but NOT thinking for gemini-2.0-flash standard', () => {
      const caps = detectModelCapabilities('gemini-2.0-flash')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).not.toContain('thinking')
    })

    it('detects thinking for explicit thinking model gemini-2.0-flash-thinking-exp', () => {
      const caps = detectModelCapabilities('gemini-2.0-flash-thinking-exp')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).toContain('thinking')
    })
  })

  describe('4. Additional Modalities & Multi-Capability Stress', () => {
    it('detects code capability when model name contains coder/code', () => {
      const caps = detectModelCapabilities('gemini-3.8-flash-coder')
      expect(caps).toEqual(expect.arrayContaining(['text', 'vision', 'thinking', 'code']))
    })

    it('detects image-gen capability for imagen and flux models', () => {
      const capsImagen = detectModelCapabilities('gemini-imagen-3')
      expect(capsImagen).toContain('image-gen')

      const capsFlux = detectModelCapabilities('flux-schnell')
      expect(capsFlux).toContain('image-gen')
    })

    it('honors rawData overrides for hasThinking, description, and modality', () => {
      const customModel = detectModelCapabilities('custom-unknown-model', {
        hasThinking: true,
        architecture: { modality: 'text->image' },
      })
      expect(customModel).toContain('thinking')
      expect(customModel).toContain('vision')
    })
  })

  describe('5. Edge Cases & Resilience in detectModelCapabilities', () => {
    it('handles empty string gracefully', () => {
      const caps = detectModelCapabilities('')
      expect(caps).toEqual(['text'])
    })

    it('handles undefined or null without throwing', () => {
      expect(detectModelCapabilities(undefined as any)).toEqual(['text'])
      expect(detectModelCapabilities(null as any)).toEqual(['text'])
    })
  })

  describe('6. DEFAULT_SELECTED_MODELS Validation & Integrity', () => {
    it('is a non-empty array with unique IDs', () => {
      expect(DEFAULT_SELECTED_MODELS.length).toBeGreaterThan(0)
      const ids = DEFAULT_SELECTED_MODELS.map((m) => m.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('ensures gemini-3.8-flash is present as flagship with >= 1M context', () => {
      const m38 = DEFAULT_SELECTED_MODELS.find((m) => m.id === 'gemini-3.8-flash')
      expect(m38).toBeDefined()
      expect(m38?.provider).toBe('google')
      expect(m38?.contextLength).toBe(1048576)
      expect(m38?.hasThinking).toBe(true)
      expect(m38?.hasVision).toBe(true)
      expect(m38?.capabilities).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
    })

    it('validates all items have positive contextLength and valid capabilities', () => {
      for (const model of DEFAULT_SELECTED_MODELS) {
        expect(model.id).toBeTruthy()
        expect(model.name).toBeTruthy()
        expect(['google', 'openrouter']).toContain(model.provider)
        expect(typeof model.contextLength).toBe('number')
        expect(model.contextLength!).toBeGreaterThanOrEqual(100000)
        expect(Array.isArray(model.capabilities)).toBe(true)
        expect(model.capabilities).toContain('text')

        // Thinking capability invariant
        if (model.hasThinking) {
          expect(model.capabilities).toContain('thinking')
        }

        // Vision capability invariant
        if (model.hasVision) {
          expect(model.capabilities).toContain('vision')
        }
      }
    })
  })

  describe('7. normalizeGoogleModel Combined Stress Scenarios', () => {
    it('normalizes target Gemini model IDs requested in dispatch', () => {
      expect(normalizeGoogleModel('gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('gemini-3-flash')).toBe('gemini-3-flash')
      expect(normalizeGoogleModel('google/gemini-2.5-pro:free')).toBe('gemini-2.5-pro')
      expect(normalizeGoogleModel('gemini-1.5-flash')).toBe('gemini-1.5-flash')
    })

    it('strips combinations of prefixes and tags cleanly', () => {
      expect(normalizeGoogleModel('google/models/gemini-3.8-flash:online')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('/gemini-3.8-flash/')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('models/google/models/gemini-3-flash:nitro')).toBe('gemini-3-flash')
      expect(normalizeGoogleModel('GOOGLE/GEMINI-3.8-FLASH:FREE')).toBe('GEMINI-3.8-FLASH')
    })

    it('strips prefixes cleanly even when leading slashes precede provider or namespace', () => {
      expect(normalizeGoogleModel('//google/models/gemini-3.8-flash:online//')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('/google/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('/models/gemini-3.8-flash')).toBe('gemini-3.8-flash')
    })

    it('safely falls back to gemini-2.5-flash on completely empty/stripped inputs', () => {
      expect(normalizeGoogleModel('google/')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('models/')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('google/models/')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('///')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('')).toBe('gemini-2.5-flash')
    })
  })

  describe('8. Adversarial Stress & Performance Under Extreme Inputs', () => {
    it('handles extreme length strings without ReDoS or timeout', () => {
      const start = performance.now()
      const hugeInput = 'google/models/' + 'a'.repeat(50000) + ':free'
      const normResult = normalizeGoogleModel(hugeInput)
      expect(normResult).toBe('a'.repeat(50000))

      const capsResult = detectModelCapabilities(hugeInput)
      expect(capsResult).toContain('text')
      const duration = performance.now() - start
      expect(duration).toBeLessThan(50) // Fast execution under 50ms
    })

    it('handles unicode emojis and special characters cleanly', () => {
      expect(detectModelCapabilities('gemini-3.8-flash-🚀')).toEqual(
        expect.arrayContaining(['text', 'vision', 'thinking'])
      )
      expect(normalizeGoogleModel('google/gemini-3.8-flash-🚀:free')).toBe('gemini-3.8-flash-🚀')
    })

    it('handles newline and tab characters in model strings', () => {
      expect(normalizeGoogleModel('\n\tgoogle/gemini-3.8-flash\n\t')).toBe('gemini-3.8-flash')
      expect(detectModelCapabilities('\tgemini-3.8-flash\n')).toEqual(
        expect.arrayContaining(['text', 'vision', 'thinking'])
      )
    })
  })
})

