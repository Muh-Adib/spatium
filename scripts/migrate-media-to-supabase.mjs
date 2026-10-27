import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

// Read credentials from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : ''
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

const BUCKET_NAME = 'article-images'
const USER_AGENT = 'Mozilla/5.0 (compatible; UNIMASI-MediaMigrator/1.0)'

// In-memory mapping to avoid re-uploading identical images
// Key: original WP url, Value: Supabase Storage public url
const urlCache = new Map()

// Concurrency limit for image processing
const CONCURRENCY = 6

function deriveStoragePath(wpUrl) {
  try {
    const urlObj = new URL(wpUrl)
    let pathname = urlObj.pathname
    // Remove leading /wp-content/uploads/ or /uploads/
    pathname = pathname.replace(/^\/(?:wp-content\/)?uploads\//i, '')
    // Clean characters
    pathname = pathname.replace(/[^a-zA-Z0-9.\-_/]/g, '-')
    return `wp/${pathname}`
  } catch {
    const filename = wpUrl.split('/').pop()?.split('?')[0] || 'image.webp'
    return `wp/misc/${Date.now()}-${filename}`
  }
}

async function fetchWithRetry(url, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      })
      if (res.ok) return res
      if (res.status === 404) return null
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
  return null
}

async function migrateSingleImage(wpUrl) {
  if (!wpUrl || !wpUrl.includes('wp-content')) {
    return wpUrl
  }

  // Already uploaded in this session?
  if (urlCache.has(wpUrl)) {
    return urlCache.get(wpUrl)
  }

  const storagePath = deriveStoragePath(wpUrl)

  try {
    const res = await fetchWithRetry(wpUrl)
    if (!res) {
      console.warn(`  [WARN] Failed to fetch (404/network): ${wpUrl}`)
      return wpUrl
    }

    const contentType = res.headers.get('content-type') || 'image/webp'
    const arrayBuf = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        upsert: true,
        contentType,
      })

    if (uploadError) {
      console.warn(`  [WARN] Storage upload failed for ${wpUrl}: ${uploadError.message}`)
      return wpUrl
    }

    const { data: pubData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    const newPublicUrl = pubData.publicUrl
    urlCache.set(wpUrl, newPublicUrl)
    return newPublicUrl
  } catch (err) {
    console.warn(`  [WARN] Error migrating image ${wpUrl}:`, err.message)
    return wpUrl
  }
}

async function main() {
  console.log('='.repeat(65))
  console.log('UNIMASI Media Migration: WordPress uploads -> Supabase Storage')
  console.log('Bucket:', BUCKET_NAME)
  console.log('='.repeat(65))

  // Fetch all posts with id, featured_image_url, yoast_og_image, content
  console.log('Loading all posts from Supabase database...')
  const allPosts = []
  let from = 0
  const pageSize = 500

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, featured_image_url, yoast_og_image, content')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Error fetching posts:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    allPosts.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  console.log(`Loaded ${allPosts.length} total posts.`)

  // Filter posts that still have WordPress URLs
  const postsToProcess = allPosts.filter((p) => {
    const featHasWp = p.featured_image_url && p.featured_image_url.includes('wp-content')
    const ogHasWp = p.yoast_og_image && p.yoast_og_image.includes('wp-content')
    const contentHasWp = p.content && p.content.includes('wp-content')
    return featHasWp || ogHasWp || contentHasWp
  })

  console.log(`Posts requiring media migration: ${postsToProcess.length} of ${allPosts.length}`)

  if (postsToProcess.length === 0) {
    console.log('All posts already use Supabase Storage images! Nothing to migrate.')
    return
  }

  let processedCount = 0
  let uploadedImagesCount = 0
  const startTime = Date.now()

  // Process posts in concurrency chunks
  for (let i = 0; i < postsToProcess.length; i += CONCURRENCY) {
    const chunk = postsToProcess.slice(i, i + CONCURRENCY)

    await Promise.all(
      chunk.map(async (post) => {
        let hasChanges = false
        const updates = {}

        // 1. Featured image
        if (post.featured_image_url && post.featured_image_url.includes('wp-content')) {
          const isCached = urlCache.has(post.featured_image_url)
          const newUrl = await migrateSingleImage(post.featured_image_url)
          if (newUrl && newUrl !== post.featured_image_url) {
            updates.featured_image_url = newUrl
            hasChanges = true
            if (!isCached) uploadedImagesCount++
          }
        }

        // 2. Yoast OG image
        if (post.yoast_og_image && post.yoast_og_image.includes('wp-content')) {
          const isCached = urlCache.has(post.yoast_og_image)
          const newOg = await migrateSingleImage(post.yoast_og_image)
          if (newOg && newOg !== post.yoast_og_image) {
            updates.yoast_og_image = newOg
            hasChanges = true
            if (!isCached) uploadedImagesCount++
          }
        }

        // 3. Inline images in content
        if (post.content && post.content.includes('wp-content')) {
          let updatedContent = post.content
          const wpMatches = post.content.match(/https?:\/\/[^\s"'<>]+\.(?:webp|png|jpg|jpeg|gif|svg)/gi) || []
          const uniqueWpMatches = Array.from(new Set(wpMatches.filter((u) => u.includes('wp-content'))))

          for (const wpUrl of uniqueWpMatches) {
            const isCached = urlCache.has(wpUrl)
            const newUrl = await migrateSingleImage(wpUrl)
            if (newUrl && newUrl !== wpUrl) {
              updatedContent = updatedContent.split(wpUrl).join(newUrl)
              hasChanges = true
              if (!isCached) uploadedImagesCount++
            }
          }

          if (updatedContent !== post.content) {
            updates.content = updatedContent
          }
        }

        // 4. Update row in Supabase
        if (hasChanges) {
          updates.updated_at = new Date().toISOString()
          const { error: updateError } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', post.id)

          if (updateError) {
            console.warn(`  [WARN] Failed to update post #${post.id}: ${updateError.message}`)
          }
        }

        processedCount++
      })
    )

    // Progress Log
    const percent = Math.round((processedCount / postsToProcess.length) * 100)
    const elapsedSec = Math.round((Date.now() - startTime) / 1000)
    console.log(
      `[${processedCount}/${postsToProcess.length}] (${percent}%) | Uploaded: ${uploadedImagesCount} files | Cached: ${urlCache.size} | Elapsed: ${elapsedSec}s`
    )
  }

  const totalTimeSec = Math.round((Date.now() - startTime) / 1000)
  console.log('='.repeat(65))
  console.log('MEDIA MIGRATION COMPLETE!')
  console.log(`Total posts processed: ${processedCount}`)
  console.log(`Unique images uploaded to Supabase Storage: ${uploadedImagesCount}`)
  console.log(`Total execution time: ${totalTimeSec}s`)
  console.log('='.repeat(65))
}

main().catch((err) => {
  console.error('Fatal error during media migration:', err)
  process.exit(1)
})
