import { VALUES } from '@/data/site'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import './why.css'

export function WhyUnimasi() {
  return (
    <section className="section why" id="why" aria-labelledby="why-title">
      <div className="container container--wide why__inner">
        <Reveal className="why__head">
          <p className="eyebrow">Why Unimasi</p>
          <h2 className="display-md why__title" id="why-title">
            A studio built to make <span className="accent">complex things clear</span>.
          </h2>
          <p className="lede">
            We are specialists, not generalists. That means senior craft on every frame, a process you
            can see into, and work that keeps performing long after delivery.
          </p>
        </Reveal>

        <ul className="why__grid">
          {VALUES.map((value, i) => (
            <Reveal as="li" key={value.title} delay={i * 70} className="why-card">
              <span className="why-card__icon">
                <Icon name={value.icon} size={22} />
              </span>
              <h3 className="why-card__title">{value.title}</h3>
              <p className="why-card__body">{value.body}</p>
              <span className="why-card__index mono" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default WhyUnimasi
