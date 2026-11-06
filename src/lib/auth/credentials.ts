import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import { verifyPasswordScrypt, hashPasswordScrypt } from './crypto'
export { getValidatedAuthSecret } from './secret'

function constantTimeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch (err) {
    console.warn('[auth] constantTimeEqual failed:', err)
    return false
  }
}

async function verifyAnyPassword(password: string, storedSecret: string): Promise<boolean> {
  if (!password || !storedSecret) return false
  if (storedSecret.startsWith('scrypt:')) {
    return verifyPasswordScrypt(password, storedSecret)
  }
  // Plaintext fallback (e.g. env var entered directly in Coolify UI)
  return constantTimeEqual(password, storedSecret)
}

export async function validateCredentials(emailInput?: unknown, passwordInput?: unknown) {
  if (!emailInput || !passwordInput) {
    return null
  }

  const rawInput = String(emailInput).trim()
  const email = rawInput.toLowerCase()
  const password = String(passwordInput)

  if (!email || !password) {
    return null
  }

  const roleMap: Record<string, string> = {
    super_admin: 'SUPER_ADMIN',
    administrator: 'SUPER_ADMIN',
    admin: 'SUPER_ADMIN',
    content_admin: 'CONTENT_ADMIN',
    editor: 'EDITOR',
    author: 'AUTHOR',
    reviewer: 'REVIEWER',
    seo_manager: 'SEO_MANAGER',
    media_manager: 'MEDIA_MANAGER',
  }

  // 1. Check Database users table with scrypt password verification
  try {
    let u = await prisma.orm.public.User.where({ email }).first()
    if (!u) {
      // Support login via username / display name
      const allUsers = await prisma.orm.public.User.all()
      u =
        allUsers.find(
          (user) =>
            user.name.toLowerCase() === rawInput.toLowerCase() ||
            user.id.toLowerCase() === `usr_${rawInput.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        ) || null
    }

    if (u && u.passwordHash) {
      const isValid = await verifyAnyPassword(password, u.passwordHash)
      if (isValid) {
        const role = roleMap[u.role.toLowerCase()]
        if (!role) {
          // Unknown roles get no access rather than silently becoming SUPER_ADMIN.
          console.warn(`[auth] Login refused: unknown role "${u.role}" for ${u.email}`)
          return null
        }
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role,
        }
      }
    }
  } catch (dbErr) {
    console.warn('[NextAuth] Database user query warning:', dbErr)
  }

  // 2. Verify against temporary bootstrap admin from environment
  const bootstrapEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@spatium.id').toLowerCase().trim()
  const bootstrapSecret =
    process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH?.trim() ||
    process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim()

  const isBootstrapEmailMatch = email === bootstrapEmail

  if (isBootstrapEmailMatch && bootstrapSecret) {
    const isValid = await verifyAnyPassword(password, bootstrapSecret)
    if (isValid) {
      void syncUserRecord(bootstrapEmail, 'Bootstrap Super Admin', password)
      return {
        id: 'bootstrap-super-admin',
        name: 'Bootstrap Super Admin',
        email: bootstrapEmail,
        role: 'SUPER_ADMIN',
      }
    }
  }

  // No hardcoded fallback accounts: recovery goes through BOOTSTRAP_ADMIN_* env
  // or `scripts/create-superadmin.ts`.
  return null
}

async function syncUserRecord(email: string, name: string, plainPassword: string) {
  try {
    const existing = await prisma.orm.public.User.where({ email }).first()
    const passwordHash = await hashPasswordScrypt(plainPassword)
    if (existing) {
      await prisma.orm.public.User.where({ id: existing.id }).update({
        passwordHash,
      })
    } else {
      await prisma.orm.public.User.create({
        id: `usr_${email.replace(/[^a-z0-9]+/g, '_')}`,
        name,
        email,
        role: 'super_admin',
        passwordHash,
      })
    }
  } catch (err) {
    console.warn(`[auth] syncUserRecord failed for ${email}:`, err)
  }
}
