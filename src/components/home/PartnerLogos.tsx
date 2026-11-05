'use client'

import React from 'react'
import type { PartnerLogo } from '@/data/clients'
import './partner-logos.css'

export function PartnerLogos({ partners = [] }: { partners?: PartnerLogo[] } = {}) {
  if (!partners || partners.length === 0) return null
  const logosDoubled = [...partners, ...partners]

  return (
    <section
      className="partner-logos"
      aria-label="Trusted Partners & Enterprise Clients"
      data-reveal
    >
      <div className="container">
        <p className="partner-logos__title">Trusted by Industry Leaders &amp; Enterprise Clients</p>
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
