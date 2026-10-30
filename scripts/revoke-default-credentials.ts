import { prisma } from '../src/lib/db/prisma'
import { verifyPasswordScrypt } from '../src/lib/auth/crypto'

const KNOWN_DEFAULT_SALT = '5ad671ad137562aff501c4b61cc68a4a'

export interface RevokeReport {
  applied: boolean
  usersScanned: number
  usersRevoked: Array<{
    id: string
    email: string
    role: string
    action: string
  }>
  brandsUpdated: number
  backupPath?: string
  timestamp: string
}

export async function revokeDefaultCredentials(options: { apply?: boolean } = {}): Promise<RevokeReport> {
  const isApply = Boolean(options.apply)
  const timestamp = new Date().toISOString()

  let backupPath: string | undefined

  // Scan all users with non-null password_hash
  const allUsers = await prisma.orm.public.User.all()
  const targetUsers: typeof allUsers = []

  for (const user of allUsers) {
    if (!user.passwordHash) continue

    // Check either known default hash prefix or scrypt password match for 'segiatech'
    if (user.passwordHash.startsWith(`scrypt:${KNOWN_DEFAULT_SALT}:`)) {
      targetUsers.push(user)
      continue
    }

    try {
      const isSegiatechPassword = await verifyPasswordScrypt('segiatech', user.passwordHash)
      if (isSegiatechPassword) {
        targetUsers.push(user)
      }
    } catch {
      // Ignore verification errors for malformed hashes
    }
  }

  const usersRevokedList: RevokeReport['usersRevoked'] = targetUsers.map((u: any) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    action: isApply ? 'REVOKED_PASSWORD_HASH_SET_TO_NULL' : 'WOULD_REVOKE_PASSWORD_HASH',
  }))

  if (isApply) {
    // Revoke user password hashes
    for (const u of targetUsers) {
      await prisma.orm.public.User.where({ id: u.id })
        .update({ passwordHash: null })

      await prisma.orm.public.SeoAuditLog.create({
        entityType: 'user',
        entityId: u.id,
        action: 'REVOKE_DEFAULT_CREDENTIALS',
        actor: 'system',
        diff: JSON.stringify({
          email: u.email,
          previousRole: u.role,
          reason: 'Hardcoded default password hash detected and revoked (L0 Security Policy)',
        }),
      })
    }
  }

  return {
    applied: isApply,
    usersScanned: allUsers.length,
    usersRevoked: usersRevokedList,
    brandsUpdated: 0,
    backupPath,
    timestamp,
  }
}

if (require.main === module || process.argv[1]?.endsWith('revoke-default-credentials.ts')) {
  const isApply = process.argv.includes('--apply')
  revokeDefaultCredentials({ apply: isApply })
    .then((report) => {
      console.log(JSON.stringify(report, null, 2))
      if (!isApply) {
        console.log('\n[DRY RUN] No database writes were performed. Run with `--apply` to commit changes.')
      } else {
        console.log('\n[APPLIED] Default credentials revoked and secrets sanitized successfully.')
      }
    })
    .catch((err) => {
      console.error('[ERROR] Failed to revoke credentials:', err)
      process.exit(1)
    })
}
