import fs from 'node:fs'
import path from 'node:path'
import { db as prisma } from '../prisma/db'
import { downloadAndOptimizeImage, localizeAndOptimizeContentImages } from '../src/lib/import/media-storage'

const SEED_FILE = path.resolve(process.cwd(), 'src/data/seed/seed_articles.json')
const USER = 'Adib IT'
const PASS = 'QzU5D0gv4vXFHF@@QCc3^1)D'
const WP_RPC_URL = 'https://www.unimasi.com/xmlrpc.php'
const WP_REST_BASE = 'https://www.unimasi.com/wp-json/wp/v2'

interface ArticleItem {
  id: number
  documentId: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverUrl: string
  featuredImage: {
    url: string
    name: string
  }
  category: {
    id: number
    name: string
    slug: string
  }
  author: {
    id: number
    name: string
    slug: string
    role: string
  }
  readingTime: number
  publishedAt: string
  scheduledAt: string | null
  scheduledBy: string | null
  createdAt: string
  status: 'published' | 'scheduled' | 'draft'
  wpPostId: number
  wpSourceUrl: string
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  ogImage: string
}

function cleanHtmlText(text: string): string {
  if (!text) return ''
  return text
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function parseXmlValue(xml: string, key: string): string {
  const re = new RegExp(
    `<member>\\s*<name>${key}<\\/name>\\s*<value>(?:<string>|<dateTime\\.iso8601>)?([\\s\\S]*?)(?:<\\/(?:string|dateTime\\.iso8601)>)?<\\/value>\\s*<\\/member>`,
    'i'
  )
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

async function fetchPostIdsByStatusXmlRpc(status: string, limit = 100): Promise<number[]> {
  const xml = `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.getPosts</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${USER}</string></value></param>
    <param><value><string>${PASS}</string></value></param>
    <param>
      <value>
        <struct>
          <member><name>post_status</name><value><string>${status}</string></value></member>
          <member><name>number</name><value><int>${limit}</int></value></member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`

  const res = await fetch(WP_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
  })
  const text = await res.text()
  const ids: number[] = []
  const matches = text.matchAll(/<member>\s*<name>post_id<\/name>\s*<value>(?:<string>)?(\d+)/gi)
  for (const m of matches) {
    ids.push(Number(m[1]))
  }
  return ids
}

async function fetchSinglePostXmlRpc(id: number): Promise<any | null> {
  const xml = `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.getPost</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${USER}</string></value></param>
    <param><value><string>${PASS}</string></value></param>
    <param><value><int>${id}</int></value></param>
  </params>
</methodCall>`

  const res = await fetch(WP_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
  })
  const text = await res.text()

  const postId = Number(parseXmlValue(text, 'post_id') || id)
  const rawTitle = parseXmlValue(text, 'post_title')
  const title = cleanHtmlText(rawTitle)
  let slug = parseXmlValue(text, 'post_name')
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const content = parseXmlValue(text, 'post_content')
  let excerpt = cleanHtmlText(parseXmlValue(text, 'post_excerpt'))
  if (!excerpt && content) {
    excerpt = cleanHtmlText(content.slice(0, 240) + '…')
  }

  const status = parseXmlValue(text, 'post_status')
  let dateRaw = parseXmlValue(text, 'post_date') || parseXmlValue(text, 'post_date_gmt')
  let date = dateRaw
  if (dateRaw.length >= 15 && dateRaw.includes('T')) {
    const y = dateRaw.slice(0, 4)
    const m = dateRaw.slice(4, 6)
    const d = dateRaw.slice(6, 8)
    const rest = dateRaw.slice(8)
    date = `${y}-${m}-${d}${rest}`
  }

  const thumbMatch = text.match(
    /<member>\s*<name>post_thumbnail<\/name>[\s\S]*?<name>link<\/name>\s*<value><string>([^<]+)<\/string>/i
  )
  const coverUrl = thumbMatch ? thumbMatch[1].trim() : '/images/showcase/3d-immersive.webp'

  const yoastTitleMatch = text.match(
    /<member>\s*<name>key<\/name>\s*<value><string>_yoast_wpseo_title<\/string><\/value>\s*<\/member>\s*<member>\s*<name>value<\/name>\s*<value><string>([^<]+)<\/string>/i
  )
  const yoastDescMatch = text.match(
    /<member>\s*<name>key<\/name>\s*<value><string>_yoast_wpseo_metadesc<\/string><\/value>\s*<\/member>\s*<member>\s*<name>value<\/name>\s*<value><string>([^<]+)<\/string>/i
  )

  const yoastTitle = yoastTitleMatch ? cleanHtmlText(yoastTitleMatch[1]) : title
  const yoastDesc = yoastDescMatch ? cleanHtmlText(yoastDescMatch[1]) : excerpt

  const catNameMatch = text.match(
    /<member>\s*<name>taxonomy<\/name>\s*<value><string>category<\/string><\/value>[\s\S]*?<name>name<\/name>\s*<value><string>([^<]+)<\/string>/i
  )
  const catSlugMatch = text.match(
    /<member>\s*<name>taxonomy<\/name>\s*<value><string>category<\/string><\/value>[\s\S]*?<name>slug<\/name>\s*<value><string>([^<]+)<\/string>/i
  )
  const catIdMatch = text.match(
    /<member>\s*<name>taxonomy<\/name>\s*<value><string>category<\/string><\/value>[\s\S]*?<name>term_id<\/name>\s*<value>(?:<string>)?(\d+)/i
  )

  return {
    id: postId,
    title,
    slug,
    content,
    excerpt,
    status,
    date,
    coverUrl,
    categoryName: catNameMatch ? cleanHtmlText(catNameMatch[1]) : 'Artikel',
    categorySlug: catSlugMatch ? catSlugMatch[1].trim() : 'artikel',
    categoryId: catIdMatch ? Number(catIdMatch[1]) : 6751,
    yoastTitle,
    yoastDesc,
  }
}

async function fetchAllPublishedFromRest(): Promise<any[]> {
  const posts: any[] = []
  let page = 1
  console.log('Fetching published articles from WP REST API (/wp-json/wp/v2/posts)...')

  while (true) {
    const url = `${WP_REST_BASE}/posts?per_page=100&page=${page}`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        if (res.status === 400) break // All pages exhausted
        console.warn(`[REST] Page ${page} responded with status ${res.status}. Ending pagination.`)
        break
      }
      const batch = await res.json()
      if (!Array.isArray(batch) || batch.length === 0) break
      posts.push(...batch)
      console.log(`[REST] Page ${page}: fetched ${batch.length} posts (cumulative: ${posts.length})`)
      page++
    } catch (e: any) {
      console.error(`[REST] Error fetching page ${page}:`, e.message)
      break
    }
  }

  return posts
}

async function main() {
  console.log('======================================================')
  console.log(`UNIMASI STUDIO — WordPress Complete Content Synchronizer`)
  console.log(`Target: https://www.unimasi.com (Admin: ${USER})`)
  console.log('======================================================')

  const articleMap = new Map<string, ArticleItem>()

  // 1. Fetch ALL Scheduled ('future') articles via XML-RPC
  console.log('\n[1/4] Fetching Scheduled (future) articles via XML-RPC...')
  const futureIds = await fetchPostIdsByStatusXmlRpc('future', 100)
  console.log(`Found ${futureIds.length} scheduled posts:`, futureIds)

  for (const id of futureIds) {
    const raw = await fetchSinglePostXmlRpc(id)
    if (!raw || !raw.title) continue

    const words = (raw.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(3, Math.ceil(words / 180))

    const item: ArticleItem = {
      id: raw.id,
      documentId: `art-${raw.slug}`,
      title: raw.title,
      slug: raw.slug,
      excerpt: raw.excerpt,
      content: raw.content,
      coverUrl: raw.coverUrl,
      featuredImage: {
        url: raw.coverUrl,
        name: raw.title,
      },
      category: {
        id: raw.categoryId,
        name: raw.categoryName,
        slug: raw.categorySlug,
      },
      author: {
        id: 1,
        name: 'Tim Redaksi',
        slug: 'tim-redaksi',
        role: 'Author',
      },
      readingTime,
      publishedAt: raw.date,
      scheduledAt: raw.date,
      scheduledBy: USER,
      createdAt: raw.date,
      status: 'scheduled',
      wpPostId: raw.id,
      wpSourceUrl: `https://www.unimasi.com/${raw.slug}/`,
      metaTitle: raw.yoastTitle || raw.title,
      metaDescription: raw.yoastDesc || raw.excerpt,
      canonicalUrl: `https://unimasi.studio/journal/${raw.slug}`,
      ogImage: raw.coverUrl,
    }
    articleMap.set(raw.slug, item)
    console.log(`  ✓ Scheduled: "${raw.title}" (Date: ${raw.date})`)
  }

  // 2. Fetch ALL Draft ('draft') articles via XML-RPC
  console.log('\n[2/4] Fetching Draft articles via XML-RPC...')
  const draftIds = await fetchPostIdsByStatusXmlRpc('draft', 100)
  console.log(`Found ${draftIds.length} draft posts:`, draftIds)

  for (const id of draftIds) {
    const raw = await fetchSinglePostXmlRpc(id)
    if (!raw || !raw.title) continue

    const words = (raw.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(3, Math.ceil(words / 180))

    const item: ArticleItem = {
      id: raw.id,
      documentId: `art-${raw.slug}`,
      title: raw.title,
      slug: raw.slug,
      excerpt: raw.excerpt,
      content: raw.content,
      coverUrl: raw.coverUrl,
      featuredImage: {
        url: raw.coverUrl,
        name: raw.title,
      },
      category: {
        id: raw.categoryId,
        name: raw.categoryName,
        slug: raw.categorySlug,
      },
      author: {
        id: 1,
        name: 'Tim Redaksi',
        slug: 'tim-redaksi',
        role: 'Author',
      },
      readingTime,
      publishedAt: raw.date,
      scheduledAt: null,
      scheduledBy: null,
      createdAt: raw.date,
      status: 'draft',
      wpPostId: raw.id,
      wpSourceUrl: `https://www.unimasi.com/${raw.slug}/`,
      metaTitle: raw.yoastTitle || raw.title,
      metaDescription: raw.yoastDesc || raw.excerpt,
      canonicalUrl: `https://unimasi.studio/journal/${raw.slug}`,
      ogImage: raw.coverUrl,
    }
    articleMap.set(raw.slug, item)
    console.log(`  ✓ Draft: "${raw.title}"`)
  }

  // 3. Fetch ALL Published articles via REST API (fast batching across all 12 pages)
  console.log('\n[3/4] Fetching Published articles via WP REST API...')
  const publishedRestPosts = await fetchAllPublishedFromRest()
  console.log(`Total published posts retrieved from REST API: ${publishedRestPosts.length}`)

  for (const p of publishedRestPosts) {
    const rawTitle = p.title?.rendered || ''
    const title = cleanHtmlText(rawTitle)
    let slug = p.slug
    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }

    // Skip if already recorded as scheduled or draft
    if (articleMap.has(slug)) {
      continue
    }

    const content = p.content?.rendered || ''
    let excerpt = cleanHtmlText(p.excerpt?.rendered || '')
    if (!excerpt && content) {
      excerpt = cleanHtmlText(content.slice(0, 240) + '…')
    }

    const coverUrl =
      p.yoast_head_json?.og_image?.[0]?.url ||
      '/images/showcase/3d-immersive.webp'

    const yoastTitle = cleanHtmlText(p.yoast_head_json?.title || title)
    const yoastDesc = cleanHtmlText(p.yoast_head_json?.description || excerpt)

    const date = p.date ? p.date.replace(' ', 'T') : new Date().toISOString()
    const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(3, Math.ceil(words / 180))

    const item: ArticleItem = {
      id: p.id,
      documentId: `art-${slug}`,
      title,
      slug,
      excerpt,
      content,
      coverUrl,
      featuredImage: {
        url: coverUrl,
        name: title,
      },
      category: {
        id: p.categories?.[0] || 6751,
        name: 'Artikel',
        slug: 'artikel',
      },
      author: {
        id: 1,
        name: 'Tim Redaksi',
        slug: 'tim-redaksi',
        role: 'Author',
      },
      readingTime,
      publishedAt: date,
      scheduledAt: null,
      scheduledBy: null,
      createdAt: date,
      status: 'published',
      wpPostId: p.id,
      wpSourceUrl: `https://www.unimasi.com/${slug}/`,
      metaTitle: yoastTitle,
      metaDescription: yoastDesc,
      canonicalUrl: `https://unimasi.studio/journal/${slug}`,
      ogImage: coverUrl,
    }

    articleMap.set(slug, item)
  }

  const allArticles = Array.from(articleMap.values())
  console.log(`\nTotal parsed unique articles: ${allArticles.length}`)

  const scheduledCount = allArticles.filter((a) => a.status === 'scheduled').length
  const draftCount = allArticles.filter((a) => a.status === 'draft').length
  const publishedCount = allArticles.filter((a) => a.status === 'published').length
  console.log(
    `Summary: ${publishedCount} Published, ${scheduledCount} Scheduled, ${draftCount} Drafts.`
  )

  // Save to JSON seed file
  fs.writeFileSync(SEED_FILE, JSON.stringify(allArticles, null, 2), 'utf-8')
  console.log(`✓ Saved ${allArticles.length} articles to ${SEED_FILE}`)

  // 4. Upsert into Database via Prisma 8 ORM
  console.log('\n[4/4] Upserting articles into PostgreSQL database via Prisma 8 ORM...')
  let upsertedCount = 0

  // Ensure default Category and Author
  let defaultCategory = await prisma.orm.public.Category.where({ slug: 'artikel' }).first()
  if (!defaultCategory) {
    defaultCategory = await prisma.orm.public.Category.create({
      name: 'Artikel',
      slug: 'artikel',
      wpTermId: 6751,
    })
  }

  let defaultAuthor = await prisma.orm.public.Author.where({ slug: 'tim-redaksi' }).first()
  if (!defaultAuthor) {
    defaultAuthor = await prisma.orm.public.Author.create({
      name: 'Tim Redaksi',
      slug: 'tim-redaksi',
    })
  }

  for (const art of allArticles) {
    upsertedCount++
    if (upsertedCount % 50 === 0 || upsertedCount === allArticles.length) {
      process.stdout.write(`\rUpserting articles into DB [${upsertedCount}/${allArticles.length}]...`)
    }

    let localCover = art.coverUrl
    if (localCover && (localCover.startsWith('http://') || localCover.startsWith('https://'))) {
      try {
        const optimized = await downloadAndOptimizeImage(localCover, 'articles', {
          altText: art.title,
          title: art.title,
        })
        if (optimized) localCover = optimized
      } catch (e) {
        console.warn(`[Sync] Failed to localize cover for ${art.slug}:`, e)
      }
    }

    let localContent = art.content
    try {
      localContent = await localizeAndOptimizeContentImages(art.content, 'articles', art.title)
    } catch {}

    const existingArticle = await prisma.orm.public.Article.where({ slug: art.slug }).first()
    if (existingArticle) {
      await prisma.orm.public.Article.where({ id: existingArticle.id }).update({
        title: art.title,
        excerpt: art.excerpt,
        content: localContent,
        coverUrl: localCover,
        featuredImage: localCover,
        metaTitle: art.metaTitle,
        metaDescription: art.metaDescription,
        canonicalUrl: art.canonicalUrl,
        ogImage: localCover || art.ogImage,
        readingTime: art.readingTime,
        publishedAt: art.publishedAt,
        scheduledAt: art.scheduledAt,
        scheduledBy: art.scheduledBy,
        status: art.status,
        categoryId: defaultCategory.id,
        authorId: defaultAuthor.id,
        wpPostId: art.wpPostId,
        wpSourceUrl: art.wpSourceUrl,
      })
    } else {
      await prisma.orm.public.Article.create({
        documentId: art.documentId,
        title: art.title,
        slug: art.slug,
        excerpt: art.excerpt,
        content: localContent,
        coverUrl: localCover,
        featuredImage: localCover,
        metaTitle: art.metaTitle,
        metaDescription: art.metaDescription,
        canonicalUrl: art.canonicalUrl,
        ogImage: localCover || art.ogImage,
        readingTime: art.readingTime,
        publishedAt: art.publishedAt,
        scheduledAt: art.scheduledAt,
        scheduledBy: art.scheduledBy,
        status: art.status,
        categoryId: defaultCategory.id,
        authorId: defaultAuthor.id,
        wpPostId: art.wpPostId,
        wpSourceUrl: art.wpSourceUrl,
      })
    }
  }

  process.stdout.write('\n')
  const totalInDb = await prisma.orm.public.Article.all()
  console.log(`\n🎉 Synchronisation complete! Total articles in DB: ${totalInDb.length}`)
}

main()
  .catch((e) => {
    console.error('Fatal sync error:', e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
