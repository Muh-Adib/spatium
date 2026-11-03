import { describe, it, expect } from 'vitest'
import { checkPublicationGate } from '../src/lib/seo/validation'

describe('Layer 3: Publication Gate & Business Rules Verification', () => {
  it('allows publication when all SEO and accessibility gates are satisfied', () => {
    const result = checkPublicationGate({
      locale: 'id',
      title: 'Panduan Lengkap Animasi 3D Studio',
      slug: 'panduan-lengkap-animasi-3d-studio',
      metaDescription: 'Pelajari alur produksi animasi 3D profesional untuk industri dan brand modern.',
      seoTitle: 'Panduan Lengkap Animasi 3D Studio — UNIMASI',
      existingSlugs: [],
      images: [
        { url: '/images/showcase/3d-render.webp', altText: 'Render wireframe 3D industri', decorative: false },
      ],
      heroVisual: {
        url: '/images/showcase/cover.webp',
        altText: 'Cover panduan animasi 3D',
        decorative: false,
      },
    })

    expect(result.canPublish).toBe(true)
    expect(result.violations.length).toBe(0)
  })

  it('rejects publication when metaDescription is empty or missing', () => {
    const result = checkPublicationGate({
      locale: 'id',
      title: 'Panduan Animasi 3D',
      slug: 'panduan-animasi-3d',
      metaDescription: '', // VIOLATION
      seoTitle: 'Panduan Animasi 3D — UNIMASI',
      existingSlugs: [],
      images: [],
      heroVisual: null,
    })

    expect(result.canPublish).toBe(false)
    expect(result.violations.some((v) => v.message.toLowerCase().includes('meta description'))).toBe(true)
  })

  it('rejects publication when images are missing alt text (Accessibility Gate)', () => {
    const result = checkPublicationGate({
      locale: 'id',
      title: 'Panduan Animasi 3D',
      slug: 'panduan-animasi-3d',
      metaDescription: 'Deskripsi meta yang valid dan memenuhi standar SEO.',
      seoTitle: 'Panduan Animasi 3D — UNIMASI',
      existingSlugs: [],
      images: [
        { url: '/images/showcase/missing-alt.png', altText: '', decorative: false }, // VIOLATION
      ],
      heroVisual: null,
    })

    expect(result.canPublish).toBe(false)
    expect(result.violations.some((v) => v.message.toLowerCase().includes('alt'))).toBe(true)
  })

  it('rejects publication when slug already exists (Duplicate Slug Gate)', () => {
    const result = checkPublicationGate({
      locale: 'id',
      title: 'Panduan Animasi 3D',
      slug: 'existing-slug',
      metaDescription: 'Deskripsi meta yang valid dan memenuhi standar SEO.',
      seoTitle: 'Panduan Animasi 3D — UNIMASI',
      existingSlugs: ['existing-slug'], // VIOLATION
      images: [],
      heroVisual: null,
    })

    expect(result.canPublish).toBe(false)
    expect(result.violations.some((v) => v.message.toLowerCase().includes('slug'))).toBe(true)
  })
})
