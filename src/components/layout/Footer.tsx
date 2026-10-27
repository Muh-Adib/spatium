import Link from 'next/link'
import { CONTACT, SOCIALS } from '@/data/site'
import { SERVICES } from '@/data/services'
import { Icon } from '@/components/Icon'
import './footer.css'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer grain">
      <div className="bg-glow bg-glow--blue site-footer__glow" aria-hidden="true" />
      <div className="container container--wide site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link href="/" className="footer-logo" aria-label="UNIMASI — home">
              UNIMASI<span className="footer-logo__dot">.</span>
            </Link>
            <p className="footer-tagline">
              We make ideas move. An animation and motion design studio for teams that need complex
              subjects understood.
            </p>
            <Link href="/contact" className="btn btn--primary">
              Start a project
              <span className="btn__icon">
                <Icon name="arrow-right" size={16} />
              </span>
            </Link>
          </div>

          <nav className="site-footer__col" aria-label="Services">
            <h2 className="site-footer__heading">Services</h2>
            <ul>
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href={`/services/${service.slug}`}>{service.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer__col" aria-label="Studio">
            <h2 className="site-footer__heading">Studio</h2>
            <ul>
              <li>
                <Link href="/about">About Unimasi</Link>
              </li>
              <li>
                <Link href="/portfolio">Portfolio</Link>
              </li>
              <li>
                <Link href="/journal">Articles</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/services">All services</Link>
              </li>
            </ul>
          </nav>

          <div className="site-footer__col">
            <h2 className="site-footer__heading">Get in touch</h2>
            <ul className="site-footer__contact">
              <li>
                <Icon name="mail" size={16} />
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <Icon name="pin" size={16} />
                <span>{CONTACT.location}</span>
              </li>
              <li>
                <Icon name="clock" size={16} />
                <span>{CONTACT.hours}</span>
              </li>
            </ul>
            <ul className="site-footer__socials">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noreferrer noopener">
                    {social.label}
                    <Icon name="external" size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {year} UNIMASI. All rights reserved.</p>
          <p className="site-footer__note">
            Portfolio and article imagery on this site are original studio artwork and illustrative
            placeholders — no third-party or client assets are used.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
