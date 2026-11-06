import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/PageHero'
import { SplatPlaceholder } from '@/components/spatium/SplatPlaceholder'
import { ArticleCard, type ArticleCardItem } from '@/components/journal/ArticleCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { getJournalArticleBySlug, getJournalArticles, getUseCases } from '@/lib/content/spatium'
import { formatDate, type JournalArticle } from '@/lib/content/spatium-types'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'
import { siteConfig } from '@/config/site'
import '@/pages/article.css'
import { redirectIfMoved } from '@/lib/redirects/resolve'

const SITE_URL = siteConfig.url

export const revalidate = 300

export async function generateStaticParams() {
  // getJournalArticles() logs and returns [] when the DB is unreachable at build time.
  const articles = await getJournalArticles()
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getJournalArticleBySlug(slug)
  if (!article) return { title: 'Artikel tidak ditemukan' }

  const desc =
    article.metaDescription.length > 160
      ? `${article.metaDescription.slice(0, 157).trimEnd()}…`
      : article.metaDescription
  const cleanTitle = article.metaTitle.replace(/\s*[·|–—-]\s*SPATIUM\s*$/i, '').trim()
  const title = cleanTitle.length > 60 ? `${cleanTitle.slice(0, 57).trimEnd()}…` : cleanTitle
  const ogImage = article.coverUrl || `${SITE_URL}/icon-512.png`

  return {
    title,
    description: desc,
    alternates: {
      canonical: `${SITE_URL}/journal/${article.slug}`,
    },
    openGraph: {
      type: 'article',
      title,
      description: desc,
      publishedTime: article.date,
      authors: [article.author],
      url: `${SITE_URL}/journal/${article.slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImage],
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

/** Adds anchor ids to <h2> elements and returns them for the table of contents. */
function withHeadingAnchors(html: string): { html: string; headings: { id: string; text: string }[] } {
  const headings: { id: string; text: string }[] = []
  const out = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (match, attrs: string | undefined, inner: string) => {
    if (attrs && /\sid=/.test(attrs)) return match
    const text = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
    const id = slugify(text) || `bagian-${headings.length + 1}`
    headings.push({ id, text })
    return `<h2${attrs ?? ''} id="${id}">${inner}</h2>`
  })
  return { html: out, headings }
}

function toCard(a: JournalArticle, index: number): ArticleCardItem {
  return {
    slug: a.slug,
    href: `/journal/${a.slug}`,
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    date: a.date,
    author: a.author,
    readMinutes: a.readMinutes,
    featuredImageUrl: a.coverUrl ?? null,
    artVariant: (index % 4) + 1,
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getJournalArticleBySlug(slug)
  if (!article) {
    await redirectIfMoved(`/journal/${slug}`)
    notFound()
  }

  const [allArticles, useCases] = await Promise.all([getJournalArticles(), getUseCases()])
  const others = allArticles.filter((a) => a.slug !== article.slug)
  const related = [
    ...others.filter((a) => a.categorySlug && a.categorySlug === article.categorySlug),
    ...others.filter((a) => !a.categorySlug || a.categorySlug !== article.categorySlug),
  ].slice(0, 3)

  // Article categories share slugs with use cases; otherwise point to the portfolio.
  const useCase = useCases.find((u) => u.slug === article.categorySlug)
  const serviceCta = useCase
    ? { label: useCase.name, to: `/services/${useCase.slug}`, blurb: useCase.summary }
    : { label: 'Jelajahi scene 3DGS', to: '/portfolio', blurb: 'Lihat ruang nyata yang sudah kami capture, langsung di browser.' }

  const { html, headings } = withHeadingAnchors(article.html)
  const artVariant = (Math.max(0, allArticles.findIndex((a) => a.slug === article.slug)) % 4) + 1

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
      publisher: { '@type': 'Organization', name: 'SPATIUM', url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/journal/${article.slug}` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Artikel', item: `${SITE_URL}/journal` },
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
                { label: 'Artikel', to: '/journal' },
                { label: article.category, to: `/journal?category=${encodeURIComponent(article.category)}` },
                { label: article.title },
              ]}
            />

            <div className="article__header-top">
              <span className="pill pill--accent">{article.category}</span>
              <span className="mono article__read">{article.readMinutes} menit baca</span>
            </div>

            <h1 className="article__title display-lg">{article.title}</h1>
            <p className="lede article__excerpt">{article.excerpt}</p>

            <dl className="article__meta">
              <div>
                <dt>Terbit</dt>
                <dd>
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                </dd>
              </div>
              <div>
                <dt>Penulis</dt>
                <dd>{article.author}</dd>
              </div>
              <div>
                <dt>Topik</dt>
                <dd>{article.category}</dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="container container--wide article__banner-wrap">
          <Reveal className="article__banner" variant="scale">
            {article.coverUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={article.coverUrl} alt={article.title} className="w-full h-full object-cover" />
            ) : (
              <div className="relative w-full h-full aspect-video"><SplatPlaceholder seed={artVariant} label={article.category} /></div>
            )}
          </Reveal>
        </div>

        <div className="container container--wide article__layout">
          <aside className="article__aside">
            <div className="article-toc">
              <p className="mono article-toc__label">Dalam artikel ini</p>
              {headings.length > 0 ? (
                <ol>
                  {headings.map((heading, i) => (
                    <li key={heading.id}>
                      <a href={`#${heading.id}`}>
                        <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="article-toc__empty">Bacaan singkat — tanpa subbagian.</p>
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
            <div
              className="article-rendered-body"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(html) }}
            />

            <Reveal className="article__service-cta">
              <div className="article__service-cta-inner">
                <p className="mono article__service-cta-label">{useCase ? 'Layanan terkait' : 'Portofolio'}</p>
                <h2>{serviceCta.label}</h2>
                <p>{serviceCta.blurb}</p>
                <Link href={serviceCta.to} className="btn btn--primary">
                  Jelajahi
                  <span className="btn__icon">
                    <Icon name="arrow-right" size={16} />
                  </span>
                </Link>
              </div>
            </Reveal>

            <p className="article__back">
              <Link href="/journal" className="link-arrow">
                <Icon name="arrow-left" size={15} />
                Semua artikel
              </Link>
            </p>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="section section--deep article__related" aria-labelledby="related-title">
            <div className="container container--wide">
              <SectionHead id="related-title" eyebrow="Artikel terkait" title="Lanjut membaca" />
              <div className="article__related-grid">
                {related.map((item, i) => (
                  <ArticleCard key={item.slug} article={toCard(item, i)} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </article>

      <CTASection
        id="article-cta"
        eyebrow="Langkah berikutnya"
        title={
          <>
            Terapkan pada <span className="accent">ruang Anda</span>.
          </>
        }
        body="Ceritakan lokasi dan tujuan Anda. Kami akan menjelaskan alur capture, keluaran, dan cakupan pekerjaan secara terbuka."
        secondary={{ label: 'Lihat artikel lain', to: '/journal' }}
      />
    </>
  )
}
