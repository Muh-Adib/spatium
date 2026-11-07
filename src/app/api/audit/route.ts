import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runInternalDatabaseAudit, getLatestAuditReport } from '@/lib/seo/site-audit'
import { runLiveCrawler } from '@/lib/seo/crawler'
import { requireUser } from '@/lib/auth/rbac'
import { requireCan } from '@/lib/auth/capabilities'
import { publicMessage } from '@/lib/http/errors'

/**
 * The crawler always targets the configured site URL; a client-supplied base
 * URL is not accepted (SSRF). Unknown keys such as `baseUrl` are stripped.
 */
const auditRunSchema = z.object({
  type: z.enum(['internal_db', 'live_crawl']).default('internal_db'),
  maxPages: z.number().int().min(1).max(50).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const report = await getLatestAuditReport()
    return NextResponse.json({
      data: report,
      errors: [],
      warnings: [],
    })
  } catch (err) {
    console.error('[audit] Failed to load latest audit report', err)
    return NextResponse.json(
      { data: null, errors: [publicMessage(err, 'Gagal memuat hasil audit SEO.')] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'seo:manage')
  if (auth.error) return auth.error

  const raw = await request.json().catch(() => ({}))
  const parsed = auditRunSchema.safeParse(raw ?? {})
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, errors: parsed.error.issues.map((i) => i.message), warnings: [] },
      { status: 400 }
    )
  }

  try {
    if (parsed.data.type === 'live_crawl') {
      const crawlReport = await runLiveCrawler({ maxPages: parsed.data.maxPages ?? 30 })
      return NextResponse.json({
        data: crawlReport,
        message: `Live crawl berhasil dijalankan pada ${crawlReport.crawledPages} halaman.`,
        errors: [],
        warnings: [],
      })
    }

    // Default: Layer 1 In-Database Audit
    const auditReport = await runInternalDatabaseAudit()
    return NextResponse.json({
      data: auditReport,
      message: `Audit data internal berhasil diselesaikan. Ditemukan ${auditReport.summary.totalIssues} isu (${auditReport.summary.criticalCount} kritis).`,
      errors: [],
      warnings: [],
    })
  } catch (err) {
    console.error('[audit] Audit run failed', err)
    return NextResponse.json(
      { data: null, errors: [publicMessage(err, 'Gagal menjalankan audit situs.')] },
      { status: 500 }
    )
  }
}
