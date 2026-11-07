// -----------------------------------------------------------------------------
// Public site chrome — route structure only.
//
// Zero-Mock (AGENTS.md §3.3): nothing here is Studio-managed content.
//   • Use cases for the header/footer come from `service_categories` (DB) via
//     getUseCaseMenu(); social profiles from `site_configs.social_links` via
//     getSocialLinks(). Both are passed down from the root layout.
//   • Public contact channels come from `site_configs` via getPublicContact()
//     (src/lib/content/contact.ts).
//   • Brand narrative (pipeline, values, sectors copy) lives in
//     src/config/spatium-story.ts.
// -----------------------------------------------------------------------------

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
