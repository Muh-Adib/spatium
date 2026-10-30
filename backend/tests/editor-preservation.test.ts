import { describe, it, expect } from 'vitest'
import { contentToBlocks, blocksToContent } from '../src/lib/articles/blockEditor'
import { sanitizeHtmlContent } from '../src/lib/security/sanitize-html'

describe('Imported article content preservation', () => {
  it('retains heading semantics after opening and saving', () => {
    const html = '<h2>Bagian utama</h2><p>Isi artikel</p><h3>Rincian</h3><p>Penjelasan</p>'
    const saved = blocksToContent(contentToBlocks(html))
    expect(saved).toMatch(/<h2.*?>Bagian utama<\/h2>/)
    expect(saved).toMatch(/<h3.*?>Rincian<\/h3>/)
  })
  it('retains tables and Gutenberg columns without flattening values', () => {
    const html = '<div class="wp-block-columns"><p>Informasi asli</p></div><table><tr><td>Harga</td><td>100</td></tr></table>'
    const saved = blocksToContent(contentToBlocks(html))
    expect(saved).toContain('<div class="wp-block-columns"><p>Informasi asli</p></div>')
    expect(saved).toContain('<td>Harga</td><td>100</td>')
    expect(sanitizeHtmlContent(saved)).toContain('<td>Harga</td><td>100</td>')
  })
  it('removes executable content at the public rendering boundary', () => {
    const html = '<table><tr><td onclick="alert(1)">Isi</td></tr></table><script>alert(1)</script>'
    const safe = sanitizeHtmlContent(blocksToContent(contentToBlocks(html)))
    expect(safe).toContain('<td>Isi</td>')
    expect(safe).not.toMatch(/onclick|script|alert/)
  })
})
