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
import { CORE_SERVICES, SERVICES } from '@/data/services'
import { INDUSTRIES } from '@/data/site'
import { getCoreServices } from '@/lib/core'
import { siteConfig } from '@/config/site'
import '@/pages/services.css'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Layanan Teknologi Spasial & 3D Gaussian Splatting',
  description:
    'Layanan komprehensif SPATIUM: Filmmaking & VFX, Marketing & Branding (ZMOT), Entertainment & Installation, dan Memory & Documentary berbasis 3DGS dan laser LiDAR.',
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
}

const jsonLd = SERVICES.map((service) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.name,
  serviceType: service.name,
  description: service.metaDescription,
  url: `${SITE_URL}/services/${service.slug}`,
  provider: { '@type': 'Organization', name: 'SPATIUM', url: SITE_URL },
}))

export default async function ServicesPage() {
  const services = await getCoreServices()
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
            4 Vertikal Solusi <span className="accent">Spasial &amp; 3DGS</span>.
          </>
        }
        lede="Dari pra-produksi film, display interaktif ZMOT untuk ritel &amp; kuliner, hingga kalibrasi instalasi seni dan preservasi memori digital beresolusi tinggi."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Layanan' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="layers" size={13} /> 4 Vertikal Utama
            </span>
            <span className="pill">
              <Icon name="clock" size={13} /> Akurasi Sub-5mm
            </span>
          </>
        }
      />

      <ServicesShowcase initialServices={services} />

      <section className="section services-compare" aria-labelledby="compare-title">
        <div className="container container--wide">
          <SectionHead
            id="compare-title"
            eyebrow="Komparasi Vertikal"
            title="Pilih Vertikal yang Sesuai Kebutuhan Anda"
            aside={
              <p className="lede">
                Tinjauan komprehensif atas kapabilitas, hasil serah terima, dan toolchain pemindaian sensor pada setiap vertikal SPATIUM.
              </p>
            }
          />

          <Reveal className="compare-table-wrap">
            <table className="compare-table">
              <caption className="sr-only">Komparasi 4 Vertikal Layanan SPATIUM</caption>
              <thead>
                <tr>
                  <th scope="col">Vertikal</th>
                  {CORE_SERVICES.map((service) => (
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
                  {CORE_SERVICES.map((service) => (
                    <td key={service.slug}>{service.tagline}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Kapabilitas Inti</th>
                  {CORE_SERVICES.map((service) => (
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
                  <th scope="row">Hasil Serah Terima</th>
                  {CORE_SERVICES.map((service) => (
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
                  <th scope="row">Toolchain & Sensor</th>
                  {CORE_SERVICES.map((service) => (
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
                  {CORE_SERVICES.map((service) => (
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

          <ul className="services-industries">
            {INDUSTRIES.map((industry) => (
              <li key={industry.name}>
                <Icon name={industry.icon} size={16} />
                {industry.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Capabilities />
      <ProcessTimeline />

      <CTASection
        id="services-cta"
        eyebrow="One Point, Unlimited Possibilities"
        title={
          <>
            Konsultasikan ruang fisik Anda dengan <span className="accent">3D Gaussian Splatting</span>.
          </>
        }
        body="Kami bantu merekomendasikan kombinasi sensor LiDAR darat, drone photogrammetry, dan optimasi WebGL sesuai dengan sasaran bisnis Anda."
        primary={{ label: 'Jadwalkan Konsultasi', to: '/contact' }}
        secondary={{ label: 'Lihat Portofolio 3DGS', to: '/portfolio' }}
      />
    </>
  )
}
