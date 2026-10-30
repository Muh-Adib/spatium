import { inject } from 'vitest'

declare module 'vitest' {
  export interface ProvidedContext { isolatedDatabaseUrl: string }
}
const databaseUrl = inject('isolatedDatabaseUrl')
if (!databaseUrl || !/^\/segia_(?:verify|test)_[a-z0-9_]+$/.test(new URL(databaseUrl).pathname)) throw new Error('Refusing tests without a disposable database.')
process.env.DATABASE_URL = databaseUrl
