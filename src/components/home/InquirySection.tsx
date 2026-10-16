import { CONTACT, PROCESS } from '@/data/site'
import { InquiryForm } from '@/components/forms/InquiryForm'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import './inquiry-section.css'

export function InquirySection() {
  return (
    <section className="section inquiry-section" id="inquiry" aria-labelledby="inquiry-title">
      <div className="bg-glow bg-glow--yellow inquiry-section__glow" aria-hidden="true" />
      <div className="container container--wide inquiry-section__inner">
        <Reveal className="inquiry-section__intro">
          <p className="eyebrow">Project inquiry</p>
          <h2 className="display-md inquiry-section__title" id="inquiry-title">
            Tell us what needs to <span className="accent">move</span>.
          </h2>
          <p className="lede">
            Share the message, the audience and the timeline. We will come back with a recommended
            pipeline, a realistic scope and a fixed proposal — no obligation.
          </p>

          <ul className="inquiry-section__steps">
            {PROCESS.slice(0, 3).map((step) => (
              <li key={step.index}>
                <span className="mono">{step.index}</span>
                <strong>{step.title}</strong>
              </li>
            ))}
          </ul>

          <ul className="inquiry-section__contact">
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
        </Reveal>

        <Reveal className="inquiry-section__form" delay={120} variant="scale">
          <InquiryForm />
        </Reveal>
      </div>
    </section>
  )
}

export default InquirySection
