import 'server-only'
import { prisma } from './prisma'
import type { SiteSetting } from '../content/types'
import { siteConfig } from '@/config/site'

export async function getSiteSetting(): Promise<SiteSetting> {
  let row: any = null
  try {
    row = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
  } catch (err) {
    console.error('Failed to get site setting:', err)
  }

  // No invented profiles: social links come only from the DB row.
  let socialLinks: Record<string, string> = {}

  if (row?.socialLinks) {
    try {
      socialLinks = typeof row.socialLinks === 'string' ? JSON.parse(row.socialLinks) : row.socialLinks
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return {
    id: row?.id || 1,
    documentId: 'site-config-1',
    siteName: row?.name || siteConfig.name,
    siteDescription: row?.description || undefined,
    siteUrl: row?.url || siteConfig.url,
    whatsapp: row?.whatsapp || undefined,
    email: row?.email || undefined,
    phone: row?.phone || undefined,
    address: row?.address || undefined,
    socialLinks,
  }
}

export { getSiteSetting as getSiteConfig }
