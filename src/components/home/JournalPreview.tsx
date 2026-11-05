import Link from 'next/link'
import { SORTED_ARTICLES } from '@/data/articles'
import { ArticleCard, type ArticleCardItem } from '@/components/journal/ArticleCard'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import {
  getCoreArticles,
  getAuthorName,
  getCategoryName,
  getMediaUrl,
} from '@/lib/core'
import './journal-preview.css'

export async function JournalPreview() {
  let articles: ArticleCardItem[] = []
  try {
    const { articles: fetched } = await getCoreArticles({ page: 1, pageSize: 4 })
    if (fetched && fetched.length > 0) {
      articles = fetched.map((p) => ({
        slug: p.slug,
        href: `/journal/${p.slug}`,
        title: p.title,
        category: getCategoryName(p.category),
        excerpt:
          p.seoData?.metaDescription ||
          p.seo?.metaDescription ||
          (p.excerpt ? p.excerpt.replace(/<[^>]+>/g, '').slice(0, 160) + '…' : ''),
        date: p.publishedAt || p.createdAt || '',
        author: getAuthorName(p.author),
        readMinutes: p.readingTime || 5,
        featuredImageUrl: getMediaUrl(p.featuredImage, p.coverUrl),
      }))
    }
  } catch (err) { console.warn("[observable error]:", err) }

  if (articles.length === 0) {
    return null
  }

  const [featured, ...recent] = articles

  return (
    <section
      className="section journal-preview"
      id="journal"
      aria-labelledby="journal-title"
      data-reveal
    >
      <div className="container container--wide">
        <SectionHead
          id="journal-title"
          eyebrow="Articles"
          title={
            <>
              Notes from the <span className="accent">production floor</span>.
            </>
          }
          aside={
            <>
              <p className="lede">
                Practical writing on briefs, storyboards, pipelines and the decisions that make
                animation land — written by the people who do the work.
              </p>
              <Link href="/journal" className="link-arrow">
                Browse all articles
                <Icon name="arrow-right" size={17} />
              </Link>
            </>
          }
        />

        <Reveal className="journal-preview__featured" variant="scale">
          <ArticleCard article={featured} featured />
        </Reveal>

        <div className="journal-preview__grid">
          {recent.map((article, i) => (
            <Reveal key={article.slug} delay={i * 70} className="journal-preview__item">
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default JournalPreview
