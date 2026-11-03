import { describe, it, expect } from 'vitest'
import { parseBlocks } from '../src/lib/blocks/schema'

describe('Layer 5: Server-Driven UI (SDUI) Blocks Adversarial & Schema Stress', () => {
  it('gracefully handles empty, null, or undefined block payloads without crashing', () => {
    expect(parseBlocks(null).ok).toBe(true)
    expect(parseBlocks(undefined).ok).toBe(true)
    expect(parseBlocks('').ok).toBe(true)
    expect(parseBlocks([]).ok).toBe(true)
  })

  it('rejects malformed non-JSON strings or non-array JSON objects', () => {
    const invalidJson = parseBlocks('{ not valid json }')
    expect(invalidJson.ok).toBe(false)

    const nonArray = parseBlocks('{"type": "hero-cinema"}')
    expect(nonArray.ok).toBe(false)
  })

  it('validates authentic dedicated cinema blocks array against Zod schemas', () => {
    const validBlocks = [
      {
        type: 'hero-cinema',
        badge: 'Cinema 4K',
        headline: 'We Make Ideas Move',
        subheadline: 'Studio animasi spesialis senior',
        primaryCta: { label: 'Lihat Showreel', href: '/portfolio' },
      },
      {
        type: 'process-timeline',
        title: 'Alur Produksi Transparan',
        steps: [
          { phase: '01', title: 'Creative Brief', description: 'Bedah konsep visual' },
          { phase: '02', title: 'Storyboard', description: 'Frame-by-frame visualisasi' },
        ],
      },
      {
        type: 'stats-ticker',
        metrics: [
          { value: '100%', label: 'In-House Production' },
          { value: '4K', label: 'Ultra High Definition' },
        ],
      },
      {
        type: 'interactive-cta',
        title: 'Mulai Proyek Animasi Anda',
        ctaText: 'Hubungi Studio',
        ctaLink: '/contact',
      },
    ]

    const result = parseBlocks(validBlocks)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.blocks.length).toBe(4)
      expect(result.blocks[0].type).toBe('hero-cinema')
    }
  })

  it('rejects unrecognized block types with strict discriminator error', () => {
    const rogueBlock = [{ type: 'unknown-rogue-block-type-xyz', data: {} }]
    const result = parseBlocks(rogueBlock)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0)
    }
  })
})
