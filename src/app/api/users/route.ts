import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireCan } from '@/lib/auth/capabilities'
import { hashPasswordScrypt } from '@/lib/auth/crypto'

const roleSchema = z.enum(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'AUTHOR', 'REVIEWER', 'SEO_MANAGER', 'MEDIA_MANAGER'])
const nameSchema = z.string().trim().min(2, 'Nama pengguna minimal 2 karakter.').max(120, 'Nama terlalu panjang.')
const passwordSchema = z.string().min(8, 'Kata sandi minimal 8 karakter.').max(256, 'Kata sandi terlalu panjang.')

const createSchema = z.object({
  name: nameSchema,
  email: z.string().trim().toLowerCase().email('Format alamat email tidak valid.').max(254),
  role: roleSchema,
  password: passwordSchema,
})

const updateSchema = z
  .object({
    id: z.string().min(1, 'ID pengguna harus disertakan.').max(100),
    name: nameSchema.optional(),
    role: roleSchema.optional(),
    password: passwordSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.role !== undefined || v.password !== undefined, {
    message: 'Tidak ada perubahan yang dikirimkan.',
  })

const BOOTSTRAP_ID = 'bootstrap-super-admin'
const bootstrapEmail = () => process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim() || null

/** DB stores roles lowercase (`super_admin`); the API speaks the canonical uppercase form. */
const toApiRole = (stored: string | null | undefined): string => (stored || 'editor').toUpperCase()

const firstIssue = (err: z.ZodError) => err.issues[0]?.message || 'Data tidak valid.'

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch (err) {
    console.warn('[api/users] Invalid JSON body:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireCan(request, 'user:manage')
  if (auth.error) return auth.error

  try {
    const dbUsers = await prisma.orm.public.User.all()
    const users = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: toApiRole(u.role),
      createdAt: u.createdAt ? String(u.createdAt) : null,
      isBootstrap: false,
    }))

    const boot = bootstrapEmail()
    if (boot && !users.some((u) => u.email.toLowerCase() === boot)) {
      users.unshift({ id: BOOTSTRAP_ID, name: 'Bootstrap Super Admin', email: boot, role: 'SUPER_ADMIN', createdAt: null, isBootstrap: true })
    }

    return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/users GET] Failed to list users:', err)
    return NextResponse.json({ error: 'Gagal mengambil daftar pengguna.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'user:manage')
  if (auth.error) return auth.error

  const parsed = createSchema.safeParse(await readJson(request))
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
  const { name, email, role, password } = parsed.data

  if (role === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Hanya Super Admin yang dapat menunjuk Super Admin baru.' }, { status: 403 })
  }
  if (email === bootstrapEmail()) {
    return NextResponse.json({ error: 'Email sudah digunakan oleh akun bootstrap.' }, { status: 409 })
  }

  try {
    const existing = await prisma.orm.public.User.where({ email }).first()
    if (existing) return NextResponse.json({ error: 'Email sudah terdaftar untuk pengguna lain.' }, { status: 409 })

    const created = await prisma.orm.public.User.create({
      id: `usr_${crypto.randomBytes(6).toString('hex')}`,
      name,
      email,
      role: role.toLowerCase(),
      passwordHash: await hashPasswordScrypt(password),
    })

    return NextResponse.json(
      {
        ok: true,
        message: 'Pengguna baru berhasil ditambahkan.',
        user: { id: created.id, name: created.name, email: created.email, role, createdAt: created.createdAt ? String(created.createdAt) : null, isBootstrap: false },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[api/users POST] Failed to create user:', err)
    return NextResponse.json({ error: 'Gagal membuat pengguna baru.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCan(request, 'user:manage')
  if (auth.error) return auth.error

  const parsed = updateSchema.safeParse(await readJson(request))
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
  const { id, name, role, password } = parsed.data

  if (id === BOOTSTRAP_ID) {
    return NextResponse.json({ error: 'Akun bootstrap diatur lewat env server dan tidak dapat diubah di sini.' }, { status: 400 })
  }
  if (role === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Hanya Super Admin yang dapat mempromosikan ke Super Admin.' }, { status: 403 })
  }

  try {
    const existing = await prisma.orm.public.User.where({ id }).first()
    if (!existing) return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })

    if (toApiRole(existing.role) === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Hanya Super Admin yang dapat mengubah akun Super Admin.' }, { status: 403 })
    }
    if (existing.id === auth.user.id && role && role !== toApiRole(existing.role)) {
      return NextResponse.json({ error: 'Anda tidak dapat mengubah peran akun Anda sendiri.' }, { status: 400 })
    }

    const updates: { name?: string; role?: string; passwordHash?: string } = {}
    if (name !== undefined) updates.name = name
    if (role !== undefined) updates.role = role.toLowerCase()
    if (password !== undefined) updates.passwordHash = await hashPasswordScrypt(password)

    await prisma.orm.public.User.where({ id }).update(updates)
    return NextResponse.json({ ok: true, message: 'Data pengguna berhasil diperbarui.' })
  } catch (err) {
    console.error('[api/users PATCH] Failed to update user:', err)
    return NextResponse.json({ error: 'Gagal memperbarui pengguna.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'user:manage')
  if (auth.error) return auth.error

  const idParsed = z.string().min(1).max(100).safeParse(request.nextUrl.searchParams.get('id'))
  if (!idParsed.success) return NextResponse.json({ error: 'ID pengguna harus disertakan.' }, { status: 400 })
  const id = idParsed.data

  if (id === auth.user.id) {
    return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 })
  }
  if (id === BOOTSTRAP_ID) {
    return NextResponse.json({ error: 'Akun bootstrap tidak dapat dihapus.' }, { status: 400 })
  }

  try {
    const existing = await prisma.orm.public.User.where({ id }).first()
    if (!existing) return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })

    if (toApiRole(existing.role) === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Hanya Super Admin yang dapat menghapus akun Super Admin.' }, { status: 403 })
    }
    if (existing.email.toLowerCase() === bootstrapEmail()) {
      return NextResponse.json({ error: 'Akun Super Admin utama tidak dapat dihapus.' }, { status: 400 })
    }
    if (auth.user.email && existing.email.toLowerCase() === auth.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 })
    }

    await prisma.orm.public.User.where({ id }).delete()
    return NextResponse.json({ ok: true, message: `Akun ${existing.name} (${existing.email}) dihapus.` })
  } catch (err) {
    console.error('[api/users DELETE] Failed to delete user:', err)
    return NextResponse.json({ error: 'Gagal menghapus pengguna.' }, { status: 500 })
  }
}
