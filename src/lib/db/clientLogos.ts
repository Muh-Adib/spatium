import 'server-only'
import { prisma } from './prisma'

export interface ClientLogoRecord {
  id: number | string
  name: string
  logoUrl: string
  altText?: string | null
  order?: number | null
  isActive?: boolean | null
  createdAt?: string
  updatedAt?: string
}

interface ClientLogoModelShape {
  where: (query: Record<string, unknown>) => {
    orderBy: (fn: (c: Record<string, { asc: () => unknown }>) => unknown) => { all: () => Promise<Array<Record<string, unknown>>> }
    update: (data: unknown) => Promise<unknown>
    delete: () => Promise<unknown>
  }
  orderBy: (fn: (c: Record<string, { asc: () => unknown }>) => unknown) => { all: () => Promise<Array<Record<string, unknown>>> }
  create: (data: unknown) => Promise<unknown>
}

function getClientLogoModel(): ClientLogoModelShape | null {
  const orm = prisma.orm.public as unknown as Record<string, ClientLogoModelShape>
  return orm?.ClientLogo ?? null
}

export async function getClientLogos(): Promise<ClientLogoRecord[]> {
  try {
    const clientLogoModel = getClientLogoModel()
    if (clientLogoModel) {
      const rows = await clientLogoModel
        .where({ isActive: true })
        .orderBy((c) => c.order.asc())
        .all()
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: (r.id as number | string),
          name: String(r.name || ''),
          logoUrl: String(r.logoUrl || ''),
          altText: typeof r.altText === 'string' ? r.altText : null,
          order: typeof r.order === 'number' ? r.order : 0,
          isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : undefined,
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : undefined,
        }))
      }
    }
    return []
  } catch (err) {
    console.error('Failed to get client logos from database:', err)
    return []
  }
}

export async function getAllClientLogos(): Promise<ClientLogoRecord[]> {
  try {
    const clientLogoModel = getClientLogoModel()
    if (clientLogoModel) {
      const rows = await clientLogoModel
        .orderBy((c) => c.order.asc())
        .all()
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: (r.id as number | string),
          name: String(r.name || ''),
          logoUrl: String(r.logoUrl || ''),
          altText: typeof r.altText === 'string' ? r.altText : null,
          order: typeof r.order === 'number' ? r.order : 0,
          isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : undefined,
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : undefined,
        }))
      }
    }
    return []
  } catch (err) {
    console.error('Failed to get all client logos from database:', err)
    return []
  }
}

export async function createClientLogo(data: {
  name: string
  logoUrl: string
  altText?: string
  order?: number
  isActive?: boolean
}) {
  try {
    const clientLogoModel = getClientLogoModel()
    if (!clientLogoModel) {
      throw new Error('ClientLogo model not available')
    }
    return await clientLogoModel.create({
      name: data.name,
      logoUrl: data.logoUrl,
      altText: data.altText || data.name,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
    })
  } catch (err) {
    console.error('Failed to create client logo in database:', err)
    throw err
  }
}

export async function updateClientLogo(
  id: number,
  data: Partial<{
    name: string
    logoUrl: string
    altText?: string
    order?: number
    isActive?: boolean
  }>
) {
  try {
    const clientLogoModel = getClientLogoModel()
    if (!clientLogoModel) {
      throw new Error('ClientLogo model not available')
    }
    return await clientLogoModel.where({ id }).update(data)
  } catch (err) {
    console.error('Failed to update client logo in database:', err)
    throw err
  }
}

export async function deleteClientLogo(id: number) {
  try {
    const clientLogoModel = getClientLogoModel()
    if (!clientLogoModel) {
      throw new Error('ClientLogo model not available')
    }
    return await clientLogoModel.where({ id }).delete()
  } catch (err) {
    console.error('Failed to delete client logo in database:', err)
    throw err
  }
}
