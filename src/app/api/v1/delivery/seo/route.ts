import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { getArticleBySlug } from '@/lib/db/articles'
import { getServiceBySlug } from '@/lib/db/services'
import { getServiceCategoryBySlug } from '@/lib/db/serviceCategories'
import { getPortfolioBySlug } from '@/lib/db/portfolio'
import type { SEOComponent } from '@/lib/content/types'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDeliveryRequest(request)
  if ('response' in auth) return auth.response

  const path = request.nextUrl.searchParams.get('path') || '/'
  const rawClean = path.startsWith('/') ? path : `/${path}`
  const cleanPath = rawClean.length > 1 && rawClean.endsWith('/') ? rawClean.slice(0, -1) : rawClean

  try {
    const siteProfile = await getSiteProfile()
    let seo: SEOComponent | null = null

    // Check Article: /journal/[slug] (legacy /artikel and /blog also accepted)
    const articleMatch = cleanPath.match(/^\/(?:journal|artikel|blog)\/([^/]+)/)
    if (articleMatch) {
      const article = await getArticleBySlug(articleMatch[1])
      if (article?.seo && article.status === 'published') {
        seo = article.seo
      }
    }

    // Check Service: /services/[slug]
    const serviceMatch = cleanPath.match(/^\/services\/([^/]+)/)
    if (!seo && serviceMatch) {
      const category = await getServiceCategoryBySlug(serviceMatch[1])
      if (category && category.status === 'published') {
        seo = {
          id: category.id,
          metaTitle: category.metaTitle || category.title,
          metaDescription: category.metaDescription || category.shortDescription || undefined,
        }
      } else {
        const service = await getServiceBySlug(serviceMatch[1])
        if (service?.seo) {
          seo = service.seo
        }
      }
    }

    // Check Portfolio: /portfolio/[slug]
    const portfolioMatch = cleanPath.match(/^\/portfolio\/([^/]+)/)
    if (!seo && portfolioMatch) {
      const portfolio = await getPortfolioBySlug(portfolioMatch[1], { publishedOnly: true })
      if (portfolio?.seo) {
        seo = portfolio.seo
      }
    }

    // Fallback: Default Site SEO
    if (!seo) {
      seo = {
        id: siteProfile.id,
        metaTitle: siteProfile.name + (siteProfile.tagline ? ` — ${siteProfile.tagline}` : ''),
        metaDescription: siteProfile.description || undefined,
        canonicalUrl: siteProfile.url + (cleanPath === '/' ? '' : cleanPath),
        robotsIndex: true,
        robotsFollow: true,
        ogTitle: siteProfile.name,
        ogDescription: siteProfile.description || undefined,
        ogImage: siteProfile.logoUrl
          ? {
              id: 1,
              name: siteProfile.name,
              alternativeText: siteProfile.name,
              caption: null,
              width: 1200,
              height: 630,
              url: siteProfile.logoUrl,
            }
          : undefined,
      }
    }

    return jsonResponse({ path: cleanPath, seo })
  } catch (err) {
    console.error(`[delivery:seo:${path}] Error:`, err)
    return jsonResponse({ error: 'Failed to resolve SEO metadata' }, 500)
  }
}
