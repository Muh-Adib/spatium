import { describe, it, expect } from 'vitest'
import { settingsMutationSchema } from '../src/lib/validation/api-schemas'
import { PublicError, publicMessage } from '../src/lib/http/errors'

describe('settings mutation schema', () => {
  it('accepts a partial update and keeps omitted fields out of the payload', () => {
    const r = settingsMutationSchema.safeParse({ tagline: 'Real places.' })
    expect(r.success).toBe(true)
    if (r.success) expect(Object.keys(r.data)).toEqual(['tagline'])
  })

  it('only accepts https social links for known networks', () => {
    expect(settingsMutationSchema.safeParse({ socialLinks: { instagram: 'https://instagram.com/x' } }).success).toBe(true)
    expect(settingsMutationSchema.safeParse({ socialLinks: { instagram: '' } }).success).toBe(true)
    expect(settingsMutationSchema.safeParse({ socialLinks: { instagram: 'http://instagram.com/x' } }).success).toBe(false)
    expect(settingsMutationSchema.safeParse({ socialLinks: { instagram: 'javascript:alert(1)' } }).success).toBe(false)
    expect(settingsMutationSchema.safeParse({ socialLinks: { myspace: 'https://myspace.com/x' } }).success).toBe(false)
  })

  it('rejects unknown keys and unsafe asset paths', () => {
    expect(settingsMutationSchema.safeParse({ titleTemplate: '%s' }).success).toBe(false)
    expect(settingsMutationSchema.safeParse({ logoUrl: '/brand/mark-spatium.svg' }).success).toBe(true)
    expect(settingsMutationSchema.safeParse({ logoUrl: '//evil.example/logo.svg' }).success).toBe(false)
    expect(settingsMutationSchema.safeParse({ logoUrl: '/../etc/passwd' }).success).toBe(false)
  })
})

describe('public error messages', () => {
  it('passes PublicError messages through and hides everything else', () => {
    expect(publicMessage(new PublicError('Slug sudah dipakai.', 409), 'fallback')).toBe('Slug sudah dipakai.')
    expect(publicMessage(new Error('connect ECONNREFUSED 127.0.0.1:5432'), 'fallback')).toBe('fallback')
  })
})
