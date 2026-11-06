import type { Metadata } from 'next'
import { PageHero } from '@/components/ui/PageHero'
import { InquiryForm } from '@/components/forms/InquiryForm'
import { getUseCaseNav } from '@/lib/content/spatium'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import { CONTACT, SOCIALS } from '@/data/site'
import { siteConfig, telHref, whatsappHref } from '@/config/site'
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

// Copy limited to what the product deck states — no unverified accuracy, turnaround or device claims.
const EXPECTATIONS = [
  {
    title: 'Memahami ruang & tujuan Anda',
    body: 'Kami mempelajari jenis lokasi dan untuk apa digital twin akan dipakai — film, marketing, hiburan, atau memori.',
    icon: 'eye',
  },
  {
    title: 'Menentukan output yang tepat',
    body: 'Satu capture bisa menghasilkan point cloud, mesh, tekstur, panorama, atau 3D Gaussian Splat. Kami pilih yang sesuai kebutuhan.',
    icon: 'route',
  },
  {
    title: 'Lingkup & alur kerja transparan',
    body: 'Tahapan capture, pemrosesan, dan serah terima dijelaskan sejak awal — tanpa kotak hitam.',
    icon: 'shield',
  },
]

const FAQS = [
  {
    q: 'Apa bedanya digital twin dengan foto atau video?',
    a: 'Foto hanya menangkap gambar dan video hanya menangkap momen. Digital twin menangkap seluruh ruang, objek di sekitarnya, dan konteksnya — sehingga bisa dijelajahi dari sudut mana pun dan dikunjungi kembali kapan saja.',
  },
  {
    q: 'Apakah pengunjung harus mengunduh aplikasi untuk melihat scene 3D?',
    a: 'Tidak. Scene 3D Gaussian Splat kami dibuka langsung di peramban melalui viewer web. Waktu muat bergantung pada koneksi, perangkat, dan ukuran scene.',
  },
  {
    q: 'Bagaimana cara memasang scene ke website kami?',
    a: 'Scene dapat disematkan sebagai iframe di halaman Anda atau dibagikan sebagai tautan.',
  },
  {
    q: 'Apakah satu kali capture bisa dipakai untuk banyak kebutuhan?',
    a: 'Ya — capture once, use everywhere. Data yang sama dapat diolah menjadi output 3D, 2D, interaktif, maupun imersif.',
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

export default async function ContactPage() {
  const services = await getUseCaseNav()
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
            {CONTACT.location && (
              <span className="pill">
                <Icon name="globe" size={13} /> {CONTACT.location}
              </span>
            )}
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
                {CONTACT.phone && telHref(CONTACT.phone) && (
                  <li>
                    <Icon name="phone" size={16} />
                    <a href={telHref(CONTACT.phone) ?? undefined} className="text-white hover:text-cyan-400">{CONTACT.phone}</a>
                  </li>
                )}
                {whatsappHref(CONTACT.whatsapp, 'Halo SPATIUM, saya ingin berkonsultasi.') && (
                  <li>
                    <Icon name="phone" size={16} />
                    <a
                      href={whatsappHref(CONTACT.whatsapp, 'Halo SPATIUM, saya ingin berkonsultasi.') ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-cyan-400"
                    >
                      WhatsApp
                    </a>
                  </li>
                )}
                {CONTACT.location && (
                  <li>
                    <Icon name="pin" size={16} />
                    <span className="text-neutral-300">{CONTACT.location}</span>
                  </li>
                )}
                {CONTACT.hours && (
                  <li>
                    <Icon name="clock" size={16} />
                    <span className="text-neutral-300">{CONTACT.hours}</span>
                  </li>
                )}
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
            <InquiryForm services={services} />
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
