import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/security/ssrf', () => ({ safeFetch: vi.fn() }))
import { safeFetch } from '../src/lib/security/ssrf'
import { wordpressCollection } from '../src/lib/import/wp-client'
beforeEach(() => vi.mocked(safeFetch).mockReset())
describe('Complete WordPress collection pagination', () => {
  it('reads beyond the first 100 records', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 100 }, (_, id) => ({ id: id + 1 }))), { headers: { 'x-wp-total': '101' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 101 }]), { headers: { 'x-wp-total': '101' } }))
    const rows = []
    for await (const row of wordpressCollection({ siteUrl: 'https://source.example' }, 'categories')) rows.push(row)
    expect(rows).toHaveLength(101)
    expect(String(vi.mocked(safeFetch).mock.calls[1][0])).toContain('page=2')
  })
  it('does not report an arbitrary HTTP error as completed pagination', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response('{}', { status: 400 }))
    await expect(async () => { for await (const _ of wordpressCollection({ siteUrl: 'https://source.example' }, 'posts')) { /* consume */ } }).rejects.toThrow('HTTP 400')
  })
  it('uses edit context and refuses credential redirects for authenticated imports', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response('[]', { headers: { 'x-wp-total': '0' } }))
    for await (const _ of wordpressCollection({ siteUrl: 'https://source.example', username: 'fixture', applicationPassword: 'test-only' }, 'posts')) { /* consume */ }
    const [url, options] = vi.mocked(safeFetch).mock.calls[0]
    expect(String(url)).toContain('context=edit')
    expect(String(url)).toContain('status=any')
    expect(options?.maxRedirects).toBe(0)
  })
  it('continues pagination even when a page returns fewer than 100 items due to server-side permission filtering (e.g. 99 items on page 1 with total 150)', async () => {
    vi.mocked(safeFetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(Array.from({ length: 99 }, (_, id) => ({ id: id + 1 }))),
          { headers: { 'x-wp-total': '150', 'x-wp-totalpages': '2' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(Array.from({ length: 50 }, (_, id) => ({ id: id + 100 }))),
          { headers: { 'x-wp-total': '150', 'x-wp-totalpages': '2' } }
        )
      )
    const rows = []
    for await (const row of wordpressCollection({ siteUrl: 'https://source.example' }, 'media')) {
      rows.push(row)
    }
    expect(rows).toHaveLength(149)
    expect(String(vi.mocked(safeFetch).mock.calls[1][0])).toContain('page=2')
  })
})

it('requires verified exporter capability for complete source archives', async () => {
  vi.mocked(safeFetch).mockResolvedValue(new Response('[]', { headers: { 'x-wp-total': '0' } }))
  await expect(async () => { for await (const _ of wordpressCollection({ siteUrl: 'https://source.example', username: 'fixture', applicationPassword: 'test-only', completeExport: true }, 'posts')) { /* consume */ } }).rejects.toThrow('Exporter')
  vi.mocked(safeFetch).mockResolvedValue(new Response('[]', { headers: { 'x-wp-total': '0', 'x-webshift-export-version': '1' } }))
  for await (const _ of wordpressCollection({ siteUrl: 'https://source.example', username: 'fixture', applicationPassword: 'test-only', completeExport: true }, 'posts')) { /* consume */ }
  expect(String(vi.mocked(safeFetch).mock.calls.at(-1)?.[0])).toContain('/wp-json/webshift/v1/export/posts')
})
