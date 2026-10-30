import { describe, it, expect } from 'vitest'
import { extractWordPressSeo } from '../src/lib/import/seo-extractor'

describe('WordPress SEO Extractor (Yoast & Rank Math Parity)', () => {
  it('extracts Yoast SEO focus keyphrase, related keyphrases, and metadata from standard REST response', () => {
    const rawPost = {
      slug: 'arsitektur-next-js-16',
      link: 'https://example.com/arsitektur-next-js-16/',
      meta: {
        _yoast_wpseo_focuskw: 'arsitektur next js 16',
        _yoast_wpseo_focuskeywords: JSON.stringify([{ keyword: 'turbopack nextjs' }, { keyword: 'fullstack react' }]),
        _yoast_wpseo_title: 'Panduan Arsitektur Next.js 16 Lengkap',
        _yoast_wpseo_metadesc: 'Pelajari arsitektur Next.js 16 App Router dengan performa tinggi.',
        _yoast_wpseo_is_cornerstone: '1',
        _yoast_wpseo_bctitle: 'Arsitektur Next.js 16',
      },
      yoast_head_json: {
        title: 'Panduan Arsitektur Next.js 16 Lengkap',
        description: 'Pelajari arsitektur Next.js 16 App Router dengan performa tinggi.',
        canonical: 'https://example.com/arsitektur-next-js-16/',
        robots: { index: 'index', follow: 'follow' },
        og_image: [{ url: 'https://example.com/wp-content/uploads/cover.jpg' }],
      },
    }

    const seo = extractWordPressSeo(rawPost, 'Arsitektur Next.js 16', 'Excerpt artikel', null, 'https://www.segiatech.com')

    expect(seo.focusKeyphrase).toBe('arsitektur next js 16')
    expect(seo.relatedKeyphrases).toEqual(['turbopack nextjs', 'fullstack react'])
    expect(seo.isCornerstone).toBe(true)
    expect(seo.breadcrumbTitle).toBe('Arsitektur Next.js 16')
    expect(seo.metaTitle).toBe('Panduan Arsitektur Next.js 16 Lengkap')
    expect(seo.metaDescription).toBe('Pelajari arsitektur Next.js 16 App Router dengan performa tinggi.')
    expect(seo.canonicalUrl).toBe('https://www.segiatech.com/artikel/arsitektur-next-js-16')
    expect(seo.robots.index).toBe(true)
    expect(seo.robots.follow).toBe(true)

    const parsedData = JSON.parse(seo.seoData)
    expect(parsedData.focusKeyphrase).toBe('arsitektur next js 16')
    expect(parsedData.relatedKeyphrases).toEqual(['turbopack nextjs', 'fullstack react'])
    expect(parsedData.isCornerstone).toBe(true)
  })

  it('unwraps array values from database postmeta exports (webshift_source)', () => {
    const rawPost = {
      slug: 'optimasi-seo-wordpress',
      link: 'https://example.com/optimasi-seo-wordpress/',
      webshift_source: {
        postmeta: {
          _yoast_wpseo_focuskw: ['optimasi seo wordpress'],
          _yoast_wpseo_is_cornerstone: ['1'],
          _yoast_wpseo_bctitle: ['Optimasi SEO'],
          '_yoast_wpseo_meta-robots-noindex': ['1'],
        },
      },
      yoast_head_json: {
        title: 'Cara Optimasi SEO WordPress',
        description: 'Teknik optimasi SEO on-page.',
      },
    }

    const seo = extractWordPressSeo(rawPost, 'Optimasi SEO WordPress', 'Excerpt', null, 'https://www.segiatech.com')

    expect(seo.focusKeyphrase).toBe('optimasi seo wordpress')
    expect(seo.isCornerstone).toBe(true)
    expect(seo.breadcrumbTitle).toBe('Optimasi SEO')
    expect(seo.robots.index).toBe(false)
  })

  it('supports Rank Math format with comma-separated focus keywords', () => {
    const rawPost = {
      slug: 'jasa-website-jakarta',
      link: 'https://example.com/jasa-website-jakarta/',
      meta: {
        rank_math_focus_keyword: 'jasa pembuatan website, web developer jakarta, pembuatan web profesional',
        rank_math_title: 'Jasa Pembuatan Website Jakarta Terbaik',
        rank_math_description: 'Layanan web dev profesional di Jakarta.',
        rank_math_pillar_content: '1',
      },
    }

    const seo = extractWordPressSeo(rawPost, 'Jasa Website Jakarta', 'Excerpt', null, 'https://www.segiatech.com')

    expect(seo.focusKeyphrase).toBe('jasa pembuatan website')
    expect(seo.relatedKeyphrases).toEqual(['web developer jakarta', 'pembuatan web profesional'])
    expect(seo.isCornerstone).toBe(true)
    expect(seo.metaTitle).toBe('Jasa Pembuatan Website Jakarta Terbaik')
  })

  it('falls back to schema.org keywords when Yoast meta is hidden/protected', () => {
    const rawPost = {
      slug: 'belajar-react-19',
      link: 'https://example.com/belajar-react-19/',
      yoast_head_json: {
        title: 'Belajar React 19 Terbaru',
        description: 'Tutorial React 19 lengkap.',
        schema: {
          '@graph': [
            {
              '@type': 'Article',
              keywords: ['react 19', 'server components', 'actions'],
            },
          ],
        },
      },
    }

    const seo = extractWordPressSeo(rawPost, 'Belajar React 19', 'Excerpt', null, 'https://www.segiatech.com')

    expect(seo.focusKeyphrase).toBe('react 19')
    expect(seo.relatedKeyphrases).toEqual(['server components', 'actions'])
  })

  it('falls back to tags when no other keyword source is available', () => {
    const rawPost = {
      slug: 'tips-coding',
      link: 'https://example.com/tips-coding/',
    }

    const seo = extractWordPressSeo(rawPost, 'Tips Coding', 'Excerpt', null, 'https://www.segiatech.com', {
      fallbackTags: ['Tips Pemrograman', 'Web Development'],
    })

    expect(seo.focusKeyphrase).toBe('Tips Pemrograman')
  })
})
