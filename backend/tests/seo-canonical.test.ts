import { describe, it, expect } from 'vitest'
import { articleCanonical, articleStructuredData } from '../src/lib/seo/canonical'
import { generatePageMetadata } from '../src/lib/seo/metadata'
describe('Canonical migration and structured metadata', () => {
  it('does not point canonical tags at the redirecting WordPress source URL', () => {
    expect(articleCanonical({ slug: 'post', canonicalUrl: 'https://old.example/post/', wpSourceUrl: 'https://old.example/post/' }, 'https://new.example')).toBe('https://new.example/artikel/post')
  })
  it('retains intentional external canonical targets', () => {
    expect(articleCanonical({ slug: 'post', canonicalUrl: 'https://publisher.example/original', wpSourceUrl: 'https://old.example/post/' }, 'https://new.example')).toBe('https://publisher.example/original')
  })
  it('rejects non-HTTP canonical protocols', () => {
    expect(articleCanonical({ slug: 'post', canonicalUrl: 'javascript:alert(1)' }, 'https://new.example')).toBe('https://new.example/artikel/post')
  })
  it('renders the editor-selected article schema type', () => {
    expect(articleStructuredData({ type: 'NewsArticle' }, { '@type': 'Article', headline: 'Title' })['@type']).toBe('NewsArticle')
  })
  it('preserves Yoast graph properties while updating migrated article identities', () => {
    const graph = { '@graph': [{ '@type': 'Article', '@id': 'https://old.example/post/#article', headline: 'Original', datePublished: '2020-01-01' }] }
    const result = articleStructuredData(graph, {}, 'https://old.example/post/', 'https://new.example/artikel/post')
    expect(result).toEqual({ '@graph': [{ '@type': 'Article', '@id': 'https://new.example/artikel/post#article', headline: 'Original', datePublished: '2020-01-01' }] })
  })
  it('includes custom social images in public metadata', () => {
    const meta = generatePageMetadata({ title: 'Title', seo: { openGraph: { image: 'https://media.example/og.jpg' }, twitter: { image: 'https://media.example/twitter.jpg' } } })
    expect(JSON.stringify(meta.openGraph)).toContain('https://media.example/og.jpg')
    expect(JSON.stringify(meta.twitter)).toContain('https://media.example/twitter.jpg')
  })
})
