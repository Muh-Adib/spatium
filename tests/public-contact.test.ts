import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { settingsMutationSchema } from '../src/lib/validation/api-schemas'
import {
  EMPTY_PUBLIC_CONTACT,
  buildMailtoHref,
  buildTelHref,
  buildWhatsappHref,
  normaliseWhatsappNumber,
  toPublicContact,
} from '../src/lib/contact/public-contact'

const first = vi.fn()
vi.mock('@/lib/db/prisma', () => ({
  prisma: { orm: { public: { SiteConfig: { where: () => ({ first }) } } } },
}))

describe('WhatsApp normalisation', () => {
  it('normalises to E.164 digits without "+"', () => {
    expect(normaliseWhatsappNumber('+62 812-3456-7890')).toBe('6281234567890')
    expect(normaliseWhatsappNumber('0812 3456 7890')).toBe('6281234567890')
    expect(normaliseWhatsappNumber('0062 812 3456 7890')).toBe('6281234567890')
    expect(normaliseWhatsappNumber('(+1) 415.555.0100')).toBeNull()
    expect(normaliseWhatsappNumber('+1 415.555.0100')).toBe('14155550100')
  })

  it('rejects empty, too short, too long or non-numeric input', () => {
    expect(normaliseWhatsappNumber('')).toBeNull()
    expect(normaliseWhatsappNumber('   ')).toBeNull()
    expect(normaliseWhatsappNumber('12345')).toBeNull()
    expect(normaliseWhatsappNumber('+1234567890123456')).toBeNull()
    expect(normaliseWhatsappNumber('wa.me/628123')).toBeNull()
    expect(normaliseWhatsappNumber('+0812345678')).toBeNull()
  })

  it('builds wa.me links with an encoded default message', () => {
    expect(buildWhatsappHref('+62 812 3456 7890')).toBe('https://wa.me/6281234567890')
    expect(buildWhatsappHref('6281234567890', 'Halo SPATIUM & tim?')).toBe(
      'https://wa.me/6281234567890?text=Halo%20SPATIUM%20%26%20tim%3F',
    )
    expect(buildWhatsappHref('', 'Halo')).toBeNull()
  })

  it('builds tel: and mailto: links only from valid values', () => {
    expect(buildTelHref('+62 (21) 1234-5678')).toBe('tel:+622112345678')
    expect(buildTelHref('')).toBeNull()
    expect(buildMailtoHref('studio@example.com', { subject: 'Brief' })).toBe('mailto:studio@example.com?subject=Brief')
    expect(buildMailtoHref('not-an-email')).toBeNull()
    expect(buildMailtoHref(null)).toBeNull()
  })
})

describe('settings schema — contact fields', () => {
  it('stores WhatsApp as E.164 digits and clears with ""', () => {
    const r = settingsMutationSchema.safeParse({ whatsapp: '0812-3456-7890' })
    expect(r.success && r.data.whatsapp).toBe('6281234567890')
    const cleared = settingsMutationSchema.safeParse({ whatsapp: '' })
    expect(cleared.success && cleared.data.whatsapp).toBe('')
  })

  it('rejects an invalid WhatsApp number with a field issue', () => {
    const r = settingsMutationSchema.safeParse({ whatsapp: '12-34' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(['whatsapp'])
  })

  it('validates email, phone, message and opening hours', () => {
    const email = settingsMutationSchema.safeParse({ email: ' Studio@Example.com ' })
    expect(email.success && email.data.email).toBe('studio@example.com')
    expect(settingsMutationSchema.safeParse({ email: '' }).success).toBe(true)
    expect(settingsMutationSchema.safeParse({ email: 'nope' }).success).toBe(false)
    expect(settingsMutationSchema.safeParse({ phone: '+62 21 1234 5678' }).success).toBe(true)
    expect(settingsMutationSchema.safeParse({ phone: 'call me' }).success).toBe(false)
    expect(settingsMutationSchema.safeParse({ whatsappMessage: 'Halo', openingHours: 'Senin–Jumat 09.00–17.00' }).success).toBe(true)
    expect(settingsMutationSchema.safeParse({ whatsappMessage: 'x'.repeat(501) }).success).toBe(false)
  })

  it('keeps social links https-only', () => {
    expect(settingsMutationSchema.safeParse({ socialLinks: { youtube: 'https://youtube.com/@x' } }).success).toBe(true)
    expect(settingsMutationSchema.safeParse({ socialLinks: { youtube: 'http://youtube.com/@x' } }).success).toBe(false)
  })

  it('a partial contact update only carries the sent keys', () => {
    const r = settingsMutationSchema.safeParse({ openingHours: 'Senin–Jumat' })
    expect(r.success && Object.keys(r.data)).toEqual(['openingHours'])
  })
})

describe('toPublicContact', () => {
  it('hides every empty or invalid channel', () => {
    expect(toPublicContact(null)).toEqual(EMPTY_PUBLIC_CONTACT)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(
      toPublicContact({
        email: '  ',
        phone: '',
        whatsapp: 'abc',
        whatsappMessage: 'Halo',
        address: null,
        openingHours: ' ',
        socialLinks: '{"instagram":"http://x.test","x":""}',
      }),
    ).toEqual({ ...EMPTY_PUBLIC_CONTACT, whatsappMessage: 'Halo' })
    warn.mockRestore()
  })

  it('builds links from stored values', () => {
    const c = toPublicContact({
      email: 'studio@example.com',
      phone: '+62 21 555 0100',
      whatsapp: '6281234567890',
      whatsappMessage: 'Halo SPATIUM',
      address: 'Jl. Contoh 1',
      openingHours: 'Senin–Jumat',
      socialLinks: JSON.stringify({ instagram: 'https://instagram.com/example' }),
    })
    expect(c.mailtoHref).toBe('mailto:studio@example.com')
    expect(c.telHref).toBe('tel:+62215550100')
    expect(c.whatsappHref).toBe('https://wa.me/6281234567890?text=Halo%20SPATIUM')
    expect(c.hours).toBe('Senin–Jumat')
    expect(c.socials).toEqual([{ label: 'Instagram', href: 'https://instagram.com/example' }])
  })
})

describe('getPublicContact', () => {
  const env = process.env.DATABASE_URL
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://test'
    first.mockReset()
  })
  afterEach(() => {
    process.env.DATABASE_URL = env
    vi.restoreAllMocks()
  })

  it('returns an empty profile when no settings row exists', async () => {
    first.mockResolvedValue(null)
    const { getPublicContact } = await import('../src/lib/content/contact')
    expect(await getPublicContact()).toEqual(EMPTY_PUBLIC_CONTACT)
  })

  it('logs and returns an empty profile on a database error', async () => {
    first.mockRejectedValue(new Error('connection refused'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { getPublicContact } = await import('../src/lib/content/contact')
    expect(await getPublicContact()).toEqual(EMPTY_PUBLIC_CONTACT)
    expect(spy).toHaveBeenCalled()
  })

  it('reads the contact columns from site_configs', async () => {
    first.mockResolvedValue({
      email: 'studio@example.com',
      whatsapp: '6281234567890',
      phone: null,
      address: null,
      openingHours: null,
      whatsappMessage: null,
      socialLinks: null,
    })
    const { getPublicContact } = await import('../src/lib/content/contact')
    const c = await getPublicContact()
    expect(c.email).toBe('studio@example.com')
    expect(c.whatsappHref).toBe('https://wa.me/6281234567890')
    expect(c.phone).toBeNull()
  })
})

describe('zero-mock contact (AGENTS.md §3.3)', () => {
  const ROOT = path.resolve(__dirname, '..')
  const files = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return entry.name === 'seed' ? [] : files(full)
      return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
    })

  it('no source file hardcodes a contact address/number or reads contact env vars', () => {
    const offenders = files(path.join(ROOT, 'src')).filter((file) => {
      const text = fs.readFileSync(file, 'utf-8')
      return (
        /NEXT_PUBLIC_(WHATSAPP|PHONE|STUDIO_ADDRESS|STUDIO_HOURS|STUDIO_EMAIL)\b/.test(text) ||
        /\b(hello|info|contact|studio)@spatium\.id/i.test(text) ||
        /wa\.me\/\d/.test(text) ||
        /['"`]tel:\+?\d/.test(text) ||
        /mailto:[a-z0-9._%+-]+@/i.test(text)
      )
    })
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([])
  })

  it('deployment config no longer passes contact env vars', () => {
    for (const name of ['Dockerfile', 'docker-compose.yml', '.env.example']) {
      const text = fs.readFileSync(path.join(ROOT, name), 'utf-8')
      expect(text, name).not.toMatch(/NEXT_PUBLIC_(WHATSAPP|PHONE|STUDIO_ADDRESS|STUDIO_HOURS|STUDIO_EMAIL)\b/)
    }
  })
})
