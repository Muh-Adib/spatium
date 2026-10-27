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
                { label: 'Journal', to: '/journal' },
                { label: post.category_name || 'Articles' },
                { label: post.title },
              ]}
            />

            <div className="article__header-top">
              <span className="pill pill--accent">{post.category_name || 'Articles'}</span>
              <span className="mono article__read">{readMinutes} min read</span>
            </div>

            <h1 className="article__title display-lg">{post.title}</h1>
            {post.excerpt ? <p className="lede article__excerpt">{post.excerpt}</p> : null}

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

        {post.featured_image_url ? (
          <div className="container container--wide article__banner-wrap">
            <div className="article__banner" style={{ background: 'var(--navy-950)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.featured_image_url}
                alt={post.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        ) : null}

        <div className="container container--wide article__layout">
          {post.tags && post.tags.length > 0 ? (
            <aside className="article__aside">
              <div className="article-toc">
                <p className="mono article-toc__label">Tags</p>
                <ul className="article__tags">
                  {post.tags.map((tag: string) => (
                    <li key={tag}>
                      <span className="pill">{tag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          ) : null}

          <div className="article__body">
            <div
              className="article__rendered-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <p className="article__back">
              <Link href="/journal" className="link-arrow">
                <Icon name="arrow-left" size={15} />
                Back to Journal
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
