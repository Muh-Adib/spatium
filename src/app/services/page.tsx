import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/ui/PageHero'
import { ServicesShowcase } from '@/components/home/ServicesShowcase'
import { Capabilities } from '@/components/home/Capabilities'
import { ProcessTimeline } from '@/components/home/ProcessTimeline'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { Icon } from '@/components/Icon'
import { SECTOR_ICON } from '@/components/home/Industries'
import { getCorePortfolios, getCoreServices } from '@/lib/core'
import { projectSectors } from '@/lib/content/spatium-types'
import { siteConfig } from '@/config/site'
import '@/pages/services.css'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Layanan Teknologi Spasial & 3D Gaussian Splatting',
  description:
    'Layanan SPATIUM: Filmmaking & VFX, Marketing & Branding, Entertainment & Installation, dan Memory & Documentary berbasis digital twin dan 3D Gaussian Splatting.',
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
}

export const revalidate = 300

export default async function ServicesPage() {
  const [services, projects] = await Promise.all([getCoreServices(), getCorePortfolios()])
  const sectors = projectSectors(projects)
  const jsonLd = services.map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    serviceType: service.name,
    description: service.metaDescription,
    url: `${SITE_URL}/services/${service.slug}`,
    provider: { '@type': 'Organization', name: 'SPATIUM', url: SITE_URL },
  }))
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="SPATIUM SERVICES"
        title={
          <>
            Use case <span className="accent">digital twin</span> untuk industri kreatif.
          </>
        }
        lede="Satu kali capture ruang nyata menjadi fondasi spasial untuk produksi film, pemasaran, instalasi imersif, dan preservasi memori."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Layanan' }]}
        meta={
          <>
            {services.length > 0 ? (
              <span className="pill">
                <Icon name="layers" size={13} /> {services.length} use case
              </span>
            ) : null}
            <span className="pill">
              <Icon name="layers" size={13} /> Capture once, use everywhere
            </span>
          </>
        }
      />

      <ServicesShowcase services={services} />

      {services.length > 0 ? (
      <section className="section services-compare" aria-labelledby="compare-title">
        <div className="container container--wide">
          <SectionHead
            id="compare-title"
            eyebrow="Komparasi Vertikal"
            title="Pilih Vertikal yang Sesuai Kebutuhan Anda"
            aside={
              <p className="lede">
                Kapabilitas, keluaran, dan teknologi yang digunakan pada setiap use case SPATIUM.
              </p>
            }
          />

          <Reveal className="compare-table-wrap">
            <table className="compare-table">
              <caption className="sr-only">Perbandingan use case layanan SPATIUM</caption>
              <thead>
                <tr>
                  <th scope="col">Vertikal</th>
                  {services.map((service) => (
                    <th scope="col" key={service.slug}>
                      <span className="compare-table__index mono">{service.index}</span>
                      <Link href={`/services/${service.slug}`}>{service.shortName}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Fokus Utama</th>
                  {services.map((service) => (
                    <td key={service.slug}>{service.tagline}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Kapabilitas Inti</th>
                  {services.map((service) => (
                    <td key={service.slug}>
                      <ul className="compare-table__list">
                        {service.capabilities.slice(0, 4).map((cap) => (
                          <li key={cap.title}>{cap.title}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Keluaran</th>
                  {services.map((service) => (
                    <td key={service.slug}>
                      <ul className="compare-table__list">
                        {service.deliverables.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Teknologi</th>
                  {services.map((service) => (
                    <td key={service.slug}>
                      <div className="compare-table__tools">
                        {service.tools.slice(0, 4).map((tool) => (
                          <span className="pill" key={tool}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">&nbsp;</th>
                  {services.map((service) => (
                    <td key={service.slug}>
                      <Link href={`/services/${service.slug}`} className="link-arrow">
                        Detail Layanan
                        <Icon name="arrow-right" size={15} />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Reveal>

          {sectors.length > 0 ? (
            <ul className="services-industries" aria-label="Sektor dengan scene di portofolio">
              {sectors.map((sector) => (
                <li key={sector.name}>
                  <Icon name={SECTOR_ICON[sector.category]} size={16} aria-hidden="true" />
                  {sector.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
      ) : null}

      <Capabilities service={services.find((s) => s.slug === 'entertainment-installation') ?? services[0]} />
      <ProcessTimeline />

      <CTASection
        id="services-cta"
        eyebrow="One Point, Unlimited Possibilities"
        title={
          <>
            Konsultasikan ruang fisik Anda dengan <span className="accent">3D Gaussian Splatting</span>.
          </>
        }
        body="Ceritakan ruang dan tujuan Anda. Kami bantu menentukan alur capture dan keluaran — point cloud, mesh, atau 3D Gaussian Splat — yang paling sesuai."
        primary={{ label: 'Jadwalkan Konsultasi', to: '/contact' }}
        secondary={{ label: 'Lihat Portofolio 3DGS', to: '/portfolio' }}
      />
    </>
  )
}
