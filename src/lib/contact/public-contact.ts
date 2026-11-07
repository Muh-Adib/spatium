// -----------------------------------------------------------------------------
// Public contact profile — pure helpers (no DB, no React, safe on the client).
//
// Source of truth: Studio → Pengaturan (`site_configs`, row id 1). The server
// getter lives in `src/lib/content/contact.ts`; this module only normalises
// a stored row into the shape the public UI renders. Every channel is `null`
// when empty so the UI hides it (AGENTS.md §3.3) — there are no defaults.
// -----------------------------------------------------------------------------

export type SocialLink = { label: string; href: string }

export interface PublicContact {
  email: string | null
  mailtoHref: string | null
  /** Phone as typed in Studio (display form). */
  phone: string | null
  telHref: string | null
  /** WhatsApp number as E.164 digits without "+", e.g. "6281234567890". */
  whatsapp: string | null
  whatsappMessage: string | null
  /** wa.me link with the default message; null when no number is set. */
  whatsappHref: string | null
  address: string | null
  hours: string | null
  socials: SocialLink[]
}

export const EMPTY_PUBLIC_CONTACT: PublicContact = {
  email: null,
  mailtoHref: null,
  phone: null,
  telHref: null,
  whatsapp: null,
  whatsappMessage: null,
  whatsappHref: null,
  address: null,
  hours: null,
  socials: [],
}

/** Networks the public site knows how to label (also the Studio field list). */
export const SOCIAL_LABELS: Readonly<Record<string, string>> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  x: 'X',
  twitter: 'X',
  vimeo: 'Vimeo',
  behance: 'Behance',
}

const text = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

/**
 * Normalises a WhatsApp number to E.164 digits (no "+"): strips spaces,
 * dashes, dots and brackets; a leading "00" or "+" is the international
 * prefix; a leading single "0" is an Indonesian national number (→ "62").
 * Returns null when the result is not 8–15 digits starting with 1–9.
 */
export function normaliseWhatsappNumber(raw: string | null | undefined): string | null {
  const input = (raw ?? '').trim()
  if (!input) return null
  if (!/^\+?[\d\s().-]+$/.test(input)) return null
  let digits = input.replace(/\D+/g, '')
  const international = input.startsWith('+')
  if (!international && digits.startsWith('00')) digits = digits.slice(2)
  else if (!international && digits.startsWith('0')) digits = `62${digits.slice(1)}`
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null
}

/** wa.me deep link; null when the number is missing or invalid. */
export function buildWhatsappHref(number: string | null | undefined, message?: string | null): string | null {
  const digits = normaliseWhatsappNumber(number)
  if (!digits) return null
  const body = text(message)
  return body ? `https://wa.me/${digits}?text=${encodeURIComponent(body)}` : `https://wa.me/${digits}`
}

/** tel: link keeping only digits and a leading "+"; null when empty. */
export function buildTelHref(number: string | null | undefined): string | null {
  const value = text(number)
  if (!value) return null
  const cleaned = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return /\d{3,}/.test(cleaned) ? `tel:${cleaned}` : null
}

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/

/** mailto: link with optional subject/body; null when the address is empty or malformed. */
export function buildMailtoHref(email: string | null | undefined, opts: { subject?: string; body?: string } = {}): string | null {
  const address = text(email)
  if (!address || !EMAIL_RE.test(address)) return null
  const params = [
    opts.subject ? `subject=${encodeURIComponent(opts.subject)}` : '',
    opts.body ? `body=${encodeURIComponent(opts.body)}` : '',
  ].filter(Boolean)
  return `mailto:${address}${params.length ? `?${params.join('&')}` : ''}`
}

/**
 * Social profiles from the `social_links` JSON column
 * (`{ "<network>": "<https url>" }`). Only absolute https URLs are kept.
 */
export function parseSocialLinks(raw: string | null | undefined): SocialLink[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.warn('[contact] site_configs.social_links is not valid JSON:', err)
    return []
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.warn('[contact] site_configs.social_links is not an object — ignored.')
    return []
  }
  return Object.entries(parsed).flatMap(([network, value]) => {
    const href = text(value)
    if (!href) return []
    let url: URL
    try {
      url = new URL(href)
    } catch (err) {
      console.warn(`[contact] social link "${network}" is not a URL — skipped.`, err)
      return []
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      console.warn(`[contact] social link "${network}" is not a plain https URL — skipped.`)
      return []
    }
    const key = network.trim().toLowerCase()
    return [{ label: SOCIAL_LABELS[key] ?? network.trim(), href: url.href }]
  })
}

/** The `site_configs` columns that make up the public contact profile. */
export interface ContactRow {
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  whatsappMessage?: string | null
  address?: string | null
  openingHours?: string | null
  socialLinks?: string | null
}

/** Builds the public profile from a stored row; missing or invalid values become null. */
export function toPublicContact(row: ContactRow | null | undefined): PublicContact {
  if (!row) return EMPTY_PUBLIC_CONTACT
  const mailtoHref = buildMailtoHref(row.email)
  const whatsapp = normaliseWhatsappNumber(row.whatsapp)
  const whatsappMessage = text(row.whatsappMessage)
  const phone = text(row.phone)
  const telHref = buildTelHref(phone)
  return {
    email: mailtoHref ? text(row.email) : null,
    mailtoHref,
    phone: telHref ? phone : null,
    telHref,
    whatsapp,
    whatsappMessage,
    whatsappHref: buildWhatsappHref(whatsapp, whatsappMessage),
    address: text(row.address),
    hours: text(row.openingHours),
    socials: parseSocialLinks(row.socialLinks),
  }
}
