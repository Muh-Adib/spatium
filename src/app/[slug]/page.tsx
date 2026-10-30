import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/PageHero'
import { CTASection } from '@/components/ui/CTASection'
import { Icon } from '@/components/Icon'
import {
  getCoreArticleBySlug,
  getCoreArticles,
  getAuthorName,
  getCategoryName,
  getMediaUrl,
  type CoreTag,
} from '@/lib/core'
import '@/pages/article.css'

const SITE_URL = 'https://unimasi.studio'

export const revalidate = 3600 // Cache for 1 hour, revalidates on-demand via ISR

export async function generateStaticParams() {
  try {
    const { articles } = await getCoreArticles({ page: 1, pageSize: 50 })
    return (articles || []).map((post) => ({
      slug: post.slug,
    }))
  } catch (e) {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getCoreArticleBySlug(slug)

  if (!post) return { title: 'Article Not Found' }

  const title =
    post.seo?.metaTitle || post.seoData?.seoTitle || post.title
  const description =
    post.seo?.metaDescription ||
    post.seoData?.metaDescription ||
    (post.excerpt ? post.excerpt.replace(/<[^>]+>/g, '').slice(0, 160) : '')
  const canonical = post.seo?.canonicalUrl || `${SITE_URL}/${post.slug}/`
  const ogImageUrl = getMediaUrl(post.featuredImage, post.coverUrl)

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title: post.seo?.ogTitle || title,
      description: post.seo?.ogDescription || description,
      url: canonical,
      publishedTime: post.publishedAt || post.createdAt,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    robots: {
      index: post.seo?.robotsIndex ?? true,
      follow: post.seo?.robotsFollow ?? true,
    },
  }
}

/**
 * Parses article HTML into structured headings for TOC and injects anchor IDs.
 */
function processArticleContent(
  rawHtml: string,
  articleTitle: string
): { html: string; toc: Array<{ id: string; text: string; level: number }> } {
  const toc: Array<{ id: string; text: string; level: number }> = []
  const usedSlugs = new Set<string>()

  let content = rawHtml

  // Auto-fix relative or broken image links
  content = content.replace(/<img([^>]*)\bsrc=["'](\/[^"']+)["']/gi, (match, before, srcPath) => {
    if (srcPath.startsWith('/images/')) {
      const coreUrl = process.env.CORE_API_URL || 'http://localhost:3000'
      return `<img${before}src="${coreUrl.replace(/\/$/, '')}${srcPath}"`
    }
    return match
  })

  // Extract h2 and h3 headings for Table of Contents
  content = content.replace(
    /<h([2-3])([^>]*)>(.*?)<\/h\1>/gi,
    (_full, levelStr, attrs, innerText) => {
      const level = parseInt(levelStr, 10)
      const cleanText = innerText.replace(/<[^>]+>/g, '').trim()

      let baseSlug = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      if (!baseSlug) baseSlug = `section-${toc.length + 1}`

      let uniqueSlug = baseSlug
      let counter = 1
      while (usedSlugs.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter++}`
      }
      usedSlugs.add(uniqueSlug)

      toc.push({ id: uniqueSlug, text: cleanText, level })

      const hasId = /\bid=["'][^"']*["']/i.test(attrs)
      if (hasId) {
        return `<h${level}${attrs.replace(/\bid=["'][^"']*["']/i, `id="${uniqueSlug}"`)}>${innerText}</h${level}>`
      }
      return `<h${level} id="${uniqueSlug}"${attrs}>${innerText}</h${level}>`
    }
  )

  return { html: content, toc }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getCoreArticleBySlug(slug)

  if (!post) {
    notFound()
  }

  const categoryName = getCategoryName(post.category)
  const authorName = getAuthorName(post.author)
  const featuredImageUrl = getMediaUrl(post.featuredImage, post.coverUrl)

  const { html: processedContent, toc } = processArticleContent(post.content || '', post.title)
  const headerExcerpt =
    post.seo?.metaDescription ||
    post.seoData?.metaDescription ||
    (post.excerpt && post.excerpt.length <= 250 ? post.excerpt.replace(/<[^>]+>/g, '') : '')

  const rawTags = (post.tags || []) as (CoreTag | string)[]
  const hasAside = toc.length > 0 || rawTags.length > 0
  const minHeadingLevel = toc.length > 0 ? Math.min(...toc.map((t) => t.level)) : 2

  const words = (post.content || '').replace(/<[^>]+>/g, '').split(/\s+/).length
  const readMinutes = post.readingTime || Math.max(1, Math.round(words / 200))

  const dateValue = post.publishedAt || post.createdAt
  const dateStr = dateValue
    ? new Date(dateValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <>
      {post.yoastSchema ? (
        typeof post.yoastSchema === 'string' ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: post.yoastSchema }}
          />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(post.yoastSchema) }}
          />
        )
      ) : null}

      <article className="article">
        <header className="article__header">
          <div className="bg-grid article__grid" aria-hidden="true" />
          <div className="container container--wide article__header-inner">
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Articles', to: '/journal' },
                { label: categoryName },
                { label: post.title },
              ]}
            />

            <div className="article__header-top">
              <span className="pill pill--accent">{categoryName}</span>
              <span className="mono article__read">{readMinutes} min read</span>
            </div>

            <h1 className="article__title display-lg">{post.title}</h1>
            {headerExcerpt ? <p className="lede article__excerpt">{headerExcerpt}</p> : null}

            <dl className="article__meta">
              <div>
                <dt>Published</dt>
                <dd>
                  <time dateTime={dateValue || ''}>{dateStr}</time>
                </dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{authorName}</dd>
              </div>
              <div>
                <dt>Topic</dt>
                <dd>{categoryName}</dd>
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
                                item.level > minHeadingLevel ? 'article-toc__item--sub' : ''
                              }`}
                            >
                              <a href={`#${item.id}`} className="article-toc__link">
                                {num ? (
                                  <span className="article-toc__num mono">
                                    {String(num).padStart(2, '0')}.
                                  </span>
                                ) : (
                                  <span className="article-toc__bullet" />
                                )}
                                <span className="article-toc__text">{item.text}</span>
                              </a>
                            </li>
                          )
                        })
                      })()}
                    </ol>
                  </>
                ) : null}

                {rawTags.length > 0 ? (
                  <div className="article-toc__tags">
                    <p className="mono article-toc__label">Tags</p>
                    <ul className="article__tags">
                      {rawTags.map((tag) => {
                        const tagName = typeof tag === 'string' ? tag : tag.name || tag.slug || ''
                        const tagKey = typeof tag === 'string' ? tag : tag.id || tag.slug || tagName
                        return (
                          <li key={tagKey}>
                            <span className="pill">{tagName}</span>
                          </li>
                        )
                      })}
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
            {featuredImageUrl ? (
              <figure className="article__featured-media">
                <div className="article__featured-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredImageUrl}
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
