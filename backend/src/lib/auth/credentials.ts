import { prisma } from '@/lib/db/prisma'
import { verifyPasswordScrypt } from './crypto'
export { getValidatedAuthSecret } from './secret'

export async function validateCredentials(emailInput?: unknown, passwordInput?: unknown) {
  if (!emailInput || !passwordInput) {
    return null
  }

  const email = String(emailInput).toLowerCase().trim()
  const password = String(passwordInput)

  if (!email || !password) {
    return null
  }

  // 2. Check Database users table with scrypt password verification
  try {
    const u = await prisma.orm.public.User.where({ email }).first()
    if (u && !u.passwordHash) return null
    if (u && u.passwordHash) {
      const isValid = await verifyPasswordScrypt(password, u.passwordHash)
      if (!isValid) return null

      const roleMap: Record<string, string> = {
        super_admin: 'SUPER_ADMIN',
        content_admin: 'CONTENT_ADMIN',
        editor: 'EDITOR',
        author: 'AUTHOR',
        reviewer: 'REVIEWER',
        seo_manager: 'SEO_MANAGER',
        media_manager: 'MEDIA_MANAGER',
      }
      const role = roleMap[u.role.toLowerCase()]
      if (!role) return null
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role,
      }
    }
  } catch (dbErr) {
    console.warn('[NextAuth] Database user query error:', dbErr)
    return null
  }

  // 1. Verify against temporary bootstrap admin from environment
  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim()
  const bootstrapHash = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH?.trim()

  if (bootstrapEmail && bootstrapHash && email === bootstrapEmail) {
    const isValid = await verifyPasswordScrypt(password, bootstrapHash)
    if (isValid) {
      return {
        id: 'bootstrap-super-admin',
        name: 'Bootstrap Super Admin',
        email: bootstrapEmail,
        role: 'SUPER_ADMIN',
      }
    }
    return null
  }

  return null
}
