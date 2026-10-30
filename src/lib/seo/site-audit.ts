import { prisma } from '@/lib/db/prisma'
import { SiteAuditIssue, AuditSeverity, AuditCategory } from './schema'
import { siteConfig } from '@/config/site'

export interface SiteAuditSummary {
  auditId: string
  type: 'internal_db' | 'live_crawl'
  status: 'running' | 'completed' | 'failed'
  totalIssues: number
  criticalCount: number
  warningCount: number
  infoCount: number
  seoHealthScore: number // 0 - 100
  startedAt: string
  finishedAt?: string
  diff?: {
    newIssues: number
    resolvedIssues: number
  }
}

/**
 * Runs Layer 1: In-Database Pre-Publish Site Audit (Section 15.3)
 */
export async function runInternalDatabaseAudit(): Promise<{
  summary: SiteAuditSummary
  issues: SiteAuditIssue[]
}> {
  const auditId = `audit_db_${Date.now()}`
  const issues: Array<{
    severity: AuditSeverity
    category: AuditCategory
    urlOrPath?: string
    contentType?: string
    contentId?: number
    title: string
    description: string
    recommendation: string
  }> = []

  // 1. Audit Articles
  const allArticles = await prisma.orm.public.Article.all()
  const seenArticleTitles = new Map<string, string>()
  const seenArticleSlugs = new Set<string>()
  const seenFocusKws = new Map<string, string>()

  for (const art of allArticles) {
    const title = (art.metaTitle || art.title || '').trim()
    const descText = (art.metaDescription || art.excerpt || '').trim()
    const slug = art.slug
    const locale = art.locale || 'id'
    const cleanContent = (art.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const words = cleanContent.split(/\s+/).filter(Boolean).length

    // Slug checks
    if (!slug) {
      issues.push({
        severity: 'critical',
        category: 'meta',
        contentType: 'article',
        contentId: art.id,
        title: 'Slug URL Kosong',
        description: `Artikel ID ${art.id} ("${title}") tidak memiliki slug URL.`,
        recommendation: 'Buat slug URL yang unik dan relevan.',
      })
    } else if (seenArticleSlugs.has(slug)) {
      issues.push({
        severity: 'critical',
        category: 'meta',
        urlOrPath: `/${slug}`,
        contentType: 'article',
        contentId: art.id,
        title: 'Slug Duplikat Terdeteksi',
        description: `Slug "/${slug}" digunakan oleh lebih dari satu artikel.`,
        recommendation: 'Ubah slug agar unik untuk mencegah tabrakan URL.',
      })
    } else {
      seenArticleSlugs.add(slug)
    }

    // Title checks
    if (!title) {
      issues.push({
        severity: 'critical',
        category: 'meta',
        urlOrPath: `/${slug}`,
        contentType: 'article',
        contentId: art.id,
        title: 'Judul SEO Kosong',
        description: `Artikel ID ${art.id} tidak memiliki judul atau meta title.`,
        recommendation: 'Isi judul SEO 40-60 karakter.',
      })
    } else {
      const lowerT = title.toLowerCase()
      if (seenArticleTitles.has(lowerT)) {
        issues.push({
          severity: 'warning',
          category: 'meta',
          urlOrPath: `/${slug}`,
          contentType: 'article',
          contentId: art.id,
          title: 'Judul SEO Duplikat',
          description: `Judul "${title}" persis sama dengan artikel "${seenArticleTitles.get(lowerT)}".`,
          recommendation: 'Variasikan judul untuk menargetkan intent pencarian yang unik.',
        })
      } else {
        seenArticleTitles.set(lowerT, slug)
      }

      if (title.length > 70) {
        issues.push({
          severity: 'warning',
          category: 'meta',
          urlOrPath: `/${slug}`,
          contentType: 'article',
          contentId: art.id,
          title: 'Judul SEO Terlalu Panjang',
          description: `Judul memuat ${title.length} karakter (maksimal disarankan 65).`,
          recommendation: 'Ringkas judul agar tidak terpotong di SERP Google.',
        })
      }
    }

    // Description checks
    if (!descText) {
      issues.push({
        severity: 'critical',
        category: 'meta',
        urlOrPath: `/${slug}`,
        contentType: 'article',
        contentId: art.id,
        title: 'Meta Description Kosong',
        description: `Artikel "/${slug}" tidak memiliki meta description.`,
        recommendation: 'Tulis meta description 120-160 karakter yang memikat.',
      })
    } else if (descText.length < 90) {
      issues.push({
        severity: 'warning',
        category: 'meta',
        urlOrPath: `/${slug}`,
        contentType: 'article',
        contentId: art.id,
        title: 'Meta Description Terlalu Pendek',
        description: `Meta description hanya ${descText.length} karakter (target 120-160).`,
        recommendation: 'Tambahkan ajakan klik dan detail informasi topik.',
      })
    }

    // Thin content check
    if (words < 250 && art.status === 'published') {
      issues.push({
        severity: 'warning',
        category: 'headings',
        urlOrPath: `/${slug}`,
        contentType: 'article',
        contentId: art.id,
        title: 'Konten Terlalu Tipis (Thin Content)',
        description: `Artikel terbit hanya memuat ${words} kata (minimal 300 kata).`,
        recommendation: 'Kembangkan artikel dengan materi dan penjelasan mendalam.',
      })
    }

    // Keyphrase conflict check in same locale
    if (art.focusKeyphrase) {
      const kw = art.focusKeyphrase.trim().toLowerCase()
      const key = `${locale}:${kw}`
      if (seenFocusKws.has(key)) {
        issues.push({
          severity: 'warning',
          category: 'meta',
          urlOrPath: `/${slug}`,
          contentType: 'article',
          contentId: art.id,
          title: 'Bentrok Focus Keyphrase (Kanibalisasi)',
          description: `Keyphrase "${art.focusKeyphrase}" juga ditargetkan oleh artikel "/${seenFocusKws.get(key)}".`,
          recommendation: 'Gunakan kata kunci sekunder atau bedakan sudut pandang tulisan.',
        })
      } else {
        seenFocusKws.set(key, slug)
      }
    }

    // Content Images Missing Alt Text
    const imgMatches = Array.from((art.content || '').matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi))
    for (const match of imgMatches as any[]) {
      const fullTag = match[0]
      const altMatch = fullTag.match(/alt=["']([^"']*)["']/i)
      const alt = altMatch ? altMatch[1].trim() : ''
      if (!alt) {
        issues.push({
          severity: 'critical',
          category: 'images',
          urlOrPath: `/${slug}`,
          contentType: 'article',
          contentId: art.id,
          title: 'Gambar Tanpa Alt Text di Artikel',
          description: `Terdapat gambar (${match[1]}) di artikel "/${slug}" tanpa teks alternatif (alt).`,
          recommendation: 'Tambahkan alt text deskriptif untuk aksesibilitas dan Google Images.',
        })
      }
    }
  }

  // 2. Audit Media Manager Items
  const mediaRows = await prisma.orm.public.MediaItem.all()
  for (const media of mediaRows) {
    if (!media.decorative) {
      let altObj = { id: '', en: '' }
      try {
        if (media.altText) altObj = JSON.parse(media.altText)
      } catch {}

      if (!altObj.id || !altObj.id.trim()) {
        issues.push({
          severity: 'critical',
          category: 'images',
          urlOrPath: media.url,
          contentType: 'media',
          contentId: media.id,
          title: 'Media Library: Alt Text (ID) Kosong',
          description: `Gambar "${media.fileName}" (${media.url}) belum memiliki Alt Text Bahasa Indonesia.`,
          recommendation: 'Buka Media Manager dan lengkapi alt text gambar.',
        })
      }
    }

    if ((media.size || 0) > 1.5 * 1024 * 1024) {
      issues.push({
        severity: 'warning',
        category: 'performance',
        urlOrPath: media.url,
        contentType: 'media',
        contentId: media.id,
        title: 'Ukuran Gambar Melebihi 1.5 MB',
        description: `Gambar "${media.fileName}" berukuran ${((media.size || 0) / (1024 * 1024)).toFixed(2)} MB.`,
        recommendation: 'Kompres ke WebP/AVIF untuk mempercepat waktu render LCP.',
      })
    }
  }

  // 3. Audit Redirects for Loops and Chains
  const redirectRows = await prisma.orm.public.Redirect.where({ active: true }).all()
  const redirectMap = new Map<string, string>()
  for (const r of redirectRows) {
    redirectMap.set(r.sourcePath, r.destinationPath)
  }

  for (const r of redirectRows) {
    // Check loop (A -> B -> A)
    const nextHop = redirectMap.get(r.destinationPath)
    if (nextHop === r.sourcePath) {
      issues.push({
        severity: 'critical',
        category: 'redirects',
        urlOrPath: r.sourcePath,
        contentType: 'redirect',
        contentId: r.id,
        title: 'Redirect Loop Terdeteksi',
        description: `Loop terdeteksi: ${r.sourcePath} -> ${r.destinationPath} -> ${r.sourcePath}. Mengakibatkan ERR_TOO_MANY_REDIRECTS pada crawler.`,
        recommendation: 'Hapus salah satu aturan pengalihan yang berputar.',
      })
    } else if (nextHop) {
      // Check chain (A -> B -> C)
      issues.push({
        severity: 'warning',
        category: 'redirects',
        urlOrPath: r.sourcePath,
        contentType: 'redirect',
        contentId: r.id,
        title: 'Redirect Chain (Rantai Pengalihan)',
        description: `Rantai redirect: ${r.sourcePath} -> ${r.destinationPath} -> ${nextHop}. Mengurangi PageRank dan memperlambat latensi crawling.`,
        recommendation: `Arahkan ${r.sourcePath} langsung ke ${nextHop}.`,
      })
    }
  }

  // 4. Calculate Summary Metrics
  const criticalCount = issues.filter((i) => i.severity === 'critical').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const infoCount = issues.filter((i) => i.severity === 'info').length

  let healthScore = 100 - criticalCount * 4 - warningCount * 1
  healthScore = Math.max(10, Math.min(100, healthScore))

  // Find previous audit for diff calculation
  const prevAudits = await prisma.orm.public.SiteAudit
    .where({ type: 'internal_db' })
    .orderBy((s: any) => s.startedAt.desc()).limit(1).all()

  let diffObj = { newIssues: issues.length, resolvedIssues: 0 }
  if (prevAudits[0]?.summary) {
    try {
      const prevSum = JSON.parse(prevAudits[0].summary)
      const prevTotal = prevSum.totalIssues || 0
      diffObj = {
        newIssues: Math.max(0, issues.length - prevTotal),
        resolvedIssues: Math.max(0, prevTotal - issues.length),
      }
    } catch {}
  }

  const summary: SiteAuditSummary = {
    auditId,
    type: 'internal_db',
    status: 'completed',
    totalIssues: issues.length,
    criticalCount,
    warningCount,
    infoCount,
    seoHealthScore: healthScore,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    diff: diffObj,
  }

  // Save audit record to PostgreSQL via Prisma 8
  await prisma.orm.public.SiteAudit.create({
    id: auditId,
    type: 'internal_db',
    status: 'completed',
    summary: JSON.stringify(summary),
    diffFromPrevious: JSON.stringify(diffObj),
    finishedAt: summary.finishedAt,
  })

  // Save individual issues
  for (const iss of issues) {
    await prisma.orm.public.SiteAuditIssue.create({
      auditId,
      severity: iss.severity,
      category: iss.category,
      urlOrPath: iss.urlOrPath,
      contentType: iss.contentType,
      contentId: iss.contentId,
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
  }
}

/**
 * Get latest site audit or list audit history
 */
export async function getLatestAuditReport(): Promise<{
  summary: SiteAuditSummary | null
  issues: SiteAuditIssue[]
}> {
  const latestAudit = await prisma.orm.public.SiteAudit
    .orderBy((s: any) => s.startedAt.desc()).limit(1).all()

  if (!latestAudit[0]) {
    // If no audit has ever run, execute an internal DB audit immediately
    return runInternalDatabaseAudit()
  }

  const sumObj = JSON.parse(latestAudit[0].summary) as SiteAuditSummary
  const issues = await prisma.orm.public.SiteAuditIssue.where({ auditId: latestAudit[0].id }).all()

  return {
    summary: sumObj,
    issues: issues.map((r: any) => ({
      ...r,
      resolved: Boolean(r.resolved),
    })),
  }
}
