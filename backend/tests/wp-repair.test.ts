import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../src/app/api/import/repair/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

vi.mock('@/lib/auth/rbac', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } }),
}))

vi.mock('@/lib/db/siteProfile', () => ({
  getSiteProfile: vi.fn().mockResolvedValue({ url: 'https://www.segiatech.com' }),
}))

describe('WP Metadata Repair & Resume API (/api/import/repair)', () => {
  beforeEach(async () => {
    // Clean up test articles & snapshots
    const existingArt = await prisma.orm.public.Article.where({ slug: 'test-repair-article' }).first()
    if (existingArt) {
      await prisma.orm.public.Article.where({ id: existingArt.id }).delete()
    }
    await prisma.orm.public.WordPressSnapshot.where({ wpId: 99999 }).deleteAll()
  })

  it('detects missing Yoast focus keyphrase and repairs it from local snapshot archive', async () => {
    // 1. Create an article in DB that is MISSING focusKeyphrase and seoData
    const art = await prisma.orm.public.Article.create({
      documentId: 'art-test-repair-article',
      slug: 'test-repair-article',
      title: 'Artikel Perbaikan Test',
      content: '<p>Konten artikel</p>',
      excerpt: 'Ringkasan artikel',
      status: 'published',
      publishedAt: new Date().toISOString(),
      metaTitle: null,
      focusKeyphrase: null,
      seoData: null,
    })

    // 2. Create corresponding snapshot in DB with Yoast SEO payload
    const rawWpPayload = {
      id: 99999,
      slug: 'test-repair-article',
      title: { rendered: 'Artikel Perbaikan Test' },
      excerpt: { rendered: 'Ringkasan artikel' },
      meta: {
        _yoast_wpseo_focuskw: 'kata kunci perbaikan',
        _yoast_wpseo_title: 'Judul SEO Yoast Diperbaiki',
        _yoast_wpseo_metadesc: 'Deskripsi SEO Yoast Diperbaiki',
        _yoast_wpseo_is_cornerstone: '1',
      },
      yoast_head_json: {
        title: 'Judul SEO Yoast Diperbaiki',
        description: 'Deskripsi SEO Yoast Diperbaiki',
      },
    }

    await prisma.orm.public.WordPressSnapshot.create({
      sourceUrl: 'https://www.segiatech.com',
      entityType: 'posts',
      wpId: 99999,
      sourceHash: 'dummyhash',
      payload: JSON.stringify(rawWpPayload),
      targetId: art.id,
      status: 'imported',
    })

    // 3. Call repair endpoint
    const req = new NextRequest('http://localhost:3000/api/import/repair', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.stats.repaired).toBeGreaterThanOrEqual(1)

    // 4. Verify article was updated with focusKeyphrase & Yoast metadata in PostgreSQL
    const updatedArt = await prisma.orm.public.Article.where({ id: art.id }).first()
    expect(updatedArt?.focusKeyphrase).toBe('kata kunci perbaikan')
    expect(updatedArt?.metaTitle).toBe('Judul SEO Yoast Diperbaiki')
    expect(updatedArt?.isCornerstone).toBe(true)
    expect(updatedArt?.seoData).toBeTruthy()
    const seoDataParsed = JSON.parse(updatedArt!.seoData!)
    expect(seoDataParsed.focusKeyphrase).toBe('kata kunci perbaikan')
  }, 30000)
})
