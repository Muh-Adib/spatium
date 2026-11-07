import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { BrandLogo } from '@/components/ui/BrandLogo'
import type { UseCaseMenuItem } from '@/lib/content/spatium-types'
import type { PublicContact } from '@/lib/contact/public-contact'
import './footer.css'

/**
 * `useCases` and `contact` are read from the DB by the root layout. Each
 * contact item is hidden when its Studio setting is empty.
 */
export function Footer({ useCases, contact }: { useCases: UseCaseMenuItem[]; contact: PublicContact }) {
  const year = new Date().getFullYear()
  const socials = contact.socials
  const hasContact = Boolean(contact.mailtoHref || contact.telHref || contact.whatsappHref || contact.address || contact.hours)

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

          {hasContact || socials.length > 0 ? (
            <div className="site-footer__col">
              <h2 className="site-footer__heading">Get in touch</h2>
              {hasContact ? (
                <ul className="site-footer__contact">
                  {contact.mailtoHref && contact.email ? (
                    <li>
                      <Icon name="mail" size={16} />
                      <a href={contact.mailtoHref}>{contact.email}</a>
                    </li>
                  ) : null}
                  {contact.telHref && contact.phone ? (
                    <li>
                      <Icon name="phone" size={16} />
                      <a href={contact.telHref}>{contact.phone}</a>
                    </li>
                  ) : null}
                  {contact.whatsappHref ? (
                    <li>
                      <Icon name="phone" size={16} />
                      <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                        <span className="sr-only"> (tab baru)</span>
                      </a>
                    </li>
                  ) : null}
                  {contact.address ? (
                    <li>
                      <Icon name="pin" size={16} />
                      <span>{contact.address}</span>
                    </li>
                  ) : null}
                  {contact.hours ? (
                    <li>
                      <Icon name="clock" size={16} />
                      <span>{contact.hours}</span>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              {socials.length > 0 ? (
                <ul className="site-footer__socials">
                  {socials.map((social) => (
                    <li key={social.href}>
                      <a href={social.href} target="_blank" rel="noopener noreferrer">
                        {social.label}
                        <Icon name="external" size={14} aria-hidden="true" />
                        <span className="sr-only"> (tab baru)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
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
