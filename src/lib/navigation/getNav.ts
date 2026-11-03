import type { NavEntry, NavSection, NavItem } from '@/config/navigation'
import { getNavServiceCategories } from '@/lib/db/serviceCategories'
import { getServices } from '@/lib/db/services'
import { getSolutions } from '@/lib/db/solutions'
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
    return trimmed.length > 0 ? trimmed : fallback
  }
  if (typeof img === 'object') {
    const url = img.url || img.src || img.imageUrl
    if (typeof url === 'string') {
      const trimmed = url.trim()
      if (trimmed.length > 0) return trimmed
    }
  }
  return fallback
}

/**
 * Dynamically builds top navigation entries entirely from the SQLite database.
 * No hardcoded fake slugs or broken URLs. Reusable for any brand.
 */
export async function getNavigationEntries(): Promise<NavEntry[]> {
  try {
    const [navCategories, allServices, allSolutions, allPortfolios, allCategories, recentArticlesResult] =
      await Promise.all([
        getNavServiceCategories().catch(() => []),
        getServices().catch(() => []),
        getSolutions().catch(() => []),
        getPortfolios().catch(() => []),
        getCategories().catch(() => []),
        getArticlesDb({ pageSize: 4 }).catch(() => ({ data: [] } as any)),
      ])

    const entries: NavEntry[] = []

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SOLUSI (Dynamic from database)
    // ─────────────────────────────────────────────────────────────────────────
    const publishedSolutions = allSolutions.filter((s: any) => s.status === 'published' || !s.status)
    if (publishedSolutions.length > 0) {
      const solCategoryMap = new Map<string, typeof publishedSolutions>()
      for (const sol of publishedSolutions) {
        const catName = sol.category
          ? sol.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : 'Solusi Unggulan'
        if (!solCategoryMap.has(catName)) {
          solCategoryMap.set(catName, [])
        }
        solCategoryMap.get(catName)!.push(sol)
      }

      const solSections: NavSection[] = []
      for (const [catName, items] of solCategoryMap.entries()) {
        solSections.push({
          title: catName,
          items: items.slice(0, 4).map((s: any) => ({
            label: s.title,
            href: `/solusi/${s.slug}`,
            description: s.shortDescription || '',
            isPopular: Boolean(s.featured),
            image: resolveNavImageUrl(s.heroImage, '/images/portfolio/telkom-dfe.webp'),
          })),
        })
        if (solSections.length >= 3) break
      }

      entries.push({
        label: 'Solusi',
        href: '/solusi',
        mega: solSections.length > 0,
        megaHeader: {
          tag: 'SOLUTIONS',
          viewAllLabel: 'LIHAT SEMUA SOLUSI',
          viewAllHref: '/solusi',
        },
        sections: solSections,
      })
    } else {
      entries.push({
        label: 'Solusi',
        href: '/solusi',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. LAYANAN (Dynamic from database)
    // ─────────────────────────────────────────────────────────────────────────
    if (navCategories.length > 0 && allServices.length > 0) {
      const dynamicServiceSections = navCategories
        .map((cat: any) => {
          const childServices = allServices.filter((s: any) => s.categoryId === cat.id)
          return {
            title: cat.title.split('&')[0].trim(),
            items: childServices.slice(0, 5).map((cs: any) => ({
              label: cs.name,
              href: `/layanan/${cs.slug}`,
              description: cs.shortDescription || '',
              isPopular: Boolean(cs.featured),
              image: resolveNavImageUrl(cs.heroImage?.url || cs.primaryMedia?.imageUrl || cs.heroImage, '/images/nav/web-dev.jpg'),
            })),
          }
        })
        .filter((sec: any) => sec.items.length > 0)

      entries.push({
        label: 'Layanan',
        href: '/layanan',
        mega: dynamicServiceSections.length > 0,
        megaHeader: {
          tag: 'SERVICES',
          viewAllLabel: 'LIHAT SEMUA LAYANAN',
          viewAllHref: '/layanan',
        },
        sections: dynamicServiceSections,
      })
    } else if (allServices.length > 0) {
      entries.push({
        label: 'Layanan',
        href: '/layanan',
        mega: true,
        megaHeader: {
          tag: 'SERVICES',
          viewAllLabel: 'LIHAT SEMUA LAYANAN',
          viewAllHref: '/layanan',
        },
        sections: [
          {
            title: 'Layanan Utama',
            items: allServices.slice(0, 6).map((cs: any) => ({
              label: cs.name,
              href: `/layanan/${cs.slug}`,
              description: cs.shortDescription || '',
              isPopular: Boolean(cs.featured),
              image: resolveNavImageUrl(cs.heroImage?.url || cs.primaryMedia?.imageUrl || cs.heroImage, '/images/nav/web-dev.jpg'),
            })),
          },
        ],
      })
    } else {
      entries.push({
        label: 'Layanan',
        href: '/layanan',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. PORTOFOLIO (Dynamic from database)
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
            image: resolveNavImageUrl(p.heroMedia?.url || p.heroImage, '/images/portfolio/telkom-dfe.webp'),
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
    // 4. ARTIKEL (Dynamic from database)
    // ─────────────────────────────────────────────────────────────────────────
    const recentArticles = (recentArticlesResult as any).data || []
    if (allCategories.length > 0 || recentArticles.length > 0) {
      const articleSections: NavSection[] = []

      if (allCategories.length > 0) {
        articleSections.push({
          title: 'Kategori Artikel',
          items: allCategories.slice(0, 4).map((c: any) => ({
            label: c.name,
            href: `/artikel?kategori=${c.slug}`,
            description: c.description || 'Koleksi artikel dan riset seputar ' + c.name,
            isPopular: true,
            image: '/images/articles/web-architecture.jpg',
          })),
        })
      }

      if (recentArticles.length > 0) {
        articleSections.push({
          title: 'Artikel Terbaru',
          items: recentArticles.slice(0, 3).map((a: any) => ({
            label: a.title,
            href: `/artikel/${a.slug}`,
            description: a.excerpt ? a.excerpt.slice(0, 80) + '...' : '',
            isPopular: false,
            image: resolveNavImageUrl(a.featuredImage || a.coverUrl, '/images/articles/web-architecture.jpg'),
          })),
        })
      }

      entries.push({
        label: 'Artikel',
        href: '/artikel',
        mega: articleSections.length > 0,
        megaHeader: {
          tag: 'KNOWLEDGE BASE',
          viewAllLabel: 'BACA SEMUA ARTIKEL',
          viewAllHref: '/artikel',
        },
        sections: articleSections,
      })
    } else {
      entries.push({
        label: 'Artikel',
        href: '/artikel',
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. TENTANG & KONTAK
    // ─────────────────────────────────────────────────────────────────────────
    entries.push({
      label: 'Tentang',
      href: '/tentang',
    })

    return entries
  } catch (err: any) {
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
    const [allServices, allSolutions, allCategories] = await Promise.all([
      getServices().catch(() => []),
      getSolutions().catch(() => []),
      getCategories().catch(() => []),
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
          href: `/journal?kategori=${c.slug}`,
        })),
      })
    }

    // 3. Studio Column
    sections.push({
      title: 'UNIMASI Studio',
      items: [
        { label: 'Tentang Kami', href: '/about' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Kontak', href: '/contact' },
      ],
    })

    return sections
  } catch (err: any) {
    console.error('Error fetching footer navigation from DB:', err)
    return [
      {
        title: 'UNIMASI Studio',
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
