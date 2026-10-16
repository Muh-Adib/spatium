import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

type SectionHeadProps = {
  eyebrow?: string
  title: ReactNode
  aside?: ReactNode
  id?: string
  className?: string
}

export function SectionHead({ eyebrow, title, aside, id, className }: SectionHeadProps) {
  return (
    <div className={`sec-head${className ? ` ${className}` : ''}`}>
      <Reveal>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="sec-head__title" id={id} style={eyebrow ? { marginTop: '1.1rem' } : undefined}>
          {title}
        </h2>
      </Reveal>
      {aside ? (
        <Reveal className="sec-head__aside" delay={90}>
          {aside}
        </Reveal>
      ) : null}
    </div>
  )
}

export default SectionHead
