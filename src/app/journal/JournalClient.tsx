'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { ArticleCard, type ArticleCardItem } from '@/components/journal/ArticleCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import '@/pages/journal.css'

export type JournalCategory = {
  name: string
  count: number
}

interface JournalClientProps {
  posts: ArticleCardItem[]
  totalCount: number
  totalAllCount: number
  currentPage: number
  totalPages: number
  currentCategory: string
  currentQuery: string
  categories: JournalCategory[]
}

function getPaginationRange(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const delta = 2
  const range: (number | string)[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  range.push(1)
  if (left > 2) range.push('...')
  for (let i = left; i <= right; i++) {
    range.push(i)
  }
  if (right < total - 1) range.push('...')
  range.push(total)
  return range
}

export function JournalClient({
  posts,
  totalCount,
  totalAllCount,
  currentPage,
  totalPages,
  currentCategory,
  currentQuery,
  categories,
}: JournalClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(currentQuery)

  useEffect(() => {
    setSearchInput(currentQuery)
  }, [currentQuery])

  const navigate = (newCat: string, newQ: string, newPage: number) => {
    const params = new URLSearchParams()
    if (newCat && newCat !== 'all') params.set('category', newCat)
    if (newQ && newQ.trim()) params.set('q', newQ.trim())
    if (newPage > 1) params.set('page', String(newPage))

    const qStr = params.toString()
    startTransition(() => {
      router.push(qStr ? `/journal?${qStr}` : '/journal', { scroll: false })
      if (typeof window !== 'undefined') {
        const el = document.getElementById('journal-index-title')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(currentCategory, searchInput, 1)
  }

  const handleCategorySelect = (catName: string) => {
    navigate(catName, searchInput, 1)
  }

  const handlePageSelect = (pageNumber: number) => {
    if (pageNumber === currentPage) return
    navigate(currentCategory, searchInput, pageNumber)
  }

  const isPageOneWithoutSearch = currentPage === 1 && !currentQuery
  const featured = isPageOneWithoutSearch && posts.length > 0 ? posts[0] : null
  const gridPosts = featured ? posts.slice(1) : posts

  const paginationRange = getPaginationRange(currentPage, totalPages)

  return (
    <>
      <PageHero
        eyebrow="SPATIUM INSIGHTS"
        title={
          <>
            Riset &amp; Inovasi <span className="accent">3D Gaussian Splatting</span>.
          </>
        }
        lede="Tulisan tentang digital twin, 3D Gaussian Splatting, dan pemanfaatannya untuk film, pemasaran, instalasi imersif, dan preservasi memori."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Artikel' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="pen" size={13} /> {totalAllCount.toLocaleString()} Artikel
            </span>
            <span className="pill">
              <Icon name="grid" size={13} /> {categories.length} Kategori
            </span>
            <span className="pill">
              <Icon name="calendar" size={13} /> Page {currentPage} of {Math.max(1, totalPages)}
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
            <form className="journal-search" onSubmit={handleSearchSubmit}>
              <Icon name="search" size={18} />
              <label className="sr-only" htmlFor="journal-search-input">
                Search articles
              </label>
              <input
                id="journal-search-input"
                type="search"
                placeholder="Cari artikel, topik, atau kata kunci…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    navigate(currentCategory, '', 1)
                  }}
                  aria-label="Clear search"
                >
                  <Icon name="close" size={16} />
                </button>
              ) : null}
            </form>

            <div
              className="journal-index__filters"
              role="tablist"
              aria-label="Filter articles by topic"
            >
              <button
                type="button"
                role="tab"
                aria-selected={currentCategory === 'all'}
                className={`filter-btn${currentCategory === 'all' ? ' is-active' : ''}`}
                onClick={() => handleCategorySelect('all')}
              >
                All topics
                <span className="filter-btn__count">{totalAllCount.toLocaleString()}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  role="tab"
                  aria-selected={currentCategory === cat.name}
                  className={`filter-btn${currentCategory === cat.name ? ' is-active' : ''}`}
                  onClick={() => handleCategorySelect(cat.name)}
                >
                  {cat.name}
                  <span className="filter-btn__count">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.6rem' }}>
            <p className="journal-index__count mono" style={{ margin: 0 }} aria-live="polite">
              {totalCount.toLocaleString()} article{totalCount === 1 ? '' : 's'}
              {currentCategory !== 'all' ? ` in ${currentCategory}` : ''}
              {currentQuery ? ` matching “${currentQuery}”` : ''}
              {totalPages > 1 ? ` — Showing page ${currentPage} of ${totalPages}` : ''}
            </p>
            {isPending ? (
              <span className="mono" style={{ color: 'var(--yellow)', fontSize: '0.75rem' }}>
                Updating...
              </span>
            ) : null}
          </div>

          {featured ? (
            <Reveal className="journal-index__featured" variant="scale">
              <ArticleCard article={featured} featured />
            </Reveal>
          ) : null}

          {posts.length > 0 ? (
            <>
              <div
                className="journal-index__grid"
                key={`${currentCategory}-${currentQuery}-${currentPage}`}
              >
                {gridPosts.map((article, i) => (
                  <Reveal key={article.slug} delay={i * 35} className="journal-index__item">
                    <ArticleCard article={article} />
                  </Reveal>
                ))}
              </div>

              {totalPages > 1 ? (
                <nav
                  className="journal-pagination"
                  aria-label="Article list pagination"
                >
                  <button
                    type="button"
                    className="journal-pagination__btn"
                    disabled={currentPage <= 1 || isPending}
                    onClick={() => handlePageSelect(currentPage - 1)}
                    aria-label="Previous page"
                  >
                    <Icon name="arrow-left" size={14} />
                    Prev
                  </button>

                  {paginationRange.map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="journal-pagination__ellipsis">
                          …
                        </span>
                      )
                    }
                    const pageNum = item as number
                    const isActive = pageNum === currentPage
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`journal-pagination__btn mono${isActive ? ' is-active' : ''}`}
                        onClick={() => handlePageSelect(pageNum)}
                        disabled={isPending}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    className="journal-pagination__btn"
                    disabled={currentPage >= totalPages || isPending}
                    onClick={() => handlePageSelect(currentPage + 1)}
                    aria-label="Next page"
                  >
                    Next
                    <Icon name="arrow-right" size={14} />
                  </button>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="journal-index__empty">
              <Icon name="search" size={24} />
              <p>
                {totalAllCount === 0 && currentCategory === 'all' && !currentQuery
                  ? 'Belum ada artikel yang dipublikasikan.'
                  : 'Tidak ada artikel yang cocok dengan filter atau kata kunci tersebut.'}
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setSearchInput('')
                  navigate('all', '', 1)
                }}
              >
                Reset filter
              </button>
            </div>
          )}
        </div>
      </section>

      <CTASection
        id="journal-cta"
        eyebrow="Hubungi studio"
        title={
          <>
            Punya pertanyaan yang belum <span className="accent">kami bahas</span>?
          </>
        }
        body="Kirimkan kepada kami. Kami menjawab pertanyaan nyata seputar capture ruang, digital twin, 3D Gaussian Splatting, dan apa yang realistis untuk proyek Anda."
        secondary={{ label: 'Lihat layanan', to: '/services' }}
      />
    </>
  )
}
