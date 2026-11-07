export interface SeoSite {
  name: string
  url: string
  description: string
  tagline: string
  /** Null/empty when unconfigured — JSON-LD omits the field instead of emitting a placeholder. */
  phone: string | null
  /** Null/empty when unconfigured — omitted from JSON-LD. */
  email: string | null
  social: Record<string, string>
  address?: string | null
  defaultOgImage: string
  locale: string
}
