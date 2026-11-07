/**
 * Publication gate for dynamic pages, shared by the repository (authoritative,
 * server) and the Studio editor (live checklist, client). Pure and client-safe.
 */
import { validateBlockList, type BlockIssue } from '@/lib/blocks/catalog'
import { validateCatalogPublication } from '@/lib/blocks/publication-gate'

export type PageGateInput = {
  title: string
  slug: string
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  ogImageAlt: string | null
  blocks: unknown[]
}

export type PageGateResult = { issues: string[]; warnings: string[]; blockIssues: BlockIssue[] }

export function computePageGate(page: PageGateInput): PageGateResult {
  const blockResult = validateBlockList(page.blocks)
  const gate = validateCatalogPublication({
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle ?? undefined,
    metaDescription: page.metaDescription ?? undefined,
    heroImage: page.ogImage ?? undefined,
    heroImageAlt: page.ogImageAlt ?? undefined,
    blocks: blockResult.ok ? blockResult.blocks : undefined,
  })
  const issues = [...gate.issues]
  if (page.blocks.length === 0) issues.push('Halaman belum punya blok.')
  return { issues, warnings: gate.warnings, blockIssues: blockResult.issues }
}

/** Where the editor should send the user to fix a gate issue. */
export type GateTarget = 'title' | 'slug' | 'metaTitle' | 'metaDescription' | 'ogImageAlt' | 'blocks'

export function gateIssueTarget(issue: string): GateTarget {
  const s = issue.toLowerCase()
  if (s.startsWith('judul')) return 'title'
  if (s.startsWith('slug')) return 'slug'
  if (s.startsWith('meta title')) return 'metaTitle'
  if (s.startsWith('meta description')) return 'metaDescription'
  if (s.startsWith('teks alternatif gambar')) return 'ogImageAlt'
  return 'blocks'
}
