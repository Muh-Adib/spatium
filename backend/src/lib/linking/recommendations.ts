/**
 * Internal Linking & Content Relationship Engine — UNIMASI Studio
 *
 * Maps content entities (Articles, Services, Portfolios)
 * to ensure topical clustering across the UNIMASI animation ecosystem.
 */

export interface LinkRecommendation {
  type: 'service' | 'portfolio' | 'article'
  title: string
  url: string
  reason: string
  anchorText?: string
}

const UNIMASI_SERVICES = [
  {
    name: '2D Animation',
    pillarUrl: 'https://unimasi.studio/services/2d-animation',
    anchorVariations: ['animasi 2d', '2d animation', 'explainer video', 'storyboard', 'animasi edukasi'],
  },
  {
    name: '3D Animation & Visual Production',
    pillarUrl: 'https://unimasi.studio/services/3d-animation',
    anchorVariations: ['animasi 3d', '3d animation', 'visual production', 'cgi', 'character rig', 'blender'],
  },
  {
    name: 'Motion Graphics',
    pillarUrl: 'https://unimasi.studio/services/motion-graphics',
    anchorVariations: ['motion graphics', 'motion design', 'grafis gerak', 'kinetic typography'],
  },
  {
    name: 'Videotron & Digital Signage',
    pillarUrl: 'https://unimasi.studio/services/videotron',
    anchorVariations: ['videotron', 'digital signage', 'led display', 'billboard 3d', 'anamorphic'],
  },
]

// Topic-to-service mapping dictionary for UNIMASI internal ecosystem
const TOPIC_SERVICE_MAP: Record<string, { serviceSlug: string; serviceTitle: string; pillarUrl: string; portfolioSlug?: string; portfolioTitle?: string }> = {
  '2d': {
    serviceSlug: '2d-animation',
    serviceTitle: '2D Animation & Explainers',
    pillarUrl: 'https://unimasi.studio/services/2d-animation',
    portfolioSlug: 'explainer-series-concept',
    portfolioTitle: 'Explainer Series Concept',
  },
  explainer: {
    serviceSlug: '2d-animation',
    serviceTitle: '2D Explainer Video',
    pillarUrl: 'https://unimasi.studio/services/2d-animation',
    portfolioSlug: 'explainer-series-concept',
    portfolioTitle: 'Explainer Series Concept',
  },
  storyboard: {
    serviceSlug: '2d-animation',
    serviceTitle: 'Storyboard & Concepting',
    pillarUrl: 'https://unimasi.studio/services/2d-animation',
  },
  '3d': {
    serviceSlug: '3d-animation',
    serviceTitle: '3D Animation & Visual Production',
    pillarUrl: 'https://unimasi.studio/services/3d-animation',
    portfolioSlug: 'character-rig-study',
    portfolioTitle: 'Character Rig Study',
  },
  cgi: {
    serviceSlug: '3d-animation',
    serviceTitle: 'CGI & 3D Production',
    pillarUrl: 'https://unimasi.studio/services/3d-animation',
    portfolioSlug: 'character-rig-study',
    portfolioTitle: 'Character Rig Study',
  },
  blender: {
    serviceSlug: '3d-animation',
    serviceTitle: '3D Modeling & Animation',
    pillarUrl: 'https://unimasi.studio/services/3d-animation',
  },
  motion: {
    serviceSlug: 'motion-graphics',
    serviceTitle: 'Motion Graphics Studio',
    pillarUrl: 'https://unimasi.studio/services/motion-graphics',
  },
  videotron: {
    serviceSlug: 'videotron',
    serviceTitle: 'Videotron & LED Display Production',
    pillarUrl: 'https://unimasi.studio/services/videotron',
  },
  billboard: {
    serviceSlug: 'videotron',
    serviceTitle: '3D Anamorphic & Videotron',
    pillarUrl: 'https://unimasi.studio/services/videotron',
  },
}

/**
 * Recommends internal links and related entities based on article text/slug
 */
export function getRecommendedLinks(textOrSlug: string, _unusedBrandId?: string): LinkRecommendation[] {
  const normalized = textOrSlug.toLowerCase()
  const recommendations: LinkRecommendation[] = []

  for (const [key, mapping] of Object.entries(TOPIC_SERVICE_MAP)) {
    if (normalized.includes(key)) {
      recommendations.push({
        type: 'service',
        title: mapping.serviceTitle,
        url: mapping.pillarUrl.startsWith('http') ? mapping.pillarUrl : `/services/${mapping.serviceSlug}`,
        reason: `Relevansi topik kata kunci "${key}" dengan layanan inti UNIMASI Studio.`,
        anchorText: mapping.serviceTitle,
      })

      if (mapping.portfolioSlug && mapping.portfolioTitle) {
        recommendations.push({
          type: 'portfolio',
          title: mapping.portfolioTitle,
          url: `/portfolio/${mapping.portfolioSlug}`,
          reason: `Studi kasus animasi terbukti untuk topik "${key}".`,
          anchorText: mapping.portfolioTitle,
        })
      }
    }
  }

  // Fallback default recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'service',
      title: 'Animation & Motion Services',
      url: 'https://unimasi.studio/services',
      reason: 'Layanan pilar utama UNIMASI Studio.',
      anchorText: 'Layanan Animasi UNIMASI',
    })
  }

  return recommendations
}

/**
 * Finds natural anchor opportunities in text for internal linking
 */
export function findAnchorOpportunities(htmlContent: string): {
  matchedAnchor: string
  targetUrl: string
  serviceName: string
}[] {
  const cleanText = htmlContent.replace(/<[^>]+>/g, ' ').toLowerCase()
  const opportunities: { matchedAnchor: string; targetUrl: string; serviceName: string }[] = []

  // Check existing links to avoid over-linking
  const existingLinks = new Set<string>()
  const hrefMatches = htmlContent.matchAll(/href=["']([^"']+)["']/g)
  for (const m of hrefMatches) {
    existingLinks.add(m[1].toLowerCase())
  }

  for (const svc of UNIMASI_SERVICES) {
    if (existingLinks.has(svc.pillarUrl.toLowerCase())) continue

    for (const anchor of svc.anchorVariations) {
      if (cleanText.includes(anchor.toLowerCase())) {
        opportunities.push({
          matchedAnchor: anchor,
          targetUrl: svc.pillarUrl,
          serviceName: svc.name,
        })
        break
      }
    }
  }

  return opportunities
}
