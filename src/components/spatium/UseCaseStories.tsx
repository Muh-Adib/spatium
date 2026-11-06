'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { USE_CASE_STORIES } from '@/config/spatium-story'

const STORIES = USE_CASE_STORIES

/**
 * `publishedUseCases` holds the slugs of published use cases (DB); the "Pelajari"
 * link is only rendered when the matching use-case page exists.
 */
export function UseCaseStories({ publishedUseCases }: { publishedUseCases: readonly string[] }) {
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
          {publishedUseCases.includes(active.useCaseSlug) ? (
            <Link href={`/services/${active.useCaseSlug}`} className="sp-link">
              Pelajari {active.name}
            </Link>
          ) : null}
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
