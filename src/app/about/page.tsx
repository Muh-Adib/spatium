import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/ui/PageHero'
import { ProcessTimeline } from '@/components/home/ProcessTimeline'
import { WhyUnimasi } from '@/components/home/WhyUnimasi'
import { Industries } from '@/components/home/Industries'
import { CTASection } from '@/components/ui/CTASection'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import { ServiceVisual } from '@/components/services/ServiceVisual'
import { Icon } from '@/components/Icon'
import { CORE_SERVICES } from '@/data/services'
import { siteConfig } from '@/config/site'
import '@/pages/about.css'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Tentang SPATIUM — Spatial Technology Studio',
  description:
    'SPATIUM adalah studio teknologi spasial terdepan di Indonesia yang mengkhususkan diri pada 3D Gaussian Splatting, pemindaian laser LiDAR terestrial, dan digital twin fotorealistis skala 1:1.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

const PRINCIPLES = [
  {
    title: 'Walkable Reality Beats Static Frames',
    body: 'Ruang fisik nyata tidak bisa diwakili secara jujur hanya oleh foto 2D bersudut lebar atau video pasif. Ruang harus dapat dijelajahi sendiri secara bebas skala 1:1.',
    icon: 'target',
  },
  {
    title: 'Sub-Centimeter Mathematical Precision',
    body: 'Setiap pemindaian kami dikalibrasi dengan sensor LiDAR terestrial dan fotogrametri padat hingga toleransi di bawah 5mm, menjamin integritas geometri asli.',
    icon: 'eye',
  },
  {
    title: 'Zero Moment of Truth (ZMOT)',
    body: 'Kami merancang tur spasial untuk memicu keyakinan beli seketika. Konsumen dan investor memverifikasi lokasi secara nyata sebelum memutuskan bertransaksi.',
    icon: 'layers',
  },
  {
    title: 'One Point, Unlimited Possibilities',
    body: 'Pindai sekali di lapangan, gunakan selamanya untuk embed WebGL 60 FPS, headset VR / Apple Vision Pro, line-up kamera sinema, hingga arsip digital abadi.',
    icon: 'shield',
  },
]

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

export default function AboutPage() {
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
        lede="SPATIUM adalah studio teknologi spasial yang mengatasi The Curse of Distance dengan merekonstruksi ruang nyata ke dalam pengalaman walkable 3D Gaussian Splatting berkecepatan 60 FPS di WebGL."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Tentang' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="layers" size={13} /> 4 Vertikal Utama
            </span>
            <span className="pill">
              <Icon name="globe" size={13} /> Jakarta · Bandung · Global
            </span>
          </>
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
              Melalui teknologi <strong>3D Gaussian Splatting (3DGS)</strong> dan <strong>LiDAR laser scanning</strong>, SPATIUM mereplikasi dunia nyata dengan akurasi sub-sentimeter dan menangkap refleksi cahaya fotorealistis. Pengguna dapat berjalan bebas di ruang virtual 60 FPS langsung dari peramban ponsel pintar mereka tanpa perlu mengunduh aplikasi apa pun.
            </p>
            <p className="about-statement__text text-neutral-300">
              Prinsip kami: <em>One Point, Unlimited Possibilities</em>. Satu kali pemindaian di lokasi fisik membuka potensi tanpa batas untuk marketing ZMOT, simulasi medis klinis, virtual scouting film, hingga preservasi warisan budaya abadi.
            </p>
          </Reveal>

          <Reveal className="about-statement__visual" variant="scale" delay={100}>
            <div className="about-statement__frame">
              <ServiceVisual kind="3d" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section about-disciplines" aria-labelledby="about-disciplines-title">
        <div className="container container--wide">
          <SectionHead
            id="about-disciplines-title"
            eyebrow="Vertikal Layanan"
            title="4 Vertikal Teknologi Spasial"
            aside={
              <p className="lede">
                Solusi presisi terintegrasi untuk industri perfilman, pemasaran bisnis, kalibrasi pameran seni, dan preservasi memori abadi.
              </p>
            }
          />

          <ul className="about-disciplines__grid">
            {CORE_SERVICES.map((service, i) => (
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

      <section className="section about-principles" aria-labelledby="principles-title">
        <div className="container container--wide">
          <SectionHead
            id="principles-title"
            eyebrow="Prinsip & Nilai"
            title="Standar Rekayasa Spasial SPATIUM"
          />

          <ul className="about-principles__grid">
            {PRINCIPLES.map((principle, i) => (
              <Reveal as="li" key={principle.title} delay={i * 80} className="principle-card">
                <span className="principle-card__num mono">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="principle-card__title">{principle.title}</h3>
                <p className="principle-card__body">{principle.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <ProcessTimeline />
      <WhyUnimasi />
      <Industries />

      <CTASection
        id="about-cta"
        eyebrow="Mulai Eksplorasi Spasial"
        title={
          <>
            Siap merekonstruksi ruang Anda ke dalam <span className="accent">3D Gaussian Splatting</span>?
          </>
        }
        body="Konsultasikan kebutuhan ruang dan lokasi Anda bersama tim insinyur spasial kami. Kami siapkan survei lapangan dan estimasi teknis transparan."
        primary={{ label: 'Jadwalkan Konsultasi Spasial', to: '/contact' }}
        secondary={{ label: 'Lihat Portofolio 3DGS', to: '/portfolio' }}
      />
    </>
  )
}
