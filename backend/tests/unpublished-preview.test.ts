import { describe, it, expect, vi } from 'vitest'
import { getArticle } from '../src/lib/content/queries'
import { generateBlockId, contentToBlocks } from '../src/lib/articles/blockEditor'

vi.mock('@/lib/db/articles', () => ({
  getArticleBySlug: vi.fn(async (slug: string) => {
    if (slug === 'artikel-draft-contoh') {
      return {
        id: 'draft-1',
        title: 'Artikel Draf Baru',
        slug: 'artikel-draft-contoh',
        content: '<p>Konten draf yang belum terbit.</p>',
        status: 'draft',
      }
    }
    if (slug === 'artikel-published-contoh') {
      return {
        id: 'pub-1',
        title: 'Artikel Terbit',
        slug: 'artikel-published-contoh',
        content: '<p>Konten sudah terbit.</p>',
        status: 'published',
      }
    }
    return null
  }),
}))

describe('Unpublished Preview & Block ID Uniqueness', () => {
  it('hides unpublished articles from standard public lookup', async () => {
    const hiddenArticle = await getArticle('artikel-draft-contoh')
    expect(hiddenArticle).toBeNull()
  })

  it('allows access to unpublished articles when allowUnpublished is true (preview mode)', async () => {
    const previewArticle = await getArticle('artikel-draft-contoh', { allowUnpublished: true })
    expect(previewArticle).not.toBeNull()
    expect(previewArticle?.title).toBe('Artikel Draf Baru')
    expect(previewArticle?.status).toBe('draft')
  })

  it('always allows access to published articles', async () => {
    const pubArticle = await getArticle('artikel-published-contoh')
    expect(pubArticle).not.toBeNull()
    expect(pubArticle?.status).toBe('published')
  })

  it('generates unique block IDs and prevents duplicate React keys', () => {
    const html = `
      <h2>Bagian 1</h2>
      <p>Paragraf 1</p>
      <h2>Bagian 2</h2>
      <p>Paragraf 2</p>
      <ul><li>Item 1</li><li>Item 2</li></ul>
      <div class="faq-item"><h4>Tanya?</h4><p>Jawab.</p></div>
    `
    const blocksA = contentToBlocks(html)
    const blocksB = contentToBlocks(html)

    const idsA = blocksA.map((b) => b.id)
    const idsB = blocksB.map((b) => b.id)

    // Ensure within a single parse, all IDs are unique
    const uniqueIdsA = new Set(idsA)
    expect(uniqueIdsA.size).toBe(idsA.length)

    // Ensure consecutive parses generate distinct IDs
    const overlap = idsA.filter((id) => idsB.includes(id))
    expect(overlap.length).toBe(0)
  })

  it('generates distinct IDs with generateBlockId', () => {
    const idSet = new Set<string>()
    for (let i = 0; i < 100; i++) {
      idSet.add(generateBlockId())
    }
    expect(idSet.size).toBe(100)
  })
})
