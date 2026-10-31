import { prisma } from '@/lib/db/prisma'
import { SiteAuditIssue, AuditSeverity, AuditCategory } from './schema'
import { SiteAuditSummary } from './site-audit'
import { siteConfig } from '@/config/site'

export interface CrawledPageResult {
  url: string
  statusCode: number
  contentType?: string
  responseTimeMs: number
  title?: string
  h1?: string
  metaDescription?: string
  canonicalUrl?: string
  robotsMeta?: string
  hreflangTags: Array<{ lang: string; href: string }>
  imagesMissingAlt: string[]
  internalLinks: string[]
  externalLinks: string[]
  jsonLdValid: boolean
}

/**
 * Executes Layer 2: Live Crawler (Section 15.3)
 */
export async function runLiveCrawler(options: {
  baseUrl?: string
  maxPages?: number
  concurrency?: number
} = {}): Promise<{
  summary: SiteAuditSummary
  issues: SiteAuditIssue[]
  crawledPages: number
}> {
  const auditId = `audit_crawl_${Date.now()}`
  const targetBaseUrl = (options.baseUrl || siteConfig.url || 'http://localhost:3000').replace(/\/$/, '')
  const maxPages = options.maxPages || 40

  const visitedUrls = new Set<string>()
  const queue: string[] = [targetBaseUrl]
  const crawledResults: CrawledPageResult[] = []

  const issues: Array<{
    severity: AuditSeverity
    category: AuditCategory
    urlOrPath?: string
    title: string
    description: string
    recommendation: string
  }> = []

  const userAgent = 'UNIMASI-SEO-Crawler/2.0 (+https://unimasi.com/bot)'

  while (queue.length > 0 && visitedUrls.size < maxPages) {
    const currentUrl = queue.shift()!
    if (visitedUrls.has(currentUrl)) continue
    visitedUrls.add(currentUrl)

    const t0 = Date.now()
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'manual', // Do not automatically follow redirects so we can detect 301/302
      })
      const responseTimeMs = Date.now() - t0
      const statusCode = res.status
      const locHeader = res.headers.get('location')

      // Check redirects
      if (statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308) {
        if (!locHeader) {
          issues.push({
            severity: 'critical',
            category: 'redirects',
            urlOrPath: currentUrl,
            title: `Pengalihan ${statusCode} Tanpa Header Location`,
            description: `Server merespons ${statusCode} pada ${currentUrl} tanpa menyediakan URL tujuan.`,
            recommendation: 'Periksa konfigurasi redirect web server.',
          })
        } else {
          // Check self loop
          if (locHeader === currentUrl) {
            issues.push({
              severity: 'critical',
              category: 'redirects',
              urlOrPath: currentUrl,
              title: 'Redirect Loop Pada Halaman Live',
              description: `Halaman ${currentUrl} mengalihkan ke dirinya sendiri (Loop).`,
              recommendation: 'Hapus aturan redirect loop.',
            })
          } else if (locHeader.startsWith(targetBaseUrl) || locHeader.startsWith('/')) {
            const nextUrl = locHeader.startsWith('http') ? locHeader : `${targetBaseUrl}${locHeader}`
            if (!visitedUrls.has(nextUrl) && queue.length < maxPages) {
              queue.push(nextUrl)
            }
          }
        }
        continue
      }

      // Check HTTP 4xx / 5xx
      if (statusCode === 404) {
        issues.push({
          severity: 'critical',
          category: 'links',
          urlOrPath: currentUrl,
          title: 'Halaman 404 Not Found Terdeteksi',
          description: `URL ${currentUrl} merespons 404 Not Found saat dikunjungi crawler.`,
          recommendation: 'Buat aturan 301 redirect atau perbaiki link yang mengarah ke URL ini.',
        })
        continue
      }

      if (statusCode >= 500) {
        issues.push({
          severity: 'critical',
          category: 'performance',
          urlOrPath: currentUrl,
          title: `Server Error HTTP ${statusCode}`,
          description: `URL ${currentUrl} mengembalikan status kegagalan server ${statusCode}.`,
          recommendation: 'Periksa log server Next.js untuk menganalisis unhandled exception.',
        })
        continue
      }

      const html = await res.text()

      // Parse HTML
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
      const pageTitle = titleMatch ? titleMatch[1].trim() : ''

      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
      const pageH1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : ''

      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
      const pageMetaDesc = metaDescMatch ? metaDescMatch[1].trim() : ''

      const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)
      const robotsMeta = robotsMatch ? robotsMatch[1].trim().toLowerCase() : ''

      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
      const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : ''

      // 1. Accidental Noindex
      if (robotsMeta.includes('noindex') && !currentUrl.includes('/admin') && !currentUrl.includes('/api')) {
        issues.push({
          severity: 'critical',
          category: 'meta',
          urlOrPath: currentUrl,
          title: 'Tag Noindex Terpasang di Halaman Publik',
          description: `Halaman ${currentUrl} memiliki meta tag "noindex". Halaman ini tidak akan diindeks oleh Google.`,
          recommendation: 'Hapus directive noindex jika halaman dimaksudkan untuk publik.',
        })
      }

      // 2. Missing Title or H1
      if (!pageTitle) {
        issues.push({
          severity: 'critical',
          category: 'meta',
          urlOrPath: currentUrl,
          title: 'Tag <title> Tidak Ditemukan',
          description: `Halaman ${currentUrl} tidak memiliki elemen <title>.`,
          recommendation: 'Tambahkan judul metadata melalui generateMetadata() Next.js.',
        })
      }

      if (!pageH1 && !currentUrl.includes('/login')) {
        issues.push({
          severity: 'warning',
          category: 'headings',
          urlOrPath: currentUrl,
          title: 'Elemen <h1> Hilang',
          description: `Halaman ${currentUrl} tidak memiliki tag <h1> utama.`,
          recommendation: 'Pastikan ada tepat satu tag <h1> di setiap halaman.',
        })
      }

      // 3. Images Missing Alt
      const imgTags = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi))
      const imagesMissingAlt: string[] = []
      for (const img of imgTags) {
        const full = img[0]
        const alt = full.match(/alt=["']([^"']*)["']/i)
        if (!alt || !alt[1].trim()) {
          imagesMissingAlt.push(img[1])
        }
      }

      if (imagesMissingAlt.length > 0) {
        issues.push({
          severity: 'warning',
          category: 'images',
          urlOrPath: currentUrl,
          title: `${imagesMissingAlt.length} Gambar Live Tanpa Alt Text`,
          description: `Halaman ${currentUrl} memuat gambar tanpa alt: ${imagesMissingAlt.slice(0, 3).join(', ')}`,
          recommendation: 'Lengkapi alt text pada file media terkait di CMS.',
        })
      }

      // 4. Response Time Slow (> 1200ms)
      if (responseTimeMs > 1200) {
        issues.push({
          severity: 'warning',
          category: 'performance',
          urlOrPath: currentUrl,
          title: `Waktu Respons Lambat (${responseTimeMs}ms)`,
          description: `Server membutuhkan waktu ${responseTimeMs}ms untuk menyajikan halaman ${currentUrl}.`,
          recommendation: 'Optimalkan kueri database SQLite dan terapkan Next.js SSG / ISR caching.',
        })
      }

      // 5. Discover Internal Links for crawling
      const hrefMatches = Array.from(html.matchAll(/href=["']([^"'#\s]+)["']/gi))
      for (const m of hrefMatches) {
        const href = m[1]
        if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/api') && !href.startsWith('/admin')) {
          const nextUrl = `${targetBaseUrl}${href}`
          if (!visitedUrls.has(nextUrl) && !queue.includes(nextUrl) && queue.length < maxPages) {
            queue.push(nextUrl)
          }
        }
      }

      crawledResults.push({
        url: currentUrl,
        statusCode,
        responseTimeMs,
        title: pageTitle,
        h1: pageH1,
        metaDescription: pageMetaDesc,
        canonicalUrl,
        robotsMeta,
        hreflangTags: [],
        imagesMissingAlt,
        internalLinks: [],
        externalLinks: [],
        jsonLdValid: html.includes('application/ld+json'),
      })
    } catch (err: any) {
      issues.push({
        severity: 'critical',
        category: 'performance',
        urlOrPath: currentUrl,
        title: 'Koneksi Crawler Gagal',
        description: `Crawler gagal menghubungi ${currentUrl}: ${err.message}`,
        recommendation: 'Pastikan web server aktif dan URL dapat diakses.',
      })
    }
  }

  // Summary calculation
  const criticalCount = issues.filter((i) => i.severity === 'critical').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const infoCount = issues.filter((i) => i.severity === 'info').length
  let healthScore = 100 - criticalCount * 5 - warningCount * 2
  healthScore = Math.max(10, Math.min(100, healthScore))

  const summary: SiteAuditSummary = {
    auditId,
    type: 'live_crawl',
    status: 'completed',
    totalIssues: issues.length,
    criticalCount,
    warningCount,
    infoCount,
    seoHealthScore: healthScore,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  }

  // Save audit
  await prisma.orm.public.SiteAudit.create({
    id: auditId,
    type: 'live_crawl',
    status: 'completed',
    summary: JSON.stringify(summary),
    finishedAt: summary.finishedAt,
  })

  for (const iss of issues) {
    await prisma.orm.public.SiteAuditIssue.create({
      auditId,
      severity: iss.severity,
      category: iss.category,
      urlOrPath: iss.urlOrPath,
      title: iss.title,
      description: iss.description,
      recommendation: iss.recommendation,
    })
  }

  const insertedIssues = await prisma.orm.public.SiteAuditIssue.where({ auditId }).all()

  return {
    summary,
    issues: insertedIssues.map((r: any) => ({
      ...r,
      resolved: Boolean(r.resolved),
    })),
    crawledPages: visitedUrls.size,
  }
}
