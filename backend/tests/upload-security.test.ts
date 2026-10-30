import { describe, it, expect } from 'vitest'
import {
  detectMimeFromBytes,
  sanitizeSvg,
  generateSafeFilename,
  isPathInsideUploads,
} from '../src/lib/media/upload-guard'
import path from 'path'

describe('P0.4 Upload Security Guard', () => {
  describe('Magic Bytes Detection', () => {
    it('detects genuine PNG magic bytes', () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
      const res = detectMimeFromBytes(pngHeader)
      expect(res).not.toBeNull()
      expect(res?.mime).toBe('image/png')
      expect(res?.ext).toBe('png')
    })

    it('detects genuine JPEG magic bytes', () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
      const res = detectMimeFromBytes(jpegHeader)
      expect(res).not.toBeNull()
      expect(res?.mime).toBe('image/jpeg')
      expect(res?.ext).toBe('jpg')
    })

    it('detects genuine WebP magic bytes', () => {
      const webpHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
      ])
      const res = detectMimeFromBytes(webpHeader)
      expect(res).not.toBeNull()
      expect(res?.mime).toBe('image/webp')
      expect(res?.ext).toBe('webp')
    })

    it('rejects a fake .png file that actually contains HTML/JavaScript', () => {
      const fakePng = Buffer.from('<html><head><script>alert("xss")</script></head><body>evil</body></html>')
      const res = detectMimeFromBytes(fakePng)
      expect(res).toBeNull()
    })

    it('rejects an empty buffer or garbage bytes', () => {
      const garbage = Buffer.from([0x01, 0x02, 0x03])
      const res = detectMimeFromBytes(garbage)
      expect(res).toBeNull()
    })
  })

  describe('SVG Sanitization', () => {
    it('accepts safe, clean SVG markup', () => {
      const safeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>'
      const res = sanitizeSvg(safeSvg)
      expect(res.valid).toBe(true)
      expect(res.sanitized).toContain('<circle')
    })

    it('rejects SVG containing inline <script> tag', () => {
      const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script><rect width="10" height="10"/></svg>'
      const res = sanitizeSvg(maliciousSvg)
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/<script>/i)
    })

    it('rejects SVG containing inline event handlers like onload or onerror', () => {
      const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(\'/api/steal\')"><rect width="10" height="10"/></svg>'
      const res = sanitizeSvg(maliciousSvg)
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/event handler/i)
    })

    it('rejects SVG containing javascript: in href or xlink:href', () => {
      const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>Click</text></a></svg>'
      const res = sanitizeSvg(maliciousSvg)
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/pseudo-protocol/i)
    })

    it('rejects SVG containing XXE DOCTYPE or ENTITY definitions', () => {
      const xxeSvg = '<!DOCTYPE svg [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><svg>&xxe;</svg>'
      const res = sanitizeSvg(xxeSvg)
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/DOCTYPE/i)
    })

    it('rejects SVG containing prohibited <foreignObject> element', () => {
      const foreignObjectSvg = '<svg><foreignObject><iframe src="evil.com"></iframe></foreignObject></svg>'
      const res = sanitizeSvg(foreignObjectSvg)
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/foreignobject/i)
    })
  })

  describe('Server-Side Safe Filename Generation', () => {
    it('generates a UUID-based filename with clean extension', () => {
      const name = generateSafeFilename('png')
      expect(name).toMatch(/^[0-9a-f-]{36}\.png$/)
    })

    it('strips leading dots and special characters from extension', () => {
      const name = generateSafeFilename('.WEBP')
      expect(name).toMatch(/^[0-9a-f-]{36}\.webp$/)
    })
  })

  describe('Path Traversal Containment Guard', () => {
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')

    it('allows paths strictly inside public/uploads', () => {
      const validPath = path.join(uploadsDir, 'image-1.webp')
      expect(isPathInsideUploads(validPath)).toBe(true)
    })

    it('rejects path traversal attempting to escape via ../', () => {
      const traversalPath = path.join(uploadsDir, '..', '..', 'etc', 'passwd')
      expect(isPathInsideUploads(traversalPath)).toBe(false)
    })

    it('rejects arbitrary paths outside public/uploads', () => {
      const outsidePath = path.resolve(process.cwd(), 'public', 'favicon.ico')
      expect(isPathInsideUploads(outsidePath)).toBe(false)
    })
  })
})
