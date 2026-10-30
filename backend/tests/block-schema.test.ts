/**
 * Block Schema Unit Tests (L2-T1)
 *
 * Verifies validation rules, discriminated union parsing,
 * boundary constraints (max blocks <= 60), and safe URL enforcement.
 */
import { describe, it, expect } from 'vitest'
import { parseBlocks, MAX_BLOCKS_PER_PAGE, Block } from '../src/lib/blocks/schema'

describe('K-2 Block Schema Contract', () => {
  it('parses valid hero-department block', () => {
    const input = [
      {
        type: 'hero-department',
        title: 'Software & Product Engineering',
        description: 'Rekayasa perangkat lunak modern.',
        keyOutcomes: [{ label: 'Performance', value: '100' }],
      },
    ]

    const result = parseBlocks(input)
    expect(result.ok).toBe(true)
    expect(result.blocks.length).toBe(1)
    expect(result.blocks[0].type).toBe('hero-department')
  })

  it('parses valid hero-service block with either title or name', () => {
    const withName = [
      {
        type: 'hero-service',
        name: 'Website Development',
        description: 'Pembangunan website Next.js.',
      },
    ]
    expect(parseBlocks(withName).ok).toBe(true)

    const withTitle = [
      {
        type: 'hero-service',
        title: 'Custom Web Application',
        description: 'Aplikasi web enterprise.',
      },
    ]
    expect(parseBlocks(withTitle).ok).toBe(true)

    const withoutBoth = [
      {
        type: 'hero-service',
        description: 'Tanpa nama atau judul.',
      },
    ]
    expect(parseBlocks(withoutBoth).ok).toBe(false)
  })

  it('rejects unknown block types', () => {
    const input = [
      {
        type: 'malicious-injected-block',
        payload: '<script>alert(1)</script>',
      },
    ]

    const result = parseBlocks(input)
    expect(result.ok).toBe(false)
    expect(result.issues).toBeDefined()
    expect(result.issues![0]).toContain('Invalid discriminator value')
  })

  it('enforces maximum 60 blocks per page limit', () => {
    const sixtyBlocks = Array.from({ length: 60 }, (_, i) => ({
      type: 'paragraph',
      content: `Paragraf ${i + 1}`,
    }))
    expect(parseBlocks(sixtyBlocks).ok).toBe(true)

    const sixtyOneBlocks = Array.from({ length: 61 }, (_, i) => ({
      type: 'paragraph',
      content: `Paragraf ${i + 1}`,
    }))
    const result = parseBlocks(sixtyOneBlocks)
    expect(result.ok).toBe(false)
    expect(result.issues![0]).toContain(`melebihi ${MAX_BLOCKS_PER_PAGE}`)
  })

  it('enforces safe URL schemes', () => {
    const safeCta = [
      {
        type: 'studio-cta',
        title: 'Hubungi Kami',
        buttonText: 'Konsultasi',
        buttonUrl: '/kontak',
      },
    ]
    expect(parseBlocks(safeCta).ok).toBe(true)

    const unsafeCta = [
      {
        type: 'studio-cta',
        title: 'Hubungi Kami',
        buttonText: 'Konsultasi',
        buttonUrl: 'javascript:alert(document.cookie)',
      },
    ]
    const result = parseBlocks(unsafeCta)
    expect(result.ok).toBe(false)
  })

  it('handles JSON string inputs safely', () => {
    const jsonString = JSON.stringify([
      {
        type: 'faq-accordion',
        title: 'Pertanyaan Umum',
        items: [{ question: 'Berapa lama pengerjaan?', answer: '2-4 minggu.' }],
      },
    ])

    const result = parseBlocks(jsonString)
    expect(result.ok).toBe(true)
    expect(result.blocks.length).toBe(1)
  })
})
