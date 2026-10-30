import { NextRequest, NextResponse } from 'next/server'
import { normalizeWordPressSource } from '@/lib/import/wp-client'
import { validateSafeUrl } from '@/lib/security/ssrf'
import { prisma } from '@/lib/db/prisma'
import { importFromWordPressRest } from '@/lib/import/wp-rest'
import { requireRole } from '@/lib/auth/rbac'

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { siteUrl, username, applicationPassword, completeExport } = body

    if (!siteUrl || typeof siteUrl !== 'string') {
      return NextResponse.json({ error: 'siteUrl is required' }, { status: 400 })
    }

    if (completeExport !== undefined && typeof completeExport !== 'boolean') return NextResponse.json({ error: 'Mode ekspor tidak valid.' }, { status: 400 })
    if (completeExport && (!username || !applicationPassword)) return NextResponse.json({ error: 'Ekspor lengkap membutuhkan akun admin WordPress dan Application Password.' }, { status: 400 })
    const sourceUrl = normalizeWordPressSource(siteUrl)
    await validateSafeUrl(sourceUrl)
    if ((username && typeof username !== 'string') || (applicationPassword && typeof applicationPassword !== 'string') || !!username !== !!applicationPassword) {
      return NextResponse.json({ error: 'Username dan Application Password harus diisi bersama.' }, { status: 400 })
    }
    const running = await prisma.orm.public.ImportJob.where({ sourceUrl }).where((j) => j.status.eq('running')).first()
    if (running) return NextResponse.json({ error: 'Sinkronisasi sumber ini masih berjalan.', jobId: running.id }, { status: 409 })
    const jobId = `wp_import_${Date.now()}`
    await prisma.orm.public.ImportJob.create({
      id: jobId,
      source: 'wp_rest',
      sourceUrl,
      status: 'pending',
    })

    // Start background import
    importFromWordPressRest({ siteUrl: sourceUrl, jobId, username, applicationPassword, completeExport, actor: auth.user.id }).catch((err) => {
      console.error(`[WP Import API] Background import failed for ${jobId}:`, err)
    })

    return NextResponse.json({
      success: true,
      jobId,
      message: `Import job ${jobId} initiated for ${siteUrl}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
