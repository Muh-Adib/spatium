import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { PageHero } from '@/components/ui/PageHero'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { ProjectCard } from '@/components/portfolio/ProjectCard'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { SPATIAL_PIPELINE } from '@/config/spatium-story'
import { getParentUseCaseSlug, getProjects, getUseCases } from '@/lib/content/spatium'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { siteConfig } from '@/config/site'
import '@/pages/service-detail.css'
import { redirectIfMoved } from '@/lib/redirects/resolve'

const SITE_URL = siteConfig.url

export const revalidate = 300

export async function generateStaticParams() {
  // getUseCases() logs and returns [] when the DB is unreachable at build time.
  const useCases = await getUseCases()
  return useCases.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = (await getUseCases()).find((s) => s.slug === slug)
  if (!service) return { title: 'Layanan tidak ditemukan' }

  const serpTitle = service.metaTitle.length > 60 ? `${service.metaTitle.slice(0, 57).trimEnd()}…` : service.metaTitle
  const desc =
    service.metaDescription.length > 160 ? `${service.metaDescription.slice(0, 157).trimEnd()}…` : service.metaDescription
  const ogImg = service.image || '/icon-512.png'

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
      images: [{ url: ogImg, width: 1200, height: 630, alt: service.imageAlt }],
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
  const [useCases, projects] = await Promise.all([getUseCases(), getProjects()])
  const view = useCases.find((s) => s.slug === slug)

  if (!view) {
    // Derivative capabilities live on their parent use-case page.
    const parent = await getParentUseCaseSlug(slug)
    if (parent) permanentRedirect(`/services/${parent}#${slug}`)
    await redirectIfMoved(`/services/${slug}`)
    notFound()
  }

  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: view.name,
      serviceType: view.name,
      description: view.metaDescription,
      url: `${SITE_URL}/services/${slug}`,
      provider: { '@type': 'Organization', name: 'SPATIUM', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Layanan', item: `${SITE_URL}/services` },
        {
          '@type': 'ListItem',
          position: 3,
          name: view.name,
          item: `${SITE_URL}/services/${slug}`,
        },
      ],
    },
  ]

  // Related scenes are the portfolio pages this use case links to (internal-links block).
  const relatedSlugs = view.related
    .map((r) => /^\/portfolio\/([^/?#]+)/.exec(r.to)?.[1])
    .filter((s): s is string => Boolean(s))
  const relatedProjects = projects.filter((p) => relatedSlugs.includes(p.slug)).slice(0, 3)

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

  const otherServices = useCases.filter((item) => item.slug !== view.slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow={`Use case ${view.index}`}
        title={view.name}
        lede={view.summary}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Layanan', to: '/services' },
          { label: view.shortName },
        ]}
        meta={
          <>
            {view.tagline ? <span className="pill pill--accent">{view.tagline}</span> : null}
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
              Tentang layanan ini
            </h2>
            {view.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="detail-intro__paragraph">
                {paragraph}
              </p>
            ))}

            {view.tools.length > 0 ? (
              <ul className="detail-intro__tools">
                {view.tools.map((tool) => (
                  <li className="pill" key={tool}>
                    {tool}
                  </li>
                ))}
              </ul>
            ) : null}
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

      {view.capabilities.length > 0 ? (
        <section className="section detail-capabilities" aria-labelledby="capabilities-heading">
          <div className="container container--wide">
            <SectionHead
              id="capabilities-heading"
              eyebrow="Cakupan"
              title={`Kapabilitas ${view.shortName}`}
              aside={
                <p className="lede">
                  Setiap kapabilitas bisa dikerjakan terpisah atau digabungkan dalam satu proyek, berangkat
                  dari data capture yang sama.
                </p>
              }
            />

            <ul className="detail-capabilities__grid">
              {view.capabilities.map((cap, i) => (
                <Reveal as="li" key={cap.slug} id={cap.slug} delay={i * 60} className="detail-capability">
                  <span className="detail-capability__num mono">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="detail-capability__title">{cap.title}</h3>
                  <p className="detail-capability__body">{cap.description}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section section--deep detail-deliverables" aria-labelledby="deliverables-heading">
        <div className="container container--wide detail-deliverables__inner">
          {view.deliverables.length > 0 ? (
            <Reveal className="detail-deliverables__copy">
              <p className="eyebrow">Keluaran</p>
              <h2 className="display-md" id="deliverables-heading">
                Apa yang <span className="accent">Anda terima</span>.
              </h2>
              <p className="lede">Keluaran disesuaikan dengan tujuan proyek; berikut yang umum untuk use case ini.</p>

              <ul className="detail-deliverables__list">
                {view.deliverables.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : (
            <h2 className="sr-only" id="deliverables-heading">
              Alur kerja
            </h2>
          )}

          <Reveal className="detail-timeline" delay={100}>
            <p className="mono detail-timeline__label">Alur digital twin</p>
            <ol className="detail-timeline__list">
              {SPATIAL_PIPELINE.map((step) => (
                <li key={step.index}>
                  <span className="detail-timeline__dot" aria-hidden="true" />
                  <div>
                    <strong>{step.title}</strong>
                    <span className="mono">{step.caption}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {view.extraBlocks.length > 0 ? <BlockRenderer blocks={view.extraBlocks} /> : null}

      {view.faqs.length > 0 ? (
        <section className="section detail-faq" aria-labelledby="faq-heading">
          <div className="container container--wide detail-faq__inner">
            <Reveal className="detail-faq__head">
              <p className="eyebrow">Perlu diketahui</p>
              <h2 className="display-md" id="faq-heading">
                Pertanyaan umum
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
      ) : null}

      {relatedProjects.length > 0 ? (
        <section className="section detail-work" aria-labelledby="detail-work-heading">
          <div className="container container--wide">
            <SectionHead
              id="detail-work-heading"
              eyebrow="Scene terkait"
              title={`Contoh capture untuk ${view.shortName}`}
              aside={
                <Link href="/portfolio" className="link-arrow">
                  Lihat semua scene
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

      {otherServices.length > 0 ? (
        <section className="section detail-next" aria-labelledby="detail-next-heading">
          <div className="container container--wide">
            <SectionHead id="detail-next-heading" eyebrow="Use case lain" title="Jelajahi lebih lanjut" />
            <ul className="detail-next__grid">
              {otherServices.map((item) => (
                <Reveal as="li" key={item.slug}>
                  <Link href={`/services/${item.slug}`} className="detail-next__card card card--hover">
                    <span className="detail-next__index mono">{item.index}</span>
                    <h3>{item.name}</h3>
                    <p>{item.tagline}</p>
                    <span className="link-arrow">
                      Lihat layanan
                      <Icon name="arrow-right" size={15} />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CTASection
        id="service-cta"
        eyebrow="Mulai di sini"
        title={
          <>
            Diskusikan proyek <span className="accent">{view.shortName}</span> Anda.
          </>
        }
        body="Ceritakan lokasi, tujuan, dan tenggat Anda. Kami akan merekomendasikan alur capture dan keluaran yang sesuai, dengan cakupan yang jelas."
        secondary={{ label: 'Lihat portofolio', to: '/portfolio' }}
      />
    </>
  )
}
