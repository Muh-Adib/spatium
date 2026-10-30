/**
 * WordPress Migration CLI Runner
 * Executes WordPress REST API migration for SegiaTech, Unimasi, and Erfo Multimedia.
 *
 * Usage:
 *   npx tsx --conditions=react-server scripts/run-wp-migration.ts --source=https://www.segiatech.com --brand=segiatech
 *   npx tsx --conditions=react-server scripts/run-wp-migration.ts --source=https://www.unimasi.com --brand=unimasi
 *   npx tsx --conditions=react-server scripts/run-wp-migration.ts --source=https://www.erfomultimedia.com --brand=erfomultimedia
 */

import { prisma } from '../src/lib/db/prisma'
import { importFromWordPressRest } from '../src/lib/import/wp-rest'

async function main() {
  const args = process.argv.slice(2)
  const sourceArg = args.find((a) => a.startsWith('--source='))
  const brandArg = args.find((a) => a.startsWith('--brand='))

  const siteUrl = sourceArg ? sourceArg.split('=')[1].trim() : 'https://www.segiatech.com'
  const brand = (brandArg ? brandArg.split('=')[1].trim() : 'segiatech') as 'segiatech' | 'unimasi' | 'erfomultimedia'

  console.log(`================================================================`)
  console.log(`🚀 Inisiasi WordPress Migration Engine (WebShift Architecture)`)
  console.log(`📍 Sumber Target : ${siteUrl}`)
  console.log(`🏷️ Profil Brand  : ${brand.toUpperCase()}`)
  console.log(`================================================================\n`)

  const jobId = `cli-import-${brand}-${Date.now()}`

  // Create import job record in database
  await prisma.orm.public.ImportJob.create({
    id: jobId,
    source: 'wordpress_rest',
    sourceUrl: siteUrl,
    status: 'pending',
    startedAt: new Date().toISOString(),
    imported: 0,
    skipped: 0,
    errors: 0,
    totalPosts: 0,
  })

  const startTime = Date.now()

  try {
    const result = await importFromWordPressRest({
      siteUrl,
      jobId,
      brand,
      onProgress: (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.imported / progress.total) * 100)
          process.stdout.write(`\r⏳ [${pct}%] ${progress.imported}/${progress.total} artikel — ${progress.message}`)
        } else {
          process.stdout.write(`\r⏳ ${progress.message}`)
        }
      },
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n\n✅ Migrasi Selesai dalam ${duration}s!`)
    console.log(`📊 Total Artikel Berhasil Diimpor : ${result.imported}`)
    console.log(`📄 Total Halaman Berhasil Diimpor : ${result.importedPages}`)
    console.log(`❌ Total Kesalahan                : ${result.errors.length}`)

    // Query stats from database
    const totalArticles = (await prisma.orm.public.Article.limit(5000).all()).length
    const totalRedirects = (await prisma.orm.public.Redirect.limit(5000).all()).length
    const totalLegacyUrls = (await prisma.orm.public.LegacyUrl.limit(5000).all()).length

    console.log(`\n📦 Status Database Terkini:`)
    console.log(`   - Articles    : ${totalArticles} rows`)
    console.log(`   - Redirects   : ${totalRedirects} rows`)
    console.log(`   - Legacy URLs : ${totalLegacyUrls} rows`)
  } catch (err: any) {
    console.error(`\n❌ Migrasi Gagal:`, err.message || err)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Fatal CLI Error:', e)
  process.exit(1)
})
