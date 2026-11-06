import 'server-only'
import { prisma } from './prisma'
import { PublicError } from '@/lib/http/errors'

export interface ClientLogoRecord {
  id: number
  name: string
  logoUrl: string
  altText?: string | null
  order?: number | null
  isActive?: boolean | null
  createdAt?: string
  updatedAt?: string
}

export type ClientLogoInput = {
  name: string
  logoUrl: string
  altText?: string
  order?: number
  isActive?: boolean
}

type ClientLogoRow = {
  id: number
  name: string
  logoUrl: string
  altText: string | null
  order: number | null
  isActive: boolean | null
  createdAt: string
  updatedAt: string
}

type Tx = Parameters<Parameters<typeof prisma.transaction>[0]>[0]

function toRecord(r: ClientLogoRow): ClientLogoRecord {
  return {
    id: r.id,
    name: r.name,
    logoUrl: r.logoUrl,
    altText: r.altText,
    order: r.order ?? 0,
    isActive: r.isActive ?? true,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

/** Revision snapshot + audit entry, written in the same transaction as the change. */
async function recordHistory(tx: Tx, row: ClientLogoRow, actor: string, action: string, diff?: Record<string, unknown>) {
  await tx.orm.public.ContentRevision.create({
    entityType: 'client_logo',
    entityId: String(row.id),
    actor,
    action,
    snapshot: JSON.stringify(row),
  })
  await tx.orm.public.SeoAuditLog.create({
    entityType: 'client_logo',
    entityId: String(row.id),
    action,
    actor,
    diff: diff ? JSON.stringify(diff) : null,
  })
}

/** Active logos for the public site (home partners strip, Delivery API). Empty on DB failure (logged). */
export async function getClientLogos(): Promise<ClientLogoRecord[]> {
  try {
    const rows = (await prisma.orm.public.ClientLogo.where({ isActive: true })
      .orderBy((c) => c.order.asc())
      .all()) as ClientLogoRow[]
    return rows.map(toRecord)
  } catch (err) {
    console.error('Failed to get client logos from database:', err)
    return []
  }
}

/** Every logo, active or not, for the Studio manager. Throws on DB failure so the UI can say so. */
export async function getAllClientLogos(): Promise<ClientLogoRecord[]> {
  const rows = (await prisma.orm.public.ClientLogo.orderBy((c) => c.order.asc()).all()) as ClientLogoRow[]
  return rows.map(toRecord)
}

export async function createClientLogo(data: ClientLogoInput, actor: string): Promise<ClientLogoRecord> {
  return prisma.transaction(async (tx) => {
    const row = (await tx.orm.public.ClientLogo.create({
      name: data.name,
      logoUrl: data.logoUrl,
      altText: data.altText || data.name,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
    })) as ClientLogoRow
    await recordHistory(tx, row, actor, 'CREATE_CLIENT_LOGO', { ...data })
    return toRecord(row)
  })
}

export async function updateClientLogo(id: number, data: ClientLogoInput, actor: string): Promise<ClientLogoRecord> {
  return prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.ClientLogo.where({ id }).forUpdate().first()) as ClientLogoRow | null
    if (!current) throw new PublicError('Logo klien tidak ditemukan.', 404)
    await tx.orm.public.ClientLogo.where({ id }).update({
      name: data.name,
      logoUrl: data.logoUrl,
      altText: data.altText || data.name,
      ...(data.order !== undefined ? { order: data.order } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    })
    // Snapshot is the state before the change, as for pages.
    await recordHistory(tx, current, actor, 'UPDATE_CLIENT_LOGO', { ...data })
    const updated = (await tx.orm.public.ClientLogo.where({ id }).first()) as ClientLogoRow
    return toRecord(updated)
  })
}

/** Deletes a logo; its last snapshot stays in ContentRevision. Returns the deleted record. */
export async function deleteClientLogo(id: number, actor: string): Promise<ClientLogoRecord> {
  return prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.ClientLogo.where({ id }).forUpdate().first()) as ClientLogoRow | null
    if (!current) throw new PublicError('Logo klien tidak ditemukan.', 404)
    await recordHistory(tx, current, actor, 'DELETE_CLIENT_LOGO')
    await tx.orm.public.ClientLogo.where({ id }).delete()
    return toRecord(current)
  })
}
