import { prisma } from '../src/lib/db/prisma'
import { syncContentNode } from '../src/lib/graph/nodes'

async function runBackfill() {
  console.log('[Backfill] Starting Content Graph backfill to content_nodes...')

  const startTime = Date.now()

  // 1. Sync Services
  const allServices = await prisma.orm.public.Service.all()
  console.log(`[Backfill] Syncing ${allServices.length} services...`)
  for (const s of allServices) {
    await syncContentNode('service', s.id)
  }

  // 2. Sync Solutions
  const allSolutions = await prisma.orm.public.Solution.all()
  console.log(`[Backfill] Syncing ${allSolutions.length} solutions...`)
  for (const sol of allSolutions) {
    await syncContentNode('solution', sol.id)
  }

  // 3. Sync Portfolios
  const allPortfolios = await prisma.orm.public.Portfolio.all()
  console.log(`[Backfill] Syncing ${allPortfolios.length} portfolios...`)
  for (const p of allPortfolios) {
    await syncContentNode('portfolio', p.id)
  }

  // 4. Sync Pages & Landings
  const allPages = await prisma.orm.public.Page.all()
  console.log(`[Backfill] Syncing ${allPages.length} pages/landings...`)
  for (const pg of allPages) {
    await syncContentNode('landing', pg.id)
  }

  // 5. Sync Articles
  const allArticles = await prisma.orm.public.Article.all()
  console.log(`[Backfill] Syncing ${allArticles.length} articles...`)
  for (const a of allArticles) {
    await syncContentNode('article', a.id)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`[Backfill] Completed in ${duration}s.`)
}

runBackfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Backfill] Failed:', err)
    process.exit(1)
  })
