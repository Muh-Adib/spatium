import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHead } from '@/components/ui/SectionHead'
import type { ProjectCategoryValue, ProjectSector } from '@/lib/content/spatium-types'
import './industries.css'

/** Presentation only: icon per sector filter id. */
export const SECTOR_ICON: Record<ProjectCategoryValue, string> = {
  filmmaking: 'film',
  marketing: 'target',
  entertainment: 'gamepad',
  memory: 'award',
  hospitality: 'building',
  healthcare: 'shield',
  industrial: 'wrench',
  fnb: 'tag',
  agriculture: 'globe',
  property: 'building',
  unknown: 'layers',
}

/**
 * Sectors covered by published scenes (DB `portfolios`). Renders nothing when
 * no scene is published — no sector is listed without a capture behind it.
 */
export function Industries({ sectors }: { sectors: readonly ProjectSector[] }) {
  if (sectors.length === 0) return null
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
              Laser scan, point cloud, 3D geometry, dan 3D Gaussian Splat yang sama — berikut sektor yang
              scene-nya bisa Anda jelajahi di portofolio.
            </p>
          }
        />

        <ul className="industries__grid">
          {sectors.map((sector, i) => (
            <Reveal as="li" key={sector.name} delay={i * 55} className="industry">
              <span className="industry__icon">
                <Icon name={SECTOR_ICON[sector.category]} size={20} aria-hidden="true" />
              </span>
              <h3 className="industry__name">{sector.name}</h3>
              <p className="industry__blurb">
                <Link href="/portfolio">{sector.sceneCount} scene di portofolio</Link>
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Industries
