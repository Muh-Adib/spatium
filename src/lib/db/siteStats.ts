import 'server-only'
import { prisma } from './prisma'

export interface SiteStat {
  id: number
  key: string
  label: string
  value: string
  source?: string | null
  sourceDate?: string | null
  active?: boolean | null
  displayOrder?: number | null
}

/**
 * Retrieves verified site stats.
 * Enforces D6 / L8-T2: Only metrics with explicit source and source date are returned.
 * Claims without source are strictly omitted.
 */
export async function getVerifiedSiteStats(): Promise<SiteStat[]> {
  try {
    const rows = await prisma.orm.public.SiteStat
      .where({ active: true })
      .orderBy((s: any) => s.displayOrder.asc())
      .all()

    return rows.filter((r: any) => Boolean(r.source && r.source.trim() && r.sourceDate && r.sourceDate.trim()))
  } catch (err) {
    console.error('Failed to load site stats:', err)
    return []
  }
}
