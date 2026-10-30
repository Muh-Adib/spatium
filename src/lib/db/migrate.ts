import { prisma } from './prisma'

export async function runMigrations() {
  console.log('[Migration] PostgreSQL database managed via Prisma 8 (@prisma/orm-postgres).')
}

if (process.argv[1]?.includes('migrate.ts')) {
  runMigrations()
}
