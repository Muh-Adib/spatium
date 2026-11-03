import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/lib/db/prisma'

const SEED_FILE = path.resolve(process.cwd(), 'src/data/seed/seed_articles.json')

interface WpPost {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  modified: string
  yoast_head_json?: {
    title?: string
    description?: string
    canonical?: string
    og_title?: string
    og_description?: string
    og_image?: Array<{ url: string }>
    schema?: any
  }
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; title?: { rendered: string } }>
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>
    author?: Array<{ id: number; name: string; slug: string; description?: string }>
  }
}

function cleanHtmlText(html: string): string {
  return html
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

async function fetchWpPosts(perPage = 60): Promise<WpPost[]> {
  console.log(`Fetching ${perPage} posts from unimasi.com WP REST API...`)
  const url = `https://www.unimasi.com/wp-json/wp/v2/posts?per_page=${perPage}&_embed=true`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'UNIMASI-Studio-Sync/1.0',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch WP posts: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as WpPost[]
}

async function main() {
  const wpPosts = await fetchWpPosts(60)
  console.log(`Retrieved ${wpPosts.length} posts from unimasi.com.`)

  const formattedArticles = wpPosts.map((post) => {
    const rawTitle = cleanHtmlText(post.title.rendered)
    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
    const coverUrl = featuredMedia?.source_url || '/images/showcase/3d-immersive.webp'
    
    // Category from taxonomy
    const termCategories = post._embedded?.['wp:term']?.[0] || []
    const primaryCat = termCategories[0] || { id: 6751, name: 'Artikel', slug: 'artikel' }
    
    // Author
    const authorData = post._embedded?.author?.[0] || { id: 1, name: 'Tim Redaksi', slug: 'tim-redaksi' }

    // Reading time estimation
    const words = post.content.rendered.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    const readingTime = Math.max(3, Math.ceil(words / 180))

    const cleanExcerpt = cleanHtmlText(
      post.excerpt.rendered.replace(/<[^>]+>/g, '').slice(0, 260) + '…'
    )

    return {
      id: post.id,
      documentId: `art-${post.slug}`,
      title: rawTitle,
      slug: post.slug,
      excerpt: cleanExcerpt,
      content: post.content.rendered,
      coverUrl,
      featuredImage: {
        url: coverUrl,
        name: rawTitle,
      },
      category: {
        id: primaryCat.id,
        name: cleanHtmlText(primaryCat.name),
        slug: primaryCat.slug,
      },
      author: {
        id: authorData.id,
        name: authorData.name,
        slug: authorData.slug || 'tim-redaksi',
        role: 'Author',
      },
      readingTime,
      publishedAt: post.date,
      createdAt: post.date,
      status: 'published',
      wpPostId: post.id,
      wpSourceUrl: `https://www.unimasi.com/${post.slug}/`,
      metaTitle: cleanHtmlText(post.yoast_head_json?.title || rawTitle),
      metaDescription: cleanHtmlText(post.yoast_head_json?.description || cleanExcerpt),
      canonicalUrl: post.yoast_head_json?.canonical || `https://unimasi.studio/journal/${post.slug}`,
      ogImage: post.yoast_head_json?.og_image?.[0]?.url || coverUrl,
    }
  })

  // Write to src/data/seed/seed_articles.json
  fs.writeFileSync(SEED_FILE, JSON.stringify(formattedArticles, null, 2), 'utf-8')
  console.log(`Saved ${formattedArticles.length} synchronized articles to ${SEED_FILE}`)

  // Seed directly to database using Prisma 8
  console.log('Synchronizing with Postgres database...')
  for (const art of formattedArticles) {
    // 1. Ensure Category
    let categoryId: number | null = null
    if (art.category?.slug) {
      const existingCat = await prisma.orm.public.Category.where({ slug: art.category.slug }).first()
      if (existingCat) {
        categoryId = existingCat.id
      } else {
        const newCat = await prisma.orm.public.Category.create({
          name: art.category.name,
          slug: art.category.slug,
          wpTermId: art.category.id,
        })
        categoryId = newCat.id
      }
    }

    // 2. Ensure Author
    let authorId: number | null = null
    if (art.author?.slug) {
      const existingAuth = await prisma.orm.public.Author.where({ slug: art.author.slug }).first()
      if (existingAuth) {
        authorId = existingAuth.id
      } else {
        const newAuth = await prisma.orm.public.Author.create({
          name: art.author.name,
          slug: art.author.slug,
        })
        authorId = newAuth.id
      }
    }

    // 3. Upsert Article
    const existingArticle = await prisma.orm.public.Article.where({ slug: art.slug }).first()
    if (existingArticle) {
      await prisma.orm.public.Article.where({ id: existingArticle.id }).update({
        title: art.title,
        excerpt: art.excerpt,
        content: art.content,
        coverUrl: art.coverUrl,
        featuredImage: art.coverUrl,
        metaTitle: art.metaTitle,
        metaDescription: art.metaDescription,
        canonicalUrl: art.canonicalUrl,
        ogImage: art.ogImage,
        readingTime: art.readingTime,
        publishedAt: art.publishedAt,
        status: 'published',
        categoryId,
        authorId,
        wpPostId: art.wpPostId,
        wpSourceUrl: art.wpSourceUrl,
      })
    } else {
      await prisma.orm.public.Article.create({
        documentId: art.documentId,
        title: art.title,
        slug: art.slug,
        excerpt: art.excerpt,
        content: art.content,
        coverUrl: art.coverUrl,
        featuredImage: art.coverUrl,
        metaTitle: art.metaTitle,
        metaDescription: art.metaDescription,
        canonicalUrl: art.canonicalUrl,
        ogImage: art.ogImage,
        readingTime: art.readingTime,
        publishedAt: art.publishedAt,
        status: 'published',
        categoryId,
        authorId,
        wpPostId: art.wpPostId,
        wpSourceUrl: art.wpSourceUrl,
      })
    }
  }

  const finalCount = await prisma.orm.public.Article.all()
  console.log(`Database sync complete! Total articles in DB: ${finalCount.length}`)
}

main()
  .catch((e) => {
    console.error('Sync failed:', e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
