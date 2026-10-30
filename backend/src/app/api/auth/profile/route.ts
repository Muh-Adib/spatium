import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser } from '@/lib/auth/rbac'
import { verifyPasswordScrypt, hashPasswordScrypt } from '@/lib/auth/crypto'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  let dbUser = null
  if (user.id !== 'bootstrap-super-admin' && user.email) {
    try {
      dbUser = await prisma.orm.public.User.where({ email: user.email.toLowerCase() }).first()
    } catch (err) {
      console.warn('[Profile GET] Database lookup failed:', err)
    }
  }

  return NextResponse.json({
    id: user.id,
    name: dbUser?.name || user.name,
    email: dbUser?.email || user.email || '',
    role: dbUser?.role?.toUpperCase() || user.role,
    isBootstrap: user.id === 'bootstrap-super-admin',
    createdAt: dbUser?.createdAt || null,
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const body = await request.json().catch(() => ({}))
    const { name, currentPassword, newPassword } = body

    const isBootstrap = user.id === 'bootstrap-super-admin'
    let updatedName: string | undefined = undefined

    // 1. Update Name
    if (typeof name === 'string' && name.trim()) {
      updatedName = name.trim()
      if (!isBootstrap && user.email) {
        const existing = await prisma.orm.public.User.where({ email: user.email.toLowerCase() }).first()
        if (existing) {
          await prisma.orm.public.User.where({ id: existing.id }).update({ name: updatedName })
        }
      }
    }

    // 2. Change Password
    if (currentPassword || newPassword) {
      if (isBootstrap) {
        return NextResponse.json(
          { error: 'Akun Bootstrap Admin dikonfigurasi melalui environment variable server (BOOTSTRAP_ADMIN_PASSWORD_HASH).' },
          { status: 400 }
        )
      }

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: 'Kata sandi saat ini dan kata sandi baru harus diisi.' },
          { status: 400 }
        )
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Kata sandi baru minimal 8 karakter.' },
          { status: 400 }
        )
      }

      const existing = await prisma.orm.public.User.where({ email: user.email!.toLowerCase() }).first()
      if (!existing || !existing.passwordHash) {
        return NextResponse.json(
          { error: 'Data pengguna tidak ditemukan di database.' },
          { status: 404 }
        )
      }

      const isValid = await verifyPasswordScrypt(currentPassword, existing.passwordHash)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Kata sandi saat ini salah.' },
          { status: 400 }
        )
      }

      const newHash = await hashPasswordScrypt(newPassword)
      await prisma.orm.public.User.where({ id: existing.id }).update({ passwordHash: newHash })
    }

    return NextResponse.json({
      ok: true,
      message: 'Profil akun berhasil diperbarui.',
      name: updatedName,
    })
  } catch (err: any) {
    console.error('[Profile PATCH] Error:', err)
    return NextResponse.json({ error: 'Gagal memperbarui profil akun.' }, { status: 500 })
  }
}

