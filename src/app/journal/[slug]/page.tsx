import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/PageHero'
import { StudioArt } from '@/components/art/StudioArt'
import { ArticleCard } from '@/components/journal/ArticleCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import {
  SORTED_ARTICLES,
  formatDate,
  getArticle,
  getRelatedArticles,
  type Article,
  type Block,
} from '@/data/articles'
import { getCoreArticleBySlug, getCoreArticles } from '@/lib/core'
import '@/pages/article.css'

const SITE_URL = 'https://unimasi.studio'

async function resolveArticle(slug: string): Promise<{
  article: Article
  htmlContent?: string
} | null> {
  const local = getArticle(slug)
  const core = await getCoreArticleBySlug(slug)

  if (local) {
    return {
      article: local,
      htmlContent: core?.content,
    }
  }

  if (core) {
    const categoryName =
      typeof core.category === 'string'
        ? core.category
        : core.category?.name || 'Process'
    const authorName =
      typeof core.author === 'string'
        ? core.author
        : core.author?.name || 'UNIMASI'
    const tagNames = core.tags
      ? core.tags.map((t) => (typeof t === 'string' ? t : t.name || ''))
      : []

    const fallbackArticle: Article = {
      slug: core.slug,
      title: core.title,
      category: categoryName as any,
      excerpt: core.excerpt || '',
      metaDescription: core.seo?.metaDescription || core.excerpt || '',
      date: core.publishedAt || core.createdAt || new Date().toISOString(),
      author: authorName,
      readMinutes: core.readingTime || 5,
      tags: tagNames.filter(Boolean),
      artVariant: 1,
      body: [],
      serviceCta: {
        label: 'Need Animation Production?',
        to: '/contact',
        blurb: 'From explainer videos to 3D cinematics, we help brands move.',
      },
      relatedLinks: [
        { label: 'View our portfolio', to: '/portfolio' },
        { label: 'Browse services', to: '/services' },
      ],
      relatedSlugs: [],
    }

    return {
      article: fallbackArticle,
      htmlContent: core.content,
    }
  }

  return null
}

export async function generateStaticParams() {
  try {
    const core = await getCoreArticles({ pageSize: 50 })
    if (core && core.articles && core.articles.length > 0) {
      return core.articles.map((article) => ({
        slug: article.slug,
      }))
    }
  } catch {}

  return SORTED_ARTICLES.map((article) => ({
    slug: article.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const resolved = await resolveArticle(slug)
  if (!resolved) return { title: 'Article Not Found' }
  const { article } = resolved

  return {
    title: `${article.title} · UNIMASI`,
    description: article.metaDescription,
    alternates: {
      canonical: `${SITE_URL}/journal/${article.slug}`,
    },
    openGraph: {
      type: 'article',
      title: `${article.title} · UNIMASI`,
      description: article.metaDescription,
      publishedTime: article.date,
      authors: [article.author],
      url: `${SITE_URL}/journal/${article.slug}`,
      images: [{ url: `${SITE_URL}/favicon.svg` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
      images: [`${SITE_URL}/favicon.svg`],
    },
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

/** Renders **bold**, *italic* and [links](/path) inside a text string. */
function renderInline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const out: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) out.push(text.slice(lastIndex, match.index))
    const token = match[0]

    if (token.startsWith('**')) {
      out.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      out.push(<em key={key++}>{token.slice(1, -1)}</em>)
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (link) {
        const [, label, href] = link
        out.push(
          href.startsWith('/') ? (
            <Link key={key++} href={href}>
              {label}
            </Link>
          ) : (
            <a key={key++} href={href} target="_blank" rel="noreferrer noopener">
              {label}
            </a>
          ),
        )
      } else {
        out.push(token)
      }
    }
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) out.push(text.slice(lastIndex))
  return out
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return <h2 id={slugify(block.text)}>{block.text}</h2>
    case 'h3':
      return <h3>{block.text}</h3>
    case 'p':
      return <p>{renderInline(block.text)}</p>
    case 'ul':
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol>
          {block.items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ol>
      )
    case 'quote':
      return (
        <blockquote>
          <Icon name="quote" size={22} />
          <p>{renderInline(block.text)}</p>
          {block.cite ? <cite>{block.cite}</cite> : null}
        </blockquote>
      )
    case 'callout':
      return (
        <aside className="article-callout">
          <p className="article-callout__title">
            <Icon name="bolt" size={15} />
            {block.title}
          </p>
          <p>{renderInline(block.text)}</p>
        </aside>
      )
    default:
      return null
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const resolved = await resolveArticle(slug)

  if (!resolved) notFound()
  const { article, htmlContent } = resolved

  const related = getRelatedArticles(article)
  const headings = article.body.filter((b): b is Extract<Block, { type: 'h2' }> => b.type === 'h2')

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.metaDescription,
      datePublished: article.date,
      dateModified: article.date,
      url: `${SITE_URL}/journal/${article.slug}`,
      articleSection: article.category,
      keywords: article.tags.join(', '),
      author: { '@type': 'Organization', name: article.author, url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'UNIMASI', url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/journal/${article.slug}` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE_URL}/journal` },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: `${SITE_URL}/journal/${article.slug}`,
        },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="article">
        <header className="article__header">
          <div className="bg-grid article__grid" aria-hidden="true" />
          <div className="container container--wide article__header-inner">
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Journal', to: '/journal' },
                { label: article.category, to: `/journal?category=${encodeURIComponent(article.category)}` },
                { label: article.title },
              ]}
            />

            <div className="article__header-top">
              <span className="pill pill--accent">{article.category}</span>
              <span className="mono article__read">{article.readMinutes} min read</span>
            </div>

            <h1 className="article__title display-lg">{article.title}</h1>
            <p className="lede article__excerpt">{article.excerpt}</p>

            <dl className="article__meta">
              <div>
                <dt>Published</dt>
                <dd>
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                </dd>
              </div>
              <div>
                <dt>Author</dt>
                <dd>{article.author}</dd>
              </div>
              <div>
                <dt>Topic</dt>
                <dd>{article.category}</dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="container container--wide article__banner-wrap">
          <Reveal className="article__banner" variant="scale">
            <StudioArt variant={article.artVariant} caption={article.category} />
          </Reveal>
        </div>

        <div className="container container--wide article__layout">
          <aside className="article__aside">
            <div className="article-toc">
              <p className="mono article-toc__label">In this article</p>
              {headings.length > 0 ? (
                <ol>
                  {headings.map((heading, i) => (
                    <li key={heading.text}>
                      <a href={`#${slugify(heading.text)}`}>
                        <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="article-toc__empty">Short read — no sections.</p>
              )}

              <p className="mono article-toc__label">Tags</p>
              <ul className="article__tags">
                {article.tags.map((tag) => (
                  <li key={tag}>
                    <span className="pill">{tag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="article__body">
            {article.body && article.body.length > 0 ? (
              article.body.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))
            ) : htmlContent ? (
              <div
                className="article-rendered-body"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : null}

            <Reveal className="article__service-cta">
              <div className="article__service-cta-inner">
                <p className="mono article__service-cta-label">Related service</p>
                <h2>{article.serviceCta.label}</h2>
                <p>{article.serviceCta.blurb}</p>
                <Link href={article.serviceCta.to} className="btn btn--primary">
                  Explore
                  <span className="btn__icon">
                    <Icon name="arrow-right" size={16} />
                  </span>
                </Link>
              </div>
            </Reveal>

            <nav className="article__internal" aria-label="Related pages">
              <p className="mono article__internal-label">Keep reading</p>
              <ul>
                {article.relatedLinks.map((link) => (
                  <li key={link.to + link.label}>
                    <Link href={link.to} className="link-arrow">
                      {link.label}
                      <Icon name="arrow-right" size={15} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="article__back">
              <Link href="/journal" className="link-arrow">
                <Icon name="arrow-left" size={15} />
                All articles
              </Link>
            </p>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="section section--deep article__related" aria-labelledby="related-title">
            <div className="container container--wide">
              <SectionHead id="related-title" eyebrow="Related articles" title="Continue reading" />
              <div className="article__related-grid">
                {related.map((item) => (
                  <ArticleCard key={item.slug} article={item} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </article>

      <CTASection
        id="article-cta"
        eyebrow="Next step"
        title={
          <>
            Put this thinking to work on <span className="accent">your project</span>.
          </>
        }
        body="Send the brief and we will apply the same discipline to your film — with scope, timeline and pipeline set out clearly."
        secondary={{ label: 'Browse journal', to: '/journal' }}
      />
    </>
  )
}
