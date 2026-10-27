import Link from 'next/link'
import { SORTED_ARTICLES } from '@/data/articles'
import { ArticleCard } from '@/components/journal/ArticleCard'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import './journal-preview.css'

export function JournalPreview() {
  const [featured, ...rest] = SORTED_ARTICLES
  const recent = rest.slice(0, 3)

  return (
    <section className="section journal-preview" id="journal" aria-labelledby="journal-title">
      <div className="container container--wide">
        <SectionHead
          id="journal-title"
          eyebrow="Journal"
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
