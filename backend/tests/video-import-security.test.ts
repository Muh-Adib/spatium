import { describe, it, expect } from 'vitest'
import { sanitizeHtmlContent } from '../src/lib/security/sanitize-html'
describe('Imported video safety', () => {
  it('preserves safe provider videos with fixed permissions', () => {
    const html = sanitizeHtmlContent('<iframe src="https://www.youtube.com/embed/abc" srcdoc="<script>bad</script>" onload="bad()"></iframe>')
    expect(html).toContain('https://www.youtube.com/embed/abc')
    expect(html).toContain('sandbox=')
    expect(html).toContain('loading="lazy"')
    expect(html).not.toMatch(/srcdoc|onload|autoplay/)
  })
  it('removes arbitrary-domain and insecure iframes', () => {
    expect(sanitizeHtmlContent('<iframe src="https://attacker.example/embed"></iframe>')).not.toContain('<iframe')
    expect(sanitizeHtmlContent('<iframe src="http://www.youtube.com/embed/abc"></iframe>')).not.toContain('<iframe')
  })
  it('preserves self-hosted video without autoplay audio', () => {
    const html = sanitizeHtmlContent('<video autoplay src="/uploads/demo.mp4"><source src="/uploads/demo.webm" type="video/webm"></video>')
    expect(html).toContain('controls')
    expect(html).toContain('/uploads/demo.mp4')
    expect(html).not.toContain('autoplay')
  })
})
