import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/db/prisma'
import { EMPTY_PUBLIC_CONTACT, toPublicContact, type PublicContact } from '@/lib/contact/public-contact'

/**
 * Public contact profile (email, phone, WhatsApp, address, hours, socials)
 * from Studio → Pengaturan (`site_configs` row 1). The only source for every
 * contact link on the public site. Cached per request; on a database error
 * the error is logged and an empty profile is returned so the UI hides the
 * channels instead of showing invented ones (AGENTS.md §3.3).
 */
export const getPublicContact = cache(async (): Promise<PublicContact> => {
  if (!process.env.DATABASE_URL) {
    console.error('[content] DATABASE_URL is not set — public contact is empty.')
    return EMPTY_PUBLIC_CONTACT
  }
  try {
    const row = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
    return toPublicContact(row ?? null)
  } catch (err) {
    console.error('[content] getPublicContact failed:', err)
    return EMPTY_PUBLIC_CONTACT
  }
})
