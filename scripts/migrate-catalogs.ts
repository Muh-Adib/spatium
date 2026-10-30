/**
 * Migrate Catalogs Script (PostgreSQL / Prisma 8 Migration Engine)
 * In Prisma 8 + PostgreSQL architecture, catalog schemas and relations
 * are strictly managed via `schema.prisma` and `prisma db update`.
 */
import { prisma } from '../src/lib/db/prisma'

async function runMigration() {
  console.log('🚀 Checking catalog schema and data state via Prisma 8...')
  const categoryCount = await prisma.orm.public.ServiceCategory.aggregate((m: any) => ({ count: m.count() }))
  console.log(`✓ Service categories count: ${categoryCount.count}`)
  console.log('✓ Catalog schema is active and managed by Prisma 8 PostgreSQL.')
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Catalog migration check failed:', err)
    process.exit(1)
  })
