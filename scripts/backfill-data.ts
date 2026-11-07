/**
 * Idempotent data backfills, run by the one-shot `migrate` compose service on every
 * deploy (after `prisma db update`). Each step only fills values that are missing and
 * never overwrites an editor's change, so re-running it is a no-op.
 *
 * 1. Service category cover alt: older rows keep the alt text as a `keyOutcomes` entry
 *    labelled `imageAlt`, but Studio and the publication gate read `seoData.coverAlt`.
 *    Without it, published categories cannot be saved again (gate: missing alt).
 */
import { prisma } from '../src/lib/db/prisma'
import { coverAltFrom, parseJsonObject, recordCatalogHistory } from '../src/lib/db/catalogMutations'

const ACTOR = 'system:backfill'

function legacyImageAlt(keyOutcomes: string | null): string | undefined {
  if (!keyOutcomes) return undefined
  try {
    const list: unknown = JSON.parse(keyOutcomes)
    if (!Array.isArray(list)) return undefined
    for (const item of list) {
      if (item && typeof item === 'object' && 'label' in item && 'value' in item && item.label === 'imageAlt') {
        return typeof item.value === 'string' && item.value.trim() ? item.value.trim() : undefined
      }
    }
  } catch (err) {
    console.warn('[backfill] keyOutcomes is not valid JSON:', err instanceof Error ? err.message : err)
  }
  return undefined
}

async function backfillCategoryCoverAlt(): Promise<number> {
  const rows = await prisma.orm.public.ServiceCategory.all()
  let updated = 0
  for (const row of rows) {
    if (!row.heroImage || coverAltFrom(row.seoData)) continue
    const alt = legacyImageAlt(row.keyOutcomes)
    if (!alt) continue
    await prisma.transaction(async (tx) => {
      // Re-check inside the transaction so a concurrent Studio save wins.
      const current = await tx.orm.public.ServiceCategory.where({ id: row.id }).forUpdate().first()
      if (!current || coverAltFrom(current.seoData)) return
      const seoData = JSON.stringify({ ...(parseJsonObject(current.seoData) ?? {}), coverAlt: alt })
      await tx.orm.public.ServiceCategory.where({ id: row.id }).update({ seoData })
      await recordCatalogHistory(tx, 'service_category', row.id, ACTOR, 'backfill_cover_alt', current, { coverAlt: alt })
      updated += 1
    })
  }
  return updated
}

async function main() {
  const categories = await backfillCategoryCoverAlt()
  console.log(`✓ Backfill: service category cover alt filled for ${categories} row(s).`)
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('❌ backfill-data failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
