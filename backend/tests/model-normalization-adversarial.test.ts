import { describe, it, expect } from 'vitest'
import {
  normalizeGoogleModel,
  detectModelCapabilities,
  DEFAULT_SELECTED_MODELS,
} from '@/lib/ai/model-capabilities'

describe('Challenger M1-1: Adversarial Stress Suite for normalizeGoogleModel & Capabilities', () => {
  describe('1. Nested Prefix Stress-Testing', () => {
    it('normalizes deeply nested alternating provider and path prefixes', () => {
      expect(
        normalizeGoogleModel('google/google/models/models/gemini-3.8-flash')
      ).toBe('gemini-3.8-flash')
      expect(
        normalizeGoogleModel('models/models/google/google/gemini-3.8-flash')
      ).toBe('gemini-3.8-flash')
      expect(
        normalizeGoogleModel('google/models/google/models/gemini-3.8-flash')
      ).toBe('gemini-3.8-flash')
      expect(
        normalizeGoogleModel('google/google/google/gemini-3.8-flash')
      ).toBe('gemini-3.8-flash')
      expect(
        normalizeGoogleModel('models/models/models/gemini-3.8-flash')
      ).toBe('gemini-3.8-flash')
    })

    it('strips combinations with OpenRouter tags', () => {
      expect(
        normalizeGoogleModel('google/models/models/gemini-2.0-flash-exp:free')
      ).toBe('gemini-2.0-flash-exp')
      expect(
        normalizeGoogleModel('models/google/gemini-3.8-flash:online')
      ).toBe('gemini-3.8-flash')
      expect(
        normalizeGoogleModel('google/models/gemini-2.5-pro:nitro')
      ).toBe('gemini-2.5-pro')
    })
  })

  describe('2. Case Variation Stress-Testing', () => {
    it('handles mixed-case prefixes and tags cleanly', () => {
      expect(
        normalizeGoogleModel('GoOgLe/MoDeLs/GeMiNi-3.8-FlAsH:FrEe')
      ).toBe('GeMiNi-3.8-FlAsH')
      expect(
        normalizeGoogleModel('GOOGLE/MODELS/gemini-3.8-flash:ONLINE')
      ).toBe('gemini-3.8-flash')
      expect(
        normalizeGoogleModel('mOdElS/gOoGlE/gemini-2.5-flash:NiTrO')
      ).toBe('gemini-2.5-flash')
      expect(
        normalizeGoogleModel('Google/gemini-3.8-flash:Free')
      ).toBe('gemini-3.8-flash')
    })

    it('handles uppercase provider and path with lowercase model', () => {
      expect(normalizeGoogleModel('GOOGLE/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('MODELS/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('GOOGLE/MODELS/gemini-2.5-pro')).toBe('gemini-2.5-pro')
    })
  })

  describe('3. Empty, Whitespace, Symbol, and Degenerate Inputs', () => {
    it('returns default fallback for empty strings and whitespace', () => {
      expect(normalizeGoogleModel('')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('   ')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('\t\n\r  ')).toBe('gemini-2.5-flash')
    })

    it('returns default fallback for isolated symbols and tag-only strings', () => {
      expect(normalizeGoogleModel('///')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(':free')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(':online')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(':nitro')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('models/')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('google/')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('google/models/')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('models/google/')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('google/models/:free')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('models/:online')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('google/:nitro')).toBe('gemini-2.5-flash')
    })

    it('returns default fallback for non-string / malformed types', () => {
      expect(normalizeGoogleModel(undefined)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(null as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(0 as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(12345 as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel({} as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel([] as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(true as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(false as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(NaN as any)).toBe('gemini-2.5-flash')
    })
  })

  describe('4. Real-World Model Identifiers Preservation', () => {
    it('preserves modern gemini-3.x models without down-mapping', () => {
      expect(normalizeGoogleModel('gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('gemini-3.0-pro')).toBe('gemini-3.0-pro')
      expect(normalizeGoogleModel('gemini-3.0-flash')).toBe('gemini-3.0-flash')
      expect(normalizeGoogleModel('gemini-3-flash')).toBe('gemini-3-flash')
    })

    it('preserves official gemini-2.x and 1.x models', () => {
      expect(normalizeGoogleModel('gemini-2.5-pro')).toBe('gemini-2.5-pro')
      expect(normalizeGoogleModel('gemini-2.5-flash')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('gemini-2.0-flash')).toBe('gemini-2.0-flash')
      expect(normalizeGoogleModel('gemini-2.0-flash-exp:free')).toBe('gemini-2.0-flash-exp')
      expect(normalizeGoogleModel('gemini-1.5-pro')).toBe('gemini-1.5-pro')
      expect(normalizeGoogleModel('gemini-1.5-flash')).toBe('gemini-1.5-flash')
      expect(normalizeGoogleModel('gemini-exp-1206')).toBe('gemini-exp-1206')
      expect(normalizeGoogleModel('learnlm-1.5-pro-experimental')).toBe('learnlm-1.5-pro-experimental')
    })
  })

  describe('5. Trailing Slashes and Whitespace Formatting', () => {
    it('strips leading and trailing slashes around clean model name', () => {
      expect(normalizeGoogleModel('/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('gemini-3.8-flash/')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('/gemini-3.8-flash/')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('///gemini-3.8-flash///')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('  google/gemini-3.8-flash/  ')).toBe('gemini-3.8-flash')
    })
  })

  describe('6. Capability Detection Regression & Expansion', () => {
    it('verifies thinking, text, and vision for gemini-3 and gemini-2.5 families', () => {
      const models = [
        'gemini-3.8-flash',
        'gemini-3.0-pro',
        'gemini-3.0-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
      ]
      for (const m of models) {
        const caps = detectModelCapabilities(m)
        expect(caps).toContain('text')
        expect(caps).toContain('vision')
        expect(caps).toContain('thinking')
      }
    })

    it('verifies non-gemini thinking models retain thinking', () => {
      expect(detectModelCapabilities('deepseek-r1')).toContain('thinking')
      expect(detectModelCapabilities('openai/o1-preview')).toContain('thinking')
      expect(detectModelCapabilities('openai/o3-mini')).toContain('thinking')
      expect(detectModelCapabilities('nvidia/llama-3.1-nemotron-70b-instruct')).toContain('thinking')
    })

    it('verifies coding capability for coder models', () => {
      expect(detectModelCapabilities('deepseek-coder-v2')).toContain('code')
      expect(detectModelCapabilities('qwen-2.5-coder-32b')).toContain('code')
    })
  })

  describe('7. Default Models Registry Verification', () => {
    it('contains gemini-3.8-flash with all required flags', () => {
      const g38 = DEFAULT_SELECTED_MODELS.find((m) => m.id === 'gemini-3.8-flash')
      expect(g38).toBeDefined()
      expect(g38?.name).toBe('Gemini 3.8 Flash')
      expect(g38?.provider).toBe('google')
      expect(g38?.contextLength).toBe(1048576)
      expect(g38?.hasThinking).toBe(true)
      expect(g38?.hasVision).toBe(true)
      expect(g38?.capabilities).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
    })
  })

  describe('8. Adversarial Edge Case Documentation', () => {
    it('strips provider and namespace prefixes cleanly even when leading slashes are present', () => {
      const resultWithLeadingSlash = normalizeGoogleModel('/google/gemini-3.8-flash')
      expect(resultWithLeadingSlash).toBe('gemini-3.8-flash')

      const resultWithDoubleSlash = normalizeGoogleModel('//google/models/gemini-3.8-flash:online//')
      expect(resultWithDoubleSlash).toBe('gemini-3.8-flash')

      // Contrast with standard provider prefix without leading slash:
      const resultStandard = normalizeGoogleModel('google/gemini-3.8-flash')
      expect(resultStandard).toBe('gemini-3.8-flash')
    })
  })
})
