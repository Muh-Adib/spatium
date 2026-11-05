/**
 * UNIMASI Block Performance Budget Auditor (L3-T8)
 * Evaluates visual blocks against Core Web Vitals (CWV), DOM complexity,
 * LCP candidate assignment, and heavy asset thresholds.
 */

export interface BlockPerfAuditResult {
  blockCount: number
  estimatedDomNodes: number
  imageCount: number
  videoCount: number
  hasLcpCandidate: boolean
  lcpCandidateBlockIndex: number | null
  interactiveAboveFold: boolean
  warnings: string[]
  recommendations: string[]
  status: 'optimal' | 'moderate' | 'needs-optimization'
}

export function auditBlocksPerformance(blocks: any[]): BlockPerfAuditResult {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return {
      blockCount: 0,
      estimatedDomNodes: 0,
      imageCount: 0,
      videoCount: 0,
      hasLcpCandidate: false,
      lcpCandidateBlockIndex: null,
      interactiveAboveFold: false,
      warnings: [],
      recommendations: ['Tambahkan blok hero untuk mendefinisikan kandidat LCP halaman.'],
      status: 'optimal',
    }
  }

  const warnings: string[] = []
  const recommendations: string[] = []
  let estimatedDomNodes = 0
  let imageCount = 0
  let videoCount = 0
  let lcpCandidateBlockIndex: number | null = null
  let interactiveAboveFold = false

  blocks.forEach((block, index) => {
    if (!block || typeof block !== 'object') return

    const type = block.type || ''

    // 1. Estimated DOM nodes per block type
    let nodeWeight = 15
    if (type.includes('bento') || type.includes('matrix') || type.includes('blueprint')) {
      nodeWeight = 45
    } else if (type.includes('accordion') || type.includes('gallery') || type.includes('list')) {
      nodeWeight = 30
    } else if (type === 'paragraph' || type === 'heading2' || type === 'heading3') {
      nodeWeight = 4
    }

    if (Array.isArray(block.items)) nodeWeight += block.items.length * 6
    if (Array.isArray(block.features)) nodeWeight += block.features.length * 6
    if (Array.isArray(block.rows)) nodeWeight += block.rows.length * 5
    if (Array.isArray(block.layers)) nodeWeight += block.layers.length * 8

    estimatedDomNodes += nodeWeight

    // 2. LCP Candidate Assignment (Hero image in first 2 blocks)
    const hasHeroImage = Boolean(
      (block.heroImage && typeof block.heroImage === 'string' && block.heroImage.trim()) ||
      (block.image && typeof block.image === 'string' && block.image.trim())
    )

    if (hasHeroImage && lcpCandidateBlockIndex === null && index <= 1) {
      lcpCandidateBlockIndex = index
    }

    // 3. Image count
    if (hasHeroImage) imageCount++
    if (Array.isArray(block.items)) {
      imageCount += block.items.filter((it: any) => it?.image).length
    }
    if (Array.isArray(block.features)) {
      imageCount += block.features.filter((f: any) => f?.image).length
    }

    // 4. Video Detection
    if (block.video || block.videoUrl) {
      videoCount++
      if (index === 0) {
        warnings.push('Blok pertama menggunakan video: hindari video autoplay di atas lipatan karena memperlambat LCP.')
      }
    }

    // 5. Interactive above-the-fold check (first block)
    if (index === 0) {
      if (
        type.includes('3d') ||
        type.includes('aquarium') ||
        type.includes('simulator') ||
        type.includes('interactive-wall')
      ) {
        interactiveAboveFold = true
        warnings.push('Komponen interaktif/WebGL berat terdeteksi di atas lipatan. Gunakan poster fallback statis.')
      }
    }
  })

  // Global Budget Checks
  if (blocks.length > 25) {
    warnings.push(`Jumlah blok (${blocks.length}) melebihi batas rekomendasi 25 blok per halaman.`)
  }

  if (estimatedDomNodes > 800) {
    warnings.push(`Perkiraan elemen DOM (${estimatedDomNodes}) melebihi batas performa 800 elemen.`)
  }

  if (videoCount > 1) {
    warnings.push(`Terdeteksi ${videoCount} video di halaman. Batasi maksimal 1 video untuk menjaga kuota bandwidth mobile.`)
  }

  if (lcpCandidateBlockIndex === null) {
    recommendations.push('Tidak ditemukan gambar utama di blok atas. Pertimbangkan menambahkan gambar hero dengan prioritas pemuatan untuk LCP.')
  }

  const hasLcpCandidate = lcpCandidateBlockIndex !== null

  let status: 'optimal' | 'moderate' | 'needs-optimization' = 'optimal'
  if (warnings.length >= 2 || estimatedDomNodes > 1000) {
    status = 'needs-optimization'
  } else if (warnings.length === 1 || estimatedDomNodes > 600) {
    status = 'moderate'
  }

  return {
    blockCount: blocks.length,
    estimatedDomNodes,
    imageCount,
    videoCount,
    hasLcpCandidate,
    lcpCandidateBlockIndex,
    interactiveAboveFold,
    warnings,
    recommendations,
    status,
  }
}
