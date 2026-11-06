'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NAV, type NavItem } from '@/data/site'
import { siteConfig } from '@/config/site'
import { Icon } from '@/components/Icon'
import { useBodyScrollLock } from '@/hooks'
import './header.css'

/** Presentation-only stills for the services mega menu (cropped from the product deck). */
const MENU_STILLS: Record<string, { src: string; alt: string }> = {
  '/services/filmmaking-vfx': { src: '/images/spatium/web/uc-filmmaking.webp', alt: 'Kru film di depan rekonstruksi digital set' },
  '/services/marketing-branding': { src: '/images/spatium/web/uc-marketing.webp', alt: 'Spatial tour villa dengan denah 3D' },
  '/services/entertainment-installation': { src: '/images/spatium/web/uc-entertainment.webp', alt: 'Instalasi imersif dengan proyeksi paus' },
  '/services/memory-documentary': { src: '/images/spatium/web/uc-memory.webp', alt: 'Dekorasi pernikahan dalam pengalaman spasial' },
}

const PRIMARY: NavItem[] = NAV.filter((item) => item.to !== '/' && item.to !== '/contact')

function Logo() {
  return (
    <Link href="/" className="sh-brand" aria-label="SPATIUM — beranda">
      <Image
        src="/brand/logo-spatium-white.svg"
        alt="SPATIUM"
        width={150}
        height={14}
        priority
        className="sh-brand__img"
      />
      <span className="sh-brand__tag" aria-hidden="true">
        Spatial Technology Studio
      </span>
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const menuId = useId()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const [indicator, setIndicator] = useState<{ x: number; w: number; visible: boolean }>({ x: 0, w: 0, visible: false })

  useBodyScrollLock(mobileOpen)

  const isActive = useCallback(
    (to: string) => (to === '/' ? pathname === '/' : Boolean(pathname?.startsWith(to))),
    [pathname],
  )

  // Condense on scroll; hide while scrolling down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      setHidden(y > 320 && y > last + 4)
      if (y < last - 4) setHidden(false)
      last = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMegaOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMobileOpen(false)
      setMegaOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    },
    [],
  )

  // Sliding pill under the active link.
  const measure = useCallback((target?: HTMLElement | null) => {
    const list = navRef.current
    const el = target ?? list?.querySelector<HTMLElement>('[data-active="true"]')
    if (!list || !el) {
      setIndicator((s) => ({ ...s, visible: false }))
      return
    }
    const lb = list.getBoundingClientRect()
    const eb = el.getBoundingClientRect()
    setIndicator({ x: eb.left - lb.left, w: eb.width, visible: true })
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [pathname, measure])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  const openMega = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 160)
  }

  const services = PRIMARY.find((item) => item.children)

  return (
    <>
      <a className="skip-link" href="#main">
        Langsung ke konten
      </a>
      <header
        className={`sh${scrolled ? ' is-scrolled' : ''}${hidden && !megaOpen && !mobileOpen ? ' is-hidden' : ''}${
          mobileOpen ? ' is-open' : ''
        }`}
      >
        <div className="sh__bar">
          <Logo />

          <nav className="sh-nav" aria-label="Navigasi utama" ref={navRef} onMouseLeave={() => measure()}>
            <span
              className="sh-nav__indicator"
              aria-hidden="true"
              style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w, opacity: indicator.visible ? 1 : 0 }}
            />
            <ul className="sh-nav__list">
              {PRIMARY.map((item) => {
                const active = isActive(item.to)
                if (!item.children) {
                  return (
                    <li key={item.to}>
                      <Link
                        href={item.to}
                        className="sh-nav__link"
                        data-active={active}
                        aria-current={active ? 'page' : undefined}
                        onMouseEnter={(e) => measure(e.currentTarget)}
                        onFocus={(e) => measure(e.currentTarget)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                }
                return (
                  <li key={item.to} onMouseEnter={openMega} onMouseLeave={scheduleClose}>
                    <button
                      type="button"
                      className="sh-nav__link"
                      data-active={active}
                      aria-expanded={megaOpen}
                      aria-controls={`${menuId}-mega`}
                      onMouseEnter={(e) => measure(e.currentTarget)}
                      onFocus={(e) => measure(e.currentTarget)}
                      onClick={() => setMegaOpen((v) => !v)}
                    >
                      {item.label}
                      <Icon name="arrow-down" size={13} className={`sh-nav__caret${megaOpen ? ' is-open' : ''}`} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="sh__actions">
            <Link href="/contact" className="sh-cta">
              <span className="sh-cta__dot" aria-hidden="true" />
              Mulai proyek
              <Icon name="arrow-right" size={15} />
            </Link>
            <button
              type="button"
              className="sh-toggle"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sh-toggle__lines" aria-hidden="true">
                <span />
                <span />
              </span>
              <span className="sr-only">{mobileOpen ? 'Tutup menu' : 'Buka menu'}</span>
            </button>
          </div>
        </div>

        {services?.children ? (
          <div
            id={`${menuId}-mega`}
            className={`sh-mega${megaOpen ? ' is-open' : ''}`}
            role="group"
            aria-label={services.label}
            onMouseEnter={openMega}
            onMouseLeave={scheduleClose}
          >
            <div className="sh-mega__intro">
              <p className="sh-mega__eyebrow">One Point, Unlimited Possibilities</p>
              <p className="sh-mega__title">Satu capture spasial, banyak kegunaan.</p>
              <Link href="/services" className="sh-mega__all">
                Semua layanan <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <ul className="sh-mega__grid">
              {services.children
                .filter((child) => child.to !== '/services')
                .map((child) => {
                  const still = MENU_STILLS[child.to]
                  return (
                    <li key={child.to}>
                      <Link href={child.to} className="sh-mega__card" tabIndex={megaOpen ? 0 : -1}>
                        <span className="sh-mega__media">
                          {still ? <Image src={still.src} alt={still.alt} fill sizes="220px" /> : null}
                        </span>
                        <span className="sh-mega__label">{child.label}</span>
                        {child.blurb ? <span className="sh-mega__blurb">{child.blurb}</span> : null}
                      </Link>
                    </li>
                  )
                })}
            </ul>
          </div>
        ) : null}
      </header>

      <div className={`sh-mobile${mobileOpen ? ' is-open' : ''}`} id="mobile-nav" hidden={!mobileOpen}>
        <div className="sh-mobile__orbit" aria-hidden="true" />
        <nav aria-label="Navigasi seluler" className="sh-mobile__nav">
          <ul className="sh-mobile__list">
            {NAV.map((item, i) => (
              <li key={item.to} style={{ ['--i' as string]: i }}>
                <Link
                  href={item.to}
                  className="sh-mobile__link"
                  aria-current={isActive(item.to) ? 'page' : undefined}
                >
                  <span className="sh-mobile__n">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </Link>
                {item.children ? (
                  <ul className="sh-mobile__sub">
                    {item.children
                      .filter((child) => child.to !== item.to)
                      .map((child) => (
                        <li key={child.to}>
                          <Link href={child.to}>{child.label}</Link>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
        <div className="sh-mobile__footer">
          <Link href="/contact" className="sh-cta sh-cta--block">
            Mulai proyek <Icon name="arrow-right" size={15} />
          </Link>
          <a className="sh-mobile__mail" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
        </div>
      </div>
    </>
  )
}

export default Header
