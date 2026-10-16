import { INDUSTRIES } from '@/data/site'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import './industries.css'

export function Industries() {
  return (
    <section className="section section--paper industries" id="industries" aria-labelledby="industries-title">
      <div className="container container--wide">
        <SectionHead
          id="industries-title"
          eyebrow="Industries we serve"
          title={
            <>
              Different sectors, <span className="industries__accent">same job</span>: make it
              understood.
            </>
          }
          aside={
            <p className="lede">
              We adapt the pipeline to the sector — a safety module and a product launch film are
              built differently, even when the craft is identical.
            </p>
          }
        />

        <ul className="industries__grid">
          {INDUSTRIES.map((industry, i) => (
            <Reveal as="li" key={industry.name} delay={i * 55} className="industry">
              <span className="industry__icon">
                <Icon name={industry.icon} size={20} />
              </span>
              <h3 className="industry__name">{industry.name}</h3>
              <p className="industry__blurb">{industry.blurb}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Industries
