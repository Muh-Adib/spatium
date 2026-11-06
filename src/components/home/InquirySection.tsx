import { CONTACT, PROCESS } from '@/data/site'
import { InquiryForm } from '@/components/forms/InquiryForm'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import './inquiry-section.css'

export function InquirySection() {
  return (
    <section className="section inquiry-section" id="inquiry" aria-labelledby="inquiry-title">
      <div className="bg-glow bg-glow--blue inquiry-section__glow" aria-hidden="true" />
      <div className="container container--wide inquiry-section__inner">
        <Reveal className="inquiry-section__intro">
          <p className="eyebrow text-cyan-400">Konsultasi &amp; Penjadwalan Capture</p>
          <h2 className="display-md inquiry-section__title text-white" id="inquiry-title">
            Jadwalkan Rekonstruksi <span className="accent">Spasial 3D</span> Anda.
          </h2>
          <p className="lede text-neutral-300">
            Sampaikan lokasi Anda, sasaran pemanfaatan (marketing ZMOT, previz film, simulasi klinis, atau arsip memori), dan jangka waktu. Kami siapkan survei laser LiDAR dan proposal terperinci.
          </p>

          <ul className="inquiry-section__steps">
            {PROCESS.slice(0, 3).map((step) => (
              <li key={step.index}>
                <span className="mono text-cyan-400">{step.index}</span>
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
