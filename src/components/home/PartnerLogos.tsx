'use client'

import { PARTNER_LOGOS } from '@/data/clients'
import './partner-logos.css'

export function PartnerLogos() {
  const logosDoubled = [...PARTNER_LOGOS, ...PARTNER_LOGOS]

  return (
    <section className="partner-logos" aria-label="Trusted Partners & Enterprise Clients">
      <div className="container">
        <p className="partner-logos__title">Trusted by Industry Leaders &amp; Enterprise Clients</p>
      </div>
      <div className="partner-logos__track" aria-hidden="true">
        {logosDoubled.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="partner-logo-item" title={item.name}>
            <img
              src={item.logo}
              alt={item.alt}
              loading="lazy"
              width={120}
              height={36}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
