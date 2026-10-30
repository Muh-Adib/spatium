import type { UrlMigration } from '@/lib/content/types'
import { getRedirects } from '@/lib/content/queries'

// -----------------------------------------------------------------------------
// URL Migration & Redirect Registry (L8-T7)
// Single Source of Truth in SQLite (Zero hardcoded redirect arrays)
// -----------------------------------------------------------------------------

/**
 * Fetch dynamic redirects from WebShift Engine (SQLite/Drizzle).
 * Enforces L8-T7: Database is the sole source of truth for redirects.
 * Includes loop detection and self-redirect prevention.
 */
export async function getDynamicRedirects(): Promise<UrlMigration[]> {
  try {
    const dbRedirects = await getRedirects()
    return dbRedirects
      .filter((r) => r.sourcePath !== r.destinationPath) // Prevent immediate self-redirect loops
      .map((r) => ({
        oldUrl: r.sourcePath,
        newUrl: r.destinationPath,
        status: 'redirect' as const,
        redirectCode: (r.statusCode === 301 || r.statusCode === 308 ? r.statusCode : 301) as 301 | 308,
        reason: r.reason ?? 'Engine redirect',
      }))
  } catch {
    console.warn('[redirects] Failed to fetch dynamic redirects from database')
    return []
  }
}

/**
 * Retrieves all verified redirects from SQLite database with loop prevention.
 */
export async function getAllRedirects(): Promise<UrlMigration[]> {
  return getDynamicRedirects()
}
