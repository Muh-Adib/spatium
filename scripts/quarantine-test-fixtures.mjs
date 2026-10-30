/** Exact legacy test signatures only. Dry-run by default; reversible JSON quarantine. */
import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'
dotenv.config({ path: '.env.local', quiet: true })
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
const selections = {
  gsc_daily: { sql: '(page, query) IN (SELECT * FROM unnest($1::text[], $2::text[])) AND date = ANY($3::text[])', args: [['/test-page-1', '/test-page-strike', '/test-page-top', '/test-page-a', '/test-page-b', '/test-page-low-ctr', '/test-page-decay'], ['test query', 'striking query test', 'top 1 query test', 'cannibalized query', 'cannibalized query', 'low ctr high rank query', 'decay query 1'], ['2026-09-01', '2026-10-20']] },
  redirects: { sql: '(source_path, destination_path) IN (SELECT * FROM unnest($1::text[], $2::text[]))', args: [['/test-chain-a', '/test-chain-b', '/test-loop-a', '/test-loop-b', '/test-self'], ['/test-chain-b', '/test-chain-c', '/test-loop-b', '/test-loop-a', '/test-self']] },
  legacy_urls: { sql: 'legacy_url = ANY($1::text[])', args: [['/test-legacy-1', '/test-legacy-unmapped']] },
  keyword_bank: { sql: "keyword = 'decay query 1' AND locale = 'id' AND status = 'planned' AND coalesce(gsc_clicks,0) = 0 AND coalesce(gsc_impressions,0) = 0 AND target_content_id IS NULL AND notes IS NULL", args: [] },
}
await client.connect()
try {
  await client.query('BEGIN')
  if (process.argv.includes('--restore')) {
    const file = process.argv[process.argv.indexOf('--restore') + 1]
    const archive = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (archive.format !== 'segia-test-quarantine-v1') throw Error('Unknown quarantine format')
    for (const [table, rows] of Object.entries(archive.rows)) {
      if (!Object.hasOwn(selections, table) || !Array.isArray(rows)) throw Error('Invalid quarantine table')
      let count = 0
      for (const row of rows) {
        const keys = Object.keys(row)
        if (keys.some((key) => !/^[a-z_]+$/.test(key))) throw Error('Invalid column')
        const result = await client.query(`INSERT INTO "${table}" (${keys.map((key) => `"${key}"`).join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT DO NOTHING`, Object.values(row))
        count += result.rowCount
      }
      console.log(`${table}: restored ${count}; existing conflicting rows preserved`)
    }
  } else {
    const rows = {}
    for (const [table, selection] of Object.entries(selections)) {
      rows[table] = (await client.query(`SELECT * FROM "${table}" WHERE ${selection.sql} FOR UPDATE`, selection.args)).rows
      console.log(`${table}: ${rows[table].length} exact fixture matches`)
    }
    if (process.argv.includes('--apply')) {
      const output = path.resolve('backups', `test-fixtures-${Date.now()}.json`)
      fs.mkdirSync(path.dirname(output), { recursive: true })
      fs.writeFileSync(output, JSON.stringify({ format: 'segia-test-quarantine-v1', archivedAt: new Date().toISOString(), rows }), { mode: 0o600, flag: 'wx' })
      for (const [table, entries] of Object.entries(rows)) {
        if (entries.length) await client.query(`DELETE FROM "${table}" WHERE id = ANY($1::int[])`, [entries.map((row) => row.id)])
      }
      console.log('Quarantine saved:', output)
    } else console.log('Dry-run only; pass --apply to quarantine exact matches.')
  }
  await client.query('COMMIT')
} catch { await client.query('ROLLBACK'); process.exitCode = 1; console.error('Fixture quarantine failed; database transaction rolled back.') }
finally { await client.end() }
