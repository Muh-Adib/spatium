/**
 * Runs scripts/seed.ts only when the database has no Studio content yet.
 *
 * Used by the one-shot `migrate` service in docker-compose.yml on every deploy.
 * seed.ts upserts content, so running it against a live database would overwrite
 * edits made in Studio; this guard makes automatic deploys safe.
 */
import { spawnSync } from 'node:child_process'
import { prisma } from '../src/lib/db/prisma'

async function isEmpty(): Promise<boolean> {
  const db = prisma.orm.public
  const [portfolio, article, page, service] = await Promise.all([
    db.Portfolio.first(),
    db.Article.first(),
    db.Page.first(),
    db.Service.first(),
  ])
  return !portfolio && !article && !page && !service
}

async function main() {
  if (process.env.SEED_ON_EMPTY === 'false') {
    console.log('↷ SEED_ON_EMPTY=false — seed skipped.')
    return
  }
  if (!(await isEmpty())) {
    console.log('✓ Database already has content — seed skipped (it would overwrite Studio edits).')
    return
  }
  console.log('🌱 Empty database detected — running seed.')
  const result = spawnSync('pnpm', ['run', 'db:seed'], { stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`db:seed exited with status ${result.status ?? 'unknown'}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('❌ seed-if-empty failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
