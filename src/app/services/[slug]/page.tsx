import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { PROCESS } from '@/data/site'
import { getService, SERVICES } from '@/data/services'
import { PROJECTS, type ProjectCategory } from '@/data/projects'
import { getServiceCategories, getServiceCategoryWithServices } from '@/lib/db/serviceCategories'
import { getServiceBySlug, getServices } from '@/lib/db/services'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { siteConfig } from '@/config/site'
import '@/pages/service-detail.css'

const SITE_URL = siteConfig.url

const CATEGORY_BY_SERVICE: Record<string, ProjectCategory> = {
  'filmmaking-vfx': 'filmmaking',
  'marketing-branding': 'marketing',
  'entertainment-installation': 'entertainment',
  'memory-documentary': 'memory',
  '2d-animation': '2d',
  '3d-animation': '3d',
  'motion-graphics': 'motion',
  'digital-assets-ai': 'assets',
}

export async function generateStaticParams() {
  const slugs = new Set<string>(SERVICES.map((service) => service.slug))
  try {
    const [categories, services] = await Promise.all([getServiceCategories(), getServices()])
    for (const category of categories) slugs.add(category.slug)
    for (const service of services) slugs.add(service.slug)
  } catch (err) { console.warn("[observable error]:", err) }
  return Array.from(slugs).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const dbCat = process.env.DATABASE_URL ? await getServiceCategoryWithServices(slug).catch(() => null) : null
  const dbSvc = process.env.DATABASE_URL && !dbCat ? await getServiceBySlug(slug).catch(() => null) : null
  const dbItem: any = dbCat || dbSvc

  const service = getService(slug)
  if (!dbItem && !service) return { title: 'Service Not Found' }

  const fullTitle = dbItem?.metaTitle || (service ? `${service.name} Services` : `${dbItem?.title || dbItem?.name} Services`)
  const serpTitle = fullTitle.length > 52 ? `${fullTitle.slice(0, 48).trimEnd()}…` : fullTitle
  const desc =
    dbItem?.metaDescription ||
    dbItem?.shortDescription ||
    (service?.metaDescription ? (service.metaDescription.length > 160 ? `${service.metaDescription.slice(0, 157).trimEnd()}…` : service.metaDescription) : '')
  const ogImg = dbItem?.heroImage || '/icon-512.png'

  return {
    title: serpTitle,
    description: desc,
    alternates: {
      canonical: `${SITE_URL}/services/${slug}`,
    },
    openGraph: {
      type: 'website',
      title: `${serpTitle} · SPATIUM`,
      description: desc,
      url: `${SITE_URL}/services/${slug}`,
      siteName: 'SPATIUM',
      images: [{ url: ogImg, width: 512, height: 512, alt: 'SPATIUM' }],
    },
    twitter: { card: 'summary_large_image', title: `${serpTitle} · SPATIUM`, description: desc, images: [ogImg] },
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const dbCat = process.env.DATABASE_URL ? await getServiceCategoryWithServices(slug).catch(() => null) : null
  const dbSvc = process.env.DATABASE_URL && !dbCat ? await getServiceBySlug(slug).catch(() => null) : null
  const dbItem: any = dbCat || dbSvc
  const dbBlocks = dbItem?.blocks && Array.isArray(dbItem.blocks) ? dbItem.blocks : []

  const service = getService(slug)
  if (!dbItem && !service) notFound()

  const serviceName = dbItem?.title || dbItem?.name || service?.name || ''
  const serviceDesc = dbItem?.metaDescription || dbItem?.shortDescription || service?.metaDescription || ''

  const jsonLd: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: serviceName,
      serviceType: serviceName,
      description: serviceDesc,
      url: `${SITE_URL}/services/${slug}`,
      provider: { '@type': 'Organization', name: 'SPATIUM', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_URL}/services` },
        {
          '@type': 'ListItem',
          position: 3,
          name: serviceName,
          item: `${SITE_URL}/services/${slug}`,
        },
      ],
    },
  ]

  if (dbBlocks.length > 0) {
    const contextData = dbCat
      ? { subServices: dbCat.subServices || [] }
      : { portfolios: (dbSvc as { portfolioItems?: unknown[] })?.portfolioItems || [] }
    return (
      <main className="min-h-screen bg-[var(--color-background)] text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BlockRenderer blocks={dbBlocks} contextData={contextData} />
      </main>
    )
  }

  if (!dbItem && !service) notFound()

  // Static fallback shell: DB row (admin-edited) supplies the editable copy;
  // the static entry only pads structural fields (capability grid, FAQ shape)
  // the DB model does not carry.
  const view = {
    slug,
    index: dbItem?.indexNumber || service?.index || '01',
    name: dbItem?.title || dbItem?.name || service?.name || '',
    shortName: service?.shortName || dbItem?.title || dbItem?.name || '',
    tagline: dbItem?.tag || dbItem?.shortDescription || service?.tagline || '',
    summary: dbItem?.shortDescription || dbItem?.description || service?.summary || '',
    metaDescription: serviceDesc,
    intro:
      service?.intro ||
      [dbItem?.longDescription || dbItem?.description || dbItem?.shortDescription].filter(Boolean) as string[],
    capabilities:
      service?.capabilities ||
      ((dbItem?.features || []) as { title?: string; description?: string }[]).map((f) => ({
        title: f.title || '',
        description: f.description || '',
      })),
    deliverables: (dbItem?.deliverables as string[] | undefined) || service?.deliverables || [],
    tools:
      service?.tools ||
      ((dbItem?.technologies || []) as { name?: string }[]).map((t) => t.name || '').filter(Boolean),
    visual: service?.visual || '2d',
    faqs:
      service?.faqs ||
      ((dbItem?.faq || []) as { question?: string; answer?: string }[]).map((f) => ({
        q: f.question || '',
        a: f.answer || '',
      })),
  }

  const relatedProjects = PROJECTS.filter(
    (project) => project.category === CATEGORY_BY_SERVICE[view.slug],
  ).slice(0, 3)

  if (view.faqs.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: view.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    })
  }

  const otherServices = SERVICES.filter((item) => item.slug !== view.slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow={`Service ${view.index}`}
        title={view.name}
        lede={view.summary}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Services', to: '/services' },
          { label: view.shortName },
        ]}
        meta={
          <>
            <span className="pill pill--accent">{view.tagline}</span>
            {view.tools.slice(0, 3).map((tool) => (
              <span className="pill" key={tool}>
                {tool}
              </span>
            ))}
          </>
        }
      />

      <section className="section detail-intro" aria-labelledby="detail-intro-title">
        <div className="container container--wide detail-intro__inner">
          <Reveal className="detail-intro__copy">
            <h2 className="sr-only" id="detail-intro-title">
              About this service
            </h2>
            {view.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="detail-intro__paragraph">
                {paragraph}
              </p>
            ))}

            <ul className="detail-intro__tools">
              {view.tools.map((tool) => (
                <li className="pill" key={tool}>
                  {tool}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="detail-intro__visual" variant="scale" delay={100}>
            <div className="detail-intro__frame">
              <div className="detail-intro__frame-head">
                <span className="mono">Interactive preview</span>
                <span className="mono">{view.shortName}</span>
              </div>
              <ServiceVisual kind={view.visual} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section detail-capabilities" aria-labelledby="capabilities-heading">
        <div className="container container--wide">
          <SectionHead
            id="capabilities-heading"
            eyebrow="What this covers"
            title={`${view.shortName} capabilities`}
            aside={
              <p className="lede">
                Each capability can be scoped on its own or combined into a single production. Mixed
                scopes are quoted as one project.
              </p>
            }
          />

          <ul className="detail-capabilities__grid">
            {view.capabilities.map((cap, i) => (
              <Reveal as="li" key={cap.title} delay={i * 60} className="detail-capability">
                <span className="detail-capability__num mono">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="detail-capability__title">{cap.title}</h3>
                <p className="detail-capability__body">{cap.description}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--deep detail-deliverables" aria-labelledby="deliverables-heading">
        <div className="container container--wide detail-deliverables__inner">
          <Reveal className="detail-deliverables__copy">
            <p className="eyebrow">Deliverables</p>
            <h2 className="display-md" id="deliverables-heading">
              What you <span className="accent">receive</span>.
            </h2>
            <p className="lede">
              Every engagement ends with master files, platform exports and the source project so your
              team is never locked out of its own work.
            </p>

            <ul className="detail-deliverables__list">
              {view.deliverables.map((item) => (
                <li key={item}>
                  <Icon name="check" size={15} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="detail-timeline" delay={100}>
            <p className="mono detail-timeline__label">Production stages used</p>
            <ol className="detail-timeline__list">
              {PROCESS.map((step) => (
                <li key={step.index}>
                  <span className="detail-timeline__dot" aria-hidden="true" />
                  <div>
                    <strong>{step.title}</strong>
                    <span className="mono">{step.duration}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="section detail-faq" aria-labelledby="faq-heading">
        <div className="container container--wide detail-faq__inner">
          <Reveal className="detail-faq__head">
            <p className="eyebrow">Good to know</p>
            <h2 className="display-md" id="faq-heading">
              Frequently asked
            </h2>
          </Reveal>

          <div className="detail-faq__list">
            {view.faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 60}>
                <details className="faq-item">
                  <summary>
                    <span>{faq.q}</span>
                    <Icon name="plus" size={18} />
                  </summary>
                  <p>{faq.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {relatedProjects.length > 0 ? (
        <section className="section detail-work" aria-labelledby="detail-work-heading">
          <div className="container container--wide">
            <SectionHead
              id="detail-work-heading"
              eyebrow="Related work"
              title={`${view.shortName} capability studies`}
              aside={
                <Link href={`/portfolio?category=${CATEGORY_BY_SERVICE[view.slug]}`} className="link-arrow">
                  See all {view.shortName} work
                  <Icon name="arrow-right" size={16} />
                </Link>
              }
            />
            <div className="detail-work__grid">
              {relatedProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section detail-next" aria-labelledby="detail-next-heading">
        <div className="container container--wide">
          <SectionHead id="detail-next-heading" eyebrow="Other services" title="Keep exploring" />
          <ul className="detail-next__grid">
            {otherServices.map((item) => (
              <Reveal as="li" key={item.slug}>
                <Link href={`/services/${item.slug}`} className="detail-next__card card card--hover">
                  <span className="detail-next__index mono">{item.index}</span>
                  <h3>{item.name}</h3>
                  <p>{item.tagline}</p>
                  <span className="link-arrow">
                    View service
                    <Icon name="arrow-right" size={15} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <CTASection
        id="service-cta"
        eyebrow="Start here"
        title={
          <>
            Brief us on your <span className="accent">{view.shortName}</span> project.
          </>
        }
        body="Send the message, the audience and the deadline. We will respond with a recommended pipeline and an honest scope."
        secondary={{ label: 'Browse portfolio', to: '/portfolio' }}
      />
    </>
  )
}
