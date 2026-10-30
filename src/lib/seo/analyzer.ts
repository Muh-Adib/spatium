import { AnalysisIndicator, AnalysisReport, Locale } from './schema'
import { analyzeReadability } from './readability'

export interface SeoAnalysisInput {
  title: string
  seoTitle?: string
  metaDescription?: string
  slug?: string
  content: string
  focusKeyphrase: string
  relatedKeyphrases?: string[]
  locale?: Locale
  isCornerstone?: boolean
  images?: Array<{ url: string; alt?: string; decorative?: boolean }>
  otherContentKeyphrases?: Array<{ slug: string; title: string; keyphrase: string }>
}

export interface DetailedSeoAnalysisResult {
  seoScore: number
  readabilityScore: number
  overallStatus: 'good' | 'ok' | 'problem'
  indicators: AnalysisIndicator[]
  readabilityIndicators: AnalysisIndicator[]
  relatedKeyphraseResults: Array<{
    keyphrase: string
    score: number
    indicators: AnalysisIndicator[]
  }>
  internalLinkSuggestions: Array<{
    title: string
    slug: string
    reason: string
  }>
  metrics: {
    wordCount: number
    headingCount: number
    imageCount: number
    missingAltCount: number
    internalLinkCount: number
    externalLinkCount: number
    keyphraseDensity: number
  }
}

/**
 * Calculates estimated pixel width of a title string in standard Google SERP font (Arial 20px)
 */
export function calculateTitlePixelWidth(title: string): number {
  // Approximate average widths for Arial 20px
  let width = 0
  for (const char of title) {
    if (/[ijlI1.,'!]/.test(char)) width += 4
    else if (/[mwMW]/.test(char)) width += 14
    else if (/[A-Z]/.test(char)) width += 11
    else if (/[a-z0-9]/.test(char)) width += 8.5
    else width += 6
  }
  return Math.round(width)
}

/**
 * Executes comprehensive Yoast-equivalent real-time SEO & Readability checks
 */
export function analyzeContentSeo(input: SeoAnalysisInput): DetailedSeoAnalysisResult {
  const indicators: AnalysisIndicator[] = []
  const {
    title = '',
    seoTitle = '',
    metaDescription = '',
    slug = '',
    content = '',
    focusKeyphrase = '',
    relatedKeyphrases = [],
    locale = 'id',
    isCornerstone = false,
    images = [],
    otherContentKeyphrases = [],
  } = input

  const effectiveTitle = (seoTitle || title).trim()
  const kw = focusKeyphrase.trim().toLowerCase()
  const cleanText = content
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = cleanText.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  // 1. Focus Keyphrase Presence in Title
  if (!kw) {
    indicators.push({
      id: 'kw-title',
      label: 'Focus Keyphrase di Judul',
      status: 'problem',
      message: 'Tentukan Focus Keyphrase untuk memeriksa optimasi judul artikel.',
    })
  } else if (!effectiveTitle.toLowerCase().includes(kw)) {
    indicators.push({
      id: 'kw-title',
      label: 'Focus Keyphrase di Judul',
      status: 'problem',
      message: `Focus keyphrase "${focusKeyphrase}" belum ditemukan di judul artikel.`,
    })
  } else {
    const kwPos = effectiveTitle.toLowerCase().indexOf(kw)
    if (kwPos <= 15) {
      indicators.push({
        id: 'kw-title',
        label: 'Focus Keyphrase di Judul',
        status: 'good',
        message: `Bagus! Keyphrase "${focusKeyphrase}" muncul di awal judul SEO.`,
      })
    } else {
      indicators.push({
        id: 'kw-title',
        label: 'Focus Keyphrase di Judul',
        status: 'ok',
        message: `Keyphrase muncul di judul, tetapi tidak di awal (posisi karakter ${kwPos}). Tempatkan lebih ke depan untuk CTR optimal.`,
      })
    }
  }

  // 2. Title Length & SERP Pixel Width
  const titlePixelWidth = calculateTitlePixelWidth(effectiveTitle)
  if (effectiveTitle.length === 0) {
    indicators.push({
      id: 'title-length',
      label: 'Panjang Judul SEO',
      status: 'problem',
      message: 'Judul SEO masih kosong.',
    })
  } else if (titlePixelWidth > 580 || effectiveTitle.length > 68) {
    indicators.push({
      id: 'title-length',
      label: 'Panjang Judul SEO',
      status: 'problem',
      message: `Judul terlalu panjang (${effectiveTitle.length} karakter, estimasi ~${titlePixelWidth}px). Google akan memotong judul di layar desktop/mobile. Target ideal < 60 karakter atau ~560px.`,
      value: `${effectiveTitle.length} char (~${titlePixelWidth}px)`,
    })
  } else if (effectiveTitle.length < 35) {
    indicators.push({
      id: 'title-length',
      label: 'Panjang Judul SEO',
      status: 'ok',
      message: `Judul agak pendek (${effectiveTitle.length} karakter). Manfaatkan ruang hingga 50-60 karakter untuk menambahkan value proposition.`,
      value: `${effectiveTitle.length} char`,
    })
  } else {
    indicators.push({
      id: 'title-length',
      label: 'Panjang Judul SEO',
      status: 'good',
      message: `Panjang judul SEO optimal (${effectiveTitle.length} karakter, ~${titlePixelWidth}px). Tampil penuh di SERP.`,
      value: `${effectiveTitle.length} char`,
    })
  }

  // 3. Focus Keyphrase in Meta Description
  const trimmedDesc = metaDescription.trim()
  if (!trimmedDesc) {
    indicators.push({
      id: 'kw-meta-desc',
      label: 'Meta Description',
      status: 'problem',
      message: 'Meta description belum diisi. Google akan mengambil cuplikan acak jika dikosongkan.',
    })
  } else if (trimmedDesc.length < 110) {
    indicators.push({
      id: 'kw-meta-desc',
      label: 'Meta Description',
      status: 'ok',
      message: `Meta description agak pendek (${trimmedDesc.length} karakter). Target ideal adalah 120-160 karakter.`,
      value: `${trimmedDesc.length} char`,
    })
  } else if (trimmedDesc.length > 165) {
    indicators.push({
      id: 'kw-meta-desc',
      label: 'Meta Description',
      status: 'problem',
      message: `Meta description terlalu panjang (${trimmedDesc.length} karakter). Cuplikan akan terpotong oleh tanda elipsis (...) di Google.`,
      value: `${trimmedDesc.length} char`,
    })
  } else if (kw && !trimmedDesc.toLowerCase().includes(kw)) {
    indicators.push({
      id: 'kw-meta-desc',
      label: 'Meta Description',
      status: 'ok',
      message: `Panjang deskripsi bagus (${trimmedDesc.length} karakter), namun belum memuat focus keyphrase "${focusKeyphrase}".`,
    })
  } else {
    indicators.push({
      id: 'kw-meta-desc',
      label: 'Meta Description',
      status: 'good',
      message: `Sempurna! Panjang deskripsi ideal (${trimmedDesc.length} karakter) dan memuat focus keyphrase.`,
      value: `${trimmedDesc.length} char`,
    })
  }

  // 4. Focus Keyphrase in URL Slug
  const cleanSlug = (slug || '').toLowerCase()
  const slugKw = kw.replace(/\s+/g, '-')
  if (!cleanSlug) {
    indicators.push({
      id: 'kw-slug',
      label: 'Keyphrase di URL Slug',
      status: 'problem',
      message: 'Slug URL belum dibuat.',
    })
  } else if (kw && (cleanSlug.includes(slugKw) || kw.split(' ').every((w) => cleanSlug.includes(w)))) {
    indicators.push({
      id: 'kw-slug',
      label: 'Keyphrase di URL Slug',
      status: 'good',
      message: `Slug memuat kata kunci: /${cleanSlug}`,
    })
  } else if (kw) {
    indicators.push({
      id: 'kw-slug',
      label: 'Keyphrase di URL Slug',
      status: 'ok',
      message: `Slug saat ini (/${cleanSlug}) belum memuat focus keyphrase "${focusKeyphrase}".`,
    })
  }

  // 5. Focus Keyphrase in Intro Paragraph (First 100 words)
  const introWords = words.slice(0, 100).join(' ').toLowerCase()
  if (kw && introWords.includes(kw)) {
    indicators.push({
      id: 'kw-intro',
      label: 'Keyphrase di Paragraf Pembuka',
      status: 'good',
      message: 'Focus keyphrase muncul di awal artikel (paragraf pembuka).',
    })
  } else if (kw) {
    indicators.push({
      id: 'kw-intro',
      label: 'Keyphrase di Paragraf Pembuka',
      status: 'problem',
      message: 'Focus keyphrase tidak ditemukan di 100 kata pertama tulisan.',
    })
  }

  // 6. Focus Keyphrase in Subheadings (H2 / H3)
  const subheadings = (content.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [])
    .map((h) => h.replace(/<[^>]+>/g, '').toLowerCase().trim())
  const kwInSubheadings = kw ? subheadings.filter((h) => h.includes(kw)).length : 0

  if (kw && subheadings.length === 0) {
    indicators.push({
      id: 'kw-subheadings',
      label: 'Keyphrase di Subjudul (H2/H3)',
      status: 'problem',
      message: 'Belum ada subjudul (H2/H3) di artikel. Buat subjudul dan sertakan keyphrase.',
    })
  } else if (kw && kwInSubheadings > 0) {
    indicators.push({
      id: 'kw-subheadings',
      label: 'Keyphrase di Subjudul (H2/H3)',
      status: 'good',
      message: `Focus keyphrase ditemukan pada ${kwInSubheadings} subjudul.`,
      value: `${kwInSubheadings} subjudul`,
    })
  } else if (kw) {
    indicators.push({
      id: 'kw-subheadings',
      label: 'Keyphrase di Subjudul (H2/H3)',
      status: 'ok',
      message: 'Sertakan focus keyphrase pada setidaknya satu subjudul H2 atau H3.',
    })
  }

  // 7. Keyphrase Density & Stuffing Prevention
  let occurrences = 0
  let density = 0
  if (kw && wordCount > 0) {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    occurrences = (cleanText.match(regex) || []).length
    density = Number(((occurrences / wordCount) * 100).toFixed(1))

    if (density > 3.0) {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Keyphrase (Density)',
        status: 'problem',
        message: `Terlalu tinggi (${density}% - muncul ${occurrences} kali). Berisiko terdeteksi sebagai spam / keyword stuffing. Target ideal 0.5% - 2.5%.`,
        value: `${density}%`,
      })
    } else if (density >= 0.5 && density <= 2.5) {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Keyphrase (Density)',
        status: 'good',
        message: `Kepadatan optimal (${density}% - ${occurrences} kali penyebutan dari total ${wordCount} kata).`,
        value: `${density}%`,
      })
    } else if (occurrences > 0) {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Keyphrase (Density)',
        status: 'ok',
        message: `Kepadatan agak rendah (${density}% - ${occurrences} kali). Sebaiknya tambahkan penyebutan alami.`,
        value: `${density}%`,
      })
    } else {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Keyphrase (Density)',
        status: 'problem',
        message: 'Focus keyphrase belum disebutkan sama sekali di dalam isi artikel.',
        value: '0%',
      })
    }
  }

  // 8. Content Word Count (Cornerstone vs Standard)
  const minWords = isCornerstone ? 900 : 300
  if (wordCount >= minWords) {
    indicators.push({
      id: 'content-length',
      label: 'Panjang Konten',
      status: 'good',
      message: `Panjang konten memenuhi syarat (${wordCount} kata, target minimum ${minWords} kata${isCornerstone ? ' [Cornerstone Pillar]' : ''}).`,
      value: `${wordCount} kata`,
    })
  } else {
    indicators.push({
      id: 'content-length',
      label: 'Panjang Konten',
      status: 'problem',
      message: `Konten terlalu pendek (${wordCount} kata). Target minimum untuk konten ${isCornerstone ? 'Cornerstone adalah 900 kata' : 'standar adalah 300 kata'}.`,
      value: `${wordCount} kata`,
    })
  }

  // 9. Keyphrase Cannibalization Check
  if (kw && otherContentKeyphrases.length > 0) {
    const conflicting = otherContentKeyphrases.filter(
      (item) => item.keyphrase && item.keyphrase.toLowerCase().trim() === kw && item.slug !== cleanSlug
    )
    if (conflicting.length > 0) {
      indicators.push({
        id: 'kw-cannibalization',
        label: 'Deteksi Kanibalisasi Kata Kunci',
        status: 'problem',
        message: `Peringatan: Focus keyphrase "${focusKeyphrase}" sudah digunakan oleh konten lain: "${conflicting[0].title}" (/${conflicting[0].slug}). Dua halaman menargetkan kata kunci yang sama dapat memecah ranking SERP.`,
      })
    } else {
      indicators.push({
        id: 'kw-cannibalization',
        label: 'Deteksi Kanibalisasi Kata Kunci',
        status: 'good',
        message: `Bagus! Focus keyphrase "${focusKeyphrase}" belum pernah dipakai di konten lain.`,
      })
    }
  }

  // 10. Images & Alt Text & Keyphrase in Image Alt
  // Extract images from blocks/input or html <img>
  const htmlImgMatches = Array.from(content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi))
  const totalImgCount = Math.max(images.length, htmlImgMatches.length)
  let missingAlt = 0
  let kwInAltCount = 0

  if (images.length > 0) {
    for (const img of images) {
      if (img.decorative) continue
      if (!img.alt || !img.alt.trim()) missingAlt++
      else if (kw && img.alt.toLowerCase().includes(kw)) kwInAltCount++
    }
  } else {
    for (const match of htmlImgMatches) {
      const fullTag = match[0]
      const altMatch = fullTag.match(/alt=["']([^"']*)["']/i)
      const alt = altMatch ? altMatch[1].trim() : ''
      if (!alt) missingAlt++
      else if (kw && alt.toLowerCase().includes(kw)) kwInAltCount++
    }
  }

  if (totalImgCount === 0) {
    indicators.push({
      id: 'img-presence',
      label: 'Media Gambar Pendukung',
      status: 'ok',
      message: 'Belum ada gambar di dalam konten. Sisipkan gambar relevan untuk meningkatkan keterlibatan pembaca.',
      value: '0 gambar',
    })
  } else if (missingAlt > 0) {
    indicators.push({
      id: 'img-alt-check',
      label: 'Alt Text Gambar',
      status: 'problem',
      message: `${missingAlt} dari ${totalImgCount} gambar belum memiliki Alt Text. Alt text wajib untuk aksesibilitas dan SEO Google Gambar.`,
      value: `${missingAlt} gambar tanpa alt`,
    })
  } else {
    indicators.push({
      id: 'img-alt-check',
      label: 'Alt Text Gambar',
      status: 'good',
      message: `Semua ${totalImgCount} gambar telah dilengkapi atribut Alt Text.`,
      value: `${totalImgCount} gambar`,
    })

    if (kw && kwInAltCount > 0) {
      indicators.push({
        id: 'kw-img-alt',
        label: 'Keyphrase di Alt Text Gambar',
        status: 'good',
        message: `Focus keyphrase ditemukan pada alt text gambar (${kwInAltCount} gambar).`,
      })
    } else if (kw) {
      indicators.push({
        id: 'kw-img-alt',
        label: 'Keyphrase di Alt Text Gambar',
        status: 'ok',
        message: 'Sisipkan focus keyphrase pada setidaknya satu gambar yang relevan.',
      })
    }
  }

  // 11. Internal & External Links
  const internalLinksRegex = /href=["'](?:\/|\/layanan|\/portofolio|\/solusi|\/artikel|\/kontak|https?:\/\/(?:www\.)?segiatech\.com)[^"']*["']/gi
  const internalLinks = content.match(internalLinksRegex) || []
  const externalLinksRegex = /href=["']https?:\/\/(?!www\.segiatech\.com|segiatech\.com|localhost)[^"']+["']/gi
  const externalLinks = content.match(externalLinksRegex) || []

  if (internalLinks.length >= 2) {
    indicators.push({
      id: 'internal-links',
      label: 'Tautan Internal',
      status: 'good',
      message: `Terdeteksi ${internalLinks.length} tautan internal ke halaman lain dalam situs.`,
      value: internalLinks.length,
    })
  } else if (internalLinks.length === 1) {
    indicators.push({
      id: 'internal-links',
      label: 'Tautan Internal',
      status: 'ok',
      message: 'Hanya ada 1 tautan internal. Tambahkan tautan ke layanan atau studi kasus terkait.',
      value: 1,
    })
  } else {
    indicators.push({
      id: 'internal-links',
      label: 'Tautan Internal',
      status: 'problem',
      message: 'Belum ada tautan internal. Tautkan ke konten atau layanan lain untuk memperkuat arsitektur crawling.',
      value: 0,
    })
  }

  if (externalLinks.length >= 1) {
    indicators.push({
      id: 'external-links',
      label: 'Tautan Keluar (Outbound Links)',
      status: 'good',
      message: `Terdeteksi ${externalLinks.length} tautan ke sumber otoritatif luar.`,
      value: externalLinks.length,
    })
  } else {
    indicators.push({
      id: 'external-links',
      label: 'Tautan Keluar (Outbound Links)',
      status: 'ok',
      message: 'Menyertakan tautan ke riset atau sumber referensi tepercaya meningkatkan otoritas topik.',
      value: 0,
    })
  }

  // 12. Heading Structure (Single H1, no skipped levels)
  const h1Matches = content.match(/<h1[^>]*>/gi) || []
  if (h1Matches.length > 0) {
    indicators.push({
      id: 'heading-h1-check',
      label: 'Struktur Heading H1',
      status: 'problem',
      message: 'Terdeteksi tag <h1> di dalam isi konten. Judul artikel sudah otomatis menjadi satu-satunya H1 halaman. Gunakan H2 atau H3 di dalam badan artikel.',
    })
  }

  // 13. Readability Evaluation
  const readabilityResult = analyzeReadability(content, locale)

  // 14. Related Keyphrases Individual Evaluation (Section 3.1)
  const relatedKeyphraseResults = (relatedKeyphrases || []).map((relKw) => {
    const rLower = relKw.trim().toLowerCase()
    const relIndicators: AnalysisIndicator[] = []
    let relScore = 100

    if (!rLower) {
      return { keyphrase: relKw, score: 0, indicators: [] }
    }

    const inTitle = effectiveTitle.toLowerCase().includes(rLower)
    const inDesc = metaDescription.toLowerCase().includes(rLower)
    const inContent = cleanText.toLowerCase().includes(rLower)

    if (inTitle) {
      relIndicators.push({
        id: `rel-title-${relKw}`,
        label: 'Di Judul SEO',
        status: 'good',
        message: `Related keyphrase "${relKw}" ada di judul.`,
      })
    } else {
      relScore -= 20
      relIndicators.push({
        id: `rel-title-${relKw}`,
        label: 'Di Judul SEO',
        status: 'ok',
        message: `Related keyphrase "${relKw}" tidak ada di judul.`,
      })
    }

    if (inDesc) {
      relIndicators.push({
        id: `rel-desc-${relKw}`,
        label: 'Di Meta Description',
        status: 'good',
        message: `Related keyphrase "${relKw}" ada di deskripsi.`,
      })
    } else {
      relScore -= 15
      relIndicators.push({
        id: `rel-desc-${relKw}`,
        label: 'Di Meta Description',
        status: 'ok',
        message: `Related keyphrase "${relKw}" belum di deskripsi.`,
      })
    }

    if (inContent) {
      relIndicators.push({
        id: `rel-content-${relKw}`,
        label: 'Di Isi Konten',
        status: 'good',
        message: `Related keyphrase "${relKw}" muncul di dalam isi tulisan.`,
      })
    } else {
      relScore -= 30
      relIndicators.push({
        id: `rel-content-${relKw}`,
        label: 'Di Isi Konten',
        status: 'problem',
        message: `Related keyphrase "${relKw}" belum muncul di badan artikel.`,
      })
    }

    return {
      keyphrase: relKw,
      score: Math.max(0, relScore),
      indicators: relIndicators,
    }
  })

  // 15. Automated Internal Link Recommendations (Section 3.2)
  const internalLinkSuggestions: Array<{ title: string; slug: string; reason: string }> = []
  if (otherContentKeyphrases && otherContentKeyphrases.length > 0) {
    for (const item of otherContentKeyphrases.slice(0, 15)) {
      if (item.slug === cleanSlug) continue
      if (item.keyphrase && cleanText.toLowerCase().includes(item.keyphrase.toLowerCase())) {
        internalLinkSuggestions.push({
          title: item.title,
          slug: item.slug,
          reason: `Kata kunci terkait "${item.keyphrase}" disebut di artikel. Tautkan ke halaman ini.`,
        })
      }
    }
  }

  // Calculate composite SEO score
  let seoScore = 100
  for (const ind of indicators) {
    if (ind.status === 'problem') seoScore -= 12
    if (ind.status === 'ok') seoScore -= 4
  }
  seoScore = Math.max(10, Math.min(100, seoScore))

  let overallStatus: 'good' | 'ok' | 'problem' = 'good'
  if (seoScore < 60 || readabilityResult.score < 55) {
    overallStatus = 'problem'
  } else if (seoScore < 80 || readabilityResult.score < 75) {
    overallStatus = 'ok'
  }

  return {
    seoScore,
    readabilityScore: readabilityResult.score,
    overallStatus,
    indicators,
    readabilityIndicators: readabilityResult.indicators,
    relatedKeyphraseResults,
    internalLinkSuggestions: internalLinkSuggestions.slice(0, 4),
    metrics: {
      wordCount,
      headingCount: subheadings.length,
      imageCount: totalImgCount,
      missingAltCount: missingAlt,
      internalLinkCount: internalLinks.length,
      externalLinkCount: externalLinks.length,
      keyphraseDensity: density,
    },
  }
}
