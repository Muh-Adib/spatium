import { describe, it, expect, vi } from 'vitest'
import { POST } from '../src/app/api/import/wp-single/route'
import { NextRequest } from 'next/server'

// Mock safeFetch
vi.mock('@/lib/security/ssrf', () => ({
  safeFetch: vi.fn(),
}))

// Mock rbac
vi.mock('@/lib/auth/rbac', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } }),
}))

// Mock siteProfile
vi.mock('@/lib/db/siteProfile', () => ({
  getSiteProfile: vi.fn().mockResolvedValue({ url: 'https://www.segiatech.com' }),
}))

// Mock media-storage
vi.mock('@/lib/import/media-storage', () => ({
  downloadAndOptimizeImage: vi.fn().mockResolvedValue('/images/articles/local.webp'),
  localizeAndOptimizeContentImages: vi.fn().mockImplementation((html) => Promise.resolve(html)),
}))

describe('WP Single Import API (/api/import/wp-single)', () => {
  it('extracts complete article content and Yoast SEO focus keyphrase, tags, and metadata', async () => {
    const { safeFetch } = await import('@/lib/security/ssrf')

    const mockWpPost = {
      id: 101,
      slug: 'panduan-seo-nextjs',
      date: '2026-03-01T10:00:00',
      date_gmt: '2026-03-01T03:00:00',
      link: 'https://wordpress.example.com/panduan-seo-nextjs/',
      title: { rendered: 'Panduan SEO Next.js 16 Terbaru' },
      content: { rendered: '<p>Ini adalah isi artikel tentang optimasi SEO di Next.js 16.</p>' },
      excerpt: { rendered: 'Ringkasan panduan SEO Next.js 16.' },
      meta: {
        _yoast_wpseo_focuskw: 'panduan seo nextjs',
        _yoast_wpseo_focuskeywords: JSON.stringify([{ keyword: 'nextjs seo' }, { keyword: 'turbopack' }]),
        _yoast_wpseo_title: 'Panduan Lengkap SEO Next.js 16 — Yoast',
        _yoast_wpseo_metadesc: 'Deskripsi meta dari Yoast SEO.',
        _yoast_wpseo_is_cornerstone: '1',
        _yoast_wpseo_bctitle: 'Panduan SEO',
      },
      yoast_head_json: {
        title: 'Panduan Lengkap SEO Next.js 16 — Yoast',
        description: 'Deskripsi meta dari Yoast SEO.',
        canonical: 'https://wordpress.example.com/panduan-seo-nextjs/',
        robots: { index: 'index', follow: 'follow' },
      },
      _embedded: {
        author: [{ name: 'Adib Segia' }],
        'wp:featuredmedia': [{ source_url: 'https://wordpress.example.com/cover.jpg', alt_text: 'Cover SEO' }],
        'wp:term': [
          [{ id: 1, name: 'SEO & Performance' }],
          [{ id: 10, name: 'Next.js' }, { id: 11, name: 'Web Dev' }],
        ],
      },
    }

    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify([mockWpPost]), { status: 200 }))

    const req = new NextRequest('http://localhost:3000/api/import/wp-single', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://wordpress.example.com/panduan-seo-nextjs/' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)

    const data = json.data
    expect(data.title).toBe('Panduan SEO Next.js 16 Terbaru')
    expect(data.slug).toBe('panduan-seo-nextjs')
    expect(data.category).toBe('SEO & Performance')
    expect(data.tags).toEqual(['Next.js', 'Web Dev'])
    expect(data.author).toBe('Adib Segia')
    expect(data.focusKeyphrase).toBe('panduan seo nextjs')
    expect(data.relatedKeyphrases).toEqual(['nextjs seo', 'turbopack'])
    expect(data.isCornerstone).toBe(true)
    expect(data.breadcrumbTitle).toBe('Panduan SEO')
    expect(data.metaTitle).toBe('Panduan Lengkap SEO Next.js 16 — Yoast')
    expect(data.metaDescription).toBe('Deskripsi meta dari Yoast SEO.')
    expect(data.canonicalUrl).toBe('https://www.segiatech.com/artikel/panduan-seo-nextjs')
    expect(data.robots.index).toBe(true)
    expect(data.robots.follow).toBe(true)
    expect(data.seoData.focusKeyphrase).toBe('panduan seo nextjs')
  })
})
