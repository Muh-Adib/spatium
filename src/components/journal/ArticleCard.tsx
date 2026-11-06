import Link from 'next/link'
import { SplatPlaceholder } from '@/components/spatium/SplatPlaceholder'
import { Icon } from '@/components/Icon'
import './article-card.css'

export type ArticleCardItem = {
  slug: string
  href?: string
  title: string
  category: string
  excerpt: string
  date: string
  author?: string
  readMinutes?: number
  featuredImageUrl?: string | null
  artVariant?: number
}

type ArticleCardProps = {
  article: ArticleCardItem
  featured?: boolean
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const linkHref =
    article.href ||
    (article.slug.startsWith('/') ? article.slug : `/journal/${article.slug}`)

  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <article className={`article-card${featured ? ' article-card--featured' : ''}`}>
      <Link href={linkHref} className="article-card__link">
        <div className="article-card__media">
          {article.featuredImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={article.featuredImageUrl}
              alt={article.title}
              loading="lazy"
            />
          ) : (
            <SplatPlaceholder seed={article.artVariant ?? 1} />
          )}
        </div>
        <div className="article-card__body">
          <div className="article-card__meta">
            <span className="pill pill--accent">{article.category}</span>
            {formattedDate ? (
              <time className="article-card__date mono" dateTime={article.date}>
                {formattedDate}
              </time>
            ) : null}
          </div>
          <h3 className="article-card__title">{article.title}</h3>
          <p className="article-card__excerpt">{article.excerpt}</p>
          <span className="article-card__foot">
            {article.readMinutes ? (
              <span className="mono article-card__read">{article.readMinutes} menit baca</span>
            ) : null}
            <span className="link-arrow">
              Baca artikel
              <Icon name="arrow-right" size={15} />
            </span>
          </span>
        </div>
      </Link>
    </article>
  )
}

export default ArticleCard
