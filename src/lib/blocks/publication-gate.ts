/**
 * SPATIUM Publication Gate (L3-T7 / Section 3.4)
 * Strict validation rule preventing catalog content from publishing if critical SEO
 * or accessibility requirements (alt text, meta tags, schema validity) are violated.
 *
 * Every issue starts with the thing to fix (`Judul:`, `Slug:`, `Meta title:`,
 * `Meta description:`, `Teks alternatif gambar sampul:`, `Blok …` / `Daftar blok:`);
 * the editors map issues to fields by that prefix (`gateIssueTarget`).
 */

import { parseBlocks } from './schema'
import { validateBlockListFor } from './catalog'
import type { BlockTarget } from './define'
import { blocksToSeoText } from './seo-text'

export interface PublicationGateInput {
  title?: string
  slug?: string
  metaTitle?: string
  metaDescription?: string
  heroImage?: string
  heroImageAlt?: string
  blocks?: any[]
  /** Where the blocks are placed: catalogue types not offered there are refused. */
  target?: BlockTarget
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
    issues.push('Judul: isi minimal 3 karakter.')
  }

  // 2. Slug
  if (!input.slug || typeof input.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim())) {
    issues.push('Slug: gunakan huruf kecil, angka, dan tanda hubung saja, mis. pemindaian-gedung.')
  }

  // 3. Meta Title
  if (!input.metaTitle || typeof input.metaTitle !== 'string' || input.metaTitle.trim().length < 10) {
    issues.push('Meta title: isi minimal 10 karakter agar judul tampil di hasil pencarian.')
  } else if (input.metaTitle.trim().length > 70) {
    warnings.push('Meta title lebih dari 70 karakter dan bisa terpotong di hasil pencarian. Persingkat bila memungkinkan.')
  }

  // 4. Meta Description
  if (!input.metaDescription || typeof input.metaDescription !== 'string' || input.metaDescription.trim().length < 20) {
    issues.push('Meta description: isi minimal 20 karakter sebagai ringkasan di hasil pencarian.')
  } else if (input.metaDescription.trim().length > 165) {
    warnings.push('Meta description lebih dari 165 karakter dan bisa terpotong di hasil pencarian. Persingkat bila memungkinkan.')
  }

  // 5. Hero Image Alt
  if (input.heroImage && typeof input.heroImage === 'string' && input.heroImage.trim()) {
    if (!input.heroImageAlt || typeof input.heroImageAlt !== 'string' || input.heroImageAlt.trim().length < 3) {
      issues.push('Teks alternatif gambar sampul: jelaskan isi gambar (minimal 3 karakter) untuk pembaca layar.')
    }
  }

  // 6. Visual Blocks Validation
  const blocks = input.blocks || []
  if (blocks.length > 0) {
    // Schema check
    const schemaCheck = parseBlocks(blocks)
    if (!schemaCheck.ok && schemaCheck.issues) {
      for (const issue of schemaCheck.issues) {
        issues.push(issue)
      }
    } else if (input.target) {
      const targetCheck = validateBlockListFor(input.target, blocks)
      for (const issue of targetCheck.issues) {
        issues.push(`Blok ${issue.index + 1}${issue.type ? ` (${issue.type})` : ''}: ${issue.message}`)
      }
    }

    // Image alt text audit
    const seoText = blocksToSeoText(blocks)
    if (seoText.imagesWithoutAlt.length > 0) {
      for (const imgContext of seoText.imagesWithoutAlt) {
        issues.push(`Blok "${imgContext}": gambar belum punya teks alternatif. Isi teks alternatifnya di blok tersebut.`)
      }
    }
  }

  return {
    canPublish: issues.length === 0,
    issues,
    warnings,
  }
}
