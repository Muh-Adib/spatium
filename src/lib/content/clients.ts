import 'server-only'
import { getClientLogos as getDbClientLogos } from '@/lib/db/clientLogos'

export interface ClientLogoItem {
  id: string
  name: string
  src: string
  alt: string
  imgClass?: string
}

/**
 * Retrieves client logos from PostgreSQL database via Prisma 8 ClientLogo model.
 * Enforces Zero-Mock / Zero Fictional Fallbacks policy.
 */
export async function getClientLogos(): Promise<ClientLogoItem[]> {
  try {
    const records = await getDbClientLogos()
    if (records && records.length > 0) {
      return records.map((r) => ({
        id: String(r.id),
        name: r.name,
        src: r.logoUrl,
        alt: r.altText || r.name,
      }))
    }
    return []
  } catch (err: any) {
    console.error('Failed to get client logos from DB:', err?.message || String(err))
    return []
  }
}
