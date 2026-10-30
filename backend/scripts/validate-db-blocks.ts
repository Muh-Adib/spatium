/**
 * Validate Database Blocks Script (L2-T1)
 *
 * Scans all rows in service_categories, services, solutions, pages,
 * and page_templates with non-null blocks, validating each against the K-2 Block Schema.
 *
 * Usage:
 *   npx tsx --conditions=react-server scripts/validate-db-blocks.ts
 */
import { prisma } from '../src/lib/db/prisma'
import { parseBlocks } from '../src/lib/blocks/schema'

interface ValidationResult {
  table: string
  id: string | number
  slug: string
  blockCount: number
  valid: boolean
  issues?: string[]
}

async function validateTable(
  tableName: string,
  records: Array<{ id: string | number; slug?: string | null; name?: string | null; blocks: string | null }>
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  for (const r of records) {
    if (!r.blocks) continue

    const parseResult = parseBlocks(r.blocks)
    const slug = r.slug || r.name || String(r.id)

    results.push({
      table: tableName,
      id: r.id,
      slug,
      blockCount: parseResult.ok ? parseResult.blocks.length : 0,
      valid: parseResult.ok,
      issues: parseResult.issues,
    })
  }

  return results
}

async function main() {
  console.log('[VALIDATE-BLOCKS] Starting comprehensive database blocks validation...')

  const [categoriesRows, servicesRows, solutionsRows, pagesRows, templatesRows] = await Promise.all([
    prisma.orm.public.ServiceCategory.all(),
    prisma.orm.public.Service.all(),
    prisma.orm.public.Solution.all(),
    prisma.orm.public.Page.all(),
    prisma.orm.public.PageTemplate.all(),
  ])

  const results: ValidationResult[] = [
    ...(await validateTable('service_categories', categoriesRows.map((r: any) => ({ id: r.id, slug: r.slug, blocks: r.blocks })))),
    ...(await validateTable('services', servicesRows.map((r: any) => ({ id: r.id, slug: r.slug, blocks: r.blocks })))),
    ...(await validateTable('solutions', solutionsRows.map((r: any) => ({ id: r.id, slug: r.slug, blocks: r.blocks })))),
    ...(await validateTable('pages', pagesRows.map((r: any) => ({ id: r.id, slug: r.slug, blocks: r.blocks })))),
    ...(await validateTable('page_templates', templatesRows.map((r: any) => ({ id: r.id, name: r.name, blocks: r.blocks })))),
  ]

  const total = results.length
  const valid = results.filter((r) => r.valid).length
  const invalid = results.filter((r) => !r.valid)

  console.log(`\n=================================================================`)
  console.log(`[VALIDATE-BLOCKS] Scanned ${total} entities with blocks:`)
  console.log(`  - Valid:   ${valid} (${total > 0 ? ((valid / total) * 100).toFixed(1) : 100}%)`)
  console.log(`  - Invalid: ${invalid.length}`)

  if (invalid.length > 0) {
    console.error('\n[VALIDATE-BLOCKS] Invalid block rows:')
    for (const inv of invalid) {
      console.error(`  - [${inv.table}] id=${inv.id} slug="${inv.slug}"`)
      console.error(`    Issues:`, inv.issues)
    }
    process.exit(1)
  } else {
    console.log('[VALIDATE-BLOCKS] 100% of validated block records match K-2 schema!')
  }
}

main().catch((err) => {
  console.error('[VALIDATE-BLOCKS] Fatal error:', err)
  process.exit(1)
})
