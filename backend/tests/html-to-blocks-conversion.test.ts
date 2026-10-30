import { describe, it, expect } from 'vitest'
import { contentToBlocks, blocksToContent } from '../src/lib/articles/blockEditor'

describe('HTML to Blocks conversion preservation', () => {
  it('converts div-wrapped paragraphs and headings into structured blocks without losing content', () => {
    const html = `
      <div class="elementor-widget-container">
        <h1>Panduan Next.js 16</h1>
        <p>Paragraf pertama dengan penjelasan mendalam.</p>
        <h2>Keunggulan Arsitektur</h2>
        <p>Paragraf kedua menjelaskan server components.</p>
        <blockquote>Performa tinggi adalah prioritas.</blockquote>
        <ul>
          <li>Turbopack cepat</li>
          <li>Prisma ORM tangguh</li>
        </ul>
      </div>
    `
    const blocks = contentToBlocks(html)

    expect(blocks.length).toBeGreaterThanOrEqual(5)

    const heading2 = blocks.filter((b) => b.type === 'heading2')
    expect(heading2.length).toBe(2) // h1 and h2 both mapped to heading2
    expect(heading2[0].type === 'heading2' && heading2[0].text).toContain('Panduan Next.js 16')
    expect(heading2[1].type === 'heading2' && heading2[1].text).toContain('Keunggulan Arsitektur')

    const paragraphs = blocks.filter((b) => b.type === 'paragraph')
    expect(paragraphs.length).toBe(2)
    expect(paragraphs[0].type === 'paragraph' && paragraphs[0].text).toContain('Paragraf pertama')
    expect(paragraphs[1].type === 'paragraph' && paragraphs[1].text).toContain('Paragraf kedua')

    const quote = blocks.find((b) => b.type === 'quote')
    expect(quote).toBeDefined()
    expect(quote && quote.type === 'quote' && quote.text).toContain('Performa tinggi adalah prioritas')

    const list = blocks.find((b) => b.type === 'list')
    expect(list).toBeDefined()
    expect(list && list.type === 'list' && list.items.length).toBe(2)
  })

  it('converts clean raw paragraphs with links into paragraph blocks intact', () => {
    const html = '<p>Kunjungi <a href="/layanan">Katalog Layanan</a> untuk info lebih lanjut.</p><p>Hubungi tim kami segera.</p>'
    const blocks = contentToBlocks(html)

    expect(blocks).toHaveLength(2)
    expect(blocks[0].type).toBe('paragraph')
    expect((blocks[0] as any).text).toContain('<a href="/layanan">Katalog Layanan</a>')
    expect((blocks[1] as any).text).toBe('Hubungi tim kami segera.')
  })

  it('converts WordPress Gutenberg comments HTML to clean blocks', () => {
    const html = `
      <!-- wp:heading {"level":2} -->
      <h2>Arsitektur Baru SegiaTech</h2>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Menggunakan Next.js 16 dan PostgreSQL.</p>
      <!-- /wp:paragraph -->
    `
    const blocks = contentToBlocks(html)
    expect(blocks.length).toBe(2)
    expect(blocks[0].type).toBe('heading2')
    expect((blocks[0] as any).text).toBe('Arsitektur Baru SegiaTech')
    expect(blocks[1].type).toBe('paragraph')
    expect((blocks[1] as any).text).toBe('Menggunakan Next.js 16 dan PostgreSQL.')
  })

  it('converts video iframes and images properly', () => {
    const html = `
      <figure class="wp-block-image"><img src="https://example.com/banner.jpg" alt="Banner Alt" /><figcaption>Caption banner</figcaption></figure>
      <iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Video Contoh"></iframe>
    `
    const blocks = contentToBlocks(html)
    expect(blocks.length).toBe(2)
    expect(blocks[0].type).toBe('image')
    expect((blocks[0] as any).url).toBe('https://example.com/banner.jpg')
    expect((blocks[0] as any).alt).toBe('Banner Alt')

    expect(blocks[1].type).toBe('video')
    expect((blocks[1] as any).embedUrl).toContain('youtube-nocookie.com/embed')
  })

  it('converts complete WordPress Gutenberg article with gallery, buttons, and multi-column internal links cleanly', () => {
    const wpArticleHtml = `
<h2 class="wp-block-heading">Kelola Website Portal Berita dan Media</h2>

<p>Kelola Website Portal Berita dan Media &#8211; Segia Tech Solusinya ! Dalam industri <strong>portal berita dan media</strong>, setiap detik adalah krusial. Website Anda adalah pabrik berita yang beroperasi 24/7. Kinerja yang lambat atau <em>downtime</em> bukan hanya merusak reputasi, tetapi juga menyebabkan kerugian finansial langsung dari monetisasi iklan dan hilangnya pembaca. Mengelola platform yang harus menghadapi jutaan <em>pageviews</em> dan <em>traffic</em> yang tak terduga (terutama saat <em>breaking news</em>) membutuhkan spesialisasi. <strong>Segia Tech</strong> adalah mitra yang menjamin website media Anda selalu cepat, aman dari peretasan, dan siap menghadapi lonjakan <em>traffic</em> apa pun.</p>

<h3 class="wp-block-heading">Mengapa Website Media Butuh Kecepatan dan Stabilitas Ekstra?</h3>

<p>Website media massa memiliki tekanan teknis yang unik dan lebih tinggi dibandingkan sektor lainnya. Profesionalisme dalam pengelolaan sangat menentukan kelangsungan bisnis:</p>

<ul class="wp-block-list">
<li><strong>Traffic Tinggi Secara Mendadak:</strong> Website harus mampu <em>scale up</em> secara instan saat terjadi <em>breaking news</em>. Kegagalan server saat momen puncak adalah kegagalan bisnis.</li>
<li><strong>Monetisasi Iklan dan Revenue:</strong> Kecepatan <em>loading</em> sangat memengaruhi <em>Ad Impressions</em> and <em>viewability</em>. Website yang lambat secara langsung mengurangi pendapatan iklan Anda.</li>
<li><strong>Keamanan Berita &amp; Kredibilitas:</strong> Portal berita sering menjadi target serangan siber (DDoS, <em>defacement</em>). Keamanan harus berlapis untuk melindungi kredibilitas dan integritas konten yang Anda sampaikan.</li>
<li><strong>Kecepatan Publikasi Konten:</strong> Editor membutuhkan sistem yang mulus dan cepat untuk mempublikasikan berita secara <em>real-time</em> agar tidak kalah cepat dari kompetitor.</li>
</ul>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-36 is-layout-flex wp-block-gallery-is-layout-flex">
<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1024" height="576" data-id="3995" src="/uploads/articles/cover-seo-segia-62-1-1024x576.webp" alt="Kelola website portal berita dan media Anda dengan Segia Tech. Dapatkan jaminan stabilitas traffic tinggi, kecepatan loading super cepat." class="wp-image-3995" srcset="https://www.segiatech.com/wp-content/uploads/2025/09/Cover-SEO-SEGIA-62-1-1024x576.webp 1024w, https://www.segiatech.com/wp-content/uploads/2025/09/Cover-SEO-SEGIA-62-1-300x169.webp 300w, https://www.segiatech.com/wp-content/uploads/2025/09/Cover-SEO-SEGIA-62-1-768x432.webp 768w, https://www.segiatech.com/wp-content/uploads/2025/09/Cover-SEO-SEGIA-62-1-1536x864.webp 1536w, https://www.segiatech.com/wp-content/uploads/2025/09/Cover-SEO-SEGIA-62-1.webp 1920w" sizes="(max-width: 1024px) 100vw, 1024px" /></figure>
</figure>

<div class="wp-block-buttons is-content-justification-center is-layout-flex wp-container-core-buttons-is-layout-24 wp-block-buttons-is-layout-flex">
<div class="wp-block-button is-style-outline is-style-outline--37"><a class="wp-block-button__link has-white-color has-luminous-vivid-amber-background-color has-text-color has-background has-link-color has-text-align-center wp-element-button" href="https://wa.me/6283121138821?text=Halo%20Segiatech%20ini%20pesan%20melalui%20website">Konsultasi sekarang<gwmw style="display:none;"></gwmw></a></div>
</div>

<h3 class="wp-block-heading">Segia Tech: Jaminan Uptime dan Kecepatan untuk Media Anda</h3>

<p><strong>Segia Tech</strong> memahami bahwa bisnis media berada dalam perlombaan waktu. Layanan kami dirancang untuk mendukung operasional yang gesit dan berkapasitas besar:</p>

<ul class="wp-block-list">
<li><strong>Solusi Skalabilitas Tinggi:</strong> Kami menerapkan teknologi CDN (<em>Content Delivery Network</em>) dan <em>load balancing</em> canggih untuk memastikan konten Anda terkirim cepat ke pembaca di mana pun mereka berada dan mampu menangani <em>traffic</em> yang masif.</li>
<li><strong>Fokus pada <em>Low Latency</em>:</strong> Kami mengoptimalkan setiap aspek teknis website untuk memastikan waktu <em>loading</em> yang super cepat, yang secara langsung meningkatkan <em>engagement</em> pembaca dan pendapatan iklan (Ad Revenue).</li>
<li><strong>Keamanan Anti-Defacement:</strong> Kami menyediakan protokol keamanan proaktif (WAF, monitoring) untuk melindungi konten dan <em>database</em> Anda dari serangan siber yang merusak reputasi.</li>
</ul>

<h3 class="wp-block-heading">Layanan Kunci Kelola Website Portal Berita dari Segia Tech</h3>

<p>Pilih <strong>Segia Tech</strong> untuk layanan <em>maintenance</em> yang menjamin website media Anda selalu berada di puncak performa:</p>

<ul class="wp-block-list">
<li><strong>Optimasi CDN &amp; Load Balancing:</strong> Pengaturan infrastruktur yang memastikan konten dimuat cepat dan stabil di tengah <em>traffic</em> tinggi.</li>
<li><strong>Maintenance Platform Publikasi:</strong> Pemeliharaan platform CMS (Content Management System) khusus media agar proses <em>publishing</em> berita berjalan instan tanpa <em>error</em>.</li>
<li><strong>Keamanan Siber Proaktif 24/7:</strong> Pemantauan ancaman dan perlindungan terhadap serangan DDoS, serta <em>patching</em> keamanan kritis.</li>
<li><strong>Optimasi Kecepatan Monetisasi:</strong> Penyesuaian teknis untuk memastikan <em>ad scripts</em> dan <em>tracking tools</em> tidak menghambat kecepatan <em>loading</em> utama website.</li>
<li><strong>Dukungan Teknis Prioritas 24/7:</strong> Tim <em>support</em> yang siap siaga setiap saat, sangat penting untuk organisasi berita yang tidak pernah tidur.</li>
</ul>

<p>Jangan biarkan website menjadi kendala. Jadikan ia sebagai mesin yang <em>powerful</em> untuk mendistribusikan informasi. Percayakan <strong>kelola website portal berita dan media</strong> Anda kepada <strong>Segia Tech</strong> dan fokuslah pada penyampaian berita yang cepat dan akurat.</p>

<p><strong>Mau Buat Website Profesional? SEGIA TECH Siap Bantu!</strong></p>

<p>Jadi,&nbsp;<strong>SEGIA TECH</strong>&nbsp;hadir untuk bantu kamu buat website yang keren, fungsional, dan siap bersaing di era digital. Tim kami siap mendampingi kamu dari awal perencanaan sampai website kamu resmi live di internet.<gwmw style="display:none;"></gwmw></p>

<p>Bahkan, kami menyediakan layanan all-in-one mulai dari domain, hosting, desain, coding, SEO, hingga maintenance</p>

<p>Telepon:&nbsp;<a href="https://wa.me/6283121138821?text=Halo%20Segiatech%20ini%20pesan%20melalui%20website">+62 831-2113-8821</a><br>Email:&nbsp;<a class="">info@segiatech.com</a><gwmw style="display:none;"></gwmw><gwmw style="display:none;"></gwmw></p>

<p>💡 Yuk, manfaatkan website untuk memperkuat brand dan meningkatkan penjualan!<br>🚀 Wujudkan website impian kamu bareng SEGIA TECH. Kontak kami sekarang juga dan mulai proyek kamu hari ini!<gwmw style="display:none;"></gwmw><gwmw style="display:none;"></gwmw></p>

<p><a href="https://wa.me/6283121138821?text=Halo%20Segiatech%20ini%20pesan%20melalui%20website">Konsultasi sekarang</a><gwmw style="display: none; background-color: transparent;"></gwmw><gwmw style="display:none;"></gwmw><gwmw style="display:none;"></gwmw></p>

<div class="wp-block-buttons is-content-justification-center is-layout-flex wp-container-core-buttons-is-layout-25 wp-block-buttons-is-layout-flex">
<div class="wp-block-button is-style-outline is-style-outline--38"><a class="wp-block-button__link has-white-color has-luminous-vivid-amber-background-color has-text-color has-background has-link-color has-text-align-center wp-element-button" href="https://wa.me/6283121138821?text=Halo%20Segiatech%20ini%20pesan%20melalui%20website">Konsultasi sekarang<gwmw style="display:none;"></gwmw></a></div>
</div>

<div class="wp-block-columns is-layout-flex wp-container-core-columns-is-layout-13 wp-block-columns-is-layout-flex">
<div class="wp-block-column is-layout-flow wp-block-column-is-layout-flow">
<ul class="wp-block-list">
<li><a href="https://www.segiatech.com/jasa-website/">Web</a></li>
<li><a href="https://www.segiatech.com/jasa-website-jakarta/">Web Jakarta</a></li>
<li><a href="https://www.segiatech.com/jasa-website-surabaya/">Web Surabaya</a></li>
</ul>
</div>
<div class="wp-block-column is-layout-flow wp-block-column-is-layout-flow">
<ul class="wp-block-list">
<li><a href="https://www.segiatech.com/jasa-pembuatan-website-ekspor-impor/">Web Exim Surabaya</a></li>
<li><a href="https://www.segiatech.com/jasa-perbaikan-website-surabaya/">Perbaikan Web Surabaya</a><gwmw style="display:none;"></gwmw></li>
<li><a href="https://www.segiatech.com/jasa-desain-website-surabaya/">Desain Web Surabaya</a></li>
</ul>
</div>
<div class="wp-block-column is-layout-flow wp-block-column-is-layout-flow">
<ul class="wp-block-list">
<li><a href="https://www.segiatech.com/buat-website-profesional/"> Website </a></li>
<li><a href="https://www.segiatech.com/buat-website-jakarta/">Web Jakarta</a></li>
<li><a href="https://www.segiatech.com/buat-website-surabaya/">Web Surabaya</a></li>
</ul>
</div>
</div>

<p><gwmw style="display:none;"></gwmw></p>
    `

    const blocks = contentToBlocks(wpArticleHtml)

    // Verify it didn't collapse into a single html block
    expect(blocks.length).toBeGreaterThanOrEqual(15)

    // Heading 2
    const h2Blocks = blocks.filter((b) => b.type === 'heading2')
    expect(h2Blocks.length).toBe(1)
    expect((h2Blocks[0] as any).text).toBe('Kelola Website Portal Berita dan Media')

    // Heading 3
    const h3Blocks = blocks.filter((b) => b.type === 'heading3')
    expect(h3Blocks.length).toBe(3)
    expect((h3Blocks[0] as any).text).toBe('Menggunakan Next.js' ? 'Mengapa Website Media Butuh Kecepatan dan Stabilitas Ekstra?' : '')
    expect((h3Blocks[1] as any).text).toBe('Segia Tech: Jaminan Uptime dan Kecepatan untuk Media Anda')
    expect((h3Blocks[2] as any).text).toBe('Layanan Kunci Kelola Website Portal Berita dari Segia Tech')

    // Gallery Image Block
    const imgBlocks = blocks.filter((b) => b.type === 'image')
    expect(imgBlocks.length).toBeGreaterThanOrEqual(1)
    expect((imgBlocks[0] as any).url).toBe('/uploads/articles/cover-seo-segia-62-1-1024x576.webp')
    expect((imgBlocks[0] as any).alt).toContain('Kelola website portal berita dan media Anda dengan Segia Tech')

    // Lists
    const listBlocks = blocks.filter((b) => b.type === 'list')
    expect(listBlocks.length).toBe(3)
    expect((listBlocks[0] as any).items.length).toBe(4)
    expect((listBlocks[0] as any).items[0]).toContain('Traffic Tinggi Secara Mendadak')

    // Internal links extracted from 3-column Gutenberg block
    const internalLinksBlock = blocks.find((b) => b.type === 'internal-links')
    expect(internalLinksBlock).toBeDefined()
    expect((internalLinksBlock as any).links.length).toBeGreaterThanOrEqual(6)

    // Junk removal: no gwmw tag remains anywhere in blocks
    const serialized = blocksToContent(blocks)
    expect(serialized).not.toContain('<gwmw')
    expect(serialized).not.toContain('&#8211;')
    expect(serialized).toContain('–') // en-dash decoded
  })
})
