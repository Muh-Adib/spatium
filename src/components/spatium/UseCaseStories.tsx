'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/** `label` is omitted when the still already carries the deck's own caption. */
type Shot = { src: string; alt: string; label?: string }
type Story = {
  id: string
  name: string
  subtitle: string
  body: string
  href: string
  shots: Shot[]
}

// Source: product-knowledge deck, slides 12–23 (stills cropped from the deck).
const STORIES: Story[] = [
  {
    id: 'filmmaking',
    name: 'Filmmaking',
    subtitle: 'Suitable for Previz, Techviz, and VFX',
    body: 'Lokasi direkam sebagai raw point cloud, direkonstruksi menjadi 3DGS, lalu dikembangkan menjadi 3D concept, pre-visualization, dan tech-visualization — posisi kamera, lampu, dan kru direncanakan di atas lokasi yang sebenarnya.',
    href: '/services/filmmaking-vfx',
    shots: [
      { src: '/images/spatium/web/film-pointcloud.webp', alt: 'Raw point cloud sebuah gang permukiman' },
      { src: '/images/spatium/web/film-3dgs.webp', alt: 'Gang yang sama sebagai scene 3D Gaussian Splat' },
      { src: '/images/spatium/web/film-previz.webp', alt: 'Pre-visualization gang yang sama sebagai set reruntuhan' },
      { src: '/images/spatium/web/film-techviz.webp', alt: 'Tech-visualization dengan posisi kamera dan lampu di lokasi' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing & Branding',
    subtitle: 'Suitable for First Impression (Zero Moment of Truth / ZMOT)',
    body: 'Calon pelanggan menjelajahi tempat Anda sebelum datang: 3D map, eksterior, interior, hingga display produk 3D — semuanya dalam satu showcase interaktif.',
    href: '/services/marketing-branding',
    shots: [
      { src: '/images/spatium/web/mkt-map.webp', alt: '3D map restoran Batuna dengan hotspot', label: '3D map' },
      { src: '/images/spatium/web/mkt-exterior.webp', alt: 'Eksterior restoran Batuna dalam spatial tour', label: 'Exterior' },
      { src: '/images/spatium/web/mkt-interior.webp', alt: 'Interior ruang makan Batuna dalam spatial tour', label: 'Interior' },
      { src: '/images/spatium/web/mkt-food.webp', alt: 'Display makanan 3D di dalam showcase interaktif', label: '3D food display' },
    ],
  },
  {
    id: 'memory',
    name: 'Wedding Memory',
    subtitle: 'Suitable for Immersive Memory Preservation',
    body: 'Venue, altar, dan detail dekorasi diabadikan sebagai ruang yang bisa dikunjungi kembali — lengkap dengan 3D map, galeri foto, dan galeri objek 3D.',
    href: '/services/memory-documentary',
    shots: [
      { src: '/images/spatium/web/wed-altar.webp', alt: 'Altar pernikahan dalam pengalaman spasial', label: 'Venue' },
      { src: '/images/spatium/web/wed-aisle.webp', alt: 'Lorong pernikahan berhias bunga dalam scene 3D', label: 'Aisle' },
      { src: '/images/spatium/web/wed-hall.webp', alt: 'Aula resepsi pernikahan dalam scene 3D', label: 'Hall' },
      { src: '/images/spatium/web/wed-dollhouse.webp', alt: 'Denah 3D venue pernikahan', label: '3D map' },
    ],
  },
]

export function UseCaseStories() {
  const [activeId, setActiveId] = useState(STORIES[0].id)
  const baseId = useId()
  const active = STORIES.find((s) => s.id === activeId) ?? STORIES[0]

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + STORIES.length) % STORIES.length
    setActiveId(STORIES[next].id)
    document.getElementById(`${baseId}-tab-${STORIES[next].id}`)?.focus()
  }

  return (
    <div className="sp-stories">
      <div className="sp-tabs" role="tablist" aria-label="Use case">
        {STORIES.map((s, i) => (
          <button
            key={s.id}
            id={`${baseId}-tab-${s.id}`}
            role="tab"
            type="button"
            aria-selected={s.id === active.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={s.id === active.id ? 0 : -1}
            className="sp-tab"
            onClick={() => setActiveId(s.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="sp-tab__kicker">Use case</span>
            {s.name}
          </button>
        ))}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active.id}`}
        className="sp-story"
        key={active.id}
      >
        <div className="sp-story__copy">
          <h3 className="sp-story__title">{active.name}</h3>
          <p className="sp-story__subtitle">{active.subtitle}</p>
          <p className="sp-story__body">{active.body}</p>
          <Link href={active.href} className="sp-link">
            Pelajari {active.name}
          </Link>
        </div>
        <ul className="sp-story__grid">
          {active.shots.map((shot) => (
            <li key={shot.src} className="sp-shot sp-frame">
              <Image src={shot.src} alt={shot.alt} fill sizes="(max-width: 900px) 50vw, 30vw" className="sp-cover" />
              {shot.label ? <span className="sp-shot__label">{shot.label}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
