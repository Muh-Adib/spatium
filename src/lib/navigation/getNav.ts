import type { NavEntry, NavSection, NavItem } from '@/config/navigation'
import { getNavServiceCategories } from '@/lib/db/serviceCategories'
import { getServices } from '@/lib/db/services'
import { getPortfolios } from '@/lib/db/portfolio'
import { getCategories } from '@/lib/content/queries'
import { getArticles as getArticlesDb } from '@/lib/db/articles'

export interface FooterNavItem {
  label: string
  href: string
}

export interface FooterNavSection {
  title: string
  items: FooterNavItem[]
}

function resolveNavImageUrl(img: any, fallback: string): string {
  if (!img) return fallback
  if (typeof img === 'string') {
    const trimmed = img.trim()
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        const url = parsed.url || parsed.src || parsed.imageUrl
        if (typeof url === 'string' && url.trim().length > 0) return url.trim()
      } catch (err) { console.warn("[observable error]:", err) }
    }
    return trimmed.length > 0 ? trimmed : fallback
  }
  if (typeof img === 'object' && img !== null) {
    const url = img.url || img.src || img.imageUrl
    if (typeof url === 'string') {
      const trimmed = url.trim()
      if (trimmed.length > 0) return trimmed
    }
  }
  return fallback
}

/** Log a failed nav data source and return an honest empty value (no mock data). */
function logNavFallback<T>(source: string, err: unknown, empty: T): T {
  console.warn(`[navigation] Failed to load ${source}; rendering without it.`, err)
  return empty
}

/**
 * Dynamically builds top navigation entries entirely from the SQLite database.
 * No hardcoded fake slugs or broken URLs. Reusable for any brand.
 */
export async function getNavigationEntries(): Promise<NavEntry[]> {
  try {
    const [navCategories, allServices, allPortfolios, allCategories, recentArticlesResult] =
      await Promise.all([
        getNavServiceCategories().catch((err) => logNavFallback('service categories', err, [])),
        getServices().catch((err) => logNavFallback('services', err, [])),
        getPortfolios().catch((err) => logNavFallback('portfolios', err, [])),
        getCategories().catch((err) => logNavFallback('article categories', err, [])),
        getArticlesDb({ pageSize: 4 }).catch((err) =>
          logNavFallback('recent articles', err, { data: [], total: 0, page: 1, pageSize: 4, totalPages: 0 })
        ),
      ])

    const entries: NavEntry[] = []

    // ─────────────────────────────────────────────────────────────────────────
    // 1. LAYANAN (Dynamic from database)
    // ─────────────────────────────────────────────────────────────────────────
    if (navCategories.length > 0 && allServices.length > 0) {
      const dynamicServiceSections = navCategories
        .map((cat: any) => {
          const childServices = allServices.filter((s: any) => s.categoryId === cat.id)
          return {
            title: cat.title.split('&')[0].trim(),
            items: childServices.slice(0, 5).map((cs: any) => ({
              label: cs.name,
              href: `/services/${cs.slug}`,
              description: cs.shortDescription || '',
              isPopular: Boolean(cs.featured),
              image: resolveNavImageUrl(cs.heroImage?.url || cs.primaryMedia?.imageUrl || cs.heroImage, '/images/spatium/web/way-digitaltwin.webp'),
            })),
          }
        })
        .filter((sec: any) => sec.items.length > 0)

      entries.push({
        label: 'Layanan',
        href: '/services',
        mega: dynamicServiceSections.length > 0,
        megaHeader: {
          tag: 'SERVICES',
          viewAllLabel: 'LIHAT SEMUA LAYANAN',
          viewAllHref: '/services',
        },
        sections: dynamicServiceSections,
      })
    } else if (allServices.length > 0) {
      entries.push({
        label: 'Layanan',
        href: '/services',
        mega: true,
        megaHeader: {
          tag: 'SERVICES',
          viewAllLabel: 'LIHAT SEMUA LAYANAN',
          viewAllHref: '/services',
        },
        sections: [
          {
            title: 'Layanan Utama',
            items: allServices.slice(0, 6).map((cs: any) => ({
              label: cs.name,
              href: `/services/${cs.slug}`,
              description: cs.shortDescription || '',
              isPopular: Boolean(cs.featured),
              image: resolveNavImageUrl(cs.heroImage?.url || cs.primaryMedia?.imageUrl || cs.heroImage, '/images/spatium/web/way-digitaltwin.webp'),
            })),
          },
        ],
      })
    } else {
      entries.push({
        label: 'Layanan',
        href: '/services',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PORTOFOLIO (Dynamic from database)
    // ─────────────────────────────────────────────────────────────────────────
    if (allPortfolios.length > 0) {
      const portCategoryMap = new Map<string, any[]>()
      for (const p of allPortfolios) {
        const cat = p.category || 'Studi Kasus'
        if (!portCategoryMap.has(cat)) {
          portCategoryMap.set(cat, [])
        }
        portCategoryMap.get(cat)!.push(p)
      }

      const portSections: NavSection[] = []
      for (const [catName, items] of portCategoryMap.entries()) {
        portSections.push({
          title: catName,
          items: items.slice(0, 3).map((p: any) => ({
            label: p.title,
            href: `/portfolio/${p.slug}`,
            description: p.summary || p.client || '',
            isPopular: Boolean(p.featured),
            image: resolveNavImageUrl(p.heroMedia?.url || p.heroImage, '/images/spatium/web/hub.webp'),
          })),
        })
        if (portSections.length >= 3) break
      }

      entries.push({
        label: 'Portfolio',
        href: '/portfolio',
        mega: portSections.length > 0,
        megaHeader: {
          tag: 'CASE STUDIES',
          viewAllLabel: 'SEMUA STUDI KASUS & KARYA',
          viewAllHref: '/portfolio',
        },
        sections: portSections,
      })
    } else {
      entries.push({
        label: 'Portfolio',
        href: '/portfolio',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ARTIKEL (Dynamic from database)
    // ─────────────────────────────────────────────────────────────────────────
    const recentArticles = (recentArticlesResult as { data?: unknown[] }).data || []
    if (allCategories.length > 0 || recentArticles.length > 0) {
      const articleSections: NavSection[] = []

      if (allCategories.length > 0) {
        articleSections.push({
          title: 'Kategori Artikel',
          items: allCategories.slice(0, 4).map((c: any) => ({
            label: c.name,
            href: `/journal?category=${c.slug}`,
            description: c.description || 'Koleksi artikel dan riset seputar ' + c.name,
            isPopular: true,
            image: '/images/spatium/web/spatial-media.webp',
          })),
        })
      }

      if (recentArticles.length > 0) {
        articleSections.push({
          title: 'Artikel Terbaru',
          items: recentArticles.slice(0, 3).map((a: any) => ({
            label: a.title,
            href: `/journal/${a.slug}`,
            description: a.excerpt ? a.excerpt.slice(0, 80) + '...' : '',
            isPopular: false,
            image: resolveNavImageUrl(a.featuredImage || a.coverUrl, '/images/spatium/web/spatial-media.webp'),
          })),
        })
      }

      entries.push({
        label: 'Artikel',
        href: '/journal',
        mega: articleSections.length > 0,
        megaHeader: {
          tag: 'KNOWLEDGE BASE',
          viewAllLabel: 'BACA SEMUA ARTIKEL',
          viewAllHref: '/journal',
        },
        sections: articleSections,
      })
    } else {
      entries.push({
        label: 'Artikel',
        href: '/journal',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. TENTANG & KONTAK
    // ─────────────────────────────────────────────────────────────────────────
    entries.push({
      label: 'Tentang',
      href: '/about',
    })
    entries.push({
      label: 'Kontak',
      href: '/contact',
    })

    return entries
  } catch (err: unknown) {
    console.error('Error fetching dynamic navigation from DB:', err)
    return [
      { label: 'Services', href: '/services' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Journal', href: '/journal' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ]
  }
}

/**
 * Dynamically builds footer navigation columns from real database entities.
 */
export async function getFooterNavEntries(): Promise<FooterNavSection[]> {
  try {
    const [allServices, allCategories] = await Promise.all([
      getServices().catch((err) => logNavFallback('services', err, [])),
      getCategories().catch((err) => logNavFallback('article categories', err, [])),
    ])

    const sections: FooterNavSection[] = []

    // 1. Layanan Column
    if (allServices.length > 0) {
      sections.push({
        title: 'Services',
        items: allServices.slice(0, 5).map((s: any) => ({
          label: s.name,
          href: `/services/${s.slug}`,
        })),
      })
    }

    // 2. Wawasan / Journal Column
    if (allCategories.length > 0) {
      sections.push({
        title: 'Journal',
        items: allCategories.slice(0, 5).map((c: any) => ({
          label: c.name,
          href: `/journal?category=${c.slug}`,
        })),
      })
    }

    // 3. Studio Column
    sections.push({
      title: 'SPATIUM',
      items: [
        { label: 'Tentang Kami', href: '/about' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Kontak', href: '/contact' },
      ],
    })

    return sections
  } catch (err: unknown) {
    console.error('Error fetching footer navigation from DB:', err)
    return [
      {
        title: 'SPATIUM',
        items: [
          { label: 'About', href: '/about' },
          { label: 'Services', href: '/services' },
          { label: 'Portfolio', href: '/portfolio' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ]
  }
}
