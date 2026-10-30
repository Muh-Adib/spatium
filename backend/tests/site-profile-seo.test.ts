import { describe, it, expect } from 'vitest'
import { createSchemaGenerators } from '../src/lib/schema'
import { generatePageMetadata } from '../src/lib/seo/metadata'
import type { SeoSite } from '../src/lib/seo/site'
const site = (name: string, domain: string): SeoSite => ({ name, url: `https://${domain}`, description: `${name} description`, tagline: `${name} tagline`, email: `info@${domain}`, phone: '123', address: `${name} address`, social: {}, defaultOgImage: '/og.png', locale: 'id_ID' })
describe('Reusable SEO site identities', () => {
  it('does not leak another site identity into metadata or schemas', () => {
    for (const profile of [site('Alpha', 'alpha.example'), site('Beta', 'beta.example')]) {
      const schemas = createSchemaGenerators(profile)
      const json = JSON.stringify({ organization: schemas.generateOrganizationSchema(), website: schemas.generateWebSiteSchema(), article: schemas.generateArticleSchema({ title: 'Article', slug: 'post', excerpt: 'Text' }) })
      expect(json).toContain(profile.url)
      expect(json).toContain(profile.name)
      expect(json).not.toContain('SegiaTech')
      const metadata = generatePageMetadata({ title: '%title% %sep% %sitename%', slug: 'post', site: profile })
      expect(JSON.stringify(metadata)).toContain(profile.url)
      expect(JSON.stringify(metadata)).not.toContain('SegiaTech')
    }
  })
  it('renders stored robots restrictions and Twitter card choice', () => {
    const metadata = generatePageMetadata({ title: 'Title', site: site('Alpha', 'alpha.example'), seo: { robots: { index: false, follow: false, noarchive: true, nosnippet: true, maxSnippet: 20 }, twitter: { card: 'summary' } } })
    expect(metadata.robots).toMatchObject({ index: false, follow: false, noarchive: true, nosnippet: true, googleBot: { 'max-snippet': 20 } })
    expect(metadata.twitter).toMatchObject({ card: 'summary' })
  })
})
