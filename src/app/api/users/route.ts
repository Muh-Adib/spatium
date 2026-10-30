import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/rbac'
import { hashPasswordScrypt } from '@/lib/auth/crypto'
import { Role } from '@/lib/auth/types'

const ALLOWED_ROLES: Role[] = [
  'SUPER_ADMIN',
  'CONTENT_ADMIN',
  'EDITOR',
  'AUTHOR',
  'REVIEWER',
  'SEO_MANAGER',
  'MEDIA_MANAGER',
]

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const dbUsers = await prisma.orm.public.User.all()
    const users = dbUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role || 'editor').toUpperCase(),
      createdAt: u.createdAt,
      isBootstrap: false,
    }))

    // Masukkan data Bootstrap Super Admin dari env jika ada
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim()
    if (bootstrapEmail && !users.some((u: any) => u.email.toLowerCase() === bootstrapEmail)) {
      users.unshift({
        id: 'bootstrap-super-admin',
        name: 'Bootstrap Super Admin',
        email: bootstrapEmail,
        role: 'SUPER_ADMIN',
        createdAt: null,
        isBootstrap: true,
      })
    }

    return NextResponse.json({ users })
  } catch (err: any) {
    console.error('[API Users GET] Error:', err)
    return NextResponse.json({ error: 'Gagal mengambil daftar pengguna.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const { name, email, role, password } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama pengguna minimal 2 karakter.' }, { status: 400 })
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Format alamat email tidak valid.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Peran pengguna tidak valid.' }, { status: 400 })
    }

    // Role escalation safeguard: only SUPER_ADMIN can assign SUPER_ADMIN role
    if (role === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang dapat menunjuk Super Admin baru.' },
        { status: 403 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })
    }

    // Periksa duplikasi email
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim()
    if (bootstrapEmail && normalizedEmail === bootstrapEmail) {
      return NextResponse.json({ error: 'Email sudah digunakan oleh Bootstrap Super Admin.' }, { status: 409 })
    }

    const existing = await prisma.orm.public.User.where({ email: normalizedEmail }).first()
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar untuk pengguna lain.' }, { status: 409 })
    }

    // Hash kata sandi dengan scrypt
    const passwordHash = await hashPasswordScrypt(password)
    const id = `usr_${crypto.randomBytes(6).toString('hex')}`

    const created = await prisma.orm.public.User.create({
      id,
      name: name.trim(),
      email: normalizedEmail,
      role: role.toLowerCase(),
      passwordHash,
    })

    return NextResponse.json(
      {
        ok: true,
        message: 'Pengguna baru berhasil ditambahkan.',
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: role.toUpperCase(),
          createdAt: created.createdAt || new Date().toISOString(),
          isBootstrap: false,
        },
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[API Users POST] Error:', err)
    return NextResponse.json({ error: 'Gagal membuat pengguna baru.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const { id, name, role, password } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID pengguna harus disertakan.' }, { status: 400 })
    }

    if (id === 'bootstrap-super-admin') {
      return NextResponse.json(
        { error: 'Akun Bootstrap Admin dikonfigurasi melalui server env dan tidak dapat diubah di sini.' },
        { status: 400 }
      )
    }

    const existing = await prisma.orm.public.User.where({ id }).first()
    if (!existing) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    // Role protection: only SUPER_ADMIN can modify a SUPER_ADMIN account
    if (existing.role === 'super_admin' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang dapat mengubah akun Super Admin.' },
        { status: 403 }
      )
    }

    if (role === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang dapat mempromosikan ke Super Admin.' },
        { status: 403 }
      )
    }

    const updates: Record<string, any> = {}

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      updates.name = name.trim()
    }

    if (role && typeof role === 'string' && ALLOWED_ROLES.includes(role as Role)) {
      updates.role = role.toLowerCase()
    }

    if (password && typeof password === 'string') {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })
      }
      updates.passwordHash = await hashPasswordScrypt(password)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan yang dikirimkan.' }, { status: 400 })
    }

    await prisma.orm.public.User.where({ id }).update(updates)

    return NextResponse.json({
      ok: true,
      message: 'Data pengguna berhasil diperbarui.',
    })
  } catch (err: any) {
    console.error('[API Users PATCH] Error:', err)
    return NextResponse.json({ error: 'Gagal memperbarui pengguna.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN'])
  if (auth.error) return auth.error

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID pengguna harus disertakan.' }, { status: 400 })
    }

    if (id === auth.user.id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.' },
        { status: 400 }
      )
    }

    if (id === 'bootstrap-super-admin') {
      return NextResponse.json(
        { error: 'Akun Bootstrap Super Admin tidak dapat dihapus.' },
        { status: 400 }
      )
    }

    const existing = await prisma.orm.public.User.where({ id }).first()
    if (!existing) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    // Role protection: only SUPER_ADMIN can delete a SUPER_ADMIN account
    if (existing.role === 'super_admin' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang dapat menghapus akun Super Admin.' },
        { status: 403 }
      )
    }

    // Protect main super admin from being deleted
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim()
    if (bootstrapEmail && existing.email.toLowerCase() === bootstrapEmail) {
      return NextResponse.json(
        { error: 'Akun Super Admin utama tidak dapat dihapus.' },
        { status: 400 }
      )
    }

    await prisma.orm.public.User.where({ id }).delete()

    return NextResponse.json({
      ok: true,
      message: `Pengguna "${existing.name}" (${existing.email}) berhasil dihapus.`,
    })
  } catch (err: any) {
    console.error('[API Users DELETE] Error:', err)
    return NextResponse.json({ error: 'Gagal menghapus pengguna.' }, { status: 500 })
  }
}

