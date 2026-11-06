import type { Metadata } from 'next'
import { PageHero } from '@/components/ui/PageHero'
import { InquiryForm } from '@/components/forms/InquiryForm'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import { CONTACT, SOCIALS } from '@/data/site'
import { siteConfig } from '@/config/site'
import '@/pages/contact.css'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Hubungi SPATIUM — Jadwalkan Konsultasi & Reality Capture',
  description:
    'Jadwalkan pemindaian LiDAR darat, drone photogrammetry, dan rekonstruksi 3D Gaussian Splatting untuk bisnis Anda bersama tim spesialis spasial SPATIUM.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
}

const EXPECTATIONS = [
  {
    title: 'Analisis Sensor & Karakteristik Ruang',
    body: 'Kami menelaah jenis lokasi (F&B, hotel, rumah sakit, pabrik, atau set film) untuk menentukan kombinasi LiDAR dan rig radiansi terbaik.',
    icon: 'eye',
  },
  {
    title: 'Estimasi Akurasi & Kerapatan Splats',
    body: 'Penetapan target akurasi sub-sentimeter (< 5mm) dan kerapatan partikel fotorealistis (8M–20M splats) sesuai kebutuhan platform.',
    icon: 'route',
  },
  {
    title: 'Proposal Lingkup & Alur Transparan',
    body: 'Rincian jadwal pemindaian on-site, paket serah terima WebGL / VR, dan biaya tetap tanpa biaya tersembunyi.',
    icon: 'shield',
  },
  {
    title: 'Respons Cepat 1x24 Jam Kerja',
    body: 'Konsultasi teknis awal langsung bersama tim insinyur spasial kami untuk memberikan solusi ruang konkret.',
    icon: 'clock',
  },
]

const FAQS = [
  {
    q: 'Berapa lama proses pemindaian LiDAR dan kamera di lokasi fisik?',
    a: 'Untuk area restoran, kafe, atau ruang bedah berukuran 200–1.500 m², proses pemindaian lapangan biasanya memakan waktu antara 2 hingga 4 jam tanpa mengganggu operasional.',
  },
  {
    q: 'Apakah pengunjung harus mengunduh aplikasi untuk melihat tur 3D ini?',
    a: 'Tidak. Teknologi 3D Gaussian Splatting SPATIUM berjalan secara native di peramban (Chrome, Safari, Firefox, Edge) pada HP, laptop, dan tablet secara mulus 60 FPS.',
  },
  {
    q: 'Bagaimana cara memasang tur 3D ini ke website perusahaan kami?',
    a: 'Kami menyediakan kode embed iframe satu baris yang ringan, atau Anda dapat mengunggah berkas bundle HTML mandiri ke server Anda menggunakan fitur Tour Upload SPATIUM.',
  },
  {
    q: 'Apakah hasil rekonstruksi spasial bisa dipakai di headset VR atau Apple Vision Pro?',
    a: 'Ya, semua hasil tangkapan SPATIUM siap untuk standar WebXR spasial sehingga pengguna kacamata VR atau Vision Pro dapat langsung masuk ke ruangan secara nyata.',
  },
]

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Kontak SPATIUM',
    url: `${SITE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'SPATIUM Spatial Technology Studio',
      url: SITE_URL,
      email: CONTACT.email,
    },
  },
]

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="KONTAK &amp; KONSULTASI SPATIUM"
        title={
          <>
            Jadwalkan <span className="accent">Reality Capture</span> Anda.
          </>
        }
        lede="Sampaikan kebutuhan ruang Anda — dari display interaktif ZMOT marketing, virtual scouting film, hingga arsip cagar budaya dan pernikahan abadi."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Kontak' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="clock" size={13} /> Respons 1x24 Jam
            </span>
            <span className="pill">
              <Icon name="globe" size={13} /> Jakarta · Bandung · Global
            </span>
          </>
        }
      />

      <section className="section contact" aria-labelledby="contact-form-title">
        <div className="container container--wide contact__inner">
          <Reveal className="contact__aside">
            <h2 className="contact__aside-title text-white" id="contact-form-title">
              Standar Layanan SPATIUM
            </h2>

            <ul className="contact__expectations">
              {EXPECTATIONS.map((item) => (
                <li key={item.title}>
                  <span className="contact__expectation-icon text-cyan-400">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <div>
                    <strong className="text-white">{item.title}</strong>
                    <p className="text-neutral-300">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="contact__details">
              <h3 className="mono contact__details-title text-cyan-400">Rincian Studio</h3>
              <ul>
                <li>
                  <Icon name="mail" size={16} />
                  <a href={`mailto:${CONTACT.email}`} className="text-white hover:text-cyan-400">{CONTACT.email}</a>
                </li>
                <li>
                  <Icon name="pin" size={16} />
                  <span className="text-neutral-300">{CONTACT.location}</span>
                </li>
                <li>
                  <Icon name="clock" size={16} />
                  <span className="text-neutral-300">{CONTACT.hours}</span>
                </li>
              </ul>
            </div>

            <div className="contact__socials">
              <h3 className="mono contact__details-title text-cyan-400">Kanal Resmi</h3>
              <ul>
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a href={social.href} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-400">
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="contact__main" delay={100} variant="scale">
            <InquiryForm />
          </Reveal>
        </div>
      </section>

      <section className="section contact-faqs" aria-labelledby="faqs-title">
        <div className="container container--wide">
          <h2 className="display-sm text-white mb-8" id="faqs-title">
            Pertanyaan Umum Seputar Pemindaian Spasial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                <h3 className="text-base font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
