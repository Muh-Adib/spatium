import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { NAV } from '@/data/site'
import { Icon } from '@/components/Icon'
import { useBodyScrollLock } from '@/hooks'
import './header.css'

function Logo() {
  return (
    <Link to="/" className="brand" aria-label="UNIMASI — home">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="34" height="34">
          <rect width="40" height="40" rx="10" fill="var(--yellow)" />
          <path
            d="M9 28V13h4.6v9.6c0 2 1 3 2.8 3s2.8-1 2.8-3V13h4.6v15h-4.6v-2.1c-1 1.5-2.7 2.4-4.8 2.4-3.2 0-5.2-2.1-5.2-5.8Z"
            fill="var(--navy-900)"
          />
          <path d="M25.5 28V13h4.4l3.6 7.4V13h4v15h-4.3l-3.7-7.6V28h-4Z" fill="var(--navy-900)" />
        </svg>
      </span>
      <span className="brand__word">
        UNIMASI
        <em>Animation &amp; Motion Design</em>
      </span>
    </Link>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const location = useLocation()
  const menuId = useId()
  const closeTimer = useRef<number | null>(null)

  useBodyScrollLock(mobileOpen)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setOpenMenu(null)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMobileOpen(false)
      setOpenMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openDropdown = (label: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setOpenMenu(label)
  }

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140)
  }

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}${mobileOpen ? ' is-open' : ''}`}>
        <div className="site-header__inner container container--wide">
          <Logo />

          <nav className="nav-desktop" aria-label="Primary">
            <ul className="nav-desktop__list">
              {NAV.map((item) => {
                if (!item.children) {
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive: a }) => `nav-link${a ? ' is-active' : ''}`}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  )
                }

                const open = openMenu === item.label
                return (
                  <li
                    key={item.to}
                    className="nav-item--has-menu"
                    onMouseEnter={() => openDropdown(item.label)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      type="button"
                      className={`nav-link nav-link--button${isActive(item.to) ? ' is-active' : ''}`}
                      aria-expanded={open}
                      aria-controls={`${menuId}-${item.label}`}
                      onClick={() => (open ? setOpenMenu(null) : openDropdown(item.label))}
                    >
                      {item.label}
                      <Icon name="arrow-down" size={14} className={`nav-caret${open ? ' is-open' : ''}`} />
                    </button>
                    <div
                      className={`nav-dropdown${open ? ' is-open' : ''}`}
                      id={`${menuId}-${item.label}`}
                      role="group"
                      aria-label={item.label}
                    >
                      <ul>
                        {item.children.map((child) => (
                          <li key={child.to + child.label}>
                            <Link to={child.to} className="nav-dropdown__link">
                              <span className="nav-dropdown__label">{child.label}</span>
                              {child.blurb ? (
                                <span className="nav-dropdown__blurb">{child.blurb}</span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="site-header__actions">
            <Link to="/contact" className="btn btn--primary btn--sm header-cta">
              Start a Project
              <span className="btn__icon">
                <Icon name="arrow-right" size={16} />
              </span>
            </Link>
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
              <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
            </button>
          </div>
        </div>
        <span className="site-header__rule" aria-hidden="true" />
      </header>

      <div className={`mobile-nav${mobileOpen ? ' is-open' : ''}`} id="mobile-nav" hidden={!mobileOpen}>
        <nav aria-label="Mobile">
          <ul className="mobile-nav__list">
            {NAV.map((item) => (
              <li key={item.to}>
                {item.children ? (
                  <details className="mobile-nav__group">
                    <summary className="mobile-nav__summary">
                      <span>{item.label}</span>
                      <Icon name="plus" size={18} />
                    </summary>
                    <ul className="mobile-nav__sublist">
                      {item.children.map((child) => (
                        <li key={child.to + child.label}>
                          <Link to={child.to} className="mobile-nav__sublink">
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    to={item.to}
                    className={`mobile-nav__link${isActive(item.to) ? ' is-active' : ''}`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-nav__footer">
          <Link to="/contact" className="btn btn--primary btn--block">
            Start a Project
            <span className="btn__icon">
              <Icon name="arrow-right" size={16} />
            </span>
          </Link>
          <p className="mobile-nav__note">
            Or email <a href={`mailto:${'hello@unimasi.studio'}`}>hello@unimasi.studio</a>
          </p>
        </div>
      </div>
    </>
  )
}

export default Header
