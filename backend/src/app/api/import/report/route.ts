import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'
import { contentHash, localContentHash, normalizeWordPressSource } from '@/lib/import/wp-client'

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error
  try {
    const params = request.nextUrl.searchParams
    const jobId = params.get('jobId')
    const job = jobId ? await prisma.orm.public.ImportJob.where({ id: jobId }).first() : await prisma.orm.public.ImportJob.orderBy((j) => j.createdAt.desc()).first()
    if (!job?.sourceUrl) return NextResponse.json({ error: 'Job impor tidak ditemukan.' }, { status: 404 })
    const sourceUrl = normalizeWordPressSource(job.sourceUrl)
    const rows = await prisma.orm.public.WordPressSnapshot.where({ sourceUrl }).orderBy((s) => s.id.asc()).all()
    if (params.get('download') === 'source') {
      return new NextResponse(JSON.stringify({ sourceUrl, exportedAt: new Date().toISOString(), snapshots: rows.map((row) => ({ ...row, payload: JSON.parse(row.payload) })) }), {
        headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="wordpress-source-archive.json"', 'Cache-Control': 'private, no-store' },
      })
    }
    const counts: Record<string, number> = {}
    const issues: Array<{ snapshotId: number; type: string; wpId: number; reason: string }> = []
    let sourceHashesVerified = 0, targetsVerified = 0
    for (const row of rows) {
      if (job.startedAt && new Date(row.syncedAt).getTime() < new Date(job.startedAt).getTime()) issues.push({ snapshotId: row.id, type: row.entityType, wpId: row.wpId, reason: 'Entitas tidak ditemukan dalam sinkronisasi terakhir; arsip lama dipertahankan.' })
      counts[row.entityType] = (counts[row.entityType] || 0) + 1
      if (contentHash(JSON.parse(row.payload)) === row.sourceHash) sourceHashesVerified++
      else issues.push({ snapshotId: row.id, type: row.entityType, wpId: row.wpId, reason: 'Hash arsip sumber tidak cocok.' })
      if (row.entityType === 'posts' || row.entityType === 'pages') {
        const target = row.targetId ? (row.entityType === 'posts' ? await prisma.orm.public.Article.where({ id: row.targetId }).first() : await prisma.orm.public.Page.where({ id: row.targetId }).first()) : null
        if (!target) issues.push({ snapshotId: row.id, type: row.entityType, wpId: row.wpId, reason: row.error || 'Konten tujuan belum tersimpan.' })
        else if (!row.localHash || localContentHash(target) !== row.localHash) issues.push({ snapshotId: row.id, type: row.entityType, wpId: row.wpId, reason: row.error || 'Konten lokal berubah setelah sinkronisasi.' })
        else targetsVerified++
      }
    }
    const report = job.report ? JSON.parse(job.report) : {}
    return NextResponse.json({ sourceUrl, jobId: job.id, coverage: report.coverage || 'unknown', jobStatus: job.status, counts, sourceHashesVerified, targetsVerified, issues, complete: job.status === 'completed' && report.coverage === 'complete_export' && issues.length === 0 && sourceHashesVerified === rows.length }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[wordpress-report] Verification failed', error)
    return NextResponse.json({ error: 'Laporan integritas tidak dapat dibuat.' }, { status: 500 })
  }
}
