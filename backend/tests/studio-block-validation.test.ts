import { describe, it, expect } from 'vitest'
import { parseBlocks } from '@/lib/blocks/schema'
import { blocksToSeoText } from '@/lib/blocks/seo-text'
import { validateCatalogPublication } from '@/lib/blocks/publication-gate'
import { auditBlocksPerformance } from '@/lib/blocks/perf-budget'

describe('Studio Block Validation & Publication Gate (Lane 3)', () => {
  const validSampleBlocks = [
    {
      id: 'blk-1',
      type: 'hero-department',
      title: 'Solusi Rekayasa Perangkat Lunak',
      badge: 'Solusi Digital',
      description: 'Membangun aplikasi web dan portal handal berskala enterprise.',
      heroImage: '/images/portfolio/website-pmb-umby.png',
      heroImageAlt: 'Tampilan antarmuka sistem pendaftaran PMB UMBY',
      keyOutcomes: [
        { label: 'Waktu Muat', value: '< 1 Detik' },
        { label: 'Konversi', value: '+40%' },
        { label: 'Hak Milik', value: '100%' },
      ],
    },
    {
      id: 'blk-2',
      type: 'feature-bento-grid',
      title: 'Fitur Utama Sistem',
      features: [
        {
          title: 'Performa Tinggi',
          description: 'Membuka cepat dalam hitungan milidetik.',
          image: '/images/portfolio/website-smk-pb-soedirman-2.png',
          alt: 'Dashboard performa tinggi sekolah SMK PB Soedirman 2',
        },
      ],
    },
  ]

  it('validates authentic blocks against Zod discriminated union schema', () => {
    const result = parseBlocks(validSampleBlocks)
    expect(result.ok).toBe(true)
    expect(result.blocks).toBeDefined()
    expect(result.blocks.length).toBe(2)
    expect(result.issues).toBeUndefined()
  })

  it('detects invalid block structure or unknown type', () => {
    const invalidBlocks = [
      {
        id: 'bad-1',
        type: 'non-existent-block-type',
        someArbitraryKey: 123,
      },
    ]
    const result = parseBlocks(invalidBlocks)
    expect(result.ok).toBe(false)
    expect(result.issues).toBeDefined()
    expect(result.issues!.length).toBeGreaterThan(0)
  })

  it('extracts SEO text and audits image alt attributes via blocksToSeoText', () => {
    const extracted = blocksToSeoText(validSampleBlocks)
    expect(extracted.wordCount).toBeGreaterThan(10)
    expect(extracted.headings.length).toBeGreaterThan(0)
    expect(extracted.imageCount).toBe(2)
    expect(extracted.imagesWithoutAlt).toEqual([])
  })

  it('flags images missing alt text in blocksToSeoText', () => {
    const blocksWithMissingAlt = [
      {
        id: 'blk-no-alt',
        type: 'feature-bento-grid',
        title: 'Fitur Tanpa Alt',
        features: [
          {
            title: 'Gambar Rusak Alt',
            description: 'Deskripsi gambar',
            image: '/images/test-missing-alt.png',
            alt: '', // Empty alt!
          },
        ],
      },
    ]
    const extracted = blocksToSeoText(blocksWithMissingAlt)
    expect(extracted.imageCount).toBe(1)
    expect(extracted.imagesWithoutAlt.length).toBe(1)
  })

  it('rejects publication when critical fields or alt texts are missing', () => {
    const invalidPublication = validateCatalogPublication({
      title: '', // Empty!
      slug: 'invalid_slug_with_underscores',
      metaTitle: 'Short', // Too short (< 10 chars)
      metaDescription: 'Too short', // Too short (< 20 chars)
      heroImage: '/images/hero.png',
      heroImageAlt: '', // Missing hero alt!
      blocks: [
        {
          id: 'b1',
          type: 'feature-bento-grid',
          title: 'Fitur',
          features: [
            {
              title: 'Item 1',
              image: '/images/photo.png',
              alt: '', // Missing alt in block!
            },
          ],
        },
      ],
    })

    expect(invalidPublication.canPublish).toBe(false)
    expect(invalidPublication.issues.length).toBeGreaterThanOrEqual(4)
    expect(invalidPublication.issues.some((i) => i.includes('Judul'))).toBe(true)
    expect(invalidPublication.issues.some((i) => i.includes('Slug'))).toBe(true)
    expect(invalidPublication.issues.some((i) => i.includes('Meta Title'))).toBe(true)
    expect(invalidPublication.issues.some((i) => i.includes('Alt Text'))).toBe(true)
  })

  it('approves publication when all SEO and accessibility gates are satisfied', () => {
    const validPublication = validateCatalogPublication({
      title: 'Jasa Pembuatan Website Perusahaan Profesional',
      slug: 'jasa-pembuatan-website-perusahaan-profesional',
      metaTitle: 'Jasa Pembuatan Website Perusahaan Profesional - SegiaTech',
      metaDescription: 'Layanan pengembangan website profil perusahaan modern, cepat dibuka sub-detik, dan ramah SEO Google.',
      heroImage: '/images/portfolio/website-pmb-umby.png',
      heroImageAlt: 'Tampilan antarmuka sistem pendaftaran PMB UMBY',
      blocks: validSampleBlocks,
    })

    expect(validPublication.canPublish).toBe(true)
    expect(validPublication.issues).toEqual([])
  })

  it('audits blocks performance budget, detects LCP candidate, and calculates DOM estimate', () => {
    const audit = auditBlocksPerformance(validSampleBlocks)
    expect(audit.blockCount).toBe(2)
    expect(audit.estimatedDomNodes).toBeGreaterThan(30)
    expect(audit.hasLcpCandidate).toBe(true)
    expect(audit.lcpCandidateBlockIndex).toBe(0) // First block with heroImage
    expect(audit.status).toBe('optimal')
  })

  it('warns when heavy video or excessive DOM nodes exceed budget thresholds', () => {
    const heavyBlocks = [
      {
        id: 'heavy-video-1',
        type: 'hero-department',
        title: 'Video Header',
        video: '/videos/sample.mp4',
        videoUrl: '/videos/sample.mp4',
      },
      {
        id: 'heavy-video-2',
        type: 'media-showcase',
        title: 'Video Showcase',
        video: '/videos/sample2.mp4',
      },
    ]

    const audit = auditBlocksPerformance(heavyBlocks)
    expect(audit.videoCount).toBe(2)
    expect(audit.warnings.length).toBeGreaterThanOrEqual(1)
    expect(audit.warnings.some((w) => w.includes('video'))).toBe(true)
  })
})
