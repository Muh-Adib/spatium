import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/ui/PageHero'
import { ProcessTimeline } from '@/components/home/ProcessTimeline'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { Industries } from '@/components/home/Industries'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { Icon } from '@/components/Icon'
import { getCorePortfolios, getCoreServices } from '@/lib/core'
import { projectSectors } from '@/lib/content/spatium-types'
import { SPATIAL_BENEFITS } from '@/config/spatium-story'
import { siteConfig } from '@/config/site'
import '@/pages/about.css'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Tentang SPATIUM — Spatial Technology Studio',
  description:
    'SPATIUM — Spatial Technology Studio. Digital twin untuk industri kreatif: laser scan, point cloud, 3D geometry, dan 3D Gaussian Splat fotorealistis.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Tentang SPATIUM',
    url: `${SITE_URL}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: 'SPATIUM Spatial Technology Studio',
      url: SITE_URL,
      description:
        'Studio teknologi spasial yang mengubah ruang fisik menjadi pengalaman digital fotorealistis interaktif 3D Gaussian Splatting dan digital twin.',
      knowsAbout: ['3D Gaussian Splatting', 'LiDAR Laser Scanning', 'Digital Twins', 'Photogrammetry', 'Spatial Computing', 'WebXR'],
    },
  },
]

export default async function AboutPage() {
  const [services, projects] = await Promise.all([getCoreServices(), getCorePortfolios()])
  const sectors = projectSectors(projects)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="TENTANG SPATIUM"
        title={
          <>
            Real places. <span className="accent">New perspectives</span>.
          </>
        }
        lede="SPATIUM adalah studio teknologi spasial yang menjawab 'kutukan jarak' dengan merekonstruksi ruang nyata menjadi walkable image — 3D Gaussian Splat yang bisa dijelajahi dari mana saja."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Tentang' }]}
        meta={
          services.length > 0 ? (
            <span className="pill">
              <Icon name="layers" size={13} /> {services.length} use case
            </span>
          ) : undefined
        }
      />

      <section className="section about-statement" aria-labelledby="about-statement-title">
        <div className="container container--wide about-statement__inner">
          <Reveal className="about-statement__copy">
            <p className="eyebrow text-cyan-400">Filosofi Kami</p>
            <h2 className="display-md about-statement__title text-white" id="about-statement-title">
              Dari sekadar melihat, menjadi mengalami. Dari sekadar menduga, menjadi memverifikasi.
            </h2>
            <p className="about-statement__text text-neutral-300">
              Jarak geografis sering kali menjadi penghalang terbesar: calon tamu restoran ragu memesan meja sunset, sutradara film kesulitan membayangkan sudut kamera di lokasi syuting luar pulau, dan keluarga tidak bisa kembali ke suasana dekorasi pernikahan yang telah dibongkar.
            </p>
            <p className="about-statement__text text-neutral-300">
              Melalui teknologi <strong>3D Gaussian Splatting (3DGS)</strong> dan <strong>LiDAR laser scanning</strong>, SPATIUM merekam ruang nyata — skala, kedalaman, material, dan cahayanya — lalu menyajikannya sebagai ruang yang bisa dijelajahi langsung dari peramban, tanpa aplikasi tambahan.
            </p>
            <p className="about-statement__text text-neutral-300">
              Prinsip kami: <em>One Point, Unlimited Possibilities</em>. Satu kali capture di lokasi menjadi fondasi spasial untuk filmmaking, marketing & branding, entertainment, hingga preservasi memori.
            </p>
          </Reveal>

          <Reveal className="about-statement__visual" variant="scale" delay={100}>
            <div className="about-statement__frame">
              <ServiceVisual kind="3d" />
            </div>
          </Reveal>
        </div>
      </section>

      {services.length > 0 ? (
      <section className="section about-disciplines" aria-labelledby="about-disciplines-title">
        <div className="container container--wide">
          <SectionHead
            id="about-disciplines-title"
            eyebrow="Vertikal Layanan"
            title="Use case teknologi spasial"
            aside={
              <p className="lede">
                Satu kali capture ruang nyata menjadi fondasi untuk produksi film, pemasaran, instalasi imersif, dan preservasi memori.
              </p>
            }
          />

          <ul className="about-disciplines__grid">
            {services.map((service, i) => (
              <Reveal as="li" key={service.slug} delay={i * 70} className="about-discipline">
                <span className="about-discipline__index mono">{service.index}</span>
                <h3 className="about-discipline__title">{service.name}</h3>
                <p className="about-discipline__tagline">{service.tagline}</p>
                <p className="about-discipline__body">{service.summary}</p>
                <Link href={`/services/${service.slug}`} className="link-arrow">
                  Eksplorasi {service.shortName}
                  <Icon name="arrow-right" size={15} />
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      ) : null}

      <section className="section about-principles" aria-labelledby="principles-title">
        <div className="container container--wide">
          <SectionHead
            id="principles-title"
            eyebrow="Prinsip & Nilai"
            title="One Point, Unlimited Possibilities"
          />

          <ul className="about-principles__grid">
            {SPATIAL_BENEFITS.map((benefit, i) => (
              <Reveal as="li" key={benefit.title} delay={i * 80} className="principle-card">
                <span className="principle-card__num mono">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="principle-card__title">{benefit.title}</h3>
                <p className="principle-card__body">{benefit.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <ProcessTimeline />
      <WhyChooseUs />
      <Industries sectors={sectors} />

      <CTASection
        id="about-cta"
        eyebrow="Mulai Eksplorasi Spasial"
        title={
          <>
            Siap merekonstruksi ruang Anda ke dalam <span className="accent">3D Gaussian Splatting</span>?
          </>
        }
        body="Ceritakan ruang dan tujuan Anda. Kami jelaskan alur capture, keluaran, dan cakupan pekerjaan secara terbuka."
        primary={{ label: 'Jadwalkan Konsultasi Spasial', to: '/contact' }}
        secondary={{ label: 'Lihat Portofolio 3DGS', to: '/portfolio' }}
      />
    </>
  )
}
