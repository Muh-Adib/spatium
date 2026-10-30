import { describe, it, expect } from 'vitest'
import {
  contentToBlocks,
  blocksToContent,
  extractTitleAndContentFromMarkdown,
  convertInlineMarkdown,
  convertMarkdownTablesToHtml,
  generateHeadingSlug,
  cleanHeadingText,
} from '../src/lib/articles/blockEditor'

const userChatGptMarkdown = `# Jasa Pembuatan Website Perusahaan
## Bangun Kredibilitas, Perluas Peluang Bisnis, dan Siapkan Fondasi Digital yang Tepat

> **Website perusahaan bukan sekadar brosur online.** Website yang dirancang dengan tepat membantu calon pelanggan memahami bisnis Anda, mengevaluasi layanan, dan mengambil langkah berikutnya dengan lebih percaya diri.

**Sedang mencari jasa pembuatan website perusahaan?** Pengembangan yang baik seharusnya tidak berhenti pada tampilan visual. Struktur informasi, pengalaman pengguna, performa, keamanan, SEO, dan kemudahan pemeliharaan perlu direncanakan sejak awal.

---

> **Ringkasan untuk pengambil keputusan**
>
> - **Tujuan:** membangun kredibilitas dan membantu calon pelanggan memahami layanan perusahaan.
> - **Fokus:** desain yang sesuai identitas brand, pengalaman pengguna, SEO teknis, dan performa.
> - **Fleksibilitas:** mulai dari company profile, landing page, katalog digital, hingga aplikasi web custom.
> - **Langkah pertama:** tentukan masalah bisnis yang ingin diselesaikan sebelum memilih fitur dan teknologi.

---

## Daftar Isi

1. [Mengapa perusahaan membutuhkan website profesional?](#mengapa-perusahaan-membutuhkan-website-profesional)
2. [Layanan pengembangan website](#layanan-pengembangan-website-sesuai-kebutuhan-bisnis)
3. [Hal yang perlu diperhatikan saat memilih developer](#apa-yang-perlu-diperhatikan-saat-memilih-jasa-pembuatan-website)
4. [Tahapan pengembangan website](#bagaimana-proses-pengembangan-website-perusahaan)
5. [Faktor yang menentukan biaya](#berapa-biaya-jasa-pembuatan-website-perusahaan)
6. [Website baru atau pengembangan ulang?](#website-baru-atau-pengembangan-ulang)
7. [FAQ](#pertanyaan-umum-faq)
8. [Konsultasi](#konsultasikan-kebutuhan-website-perusahaan-anda)

---

## Mengapa Perusahaan Membutuhkan Website Profesional?

Kebutuhan setiap perusahaan berbeda. Sebagian ingin memperkuat citra merek, sebagian ingin memperoleh lebih banyak prospek, dan sebagian lainnya membutuhkan sistem digital untuk mendukung operasional.

Website yang efektif berangkat dari kebutuhan tersebut—bukan semata-mata dari tren desain atau banyaknya fitur.

### 1. Meningkatkan kredibilitas perusahaan

Dalam transaksi bisnis, terutama **business-to-business (B2B)**, calon pelanggan biasanya membutuhkan informasi sebelum memutuskan untuk bekerja sama. Mereka ingin memahami profil perusahaan, pengalaman, layanan, cakupan pekerjaan, serta cara menghubungi tim Anda.

Website *company profile* dapat menyajikan informasi tersebut secara terstruktur, misalnya:

- Profil dan bidang usaha perusahaan.
- Layanan atau produk yang benar-benar ditawarkan.
- Portofolio proyek dan studi kasus.
- Sertifikasi atau pencapaian yang dapat diverifikasi.
- Informasi kontak dan jalur konsultasi.

Tujuannya bukan sekadar membuat perusahaan terlihat modern, tetapi membantu calon mitra memperoleh informasi yang relevan untuk mengambil keputusan.

### 2. Memperluas peluang ditemukan melalui Google

Website memberi perusahaan kendali lebih besar atas informasi yang dipublikasikan secara online. Dengan struktur halaman yang jelas, konten yang relevan, metadata yang tepat, dan fondasi teknis SEO yang baik, halaman website memiliki peluang untuk ditemukan oleh orang yang mencari layanan terkait.

Sebagai contoh, perusahaan konstruksi dapat membuat halaman khusus untuk layanan konstruksi gedung, renovasi komersial, atau pekerjaan infrastruktur—selama layanan tersebut memang tersedia.

> **Penting:** SEO bukan jaminan untuk langsung masuk halaman pertama Google. Hasil pencarian dipengaruhi oleh relevansi konten, persaingan, kondisi teknis, reputasi, dan faktor lain di luar kendali satu penyedia jasa.

### 3. Membantu tim sales menjelaskan layanan

Website dapat menjadi referensi bersama bagi tim sales saat menjelaskan layanan, tahapan pekerjaan, portofolio, pertanyaan umum, dan informasi pendukung lainnya.

Untuk bisnis B2B, halaman layanan yang spesifik dan studi kasus yang relevan membantu calon klien menilai apakah solusi perusahaan sesuai dengan kebutuhan mereka.

Agar pengunjung dapat mengambil langkah berikutnya, website bisa dilengkapi dengan:

- Formulir konsultasi.
- Permintaan penawaran.
- Tombol WhatsApp.
- Unduhan company profile atau katalog.
- Informasi proses kerja dan area layanan.

Fitur tersebut sebaiknya dipilih berdasarkan alur penjualan perusahaan, bukan ditambahkan hanya agar website terlihat lengkap.

### 4. Menyiapkan fondasi pertumbuhan digital

Website yang awalnya berfungsi sebagai company profile mungkin nantinya perlu mendukung katalog produk, portal pelanggan, sistem reservasi, dashboard, atau integrasi dengan aplikasi internal.

Karena itu, pengembangan perlu mempertimbangkan kebutuhan saat ini tanpa mengabaikan kemungkinan pengembangan berikutnya.

**Tidak semua perusahaan membutuhkan aplikasi kompleks sejak awal.** Arsitektur dan teknologi sebaiknya disesuaikan dengan kebutuhan nyata, anggaran, risiko, serta kemampuan pengelolaan perusahaan.

---

## Layanan Pengembangan Website Sesuai Kebutuhan Bisnis

Setiap jenis website memiliki tujuan dan ruang lingkup yang berbeda. Memahami perbedaannya membantu perusahaan memilih solusi yang tepat.

| Jenis layanan | Cocok untuk | Fokus utama |
|---|---|---|
| **Website company profile** | Perusahaan yang membutuhkan identitas digital resmi | Profil, layanan, portofolio, kredibilitas |
| **Landing page** | Kampanye pemasaran atau penawaran tertentu | Konversi dan pengumpulan prospek |
| **Website katalog** | Bisnis dengan banyak produk atau layanan | Penelusuran katalog dan permintaan penawaran |
| **Website dengan CMS** | Tim yang perlu memperbarui konten secara mandiri | Pengelolaan halaman dan artikel |
| **Aplikasi web custom** | Perusahaan dengan alur kerja atau kebutuhan data khusus | Dashboard, portal, workflow, integrasi |

### Website company profile

Website company profile cocok untuk perusahaan yang ingin membangun identitas digital resmi dan menyajikan informasi bisnis secara profesional.`

describe('Markdown & ChatGPT Format Import Engine', () => {
  it('extracts title and separates content cleanly from raw markdown with # Title', () => {
    const { title, content } = extractTitleAndContentFromMarkdown(userChatGptMarkdown)
    expect(title).toBe('Jasa Pembuatan Website Perusahaan')
    expect(content.startsWith('## Bangun Kredibilitas')).toBe(true)
  })

  it('converts user ChatGPT markdown directly into complete, well-formed blocks', () => {
    const blocks = contentToBlocks(userChatGptMarkdown)

    // Verify block count is substantial
    expect(blocks.length).toBeGreaterThanOrEqual(30)

    // Heading 2 checks (adjacent headings must not be concatenated!)
    const heading2Blocks = blocks.filter((b) => b.type === 'heading2')
    expect(heading2Blocks.length).toBeGreaterThanOrEqual(4)
    expect(heading2Blocks[0].type === 'heading2' && heading2Blocks[0].text).toBe('Jasa Pembuatan Website Perusahaan')
    expect(heading2Blocks[1].type === 'heading2' && heading2Blocks[1].text).toBe(
      'Bangun Kredibilitas, Perluas Peluang Bisnis, dan Siapkan Fondasi Digital yang Tepat'
    )
    expect(heading2Blocks.some((b) => b.type === 'heading2' && b.text === 'Daftar Isi')).toBe(true)
    expect(
      heading2Blocks.some((b) => b.type === 'heading2' && b.text.includes('Mengapa Perusahaan Membutuhkan'))
    ).toBe(true)

    // Heading 3 checks
    const heading3Blocks = blocks.filter((b) => b.type === 'heading3')
    expect(heading3Blocks.length).toBeGreaterThanOrEqual(5)
    expect(heading3Blocks.some((b) => b.type === 'heading3' && b.text.includes('Meningkatkan kredibilitas'))).toBe(true)
    expect(heading3Blocks.some((b) => b.type === 'heading3' && b.text.includes('Website company profile'))).toBe(true)

    // Markdown Table check -> converted to structured Notion-style TableBlock
    const tableBlock = blocks.find((b) => b.type === 'table')
    expect(tableBlock).toBeDefined()
    if (tableBlock && tableBlock.type === 'table') {
      expect(tableBlock.headers).toContain('Jenis layanan')
      expect(tableBlock.headers).toContain('Cocok untuk')
      expect(tableBlock.headers).toContain('Fokus utama')
      expect(tableBlock.rows.length).toBe(5)
      expect(tableBlock.rows[0][0]).toContain('Website company profile')
      expect(tableBlock.rows[4][0]).toContain('Aplikasi web custom')
    }

    // Blockquote checks
    const quoteBlocks = blocks.filter((b) => b.type === 'quote')
    expect(quoteBlocks.length).toBeGreaterThanOrEqual(2)
    const quote1 = quoteBlocks.find((b) => b.text.includes('bukan sekadar brosur online'))
    expect(quote1).toBeDefined()
    expect(quote1?.text).toContain('<strong>Website perusahaan bukan sekadar brosur online.</strong>')

    const seoQuote = quoteBlocks.find((b) => b.text.includes('SEO bukan jaminan'))
    expect(seoQuote).toBeDefined()
    expect(seoQuote?.text).toContain('<strong>Penting:</strong>')

    // Callout box with list check
    const calloutBlock = blocks.find((b) => b.type === 'html' && b.html.includes('article-callout'))
    expect(calloutBlock).toBeDefined()
    if (calloutBlock && calloutBlock.type === 'html') {
      expect(calloutBlock.html).toContain('Ringkasan untuk pengambil keputusan')
      expect(calloutBlock.html).toContain('Tujuan:')
    }

    // Ordered list check (Table of Contents with links)
    const tocList = blocks.find(
      (b) => b.type === 'list' && b.ordered && b.items.some((i) => i.includes('#mengapa-perusahaan-membutuhkan-website-profesional'))
    )
    expect(tocList).toBeDefined()
    if (tocList && tocList.type === 'list') {
      expect(tocList.items).toHaveLength(8)
      expect(tocList.items[0]).toContain('<a href="#mengapa-perusahaan-membutuhkan-website-profesional">')
    }

    // Unordered bullet list check
    const bulletList = blocks.find(
      (b) => b.type === 'list' && !b.ordered && b.items.some((i) => i.includes('Profil dan bidang usaha'))
    )
    expect(bulletList).toBeDefined()
    if (bulletList && bulletList.type === 'list') {
      expect(bulletList.items).toHaveLength(5)
    }

    // Paragraph inline formatting checks
    const b2bPara = blocks.find((b) => b.type === 'paragraph' && b.text.includes('business-to-business'))
    expect(b2bPara).toBeDefined()
    if (b2bPara && b2bPara.type === 'paragraph') {
      expect(b2bPara.text).toContain('<strong>business-to-business (B2B)</strong>')
    }

    const compProfPara = blocks.find((b) => b.type === 'paragraph' && b.text.includes('company profile'))
    expect(compProfPara).toBeDefined()
    if (compProfPara && compProfPara.type === 'paragraph') {
      expect(compProfPara.text).toContain('<em>company profile</em>')
    }

    // Dividers
    const dividerBlocks = blocks.filter((b) => b.type === 'divider')
    expect(dividerBlocks.length).toBeGreaterThanOrEqual(4)
  })

  it('performs bidirectional conversion (Markdown -> Blocks -> HTML -> Blocks) cleanly', () => {
    const blocks1 = contentToBlocks(userChatGptMarkdown)
    const html = blocksToContent(blocks1)
    const blocks2 = contentToBlocks(html)

    // Block count should remain stable across conversion
    expect(blocks2.length).toBe(blocks1.length)

    // Table block remains intact
    const tableBlock = blocks2.find((b) => b.type === 'table')
    expect(tableBlock).toBeDefined()

    // Quotes remain intact
    expect(blocks2.filter((b) => b.type === 'quote').length).toBe(blocks1.filter((b) => b.type === 'quote').length)
  })

  it('generates matching heading anchor slugs for TOC jump links and strips raw formatting', () => {
    const slug1 = generateHeadingSlug('Mengapa Perusahaan Membutuhkan Website Profesional?')
    expect(slug1).toBe('mengapa-perusahaan-membutuhkan-website-profesional')

    const slug2 = generateHeadingSlug('1. Meningkatkan kredibilitas perusahaan')
    expect(slug2).toBe('1-meningkatkan-kredibilitas-perusahaan')

    const cleaned1 = cleanHeadingText('**Subjudul Tebal** & <strong>Keren</strong>')
    expect(cleaned1).toBe('Subjudul Tebal & Keren')
  })

  it('outputs semantic heading tags with id attributes matching TOC anchors in blocksToContent', () => {
    const blocks = contentToBlocks(userChatGptMarkdown)
    const serializedHtml = blocksToContent(blocks)

    expect(serializedHtml).toContain('<h2 id="mengapa-perusahaan-membutuhkan-website-profesional">')
    expect(serializedHtml).toContain('<h3 id="1-meningkatkan-kredibilitas-perusahaan">')
  })

  it('properly serializes and parses internal-links block with custom title and link items', () => {
    const blocks = contentToBlocks(
      `Berikut adalah daftar tautan penting kami:\n\n<div class="article-internal-seo-links">\n<details><summary>Rekomendasi Layanan</summary><ul><li><a href="/layanan/web">Web Development</a></li><li><a href="/layanan/seo">SEO Specialist</a></li><li><a href="/layanan/cloud">Cloud Architecture</a></li><li><a href="/layanan/ai">AI Solutions</a></li><li><a href="/layanan/security">Cyber Security</a></li><li><a href="/layanan/mobile">Mobile Apps</a></li></ul></details></div>`
    )

    const internalLinksBlock = blocks.find((b) => b.type === 'internal-links')
    expect(internalLinksBlock).toBeDefined()
    if (internalLinksBlock && internalLinksBlock.type === 'internal-links') {
      expect(internalLinksBlock.links.length).toBe(6)
      expect(internalLinksBlock.links[0].href).toBe('/layanan/web')
      expect(internalLinksBlock.links[0].text).toBe('Web Development')
    }

    const htmlOutput = blocksToContent(blocks)
    expect(htmlOutput).toContain('related-links')
    expect(htmlOutput).toContain('Rekomendasi Layanan')
    expect(htmlOutput).toContain('Web Development')
    expect(htmlOutput).toContain('/layanan/web')

    // Bidirectional re-parse verification
    const reParsedBlocks = contentToBlocks(htmlOutput)
    const reParsedLinkBlock = reParsedBlocks.find((b) => b.type === 'internal-links')
    expect(reParsedLinkBlock).toBeDefined()
    expect(reParsedLinkBlock?.title).toBe('Rekomendasi Layanan')
    expect(reParsedLinkBlock?.links.length).toBe(6)
  })

  it('supports creating, serializing, and parsing Notion-style TableBlock with custom column widths', () => {
    const tableBlock = {
      id: 'table-test-1',
      type: 'table' as const,
      headers: ['Fitur Arsitektur', 'Next.js 16 App Router', 'Status'],
      rows: [
        ['Turbopack Support', 'Native Fast Refresh & Compile', 'Aktif'],
        ['SEO Canonical Engine', 'Automatic OpenGraph & JSON-LD', 'Lulus Audit'],
      ],
      columnWidths: [35, 45, 20],
    }

    const html = blocksToContent([tableBlock])
    expect(html).toContain('article-table-wrapper')
    expect(html).toContain('<col style="width: 35%" />')
    expect(html).toContain('<col style="width: 45%" />')
    expect(html).toContain('<col style="width: 20%" />')
    expect(html).toContain('Turbopack Support')

    const reParsed = contentToBlocks(html)
    const parsedTable = reParsed.find((b) => b.type === 'table')
    expect(parsedTable).toBeDefined()
    if (parsedTable && parsedTable.type === 'table') {
      expect(parsedTable.headers).toEqual(['Fitur Arsitektur', 'Next.js 16 App Router', 'Status'])
      expect(parsedTable.rows.length).toBe(2)
      expect(parsedTable.columnWidths).toEqual([35, 45, 20])
    }
  })
})
