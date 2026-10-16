import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { Icon } from '@/components/Icon'
import { SERVICES } from '@/data/services'
import './not-found.css'

export default function NotFound() {
  return (
    <>
      <Seo
        title="Page not found"
        description="The page you were looking for does not exist. Explore UNIMASI services, portfolio and journal instead."
        path="/404"
        noIndex
      />

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
            <Link to="/" className="btn btn--primary">
              Back to home
              <span className="btn__icon">
                <Icon name="arrow-right" size={16} />
              </span>
            </Link>
            <Link to="/contact" className="btn btn--ghost">
              Start a project
            </Link>
          </div>

          <nav className="not-found__links" aria-label="Popular pages">
            <ul>
              <li>
                <Link to="/portfolio">Portfolio</Link>
              </li>
              <li>
                <Link to="/journal">Journal</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link to={`/services/${service.slug}`}>{service.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  )
}
