import type { MetadataRoute } from 'next'
import { SERVICES } from '@/data/services'
import { PROJECTS } from '@/data/projects'
import { supabase } from '@/lib/supabase'

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

  // Fetch all 1,147+ articles from Supabase
  let postRoutes: MetadataRoute.Sitemap = []
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, published_at')
      .eq('status', 'publish')
      .order('published_at', { ascending: false })

    if (posts) {
      postRoutes = posts.map((post) => ({
        url: `${SITE_URL}/${post.slug}/`,
        lastModified: post.published_at ? new Date(post.published_at) : new Date(),
        changeFrequency: 'yearly',
        priority: 0.7,
      }))
    }
  }

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...postRoutes]
}
