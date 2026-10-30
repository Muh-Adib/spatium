import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { requireUser, requireRole } from '../src/lib/auth/rbac'
import { isPathInsideUploads } from '../src/lib/media/upload-guard'
import { validateSafeUrl, safeFetch, SsrfError } from '../src/lib/security/ssrf'
import path from 'path'

describe('P0.12 Comprehensive Security Regression Test Suite', () => {
  describe('Defense-in-Depth Header Spoofing Resistance', () => {
    it('completely ignores spoofed x-user-role and x-actor-name headers without valid session', async () => {
      const spoofedReq = new NextRequest('http://localhost:3000/api/articles', {
        headers: {
          'x-user-role': 'SUPER_ADMIN',
          'x-actor-name': 'Hacker Exploiter',
        },
      })

      const auth = await requireUser(spoofedReq)
      expect(auth.error).not.toBeNull()
      expect(auth.user).toBeNull()
      expect(auth.error?.status).toBe(401)
    })

    it('rejects spoofed x-user-role on role-protected routes', async () => {
      const spoofedReq = new NextRequest('http://localhost:3000/api/settings', {
        headers: {
          'x-user-role': 'SUPER_ADMIN',
        },
      })

      const auth = await requireRole(spoofedReq, ['SUPER_ADMIN'])
      expect(auth.error).not.toBeNull()
      expect(auth.user).toBeNull()
      expect(auth.error?.status).toBe(401)
    })

    it('rejects arbitrary or forged Bearer tokens', async () => {
      const req = new NextRequest('http://localhost:3000/api/media', {
        headers: {
          authorization: 'Bearer completely_forged_admin_token_abcdef',
        },
      })

      const auth = await requireUser(req)
      expect(auth.error).not.toBeNull()
      expect(auth.user).toBeNull()
      expect(auth.error?.status).toBe(401)
    })
  })

  describe('Path Traversal Resistance', () => {
    it('strictly forbids relative path traversal sequences in uploads', () => {
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
      const dangerousPaths = [
        path.join(uploadsDir, '../schema.prisma'),
        path.join(uploadsDir, '../../etc/passwd'),
        path.join(uploadsDir, '..', '.env.local'),
        path.join(uploadsDir, '..', '..', '..', 'root'),
      ]

      for (const p of dangerousPaths) {
        expect(isPathInsideUploads(p)).toBe(false)
      }
    })
  })

  describe('SSRF Intranet & Cloud Metadata Protection', () => {
    it('blocks loopback IP 127.0.0.1', async () => {
      await expect(validateSafeUrl('http://127.0.0.1:8080')).rejects.toThrow(SsrfError)
      await expect(safeFetch('http://127.0.0.1:8080')).rejects.toThrow(SsrfError)
    })

    it('blocks AWS/GCP/Azure link-local metadata IP 169.254.169.254', async () => {
      await expect(validateSafeUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(SsrfError)
      await expect(safeFetch('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(SsrfError)
    })

    it('blocks internal docker hostname web:3000', async () => {
      await expect(validateSafeUrl('http://web:3000')).rejects.toThrow(SsrfError)
      await expect(safeFetch('http://web:3000')).rejects.toThrow(SsrfError)
    })
  })
})
