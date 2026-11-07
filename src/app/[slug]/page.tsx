import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getCoreArticleBySlug } from '@/lib/core'
import { redirectIfMoved } from '@/lib/redirects/resolve'
import { getPublishedPage, listPublishedSlugs } from '@/lib/pages/repository'
import { parseRobots } from '@/lib/pages/render'
import { siteConfig } from '@/config/site'
import { DynamicPageView } from '@/components/blocks/DynamicPageView'
import { getPublicContact } from '@/lib/content/contact'

/**
 * Root-level `/<slug>` resolution, in order:
 * 1. a published Studio page (`Page` row) → rendered from its blocks;
 * 2. a legacy root-level article URL (pre-SPATIUM WordPress structure) → 308 to `/journal/<slug>`;
 * 3. a Studio-managed redirect;
 * 4. 404.
 */

export const revalidate = 300

// Deduplicates the lookup between generateMetadata and the page render.
const loadPage = cache((slug: string) => getPublishedPage(slug))

export async function generateStaticParams() {
  // listPublishedSlugs logs and returns [] when the DB is unreachable (e.g. at build time).
  const slugs = await listPublishedSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await loadPage(slug)
  if (!page) return {}

  const url = `${siteConfig.url}/${page.slug}`
  const title = page.metaTitle || page.title
  const description = page.metaDescription ?? undefined
  const images = page.ogImage ? [{ url: page.ogImage, alt: page.ogImageAlt || title }] : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: parseRobots(page.robots),
    openGraph: { type: 'website', title, description, url, siteName: 'SPATIUM', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
  }
}

export default async function RootSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const page = await loadPage(slug)
  if (page) return <DynamicPageView title={page.title} slug={page.slug} blocks={page.blocks} contact={await getPublicContact()} />

  const article = await getCoreArticleBySlug(slug)
  if (article) permanentRedirect(`/journal/${encodeURIComponent(article.slug)}`)
  await redirectIfMoved(`/${slug}`)
  notFound()
}
