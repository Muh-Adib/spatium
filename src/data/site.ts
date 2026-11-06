// -----------------------------------------------------------------------------
// Public site chrome — route structure and env-driven contact channels only.
//
// Zero-Mock (AGENTS.md §3.3): nothing here is Studio-managed content.
//   • Use cases for the header/footer come from `service_categories` (DB) via
//     getUseCaseMenu(); social profiles from `site_configs.social_links` via
//     getSocialLinks(). Both are passed down from the root layout.
//   • Brand narrative (pipeline, values, sectors copy) lives in
//     src/config/spatium-story.ts.
// -----------------------------------------------------------------------------

function optionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Studio inbox. The default is the address already used in production; set
 * NEXT_PUBLIC_STUDIO_EMAIL to change it (inlined at build time).
 */
export const STUDIO_EMAIL = optionalEnv(process.env.NEXT_PUBLIC_STUDIO_EMAIL) ?? 'hello@spatium.id'

/**
 * Public contact details. Every channel except the email is env-driven and
 * `null` when unset so the UI hides it instead of rendering a placeholder.
 */
export type ContactInfo = {
  email: string
  phone: string | null
  whatsapp: string | null
  location: string | null
  hours: string | null
}

export const CONTACT: ContactInfo = {
  email: STUDIO_EMAIL,
  phone: optionalEnv(process.env.NEXT_PUBLIC_PHONE),
  whatsapp: optionalEnv(process.env.NEXT_PUBLIC_WHATSAPP),
  location: optionalEnv(process.env.NEXT_PUBLIC_STUDIO_ADDRESS),
  hours: optionalEnv(process.env.NEXT_PUBLIC_STUDIO_HOURS),
}

/** Top-level routes (App Router structure, not content). */
export type NavItem = { label: string; to: string }

export const NAV: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Layanan', to: '/services' },
  { label: 'Portofolio', to: '/portfolio' },
  { label: 'Tentang', to: '/about' },
  { label: 'Artikel', to: '/journal' },
  { label: 'Kontak', to: '/contact' },
]
