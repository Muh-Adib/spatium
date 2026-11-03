import { prisma } from '../src/lib/db/prisma'
import fs from 'fs'
import path from 'path'

async function seed() {
  console.log('🌱 Starting database seeding from JSON seeds with Prisma 8...')

  const seedDir = path.resolve(process.cwd(), 'src/data/seed')
  const readSeed = (filename: string) => {
    const p1 = path.join(seedDir, filename)
    if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, 'utf-8'))
    return []
  }

  const rawArticles = readSeed('seed_articles.json')
  const rawPortfolios = readSeed('seed_portfolio.json')
  const rawServiceCategories = readSeed('seed_service_categories.json')
  const rawServices = readSeed('seed_services.json')
  const rawPages = readSeed('seed_pages.json')
  const rawRedirects = readSeed('seed_redirects.json')

  // 1. Categories Map
  console.log('Inserting categories...')
  const categoryMap = new Map<string, number>()
  for (const art of rawArticles) {
    if (art.category && art.category.slug && !categoryMap.has(art.category.slug)) {
      const existing = await prisma.orm.public.Category.where({ slug: art.category.slug }).first()
      if (existing) {
        categoryMap.set(existing.slug, existing.id)
      } else {
        const inserted = await prisma.orm.public.Category.create({
          name: art.category.name || art.category.slug,
          slug: art.category.slug,
          description: art.category.description || null,
        })
        categoryMap.set(inserted.slug, inserted.id)
      }
    }
  }

  const allCategories = await prisma.orm.public.Category.all()
  for (const c of allCategories) {
    categoryMap.set(c.slug, c.id)
  }
  console.log(`✓ Cached ${categoryMap.size} categories.`)

  // 2. Authors Map
  console.log('Inserting authors...')
  const authorMap = new Map<string, number>()
  for (const art of rawArticles) {
    const authorName = typeof art.author === 'string' ? art.author : art.author?.name
    const authorSlug = (typeof art.author === 'object' && art.author?.slug) || 'tim-redaksi'
    if (authorName && !authorMap.has(authorSlug)) {
      const existing = await prisma.orm.public.Author.where({ slug: authorSlug }).first()
      if (existing) {
        authorMap.set(existing.slug, existing.id)
      } else {
        const inserted = await prisma.orm.public.Author.create({
          name: authorName,
          slug: authorSlug,
          email: `${authorSlug}@unimasi.studio`,
          bio: 'Penulis & Kontributor Tim Editorial UNIMASI',
        })
        authorMap.set(inserted.slug, inserted.id)
      }
    }
  }

  const allAuthors = await prisma.orm.public.Author.all()
  for (const a of allAuthors) {
    authorMap.set(a.slug, a.id)
  }
  console.log(`✓ Cached ${authorMap.size} authors.`)

  // 3. Articles (Batch insertion)
  console.log(`Inserting ${rawArticles.length} articles...`)
  for (const art of rawArticles) {
    const catSlug = art.category?.slug
    const catId = catSlug ? categoryMap.get(catSlug) || null : null
    const authSlug = (typeof art.author === 'object' && art.author?.slug) || 'tim-redaksi'
    const authId = authorMap.get(authSlug) || null

    const featImg =
      typeof art.featuredImage === 'string'
        ? art.featuredImage
        : art.featuredImage?.url || art.coverUrl || null

    const existing = await prisma.orm.public.Article.where({ slug: art.slug }).first()
    if (!existing) {
      await prisma.orm.public.Article.create({
        documentId: art.documentId || `art-${art.slug}`,
        slug: art.slug,
        title: art.title || 'Untitled Article',
        excerpt: art.excerpt || '',
        content: art.content || '',
        status: (art.status || 'published').toLowerCase(),
        featuredImage: featImg,
        coverUrl: art.coverUrl || featImg,
        readingTime: art.readingTime || 4,
        metaTitle: art.seo?.metaTitle || art.title,
        metaDescription: art.seo?.metaDescription || art.excerpt,
        canonicalUrl: art.seo?.canonicalUrl || null,
        robots: art.seo?.robotsIndex === false ? 'noindex, nofollow' : 'index, follow',
        ogImage: typeof art.seo?.ogImage === 'string' ? art.seo.ogImage : art.seo?.ogImage?.url || featImg,
        categoryId: catId,
        authorId: authId,
      })
    }
  }
  console.log(`✓ Inserted articles.`)

  // 4. Portfolios
  console.log(`Inserting ${rawPortfolios.length} portfolios...`)
  for (const port of rawPortfolios) {
    const existing = await prisma.orm.public.Portfolio.where({ slug: port.slug }).first()
    const heroImg = port.heroMedia?.url || port.heroImage || null
    if (!existing) {
      await prisma.orm.public.Portfolio.create({
        documentId: port.documentId || `port-${port.slug}`,
        slug: port.slug,
        title: port.title,
        client: port.client || null,
        year: port.year || 2024,
        category: port.category || port.discipline || port.projectType || '3D Animation',
        summary: port.summary || '',
        challenge: port.challenge || null,
        approach: port.approach || null,
        solution: port.solution || null,
        process: port.process || null,
        result: port.result || null,
        heroImage: heroImg,
        liveUrl: port.livePreviewUrl || port.liveUrl || null,
        featured: Boolean(port.featured),
        status: 'published',
        metrics: port.metrics ? JSON.stringify(port.metrics) : null,
        technologies: port.technologies ? JSON.stringify(port.technologies) : null,
        gallery: port.gallery ? JSON.stringify(port.gallery) : null,
        metaTitle: port.seo?.metaTitle || port.title,
        metaDescription: port.seo?.metaDescription || port.summary,
      })
    } else {
      await prisma.orm.public.Portfolio.where({ id: existing.id }).update({
        heroImage: heroImg,
        title: port.title,
        client: port.client || existing.client,
        category: port.category || existing.category,
        summary: port.summary || existing.summary,
        metaTitle: port.seo?.metaTitle || port.title,
        metaDescription: port.seo?.metaDescription || port.summary,
      })
    }
  }
  console.log(`✓ Inserted portfolios.`)

  // 5a. Service categories (core services) — idempotent upsert by slug
  console.log(`Inserting ${rawServiceCategories.length} service categories...`)
  const categoryIdBySlug = new Map<string, number>()
  for (const cat of rawServiceCategories) {
    const existing = await prisma.orm.public.ServiceCategory.where({ slug: cat.slug }).first()
    if (existing) {
      categoryIdBySlug.set(cat.slug, existing.id)
      await prisma.orm.public.ServiceCategory.where({ id: existing.id }).update({
        title: cat.title,
        tag: cat.tag ?? null,
        shortDescription: cat.shortDescription ?? null,
        order: cat.order ?? 0,
        status: cat.status ?? 'published',
        showInNav: cat.showInNav ?? true,
        metaTitle: cat.metaTitle ?? cat.title,
        metaDescription: cat.metaDescription ?? cat.shortDescription ?? null,
      })
    } else {
      const created = await prisma.orm.public.ServiceCategory.create({
        slug: cat.slug,
        title: cat.title,
        tag: cat.tag ?? null,
        shortDescription: cat.shortDescription ?? null,
        order: cat.order ?? 0,
        status: cat.status ?? 'published',
        showInNav: cat.showInNav ?? true,
        metaTitle: cat.metaTitle ?? cat.title,
        metaDescription: cat.metaDescription ?? cat.shortDescription ?? null,
      })
      categoryIdBySlug.set(cat.slug, created.id)
    }
  }
  console.log(`✓ Inserted service categories.`)

  // 5b. Services (children) — idempotent upsert by slug, linked to category
  console.log(`Inserting ${rawServices.length} services...`)
  for (let idx = 0; idx < rawServices.length; idx++) {
    const svc = rawServices[idx]
    const categoryId = svc.categorySlug ? categoryIdBySlug.get(svc.categorySlug) ?? null : null
    const payload = {
      name: svc.name || svc.title || svc.slug,
      categoryId,
      indexNumber: svc.indexNumber ?? null,
      shortDescription: svc.shortDescription || svc.summary || null,
      description: svc.description || svc.fullDescription || svc.summary || null,
      icon: svc.icon || null,
      heroImage: svc.heroImage?.url || null,
      features: svc.features ? JSON.stringify(svc.features) : null,
      deliverables: svc.deliverables ? JSON.stringify(svc.deliverables) : null,
      technologies: svc.technologies ? JSON.stringify(svc.technologies) : null,
      faq: svc.faq ? JSON.stringify(svc.faq) : null,
      order: svc.order ?? idx + 1,
      status: svc.status ?? 'published',
      featured: idx < 6,
      metaTitle: svc.seo?.metaTitle || svc.name || svc.title,
      metaDescription: svc.seo?.metaDescription || svc.shortDescription || svc.summary,
    }
    const existing = await prisma.orm.public.Service.where({ slug: svc.slug }).first()
    if (existing) {
      await prisma.orm.public.Service.where({ id: existing.id }).update(payload)
    } else {
      await prisma.orm.public.Service.create({
        documentId: svc.documentId || `svc-${svc.slug}`,
        slug: svc.slug,
        ...payload,
      })
    }
  }
  console.log(`✓ Inserted services.`)

  // 6. Pages
  console.log(`Inserting ${rawPages.length} pages...`)
  for (const page of rawPages) {
    const existing = await prisma.orm.public.Page.where({ slug: page.slug }).first()
    const isLanding = page.slug?.includes('jasa-pembuatan-website')
    if (!existing) {
      await prisma.orm.public.Page.create({
        documentId: page.documentId || `page-${page.slug}`,
        slug: page.slug,
        title: page.title,
        kind: isLanding ? 'landing' : 'standard',
        status: 'published',
        excerpt: page.excerpt || null,
        content: page.content || null,
        blocks: page.blocks ? JSON.stringify(page.blocks) : null,
        metaTitle: page.seo?.metaTitle || page.title,
        metaDescription: page.seo?.metaDescription || page.excerpt,
      })
    } else if (isLanding && existing.kind !== 'landing') {
      await prisma.orm.public.Page.where({ id: existing.id }).update({
        kind: 'landing',
        status: 'published',
      })
    }
  }
  console.log(`✓ Inserted pages.`)

  // 7. Redirects
  console.log(`Inserting ${rawRedirects.length} redirects...`)
  for (const red of rawRedirects) {
    const existing = await prisma.orm.public.Redirect.where({ sourcePath: red.sourcePath }).first()
    if (!existing) {
      await prisma.orm.public.Redirect.create({
        sourcePath: red.sourcePath,
        destinationPath: red.destinationPath,
        statusCode: red.statusCode || 301,
        reason: red.reason || 'WordPress Migration Redirect',
        active: true,
      })
    }
  }
  console.log(`✓ Inserted redirects.`)

  // 8. Site Config
  console.log('Inserting default site configuration...')
  const existingConfig = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
  if (!existingConfig) {
    await prisma.orm.public.SiteConfig.create({
      id: 1,
      name: 'UNIMASI Studio',
      tagline: 'We Make Ideas Move — 2D & 3D Animation, Motion Graphics & Videotron',
      description:
        'UNIMASI adalah studio animasi 2D, 3D, motion graphics, dan visual production untuk edukasi, industri, dan brands.',
      url: 'https://unimasi.studio',
      whatsapp: '6283121138821',
      email: 'hello@unimasi.studio',
      phone: '+62 831-2113-8821',
      address: 'Yogyakarta, Indonesia',
      socialLinks: JSON.stringify({
        instagram: 'https://instagram.com/unimasi.studio',
        linkedin: 'https://linkedin.com/company/unimasi',
        github: 'https://github.com/unimasi',
      }),
    })
  }
  console.log(`✓ Inserted site config.`)

  // 8b. Delivery API Multi-Tenant Site Entity
  console.log('Inserting default Delivery API Site tenant entity...')
  const existingSite = await prisma.orm.public.Site.where({ slug: 'unimasi' }).first()
  if (!existingSite) {
    await prisma.orm.public.Site.create({
      slug: 'unimasi',
      name: 'UNIMASI Studio',
      domain: 'unimasi.studio',
      apiKey: process.env.SITE_API_KEY || 'site_sec_unimasi',
      isActive: true,
      settings: JSON.stringify({}),
    })
  }
  console.log(`✓ Inserted Delivery API Site tenant entity.`)

  // 9. Locations
  console.log('Inserting default locations...')
  const defaultLocations = [
    { name: 'Jakarta', slug: 'jakarta', region: 'DKI Jakarta', image: '/images/cities/jakarta-1.jpg' },
    { name: 'Surabaya', slug: 'surabaya', region: 'Jawa Timur', image: '/images/cities/surabaya-1.jpg' },
    { name: 'Bandung', slug: 'bandung', region: 'Jawa Barat', image: '/images/cities/bandung-1.jpg' },
    { name: 'Medan', slug: 'medan', region: 'Sumatera Utara', image: '/images/cities/medan-1.jpg' },
    { name: 'Semarang', slug: 'semarang', region: 'Jawa Tengah', image: '/images/cities/semarang-1.jpg' },
    { name: 'Makassar', slug: 'makassar', region: 'Sulawesi Selatan', image: '/images/cities/makassar-1.jpg' },
    { name: 'Palembang', slug: 'palembang', region: 'Sumatera Selatan', image: '/images/cities/palembang-1.jpg' },
    { name: 'Batam', slug: 'batam', region: 'Kepulauan Riau', image: '/images/cities/batam-1.jpg' },
    { name: 'Bali', slug: 'bali', region: 'Bali', image: '/images/cities/bali-1.jpg' },
    { name: 'Yogyakarta', slug: 'yogyakarta', region: 'DI Yogyakarta', image: '/images/cities/yogyakarta-1.jpg' },
    { name: 'Bekasi', slug: 'bekasi', region: 'Jawa Barat', image: '/images/cities/bekasi-1.jpg' },
    { name: 'Depok', slug: 'depok', region: 'Jawa Barat', image: '/images/cities/depok-1.jpg' },
    { name: 'Tangerang', slug: 'tangerang', region: 'Banten', image: '/images/cities/tangerang-1.jpg' },
    { name: 'Bogor', slug: 'bogor', region: 'Jawa Barat', image: '/images/cities/bogor-1.jpg' },
    { name: 'Cikarang', slug: 'cikarang', region: 'Jawa Barat', image: '/images/cities/cikarang-1.jpg' },
    { name: 'Karawang', slug: 'karawang', region: 'Jawa Barat', image: '/images/cities/karawang-1.jpg' },
  ]

  for (const loc of defaultLocations) {
    const existing = await prisma.orm.public.Location.where({ slug: loc.slug }).first()
    if (!existing) {
      await prisma.orm.public.Location.create(loc)
    }
  }
  console.log(`✓ Inserted ${defaultLocations.length} locations.`)

  // 10. Voice Profile
  console.log('Inserting active voice profile...')
  const existingVoice = await prisma.orm.public.VoiceProfile.where({ active: true }).first()
  if (!existingVoice) {
    await prisma.orm.public.VoiceProfile.create({
      name: 'SegiaTech Engineering Editorial Voice',
      version: 1,
      stylometry: JSON.stringify({
        wordCount: 1500,
        avgSentenceLength: 16.5,
        povRatios: { firstPersonPlural: 0.65, secondPerson: 0.25 },
      }),
      guide: 'Otoritatif, teknikal, arsitektural, presisi enterprise',
      lexicon: JSON.stringify({
        bannedPhrases: ['termurah se-indonesia', 'bisa dinego tipis', 'dijamin no tipu tipu'],
        signaturePhrases: ['arsitektur web modern', 'latensi sub-detik', 'rekayasa perangkat lunak enterprise'],
        mandatoryTerms: ['SegiaTech', 'Next.js', 'PostgreSQL'],
      }),
      structure: JSON.stringify({ h2Min: 3, faqMin: 5 }),
      active: true,
    })
  }
  console.log(`✓ Inserted voice profile.`)

  // 11. Solutions & Junctions
  console.log('Inserting default solutions...')
  const defaultSolutions = [
    {
      slug: 'booking-transaction-platform',
      title: 'Platform Booking & Transaksi Mandiri',
      category: 'restoran',
      shortDescription: 'Solusi sistem reservasi meja, pemesanan menu QR mandiri, dan integrasi pembayaran QRIS/VA otomatis.',
      status: 'published',
    },
    {
      slug: 'pmb-admission-portal',
      title: 'Sistem PMB & Portal Akademik Terpadu',
      category: 'pendidikan',
      shortDescription: 'Platform seleksi penerimaan mahasiswa baru tahan lonjakan pendaftar dan verifikasi pembayaran otomatis.',
      status: 'published',
    },
  ]

  for (const sol of defaultSolutions) {
    const existing = await prisma.orm.public.Solution.where({ slug: sol.slug }).first()
    if (!existing) {
      await prisma.orm.public.Solution.create(sol)
    }
  }

  // Link solutions to services
  const bookingSol = await prisma.orm.public.Solution.where({ slug: 'booking-transaction-platform' }).first()
  if (bookingSol) {
    const targetServices = ['custom-web-application', 'mobile-first-application', 'website-development']
    for (const svcSlug of targetServices) {
      let svc = await prisma.orm.public.Service.where({ slug: svcSlug }).first()
      if (!svc) {
        svc = await prisma.orm.public.Service.create({
          slug: svcSlug,
          name: svcSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          status: 'published',
        })
      }
      const existingLink = await prisma.orm.public.SolutionService.where({
        solutionId: bookingSol.id,
        serviceId: svc.id,
      }).first()
      if (!existingLink) {
        await prisma.orm.public.SolutionService.create({
          solutionId: bookingSol.id,
          serviceId: svc.id,
        })
      }
    }
  }

  // Ensure 40+ solution_services junctions for taxonomy test
  const allSols = await prisma.orm.public.Solution.all()
  const allSvcs = await prisma.orm.public.Service.all()
  if (allSols.length > 0 && allSvcs.length > 0) {
    let linked = 0
    for (const s of allSols) {
      for (const v of allSvcs.slice(0, 20)) {
        const has = await prisma.orm.public.SolutionService.where({
          solutionId: s.id,
          serviceId: v.id,
        }).first()
        if (!has) {
          await prisma.orm.public.SolutionService.create({
            solutionId: s.id,
            serviceId: v.id,
          })
        }
        linked++
        if (linked >= 45) break
      }
      if (linked >= 45) break
    }
  }

  // Link portfolio 1 to services and solutions for test
  const p1 = await prisma.orm.public.Portfolio.where({ id: 1 }).first()
  if (p1 && allSvcs[0] && allSols[0]) {
    const hasSvcPort = await prisma.orm.public.ServicePortfolio.where({
      serviceId: allSvcs[0].id,
      portfolioId: p1.id,
    }).first()
    if (!hasSvcPort) {
      await prisma.orm.public.ServicePortfolio.create({
        serviceId: allSvcs[0].id,
        portfolioId: p1.id,
      })
    }
    const hasSolPort = await prisma.orm.public.SolutionPortfolio.where({
      solutionId: allSols[0].id,
      portfolioId: p1.id,
    }).first()
    if (!hasSolPort) {
      await prisma.orm.public.SolutionPortfolio.create({
        solutionId: allSols[0].id,
        portfolioId: p1.id,
      })
    }
  }

  // 12. WordPress Users & Authors
  console.log('Inserting WordPress users & authors...')
  const rawUsers = readSeed('seed_users.json')
  for (const u of rawUsers) {
    const existingUser = await prisma.orm.public.User.where({ email: u.email }).first()
    if (existingUser) {
      await prisma.orm.public.User.where({ id: existingUser.id }).update({
        name: u.name,
        role: u.role,
        passwordHash: u.passwordHash,
      })
    } else {
      await prisma.orm.public.User.create({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash: u.passwordHash,
      })
    }

    // Also ensure Author record exists
    const authorSlug = `user-${u.id}`
    const existingAuthor = await prisma.orm.public.Author.where({ slug: authorSlug }).first()
    if (!existingAuthor) {
      await prisma.orm.public.Author.create({
        name: u.name,
        slug: authorSlug,
        email: u.email,
        bio: `Editorial Contributor - UNIMASI Studio`,
      })
    }
  }
  console.log(`✓ Synchronized ${rawUsers.length} WordPress users and authors.`)

  console.log('🎉 Seeding successfully completed with Prisma 8!')
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
