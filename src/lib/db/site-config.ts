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
    instagram: 'https://instagram.com/unimasi',
    linkedin: 'https://linkedin.com/company/unimasi',
    github: 'https://github.com/unimasi',
  }

  if (row?.socialLinks) {
    try {
      socialLinks = typeof row.socialLinks === 'string' ? JSON.parse(row.socialLinks) : row.socialLinks
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return {
    id: row?.id || 1,
    documentId: 'site-config-1',
    siteName: row?.name || 'UNIMASI',
    siteDescription: row?.description || undefined,
    siteUrl: row?.url || 'https://www.unimasi.com',
    whatsapp: row?.whatsapp || undefined,
    email: row?.email || undefined,
    phone: row?.phone || undefined,
    address: row?.address || undefined,
    socialLinks,
  }
}

export { getSiteSetting as getSiteConfig }
