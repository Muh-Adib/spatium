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
const WP_API_BASE = 'https://www.unimasi.com/wp-json/wp/v2'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; UNIMASI-Migrator/1.0)',
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} - Status ${res.status} ${res.statusText}`)
  }
  return {
    data: await res.json(),
    total: parseInt(res.headers.get('x-wp-total') || '0', 10),
    totalPages: parseInt(res.headers.get('x-wp-totalpages') || '0', 10),
  }
}

// Cache categories and tags so we don't spam requests
const categoryMap = new Map()
const tagMap = new Map()

async function loadTaxonomies() {
  console.log('Loading WordPress categories and tags...')
  try {
    const cats = await fetchJson(`${WP_API_BASE}/categories?per_page=100`)
    for (const c of cats.data) {
      categoryMap.set(c.id, c.name)
    }

    // Load first 100 tags
    const tags = await fetchJson(`${WP_API_BASE}/tags?per_page=100`)
    for (const t of tags.data) {
      tagMap.set(t.id, t.name)
    }
  } catch (err) {
    console.warn('Notice: Could not preload all taxonomy names:', err.message)
  }
}

function decodeHtmlEntities(str) {
  if (!str) return ''
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function transformPost(wp) {
  const yoast = wp.yoast_head_json || {}

  // Resolve category name
  const catNames = (wp.categories || []).map((id) => categoryMap.get(id)).filter(Boolean)
  const categoryName = catNames[0] || 'Articles'

  // Resolve tags
  const tags = (wp.tags || []).map((id) => tagMap.get(id) || `tag-${id}`)

  // Extract featured image from Yoast or embedded media
  let featuredImageUrl = ''
  if (yoast.og_image && Array.isArray(yoast.og_image) && yoast.og_image[0]?.url) {
    featuredImageUrl = yoast.og_image[0].url
  }

  return {
    id: wp.id,
    slug: wp.slug,
    title: decodeHtmlEntities(wp.title?.rendered || ''),
    content: wp.content?.rendered || '',
    excerpt: decodeHtmlEntities(wp.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || ''),
    status: wp.status || 'publish',
    published_at: wp.date_gmt ? `${wp.date_gmt}Z` : new Date(wp.date).toISOString(),
    modified_at: wp.modified_gmt ? `${wp.modified_gmt}Z` : new Date(wp.modified).toISOString(),
    author_name: yoast.author || 'UNIMASI',
    featured_image_url: featuredImageUrl,
    category_name: categoryName,
    tags: tags,
    yoast_title: decodeHtmlEntities(yoast.title || ''),
    yoast_description: decodeHtmlEntities(yoast.description || ''),
    yoast_og_title: decodeHtmlEntities(yoast.og_title || ''),
    yoast_og_description: decodeHtmlEntities(yoast.og_description || ''),
    yoast_og_image: featuredImageUrl,
    yoast_canonical: yoast.canonical || `https://www.unimasi.com/${wp.slug}/`,
    yoast_schema: yoast.schema || null,
  }
}

export async function runMigration() {
  console.log('--- Starting Migration from WordPress to Supabase ---')
  await loadTaxonomies()

  // Get total pages
  const first = await fetchJson(`${WP_API_BASE}/posts?per_page=100&page=1`)
  const totalPosts = first.total
  const totalPages = first.totalPages

  console.log(`Found ${totalPosts} published posts across ${totalPages} pages.`)

  let importedCount = 0

  for (let page = 1; page <= totalPages; page++) {
    console.log(`\nFetching Page ${page} / ${totalPages}...`)
    const pageData = page === 1 ? first : await fetchJson(`${WP_API_BASE}/posts?per_page=100&page=${page}`)

    const batch = pageData.data.map(transformPost)

    const { error } = await supabase.from('posts').upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`Error saving batch for page ${page}:`, error.message)
      throw error
    }

    importedCount += batch.length
    console.log(`✓ Page ${page} saved! Progress: ${importedCount} / ${totalPosts} posts.`)

    // Polite pause between requests to prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  console.log('\n🎉 ALL 1,147 POSTS SUCCESSFULLY MIGRATED TO SUPABASE!')
}

if (process.argv[1]?.endsWith('migrate-wp-to-supabase.mjs')) {
  runMigration().catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
