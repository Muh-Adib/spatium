import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))
import { execFileSync } from 'node:child_process'
import { performBackup } from '../scripts/db-backup'
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks() })
describe('PostgreSQL backup', () => {
  it('passes credentials only through the child environment and validates the archive', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://fixture:private-password@localhost:5432/fixture')
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'webshift-backup-'))
    const file = path.join(dir, 'backup.dump')
    vi.mocked(execFileSync).mockImplementation((program) => { if (program === 'pg_dump') fs.writeFileSync(file, 'archive'); return Buffer.from('') })
    try {
      expect(performBackup(file).sizeBytes).toBe(7)
      const calls = vi.mocked(execFileSync).mock.calls
      expect(calls[0][0]).toBe('pg_dump')
      expect(JSON.stringify(calls[0][1])).not.toContain('private-password')
      expect(calls[1][0]).toBe('pg_restore')
      expect(fs.statSync(file).mode & 0o777).toBe(0o600)
      expect(() => performBackup(file)).toThrow('already exists')
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  })
  it('rejects obsolete SQLite configuration', () => {
    vi.stubEnv('DATABASE_URL', 'file:webshift.db')
    expect(() => performBackup()).toThrow('PostgreSQL')
    expect(execFileSync).not.toHaveBeenCalled()
  })
})
