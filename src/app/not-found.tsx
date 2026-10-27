import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { SERVICES } from '@/data/services'
import '@/pages/not-found.css'

export const metadata: Metadata = {
  title: 'Page not found',
  description:
    'The page you were looking for does not exist. Explore UNIMASI services, portfolio and journal instead.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <section className="not-found grain">
      <div className="bg-grid not-found__grid" aria-hidden="true" />
      <div className="bg-glow bg-glow--yellow not-found__glow" aria-hidden="true" />
      <div className="container not-found__inner">
        <p className="mono not-found__code">Error 404</p>
        <h1 className="display-lg not-found__title">
          This frame is <span className="accent">missing</span>.
        </h1>
        <p className="lede not-found__lede">
          The page you were looking for has been moved, renamed, or never existed. Here are the
          routes people usually want.
        </p>

        <div className="not-found__actions">
          <Link href="/" className="btn btn--primary">
            Back to home
            <span className="btn__icon">
              <Icon name="arrow-right" size={16} />
            </span>
          </Link>
          <Link href="/contact" className="btn btn--ghost">
            Start a project
          </Link>
        </div>

        <nav className="not-found__links" aria-label="Popular pages">
          <ul>
            <li>
              <Link href="/portfolio">Portfolio</Link>
            </li>
            <li>
              <Link href="/journal">Articles</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            {SERVICES.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`}>{service.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}
