import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import { z } from 'zod'

/**
 * Site-relative path only: leading single slash, no scheme, no `//host` or
 * backslashes (browsers treat both as another origin → open redirect).
 */
const sitePath = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(500, `${label} maksimal 500 karakter.`)
    .transform((val) => (val.startsWith('/') ? val : `/${val}`))
    .refine((val) => !val.startsWith('//') && !val.includes('\\') && !/\s/.test(val) && !/^\/[a-z][a-z0-9+.-]*:/i.test(val), {
      message: `${label} harus berupa path di situs ini (mis. /portfolio/nama), bukan URL luar.`,
    })

const redirectInputSchema = z.object({
  sourcePath: sitePath('Source path'),
  destinationPath: sitePath('Destination path'),
  statusCode: z.number().int().refine((c) => [301, 302, 307, 308].includes(c), {
    message: 'Status code harus 301, 302, 307, atau 308',
  }).default(301),
  reason: z.string().max(300, 'Alasan maksimal 300 karakter.').optional().default('Kustom admin studio'),
  active: z.boolean().optional().default(true),
})

const stripSlash = (p: string) => p.replace(/\/+$/, '') || '/'

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
    const allRedirects = await prisma.orm.public.Redirect.orderBy((r) => r.id.desc()).all()
    let filtered = allRedirects
    if (search) {
      const s = search.toLowerCase()
      filtered = allRedirects.filter(
        (r) =>
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
    const body: unknown = await request.json().catch(() => null)
    const parsed = redirectInputSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first?.message || 'Data redirect tidak valid.', issues: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) },
        { status: 422 }
      )
    }

    const { sourcePath, destinationPath, statusCode, reason, active } = parsed.data

    // Loop detection: source cannot equal destination
    if (stripSlash(sourcePath) === stripSlash(destinationPath)) {
      return NextResponse.json(
        { error: 'Loop terdeteksi: source path tidak boleh sama dengan destination path.' },
        { status: 400 }
      )
    }

    // Two-step loop: the destination already redirects back to this source.
    const reverse = await prisma.orm.public.Redirect.where({ sourcePath: destinationPath, active: true }).first()
    if (reverse && stripSlash(reverse.destinationPath) === stripSlash(sourcePath)) {
      return NextResponse.json(
        { error: `Loop terdeteksi: "${destinationPath}" sudah dialihkan ke "${sourcePath}".` },
        { status: 400 }
      )
    }

    const existing = await prisma.orm.public.Redirect.where({ sourcePath }).first()

    const ruleId = await prisma.transaction(async (tx) => {
      let id: number
      if (existing) {
        await tx.orm.public.Redirect.where({ id: existing.id }).update({ destinationPath, statusCode, reason, active })
        id = existing.id
      } else {
        const inserted = await tx.orm.public.Redirect.create({
          documentId: `redir_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sourcePath,
          destinationPath,
          statusCode,
          reason,
          active,
        })
        id = inserted.id
      }
      await tx.orm.public.SeoAuditLog.create({
        entityType: 'redirect',
        entityId: sourcePath,
        action: existing ? 'UPDATE_REDIRECT' : 'CREATE_REDIRECT',
        actor: user.name,
        diff: JSON.stringify({ before: existing ?? null, sourcePath, destinationPath, statusCode, reason, active }),
      })
      return id
    })

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

    const numericId = id ? Number(id) : NaN
    if (id && (!Number.isInteger(numericId) || numericId <= 0)) {
      return NextResponse.json({ error: 'ID redirect tidak valid.' }, { status: 400 })
    }
    const existing = id
      ? await prisma.orm.public.Redirect.where({ id: numericId }).first()
      : sourcePath
        ? await prisma.orm.public.Redirect.where({ sourcePath }).first()
        : null

    if (!existing) {
      return NextResponse.json({ error: 'Aturan redirect tidak ditemukan.' }, { status: 404 })
    }

    await prisma.transaction(async (tx) => {
      await tx.orm.public.Redirect.where({ id: existing.id }).delete()
      await tx.orm.public.SeoAuditLog.create({
        entityType: 'redirect',
        entityId: existing.sourcePath,
        action: 'DELETE_REDIRECT',
        actor: user.name,
        diff: JSON.stringify(existing),
      })
    })

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
