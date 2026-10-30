import 'server-only'
import { prisma } from './prisma'

export interface SiteEntity {
  id: number
  slug: string
  name: string
  domain: string | null
  apiKey: string
  webhookUrl: string | null
  webhookSecret: string | null
  isActive: boolean
  settings?: Record<string, any> | null
  createdAt?: string
  updatedAt?: string
}

function getDefaultSite(apiKey?: string): SiteEntity {
  return {
    id: 1,
    slug: 'default',
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'SegiaTech',
    domain: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : 'segiatech.com',
    apiKey: apiKey || process.env.SITE_API_KEY || 'segia-default-key',
    webhookUrl: process.env.DEFAULT_WEBHOOK_URL || null,
    webhookSecret: process.env.REVALIDATE_SECRET || null,
    isActive: true,
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function getSiteByApiKey(apiKey: string): Promise<SiteEntity | null> {
  if (!apiKey || typeof apiKey !== 'string') return null
  const cleanKey = apiKey.trim()
  if (!cleanKey) return null

  try {
    const site = await prisma.orm.public.Site.where({ apiKey: cleanKey, isActive: true }).first()
    if (site) {
      return {
        id: site.id,
        slug: site.slug,
        name: site.name,
        domain: site.domain || null,
        apiKey: site.apiKey,
        webhookUrl: site.webhookUrl || null,
        webhookSecret: site.webhookSecret || null,
        isActive: Boolean(site.isActive),
        settings: site.settings ? JSON.parse(site.settings) : null,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      }
    }
  } catch (err) {
    console.error('[site] getSiteByApiKey query failed, evaluating fallback:', err)
  }

  // In production mode, strictly reject hardcoded fallback dummy keys
  if (process.env.NODE_ENV === 'production') {
    if (process.env.SITE_API_KEY && cleanKey === process.env.SITE_API_KEY.trim()) {
      return getDefaultSite(cleanKey)
    }
    return null
  }

  // Development and test convenience fallback
  const envKey = process.env.SITE_API_KEY || 'segia-default-key'
  if (cleanKey === envKey || cleanKey === 'site_sec_default' || cleanKey === 'segia-default-key') {
    return getDefaultSite(cleanKey)
  }

  return null
}

export async function getSiteBySlug(slug: string): Promise<SiteEntity | null> {
  if (!slug) return null
  try {
    const site = await prisma.orm.public.Site.where({ slug: slug.trim(), isActive: true }).first()
    if (site) {
      return {
        id: site.id,
        slug: site.slug,
        name: site.name,
        domain: site.domain || null,
        apiKey: site.apiKey,
        webhookUrl: site.webhookUrl || null,
        webhookSecret: site.webhookSecret || null,
        isActive: Boolean(site.isActive),
        settings: site.settings ? JSON.parse(site.settings) : null,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      }
    }
  } catch (err) {
    console.error('[site] getSiteBySlug error:', err)
  }

  if (slug === 'default') {
    return getDefaultSite()
  }

  return null
}

export async function getAllSites(): Promise<SiteEntity[]> {
  try {
    const sites = await prisma.orm.public.Site.all()
    if (sites && sites.length > 0) {
      return sites.map((s: any) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        domain: s.domain || null,
        apiKey: s.apiKey,
        webhookUrl: s.webhookUrl || null,
        webhookSecret: s.webhookSecret || null,
        isActive: Boolean(s.isActive),
        settings: s.settings ? JSON.parse(s.settings) : null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    }
  } catch (err) {
    console.error('[site] getAllSites error:', err)
  }

  return [getDefaultSite()]
}

export async function upsertSite(data: {
  slug: string
  name: string
  apiKey: string
  domain?: string | null
  webhookUrl?: string | null
  webhookSecret?: string | null
  isActive?: boolean
  settings?: Record<string, any> | null
}): Promise<SiteEntity> {
  const payload: any = {
    slug: data.slug,
    name: data.name,
    apiKey: data.apiKey,
    domain: data.domain || null,
    webhookUrl: data.webhookUrl || null,
    webhookSecret: data.webhookSecret || null,
    isActive: data.isActive !== undefined ? data.isActive : true,
    settings: data.settings ? JSON.stringify(data.settings) : null,
  }

  await prisma.orm.public.Site.upsert({
    conflictOn: { slug: data.slug },
    update: payload,
    create: payload,
  })

  const saved = await getSiteBySlug(data.slug)
  return saved || getDefaultSite()
}
