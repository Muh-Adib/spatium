import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { config } from 'dotenv'

export function performBackup(customDest?: string): { success: boolean; backupPath: string; sizeBytes: number } {
  config({ path: '.env.local', quiet: true })
  config({ path: '.env', quiet: true })
  const connection = process.env.DATABASE_URL
  if (!connection || !/^postgres(ql)?:\/\//.test(connection)) {
    throw new Error('DATABASE_URL must identify the active PostgreSQL database.')
  }
  const url = new URL(connection)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const destination = path.resolve(customDest || path.join('backups', `backup-${timestamp}.dump`))
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  if (fs.existsSync(destination)) throw new Error('Backup destination already exists; choose a new file.')
  // Credentials are passed in the child environment, never command arguments or logs.
  const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password) }
  const sslmode = url.searchParams.get('sslmode')
  if (sslmode) Object.assign(env, { PGSSLMODE: sslmode })
  try {
    execFileSync('pg_dump', ['--format=custom', '--no-password', '--file', destination], { env, stdio: 'pipe' })
    execFileSync('pg_restore', ['--list', destination], { stdio: 'pipe' })
    fs.chmodSync(destination, 0o600)
    const sizeBytes = fs.statSync(destination).size
    if (!sizeBytes) throw new Error('empty backup')
    return { success: true, backupPath: destination, sizeBytes }
  } catch {
    fs.rmSync(destination, { force: true })
    throw new Error('PostgreSQL backup failed. Verify pg_dump/pg_restore availability, server version, connection and disk access. No backup was retained.')
  }
}

if (process.argv[1]?.endsWith('db-backup.ts')) {
  try { const result = performBackup(); console.log(`[db:backup] Verified archive: ${result.backupPath} (${result.sizeBytes} bytes)`) }
  catch (error) { console.error(error instanceof Error ? error.message : 'Backup failed'); process.exitCode = 1 }
}
