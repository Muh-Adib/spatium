/**
 * HTML Sanitizer Unit Tests (L2-T2 / K-3)
 *
 * Verifies that dangerous HTML elements, scripts, event handlers,
 * and pseudo-protocols are stripped while preserving safe semantic text formatting.
 */
import { describe, it, expect } from 'vitest'
import { sanitizeHtmlContent } from '../src/lib/security/sanitize-html'

describe('K-3 HTML Sanitizer Contract (L2-T2)', () => {
  it('strips script tags and inner executable code', () => {
    const dirty = '<p>Halo</p><script>alert("XSS")</script><p>Dunia</p>'
    const clean = sanitizeHtmlContent(dirty)
    expect(clean).not.toContain('<script>')
    expect(clean).not.toContain('alert("XSS")')
    expect(clean).toContain('<p>Halo</p>')
    expect(clean).toContain('<p>Dunia</p>')
  })

  it('strips inline event handlers such as onerror, onclick, onload', () => {
    const dirty = '<img src="x" onerror="alert(1)" /><button onclick="evil()">Klik</button>'
    const clean = sanitizeHtmlContent(dirty)
    expect(clean).not.toContain('onerror')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('alert(1)')
    expect(clean).not.toContain('evil()')
  })

  it('strips javascript: pseudo-protocol from anchor hrefs', () => {
    const dirty = '<a href="javascript:alert(document.cookie)">Tautan Rahasia</a>'
    const clean = sanitizeHtmlContent(dirty)
    expect(clean).not.toContain('javascript:')
    expect(clean).not.toContain('document.cookie')
    expect(clean).toContain('Tautan Rahasia')
  })

  it('preserves legitimate semantic HTML and safe anchor links', () => {
    const valid = '<h2>Judul Bagus</h2><p>Ini <strong>teks tebal</strong> dan <em>miring</em>. <a href="https://www.segiatech.com" target="_blank">Kunjungi</a></p>'
    const clean = sanitizeHtmlContent(valid)
    expect(clean).toContain('<h2>Judul Bagus</h2>')
    expect(clean).toContain('<strong>teks tebal</strong>')
    expect(clean).toContain('<em>miring</em>')
    expect(clean).toContain('href="https://www.segiatech.com"')
    expect(clean).toContain('rel="noopener noreferrer"')
  })

  it('handles null, undefined, and non-string inputs safely', () => {
    expect(sanitizeHtmlContent(null)).toBe('')
    expect(sanitizeHtmlContent(undefined)).toBe('')
    expect(sanitizeHtmlContent('' as any)).toBe('')
  })
})
