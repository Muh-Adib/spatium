import 'server-only'
import { prisma } from './prisma'

export interface LocationEntity {
  id: number
  name: string
  slug: string
  region: string | null
  image: string | null
  createdAt: string | null
}

export async function getLocations(): Promise<LocationEntity[]> {
  try {
    const rows = await prisma.orm.public.Location.orderBy((l: any) => l.name.asc()).all()
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      region: r.region || null,
      image: r.image || null,
      createdAt: r.createdAt || null,
    }))
  } catch {
    return []
  }
}

export async function getLocationBySlug(slug: string): Promise<LocationEntity | null> {
  try {
    const row = await prisma.orm.public.Location.where({ slug: slug.toLowerCase().trim() }).first()
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      region: row.region || null,
      image: row.image || null,
      createdAt: row.createdAt || null,
    }
  } catch {
    return null
  }
}
