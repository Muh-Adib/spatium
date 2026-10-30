import { describe, it, expect } from 'vitest'
import {
  normalizeGoogleModel,
  detectModelCapabilities,
  DEFAULT_SELECTED_MODELS,
} from '@/lib/ai/model-capabilities'

describe('Requirement R1: Modern Gemini Model Normalization & Capability Detection', () => {
  describe('normalizeGoogleModel Invariants', () => {
    it('preserves gemini-3.8-flash cleanly without downgrading to gemini-2.5-flash', () => {
      expect(normalizeGoogleModel('gemini-3.8-flash')).toBe('gemini-3.8-flash')
    })

    it('preserves official modern gemini-3.x models', () => {
      expect(normalizeGoogleModel('gemini-3-flash')).toBe('gemini-3-flash')
      expect(normalizeGoogleModel('gemini-3.0-pro')).toBe('gemini-3.0-pro')
      expect(normalizeGoogleModel('gemini-3.0-flash')).toBe('gemini-3.0-flash')
    })

    it('strips "google/" prefix while preserving modern model names', () => {
      expect(normalizeGoogleModel('google/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('google/gemini-2.5-flash')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('google/gemini-2.0-flash')).toBe('gemini-2.0-flash')
    })

    it('strips "models/" prefix while preserving modern model names', () => {
      expect(normalizeGoogleModel('models/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('models/gemini-2.5-flash')).toBe('gemini-2.5-flash')
    })

    it('strips combined "google/models/" and "models/google/" prefixes', () => {
      expect(normalizeGoogleModel('google/models/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('models/google/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('google/models/models/gemini-3.8-flash')).toBe('gemini-3.8-flash')
    })

    it('handles case-insensitive prefixes cleanly', () => {
      expect(normalizeGoogleModel('GOOGLE/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('MODELS/gemini-3.8-flash')).toBe('gemini-3.8-flash')
    })

    it('strips OpenRouter tags like :free, :online, :nitro', () => {
      expect(normalizeGoogleModel('google/gemini-2.0-flash-exp:free')).toBe('gemini-2.0-flash-exp')
      expect(normalizeGoogleModel('gemini-3.8-flash:free')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('gemini-2.5-flash:free')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('google/gemini-2.5-flash:online')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('gemini-3.8-flash:nitro')).toBe('gemini-3.8-flash')
    })

    it('preserves official Google Gemini flagship models', () => {
      expect(normalizeGoogleModel('gemini-2.5-flash')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('gemini-2.5-pro')).toBe('gemini-2.5-pro')
      expect(normalizeGoogleModel('gemini-2.0-flash')).toBe('gemini-2.0-flash')
      expect(normalizeGoogleModel('gemini-1.5-flash')).toBe('gemini-1.5-flash')
      expect(normalizeGoogleModel('gemini-1.5-pro')).toBe('gemini-1.5-pro')
      expect(normalizeGoogleModel('gemini-exp-1206')).toBe('gemini-exp-1206')
      expect(normalizeGoogleModel('learnlm-1.5-pro-experimental')).toBe('learnlm-1.5-pro-experimental')
    })

    it('trims whitespace and strips leading/trailing slashes', () => {
      expect(normalizeGoogleModel('   gemini-3.8-flash   ')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('/gemini-3.8-flash/')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('  google/gemini-3.8-flash/  ')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('//google/models/gemini-3.8-flash:online//')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('/models/gemini-3.8-flash')).toBe('gemini-3.8-flash')
      expect(normalizeGoogleModel('/google/gemini-3.8-flash')).toBe('gemini-3.8-flash')
    })

    it('falls back safely to default model for empty or invalid input', () => {
      expect(normalizeGoogleModel('')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel('   ')).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(undefined)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(null as any)).toBe('gemini-2.5-flash')
      expect(normalizeGoogleModel(123 as any)).toBe('gemini-2.5-flash')
    })
  })

  describe('detectModelCapabilities Invariants', () => {
    it('detects text, vision, and thinking capabilities for gemini-3.8-flash', () => {
      const caps = detectModelCapabilities('gemini-3.8-flash')
      expect(caps).toContain('text')
      expect(caps).toContain('vision')
      expect(caps).toContain('thinking')
    })

    it('detects text, vision, and thinking capabilities for gemini-2.5-flash and gemini-2.5-pro', () => {
      const capsFlash = detectModelCapabilities('gemini-2.5-flash')
      expect(capsFlash).toContain('text')
      expect(capsFlash).toContain('vision')
      expect(capsFlash).toContain('thinking')

      const capsPro = detectModelCapabilities('gemini-2.5-pro')
      expect(capsPro).toContain('text')
      expect(capsPro).toContain('vision')
      expect(capsPro).toContain('thinking')
    })
  })

  describe('DEFAULT_SELECTED_MODELS Invariants', () => {
    it('includes gemini-3.8-flash with high context, thinking, and vision', () => {
      const item = DEFAULT_SELECTED_MODELS.find((m) => m.id === 'gemini-3.8-flash')
      expect(item).toBeDefined()
      expect(item?.provider).toBe('google')
      expect(item?.hasThinking).toBe(true)
      expect(item?.hasVision).toBe(true)
      expect(item?.contextLength).toBe(1048576)
      expect(item?.capabilities).toEqual(expect.arrayContaining(['text', 'vision', 'thinking']))
      expect(item?.description).toBeTruthy()
    })
  })
})
