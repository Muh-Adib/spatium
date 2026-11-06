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
          eyebrow="Sektor"
          title={
            <>
              Satu pipeline, <span className="industries__accent">banyak sektor</span>.
            </>
          }
          aside={
            <p className="lede">
              Laser scan, point cloud, 3D geometry, dan 3D Gaussian Splat yang sama — output-nya
              disesuaikan dengan kebutuhan tiap sektor.
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
