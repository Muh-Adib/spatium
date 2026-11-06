import { VALUES } from '@/data/site'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import './why.css'

export function WhyChooseUs() {
  return (
    <section className="section why bg-[#060D1A]" id="why" aria-labelledby="why-title">
      <div className="container container--wide why__inner">
        <Reveal className="why__head">
          <p className="eyebrow text-cyan-400">Filosofi & Keunggulan SPATIUM</p>
          <h2 className="display-md why__title text-white" id="why-title">
            Mengatasi <span className="text-cyan-400">The Curse of Distance</span> dengan Walkable Reality.
          </h2>
          <p className="lede text-neutral-300">
            Jarak tidak lagi membatasi calon pembeli, sutradara film, investor, maupun keluarga tercinta untuk merasakan ruang nyata.
            Kami memadukan laser LiDAR berpresisi tinggi dan 3D Gaussian Splatting untuk menghadirkan verifikasi fisik yang jujur dan fotorealistis.
          </p>
        </Reveal>

        <ul className="why__grid">
          {VALUES.map((value, i) => (
            <Reveal as="li" key={value.title} delay={i * 70} className="why-card bg-white/[0.02] border border-white/10 hover:border-cyan-400/40 transition-colors">
              <span className="why-card__icon text-cyan-400">
                <Icon name={value.icon} size={22} />
              </span>
              <h3 className="why-card__title text-white">{value.title}</h3>
              <p className="why-card__body text-neutral-400">{value.body}</p>
              <span className="why-card__index mono text-cyan-400/40" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default WhyChooseUs
