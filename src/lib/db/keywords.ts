import 'server-only'
import { aggregateKeywordRows, getVerifiedKeywordDataset } from '@/lib/gsc/keyword-data'
import type { GscSearchAnalyticsRow } from '@/lib/gsc/client'
import { prisma } from './prisma'
import { KeywordBankItem, Locale } from '../seo/schema'

// ─── Capability Interface (Section 4.2) ─────────────────────────────────────
export interface KeywordProvider {
  id: 'gsc' | 'google-ads' | 'autocomplete'
  capabilities: {
    gsc: boolean
    volume: boolean
    difficulty: boolean
    cpc: boolean
    trends: boolean
  }
}

export const GSC_KEYWORD_PROVIDER: KeywordProvider = {
  id: 'gsc',
  capabilities: {
    gsc: true,
    volume: false, // Internal GSC estimates only, not third-party market volume
    difficulty: false,
    cpc: false,
    trends: true,
  },
}

// ─── Keyword Opportunity Model ──────────────────────────────────────────────
export interface KeywordOpportunity {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  opportunityType: 'striking_distance' | 'low_ctr' | 'high_impression_rising'
  score: number // 0 - 100 priority
  recommendation: string
}

export interface CannibalizationIssue {
  query: string
  pages: Array<{ page: string; clicks: number; impressions: number; position: number }>
  totalImpressions: number
  recommendation: string
}

async function verifiedRows(rows?: GscSearchAnalyticsRow[]) {
  if (rows) return rows
  const source = await getVerifiedKeywordDataset()
  return source.connected ? source.data.rows : []
}

export async function getKeywordOpportunities(_locale: Locale = 'id', rows?: GscSearchAnalyticsRow[]): Promise<KeywordOpportunity[]> {
  const aggregated = aggregateKeywordRows(await verifiedRows(rows))
  // Strict deduplication by normalized query: keep the highest-priority page opportunity for each query
  const queryBestOpp = new Map<string, KeywordOpportunity>()

  for (const item of aggregated) {
    let opp: KeywordOpportunity | null = null

    if (item.position >= 8 && item.position <= 20 && item.impressions > 200) {
      opp = {
        ...item,
        opportunityType: 'striking_distance',
        score: Math.min(100, Math.round(item.impressions / 40 + (20 - item.position) * 3)),
        recommendation: 'Tinjau kesesuaian intent, kelengkapan informasi dan tautan internal sebelum menentukan perubahan.',
      }
    } else if (item.position > 0 && item.position <= 5 && item.ctr < 5 && item.impressions > 150) {
      opp = {
        ...item,
        opportunityType: 'low_ctr',
        score: Math.min(100, Math.round((5 - item.ctr) * 15 + item.impressions / 50)),
        recommendation: 'Tinjau snippet dan relevansi halaman terhadap kueri. CTR merupakan persentase klik dari impresi pada periode ini.',
      }
    }

    if (opp) {
      const qKey = opp.query.toLowerCase().trim()
      const existing = queryBestOpp.get(qKey)
      if (!existing || opp.score > existing.score) {
        queryBestOpp.set(qKey, opp)
      }
    }
  }

  return Array.from(queryBestOpp.values()).sort((a, b) => b.score - a.score)
}

export async function detectSearchCannibalization(rows?: GscSearchAnalyticsRow[]): Promise<CannibalizationIssue[]> {
  const groups = new Map<string, Map<string, { page: string; clicks: number; impressions: number; position: number }>>()

  for (const row of aggregateKeywordRows(await verifiedRows(rows))) {
    const qKey = row.query.trim().toLowerCase()
    const pKey = row.page.trim().toLowerCase()

    let pageMap = groups.get(qKey)
    if (!pageMap) {
      pageMap = new Map()
      groups.set(qKey, pageMap)
    }

    const existing = pageMap.get(pKey) || { page: row.page.trim(), clicks: 0, impressions: 0, position: 0 }
    existing.clicks += row.clicks
    existing.impressions += row.impressions
    existing.position = row.position
    pageMap.set(pKey, existing)
  }

  const issues: CannibalizationIssue[] = []
  for (const [qKey, pageMap] of groups) {
    if (pageMap.size > 1) {
      const pages = Array.from(pageMap.values()).sort((a, b) => b.impressions - a.impressions)
      const totalImpressions = pages.reduce((sum, p) => sum + p.impressions, 0)
      issues.push({
        query: qKey,
        pages,
        totalImpressions,
        recommendation: 'Beberapa URL muncul untuk kueri ini. Periksa intent dan konten; kemunculan bersama belum membuktikan kanibalisasi atau kebutuhan konsolidasi.',
      })
    }
  }

  return issues.sort((a, b) => b.totalImpressions - a.totalImpressions)
}

/**
 * Keyword Bank CRUD
 */
export async function getKeywordBank(locale: Locale = 'id'): Promise<KeywordBankItem[]> {
  try {
    const rows = await prisma.orm.public.KeywordBank
      .where({ locale })
      .orderBy((k: any) => k.priorityScore.desc())
      .all()

    // Deduplicate in case database contains legacy duplicate keywords
    const seen = new Set<string>()
    const deduplicated: KeywordBankItem[] = []

    for (const r of rows) {
      const norm = (r.keyword || '').trim().toLowerCase()
      if (!norm || seen.has(norm)) continue
      seen.add(norm)

      deduplicated.push({
        id: r.id,
        keyword: r.keyword,
        locale: r.locale as Locale,
        intent: r.intent as any,
        status: r.status as any,
        targetContentType: r.targetContentType as any,
        targetContentId: r.targetContentId || undefined,
        targetSlug: r.targetSlug || undefined,
        tags: r.tags ? JSON.parse(r.tags) : [],
        notes: r.notes || undefined,
        gscImpressions: r.gscImpressions || 0,
        gscClicks: r.gscClicks || 0,
        gscPosition: r.gscPosition || 0,
        priorityScore: r.priorityScore || 0,
      })
    }

    return deduplicated
  } catch (error) {
    console.error('[keywords] Failed to read keyword bank')
    throw error
  }
}

export async function addKeywordToBank(item: Partial<KeywordBankItem> & { keyword: string }): Promise<KeywordBankItem> {
  const trimmed = item.keyword.trim()
  const locale = item.locale || 'id'

  // Deduplication check: check if keyword already exists for this locale
  const allBank = await prisma.orm.public.KeywordBank.where({ locale }).all()
  const existing = allBank.find((k: any) => (k.keyword || '').trim().toLowerCase() === trimmed.toLowerCase())

  if (existing) {
    // If it already exists, update priority or status without creating duplicate rows
    const updated = await prisma.orm.public.KeywordBank.where({ id: existing.id }).update({
      intent: item.intent || existing.intent || 'informational',
      priorityScore: item.priorityScore !== undefined ? item.priorityScore : existing.priorityScore,
      targetSlug: item.targetSlug || existing.targetSlug,
      targetContentType: item.targetContentType || existing.targetContentType,
    })

    return {
      ...item,
      id: existing.id,
      keyword: existing.keyword,
      locale: existing.locale as Locale,
      intent: ((updated as any)?.intent || existing.intent) as any,
      status: ((updated as any)?.status || existing.status) as any,
      priorityScore: (updated as any)?.priorityScore || existing.priorityScore || 50,
      tags: existing.tags ? JSON.parse(existing.tags) : [],
      gscImpressions: existing.gscImpressions || 0,
      gscClicks: existing.gscClicks || 0,
      gscPosition: existing.gscPosition || 0,
    }
  }

  const created = await prisma.orm.public.KeywordBank.create({
    keyword: trimmed,
    locale,
    intent: item.intent || 'informational',
    status: item.status || 'planned',
    targetContentType: item.targetContentType,
    targetContentId: item.targetContentId,
    targetSlug: item.targetSlug,
    tags: item.tags ? JSON.stringify(item.tags) : JSON.stringify([]),
    notes: item.notes,
    gscImpressions: item.gscImpressions || 0,
    gscClicks: item.gscClicks || 0,
    gscPosition: item.gscPosition || 0,
    priorityScore: item.priorityScore || 50,
  })

  return {
    ...item,
    id: created.id,
    locale: item.locale || 'id',
    intent: item.intent || 'informational',
    status: item.status || 'planned',
    tags: item.tags || [],
    gscImpressions: item.gscImpressions || 0,
    gscClicks: item.gscClicks || 0,
    gscPosition: item.gscPosition || 0,
    priorityScore: item.priorityScore || 50,
  }
}

/**
 * Keyword Map: returns mapping of keywords to content with conflict detection
 */
export async function getKeywordMap(locale: Locale = 'id') {
  try {
    const articleRows = await prisma.orm.public.Article.where({ locale }).all()

    const mapItems: Array<{
      keyword: string
      contentTitle: string
      slug: string
      contentType: 'article' | 'service' | 'portfolio'
      type: 'focus' | 'related'
    }> = []

    const conflictWarnings: string[] = []
    const seenFocusKws = new Map<string, string>()

    for (const art of articleRows) {
      if (art.focusKeyphrase) {
        const kw = art.focusKeyphrase.trim().toLowerCase()
        if (seenFocusKws.has(kw)) {
          conflictWarnings.push(
            `Bentrok Keyphrase: "${art.focusKeyphrase}" digunakan oleh dua artikel: "${seenFocusKws.get(kw)}" dan "${art.title}".`
          )
        } else {
          seenFocusKws.set(kw, art.title)
        }

        mapItems.push({
          keyword: art.focusKeyphrase,
          contentTitle: art.title,
          slug: art.slug,
          contentType: 'article',
          type: 'focus',
        })
      }

      if (art.relatedKeyphrases) {
        try {
          const rels: string[] = typeof art.relatedKeyphrases === 'string' ? JSON.parse(art.relatedKeyphrases) : art.relatedKeyphrases
          for (const r of rels) {
            mapItems.push({
              keyword: r,
              contentTitle: art.title,
              slug: art.slug,
              contentType: 'article',
              type: 'related',
            })
          }
        } catch {}
      }
    }

    return {
      mapItems,
      conflictWarnings,
    }
  } catch {
    return {
      mapItems: [],
      conflictWarnings: [],
    }
  }
}
