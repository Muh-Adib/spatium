/**
 * Internal Linking & Content Relationship Engine
 *
 * Maps content entities (Articles, Services, Portfolios, Solutions)
 * to prevent orphan pages and ensure topical clustering across the 10-Brand ecosystem.
 */

export interface LinkRecommendation {
  type: 'service' | 'portfolio' | 'article'
  title: string
  url: string
  reason: string
  anchorText?: string
}

const SEGIATECH_SERVICES = [
  {
    name: 'Website Development',
    pillarUrl: 'https://www.segiatech.com/layanan/website-development',
    anchorVariations: ['jasa pembuatan website', 'website development', 'pengembangan website', 'bikin website'],
  },
  {
    name: 'AI Application & LLM Integration',
    pillarUrl: 'https://www.segiatech.com/layanan/cloud-data-ai',
    anchorVariations: ['integrasi AI', 'aplikasi AI', 'kecerdasan buatan', 'otomasi AI'],
  },
  {
    name: 'Custom Web Application',
    pillarUrl: 'https://www.segiatech.com/layanan/software-product',
    anchorVariations: ['aplikasi web custom', 'custom web application', 'rekayasa perangkat lunak web'],
  },
  {
    name: 'Mobile First Application',
    pillarUrl: 'https://www.segiatech.com/layanan/software-product',
    anchorVariations: ['aplikasi mobile', 'mobile app development', 'pembuatan aplikasi Android'],
  },
]

// Topic-to-service mapping dictionary for SegiaTech internal ecosystem
const TOPIC_SERVICE_MAP: Record<string, { serviceSlug: string; serviceTitle: string; pillarUrl: string; portfolioSlug?: string; portfolioTitle?: string }> = {
  crm: {
    serviceSlug: 'crm-development',
    serviceTitle: 'CRM Development',
    pillarUrl: 'https://www.segiatech.com/layanan/business-systems',
  },
  pmb: {
    serviceSlug: 'pmb-sistem-akademik',
    serviceTitle: 'PMB & Sistem Akademik',
    pillarUrl: 'https://www.segiatech.com/layanan/business-systems',
    portfolioSlug: 'website-pmb-umby',
    portfolioTitle: 'Website PMB UMBY',
  },
  sekolah: {
    serviceSlug: 'website-development',
    serviceTitle: 'Website Development Sekolah & Yayasan',
    pillarUrl: 'https://www.segiatech.com/layanan/website-development',
    portfolioSlug: 'website-smk-pb-soedirman-2',
    portfolioTitle: 'Website SMK PB Soedirman 2',
  },
  umkm: {
    serviceSlug: 'website-development',
    serviceTitle: 'Jasa Pembuatan Website Bisnis & UMKM',
    pillarUrl: 'https://www.segiatech.com/layanan/website-development',
    portfolioSlug: 'website-yspi',
    portfolioTitle: 'Website YSPI',
  },
  'virtual-tour': {
    serviceSlug: 'virtual-tour',
    serviceTitle: 'Virtual Tour & 360 Interactive',
    pillarUrl: 'https://www.segiatech.com/layanan/software-product',
    portfolioSlug: 'virtual-exhibition-ugm',
    portfolioTitle: 'Virtual Exhibition UGM',
  },
  ai: {
    serviceSlug: 'ai-application',
    serviceTitle: 'AI Application & LLM Integration',
    pillarUrl: 'https://www.segiatech.com/layanan/cloud-data-ai',
  },
  'ui-ux': {
    serviceSlug: 'ui-ux-design',
    serviceTitle: 'UI/UX Design Studio',
    pillarUrl: 'https://www.segiatech.com/layanan/ui-ux-design',
  },
  '3d': {
    serviceSlug: 'interactive-3d-web',
    serviceTitle: 'Interactive 3D Web & Three.js',
    pillarUrl: 'https://www.segiatech.com/layanan/software-product',
    portfolioSlug: 'interactive-3d-aquarium-edutainment',
    portfolioTitle: 'Interactive 3D Aquarium',
  },
  animasi: {
    serviceSlug: 'interactive-3d-web',
    serviceTitle: 'Animasi Web & Visualisasi Interaktif',
    pillarUrl: 'https://www.segiatech.com/layanan/software-product',
  },
  video: {
    serviceSlug: 'software-product',
    serviceTitle: 'Media & Digital Showcase Experience',
    pillarUrl: 'https://www.segiatech.com/layanan/software-product',
  },
  streaming: {
    serviceSlug: 'cloud-data-ai',
    serviceTitle: 'Realtime Infrastructure & Streaming Systems',
    pillarUrl: 'https://www.segiatech.com/layanan/cloud-data-ai',
  },
  branding: {
    serviceSlug: 'ui-ux-design',
    serviceTitle: 'Brand Identity & Digital Design System',
    pillarUrl: 'https://www.segiatech.com/layanan/ui-ux-design',
  },
  manufaktur: {
    serviceSlug: 'business-systems',
    serviceTitle: 'Industrial Systems & Enterprise Automation',
    pillarUrl: 'https://www.segiatech.com/layanan/business-systems',
  },
  kesehatan: {
    serviceSlug: 'business-systems',
    serviceTitle: 'Sistem Informasi & Manajemen Terintegrasi',
    pillarUrl: 'https://www.segiatech.com/layanan/business-systems',
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
        url: mapping.pillarUrl.startsWith('http') ? mapping.pillarUrl : `/layanan/${mapping.serviceSlug}`,
        reason: `Relevansi topik kata kunci "${key}" dengan layanan inti SegiaTech.`,
        anchorText: mapping.serviceTitle,
      })

      if (mapping.portfolioSlug && mapping.portfolioTitle) {
        recommendations.push({
          type: 'portfolio',
          title: mapping.portfolioTitle,
          url: `/portofolio/${mapping.portfolioSlug}`,
          reason: `Studi kasus pembuktian (proof layer) untuk ${mapping.serviceTitle}.`,
          anchorText: mapping.portfolioTitle,
        })
      }
    }
  }

  // Default fallback if no specific match
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'service',
      title: 'Website Development',
      url: '/layanan/website-development',
      reason: 'Layanan pilar utama SegiaTech.',
      anchorText: 'jasa pembuatan website',
    })
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  return recommendations.filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })
}

/**
 * Automatically inject internal links into content paragraphs contextually
 * Ensures links to pillar URLs with natural anchor texts (max 2-3 links per article)
 */
export function injectContextualInternalLinks(
  htmlContent: string,
  _unusedBrandId?: string,
  _primaryKeyword?: string
): string {
  if (!htmlContent) return ''

  let content = htmlContent
  let injectedCount = 0
  const maxInjections = 3

  // Search each service anchor of SegiaTech
  for (const svc of SEGIATECH_SERVICES) {
    if (injectedCount >= maxInjections) break

    for (const anchor of svc.anchorVariations) {
      if (injectedCount >= maxInjections) break

      // Only link if the anchor text is present in a <p> tag and not already linked inside <a>
      const regex = new RegExp(`(<p[^>]*>(?:(?!<\\/p>)[\\s\\S])*?)(?<!<a[^>]*>)(${escapeRegExp(anchor)})(?![^<]*<\\/a>)((?:(?!<\\/p>)[\\s\\S])*?<\\/p>)`, 'i')

      if (regex.test(content)) {
        content = content.replace(regex, (match, prefix, matchedText, suffix) => {
          return `${prefix}<a href="${svc.pillarUrl}" class="text-accent-400 hover:underline font-medium" title="${svc.name}">${matchedText}</a>${suffix}`
        })
        injectedCount++
        break
      }
    }
  }

  return content
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
