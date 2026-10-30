import { describe, it, expect } from 'vitest'
import {
  isPrivateOrReservedIp,
  validateSafeUrl,
  safeFetch,
  SsrfError,
} from '../src/lib/security/ssrf'

describe('P0.5 SSRF Guard', () => {
  describe('isPrivateOrReservedIp', () => {
    it('identifies loopback IPv4 (127.0.0.1)', () => {
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true)
      expect(isPrivateOrReservedIp('127.1.2.3')).toBe(true)
    })

    it('identifies cloud metadata IP (169.254.169.254)', () => {
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true)
    })

    it('identifies private IPv4 addresses (RFC 1918)', () => {
      expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true)
      expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true)
      expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true)
      expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true)
    })

    it('identifies IPv6 loopback and link-local', () => {
      expect(isPrivateOrReservedIp('::1')).toBe(true)
      expect(isPrivateOrReservedIp('fe80::1')).toBe(true)
      expect(isPrivateOrReservedIp('fc00::1')).toBe(true)
    })

    it('identifies public IPv4 as not private', () => {
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false)
      expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false)
      expect(isPrivateOrReservedIp('93.184.216.34')).toBe(false)
    })
  })

  describe('validateSafeUrl', () => {
    it('rejects HTTP protocol (enforces HTTPS only)', async () => {
      await expect(validateSafeUrl('http://127.0.0.1')).rejects.toThrow(SsrfError)
      await expect(validateSafeUrl('http://example.com')).rejects.toThrow(SsrfError)
    })

    it('rejects loopback IP 127.0.0.1', async () => {
      await expect(validateSafeUrl('https://127.0.0.1:8443')).rejects.toThrow(SsrfError)
    })

    it('rejects cloud metadata IP 169.254.169.254', async () => {
      await expect(validateSafeUrl('https://169.254.169.254/latest/meta-data/')).rejects.toThrow(SsrfError)
    })

    it('rejects intranet bare hostnames without dot (e.g. web:3000, db, redis)', async () => {
      await expect(validateSafeUrl('http://web:3000')).rejects.toThrow(SsrfError)
      await expect(validateSafeUrl('https://web:3000')).rejects.toThrow(SsrfError)
      await expect(validateSafeUrl('https://localhost:3000')).rejects.toThrow(SsrfError)
    })

    it('rejects .local, .internal, and .lan hostnames', async () => {
      await expect(validateSafeUrl('https://service.internal')).rejects.toThrow(SsrfError)
      await expect(validateSafeUrl('https://router.local')).rejects.toThrow(SsrfError)
    })

    it('rejects host outside allowedHosts whitelist when configured', async () => {
      await expect(
        validateSafeUrl('https://malicious.org/api', ['segiatech.com'])
      ).rejects.toThrow(/tidak terdaftar dalam daftar host/)
    })
  })

  describe('safeFetch', () => {
    it('blocks request to http://127.0.0.1 immediately', async () => {
      await expect(safeFetch('http://127.0.0.1')).rejects.toThrow(SsrfError)
    })

    it('blocks request to http://169.254.169.254 immediately', async () => {
      await expect(safeFetch('http://169.254.169.254')).rejects.toThrow(SsrfError)
    })

    it('blocks request to http://web:3000 immediately', async () => {
      await expect(safeFetch('http://web:3000')).rejects.toThrow(SsrfError)
    })
  })
})
