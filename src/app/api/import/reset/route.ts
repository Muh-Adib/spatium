import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { db } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    if (!body?.confirm) {
      return NextResponse.json(
        { error: 'Reset massal dinonaktifkan untuk menjaga konten, arsip, dan redirect. Gunakan konfirmasi eksplisit.' },
        { status: 409 }
      )
    }

    if (body.entity === 'articles') {
      await db.execute(db.sql.public.articles.delete().build())
      await db.execute(db.sql.public.import_jobs.delete().build())
      await db.execute(db.sql.public.wordpress_snapshots.delete().build())
      return NextResponse.json({
        success: true,
        message: 'Seluruh artikel lokal dan riwayat impor berhasil dibersihkan.',
      })
    }

    return NextResponse.json({ error: 'Entitas reset tidak didukung.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memproses reset.' }, { status: 500 })
  }
}

