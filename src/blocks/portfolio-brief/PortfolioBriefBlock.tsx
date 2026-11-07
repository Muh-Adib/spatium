import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { sectionId } from '@/components/entity/sections'
import type { EntityOf } from '../entity-context'
import type { PortfolioBriefBlockData } from './definition'
import '@/pages/project-detail.css'

/** Brief (challenge), approach steps, delivered assets and the scene facts card. */
export function PortfolioBriefBlock({ block, entity }: { block: PortfolioBriefBlockData; entity: EntityOf<'portfolio'> }) {
  const view = entity.project
  const { pointCount, accuracy, location } = view
  const headingId = sectionId(block.id, 'project-brief')
  return (
    <section className="section project-body" aria-labelledby={headingId}>
      <div className="container container--wide project-body__inner">
        <div className="project-body__main">
          <Reveal>
            <p className="eyebrow text-cyan-400">{block.eyebrow || 'Tentang scene'}</p>
            <h2 className="display-md project-body__title text-white" id={headingId}>
              {block.heading || 'Konteks ruang'}
            </h2>
            <p className="project-body__text text-neutral-300 leading-relaxed">{view.brief}</p>
          </Reveal>

          {view.approach.length > 0 ? (
            <Reveal delay={80}>
              <p className="eyebrow text-cyan-400">Alur kerja</p>
              <h2 className="display-md project-body__title text-white">{block.approachHeading || 'Alur Rekonstruksi Spasial 3DGS'}</h2>
              <ol className="project-body__approach">
                {view.approach.map((step, i) => (
                  <li key={`${i}-${step}`}>
                    <span className="project-body__step mono">{String(i + 1).padStart(2, '0')}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          ) : null}

          {view.delivered.length > 0 ? (
            <Reveal delay={140}>
              <p className="eyebrow text-cyan-400">Keluaran</p>
              <h2 className="display-md project-body__title text-white">{block.deliveredHeading || 'Aset Digital yang Dihasilkan'}</h2>
              <ul className="project-body__delivered">
                {view.delivered.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </div>

        {block.showFacts === false ? null : (
          <aside className="project-body__sidebar" aria-label="Detail scene">
            <Reveal className="project-body__card" delay={60}>
              <p className="eyebrow text-cyan-400">Detail scene</p>
              <dl className="project-meta-list">
                {view.client ? (
                  <div>
                    <dt>Klien / Venue</dt>
                    <dd>{view.client}</dd>
                  </div>
                ) : null}
                {view.year ? (
                  <div>
                    <dt>Tahun Perekaman</dt>
                    <dd className="mono">{view.year}</dd>
                  </div>
                ) : null}
                {location ? (
                  <div>
                    <dt>Lokasi</dt>
                    <dd>{location}</dd>
                  </div>
                ) : null}
                {pointCount ? (
                  <div>
                    <dt>Kerapatan Splat</dt>
                    <dd className="mono">{pointCount}</dd>
                  </div>
                ) : null}
                {accuracy ? (
                  <div>
                    <dt>Akurasi Geometri</dt>
                    <dd className="mono">{accuracy}</dd>
                  </div>
                ) : null}
                {view.discipline ? (
                  <div>
                    <dt>Sektor</dt>
                    <dd>{view.discipline}</dd>
                  </div>
                ) : null}
                {view.captureMethod ? (
                  <div>
                    <dt>Teknologi</dt>
                    <dd>{view.captureMethod}</dd>
                  </div>
                ) : null}
              </dl>

              {view.sceneUrl ? (
                <a href={view.sceneUrl} target="_blank" rel="noreferrer noopener" className="link-arrow mt-4">
                  Buka scene di SuperSplat
                  <Icon name="arrow-up-right" size={15} />
                  <span className="sr-only"> (tab baru)</span>
                </a>
              ) : null}

              {view.scenePairSlug ? (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs font-mono text-neutral-400 mb-2">Scene Terkait:</p>
                  <Link
                    href={`/portfolio/${view.scenePairSlug}`}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 text-xs font-mono text-white transition-all"
                  >
                    <span>{view.scenePairLabel || 'Beralih Sudut Ruang'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                  </Link>
                </div>
              ) : null}

              <Link href="/contact" className="btn btn--primary btn--full mt-6">
                Diskusikan ruang Anda
              </Link>
            </Reveal>
          </aside>
        )}
      </div>
    </section>
  )
}
