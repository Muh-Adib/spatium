import { NextRequest, NextResponse } from 'next/server'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'
import {
  getAllClientLogos,
  createClientLogo,
  updateClientLogo,
  deleteClientLogo,
} from '@/lib/db/clientLogos'
import { z } from 'zod'

const clientLogoInputSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, 'Nama klien wajib diisi'),
  logoUrl: z.string().min(1, 'URL logo wajib diisi'),
  altText: z.string().optional(),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const data = await getAllClientLogos()
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal memuat logo klien', details: err.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const body = await request.json()
    const parsed = clientLogoInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', issues: parsed.error.format() },
        { status: 422 }
      )
    }

    const { id, name, logoUrl, altText, order, isActive } = parsed.data

    let result
    if (id) {
      result = await updateClientLogo(id, { name, logoUrl, altText, order, isActive })
    } else {
      result = await createClientLogo({ name, logoUrl, altText, order, isActive })
    }

    // Audit log
    try {
      await prisma.orm.public.SeoAuditLog.create({
        entityType: 'client_logo',
        entityId: String(id || name),
        action: id ? 'UPDATE_CLIENT_LOGO' : 'CREATE_CLIENT_LOGO',
        actor: user.name,
        diff: JSON.stringify({ name, logoUrl, altText, order, isActive }),
      })
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Logo klien "${name}" berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal menyimpan logo klien', details: err.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Parameter id diperlukan.' }, { status: 400 })
    }

    await deleteClientLogo(Number(id))

    // Audit log
    try {
      await prisma.orm.public.SeoAuditLog.create({
        entityType: 'client_logo',
        entityId: id,
        action: 'DELETE_CLIENT_LOGO',
        actor: user.name,
      })
    } catch (err) { console.warn("[API observable error]:", err) }

    return NextResponse.json({
      success: true,
      message: `Logo klien dengan ID ${id} berhasil dihapus oleh ${user.name}.`,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal menghapus logo klien', details: err.message },
      { status: 500 }
    )
  }
}
