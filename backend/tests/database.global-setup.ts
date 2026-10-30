import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import dotenv from 'dotenv'
import type { TestProject } from 'vitest/node'

const { Client } = createRequire(import.meta.url)('pg')
export default async function setup(project: TestProject) {
  dotenv.config({ path: '.env.local', quiet: true })
  dotenv.config({ path: '.env', quiet: true })
  const supplied = process.env.TEST_DATABASE_URL
  if (supplied) {
    if (!/^\/segia_(?:verify|test)_[a-z0-9_]+$/.test(new URL(supplied).pathname)) throw new Error('TEST_DATABASE_URL must identify a disposable segia_verify_* or segia_test_* database.')
    project.provide('isolatedDatabaseUrl', supplied)
    return
  }
  const connection = process.env.TEST_DATABASE_SOURCE_URL || process.env.DATABASE_URL
  if (!connection) throw new Error('Tests require a local PostgreSQL source for an isolated disposable clone.')
  const source = new URL(connection)
  const name = `segia_test_${Date.now()}_${randomBytes(4).toString('hex')}`
  const target = new URL(source)
  target.pathname = `/${name}`
  const client = new Client({ connectionString: source.href })
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'segia-test-clone-'))
  const archive = path.join(directory, 'source.dump')
  const env = { ...process.env, PGHOST: source.hostname, PGPORT: source.port || '5432', PGUSER: decodeURIComponent(source.username), PGPASSWORD: decodeURIComponent(source.password), PGDATABASE: decodeURIComponent(source.pathname.slice(1)) }
  if (source.searchParams.get('sslmode')) Object.assign(env, { PGSSLMODE: source.searchParams.get('sslmode')! })
  let created = false
  try {
    await client.connect()
    // Read-only snapshot of the source. Test mutations run only against the clone.
    execFileSync('pg_dump', ['--format=custom', '--no-password', '--file', archive], { env, stdio: 'pipe' })
    fs.chmodSync(archive, 0o600)
    await client.query(`CREATE DATABASE "${name}"`)
    created = true
    execFileSync('pg_restore', ['--exit-on-error', '--no-owner', '--no-privileges', '--dbname', name, archive], { env, stdio: 'pipe' })
    project.provide('isolatedDatabaseUrl', target.href)
  } catch {
    if (created) await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
    await client.end()
    throw new Error('Isolated test database setup failed. Verify local PostgreSQL and pg_dump/pg_restore; tests were not allowed to write to the application database.')
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
  return async () => {
    try { await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`) }
    finally { await client.end() }
  }
}
