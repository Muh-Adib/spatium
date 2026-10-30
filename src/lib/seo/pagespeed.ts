import { prisma } from '@/lib/db/prisma'
import { siteConfig } from '@/config/site'
import { Integration, connectedResult, notConnected } from '../integration/result'

export interface PageSpeedReport {
  url: string
  device: 'mobile' | 'desktop'
  performanceScore: number
  seoScore: number
  accessibilityScore: number
  bestPracticesScore: number
  lcpMs: number
  inpMs: number
  cls: number
  fcpMs: number
  capturedAt: string
}

/**
 * Runs PageSpeed Insights audit via official Google API
 * Without PAGESPEED_API_KEY, returns an honest notConnected response and does not write to DB.
 */
export async function runPageSpeedAudit(
  targetUrl: string = siteConfig.url,
  device: 'mobile' | 'desktop' = 'mobile'
): Promise<Integration<PageSpeedReport>> {
  const apiKey = process.env.PAGESPEED_API_KEY

  if (!apiKey) {
    return notConnected<PageSpeedReport>(
      'PAGESPEED_API_KEY belum dikonfigurasi di environment variables.',
      'Dapatkan API key dari Google Cloud Console (PageSpeed Insights API) dan tambahkan PAGESPEED_API_KEY ke environment.'
    )
  }

  try {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      targetUrl
    )}&strategy=${device}&key=${apiKey}`

    const res = await fetch(endpoint)
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return notConnected<PageSpeedReport>(
        `Google PageSpeed API mengembalikan status ${res.status}: ${errText.slice(0, 150)}`,
        'Pastikan PAGESPEED_API_KEY valid dan URL target dapat diakses publik.'
      )
    }

    const data = await res.json()
    const cats = data.lighthouseResult?.categories || {}
    const performanceScore = Math.round((cats.performance?.score || 0) * 100)
    const seoScore = Math.round((cats.seo?.score || 0) * 100)
    const accessibilityScore = Math.round((cats.accessibility?.score || 0) * 100)
    const bestPracticesScore = Math.round((cats['best-practices']?.score || 0) * 100)

    const audits = data.lighthouseResult?.audits || {}
    const lcpMs = Math.round(audits['largest-contentful-paint']?.numericValue || 0)
    const fcpMs = Math.round(audits['first-contentful-paint']?.numericValue || 0)
    const cls = Number((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3))
    const inpMs = Math.round(audits['interactive']?.numericValue || 0)
    const rawJson = JSON.stringify(data.loadingExperience || {})

    // Insert real snapshot into PostgreSQL via Prisma 8
    await prisma.orm.public.PagespeedSnapshot.create({
      url: targetUrl,
      device,
      performanceScore,
      seoScore,
      accessibilityScore,
      bestPracticesScore,
      lcpMs,
      fidOrInpMs: inpMs,
      cls,
      fcpMs,
      rawMetrics: rawJson,
    })

    const report: PageSpeedReport = {
      url: targetUrl,
      device,
      performanceScore,
      seoScore,
      accessibilityScore,
      bestPracticesScore,
      lcpMs,
      inpMs,
      cls,
      fcpMs,
      capturedAt: new Date().toISOString(),
    }

    return connectedResult(report)
  } catch (err: any) {
    return notConnected<PageSpeedReport>(
      `Gagal menjalankan audit PageSpeed: ${err.message || 'Network error'}`,
      'Periksa koneksi internet server dan status layanan Google PageSpeed API.'
    )
  }
}

/**
 * Get recent PageSpeed trends from PostgreSQL via Prisma 8
 */
export async function getPageSpeedHistory(limit = 10): Promise<PageSpeedReport[]> {
  const rows = await prisma.orm.public.PagespeedSnapshot
    .orderBy((s: any) => s.capturedAt.desc()).limit(limit).all()

  return rows.map((r: any) => ({
    url: r.url,
    device: r.device as any,
    performanceScore: r.performanceScore || 0,
    seoScore: r.seoScore || 0,
    accessibilityScore: r.accessibilityScore || 0,
    bestPracticesScore: r.bestPracticesScore || 0,
    lcpMs: r.lcpMs || 0,
    inpMs: r.fidOrInpMs || 0,
    cls: r.cls || 0,
    fcpMs: r.fcpMs || 0,
    capturedAt: r.capturedAt || '',
  }))
}

/**
 * Record Real User Monitoring (RUM) vital metric
 */
export async function recordRumVital(data: {
  path: string
  metricName: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
  value: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  userAgent?: string
}) {
  await prisma.orm.public.RumVital.create({
    path: data.path,
    metricName: data.metricName,
    value: data.value,
    rating: data.rating || 'good',
    userAgent: data.userAgent,
  })
}

/**
 * Get aggregated RUM metrics per page
 */
export async function getRumAggregates() {
  const vitals = await prisma.orm.public.RumVital.all()
  const groups: Record<string, { total: number; count: number }> = {}
  for (const v of vitals) {
    if (!groups[v.metricName]) {
      groups[v.metricName] = { total: 0, count: 0 }
    }
    groups[v.metricName].total += v.value
    groups[v.metricName].count += 1
  }
  return Object.entries(groups).map(([metricName, data]) => ({
    metricName,
    avgValue: Number((data.total / data.count).toFixed(2)),
    count: data.count,
  }))
}
