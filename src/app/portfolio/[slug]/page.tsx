import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPortfolioPage, getProjectBySlug, getProjects } from '@/lib/content/spatium'
import { getPublicContact } from '@/lib/content/contact'
import { PortfolioView } from '@/components/entity/EntityViews'
import { jsonLdScript, portfolioJsonLd } from '@/lib/seo/entity-jsonld'
import { siteConfig } from '@/config/site'
import { redirectIfMoved } from '@/lib/redirects/resolve'

const SITE_URL = siteConfig.url

export const revalidate = 300

export async function generateStaticParams() {
  // getProjects() logs and returns [] when the DB is unreachable at build time.
  const projects = await getProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Scene tidak ditemukan' }

  const rawTitle = `${project.title} · SPATIUM`
  const serpTitle = rawTitle.length > 62 ? `${project.title.slice(0, 42).trimEnd()}… · SPATIUM` : rawTitle
  const baseDesc = project.brief || project.tagline
  const description = baseDesc.length > 160 ? `${baseDesc.slice(0, 157).trimEnd()}…` : baseDesc
  const ogImg = project.posterUrl || '/icon-512.png'

  return {
    title: serpTitle,
    description,
    alternates: { canonical: `${SITE_URL}/portfolio/${slug}` },
    openGraph: {
      type: 'article',
      title: serpTitle,
      description,
      url: `${SITE_URL}/portfolio/${slug}`,
      siteName: 'SPATIUM',
      images: [{ url: ogImg, width: 1200, height: 630, alt: project.title }],
    },
    twitter: { card: 'summary_large_image', title: serpTitle, description, images: [ogImg] },
  }
}

/** A published scene, rendered from its blocks (preset when none are stored) by the same view as the Studio preview. */
export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPortfolioPage(slug)
  if (!page) {
    await redirectIfMoved(`/portfolio/${slug}`)
    notFound()
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(portfolioJsonLd(page.entity.project)) }} />
      <PortfolioView entity={page.entity} blocks={page.blocks} contact={await getPublicContact()} />
    </>
  )
}
