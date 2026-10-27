import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/PageHero'
import { CTASection } from '@/components/ui/CTASection'
import { Icon } from '@/components/Icon'
import { supabase } from '@/lib/supabase'
import '@/pages/article.css'

const SITE_URL = 'https://unimasi.studio'

export const revalidate = 3600

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'publish')
    .order('published_at', { ascending: false })
    .limit(50)

  return (data || []).map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publish')
    .single()

  if (!post) return { title: 'Article Not Found' }

  const title = post.yoast_title || post.title
  const description = post.yoast_description || post.excerpt
  const canonical = post.yoast_canonical || `${SITE_URL}/${post.slug}/`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title: post.yoast_og_title || title,
      description: post.yoast_og_description || description,
      url: canonical,
      publishedTime: post.published_at,
      modifiedTime: post.modified_at,
      images: post.yoast_og_image ? [post.yoast_og_image] : [],
      authors: [post.author_name || 'UNIMASI'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.yoast_og_title || title,
      description: post.yoast_og_description || description,
    },
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

interface TocItem {
  id: string
  text: string
  level: number
}

function processArticleContent(rawContent: string, pageTitle: string): {
  html: string
  toc: TocItem[]
} {
  let content = rawContent || ''

  // 1. Remove duplicate first heading if it repeats the article title
  const titleNorm = decodeHtmlEntities(pageTitle)
    .toLowerCase()
    .replace(/[^\w]/g, '')

  content = content.replace(/^\s*<h2[^>]*>(.*?)<\/h2>/i, (match, headingText) => {
    const headingNorm = decodeHtmlEntities(headingText.replace(/<[^>]+>/g, ''))
      .toLowerCase()
      .replace(/[^\w]/g, '')
    if (headingNorm === titleNorm || (headingNorm.length > 10 && titleNorm.includes(headingNorm))) {
      return ''
    }
    return match
  })

  // 2. Normalize internal domain links to root-relative paths
  content = content.replace(/https?:\/\/(www\.)?unimasi\.com\//gi, '/')

  // 3. Extract TOC headings and inject unique IDs
  const toc: TocItem[] = []
  const seenSlugs = new Set<string>()

  content = content.replace(/<h([2-3])([^>]*)>(.*?)<\/h\1>/gi, (match, levelStr, attrs, innerText) => {
    const rawText = decodeHtmlEntities(innerText.replace(/<[^>]+>/g, '')).trim()
    if (!rawText) return match

    let slug = rawText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60)

    if (!slug) slug = 'section'
    let uniqueSlug = slug
    let counter = 1
    while (seenSlugs.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter++}`
    }
    seenSlugs.add(uniqueSlug)

    const level = parseInt(levelStr, 10)
    toc.push({
      id: uniqueSlug,
      text: rawText,
      level,
    })

    const cleanedAttrs = attrs.replace(/\sid="[^"]*"/gi, '')
    return `<h${levelStr} id="${uniqueSlug}"${cleanedAttrs}>${innerText}</h${levelStr}>`
  })

  return { html: content, toc }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publish')
    .single()

  if (error || !post) {
    notFound()
  }

  const { html: processedContent, toc } = processArticleContent(post.content || '', post.title)
  const headerExcerpt =
    post.yoast_description || (post.excerpt && post.excerpt.length <= 250 ? post.excerpt : '')

  const hasAside = toc.length > 0 || (post.tags && post.tags.length > 0)
  const minHeadingLevel = toc.length > 0 ? Math.min(...toc.map((t) => t.level)) : 2

  const words = (post.content || '').replace(/<[^>]+>/g, '').split(/\s+/).length
  const readMinutes = Math.max(1, Math.round(words / 200))

  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <>
      {post.yoast_schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.yoast_schema) }}
        />
      ) : null}

      <article className="article">
        <header className="article__header">
          <div className="bg-grid article__grid" aria-hidden="true" />
          <div className="container container--wide article__header-inner">
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Articles', to: '/journal' },
                { label: post.category_name || 'Articles' },
                { label: post.title },
              ]}
            />

            <div className="article__header-top">
              <span className="pill pill--accent">{post.category_name || 'Articles'}</span>
              <span className="mono article__read">{readMinutes} min read</span>
            </div>

            <h1 className="article__title display-lg">{post.title}</h1>
            {headerExcerpt ? <p className="lede article__excerpt">{headerExcerpt}</p> : null}

            <dl className="article__meta">
              <div>
                <dt>Published</dt>
                <dd>
                  <time dateTime={post.published_at}>{dateStr}</time>
                </dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{post.author_name || 'UNIMASI'}</dd>
              </div>
              <div>
                <dt>Topic</dt>
                <dd>{post.category_name || 'Articles'}</dd>
              </div>
            </dl>
          </div>
        </header>

        <div
          className={`container container--wide article__layout ${
            hasAside ? 'article__layout--has-aside' : 'article__layout--single'
          }`}
        >
          {hasAside ? (
            <aside className="article__aside">
              <div className="article-toc">
                {toc.length > 0 ? (
                  <>
                    <p className="mono article-toc__label">In this article</p>
                    <ol className="article-toc__list">
                      {(() => {
                        let topCounter = 0
                        return toc.map((item) => {
                          const isTop = item.level === minHeadingLevel
                          const num = isTop ? ++topCounter : null
                          return (
                            <li
                              key={item.id}
                              className={`article-toc__item ${
                                isTop ? 'article-toc__item--primary' : 'article-toc__item--sub'
                              }`}
                            >
                              <a href={`#${item.id}`}>
                                {num !== null ? (
                                  <span className="mono article-toc__num">
                                    {String(num).padStart(2, '0')}
                                  </span>
                                ) : null}
                                <span className="article-toc__text">{item.text}</span>
                              </a>
                            </li>
                          )
                        })
                      })()}
                    </ol>
                  </>
                ) : null}

                {post.tags && post.tags.length > 0 ? (
                  <div className="article-toc__tags">
                    <p className="mono article-toc__label">Tags</p>
                    <ul className="article__tags">
                      {post.tags.map((tag: string) => (
                        <li key={tag}>
                          <span className="pill">{tag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="article-toc__cta">
                  <p className="mono article-toc__cta-eyebrow">Visual Production</p>
                  <p className="article-toc__cta-title">Need custom 3D animation or video production?</p>
                  <Link href="/contact" className="btn btn--primary btn--sm">
                    Start a project
                    <span className="btn__icon">
                      <Icon name="arrow-right" size={14} />
                    </span>
                  </Link>
                </div>
              </div>
            </aside>
          ) : null}

          <div className="article__body">
            {post.featured_image_url ? (
              <figure className="article__featured-media">
                <div className="article__featured-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    loading="eager"
                  />
                </div>
              </figure>
            ) : null}

            <div
              className="article__rendered-content"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            <p className="article__back">
              <Link href="/journal" className="link-arrow">
                <Icon name="arrow-left" size={15} />
                Back to Articles
              </Link>
            </p>
          </div>
        </div>
      </article>

      <CTASection
        id="article-cta"
        eyebrow="Next step"
        title={
          <>
            Bring us the thing that is <span className="accent">hard to explain</span>.
          </>
        }
        body="Send us your brief and we will tell you honestly which animation pipeline fits your message and audience."
        secondary={{ label: 'Explore services', to: '/services' }}
      />
    </>
  )
}
