import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import { z } from 'zod'

const redirectInputSchema = z.object({
  sourcePath: z
    .string()
    .min(1, 'Source path wajib diisi')
    .transform((val) => (val.startsWith('/') ? val : `/${val}`)),
  destinationPath: z
    .string()
    .min(1, 'Destination path wajib diisi')
    .transform((val) => (val.startsWith('/') ? val : `/${val}`)),
  statusCode: z.number().int().refine((c) => [301, 302, 307, 308].includes(c), {
    message: 'Status code harus 301, 302, 307, atau 308',
  }).default(301),
  reason: z.string().optional().default('Kustom admin studio'),
  active: z.boolean().optional().default(true),
})

// --- GET: List redirects with search and pagination -------------------------
export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() || ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25))
  const offset = (page - 1) * limit

  try {
    const allRedirects = await prisma.orm.public.Redirect.orderBy((r: any) => r.id.desc()).all()
    let filtered = allRedirects
    if (search) {
      const s = search.toLowerCase()
      filtered = allRedirects.filter(
        (r: any) =>
          r.sourcePath?.toLowerCase().includes(s) ||
          r.destinationPath?.toLowerCase().includes(s) ||
          r.reason?.toLowerCase().includes(s)
      )
    }

    const total = filtered.length
    const pageCount = Math.ceil(total / limit)
    const rows = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pageCount,
      },
    })
  } catch (err) {
    console.error('[API redirects] GET failed:', err)
    return NextResponse.json(
      { error: 'Gagal mengambil data redirects dari database' },
      { status: 500 }
    )
  }
}

// --- POST: Create or Update redirect rule -----------------------------------
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'SEO_MANAGER', 'EDITOR'])
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const body = await request.json()
    const parsed = redirectInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', issues: parsed.error.format() },
        { status: 422 }
      )
    }

    const { sourcePath, destinationPath, statusCode, reason, active } = parsed.data

    // Loop detection: source cannot equal destination
    if (sourcePath.replace(/\/$/, '') === destinationPath.replace(/\/$/, '')) {
      return NextResponse.json(
        { error: 'Loop terdeteksi: source path tidak boleh sama dengan destination path.' },
        { status: 400 }
      )
    }

    const existing = await prisma.orm.public.Redirect.where({ sourcePath }).first()
    let ruleId: number

    if (existing) {
      // Update
      await prisma.orm.public.Redirect.where({ id: existing.id }).update({
          destinationPath,
          statusCode,
          reason,
          active,
        })

      ruleId = existing.id
    } else {
      // Insert
      const inserted = await prisma.orm.public.Redirect.create({
          documentId: `redir_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sourcePath,
          destinationPath,
          statusCode,
          reason,
          active,
        })

      ruleId = inserted.id
    }

    // Audit Log
    try {
      await prisma.orm.public.SeoAuditLog.create({
          entityType: 'redirect',
          entityId: sourcePath,
          action: existing ? 'UPDATE_REDIRECT' : 'CREATE_REDIRECT',
          actor: user.name,
          diff: JSON.stringify({
            sourcePath,
            destinationPath,
            statusCode,
            reason,
          }),
        })
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      message: `Aturan redirect "${sourcePath} → ${destinationPath}" (${statusCode}) berhasil disimpan.`,
      id: ruleId,
      sourcePath,
      destinationPath,
    })
  } catch (err) {
    console.error('[API redirects] POST failed:', err)
    return NextResponse.json(
      { error: 'Gagal menyimpan aturan redirect' },
      { status: 500 }
    )
  }
}

// --- DELETE: Remove redirect rule -------------------------------------------
export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const sourcePath = searchParams.get('sourcePath')

    if (!id && !sourcePath) {
      return NextResponse.json(
        { error: 'Parameter id atau sourcePath diperlukan.' },
        { status: 400 }
      )
    }

    const existing = id
      ? await prisma.orm.public.Redirect.where({ id: Number(id) }).first()
      : await prisma.orm.public.Redirect.where({ sourcePath: sourcePath! }).first()

    if (!existing) {
      return NextResponse.json({ error: 'Aturan redirect tidak ditemukan.' }, { status: 404 })
    }

    await prisma.orm.public.Redirect.where({ id: existing.id }).delete()

    // Audit Log
    try {
      await prisma.orm.public.SeoAuditLog.create({
          entityType: 'redirect',
          entityId: existing.sourcePath,
          action: 'DELETE_REDIRECT',
          actor: user.name,
          diff: JSON.stringify(existing),
        })
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      message: `Aturan redirect "${existing.sourcePath}" berhasil dihapus oleh ${user.name}.`,
    })
  } catch (err) {
    console.error('[API redirects] DELETE failed:', err)
    return NextResponse.json(
      { error: 'Gagal menghapus aturan redirect' },
      { status: 500 }
    )
  }
}
