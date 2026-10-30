export interface SeoSite {
  name: string
  url: string
  description: string
  tagline: string
  phone: string
  email: string
  social: Record<string, string>
  address?: string
  defaultOgImage: string
  locale: string
}
