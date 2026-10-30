/**
 * SEGIA Publication Gate (L3-T7 / Section 3.4)
 * Strict validation rule preventing catalog content from publishing if critical SEO
 * or accessibility requirements (alt text, meta tags, schema validity) are violated.
 */

import { parseBlocks } from './schema'
import { blocksToSeoText } from './seo-text'

export interface PublicationGateInput {
  title?: string
  slug?: string
  metaTitle?: string
  metaDescription?: string
  heroImage?: string
  heroImageAlt?: string
  blocks?: any[]
}

export interface PublicationGateResult {
  canPublish: boolean
  issues: string[]
  warnings: string[]
}

export function validateCatalogPublication(input: PublicationGateInput): PublicationGateResult {
  const issues: string[] = []
  const warnings: string[] = []

  // 1. Title
  if (!input.title || typeof input.title !== 'string' || input.title.trim().length < 3) {
    issues.push('Judul halaman wajib diisi minimal 3 karakter.')
  }

  // 2. Slug
  if (!input.slug || typeof input.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim())) {
    issues.push('Slug wajib diisi dengan format huruf kecil dan tanda hubung valid (misal: "pengembangan-aplikasi-web").')
  }

  // 3. Meta Title
  if (!input.metaTitle || typeof input.metaTitle !== 'string' || input.metaTitle.trim().length < 10) {
    issues.push('Meta Title (SEO) wajib diisi minimal 10 karakter untuk mesin pencari.')
  } else if (input.metaTitle.trim().length > 70) {
    warnings.push('Meta Title melebihi 70 karakter dan berpotensi terpotong di SERP Google.')
  }

  // 4. Meta Description
  if (!input.metaDescription || typeof input.metaDescription !== 'string' || input.metaDescription.trim().length < 20) {
    issues.push('Meta Description (SEO) wajib diisi minimal 20 karakter untuk ringkasan di hasil pencarian.')
  } else if (input.metaDescription.trim().length > 165) {
    warnings.push('Meta Description melebihi 165 karakter dan berpotensi terpotong di SERP Google.')
  }

  // 5. Hero Image Alt
  if (input.heroImage && typeof input.heroImage === 'string' && input.heroImage.trim()) {
    if (!input.heroImageAlt || typeof input.heroImageAlt !== 'string' || input.heroImageAlt.trim().length < 3) {
      issues.push('Hero image wajib memiliki Alt Text deskriptif untuk aksesibilitas dan SEO gambar.')
    }
  }

  // 6. Visual Blocks Validation
  const blocks = input.blocks || []
  if (blocks.length > 0) {
    // Schema check
    const schemaCheck = parseBlocks(blocks)
    if (!schemaCheck.ok && schemaCheck.issues) {
      for (const issue of schemaCheck.issues) {
        issues.push(`Skema Blok: ${issue}`)
      }
    }

    // Image alt text audit
    const seoText = blocksToSeoText(blocks)
    if (seoText.imagesWithoutAlt.length > 0) {
      for (const imgContext of seoText.imagesWithoutAlt) {
        issues.push(`Aksesibilitas: Gambar pada "${imgContext}" tidak memiliki Alt Text.`)
      }
    }
  }

  return {
    canPublish: issues.length === 0,
    issues,
    warnings,
  }
}
