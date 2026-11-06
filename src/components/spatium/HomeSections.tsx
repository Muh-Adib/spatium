import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { OrbitBackdrop } from './OrbitBackdrop'
import {
  DISTANCE_PLACES,
  MEDIA_COMPARISON,
  SPATIAL_BENEFITS,
  SPATIAL_PIPELINE,
  WAYS_OF_SEEING,
} from '@/config/spatium-story'
import type { Service } from '@/lib/content/spatium-types'

/* All headline copy below is quoted from Spatium-SpatialStudio-ProductKnowledge.pdf. */

function SectionHead({
  eyebrow,
  title,
  lede,
  align = 'left',
  id,
}: {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'center'
  id: string
}) {
  return (
    <header className={`sp-head sp-head--${align}`} data-reveal>
      <p className="sp-eyebrow">{eyebrow}</p>
      <h2 id={id} className="sp-h2">
        {title}
      </h2>
      {lede ? <p className="sp-lede">{lede}</p> : null}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* 01 — The way we see space (slide 7)                                        */
/* -------------------------------------------------------------------------- */
export function WayWeSeeSpace() {
  return (
    <section id="way-we-see" className="sp-section" aria-labelledby="sp-way-title">
      <div className="sp-container">
        <SectionHead
          id="sp-way-title"
          eyebrow="01 · Perspective"
          title="The way we see space"
          lede="Foto dan video merekam apa yang terlihat dari satu titik. Digital twin merekam ruangnya."
        />
        <ul className="sp-way">
          {WAYS_OF_SEEING.map((it) => (
            <li key={it.title} className={`sp-way__item${it.featured ? ' is-featured' : ''}`} data-reveal>
              <div className="sp-way__media sp-frame">
                <Image src={it.src} alt={it.alt} fill sizes="(max-width: 900px) 100vw, 40vw" className="sp-cover" />
              </div>
              <h3 className="sp-way__title">{it.title}</h3>
              <p className="sp-way__body">{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 02 — Distance (slide 8)                                                    */
/* -------------------------------------------------------------------------- */
export function DistanceStatement() {
  return (
    <section className="sp-distance" aria-labelledby="sp-distance-title">
      <div className="sp-distance__cliff sp-distance__cliff--l" aria-hidden="true">
        <Image src="/images/spatium/web/distance-left.webp" alt="" fill sizes="35vw" className="sp-cover" />
      </div>
      <div className="sp-distance__cliff sp-distance__cliff--r" aria-hidden="true">
        <Image src="/images/spatium/web/distance-right.webp" alt="" fill sizes="35vw" className="sp-cover" />
      </div>
      <div className="sp-distance__copy" data-reveal>
        <span className="sp-distance__rule" aria-hidden="true" />
        <p className="sp-distance__q">
          What separates
          <br />
          <span>between us and our destination?</span>
        </p>
        <h2 id="sp-distance-title" className="sp-distance__word">
          Distance
        </h2>
        <p className="sp-distance__curse">
          We are cursed by <strong>distance</strong>.
        </p>
        <p className="sp-distance__list">
          {DISTANCE_PLACES.map((p, i) => (
            <span key={p} className="sp-distance__place" style={{ ['--i' as string]: i }}>
              {i === 0 ? `Distance to our ${p}` : p}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 03 — Walkable image (slides 6, 9, 10)                                      */
/* -------------------------------------------------------------------------- */
export function WalkableImage() {
  return (
    <section className="sp-section sp-walk" aria-labelledby="sp-walk-title">
      <div className="sp-container">
        <figure className="sp-walk__hero sp-frame" data-reveal>
          <Image
            src="/images/spatium/web/walkable.webp"
            alt="Seseorang melangkah keluar dari layar monitor ke dalam ruang 3D yang direkam"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="sp-cover"
          />
          <figcaption className="sp-walk__caption">
            <p className="sp-eyebrow">02 · Walkable Image</p>
            <h2 id="sp-walk-title" className="sp-h2">
              Walkable Image
            </h2>
            <p>Walk, explore, and breathe inside the space as you are truly there.</p>
          </figcaption>
        </figure>

        <div className="sp-walk__split">
          <div className="sp-walk__question" data-reveal>
            <p className="sp-statement">
              A place can be <strong>seen</strong> from anywhere.
              <br />
              But can it be <strong>experienced</strong> from anywhere too?
            </p>
            <ul className="sp-shift">
              <li>
                From just <span className="sp-accent">seeing,</span>
                <br />
                to <span className="sp-accent">experiencing.</span>
              </li>
              <li>
                From just <span className="sp-accent">guessing,</span>
                <br />
                to <span className="sp-accent">verifying.</span>
              </li>
            </ul>
          </div>
          <div className="sp-walk__vr sp-frame" data-reveal>
            <Image
              src="/images/spatium/web/experience-vr.webp"
              alt="Pengguna headset menjelajahi rekaman spasial sebuah villa dari dalam bola imersif"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="sp-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 04 — Spatial media vs photo & video (slide 11)                             */
/* -------------------------------------------------------------------------- */
export function SpatialMediaCompare() {
  return (
    <section className="sp-section" aria-labelledby="sp-media-title">
      <div className="sp-container">
        <SectionHead
          id="sp-media-title"
          eyebrow="03 · Spatial media"
          title={
            <>
              Spatial media contains richer information than <span className="sp-accent">flat photo or video</span>
            </>
          }
        />
        <div className="sp-compare">
          <div className="sp-compare__flat">
            <article className="sp-panel" data-reveal>
              <h3 className="sp-panel__title">
                Photography <span>captures an image.</span>
              </h3>
              <ul className="sp-ticks sp-ticks--off">
                {MEDIA_COMPARISON.photography.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
            <article className="sp-panel" data-reveal>
              <h3 className="sp-panel__title">
                Video <span>captures a moment.</span>
              </h3>
              <ul className="sp-ticks sp-ticks--off">
                {MEDIA_COMPARISON.video.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
          </div>
          <article className="sp-panel sp-panel--spatial" data-reveal>
            <div className="sp-panel__media sp-frame">
              <Image
                src="/images/spatium/web/spatial-media.webp"
                alt="Rumah yang direkam sebagai media spasial lengkap dengan ukuran dimensi dan turunan datanya"
                fill
                sizes="(max-width: 900px) 100vw, 55vw"
                className="sp-cover"
              />
            </div>
            <h3 className="sp-panel__title sp-panel__title--lg">
              Spatial media <span className="sp-accent">captures a space.</span>
            </h3>
            <dl className="sp-features">
              {MEDIA_COMPARISON.spatial.map((f) => (
                <div key={f.title}>
                  <dt>{f.title}</dt>
                  <dd>{f.body}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 05 — Workflow (slide 5)                                                    */
/* -------------------------------------------------------------------------- */
export function PipelineSection() {
  return (
    <section className="sp-section sp-pipeline" aria-labelledby="sp-pipe-title">
      <div className="sp-container">
        <SectionHead
          id="sp-pipe-title"
          eyebrow="04 · Workflow"
          title="From real world to 3D Gaussian Splat"
          lede="Back then, digital twin workflow used to be very expensive for creative industry."
        />
        <ol className="sp-pipe">
          {SPATIAL_PIPELINE.map((step) => (
            <li key={step.index} className="sp-pipe__step" data-reveal>
              <div className="sp-pipe__media sp-frame">
                <Image src={step.image} alt={step.alt} fill sizes="(max-width: 900px) 100vw, 25vw" className="sp-cover" />
              </div>
              <p className="sp-pipe__index">{step.index}</p>
              <h3 className="sp-pipe__title">{step.title}</h3>
              <p className="sp-pipe__caption">{step.caption}</p>
              <p className="sp-pipe__body">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="sp-pipe__rail" aria-hidden="true">
          {['Real world', 'Capture', 'Point cloud', 'Process', '3D geometry', 'Optimize', '3D Gaussian splat'].map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <p className="sp-statement sp-statement--center" data-reveal>
          Gaussian splat offers unbeatable efficiency for 3D reconstruction without quality and performance degradation.
          It also offers rich visual information with wide range of utilization to the end-product.
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* 06 — One point, unlimited possibilities (slides 3–4)                       */
/* -------------------------------------------------------------------------- */
export function PossibilitiesSection({ services }: { services: Service[] }) {
  return (
    <section className="sp-section sp-possible" aria-labelledby="sp-possible-title">
      <div className="sp-container">
        <div className="sp-possible__intro">
          <SectionHead
            id="sp-possible-title"
            eyebrow="05 · Digital twin for creative industry"
            title={
              <>
                One Point,
                <br />
                <span className="sp-accent">Unlimited Possibilities.</span>
              </>
            }
          />
          <figure className="sp-possible__capture" data-reveal>
            <Image
              src="/images/spatium/web/capture-once.webp"
              alt="Rumah yang direkam sebagai point cloud mengalir ke satu titik data spasial"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              className="sp-cover"
            />
            <figcaption>
              <span>Capture once</span>
              <span aria-hidden="true">›››</span>
              <span>Spatial foundation</span>
              <span aria-hidden="true">›››</span>
              <span>Multiple possibilities</span>
            </figcaption>
          </figure>
        </div>

        {services.length > 0 ? (
        <ul className="sp-usecases">
          {services.map((s) => (
            <li key={s.slug} data-reveal>
              <Link href={`/services/${s.slug}`} className="sp-usecase">
                {s.image ? (
                  <div className="sp-usecase__media sp-frame">
                    <Image src={s.image} alt={s.imageAlt} fill sizes="(max-width: 900px) 100vw, 25vw" className="sp-cover" />
                  </div>
                ) : null}
                <p className="sp-usecase__index">{s.index}</p>
                <h3 className="sp-usecase__title">{s.name}</h3>
                <p className="sp-usecase__body">{s.summary}</p>
                <span className="sp-usecase__more" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        ) : null}

        <ul className="sp-benefits" data-reveal>
          {SPATIAL_BENEFITS.map((b) => (
            <li key={b.title}>
              <p className="sp-benefits__title">{b.title}</p>
              <p className="sp-benefits__body">{b.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Closing (slide 24 + reference HTML footer CTA)                             */
/* -------------------------------------------------------------------------- */
export function ClosingCta() {
  return (
    <section className="sp-closing" aria-labelledby="sp-closing-title">
      <OrbitBackdrop variant="closing" />
      <div className="sp-container sp-closing__inner" data-reveal>
        <h2 id="sp-closing-title" className="sp-closing__title">
          Elevate your space with us!
        </h2>
        <p className="sp-closing__lede">
          Every space has a story. Let’s make it explorable.
          <br />
          <span>Reality capture for places that deserve to be seen, understood, and experienced from anywhere.</span>
        </p>
        <div className="sp-hero__actions sp-closing__actions">
          <Link href="/contact" className="sp-btn sp-btn--primary">
            Diskusikan ruang Anda <span aria-hidden="true">→</span>
          </Link>
          <Link href="/portfolio" className="sp-btn sp-btn--ghost">
            Lihat semua scene
          </Link>
        </div>
      </div>
    </section>
  )
}
