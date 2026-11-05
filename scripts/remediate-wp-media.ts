import fs from 'node:fs'
import path from 'node:path'
import { db } from '../prisma/db'
import {
  downloadAndOptimizeImage,
  localizeAndOptimizeContentImages,
} from '../src/lib/import/media-storage'

function extractCleanImageUrl(raw: any): string | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        return (
          parsed.url ||
          parsed.source_url ||
          parsed.src ||
          parsed.imageUrl ||
          parsed.coverUrl ||
          null
        )
      } catch {
        return null
      }
    }
    return trimmed
  }
  if (typeof raw === 'object') {
    return (
      raw.url ||
      raw.source_url ||
      raw.src ||
      raw.imageUrl ||
      raw.coverUrl ||
      null
    )
  }
  return null
}

async function remediateUnimasi() {
  console.log('🚀 Starting WP Media Remediation for Unimasi...')

  const articles = await db.orm.public.Article.all()
  console.log(`Found ${articles.length} articles in database.`)

  let updatedCount = 0
  let failedCount = 0

  // Process in concurrent batches of 8 to accelerate downloads
  const CONCURRENCY = 8
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY)

    await Promise.all(
      batch.map(async (art: any) => {
        try {
          // 1. Extract cover URL
          let rawCoverUrl = extractCleanImageUrl(art.featuredImage) || extractCleanImageUrl(art.coverUrl)

          // Fallback: if no cover, check if content has an image
          if (!rawCoverUrl && art.content) {
            const match = art.content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i)
            if (match) rawCoverUrl = match[1]
          }

          let localCoverUrl: string | null = null
          if (rawCoverUrl) {
            localCoverUrl = await downloadAndOptimizeImage(rawCoverUrl, 'articles', {
              altText: art.title,
              title: art.title,
            })
          }

          if (!localCoverUrl && typeof art.coverUrl === 'string' && art.coverUrl.startsWith('/uploads/')) {
            localCoverUrl = art.coverUrl
          }

          // 2. Localize inline content images
          let localizedContent = art.content || ''
          if (localizedContent) {
            localizedContent = await localizeAndOptimizeContentImages(localizedContent, 'articles', art.title)
          }

          // 3. Update database row with clean relative string paths
          await db.orm.public.Article.where({ id: art.id }).update({
            coverUrl: localCoverUrl || null,
            featuredImage: localCoverUrl || null,
            content: localizedContent,
          })

          updatedCount++
        } catch (err: any) {
          failedCount++
          console.error(`\n✖ Failed to remediate article #${art.id} (${art.slug}):`, err?.message || err)
        }
      })
    )

    process.stdout.write(`\r  Progress: ${updatedCount}/${articles.length} articles remediated`)
  }

  console.log(`\n\n✅ DB Remediation Complete: ${updatedCount} updated, ${failedCount} failed.`)

  // 4. Remediate src/data/seed/seed_articles.json
  const seedPath = path.resolve(process.cwd(), 'src/data/seed/seed_articles.json')
  if (fs.existsSync(seedPath)) {
    try {
      console.log(`Updating seed JSON file at ${seedPath}...`)
      const seedArticles = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))
      const updatedDbArticles = await db.orm.public.Article.all()
      const dbMap = new Map(updatedDbArticles.map((a: any) => [a.slug, a]))

      let seedUpdated = 0
      for (const item of seedArticles) {
        const dbRecord = dbMap.get(item.slug)
        if (dbRecord) {
          item.coverUrl = dbRecord.coverUrl
          item.featuredImage = dbRecord.coverUrl
          item.content = dbRecord.content
          seedUpdated++
        } else if (item.coverUrl) {
          const clean = extractCleanImageUrl(item.coverUrl) || extractCleanImageUrl(item.featuredImage)
          if (clean) {
            item.coverUrl = clean.startsWith('/uploads/') ? clean : item.coverUrl
            item.featuredImage = item.coverUrl
          }
        }
      }

      fs.writeFileSync(seedPath, JSON.stringify(seedArticles, null, 2), 'utf-8')
      console.log(`✅ Seed JSON updated successfully (${seedUpdated} items refreshed).`)
    } catch (err: any) {
      console.warn('⚠️ Warning: Failed to update seed_articles.json:', err?.message || err)
    }
  }

  // Check MediaItem count
  const mediaCount = (await db.orm.public.MediaItem.all()).length
  console.log(`📸 Total MediaItems registered in database: ${mediaCount}`)
}

remediateUnimasi()
  .catch((err) => {
    console.error('Fatal remediation error:', err)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
