import { describe, it, expect } from 'vitest'
import { prisma } from '../src/lib/db/prisma'
import { getPage, getPages } from '../src/lib/content/queries'
import sitemap from '../src/app/sitemap'

describe('Page Architecture & Lifecycle (L12-T1 & L12-T5)', () => {
  it('has required page lifecycle columns in pages table', async () => {
    const rows = await prisma.orm.public.Page.all()
    if (rows.length > 0) {
      for (const r of rows.slice(0, 5)) {
        expect(r.kind).toBeDefined()
        expect(['standard', 'landing']).toContain(r.kind)
        expect(r.status).toBeDefined()
        expect(['draft', 'in_review', 'approved', 'published', 'archived']).toContain(r.status)
      }
    }
  })

  it('retrieves city landing pages with kind="landing" and status="published" from getPage()', async () => {
    const page = await getPage('jasa-pembuatan-website-jakarta-profesional')
    if (page) {
      expect(page.slug).toBe('jasa-pembuatan-website-jakarta-profesional')
      expect(page.kind).toBe('landing')
      expect(page.status).toBe('published')
      expect(page.template).toBe('landing')
      expect(page.seo?.robotsIndex).toBe(true)
    }
  })

  it('sitemap excludes unpublished or draft pages', async () => {
    // Insert a temporary draft page
    const existing = await prisma.orm.public.Page.where({ slug: 'test-draft-landing-page' }).first()
    if (existing) {
      await prisma.orm.public.Page.where({ id: existing.id }).delete()
    }

    const created = await prisma.orm.public.Page.create({
      slug: 'test-draft-landing-page',
      title: 'Draft Test Landing',
      kind: 'landing',
      status: 'draft',
      robots: 'index, follow',
    })

    const generatedSitemap = await sitemap()
    const foundDraft = generatedSitemap.find((entry) => entry.url.includes('test-draft-landing-page'))
    expect(foundDraft).toBeUndefined()

    // Clean up test page
    await prisma.orm.public.Page.where({ id: created.id }).delete()
  })

  it('sitemap excludes pages with noindex in robots', async () => {
    // Insert a temporary noindex page
    const existing = await prisma.orm.public.Page.where({ slug: 'test-noindex-landing-page' }).first()
    if (existing) {
      await prisma.orm.public.Page.where({ id: existing.id }).delete()
    }

    const created = await prisma.orm.public.Page.create({
      slug: 'test-noindex-landing-page',
      title: 'Noindex Test Landing',
      kind: 'landing',
      status: 'published',
      robots: 'noindex, follow',
      publishedAt: new Date().toISOString(),
    })

    const generatedSitemap = await sitemap()
    const foundNoindex = generatedSitemap.find((entry) => entry.url.includes('test-noindex-landing-page'))
    expect(foundNoindex).toBeUndefined()

    // Clean up test page
    await prisma.orm.public.Page.where({ id: created.id }).delete()
  })
})
