import { Seo, SITE_URL } from '@/components/Seo'
import { PageHero } from '@/components/ui/PageHero'
import { InquiryForm } from '@/components/forms/InquiryForm'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/Icon'
import { CONTACT, SOCIALS } from '@/data/site'
import './contact.css'

const EXPECTATIONS = [
  {
    title: 'We read the brief properly',
    body: 'No templated reply. We look at the audience, the deadline and the budget before answering.',
    icon: 'eye',
  },
  {
    title: 'You get a recommended pipeline',
    body: 'Including why we would choose 2D, 3D or motion for your specific message — and what we would avoid.',
    icon: 'route',
  },
  {
    title: 'Scope before surprises',
    body: 'A written scope with deliverables, review rounds and timing, so nothing is discovered late.',
    icon: 'shield',
  },
  {
    title: 'Reply within two working days',
    body: 'Usually faster. If we are at capacity we will say so rather than hold your project in a queue.',
    icon: 'clock',
  },
]

const FAQS = [
  {
    q: 'What does a project typically cost?',
    a: 'Cost depends on runtime, complexity and how much of the design work you already have. Pick a budget range in the form and we will tell you honestly what is achievable within it.',
  },
  {
    q: 'How quickly can you start?',
    a: 'Discovery usually begins within a week to ten days of an approved proposal, depending on current studio capacity.',
  },
  {
    q: 'Do you work with teams in other time zones?',
    a: 'Yes. We are remote-first and run reviews asynchronously by default, with live calls when they add something.',
  },
  {
    q: 'Can you work under our brand guidelines?',
    a: 'Yes. Share the brand system and we will build the animation style within it, proposing extensions only where motion genuinely needs new rules.',
  },
]

export default function Contact() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact UNIMASI',
      url: `${SITE_URL}/contact`,
      mainEntity: {
        '@type': 'Organization',
        name: 'UNIMASI',
        url: SITE_URL,
        email: CONTACT.email,
      },
    },
  ]

  return (
    <>
      <Seo
        title="Contact"
        description="Start a project with UNIMASI. Send your brief, service interest, budget range and timeline and the studio will respond within two working days."
        path="/contact"
        jsonLd={jsonLd}
      />

      <PageHero
        eyebrow="Project inquiry"
        title={
          <>
            Tell us what needs to <span className="accent">move</span>.
          </>
        }
        lede="Fill in as much as you can. The more context you give, the more useful our reply will be — and there is no obligation on either side."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="clock" size={13} /> Reply within 2 working days
            </span>
            <span className="pill">
              <Icon name="globe" size={13} /> Remote-first, worldwide
            </span>
          </>
        }
      />

      <section className="section contact" aria-labelledby="contact-form-title">
        <div className="container container--wide contact__inner">
          <Reveal className="contact__aside">
            <h2 className="contact__aside-title" id="contact-form-title">
              What to expect
            </h2>

            <ul className="contact__expectations">
              {EXPECTATIONS.map((item) => (
                <li key={item.title}>
                  <span className="contact__expectation-icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="contact__details">
              <h3 className="mono contact__details-title">Studio details</h3>
              <ul>
                <li>
                  <Icon name="mail" size={16} />
                  <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </li>
                <li>
                  <Icon name="pin" size={16} />
                  <span>{CONTACT.location}</span>
                </li>
                <li>
                  <Icon name="clock" size={16} />
                  <span>{CONTACT.hours}</span>
                </li>
              </ul>

              <ul className="contact__socials">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a href={social.href} target="_blank" rel="noreferrer noopener">
                      {social.label}
                      <Icon name="external" size={13} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="contact__form" delay={110} variant="scale">
            <InquiryForm />
          </Reveal>
        </div>
      </section>

      <section className="section section--deep contact-faq" aria-labelledby="contact-faq-title">
        <div className="container container--wide">
          <Reveal className="contact-faq__head">
            <p className="eyebrow">Before you write</p>
            <h2 className="display-md" id="contact-faq-title">
              Common questions
            </h2>
          </Reveal>

          <div className="contact-faq__list">
            {FAQS.map((faq, i) => (
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
    </>
  )
}
