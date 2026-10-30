import type { MetadataRoute } from 'next'
import { SERVICES } from '@/data/services'
import { PROJECTS } from '@/data/projects'
import { getCoreArticles } from '@/lib/core'

const SITE_URL = 'https://unimasi.studio'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/services/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/portfolio/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/journal/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((service) => ({
    url: `${SITE_URL}/services/${service.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const projectRoutes: MetadataRoute.Sitemap = PROJECTS.map((project) => ({
    url: `${SITE_URL}/portfolio/${project.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  // Fetch articles from SegiaTech Core Delivery API
  let postRoutes: MetadataRoute.Sitemap = []
  try {
    const { articles } = await getCoreArticles({ page: 1, pageSize: 100 })
    postRoutes = articles.map((post) => ({
      url: `${SITE_URL}/${post.slug}/`,
      lastModified: post.publishedAt || post.createdAt ? new Date(post.publishedAt || post.createdAt!) : new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.warn('[Sitemap] Failed to fetch articles for sitemap:', e)
  }

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...postRoutes]
}
