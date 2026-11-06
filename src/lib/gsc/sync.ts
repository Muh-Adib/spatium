import { prisma } from '@/lib/db/prisma'
import { querySearchAnalytics, GscSearchAnalyticsRow } from './client'
import { keywordDatasetKey, type KeywordDataset } from './keyword-data'
import { Integration, connectedResult, notConnected } from '../integration/result'
import { siteConfig } from '@/config/site'

export interface GscSyncResult {
  syncedRows: number
  startDate: string
  endDate: string
  siteUrl: string
}

/**
 * Incrementally syncs Google Search Console performance data to PostgreSQL gsc_daily table.
 * Deduplicates rows based on date, page, and query.
 * (ADR-0010 / L11-T2)
 */
export async function syncGscDaily(
  siteUrl = siteConfig.url,
  daysBack = 3
): Promise<Integration<GscSyncResult>> {
  const serviceEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY

  if (!serviceEmail || !privateKey) {
    return notConnected<GscSyncResult>(
      'Kredensial Google Search Console (GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY) belum dikonfigurasi.',
      'Tambahkan GSC_CLIENT_EMAIL dan GSC_PRIVATE_KEY pada file .env untuk mengaktifkan sinkronisasi harian gsc_daily.'
    )
  }

  try {
    // End date 3 days ago (GSC data finalization latency)
    const endDateObj = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const startDateObj = new Date(endDateObj.getTime() - daysBack * 24 * 60 * 60 * 1000)

    const startDate = startDateObj.toISOString().split('T')[0]
    const endDate = endDateObj.toISOString().split('T')[0]

    // 1. Fetch Aggregated Keyword Dataset (Dimensions: ['page', 'query'])
    // Aggregated natively across the 28-day window by Google big data cluster.
    // Zero date-fragmentation, zero combinatorial explosion, zero false truncation!
    const kwResult = await querySearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: 5000,
    })

    const kwRows = kwResult.rows || []

    // Strict in-memory deduplication by [query, page]
    const kwDedupe = new Map<string, GscSearchAnalyticsRow>()
    for (const r of kwRows) {
      if (!r.keys || r.keys.length < 2) continue
      const page = r.keys[0]?.trim()
      const query = r.keys[1]?.trim()
      if (!page || !query) continue
      const key = `${query.toLowerCase()}|||${page.toLowerCase()}`
      if (!kwDedupe.has(key)) {
        kwDedupe.set(key, { ...r, keys: [page, query] })
      }
    }
    const cleanKwRows = Array.from(kwDedupe.values())

    // Cache the aggregated dataset for Studio Keyword Planner
    const syncedAt = new Date().toISOString()
    const dataset: KeywordDataset = {
      source: 'google_search_console_api',
      siteUrl,
      startDate,
      endDate,
      syncedAt,
      truncated: kwRows.length >= 5000,
      rows: cleanKwRows,
    }
    const cacheId = keywordDatasetKey(siteUrl)
    const cacheFields = {
      siteUrl,
      dataType: 'keyword_dataset',
      dateRange: `${startDate}_${endDate}`,
      payload: JSON.stringify(dataset),
      cachedAt: syncedAt,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }
    await prisma.orm.public.GscCache.upsert({
      conflictOn: { id: cacheId },
      create: { id: cacheId, ...cacheFields },
      update: cacheFields,
    })

    // 2. Incrementally sync daily breakdown to gsc_daily (recent finalized days)
    // Avoids 28-day combinatorial explosion while preserving daily historical tracking
    const dailyDays = Math.min(daysBack, 7)
    const dailyStartDateObj = new Date(endDateObj.getTime() - dailyDays * 24 * 60 * 60 * 1000)
    const dailyStartDate = dailyStartDateObj.toISOString().split('T')[0]

    const dailyResult = await querySearchAnalytics(siteUrl, {
      startDate: dailyStartDate,
      endDate,
      dimensions: ['date', 'page', 'query'],
      rowLimit: 2500,
    })

    const dailyRows = dailyResult.rows || []
    let syncedRows = 0

    // Pre-fetch existing rows in the synced date range to guarantee ZERO duplicates
    const existingDaily = await prisma.orm.public.GscDaily
      .where((g: any) => g.date.gte(dailyStartDate).and(g.date.lte(endDate)))
      .all()
    const existingSet = new Set(
      existingDaily.map((e: any) => `${e.date}|||${e.page.trim().toLowerCase()}|||${e.query.trim().toLowerCase()}`)
    )

    for (const r of dailyRows) {
      if (!r.keys || r.keys.length < 3) continue
      const [date, page, query] = r.keys
      if (!date || !page || !query) continue
      const key = `${date}|||${page.trim().toLowerCase()}|||${query.trim().toLowerCase()}`

      if (!existingSet.has(key)) {
        existingSet.add(key)
        await prisma.orm.public.GscDaily.create({
          date,
          page: page.trim(),
          query: query.trim(),
          clicks: r.clicks || 0,
          impressions: r.impressions || 0,
          ctr: r.ctr || 0,
          position: r.position || 0,
          locale: 'id',
        })
        syncedRows++
      }
    }

    return connectedResult<GscSyncResult>({
      syncedRows,
      startDate,
      endDate,
      siteUrl,
    })
  } catch (err) {
    console.error('[gsc] Sync failed', err)
    return notConnected<GscSyncResult>(
      'Gagal menjalankan sinkronisasi GSC. Detail tersedia di log server.',
      'Periksa koneksi API Google Search Console dan izin properti pada service account.'
    )
  }
}
