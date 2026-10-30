import {
  ContentSeo,
  PublicationGateResult,
  GateViolation,
  Locale,
} from './schema'

// ─── Automated AI SEO Output Validator (Section 3.5) ────────────────────────
export interface AiValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates an AI-generated SEO title against Section 3.5 requirements
 */
export function validateAiTitle(
  title: string,
  focusKeyphrase: string,
  locale: Locale,
  existingTitles: string[] = []
): AiValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const trimmed = title.trim()

  if (!trimmed) {
    errors.push('SEO title tidak boleh kosong.')
    return { valid: false, errors, warnings }
  }

  // Length check (ideal: 40 - 65 chars)
  if (trimmed.length < 30) {
    errors.push(`SEO title terlalu pendek (${trimmed.length} karakter, minimal 30).`)
  } else if (trimmed.length > 70) {
    errors.push(`SEO title terlalu panjang (${trimmed.length} karakter, maksimal 70). Berpotensi terpotong di SERP.`)
  }

  // Focus keyphrase check
  if (focusKeyphrase) {
    const kwLower = focusKeyphrase.toLowerCase()
    const titleLower = trimmed.toLowerCase()
    if (!titleLower.includes(kwLower)) {
      errors.push(`SEO title harus memuat focus keyphrase "${focusKeyphrase}".`)
    } else {
      // Front-loaded bonus warning
      const kwIndex = titleLower.indexOf(kwLower)
      if (kwIndex > 25) {
        warnings.push('Focus keyphrase berada di belakang judul. Sebaiknya diletakkan sedekat mungkin ke awal.')
      }
    }
  }

  // Duplicate check
  const isDuplicate = existingTitles.some(
    (existing) => existing.toLowerCase().trim() === trimmed.toLowerCase()
  )
  if (isDuplicate) {
    errors.push('SEO title sudah digunakan di konten lain. Buat judul unik.')
  }

  // Locale language consistency heuristic
  if (locale === 'id') {
    // English-heavy words detection in Indonesian title
    if (/\b(the|and|with|for|how to|best|top|guide)\b/i.test(trimmed) && !trimmed.toLowerCase().includes('software')) {
      warnings.push('Terdeteksi kemungkinan kata bahasa Inggris dalam SEO title untuk locale Bahasa Indonesia.')
    }
  } else if (locale === 'en') {
    if (/\b(dan|untuk|dengan|cara|terbaik|panduan|jasa)\b/i.test(trimmed)) {
      warnings.push('Terdeteksi kata bahasa Indonesia dalam SEO title untuk locale Bahasa Inggris.')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates an AI-generated Meta Description against Section 3.5 requirements
 */
export function validateAiMetaDescription(
  desc: string,
  focusKeyphrase: string,
  locale: Locale,
  existingDescriptions: string[] = []
): AiValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const trimmed = desc.trim()

  if (!trimmed) {
    errors.push('Meta description tidak boleh kosong.')
    return { valid: false, errors, warnings }
  }

  // Target 120-160 characters (accept 110-165 before hard error)
  if (trimmed.length < 110) {
    errors.push(`Meta description terlalu pendek (${trimmed.length} karakter, target 120-160).`)
  } else if (trimmed.length > 165) {
    errors.push(`Meta description melebihi batas cuplikan Google (${trimmed.length} karakter, maksimal 160).`)
  }

  // Natural keyphrase inclusion
  if (focusKeyphrase) {
    const kwLower = focusKeyphrase.toLowerCase()
    const descLower = trimmed.toLowerCase()
    if (!descLower.includes(kwLower)) {
      errors.push(`Meta description harus memuat keyphrase "${focusKeyphrase}" secara alami.`)
    }
  }

  // Check for CTA / reason to click
  const hasCtaId = /\b(pelajari|temukan|simak|hubungi|konsultasi|lihat|baca|dapatkan|cek)\b/i.test(trimmed)
  const hasCtaEn = /\b(learn|discover|explore|contact|consult|read|get|check|find out)\b/i.test(trimmed)
  if (locale === 'id' && !hasCtaId) {
    warnings.push('Disarankan menyertakan kalimat ajakan / alasan klik (misal: "Pelajari selengkapnya", "Temukan solusinya").')
  } else if (locale === 'en' && !hasCtaEn) {
    warnings.push('Consider adding a clear call-to-action or click incentive.')
  }

  // Duplicate check
  const isDuplicate = existingDescriptions.some(
    (existing) => existing.toLowerCase().trim() === trimmed.toLowerCase()
  )
  if (isDuplicate) {
    errors.push('Meta description duplikat dengan konten lain.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates Alt Text against Section 3.5 & Section 5 requirements
 */
export function validateAltText(alt: string, isDecorative: boolean = false): AiValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const trimmed = alt.trim()

  if (isDecorative) {
    return { valid: true, errors: [], warnings: [] }
  }

  if (!trimmed) {
    errors.push('Alt text wajib diisi untuk gambar yang bukan dekoratif.')
    return { valid: false, errors, warnings }
  }

  // Max 125 characters
  if (trimmed.length > 125) {
    errors.push(`Alt text terlalu panjang (${trimmed.length} karakter, maksimal 125 karakter untuk screen reader & Google Images).`)
  }

  // Prohibition on "gambar dari" / "foto dari" / "image of"
  if (/^(gambar|foto|image of|photo of|picture of)\b/i.test(trimmed)) {
    errors.push('Alt text tidak boleh diawali dengan "gambar/foto dari" atau "image/picture of" (screen reader sudah otomatis mengumumkan "image").')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates URL Slug against Section 3.5 requirements
 */
export function validateSlug(slug: string, existingSlugs: string[] = []): AiValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const trimmed = slug.trim().toLowerCase()

  if (!trimmed) {
    errors.push('Slug URL tidak boleh kosong.')
    return { valid: false, errors, warnings }
  }

  // Format check: lowercase alphanumeric and hyphens only
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    errors.push('Slug hanya boleh memuat huruf kecil, angka, dan tanda hubung tunggal (-).')
  }

  if (trimmed.length > 80) {
    warnings.push(`Slug cukup panjang (${trimmed.length} karakter). URL ringkas lebih mudah dibagikan & ramah SEO.`)
  }

  // Stopword density warning
  const stopwords = ['dan', 'atau', 'ke', 'dari', 'yang', 'untuk', 'dengan', 'pada', 'di', 'the', 'and', 'for', 'with', 'from']
  const parts = trimmed.split('-')
  const stopwordCount = parts.filter((p) => stopwords.includes(p)).length
  if (stopwordCount >= 3) {
    warnings.push(`Slug memuat ${stopwordCount} stop-word. Disarankan membersihkan kata sambung yang tidak perlu.`)
  }

  if (existingSlugs.includes(trimmed)) {
    errors.push(`Slug "${trimmed}" sudah digunakan oleh konten lain. Slug harus unik.`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ─── Publication Gate Check (Section 3.4) ───────────────────────────────────
export interface PublicationGateInput {
  locale: Locale
  title: string
  slug: string
  metaDescription: string
  seoTitle?: string
  seoData?: ContentSeo | null
  existingSlugs: string[]
  images: Array<{
    url: string
    altText?: string | { id?: string; en?: string }
    decorative?: boolean
  }>
  heroVisual?: {
    url: string
    altText?: string | { id?: string; en?: string }
    decorative?: boolean
  } | null
}

/**
 * Evaluates whether a piece of content meets all mandatory criteria to be published.
 * Returns canPublish: false if any critical violation exists.
 */
export function checkPublicationGate(input: PublicationGateInput): PublicationGateResult {
  const violations: GateViolation[] = []
  const warnings: GateViolation[] = []
  const locale = input.locale || 'id'

  // 1. Slug check
  const slugValidation = validateSlug(input.slug, input.existingSlugs)
  for (const err of slugValidation.errors) {
    violations.push({
      rule: 'unique_valid_slug',
      field: 'slug',
      severity: 'critical',
      message: err,
    })
  }
  for (const warn of slugValidation.warnings) {
    warnings.push({
      rule: 'slug_optimization',
      field: 'slug',
      severity: 'warning',
      message: warn,
    })
  }

  // 2. SEO Title check
  const titleToCheck = input.seoTitle
  if (!titleToCheck || !titleToCheck.trim()) {
    violations.push({
      rule: 'required_seo_title',
      field: 'seoTitle',
      severity: 'critical',
      message: 'SEO Title wajib diisi sebelum publikasi.',
    })
  }

  // 3. Meta description check
  if (!input.metaDescription || !input.metaDescription.trim()) {
    violations.push({
      rule: 'required_meta_description',
      field: 'metaDescription',
      severity: 'critical',
      message: 'Meta description wajib diisi sebelum publikasi agar snippet Google tidak kosong.',
    })
  } else if (input.metaDescription.trim().length < 50) {
    warnings.push({
      rule: 'short_meta_description',
      field: 'metaDescription',
      severity: 'warning',
      message: 'Meta description sangat pendek (< 50 karakter). Disarankan 120-160 karakter.',
    })
  }

  // 4. Hero Visual Alt Text Gate (Section 6)
  if (input.heroVisual && input.heroVisual.url) {
    if (!input.heroVisual.decorative) {
      let heroAlt = ''
      if (typeof input.heroVisual.altText === 'string') {
        heroAlt = input.heroVisual.altText
      } else if (input.heroVisual.altText && typeof input.heroVisual.altText === 'object') {
        heroAlt = input.heroVisual.altText[locale] || ''
      }

      if (!heroAlt || !heroAlt.trim()) {
        violations.push({
          rule: 'hero_image_missing_alt',
          field: 'heroVisual.altText',
          severity: 'critical',
          message: `Hero/Cover image wajib memiliki deskripsi Alt Text untuk bahasa [${locale.toUpperCase()}] sebelum diterbitkan.`,
        })
      } else {
        const altCheck = validateAltText(heroAlt, false)
        for (const err of altCheck.errors) {
          violations.push({
            rule: 'hero_alt_invalid',
            field: 'heroVisual.altText',
            severity: 'critical',
            message: err,
          })
        }
      }
    }
  }

  // 5. Content Images Alt Text Gate (Section 3.4 & 16.4)
  for (let i = 0; i < input.images.length; i++) {
    const img = input.images[i]
    if (img.decorative) continue

    let altString = ''
    if (typeof img.altText === 'string') {
      altString = img.altText
    } else if (img.altText && typeof img.altText === 'object') {
      altString = img.altText[locale] || ''
    }

    if (!altString || !altString.trim()) {
      violations.push({
        rule: 'content_image_missing_alt',
        field: `images[${i}].altText`,
        severity: 'critical',
        message: `Gambar ${i + 1} (${img.url}) belum memiliki Alt Text untuk bahasa [${locale.toUpperCase()}]. Semua gambar wajib memiliki Alt Text untuk dapat diterbitkan.`,
      })
    } else {
      const altCheck = validateAltText(altString, false)
      for (const err of altCheck.errors) {
        violations.push({
          rule: 'content_image_invalid_alt',
          field: `images[${i}].altText`,
          severity: 'critical',
          message: `Gambar ${i + 1}: ${err}`,
        })
      }
    }
  }

  // 6. Unvalidated AI fields gate (Section 3.4 & 3.5)
  if (input.seoData?.fieldSource) {
    for (const [key, source] of Object.entries(input.seoData.fieldSource)) {
      if (source === 'ai') {
        // AI suggestions must be reviewed or edited before final publication
        warnings.push({
          rule: 'unreviewed_ai_field',
          field: key,
          severity: 'warning',
          message: `Field "${key}" berasal dari saran AI langsung dan belum diedit/ditinjau secara manual oleh penulis.`,
        })
      }
    }
  }

  return {
    canPublish: violations.length === 0,
    violations,
    warnings,
  }
}
