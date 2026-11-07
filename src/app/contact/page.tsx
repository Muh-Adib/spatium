import type { Metadata } from 'next'
import { PageHero } from '@/components/ui/PageHero'
import { InquiryForm } from '@/components/forms/InquiryForm'
import { getUseCaseNav } from '@/lib/content/spatium'
import { getPublicContact } from '@/lib/content/contact'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import { CONTACT_FAQS, CONTACT_STEPS } from '@/config/spatium-story'
import { siteConfig } from '@/config/site'
import type { PublicContact } from '@/lib/contact/public-contact'
import '@/pages/contact.css'

const SITE_URL = siteConfig.url

export const metadata: Metadata = {
  title: 'Hubungi SPATIUM — Jadwalkan Konsultasi & Reality Capture',
  description:
    'Ceritakan ruang dan tujuan Anda: SPATIUM merekam lokasi dengan laser scan dan merekonstruksinya menjadi 3D Gaussian Splat yang bisa dijelajahi.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
}

/** Contact channels in JSON-LD come from Studio settings; empty ones are omitted. */
function contactJsonLd(contact: PublicContact) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Kontak SPATIUM',
      url: `${SITE_URL}/contact`,
      mainEntity: {
        '@type': 'Organization',
        name: 'SPATIUM Spatial Technology Studio',
        url: SITE_URL,
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.phone ? { telephone: contact.phone } : {}),
        ...(contact.address ? { address: { '@type': 'PostalAddress', streetAddress: contact.address } } : {}),
        ...(contact.socials.length ? { sameAs: contact.socials.map((s) => s.href) } : {}),
      },
    },
  ]
}

export default async function ContactPage() {
  const [services, contact] = await Promise.all([getUseCaseNav(), getPublicContact()])
  const socials = contact.socials
  const hasDetails = Boolean(contact.mailtoHref || contact.telHref || contact.whatsappHref || contact.address || contact.hours)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd(contact)) }}
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
            {contact.address ? (
              <span className="pill">
                <Icon name="globe" size={13} /> {contact.address}
              </span>
            ) : null}
          </>
        }
      />

      <section className="section contact" aria-labelledby="contact-form-title">
        <div className="container container--wide contact__inner">
          <Reveal className="contact__aside">
            <h2 className="contact__aside-title text-white" id="contact-form-title">
              Yang kami bahas di awal
            </h2>

            <ul className="contact__expectations">
              {CONTACT_STEPS.map((item) => (
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

            {hasDetails ? (
              <div className="contact__details">
                <h3 className="mono contact__details-title text-cyan-400">Rincian Studio</h3>
                <ul>
                  {contact.mailtoHref && contact.email ? (
                    <li>
                      <Icon name="mail" size={16} />
                      <a href={contact.mailtoHref} className="text-white hover:text-cyan-400">{contact.email}</a>
                    </li>
                  ) : null}
                  {contact.telHref && contact.phone ? (
                    <li>
                      <Icon name="phone" size={16} />
                      <a href={contact.telHref} className="text-white hover:text-cyan-400">{contact.phone}</a>
                    </li>
                  ) : null}
                  {contact.whatsappHref ? (
                    <li>
                      <Icon name="phone" size={16} />
                      <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-400">
                        WhatsApp
                        <span className="sr-only"> (tab baru)</span>
                      </a>
                    </li>
                  ) : null}
                  {contact.address ? (
                    <li>
                      <Icon name="pin" size={16} />
                      <span className="text-neutral-300 whitespace-pre-line">{contact.address}</span>
                    </li>
                  ) : null}
                  {contact.hours ? (
                    <li>
                      <Icon name="clock" size={16} />
                      <span className="text-neutral-300 whitespace-pre-line">{contact.hours}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {socials.length > 0 ? (
              <div className="contact__socials">
                <h3 className="mono contact__details-title text-cyan-400">Kanal Resmi</h3>
                <ul>
                  {socials.map((social) => (
                    <li key={social.href}>
                      <a href={social.href} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-400">
                        {social.label}
                        <span className="sr-only"> (tab baru)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>

          <Reveal className="contact__main" delay={100} variant="scale">
            <InquiryForm services={services} email={contact.email} whatsapp={contact.whatsapp} />
          </Reveal>
        </div>
      </section>

      <section className="section contact-faqs" aria-labelledby="faqs-title">
        <div className="container container--wide">
          <h2 className="display-sm text-white mb-8" id="faqs-title">
            Pertanyaan Umum Seputar Pemindaian Spasial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTACT_FAQS.map((faq) => (
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
