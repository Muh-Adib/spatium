import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/ui/Reveal'
import './cta.css'

type CTASectionProps = {
  eyebrow?: string
  title: React.ReactNode
  body?: string
  primary?: { label: string; to: string }
  secondary?: { label: string; to: string }
  id?: string
}

export function CTASection({
  eyebrow = 'Next step',
  title,
  body,
  primary = { label: 'Start a Project', to: '/contact' },
  secondary,
  id,
}: CTASectionProps) {
  return (
    <section className="section cta" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="bg-grid cta__grid" aria-hidden="true" />
      <div className="container">
        <Reveal className="cta__inner" variant="scale">
          <p className="eyebrow eyebrow--plain cta__eyebrow">{eyebrow}</p>
          <h2 className="display-md cta__title" id={id ? `${id}-title` : undefined}>
            {title}
          </h2>
          {body ? <p className="lede cta__body">{body}</p> : null}
          <div className="cta__actions">
            <Link href={primary.to} className="btn btn--primary">
              {primary.label}
              <span className="btn__icon">
                <Icon name="arrow-right" size={17} />
              </span>
            </Link>
            {secondary ? (
              <Link href={secondary.to} className="btn btn--ghost">
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default CTASection
