import { prisma } from '@/lib/db/prisma'
import { Integration, connectedResult, notConnected } from '../integration/result'

// ─── Data Types ─────────────────────────────────────────────────────────────

export interface MigrationTrafficDiffItem {
  legacyUrl: string
  targetUrl: string | null
  migrationStatus: 'migrated' | 'redirected' | 'unmapped' | 'dropped'
  clicksBefore: number
  impressionsBefore: number
  clicksCurrent: number
  impressionsCurrent: number
  trafficDeltaPercent: number
  recommendation: string
}

export interface RedirectChainIssue {
  type: 'chain' | 'loop' | 'self_redirect'
  sourcePath: string
  intermediatePaths: string[]
  finalDestination: string
  hopCount: number
  recommendation: string
}

export interface StrikingDistanceOpportunity {
  query: string
  page: string
  position: number
  impressions: number
  clicks: number
  ctr: number
  priorityScore: number
  recommendation: string
}

export interface CannibalizationResult {
  query: string
  pages: Array<{ page: string; clicks: number; impressions: number; position: number }>
  totalImpressions: number
  recommendation: string
}

export interface LowCtrOpportunity {
  query: string
  page: string
  position: number
  impressions: number
  clicks: number
  ctr: number
  expectedMinCtr: number
  recommendation: string
}

export interface ContentDecayItem {
  page: string
  recentClicks: number
  previousClicks: number
  recentImpressions: number
  previousImpressions: number
  clicksDropPercent: number
  status: 'decaying' | 'severe_decay'
  recommendation: string
}

export interface ContentGapOpportunity {
  query: string
  impressions: number
  clicks: number
  averagePosition: number
  potentialContentType: 'article' | 'service' | 'landing'
  recommendation: string
}

// ─── Tool 1: Migration Traffic Diff (L11-T5) ────────────────────────────────

export async function migrationTrafficDiff(options: { minImpressions?: number } = {}): Promise<Integration<MigrationTrafficDiffItem[]>> {
  const minImpressions = options.minImpressions ?? 0

  // 1. Check legacy URLs in DB
  const legacyList = await prisma.orm.public.LegacyUrl.all()
  if (legacyList.length === 0) {
    return notConnected<MigrationTrafficDiffItem[]>(
      'Tabel legacy_urls belum memiliki data URL WordPress lama.',
      'Jalankan migrasi URL WordPress atau impor daftar legacy URLs melalui Studio / CLI.'
    )
  }

  // 2. Fetch current GSC page metrics
  const gscRows = await prisma.orm.public.GscDaily.all()
  const currentMetricsMap = new Map<string, { clicks: number; impressions: number }>()
  for (const row of gscRows) {
    const existing = currentMetricsMap.get(row.page) || { clicks: 0, impressions: 0 }
    currentMetricsMap.set(row.page, {
      clicks: existing.clicks + (row.clicks || 0),
      impressions: existing.impressions + (row.impressions || 0),
    })
  }

  const results: MigrationTrafficDiffItem[] = []

  for (const item of legacyList) {
    const impBefore = item.impressionsBefore ?? 0
    const clkBefore = item.clicksBefore ?? 0

    if (impBefore < minImpressions) continue

    const current = item.targetUrl ? currentMetricsMap.get(item.targetUrl) || { clicks: 0, impressions: 0 } : { clicks: 0, impressions: 0 }
    
    let delta = 0
    if (impBefore > 0) {
      delta = Number((((current.impressions - impBefore) / impBefore) * 100).toFixed(1))
    }

    let status = item.migrationStatus as 'migrated' | 'redirected' | 'unmapped' | 'dropped'
    let recommendation = 'Trafik stabil atau meningkat pasca migrasi.'

    if (!item.targetUrl || status === 'unmapped') {
      status = 'unmapped'
      recommendation = `URL lama ${item.legacyUrl} belum memiliki target pengalihan 301. Segera buat redirect rule untuk melindungi traffic equity.`
    } else if (delta < -50) {
      status = 'dropped'
      recommendation = `Trafik pada ${item.targetUrl} turun ${Math.abs(delta)}% dibanding URL legacy. Periksa keselarasan intent konten, meta tag, dan canonical.`
    }

    results.push({
      legacyUrl: item.legacyUrl,
      targetUrl: item.targetUrl,
      migrationStatus: status,
      clicksBefore: clkBefore,
      impressionsBefore: impBefore,
      clicksCurrent: current.clicks,
      impressionsCurrent: current.impressions,
      trafficDeltaPercent: delta,
      recommendation,
    })
  }

  return connectedResult(results)
}

// ─── Tool 2: Redirect Chain Audit (L11-T5) ──────────────────────────────────

export async function redirectChainAudit(): Promise<RedirectChainIssue[]> {
  const allRedirects = await prisma.orm.public.Redirect.where({ active: true }).all()

  const redirectMap = new Map<string, string>()
  for (const r of allRedirects) {
    redirectMap.set(r.sourcePath, r.destinationPath)
  }

  const issues: RedirectChainIssue[] = []

  for (const [source, destination] of redirectMap.entries()) {
    // 1. Self Redirect Check
    if (source === destination) {
      issues.push({
        type: 'self_redirect',
        sourcePath: source,
        intermediatePaths: [],
        finalDestination: destination,
        hopCount: 1,
        recommendation: `URL ${source} mengarah ke dirinya sendiri. Hapus aturan redirect ini untuk mencegah looping.`,
      })
      continue
    }

    // 2. Chain & Loop Traversal (max 10 hops)
    const visited = new Set<string>([source])
    const intermediates: string[] = []
    let current = destination
    let isLoop = false

    while (redirectMap.has(current)) {
      if (visited.has(current)) {
        isLoop = true
        break
      }
      visited.add(current)
      intermediates.push(current)
      current = redirectMap.get(current)!
      if (intermediates.length >= 10) break
    }

    if (isLoop) {
      issues.push({
        type: 'loop',
        sourcePath: source,
        intermediatePaths: intermediates,
        finalDestination: current,
        hopCount: intermediates.length + 1,
        recommendation: `Terdeteksi siklus pengalihan (loop) tak terhingga mulai dari ${source}. Putus rantai redirect menuju target kanonikal final.`,
      })
    } else if (intermediates.length > 0) {
      issues.push({
        type: 'chain',
        sourcePath: source,
        intermediatePaths: intermediates,
        finalDestination: current,
        hopCount: intermediates.length + 1,
        recommendation: `Rantai pengalihan ${intermediates.length + 1} langkah: ${source} → ${intermediates.join(' → ')} → ${current}. Ubah sumber langsung mengarah ke ${current}.`,
      })
    }
  }

  return issues
}

// ─── Tool 3: Find Striking Distance (L11-T5) ────────────────────────────────

export async function findStrikingDistance(options: { minImpressions?: number; locale?: string } = {}): Promise<Integration<StrikingDistanceOpportunity[]>> {
  const minImpressions = options.minImpressions ?? 150
  const locale = options.locale ?? 'id'

  const allRows = await prisma.orm.public.GscDaily.all()
  const rows = allRows.filter((r: any) => (!locale || r.locale === locale) && (r.impressions || 0) >= minImpressions)

  if (rows.length === 0) {
    return notConnected<StrikingDistanceOpportunity[]>(
      'Tidak ada data GSC daily yang memenuhi kriteria pencarian.',
      'Pastikan sinkronisasi GSC aktif melalui POST /api/gsc.'
    )
  }

  const opportunities: StrikingDistanceOpportunity[] = []

  for (const r of rows) {
    const pos = r.position || 0
    if (pos >= 7.5 && pos <= 20.0) {
      const priority = Math.min(100, Math.round((r.impressions || 0) / 30 + (20 - pos) * 3))
      opportunities.push({
        query: r.query,
        page: r.page,
        position: pos,
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        ctr: r.ctr || 0,
        priorityScore: priority,
        recommendation: `Posisi rata-rata ${pos}. Tambahkan query ini ke focus/related keyphrase dan perkuat subjudul H2 untuk mendorong ke halaman 1 (Top 3).`,
      })
    }
  }

  return connectedResult(opportunities.sort((a, b) => b.priorityScore - a.priorityScore))
}

// ─── Tool 4: Find Search Cannibalization (L11-T5) ───────────────────────────

export async function findCannibalization(): Promise<Integration<CannibalizationResult[]>> {
  const rows = await prisma.orm.public.GscDaily.all()
  if (rows.length === 0) {
    return notConnected<CannibalizationResult[]>(
      'Tabel gsc_daily kosong, tidak dapat mendeteksi kanibalisasi.',
      'Hubungkan Google Search Console API untuk sinkronisasi harian.'
    )
  }

  const queryMap = new Map<string, Array<{ page: string; clicks: number; impressions: number; position: number }>>()

  for (const r of rows) {
    const list = queryMap.get(r.query) || []
    if (!list.some((it) => it.page === r.page)) {
      list.push({
        page: r.page,
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        position: r.position || 0,
      })
    }
    queryMap.set(r.query, list)
  }

  const issues: CannibalizationResult[] = []
  for (const [query, pagesList] of queryMap.entries()) {
    if (pagesList.length >= 2) {
      const totalImp = pagesList.reduce((acc, p) => acc + p.impressions, 0)
      issues.push({
        query,
        pages: pagesList,
        totalImpressions: totalImp,
        recommendation: `Kueri "${query}" diperebutkan oleh ${pagesList.length} halaman (${pagesList.map((p) => p.page).join(', ')}). Konsolidasikan konten atau fokuskan ulang keyphrase target agar tidak saling mengkanibalisasi peringkat.`,
      })
    }
  }

  return connectedResult(issues.sort((a, b) => b.totalImpressions - a.totalImpressions))
}

// ─── Tool 5: Find Low CTR (L11-T5) ──────────────────────────────────────────

export async function findLowCtr(options: { minImpressions?: number } = {}): Promise<Integration<LowCtrOpportunity[]>> {
  const minImpressions = options.minImpressions ?? 100

  const allRows = await prisma.orm.public.GscDaily.all()
  const rows = allRows.filter((r: any) => (r.impressions || 0) >= minImpressions)

  if (rows.length === 0) {
    return notConnected<LowCtrOpportunity[]>(
      'Tabel gsc_daily belum memiliki data untuk analisis CTR.',
      'Jalankan sinkronisasi GSC API.'
    )
  }

  const opportunities: LowCtrOpportunity[] = []

  for (const r of rows) {
    const pos = r.position || 0
    const ctr = r.ctr || 0
    // If ranking on top 5 but CTR < 5%
    if (pos <= 5.5 && ctr < 5.0) {
      opportunities.push({
        query: r.query,
        page: r.page,
        position: pos,
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        ctr,
        expectedMinCtr: 5.0,
        recommendation: `Peringkat sudah sangat bagus (${pos}) tetapi CTR rendah (${ctr}%). Optimalkan SEO Title dan Meta Description dengan value proposition yang lebih menarik perhatian.`,
      })
    }
  }

  return connectedResult(opportunities)
}

// ─── Tool 6: Detect Content Decay (L11-T5) ──────────────────────────────────

export async function detectContentDecay(options: { daysThreshold?: number } = {}): Promise<Integration<ContentDecayItem[]>> {
  // Aggregate page-level traffic split by date
  const allRows = await prisma.orm.public.GscDaily.all()
  const rows = allRows.map((r: any) => ({
    page: r.page,
    date: r.date,
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
  }))

  if (rows.length === 0) {
    return notConnected<ContentDecayItem[]>(
      'Tabel gsc_daily tidak memiliki data tanggal untuk analisis peluruhan konten.',
      'Lakukan sinkronisasi data GSC multi-hari.'
    )
  }

  // Get unique dates
  const dates = Array.from(new Set(rows.map((r: any) => r.date))).sort().reverse()
  if (dates.length < 2) {
    return connectedResult([]) // Not enough multi-date records to detect decay
  }

  const midIndex = Math.floor(dates.length / 2)
  const recentDates = new Set(dates.slice(0, midIndex))
  const previousDates = new Set(dates.slice(midIndex))

  const pageStats = new Map<string, { recentClicks: number; prevClicks: number; recentImp: number; prevImp: number }>()

  for (const r of rows) {
    const stat = pageStats.get(r.page) || { recentClicks: 0, prevClicks: 0, recentImp: 0, prevImp: 0 }
    if (recentDates.has(r.date)) {
      stat.recentClicks += r.clicks || 0
      stat.recentImp += r.impressions || 0
    } else if (previousDates.has(r.date)) {
      stat.prevClicks += r.clicks || 0
      stat.prevImp += r.impressions || 0
    }
    pageStats.set(r.page, stat)
  }

  const decays: ContentDecayItem[] = []

  for (const [page, s] of pageStats.entries()) {
    if (s.prevClicks >= 10 && s.recentClicks < s.prevClicks) {
      const drop = Number((((s.prevClicks - s.recentClicks) / s.prevClicks) * 100).toFixed(1))
      if (drop >= 20) {
        decays.push({
          page,
          recentClicks: s.recentClicks,
          previousClicks: s.prevClicks,
          recentImpressions: s.recentImp,
          previousImpressions: s.prevImp,
          clicksDropPercent: drop,
          status: drop >= 50 ? 'severe_decay' : 'decaying',
          recommendation: `Halaman mengalami penurunan klik sebesar ${drop}%. Perbarui data, tambahkan studi kasus terbaru, dan audit broken link internal.`,
        })
      }
    }
  }

  return connectedResult(decays.sort((a, b) => b.clicksDropPercent - a.clicksDropPercent))
}

// ─── Tool 7: Find Content Gaps (L11-T5) ──────────────────────────────────────

export async function findContentGaps(options: { minImpressions?: number } = {}): Promise<Integration<ContentGapOpportunity[]>> {
  const minImpressions = options.minImpressions ?? 80

  // 1. Fetch high-impression search queries from GSC daily
  const allRows = await prisma.orm.public.GscDaily.all()
  const queryMap = new Map<string, { impressions: number; clicks: number; positions: number[] }>()
  for (const r of allRows) {
    if (!r.query) continue
    const curr = queryMap.get(r.query) || { impressions: 0, clicks: 0, positions: [] }
    curr.impressions += r.impressions || 0
    curr.clicks += r.clicks || 0
    if (r.position) curr.positions.push(r.position)
    queryMap.set(r.query, curr)
  }

  const gscQueries: Array<{ query: string; impressions: number; clicks: number; avgPosition: number }> = []
  for (const [query, data] of queryMap.entries()) {
    if (data.impressions >= minImpressions) {
      const avgPos = data.positions.length > 0
        ? Math.round((data.positions.reduce((a, b) => a + b, 0) / data.positions.length) * 10) / 10
        : 0
      gscQueries.push({
        query,
        impressions: data.impressions,
        clicks: data.clicks,
        avgPosition: avgPos,
      })
    }
  }

  if (gscQueries.length === 0) {
    return notConnected<ContentGapOpportunity[]>(
      'Tabel gsc_daily tidak memiliki data kueri di atas ambang batas.',
      'Pastikan sinkronisasi GSC mencatat impresi kueri.'
    )
  }

  // 2. Fetch existing articles and services titles & focus keyphrases
  const [existingArticles, existingServices] = await Promise.all([
    prisma.orm.public.Article.all(),
    prisma.orm.public.Service.all(),
  ])

  const existingKeywords = new Set<string>()
  for (const a of existingArticles) {
    if (a.title) existingKeywords.add(a.title.toLowerCase())
    if (a.focusKeyphrase) existingKeywords.add(a.focusKeyphrase.toLowerCase())
  }
  for (const s of existingServices) {
    if (s.name) existingKeywords.add(s.name.toLowerCase())
    if (s.focusKeyphrase) existingKeywords.add(s.focusKeyphrase.toLowerCase())
  }

  const gaps: ContentGapOpportunity[] = []

  for (const item of gscQueries) {
    const q = item.query.toLowerCase().trim()
    const isCovered = Array.from(existingKeywords).some((kw) => kw.includes(q) || q.includes(kw))

    if (!isCovered) {
      const isServiceIntent = q.includes('jasa') || q.includes('layanan') || q.includes('konsultan') || q.includes('agency')
      const targetType = isServiceIntent ? 'service' : 'article'

      gaps.push({
        query: item.query,
        impressions: Number(item.impressions) || 0,
        clicks: Number(item.clicks) || 0,
        averagePosition: Number(item.avgPosition) || 0,
        potentialContentType: targetType,
        recommendation: `Kueri "${item.query}" mencatat ${item.impressions} impresi namun belum memiliki artikel atau layanan spesifik yang menargetkannya. Buat ${targetType} baru untuk merebut traffic organik ini.`,
      })
    }
  }

  return connectedResult(gaps)
}
