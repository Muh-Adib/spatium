import 'server-only'
import { prisma } from './prisma'
import type { SiteSetting } from '../content/types'

export async function getSiteSetting(): Promise<SiteSetting> {
  let row: any = null
  try {
    row = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
  } catch (err) {
    console.error('Failed to get site setting:', err)
  }

  let socialLinks: Record<string, string> = {
    instagram: 'https://instagram.com/segiatech',
    linkedin: 'https://linkedin.com/company/segiatech',
    github: 'https://github.com/segiatech',
  }

  if (row?.socialLinks) {
    try {
      socialLinks = typeof row.socialLinks === 'string' ? JSON.parse(row.socialLinks) : row.socialLinks
    } catch {}
  }

  return {
    id: row?.id || 1,
    documentId: 'site-config-1',
    siteName: row?.name || 'SegiaTech',
    siteDescription: row?.description || undefined,
    siteUrl: row?.url || 'https://www.segiatech.com',
    whatsapp: row?.whatsapp || undefined,
    email: row?.email || undefined,
    phone: row?.phone || undefined,
    address: row?.address || undefined,
    socialLinks,
  }
}

export { getSiteSetting as getSiteConfig }
