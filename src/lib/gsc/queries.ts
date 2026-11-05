import { prisma } from '@/lib/db/prisma'
import { Integration, connectedResult, notConnected } from '../integration/result'
import { querySearchAnalytics, GscSearchAnalyticsRow } from './client'

export interface GscOverview {
  totalClicks: number
  totalImpressions: number
  averageCtr: number
  averagePosition: number
  clicksChange: number
  impressionsChange: number
  timeSeries: Array<{
    date: string
    clicks: number
    impressions: number
    position: number
  }>
}

export interface GscQueryItem {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscPageItem {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscDeviceItem {
  device: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscCountryItem {
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/**
 * Fetch Search Console performance metrics with SQLite caching and real Google API.
 * Zero-mock compliant: returns honest disconnected state when credentials are not configured or API fails.
 */
export async function getGscOverview(siteUrl = 'https://www.unimasi.com'): Promise<Integration<GscOverview>> {
  const serviceEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY

  if (!serviceEmail || !privateKey) {
    return notConnected<GscOverview>(
      'Kredensial Google Search Console (GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY) belum dikonfigurasi.',
      'Konfigurasikan Service Account Google Search Console pada file .env untuk mengaktifkan sinkronisasi performa pencarian.'
    )
  }

  const cacheKey = `gsc_overview_${siteUrl}`

  try {
    const cached = await prisma.orm.public.GscCache.where({ id: cacheKey }).first()

    if (cached && new Date(cached.expiresAt) > new Date()) {
      try {
        const data = JSON.parse(cached.payload)
        return connectedResult<GscOverview>(data)
      } catch (err) { console.warn("[observable error]:", err) }
    }
  } catch (err) { console.warn("[observable error]:", err) }


  try {
    // 28 days window
    const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const result = await querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 100,
    })

    const rows = result.rows || []
    let totalClicks = 0
    let totalImpressions = 0
    let weightedPositionSum = 0

    const timeSeries = rows.map((r: GscSearchAnalyticsRow) => {
      totalClicks += r.clicks || 0
      totalImpressions += r.impressions || 0
      weightedPositionSum += (r.position || 0) * (r.impressions || 1)
      return {
        date: r.keys[0],
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        position: Number((r.position || 0).toFixed(1)),
      }
    })

    const averageCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0
    const averagePosition = totalImpressions > 0 ? Number((weightedPositionSum / totalImpressions).toFixed(1)) : 0

    const overview: GscOverview = {
      totalClicks,
      totalImpressions,
      averageCtr,
      averagePosition,
      clicksChange: 0,
      impressionsChange: 0,
      timeSeries,
    }

    // Cache for 6 hours
    try {
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      const existing = await prisma.orm.public.GscCache.where({ id: cacheKey }).first()
      if (existing) {
        await prisma.orm.public.GscCache.where({ id: cacheKey }).update({
          payload: JSON.stringify(overview),
          expiresAt,
        })
      } else {
        await prisma.orm.public.GscCache.create({
          id: cacheKey,
          siteUrl,
          dataType: 'overview',
          dateRange: `${startDate}_${endDate}`,
          payload: JSON.stringify(overview),
          expiresAt,
        })
      }
    } catch (err) { console.warn("[observable error]:", err) }

    return connectedResult<GscOverview>(overview)
  } catch (err: any) {
    return notConnected<GscOverview>(
      `Gagal mengambil data dari Google Search Console API: ${err.message}`,
      'Pastikan service account email telah ditambahkan sebagai pengguna dengan izin Read di Google Search Console property.'
    )
  }
}

/**
 * Fetch top queries for keyword suggestions and SEO analysis.
 * Zero-mock compliant: queries live Google Search Console API or returns honest error/disconnected state.
 */
export async function getGscTopQueries(limit = 20, siteUrl = 'https://www.unimasi.com'): Promise<Integration<GscQueryItem[]>> {
  const serviceEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY

  if (!serviceEmail || !privateKey) {
    return notConnected<GscQueryItem[]>(
      'Kredensial Google Search Console belum dikonfigurasi.',
      'Tambahkan GSC_CLIENT_EMAIL dan GSC_PRIVATE_KEY pada file .env.'
    )
  }

  try {
    const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const result = await querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
    })

    const queries: GscQueryItem[] = (result.rows || []).map((r: GscSearchAnalyticsRow) => ({
      query: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1)),
    }))

    return connectedResult<GscQueryItem[]>(queries)
  } catch (err: any) {
    return notConnected<GscQueryItem[]>(
      `GSC API Query error: ${err.message}`,
      'Verifikasi izin akses properti Google Search Console untuk service account.'
    )
  }
}

/**
 * Fetch top landing pages from Google Search Console API.
 */
export async function getGscPages(limit = 50, siteUrl = 'https://www.unimasi.com'): Promise<Integration<GscPageItem[]>> {
  const serviceEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY

  if (!serviceEmail || !privateKey) {
    return notConnected<GscPageItem[]>(
      'Kredensial Google Search Console belum dikonfigurasi.',
      'Tambahkan GSC_CLIENT_EMAIL dan GSC_PRIVATE_KEY pada file .env.'
    )
  }

  try {
    const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const result = await querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: limit,
    })

    const pages: GscPageItem[] = (result.rows || []).map((r: GscSearchAnalyticsRow) => ({
      page: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1)),
    }))

    return connectedResult<GscPageItem[]>(pages)
  } catch (err: any) {
    return notConnected<GscPageItem[]>(
      `GSC API Pages Query error: ${err.message}`,
      'Verifikasi izin akses properti Google Search Console untuk service account.'
    )
  }
}

/**
 * Fetch device breakdown (DESKTOP, MOBILE, TABLET) from Google Search Console API.
 */
export async function getGscDevices(siteUrl = 'https://www.unimasi.com'): Promise<Integration<GscDeviceItem[]>> {
  const serviceEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY

  if (!serviceEmail || !privateKey) {
    return notConnected<GscDeviceItem[]>(
      'Kredensial Google Search Console belum dikonfigurasi.',
      'Tambahkan GSC_CLIENT_EMAIL dan GSC_PRIVATE_KEY pada file .env.'
    )
  }

  try {
    const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const result = await querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['device'],
    })

    const devices: GscDeviceItem[] = (result.rows || []).map((r: GscSearchAnalyticsRow) => ({
      device: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1)),
    }))

    return connectedResult<GscDeviceItem[]>(devices)
  } catch (err: any) {
    return notConnected<GscDeviceItem[]>(
      `GSC API Devices Query error: ${err.message}`,
      'Verifikasi izin akses properti Google Search Console untuk service account.'
    )
  }
}

/**
 * Fetch country breakdown from Google Search Console API.
 */
export async function getGscCountries(limit = 50, siteUrl = 'https://www.unimasi.com'): Promise<Integration<GscCountryItem[]>> {
  const serviceEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY

  if (!serviceEmail || !privateKey) {
    return notConnected<GscCountryItem[]>(
      'Kredensial Google Search Console belum dikonfigurasi.',
      'Tambahkan GSC_CLIENT_EMAIL dan GSC_PRIVATE_KEY pada file .env.'
    )
  }

  try {
    const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const result = await querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['country'],
      rowLimit: limit,
    })

    const countries: GscCountryItem[] = (result.rows || []).map((r: GscSearchAnalyticsRow) => ({
      country: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1)),
    }))

    return connectedResult<GscCountryItem[]>(countries)
  } catch (err: any) {
    return notConnected<GscCountryItem[]>(
      `GSC API Countries Query error: ${err.message}`,
      'Verifikasi izin akses properti Google Search Console untuk service account.'
    )
  }
}
