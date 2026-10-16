import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Seo, SITE_URL } from '@/components/Seo'
import { PageHero } from '@/components/ui/PageHero'
import { ArticleCard } from '@/components/journal/ArticleCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import {
  ARTICLE_CATEGORIES,
  SORTED_ARTICLES,
  formatDate,
  type ArticleCategory,
} from '@/data/articles'
import './journal.css'

type Filter = 'all' | ArticleCategory

export default function Journal() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('category')
  const initial: Filter = raw && (ARTICLE_CATEGORIES as string[]).includes(raw) ? (raw as Filter) : 'all'
  const [category, setCategory] = useState<Filter>(initial)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const next = params.get('category')
    setCategory(next && (ARTICLE_CATEGORIES as string[]).includes(next) ? (next as Filter) : 'all')
  }, [params])

  const setCategoryParam = (value: Filter) => {
    setCategory(value)
    if (value === 'all') params.delete('category')
    else params.set('category', value)
    setParams(params, { replace: true })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SORTED_ARTICLES.filter((article) => {
      const matchesCategory = category === 'all' || article.category === category
      if (!matchesCategory) return false
      if (!q) return true
      return (
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [category, query])

  const isFiltering = category !== 'all' || query.trim().length > 0
  const featured = SORTED_ARTICLES.find((a) => a.featured) ?? SORTED_ARTICLES[0]
  const list = isFiltering ? filtered : filtered.filter((a) => a.slug !== featured.slug)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'UNIMASI Journal',
      url: `${SITE_URL}/journal`,
      description:
        'Practical writing on animation briefs, storyboards, production pipelines and motion design.',
      blogPost: SORTED_ARTICLES.map((article) => ({
        '@type': 'BlogPosting',
        headline: article.title,
        url: `${SITE_URL}/journal/${article.slug}`,
        datePublished: article.date,
        author: { '@type': 'Organization', name: 'UNIMASI' },
      })),
    },
  ]

  return (
    <>
      <Seo
        title="Journal"
        description="Articles on animation briefs, storyboards, 2D and 3D pipelines, motion design systems and AI-assisted production — written by the UNIMASI studio."
        path="/journal"
        jsonLd={jsonLd}
      />

      <PageHero
        eyebrow="Journal"
        title={
          <>
            Notes from the <span className="accent">production floor</span>.
          </>
        }
        lede="Practical writing about how animation actually gets made — briefs, storyboards, pipelines, accessibility and the decisions behind the work."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Journal' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="pen" size={13} /> {SORTED_ARTICLES.length} articles
            </span>
            <span className="pill">
              <Icon name="grid" size={13} /> {ARTICLE_CATEGORIES.length} topics
            </span>
            <span className="pill">
              <Icon name="calendar" size={13} /> Latest{' '}
              {formatDate(SORTED_ARTICLES[0].date)}
            </span>
          </>
        }
      />

      <section className="section journal-index" aria-labelledby="journal-index-title">
        <div className="container container--wide">
          <h2 className="sr-only" id="journal-index-title">
            Browse articles
          </h2>

          <div className="journal-index__controls">
            <div className="journal-search">
              <Icon name="search" size={18} />
              <label className="sr-only" htmlFor="journal-search">
                Search articles
              </label>
              <input
                id="journal-search"
                type="search"
                placeholder="Search articles, topics or tags…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                  <Icon name="close" size={16} />
                </button>
              ) : null}
            </div>

            <div className="journal-index__filters" role="tablist" aria-label="Filter articles by topic">
              <button
                type="button"
                role="tab"
                aria-selected={category === 'all'}
                className={`filter-btn${category === 'all' ? ' is-active' : ''}`}
                onClick={() => setCategoryParam('all')}
              >
                All topics
                <span className="filter-btn__count">{SORTED_ARTICLES.length}</span>
              </button>
              {ARTICLE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={category === cat}
                  className={`filter-btn${category === cat ? ' is-active' : ''}`}
                  onClick={() => setCategoryParam(cat)}
                >
                  {cat}
                  <span className="filter-btn__count">
                    {SORTED_ARTICLES.filter((a) => a.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="journal-index__count mono" aria-live="polite">
            {filtered.length} article{filtered.length === 1 ? '' : 's'}
            {category !== 'all' ? ` in ${category}` : ''}
            {query.trim() ? ` matching “${query.trim()}”` : ''}
          </p>

          {!isFiltering ? (
            <Reveal className="journal-index__featured" variant="scale">
              <ArticleCard article={featured} featured />
            </Reveal>
          ) : null}

          {list.length > 0 ? (
            <div className="journal-index__grid" key={`${category}-${query}`}>
              {list.map((article, i) => (
                <Reveal key={article.slug} delay={i * 55} className="journal-index__item">
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="journal-index__empty">
              <Icon name="search" size={22} />
              <p>No articles match that search yet.</p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setQuery('')
                  setCategoryParam('all')
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>

      <CTASection
        id="journal-cta"
        eyebrow="Talk to the studio"
        title={
          <>
            Have a question we have not <span className="accent">written about</span>?
          </>
        }
        body="Send it over. We answer real questions about pipelines, scope and what is realistically achievable."
        secondary={{ label: 'See services', to: '/services' }}
      />
    </>
  )
}
