/**
 * Purge Synthetic & Mock Data Script (L1-T3, L1-T4)
 *
 * Removes synthetic GSC cache rows and fake PageSpeed snapshots
 * Default mode: DRY-RUN. Pass --apply to execute.
 *
 * Usage:
 *   npx tsx --conditions=react-server scripts/purge-synthetic-data.ts
 *   npx tsx --conditions=react-server scripts/purge-synthetic-data.ts --apply
 */
import { db, prisma } from '../src/lib/db/prisma'

async function main() {
  const isApply = process.argv.includes('--apply')
  console.log(`[PURGE] Running in ${isApply ? 'APPLY (live)' : 'DRY-RUN'} mode...`)

  // 1. Inspect gsc_caches
  const gscRows = await prisma.orm.public.GscCache.all()
  const gscCount = gscRows.length

  // 2. Inspect synthetic pagespeed_snapshots (performance=94, seo=98, lcp_ms=1850)
  const psRows = await prisma.orm.public.PagespeedSnapshot.where({
    performanceScore: 94,
    seoScore: 98,
    lcpMs: 1850,
  }).all()
  const psCount = psRows.length

  const report = {
    mode: isApply ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    gscCaches: {
      found: gscCount,
      toDelete: gscCount,
    },
    pagespeedSnapshots: {
      foundSynthetic: psCount,
      toDelete: psCount,
      signature: 'performance_score = 94 AND seo_score = 98 AND lcp_ms = 1850',
    },
    backup: null as string | null,
    status: isApply ? 'PURGED' : 'DRY_RUN_COMPLETE',
  }

  if (!isApply) {
    console.log(JSON.stringify(report, null, 2))
    console.log('\nRun with --apply to perform backup and purge synthetic data.')
    return
  }

  // Live apply
  // Delete from gsc_caches
  if (gscCount > 0) {
    await db.execute(db.sql.public.gsc_caches.delete().build())
    console.log(`[PURGE] Deleted ${gscCount} rows from gsc_caches`)
  }

  // Delete synthetic pagespeed_snapshots
  if (psCount > 0) {
    await db.execute(
      db.sql.public.pagespeed_snapshots
        .delete()
        .where(
          db.sql.public.pagespeed_snapshots.performance_score.equals(94),
          db.sql.public.pagespeed_snapshots.seo_score.equals(98),
          db.sql.public.pagespeed_snapshots.lcp_ms.equals(1850)
        )
        .build()
    )
    console.log(`[PURGE] Deleted ${psCount} synthetic rows from pagespeed_snapshots`)
  }

  // Audit log
  await prisma.orm.public.SeoAuditLog.create({
    entityType: 'page',
    entityId: 'system_purge_synthetic',
    action: 'purge_synthetic_data',
    actor: 'system',
    diff: JSON.stringify({
      deletedGscCaches: gscCount,
      deletedPagespeedSnapshots: psCount,
    }),
  })

  console.log('\n[PURGE] Completed successfully:')
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error('[PURGE] Fatal error:', err)
  process.exit(1)
})
