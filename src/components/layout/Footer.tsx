import Link from 'next/link'
import { CONTACT } from '@/data/site'
import { telHref, whatsappHref } from '@/config/site'
import { Icon } from '@/components/Icon'
import { BrandLogo } from '@/components/ui/BrandLogo'
import type { SocialLink, UseCaseMenuItem } from '@/lib/content/spatium-types'
import './footer.css'

/** `useCases` and `socials` are read from the DB by the root layout. */
export function Footer({ useCases, socials }: { useCases: UseCaseMenuItem[]; socials: SocialLink[] }) {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer grain">
      <div className="bg-glow bg-glow--blue site-footer__glow" aria-hidden="true" />
      <div className="container container--wide site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link href="/" className="footer-logo" aria-label="SPATIUM — Spatial Technology Studio">
              <BrandLogo
                siteName="SPATIUM"
                color="dark"
                width={200}
                className="footer-logo__img"
              />
            </Link>
            <p className="footer-tagline">
              Real places. New perspectives. One Point, Unlimited Possibilities. Studio teknologi spasial 3D Gaussian Splatting, LiDAR laser scanning, dan walkable digital twin.
            </p>
            <Link href="/contact" className="btn btn--primary">
              Mulai Konsultasi Spasial
              <span className="btn__icon">
                <Icon name="arrow-right" size={16} />
              </span>
            </Link>
          </div>

          {useCases.length > 0 ? (
            <nav className="site-footer__col" aria-label="Services">
              <h2 className="site-footer__heading">Services</h2>
              <ul>
                {useCases.map((useCase) => (
                  <li key={useCase.slug}>
                    <Link href={`/services/${useCase.slug}`}>{useCase.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav className="site-footer__col" aria-label="Studio">
            <h2 className="site-footer__heading">Studio</h2>
            <ul>
              <li>
                <Link href="/about">About Spatium</Link>
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
              {CONTACT.phone && telHref(CONTACT.phone) && (
                <li>
                  <Icon name="phone" size={16} />
                  <a href={telHref(CONTACT.phone) ?? undefined}>{CONTACT.phone}</a>
                </li>
              )}
              {whatsappHref(CONTACT.whatsapp) && (
                <li>
                  <Icon name="phone" size={16} />
                  <a href={whatsappHref(CONTACT.whatsapp) ?? undefined} target="_blank" rel="noreferrer noopener">
                    WhatsApp
                  </a>
                </li>
              )}
              {CONTACT.location && (
                <li>
                  <Icon name="pin" size={16} />
                  <span>{CONTACT.location}</span>
                </li>
              )}
              {CONTACT.hours && (
                <li>
                  <Icon name="clock" size={16} />
                  <span>{CONTACT.hours}</span>
                </li>
              )}
            </ul>
            {socials.length > 0 ? (
              <ul className="site-footer__socials">
                {socials.map((social) => (
                  <li key={social.href}>
                    <a href={social.href} target="_blank" rel="noreferrer noopener">
                      {social.label}
                      <Icon name="external" size={14} aria-hidden="true" />
                      <span className="sr-only"> (tab baru)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {year} SPATIUM — Spatial Technology Studio.</p>
          <p className="site-footer__note">
            Visual di situs ini berasal dari capture dan deck produk SPATIUM. Scene interaktif
            disajikan melalui SuperSplat.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
