import { describe, it, expect } from 'vitest'
import {
  contentToBlocks,
  blocksToContent,
  ContentBlock,
} from '../src/lib/articles/blockEditor'

describe('Bidirectional Conversion (Blocks <-> HTML)', () => {
  it('converts blocks to html and back without data loss', () => {
    const originalBlocks: ContentBlock[] = [
      { id: 'b1', type: 'heading2', text: 'Judul Bagian Utama' },
      {
        id: 'b2',
        type: 'paragraph',
        text: 'Ini adalah paragraf penjelasan dengan teks <strong>tebal</strong>, <em>miring</em>, <u>garis bawah</u>, dan <a href="https://example.com/panduan">link referensi</a>.',
      },
      { id: 'b3', type: 'heading3', text: 'Sub Bagian Teknis' },
      {
        id: 'b4',
        type: 'quote',
        text: 'Kecepatan dan integritas data adalah kunci keberhasilan sistem.',
        author: 'Budi Santoso',
      },
      {
        id: 'b5',
        type: 'list',
        items: ['Poin pertama yang jelas', 'Poin kedua dengan <a href="/layanan">tautan</a>', 'Poin ketiga'],
        ordered: false,
      },
      {
        id: 'b6',
        type: 'list',
        items: ['Langkah 1: Analisis', 'Langkah 2: Eksekusi', 'Langkah 3: Evaluasi'],
        ordered: true,
      },
      {
        id: 'b7',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        alt: 'Kode program di layar',
        caption: 'Ilustrasi arsitektur sistem modern',
        alignment: 'center',
      },
      {
        id: 'b8',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Video Panduan',
        embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      },
      {
        id: 'b9',
        type: 'faq',
        question: 'Mengapa memilih arsitektur berbasis Next.js?',
        answer: 'Karena memberikan performa maksimal dengan server-side rendering dan SEO yang superior.',
      },
      {
        id: 'b10',
        type: 'code',
        code: 'const result = await fetch("/api/data");\nconsole.log(result);',
        language: 'javascript',
      },
      { id: 'b11', type: 'divider' },
    ]

    // Step 1: Blocks -> HTML
    const html1 = blocksToContent(originalBlocks)

    // Step 2: HTML -> Blocks
    const blocks1 = contentToBlocks(html1)

    // Step 3: Blocks -> HTML again
    const html2 = blocksToContent(blocks1)

    // Step 4: HTML -> Blocks again
    const blocks2 = contentToBlocks(html2)

    // Verify preservation
    console.log('--- HTML 1 ---')
    console.log(html1)
    console.log('--- BLOCKS 1 ---')
    console.log(JSON.stringify(blocks1, null, 2))
    console.log('--- HTML 2 ---')
    console.log(html2)

    // Check count
    expect(blocks1.length).toBe(originalBlocks.length)
    expect(blocks2.length).toBe(originalBlocks.length)

    // Check heading2
    expect(blocks1[0].type).toBe('heading2')
    expect((blocks1[0] as any).text).toBe('Judul Bagian Utama')

    // Check paragraph formatting
    expect(blocks1[1].type).toBe('paragraph')
    expect((blocks1[1] as any).text).toContain('<strong>tebal</strong>')
    expect((blocks1[1] as any).text).toContain('<em>miring</em>')
    expect((blocks1[1] as any).text).toContain('<u>garis bawah</u>')
    expect((blocks1[1] as any).text).toContain('<a href="https://example.com/panduan">link referensi</a>')

    // Check quote & author
    expect(blocks1[3].type).toBe('quote')
    expect((blocks1[3] as any).text).toBe('Kecepatan dan integritas data adalah kunci keberhasilan sistem.')
    expect((blocks1[3] as any).author).toBe('Budi Santoso')

    // Check unordered list
    expect(blocks1[4].type).toBe('list')
    expect((blocks1[4] as any).ordered).toBe(false)
    expect((blocks1[4] as any).items).toHaveLength(3)
    expect((blocks1[4] as any).items[1]).toContain('<a href="/layanan">tautan</a>')

    // Check ordered list
    expect(blocks1[5].type).toBe('list')
    expect((blocks1[5] as any).ordered).toBe(true)
    expect((blocks1[5] as any).items).toHaveLength(3)

    // Check image
    expect(blocks1[6].type).toBe('image')
    expect((blocks1[6] as any).url).toBe('https://images.unsplash.com/photo-1555066931-4365d14bab8c')
    expect((blocks1[6] as any).alt).toBe('Kode program di layar')
    expect((blocks1[6] as any).caption).toBe('Ilustrasi arsitektur sistem modern')

    // Check video
    expect(blocks1[7].type).toBe('video')
    expect((blocks1[7] as any).embedUrl).toContain('youtube-nocookie.com/embed')

    // Check faq
    expect(blocks1[8].type).toBe('faq')
    expect((blocks1[8] as any).question).toBe('Mengapa memilih arsitektur berbasis Next.js?')
    expect((blocks1[8] as any).answer).toBe('Karena memberikan performa maksimal dengan server-side rendering dan SEO yang superior.')

    // Check code
    expect(blocks1[9].type).toBe('code')
    expect((blocks1[9] as any).language).toBe('javascript')
    expect((blocks1[9] as any).code).toContain('const result = await fetch')

    // Check HTML idempotency
    expect(html2).toBe(html1)
  })

  it('supports seamless multi-cycle bidirectional editing between raw HTML and visual blocks', () => {
    // 1. User starts by pasting raw HTML
    const initialHtml = `
      <h2>Latar Belakang Proyek</h2>
      <p>Sistem ini dirancang untuk ketahanan dan kecepatan tinggi.</p>
      <blockquote><p>&ldquo;Inovasi adalah diferensiasi utama.&rdquo;</p><cite>— Tim Segia</cite></blockquote>
    `.trim()

    // 2. Convert to blocks
    let blocks = contentToBlocks(initialHtml)
    expect(blocks).toHaveLength(3)
    expect(blocks[0].type).toBe('heading2')
    expect(blocks[1].type).toBe('paragraph')
    expect(blocks[2].type).toBe('quote')

    // 3. User edits blocks in visual canvas: modifies paragraph and adds a list block
    blocks[1] = {
      id: blocks[1].id,
      type: 'paragraph',
      text: 'Sistem ini dirancang untuk ketahanan dan kecepatan tinggi dengan <strong>Next.js 16</strong>.',
    }
    blocks.push({
      id: 'new-list-1',
      type: 'list',
      items: ['Fitur A', 'Fitur B'],
      ordered: false,
    })

    // 4. Switch to Raw HTML: user sees updated HTML with the block changes
    let rawHtml = blocksToContent(blocks)
    expect(rawHtml).toContain('<strong>Next.js 16</strong>')
    expect(rawHtml).toContain('<ul><li>Fitur A</li><li>Fitur B</li></ul>')

    // 5. User edits Raw HTML directly: appends a new FAQ section
    rawHtml += '\n\n<div class="faq-item my-4 p-4 rounded-xl border border-sky-400/20 bg-sky-950/20"><h4>Berapa SLA sistem?</h4><p>SLA ketersediaan sistem mencapai 99.9%.</p></div>'

    // 6. User switches back to visual blocks: all edits preserved + new FAQ is a block
    blocks = contentToBlocks(rawHtml)
    expect(blocks).toHaveLength(5)
    expect(blocks[0].type).toBe('heading2')
    expect(blocks[1].type).toBe('paragraph')
    expect((blocks[1] as any).text).toContain('<strong>Next.js 16</strong>')
    expect(blocks[2].type).toBe('quote')
    expect((blocks[2] as any).author).toBe('Tim Segia')
    expect(blocks[3].type).toBe('list')
    expect((blocks[3] as any).items).toEqual(['Fitur A', 'Fitur B'])
    expect(blocks[4].type).toBe('faq')
    expect((blocks[4] as any).question).toBe('Berapa SLA sistem?')
    expect((blocks[4] as any).answer).toBe('SLA ketersediaan sistem mencapai 99.9%.')

    // 7. User switches to Raw HTML again
    const finalHtml = blocksToContent(blocks)
    expect(finalHtml).toContain('Berapa SLA sistem?')
    expect(finalHtml).toContain('<strong>Next.js 16</strong>')
    expect(finalHtml).toContain('— Tim Segia')
  })
})
