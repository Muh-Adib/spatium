import { describe, it, expect } from 'vitest'
import { hashPasswordScrypt, verifyPasswordScrypt } from '../src/lib/auth/crypto'
import { validateStatusTransition } from '../src/lib/auth/rbac'
import { isPrivateOrReservedIp } from '../src/lib/security/ssrf'
import { sanitizeHtmlContent } from '../src/lib/security/sanitize-html'

describe('Layer 1: Security & RBAC Contract Verification', () => {
  describe('Crypto: Scrypt Hashing & Constant-Time Verification', () => {
    it('generates valid scrypt format (scrypt:<salt>:<hash>)', async () => {
      const pwd = 'TestSuperSecretPassword2026!'
      const hash = await hashPasswordScrypt(pwd)
      expect(hash).toMatch(/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/)

      const isValid = await verifyPasswordScrypt(pwd, hash)
      expect(isValid).toBe(true)

      const isInvalid = await verifyPasswordScrypt('WrongPassword', hash)
      expect(isInvalid).toBe(false)
    })

    it('rejects empty or malformed hashes safely without throwing unhandled exceptions or bypasses', async () => {
      expect(await verifyPasswordScrypt('any', '')).toBe(false)
      expect(await verifyPasswordScrypt('any', 'corrupted-hash-string')).toBe(false)
      expect(await verifyPasswordScrypt('any', 'scrypt:short:short')).toBe(false)
      expect(await verifyPasswordScrypt('any', 'scrypt:invalid_salt:invalid_key')).toBe(false)
    })
  })

  describe('RBAC Editorial State Machine', () => {
    it('author can transition DRAFT -> IN_REVIEW, but CANNOT self-publish', () => {
      const toReview = validateStatusTransition('draft', 'in_review', 'AUTHOR')
      expect(toReview.allowed).toBe(true)

      const selfPublish = validateStatusTransition('draft', 'published', 'AUTHOR')
      expect(selfPublish.allowed).toBe(false)
      expect(selfPublish.error).toContain('approved')
    })

    it('editor can review and approve, and transition approved to published', () => {
      const approve = validateStatusTransition('in_review', 'approved', 'EDITOR')
      expect(approve.allowed).toBe(true)

      const publish = validateStatusTransition('approved', 'published', 'EDITOR')
      expect(publish.allowed).toBe(true)
    })

    it('super admin has override permissions across all status states', () => {
      expect(validateStatusTransition('draft', 'published', 'SUPER_ADMIN').allowed).toBe(true)
      expect(validateStatusTransition('published', 'archived', 'SUPER_ADMIN').allowed).toBe(true)
    })

    it('only roles that can publish may pull a published article back to draft', () => {
      expect(validateStatusTransition('published', 'draft', 'REVIEWER').allowed).toBe(false)
      expect(validateStatusTransition('published', 'draft', 'AUTHOR').allowed).toBe(false)
      expect(validateStatusTransition('published', 'draft', 'EDITOR').allowed).toBe(true)
      // Reviewers still send drafts back for revision.
      expect(validateStatusTransition('in_review', 'draft', 'REVIEWER').allowed).toBe(true)
    })
  })

  describe('SSRF Protection Gate', () => {
    it('blocks dangerous internal IP ranges, loopback, and cloud metadata', () => {
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true)
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true) // AWS/GCP metadata
      expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true)
      expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true)
      expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true)
      expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true)
    })

    it('allows legitimate public internet hostnames', () => {
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false)
      expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false)
    })
  })

  describe('HTML Sanitization (Anti-XSS)', () => {
    it('strips malicious <script> tags, onerror handlers, and javascript: links', () => {
      const malicious = '<p>Halo Dunia</p><script>alert("XSS")</script><img src="x" onerror="alert(1)"><a href="javascript:alert(2)">Klik</a>'
      const sanitized = sanitizeHtmlContent(malicious)
      expect(sanitized).not.toContain('<script')
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).toContain('<p>Halo Dunia</p>')
    })
  })
})
