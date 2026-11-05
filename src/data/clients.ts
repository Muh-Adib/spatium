export interface PartnerLogo {
  id: string | number
  name: string
  logo?: string
  logoUrl?: string
  src?: string
  alt?: string
  altText?: string
}

/**
 * Static client list deprecated in favor of PostgreSQL database (ClientLogo model).
 * Enforces Zero-Mock / Zero Fictional Fallbacks policy.
 */
export const PARTNER_LOGOS: PartnerLogo[] = []
