/**
 * Purge Legacy Contacts Script
 * Replaces all outdated WordPress phone numbers and emails in SQLite database
 * with the canonical SegiaTech company credentials.
 *
 * Usage:
 *   npx tsx --conditions=react-server scripts/purge-legacy-contacts.ts --apply
 */
import { prisma } from '../src/lib/db/prisma'

async function main() {
  const isApply = process.argv.includes('--apply')
  console.log(`[CONTACTS-PURGE] Mode: ${isApply ? 'APPLY (live)' : 'DRY-RUN'}`)

  if (isApply) {
    // 1. Update articles table
    console.log('[CONTACTS-PURGE] Updating articles table...')
    await prisma.raw(`
      UPDATE articles
      SET content = REPLACE(content, '6283121138821', '6285227702811')
      WHERE content LIKE '%6283121138821%';
    `)
    await prisma.raw(`
      UPDATE articles
      SET content = REPLACE(content, '831-2113-8821', '852-2770-2811')
      WHERE content LIKE '%831-2113-8821%';
    `)
    await prisma.raw(`
      UPDATE articles
      SET content = REPLACE(content, '851-9065-9525', '852-2770-2811')
      WHERE content LIKE '%851-9065-9525%';
    `)
    await prisma.raw(`
      UPDATE articles
      SET content = REPLACE(content, 'indo@segiatech.com', 'contact@segiatech.com')
      WHERE content LIKE '%indo@segiatech.com%';
    `)

    // 2. Update services table
    console.log('[CONTACTS-PURGE] Updating services table...')
    await prisma.raw(`
      UPDATE services
      SET description = REPLACE(description, '6283121138821', '6285227702811')
      WHERE description LIKE '%6283121138821%';
    `)
    await prisma.raw(`
      UPDATE services
      SET description = REPLACE(description, '831-2113-8821', '852-2770-2811')
      WHERE description LIKE '%831-2113-8821%';
    `)
    await prisma.raw(`
      UPDATE services
      SET description = REPLACE(description, '851-9065-9525', '852-2770-2811')
      WHERE description LIKE '%851-9065-9525%';
    `)
    await prisma.raw(`
      UPDATE services
      SET description = REPLACE(description, 'indo@segiatech.com', 'contact@segiatech.com')
      WHERE description LIKE '%indo@segiatech.com%';
    `)
    await prisma.raw(`
      UPDATE services
      SET description = REPLACE(description, 'info@segiatech.com', 'contact@segiatech.com')
      WHERE description LIKE '%info@segiatech.com%';
    `)

    console.log('[CONTACTS-PURGE] Database update complete!')
  } else {
    console.log('[CONTACTS-PURGE] Dry run finished. Run with --apply to execute.')
  }
}

main().catch((err) => {
  console.error('[CONTACTS-PURGE] Error:', err)
  process.exit(1)
})
