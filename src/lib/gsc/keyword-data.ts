import { prisma } from '@/lib/db/prisma'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { notConnected, connectedResult } from '@/lib/integration/result'
import type { GscSearchAnalyticsRow } from './client'

export const keywordDatasetKey = (siteUrl: string) => `gsc_keyword_dataset_${siteUrl}`
export interface KeywordDataset {
  source: 'google_search_console_api'
  siteUrl: string
  startDate: string
  endDate: string
  syncedAt: string
  truncated: boolean
  rows: GscSearchAnalyticsRow[]
}
export async function getVerifiedKeywordDataset() {
  if (!process.env.GSC_CLIENT_EMAIL || !process.env.GSC_PRIVATE_KEY) return notConnected<KeywordDataset>('Google Search Console belum dikonfigurasi. Cache lama belum digunakan sebagai bukti performa.', 'Hubungkan properti GSC melalui pengaturan integrasi, kemudian jalankan sinkronisasi resmi.')
  const site = await getSiteProfile()
  const snapshot = await prisma.orm.public.GscCache.where({ id: keywordDatasetKey(site.url) }).first()
  if (!snapshot) return notConnected<KeywordDataset>('Belum ada dataset keyword dari sinkronisasi GSC resmi untuk situs ini.', 'Jalankan sinkronisasi pada panel Google Search Console.')
  const data = JSON.parse(snapshot.payload) as KeywordDataset
  if (data.source !== 'google_search_console_api' || data.siteUrl !== site.url || !Array.isArray(data.rows)) throw new Error('Dataset GSC tidak valid.')
  return connectedResult(data, data.syncedAt)
}

/** Combine and deduplicate rows for each query/page; supports both [page, query] and [date, page, query] */
export function aggregateKeywordRows(rows: GscSearchAnalyticsRow[]) {
  const result = new Map<string, { query: string; page: string; clicks: number; impressions: number; weightedPosition: number }>()
  
  for (const row of rows) {
    if (!row.keys || row.keys.length < 2) continue
    
    let page: string
    let query: string
    
    if (row.keys.length >= 3) {
      // 3-tuple: [date, page, query]
      page = row.keys[1]
      query = row.keys[2]
    } else {
      // 2-tuple: [page, query]
      page = row.keys[0]
      query = row.keys[1]
    }

    if (!page || !query) continue
    const cleanQuery = query.trim()
    const cleanPage = page.trim()
    if (!cleanQuery || !cleanPage) continue

    // Normalize key for strict deduplication
    const dedupeKey = `${cleanQuery.toLowerCase()}|||${cleanPage.toLowerCase()}`
    const item = result.get(dedupeKey) || {
      query: cleanQuery,
      page: cleanPage,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
    }

    item.clicks += row.clicks || 0
    item.impressions += row.impressions || 0
    item.weightedPosition += (row.position || 0) * (row.impressions || 0)
    result.set(dedupeKey, item)
  }

  return [...result.values()].map(({ weightedPosition, ...item }) => ({
    ...item,
    ctr: item.impressions ? Number(((item.clicks / item.impressions) * 100).toFixed(2)) : 0,
    position: item.impressions ? Number((weightedPosition / item.impressions).toFixed(1)) : 0,
  }))
}
