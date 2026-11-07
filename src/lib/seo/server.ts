import 'server-only'
import { cache } from 'react'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { siteConfig } from '@/config/site'
import { generatePageMetadata, type MetadataInput } from './metadata'
import { createSchemaGenerators } from '@/lib/schema'
import type { SeoSite } from './site'

export const getSeoSite = cache(async (): Promise<SeoSite> => {
  const profile = await getSiteProfile()
  return {
    name: profile.name, url: profile.url, tagline: profile.tagline || '', description: profile.description || '',
    phone: profile.phone || null, email: profile.email || null, social: profile.socialLinks,
    address: profile.address || undefined, defaultOgImage: siteConfig.defaultOgImage,
    locale: profile.defaultLocale === 'en' ? 'en_US' : 'id_ID',
  }
})
export async function getPageMetadata(input: MetadataInput) {
  return generatePageMetadata({ ...input, site: await getSeoSite() })
}

export const getSchemaGenerators = cache(async () => createSchemaGenerators(await getSeoSite()))
