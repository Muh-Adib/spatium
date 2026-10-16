import { Link, Navigate, useParams } from 'react-router-dom'
import { Seo, SITE_URL } from '@/components/Seo'
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
import './service-detail.css'

const CATEGORY_BY_SERVICE: Record<string, ProjectCategory> = {
  '2d-animation': '2d',
  '3d-animation': '3d',
  'motion-graphics': 'motion',
  'digital-assets-ai': 'assets',
}

export default function ServiceDetail() {
  const { slug = '' } = useParams()
  const service = getService(slug)

  if (!service) return <Navigate to="/services" replace />

  const relatedProjects = PROJECTS.filter(
    (project) => project.category === CATEGORY_BY_SERVICE[service.slug],
  ).slice(0, 3)

  const otherServices = SERVICES.filter((item) => item.slug !== service.slug)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      serviceType: service.name,
      description: service.metaDescription,
      url: `${SITE_URL}/services/${service.slug}`,
      provider: { '@type': 'Organization', name: 'UNIMASI', url: SITE_URL },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${service.name} capabilities`,
        itemListElement: service.capabilities.map((cap, i) => ({
          '@type': 'Offer',
          position: i + 1,
          itemOffered: { '@type': 'Service', name: cap.title, description: cap.description },
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: service.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
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
          name: service.name,
          item: `${SITE_URL}/services/${service.slug}`,
        },
      ],
    },
  ]

  return (
    <>
      <Seo
        title={service.name}
        description={service.metaDescription}
        path={`/services/${service.slug}`}
        jsonLd={jsonLd}
      />

      <PageHero
        eyebrow={`Service ${service.index}`}
        title={service.name}
        lede={service.summary}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Services', to: '/services' },
          { label: service.shortName },
        ]}
        meta={
          <>
            <span className="pill pill--accent">{service.tagline}</span>
            {service.tools.slice(0, 3).map((tool) => (
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
            {service.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="detail-intro__paragraph">
                {paragraph}
              </p>
            ))}

            <ul className="detail-intro__tools">
              {service.tools.map((tool) => (
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
                <span className="mono">{service.shortName}</span>
              </div>
              <ServiceVisual kind={service.visual} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section detail-capabilities" aria-labelledby="capabilities-heading">
        <div className="container container--wide">
          <SectionHead
            id="capabilities-heading"
            eyebrow="What this covers"
            title={`${service.shortName} capabilities`}
            aside={
              <p className="lede">
                Each capability can be scoped on its own or combined into a single production. Mixed
                scopes are quoted as one project.
              </p>
            }
          />

          <ul className="detail-capabilities__grid">
            {service.capabilities.map((cap, i) => (
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
              {service.deliverables.map((item) => (
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
            {service.faqs.map((faq, i) => (
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
              title={`${service.shortName} capability studies`}
              aside={
                <Link to={`/portfolio?category=${CATEGORY_BY_SERVICE[service.slug]}`} className="link-arrow">
                  See all {service.shortName} work
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
                <Link to={`/services/${item.slug}`} className="detail-next__card card card--hover">
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
            Brief us on your <span className="accent">{service.shortName}</span> project.
          </>
        }
        body="Send the message, the audience and the deadline. We will respond with a recommended pipeline and an honest scope."
        secondary={{ label: 'Browse portfolio', to: '/portfolio' }}
      />
    </>
  )
}
