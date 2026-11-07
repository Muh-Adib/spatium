import type { ReactNode } from 'react'
import { CTASection } from '@/components/ui/CTASection'
import type { EntityContext } from '@/lib/content/spatium-types'
import type { EntityCtaBlockData } from './definition'

type Defaults = {
  id: string
  eyebrow: string
  title: ReactNode
  body: string
  primary?: { label: string; to: string }
  secondary?: { label: string; to: string }
}

const DISCUSS_BODY =
  'Ceritakan lokasi, tujuan, dan tenggat Anda. Kami akan merekomendasikan alur capture dan keluaran yang sesuai, dengan cakupan yang jelas.'

function defaultsFor(entity: EntityContext): Defaults {
  switch (entity.kind) {
    case 'service-category':
      return {
        id: 'service-cta',
        eyebrow: 'Mulai di sini',
        title: (
          <>
            Diskusikan proyek <span className="accent">{entity.category.shortName}</span> Anda.
          </>
        ),
        body: DISCUSS_BODY,
        secondary: { label: 'Lihat portofolio', to: '/portfolio' },
      }
    case 'service':
      return {
        id: 'service-cta',
        eyebrow: 'Mulai di sini',
        title: (
          <>
            Diskusikan proyek <span className="accent">{entity.service.name}</span> Anda.
          </>
        ),
        body: DISCUSS_BODY,
        secondary: { label: `Lihat ${entity.service.parent.shortName}`, to: `/services/${entity.service.parent.slug}` },
      }
    case 'portfolio':
      return {
        id: 'project-cta',
        eyebrow: 'Konsultasi Teknologi Spasial',
        title: (
          <>
            Ingin merekonstruksi lokasi fisik Anda ke dalam <span className="accent">3D Gaussian Splatting</span>?
          </>
        ),
        body: 'Ceritakan lokasi dan tujuan Anda — marketing, previz film, instalasi, atau preservasi memori — dan kami bantu merencanakan capture di lokasi.',
        primary: { label: 'Jadwalkan Konsultasi Spasial', to: '/contact' },
        secondary: { label: 'Lihat Semua Layanan', to: '/services' },
      }
  }
}

/** Closing CTA titled after the entity; every text and link can be overridden in the block. */
export function EntityCtaBlock({ block, entity }: { block: EntityCtaBlockData; entity: EntityContext }) {
  const d = defaultsFor(entity)
  const primary =
    block.primaryLabel || block.primaryHref
      ? { label: block.primaryLabel || d.primary?.label || 'Mulai proyek', to: block.primaryHref || d.primary?.to || '/contact' }
      : d.primary
  const secondary =
    block.secondaryLabel && block.secondaryHref ? { label: block.secondaryLabel, to: block.secondaryHref } : d.secondary
  return (
    <CTASection
      id={d.id}
      eyebrow={block.eyebrow || d.eyebrow}
      title={block.heading || d.title}
      body={block.body || d.body}
      primary={primary}
      secondary={secondary}
    />
  )
}
