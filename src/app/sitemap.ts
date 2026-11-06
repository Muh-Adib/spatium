import type { MetadataRoute } from 'next'
import { getCoreArticles, getCorePortfolios, getCoreServices } from '@/lib/core'
import { listPublishedSlugs } from '@/lib/pages/repository'
import { parseRobots } from '@/lib/pages/render'

import { siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

// Safety net: Studio mutations revalidate /sitemap.xml directly, but scheduled
// publications run outside a request, so the sitemap also refreshes hourly.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // All dynamic routes come from PostgreSQL; each getter logs and returns []
  // on failure, so the sitemap degrades to static routes instead of crashing.
  const [services, projects, { articles }, pages] = await Promise.all([
    getCoreServices(),
    getCorePortfolios(),
    getCoreArticles({ page: 1, pageSize: 100 }),
    listPublishedSlugs(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/journal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${SITE_URL}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/portfolio/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  const postRoutes: MetadataRoute.Sitemap = articles.map((post) => {
    const stamp = post.updatedAt || post.publishedAt || post.createdAt
    return {
      url: `${SITE_URL}/journal/${post.slug}`,
      lastModified: stamp ? new Date(stamp) : new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }
  })

  // Published Studio pages at `/<slug>`; pages marked noindex stay out of the sitemap.
  const pageRoutes: MetadataRoute.Sitemap = pages
    .filter((page) => parseRobots(page.robots).index)
    .map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: new Date(page.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...postRoutes, ...pageRoutes]
}
