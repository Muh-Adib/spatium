import 'server-only'
import { siteConfig } from '@/config/site'
import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

export interface SiteProfileEntity {
  id: number
  name: string
  tagline: string | null
  description: string | null
  url: string
  whatsapp: string | null
  email: string | null
  phone: string | null
  address: string | null
  logoUrl: string | null
  faviconUrl: string | null
  socialLinks: Record<string, string>
  brandVoice: string | null
  hqLocation: string | null
  revisionGuarantee: string | null
  outputSpec: string | null
  primaryPersona: string | null
  defaultLocale: string
  targetCities: string[]
  updatedAt: string | null
}

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (!val) return fallback
  if (typeof val !== 'string') return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

export async function getSiteProfile(): Promise<SiteProfileEntity> {
  let row: any = null
  try {
    row = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
    if (!row) row = null
  } catch (err) {
    console.error('[getSiteProfile] DB error, using siteConfig fallback:', err instanceof Error ? err.message : err)
  }

  if (!row) {
    row = {
      id: 1,
      name: siteConfig.name,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
      url: siteConfig.url,
      whatsapp: siteConfig.whatsapp,
      email: siteConfig.email,
      phone: siteConfig.phone,
      address: siteConfig.address,
      logoUrl: '/images/logo.png',
      faviconUrl: '/favicon.ico',
      socialLinks: '{}',
      brandVoice: null,
      hqLocation: null,
      revisionGuarantee: null,
      outputSpec: null,
      primaryPersona: null,
      defaultLocale: 'id',
      targetCities: '[]',
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    url: row.url,
    whatsapp: row.whatsapp,
    email: row.email,
    phone: row.phone,
    address: row.address,
    logoUrl: row.logoUrl,
    faviconUrl: row.faviconUrl,
    socialLinks: parseJsonSafe(row.socialLinks, {}),
    brandVoice: row.brandVoice || null,
    hqLocation: row.hqLocation || null,
    revisionGuarantee: row.revisionGuarantee || null,
    outputSpec: row.outputSpec || null,
    primaryPersona: row.primaryPersona || null,
    defaultLocale: row.defaultLocale || 'id',
    targetCities: parseJsonSafe(row.targetCities, []),
    updatedAt: row.updatedAt,
  }
}

export async function updateSiteProfile(data: Partial<SiteProfileEntity>): Promise<SiteProfileEntity> {
  const payload: any = {}

  if (data.name !== undefined) payload.name = data.name
  if (data.tagline !== undefined) payload.tagline = data.tagline
  if (data.description !== undefined) payload.description = data.description
  if (data.url !== undefined) payload.url = data.url
  if (data.whatsapp !== undefined) payload.whatsapp = data.whatsapp
  if (data.email !== undefined) payload.email = data.email
  if (data.phone !== undefined) payload.phone = data.phone
  if (data.address !== undefined) payload.address = data.address
  if (data.logoUrl !== undefined) payload.logoUrl = data.logoUrl
  if (data.faviconUrl !== undefined) payload.faviconUrl = data.faviconUrl
  if (data.socialLinks !== undefined) payload.socialLinks = JSON.stringify(data.socialLinks)
  if (data.brandVoice !== undefined) payload.brandVoice = data.brandVoice
  if (data.hqLocation !== undefined) payload.hqLocation = data.hqLocation
  if (data.revisionGuarantee !== undefined) payload.revisionGuarantee = data.revisionGuarantee
  if (data.outputSpec !== undefined) payload.outputSpec = data.outputSpec
  if (data.primaryPersona !== undefined) payload.primaryPersona = data.primaryPersona
  if (data.defaultLocale !== undefined) payload.defaultLocale = data.defaultLocale
  if (data.targetCities !== undefined) payload.targetCities = JSON.stringify(data.targetCities)

  try {
    await prisma.orm.public.SiteConfig.upsert({
        conflictOn: { id: 1 },
        update: payload,
        create: {
          id: 1,
          name: payload.name || 'UNIMASI',
          url: payload.url || 'https://www.unimasi.com',
          ...payload,
        },
      }
    )
  } catch (err) {
    console.error('Failed to update site config:', err)
  }

  try {
    revalidatePath('/', 'layout')
    revalidatePath('/kontak')
    revalidatePath('/tentang')
  } catch {}

  return getSiteProfile()
}
