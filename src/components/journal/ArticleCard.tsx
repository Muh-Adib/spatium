import { Link } from 'react-router-dom'
import { StudioArt } from '@/components/art/StudioArt'
import { Icon } from '@/components/Icon'
import { formatDate, type Article } from '@/data/articles'
import './article-card.css'

type ArticleCardProps = {
  article: Article
  featured?: boolean
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <article className={`article-card${featured ? ' article-card--featured' : ''}`}>
      <Link to={`/journal/${article.slug}`} className="article-card__link">
        <div className="article-card__media">
          <StudioArt variant={article.artVariant} />
        </div>
        <div className="article-card__body">
          <div className="article-card__meta">
            <span className="pill pill--accent">{article.category}</span>
            <time className="article-card__date mono" dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          </div>
          <h3 className="article-card__title">{article.title}</h3>
          <p className="article-card__excerpt">{article.excerpt}</p>
          <span className="article-card__foot">
            <span className="mono article-card__read">{article.readMinutes} min read</span>
            <span className="link-arrow">
              Read article
              <Icon name="arrow-right" size={15} />
            </span>
          </span>
        </div>
      </Link>
    </article>
  )
}

export default ArticleCard
