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
import '@/pages/about.css'

const SITE_URL = 'https://unimasi.studio'

export const metadata: Metadata = {
  title: 'About',
  description:
    'UNIMASI is an animation and motion design studio built to make complex subjects understandable through 2D animation, 3D animation and motion graphics.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

const PRINCIPLES = [
  {
    title: 'Clarity beats cleverness',
    body: 'If a viewer has to work out what they are looking at, the craft has failed. We simplify until the message is unmissable, then add the polish.',
    icon: 'target',
  },
  {
    title: 'Show the work early',
    body: 'Animatics and look-development frames arrive before the expensive stages. Nobody should be surprised by a reveal on delivery day.',
    icon: 'eye',
  },
  {
    title: 'Build things that get reused',
    body: 'Rigs, materials, templates and asset libraries are structured so the next film starts ahead rather than from zero.',
    icon: 'layers',
  },
  {
    title: 'Say no when it helps',
    body: 'If a project does not need 3D, we say so. Recommending the cheaper, faster route is how long-term studio relationships are built.',
    icon: 'shield',
  },
]

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About UNIMASI',
    url: `${SITE_URL}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: 'UNIMASI',
      url: SITE_URL,
      description:
        'An animation and motion design studio specialising in 2D animation, 3D animation and visual production, and motion graphics.',
      knowsAbout: ['2D Animation', '3D Animation', 'Motion Graphics', 'Visual Effects', 'Real-time 3D'],
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
        eyebrow="About the studio"
        title={
          <>
            We make ideas <span className="accent">move</span>.
          </>
        }
        lede="UNIMASI is an animation and motion design studio working with educators, industry, government and brands to turn complex subjects into work people actually watch."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
        meta={
          <>
            <span className="pill">
              <Icon name="layers" size={13} /> 3 core disciplines
            </span>
            <span className="pill">
              <Icon name="globe" size={13} /> Remote-first, worldwide
            </span>
          </>
        }
      />

      <section className="section about-statement" aria-labelledby="about-statement-title">
        <div className="container container--wide about-statement__inner">
          <Reveal className="about-statement__copy">
            <p className="eyebrow">Our position</p>
            <h2 className="display-md about-statement__title" id="about-statement-title">
              Animation is an argument, not a decoration.
            </h2>
            <p className="about-statement__text">
              Most of the work we take on exists because something is hard to explain — an engineering
              process, a policy change, a product mechanism, a curriculum topic. The animation is not
              there to make the explanation pretty. It is there to make it land.
            </p>
            <p className="about-statement__text">
              That means we care as much about structure and pacing as we do about rendering. We write
              before we model, we storyboard before we animate, and we review in the animatic where
              changes are still cheap.
            </p>
            <p className="about-statement__text">
              We are deliberately a specialist studio. Rather than offering every format, we go deep on
              three disciplines and support them with a documented asset pipeline — so the quality
              holds from the first explainer to the hundredth template.
            </p>
          </Reveal>

          <Reveal className="about-statement__visual" variant="scale" delay={100}>
            <div className="about-statement__frame">
              <ServiceVisual kind="motion" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section about-disciplines" aria-labelledby="about-disciplines-title">
        <div className="container container--wide">
          <SectionHead
            id="about-disciplines-title"
            eyebrow="What we do"
            title="Three disciplines, one studio"
            aside={
              <p className="lede">
                Most projects blend two or three. The pipeline is chosen to suit the message, not the
                other way around.
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
                  Explore {service.shortName}
                  <Icon name="arrow-right" size={15} />
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--deep about-principles" aria-labelledby="about-principles-title">
        <div className="container container--wide">
          <SectionHead
            id="about-principles-title"
            eyebrow="How we work"
            title="Four principles we do not negotiate"
            aside={
              <p className="lede">
                These are the rules that keep projects predictable — for us and for the teams we work
                with.
              </p>
            }
          />

          <ul className="about-principles__grid">
            {PRINCIPLES.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 65} className="about-principle">
                <span className="about-principle__icon">
                  <Icon name={item.icon} size={20} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
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
        eyebrow="Work with us"
        title={
          <>
            Bring us the thing that is <span className="accent">hard to explain</span>.
          </>
        }
        body="That is the work we are built for. Send the brief and we will tell you honestly whether animation is even the right answer."
        secondary={{ label: 'Read the journal', to: '/journal' }}
      />
    </>
  )
}
