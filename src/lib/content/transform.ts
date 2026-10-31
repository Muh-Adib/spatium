import type { MediaImage } from './types'

// -----------------------------------------------------------------------------
// Content Transformers — image resolution & text utilities
// No external CMS dependency
// -----------------------------------------------------------------------------

/**
 * Normalize a media image URL to an absolute URL
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('/')) return url
  return `/${url.replace(/^\/+/, '')}`
}

/**
 * Normalize a MediaImage into a friendly object
 */
export function normalizeImage(image: MediaImage | null | undefined): {
  src: string
  alt: string
  width: number
  height: number
  blurUrl?: string
} | null {
  if (!image) return null

  return {
    src: resolveMediaUrl(image.url),
    alt: image.alternativeText ?? image.name ?? '',
    width: image.width,
    height: image.height,
    blurUrl: image.formats?.thumbnail
      ? resolveMediaUrl(image.formats.thumbnail.url)
      : undefined,
  }
}

/**
 * Extract plain text from HTML content for excerpts
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Estimate reading time from content (words per minute: 200)
 */
export function estimateReadingTime(content: string): number {
  const text = stripHtml(content)
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

// --- Cover Image Resolution ------------------------------------------------

const TOPIC_POOLS: Record<string, string[]> = {
  'ai-production': [
    '/images/articles/ai-apps-production.jpg',
    '/images/articles/ai-neural-network.jpg',
    '/images/articles/ai-robot-assistant.jpg',
    '/images/articles/ai-chatbot-interface.jpg',
    '/images/articles/ai-matrix-computing.jpg',
    '/images/articles/ai-deep-learning.jpg',
  ],
  'interactive-3d-web': [
    '/images/articles/interactive-3d-web.jpg',
    '/images/articles/3d-webgl-geometric.jpg',
    '/images/articles/3d-fluid-simulation.jpg',
    '/images/articles/3d-virtual-reality.jpg',
  ],
  'interactive-aquarium': [
    '/images/articles/interactive-3d-aquarium.jpg',
    '/images/articles/3d-aquarium-coral.jpg',
    '/images/articles/3d-aquarium-tropical.jpg',
    '/images/articles/3d-aquarium-jellyfish.jpg',
  ],
  'virtual-exhibition': [
    '/images/articles/virtual-exhibition-3d.jpg',
    '/images/articles/virtual-expo-hall.jpg',
    '/images/articles/3d-virtual-reality.jpg',
  ],
  'corporate-web': [
    '/images/articles/web-architecture.jpg',
    '/images/articles/web-developer-workspace.jpg',
    '/images/articles/web-clean-code.jpg',
    '/images/articles/web-programming-monitor.jpg',
    '/images/articles/web-modern-code.jpg',
  ],
  'ecommerce-web': [
    '/images/articles/ecommerce-web-platform.jpg',
    '/images/articles/ecommerce-digital-store.jpg',
    '/images/articles/ecommerce-online-shopping.jpg',
  ],
  'landing-page': [
    '/images/articles/landing-page-development.jpg',
    '/images/articles/landing-page-hero.jpg',
    '/images/articles/landing-page-responsive.jpg',
  ],
  'lms-education': [
    '/images/articles/lms-education-system.jpg',
    '/images/articles/lms-digital-classroom.jpg',
    '/images/articles/lms-student-campus.jpg',
  ],
  'healthcare-system': [
    '/images/articles/healthcare-information-system.jpg',
    '/images/articles/healthcare-doctor-tablet.jpg',
    '/images/articles/healthcare-hospital-system.jpg',
  ],
  'erp-enterprise': [
    '/images/articles/erp-enterprise-system.jpg',
    '/images/articles/erp-logistics-supply.jpg',
    '/images/articles/erp-business-planning.jpg',
  ],
  'mobile-app': [
    '/images/articles/mobile-app-development.jpg',
    '/images/articles/mobile-app-ui-hand.jpg',
    '/images/articles/mobile-app-design.jpg',
  ],
  'custom-system': [
    '/images/articles/custom-information-system.jpg',
    '/images/articles/custom-database-terminal.jpg',
    '/images/articles/server-datacenter-racks.jpg',
  ],
  'ui-ux-design': [
    '/images/articles/ui-ux-design-system.jpg',
    '/images/articles/uiux-figma-wireframe.jpg',
    '/images/articles/uiux-layout-design.jpg',
    '/images/articles/uiux-experience-planning.jpg',
  ],
  'brand-identity': [
    '/images/articles/brand-identity-design.jpg',
    '/images/articles/brand-stationery-corporate.jpg',
    '/images/articles/brand-color-palette.jpg',
    '/images/articles/brand-typography-poster.jpg',
  ],
  'seo-growth': [
    '/images/articles/seo-growth-analytics.jpg',
    '/images/articles/seo-analytics-growth.jpg',
    '/images/articles/seo-traffic-monitoring.jpg',
  ],
  'web-maintenance': [
    '/images/articles/web-maintenance-security.jpg',
    '/images/articles/server-cloud-security.jpg',
    '/images/articles/server-datacenter-racks.jpg',
  ],
}

const CITY_POOLS: Record<string, string[]> = {
  jakarta: ['/images/cities/jakarta-1.jpg', '/images/cities/jakarta-2.jpg', '/images/cities/jakarta-3.jpg'],
  bogor: ['/images/cities/bogor-1.jpg', '/images/cities/bogor-2.jpg', '/images/cities/bogor-3.jpg'],
  depok: ['/images/cities/depok-1.jpg', '/images/cities/depok-2.jpg', '/images/cities/depok-3.jpg'],
  tangerang: ['/images/cities/tangerang-1.jpg', '/images/cities/tangerang-2.jpg', '/images/cities/tangerang-3.jpg'],
  bekasi: ['/images/cities/bekasi-1.jpg', '/images/cities/bekasi-2.jpg', '/images/cities/bekasi-3.jpg'],
  bandung: ['/images/cities/bandung-1.jpg', '/images/cities/bandung-2.jpg', '/images/cities/bandung-3.jpg'],
  surabaya: ['/images/cities/surabaya-1.jpg', '/images/cities/surabaya-2.jpg', '/images/cities/surabaya-3.jpg'],
  semarang: ['/images/cities/semarang-1.jpg', '/images/cities/semarang-2.jpg'],
  jogja: ['/images/cities/jogja-1.jpg', '/images/cities/jogja-2.jpg', '/images/cities/jogja-3.jpg'],
  solo: ['/images/cities/solo-1.jpg', '/images/cities/solo-2.jpg'],
  bali: ['/images/cities/bali-1.jpg', '/images/cities/bali-2.jpg', '/images/cities/bali-3.jpg'],
  medan: ['/images/cities/medan-1.jpg', '/images/cities/medan-2.jpg'],
  batam: ['/images/cities/batam-1.jpg', '/images/cities/batam-2.jpg', '/images/cities/batam-3.jpg'],
  karawang: ['/images/cities/karawang-1.jpg', '/images/cities/karawang-2.jpg'],
  cikarang: ['/images/cities/cikarang-1.jpg', '/images/cities/cikarang-2.jpg'],
  makassar: ['/images/cities/makassar-1.jpg', '/images/cities/makassar-2.jpg'],
}

function getHashedImage(pool: string[], key: string, offset = 0): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash + offset) % pool.length
  return pool[idx]
}

/**
 * Resolve a cover image for an article.
 * Priority: coverUrl > featuredImage > topic-based pool > city pool > default
 */
export function resolveArticleCover(article: {
  title?: string
  slug?: string
  category?: { name?: string; slug?: string } | null
  featuredImage?: MediaImage | { url: string; alt?: string; width?: number; height?: number } | null
  coverUrl?: string
}): { src: string; alt: string } {
  // 1. Direct coverUrl (curated seed or DB) — reject rate-limited wikimedia
  if (
    article.coverUrl &&
    typeof article.coverUrl === 'string' &&
    article.coverUrl.trim() &&
    !article.coverUrl.includes('wikimedia.org')
  ) {
    return {
      src: article.coverUrl.startsWith('/') || article.coverUrl.startsWith('http')
        ? article.coverUrl
        : resolveMediaUrl(article.coverUrl),
      alt: article.title ? `${article.title} - UNIMASI` : 'Sampul Artikel',
    }
  }

  // 2. If featuredImage is explicitly provided
  if (article.featuredImage) {
    if ('url' in article.featuredImage && typeof article.featuredImage.url === 'string') {
      const url = article.featuredImage.url
      if (!url.includes('/wp-content/uploads/') && !url.includes('wikimedia.org')) {
        return {
          src: url.startsWith('/') || url.startsWith('http') ? url : resolveMediaUrl(url),
          alt:
            ('alt' in article.featuredImage ? article.featuredImage.alt : undefined) ||
            ('alternativeText' in article.featuredImage
              ? (article.featuredImage as MediaImage).alternativeText
              : undefined) ||
            article.title ||
            'Sampul Artikel',
        }
      }
    }
  }

  // 3. Topic & City specific curated images
  const t = `${article.title || ''} ${article.slug || ''}`.toLowerCase()
  const q = `${article.title || ''} ${article.slug || ''} ${article.category?.name || ''}`.toLowerCase()
  const key = article.slug || article.title || 'article'

  // City matching
  for (const [city, pool] of Object.entries(CITY_POOLS)) {
    const isMatch =
      q.includes(city) ||
      (city === 'jogja' && (q.includes('yogyakarta') || q.includes('jogja'))) ||
      (city === 'jakarta' &&
        (q.includes('jaksel') || q.includes('jaktim') || q.includes('jakbar') || q.includes('jakpus') || q.includes('jakut')))
    if (isMatch) {
      return {
        src: getHashedImage(pool, key),
        alt: `${article.title || 'Artikel'} - ${city.charAt(0).toUpperCase() + city.slice(1)}`,
      }
    }
  }

  if (t.includes('aquarium') || t.includes('akuarium') || t.includes('scan-to-swim'))
    return { src: getHashedImage(TOPIC_POOLS['interactive-aquarium'], key), alt: `${article.title} - 3D Aquarium WebGL` }
  if (t.includes('3d web') || t.includes('three.js') || t.includes('webgl') || (t.includes('3d') && !t.includes('pameran')))
    return { src: getHashedImage(TOPIC_POOLS['interactive-3d-web'], key), alt: `${article.title} - Interactive 3D WebGL` }
  if (q.includes('virtual exhibition') || q.includes('pameran virtual') || q.includes('virtual tour') || q.includes('vr '))
    return { src: getHashedImage(TOPIC_POOLS['virtual-exhibition'], key), alt: `${article.title} - Virtual Exhibition 3D` }
  if (t.includes('next.js') || t.includes('nextjs') || t.includes('headless') || t.includes('arsitektur web'))
    return { src: getHashedImage(TOPIC_POOLS['corporate-web'], key), alt: `${article.title} - Modern Web Architecture` }
  if (q.includes('ai ') || q.includes('ai-') || q.includes('artificial') || q.includes('machine learning') || q.includes('chatbot') || q.includes('kecerdasan'))
    return { src: getHashedImage(TOPIC_POOLS['ai-production'], key), alt: `${article.title} - AI & Intelligent Automation` }
  if (q.includes('ui/ux') || q.includes('ui-ux') || q.includes('wireframe') || q.includes('figma') || q.includes('antarmuka'))
    return { src: getHashedImage(TOPIC_POOLS['ui-ux-design'], key), alt: `${article.title} - UI/UX Design` }
  if (q.includes('brand') || q.includes('logo') || q.includes('identitas visual') || q.includes('branding'))
    return { src: getHashedImage(TOPIC_POOLS['brand-identity'], key), alt: `${article.title} - Brand Identity` }
  if (q.includes('commerce') || q.includes('toko online') || q.includes('marketplace'))
    return { src: getHashedImage(TOPIC_POOLS['ecommerce-web'], key), alt: `${article.title} - E-Commerce Platform` }
  if (q.includes('landing page') || q.includes('promosi') || q.includes('konversi'))
    return { src: getHashedImage(TOPIC_POOLS['landing-page'], key), alt: `${article.title} - Landing Page` }
  if (q.includes('lms') || q.includes('pembelajaran') || q.includes('sekolah') || q.includes('akademik'))
    return { src: getHashedImage(TOPIC_POOLS['lms-education'], key), alt: `${article.title} - LMS & EduTech` }
  if (q.includes('rumah sakit') || q.includes('simrs') || q.includes('klinik') || q.includes('kesehatan'))
    return { src: getHashedImage(TOPIC_POOLS['healthcare-system'], key), alt: `${article.title} - Healthcare Information System` }
  if (q.includes('erp') || q.includes('manufaktur') || q.includes('inventory') || q.includes('supply chain'))
    return { src: getHashedImage(TOPIC_POOLS['erp-enterprise'], key), alt: `${article.title} - Enterprise Resource Planning` }
  if (q.includes('mobile app') || q.includes('android') || q.includes('ios'))
    return { src: getHashedImage(TOPIC_POOLS['mobile-app'], key), alt: `${article.title} - Mobile Application` }
  if (q.includes('seo') || q.includes('ranking') || q.includes('serp') || q.includes('kata kunci'))
    return { src: getHashedImage(TOPIC_POOLS['seo-growth'], key), alt: `${article.title} - SEO & Traffic Growth` }
  if (q.includes('maintenance') || q.includes('pemeliharaan') || q.includes('keamanan'))
    return { src: getHashedImage(TOPIC_POOLS['web-maintenance'], key), alt: `${article.title} - Website Maintenance` }

  // Default
  return {
    src: getHashedImage(TOPIC_POOLS['corporate-web'], key),
    alt: article.title ? `${article.title} - UNIMASI Platform` : 'Digital Experience Platform',
  }
}
