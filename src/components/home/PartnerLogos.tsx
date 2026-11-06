'use client'

import React from 'react'
import './partner-logos.css'

/** A client logo from the DB (`client_logos`, managed in Studio → Klien). */
export interface PartnerLogo {
  id: string | number
  name: string
  logo?: string
  logoUrl?: string
  src?: string
  alt?: string
  altText?: string
}

export function PartnerLogos({ partners = [] }: { partners?: PartnerLogo[] } = {}) {
  if (!partners || partners.length === 0) return null
  const logosDoubled = [...partners, ...partners]

  return (
    <section
      className="partner-logos"
      aria-labelledby="partner-logos-title"
      data-reveal
    >
      <div className="container">
        <h2 id="partner-logos-title" className="partner-logos__title">Klien &amp; mitra</h2>
        <ul className="sr-only">
          {partners.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </div>
      <div className="partner-logos__track" aria-hidden="true">
        {logosDoubled.map((item, idx) => {
          const imgSrc = item.logo || item.logoUrl || item.src || ''
          const imgAlt = item.alt || item.altText || item.name || 'Partner Logo'
          if (!imgSrc) return null

          return (
            <div key={`${item.id}-${idx}`} className="partner-logo-item" title={item.name}>
              <img
                src={imgSrc}
                alt={imgAlt}
                loading="lazy"
                width={120}
                height={36}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
