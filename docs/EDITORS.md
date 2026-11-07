# Editor Studio

Studio punya dua editor dengan model data yang berbeda:

| | Editor artikel | Editor blok |
|---|---|---|
| Untuk | Artikel jurnal (`/journal/<slug>`) | Halaman dinamis (`/<slug>`), portofolio, layanan |
| Disimpan sebagai | HTML (`Article.content`) | JSON blok (`blocks`) |
| Dibuka dari | `/admin/buat-artikel` | Tab **Halaman** (`/admin?tab=pages&page=<id>`) dan manajer portofolio/layanan |
| Kode | `src/app/admin/buat-artikel/page.tsx`, `src/components/studio/editor/*`, `src/lib/articles/*` | `src/components/studio/blocks/*`, `src/components/studio/pages/*`, `src/blocks/*`, `src/lib/blocks/catalog.ts` |

## Editor artikel

Artikel ditulis sebagai rangkaian blok penulisan (paragraf, subjudul, gambar, video, kutipan, daftar, FAQ, kode, HTML, garis pemisah, tautan internal, tabel). Saat disimpan, blok diubah menjadi HTML (`blocksToContent`); saat dibuka, HTML dipecah lagi menjadi blok (`contentToBlocks`). Format HTML tersimpan tidak berubah dan dijaga oleh test.

- **State** dikelola satu reducer (`src/lib/articles/editorState.ts`). Baris blok di-memoize, jadi mengetik di satu blok hanya merender ulang blok itu.
- **Skor SEO** dihitung sekali, 300 ms setelah berhenti mengetik, lalu dipakai bersama oleh header dan panel SEO.
- **Slug** diisi otomatis dari judul (400 ms setelah berhenti mengetik) selama belum diubah manual.
- **Simpan lokal**: draft otomatis disimpan di browser dengan status "Tersimpan lokal · belum disimpan ke server". Saat dibuka lagi, editor menawarkan pulihkan atau buang.
- **Kunci editor**: hanya artikel yang sudah tersimpan yang dikunci (heartbeat tiap 25 detik), agar dua orang tidak menimpa satu sama lain. Kunci disimpan di memori proses — hilang saat restart dan tidak dibagi antar-instance.
- **Konflik**: setiap simpan mengirim `expectedUpdatedAt`; bila artikel diubah orang lain, editor menampilkan dialog konflik.
- **Gerbang publikasi**: sebelum terbit atau dijadwalkan, `checkPublicationGate` (`src/lib/seo/validation.ts`) memeriksa judul, slug, meta, dan alt text. Setiap masalah adalah tautan yang memfokuskan kolom terkait.
- **Menarik artikel terbit** kembali ke draft hanya bisa dilakukan role yang boleh menerbitkan (SUPER_ADMIN, CONTENT_ADMIN, EDITOR). REVIEWER tetap bisa mengembalikan artikel `in_review`/`approved` ke draft untuk revisi.
- **Penjadwalan**: artikel berstatus `scheduled` diterbitkan oleh penjadwal (`src/lib/publishing/scheduler.ts`, dijalankan dari `src/instrumentation.ts` tiap 30 detik). Artikel yang gagal gerbang dikembalikan ke draft dengan alasan di `scheduleError`.
- Di bawah 1024 px, panel Dokumen & SEO terbuka sebagai sheet samping.

### Pintasan (dialog "Pintasan" atau tombol `?`)

| Tombol | Aksi |
|---|---|
| Ctrl/⌘ + S | Simpan ke server tanpa mengubah status |
| Ctrl/⌘ + / | Buka/tutup panel Dokumen & SEO |
| Ctrl/⌘ + B / I | Tebal / miring pada teks terpilih |
| Ctrl/⌘ + K | Sisipkan tautan pada teks terpilih |
| ? | Daftar pintasan (di luar kolom teks) |
| Esc | Tutup dialog atau panel |

## Editor blok

Semua yang ditawarkan editor berasal dari katalog blok (`src/lib/blocks/catalog.ts`, lihat [BLOCKS.md](BLOCKS.md)): palet, isi awal blok baru, dan form properti. Form dibuat dari deskriptor field katalog, jadi tipe blok baru langsung bisa diedit tanpa menulis form.

- **Validasi langsung per blok**: masalah tampil di baris blok, di kolom yang bermasalah (`aria-invalid` + pesan), dan sebagai ringkasan "N masalah — tampilkan". Menyimpan dengan masalah menampilkan daftar yang bisa diklik menuju bloknya.
- **Pratinjau** memakai `BlockRenderer` yang sama dengan situs. Klik blok di pratinjau untuk memilihnya.
- **Tipe lama**: blok warisan tanpa entri katalog diedit lewat editor JSON (diterapkan saat keluar kolom) dengan label "Tipe lama".
- **Alias lama** (mis. `text` alih-alih `content`) tetap tampil di form dan disimpan dengan nama field kanonik.
- **Draft lokal** otomatis per halaman/rekaman, dengan pilihan pulihkan atau buang.
- **Riwayat undo** menggabungkan ketikan beruntun dan tidak menserialisasi seluruh halaman per ketikan.

### Pintasan (tombol keyboard di toolbar atau `?`)

| Tombol | Aksi |
|---|---|
| Ctrl/⌘ + K | Tambah blok (ketik untuk menyaring, ↑/↓, Enter, Esc) |
| Ctrl/⌘ + Z | Undo |
| Ctrl/⌘ + Shift + Z / Ctrl + Y | Redo |
| Ctrl/⌘ + S | Simpan |
| ↑ / ↓ / Home / End (di judul blok) | Pindah antar-blok |
| Alt + ↑ / ↓ | Pindahkan blok |
| Ctrl/⌘ + D | Duplikat blok |
| Delete | Hapus blok (bisa di-undo dari notifikasi) |

Urutan blok diubah dengan tombol atau keyboard (tidak ada drag-and-drop), sesuai WCAG 2.5.7.

## Halaman dinamis

Tab **Halaman** (`src/components/studio/pages/`) mengelola baris `Page` yang tayang di `/<slug>`.

- **Membuat**: judul → slug otomatis (bisa diubah). Slug yang bentrok dengan rute situs (`RESERVED_PAGE_SLUGS`) atau halaman lain ditolak.
- **Tab editor**: *Blok*, *Halaman & SEO* (meta title/description dengan penghitung, gambar OG + alt, robots), *Riwayat* (siapa mengubah apa dan kapan).
- **Status**: `draft` → `in_review` → `published` → `archived`. Daftar periksa publikasi menampilkan setiap syarat yang belum terpenuhi dengan tombol "Perbaiki". Menerbitkan, menarik, dan mengarsipkan hanya untuk SUPER_ADMIN dan CONTENT_ADMIN.
- **Ganti slug** pada halaman terbit otomatis membuat redirect 301 dari URL lama.
- **Pratinjau** versi tersimpan dalam status apa pun: `/admin/preview/page/<id>`.
- Klien MCP bisa membuat dan menyunting draft (lihat [MCP.md](MCP.md)); publikasi tetap di tangan editor.

API: `GET/POST /api/pages`, `GET/PATCH/DELETE /api/pages/:id`, `POST /api/pages/:id/status`, `GET /api/pages/:id/revisions`. Galat berbentuk `{ error, code?, issues?, blockIssues? }`: `not_found` 404, `conflict` / `slug_taken` 409, `invalid` / `gate` 422, `forbidden` 403.

## Katalog: portofolio, layanan, kategori layanan

Manajer di tab **Portofolio** dan **Layanan** memakai aturan yang sama (`src/lib/db/catalogMutations.ts`, skema di `src/lib/validation/api-schemas.ts`):

- **Item baru selalu draft.** Tidak ada lagi default `published`.
- **Gerbang publikasi** berjalan saat item disimpan sebagai `published`, terhadap data gabungan (yang tersimpan + yang dikirim): judul, slug, meta title & description, dan **alt text gambar sampul**. Galat 422 berisi `error` dan `issues` per kolom. Alt sampul disimpan di `seoData.coverAlt`.
  - Empat kategori layanan yang sudah terbit (filmmaking-vfx, marketing-branding, entertainment-installation, memory-documentary) belum punya alt sampul karena UI lama tidak menyimpannya; editor perlu mengisinya sekali sebelum bisa menyimpan ulang sebagai `published`.
- **Simpan berdasarkan ID**, bukan slug. Slug yang dipakai item lain → 409. Mengganti slug item terbit membuat redirect 301 dari URL lama.
- Pembaruan parsial: kolom yang tidak dikirim tetap. Tautan layanan ↔ portofolio dibaca dari database dan diganti di dalam transaksi (dulu menyunting layanan bisa menghapus semua tautannya).
- Setiap simpan/hapus menulis `ContentRevision` + `SeoAuditLog` dalam satu transaksi dan me-revalidate rute publik terkait serta `/sitemap.xml` (`revalidateCatalog`).
- Tidak ada angka, tech stack, tahun, atau alt text yang diisi otomatis (AGENTS.md §3.3).
- **Blok** divalidasi per target (`service-category`, `service`, `portfolio`) — tipe yang tidak ditawarkan untuk entri itu ditolak 422 dengan `issues` dan `blockIssues` (`{ index, blockId, type, message }`); gerbang publikasi juga memeriksanya. **Membuat entri tanpa blok** (tanpa `blocks`, `null`, atau `[]`) menyimpan preset entri (lihat [BLOCKS.md](BLOCKS.md#preset-srcblockspresetsts)). Manajer lama tetap bisa menyimpan blok lamanya; palet kategori sekarang memakai target `service-category`.
- Halaman publik: `/services/<kategori>`, `/services/<kategori>/<layanan>` (layanan dan kategori induk harus terbit; URL lama `/services/<layanan>` → 308), `/portfolio/<slug>`. Simpan me-revalidate halaman kategori, halaman layanan di bawah induknya, dan `/sitemap.xml`.

### Pratinjau entri (dan draf yang belum disimpan)

`/admin/preview/<type>/<id-atau-slug>` — `type`: `service-category` (alias `category`, `department`), `service`, `portfolio`. Halaman merender entri dalam status apa pun lewat **view yang sama dengan situs publik**. Server memeriksa kapabilitas `<entitas>:update` (`userWithCapability`, `src/lib/auth/server-component.ts`); tanpa izin → 404. Tidak ada yang disimpan dan halaman `noindex`.

Kontrak untuk editor (sematkan pratinjau sebagai `<iframe src="/admin/preview/service/12">` dari origin yang sama):

1. Iframe mengirim ke `window.parent`: `{ type: 'spatium:preview:ready', entity, id }` setelah siap menerima.
2. Editor mengirim ke iframe (`iframe.contentWindow.postMessage(msg, window.location.origin)`), setiap kali state berubah (sebaiknya di-debounce ±150 ms):
   ```ts
   {
     type: 'spatium:preview:draft',
     entity: 'service-category' | 'service' | 'portfolio',   // harus sama dengan type di URL
     id?: number | string,                                    // bila diisi harus sama dengan segmen URL
     blocks?: unknown[],   // daftar blok lengkap di editor; tanpa field = blok tersimpan; [] = preset
     fields?: {            // nilai belum disimpan, nama sama dengan body POST /api/<entitas>
       // service-category: title, tag, shortDescription, heroImage, themePreset, keyOutcomes, order, metaTitle, metaDescription, seoData
       // service: name, indexNumber, shortDescription, longDescription, description, heroImage, deliverables, technologies, metaTitle, metaDescription, seoData
       // portfolio: title, client, year, category, summary, challenge, approach, result, heroImage, liveUrl, metrics, technologies
     }
   }
   ```
   Skema: `previewDraftMessageSchema` + `DRAFT_FIELD_SCHEMAS` di `src/lib/content/entity-preview-model.ts`. Pesan dari origin lain atau bukan dari jendela induk diabaikan.
3. Iframe merender ulang (blok data-bound membaca entri yang sudah ditambal field draf; `resolveEntityBlocks` berlaku) lalu membalas `{ type: 'spatium:preview:applied', entity, id, blockIssues, fieldIssues, blockCount }`. Blok yang tidak valid untuk target dilewati dan dilaporkan di `blockIssues` (`{ index, blockId, type, message }`); field tak dikenal/salah bentuk dilaporkan di `fieldIssues` dan diabaikan.

Konteks (layanan turunan, portofolio terkait, use case lain) selalu data **terbit**, sama dengan yang akan tampil di situs. Untuk mengedit entri lama, muat `resolveEntityBlocks(target, blocks)` (MCP: `resolvedBlocks`) sebagai daftar awal editor — menyimpannya tidak mengubah tampilan.
- Hapus: SUPER_ADMIN dan CONTENT_ADMIN saja; item yang tidak ada → 404.

## Media, logo klien, CTA

- **Media**: unggah, ubah metadata, ganti nama, dan hapus untuk SUPER_ADMIN, CONTENT_ADMIN, EDITOR, MEDIA_MANAGER. AUTHOR hanya bisa mengunggah gambar lewat editor artikel (`/api/upload`). Gambar dari pemilih media dan editor artikel langsung tercatat di pustaka dengan nama pengunggah. Ganti nama tidak boleh mengubah ekstensi, membuat redirect, dan memperbarui referensi dalam satu transaksi.
- **Logo klien**: tampil di strip mitra beranda; perubahan me-revalidate `/`.
- **Preset CTA**: buat/ubah untuk SUPER_ADMIN, CONTENT_ADMIN, EDITOR; hapus (`DELETE /api/cta?id=<id>`) untuk SUPER_ADMIN dan CONTENT_ADMIN. Slug bentrok → 409. Preset belum dirender di halaman publik mana pun.

## Pengaturan situs

Tab **Pengaturan** hanya menampilkan kolom yang benar-benar tersimpan di `site_configs`: nama, tagline, URL produksi, deskripsi, logo, favicon, kontak publik, dan akun sosial (Instagram, LinkedIn, YouTube, TikTok, Facebook, X, Vimeo, Behance — URL `https://` lengkap). Kolom kosong disembunyikan di situs.

**Kontak publik** adalah satu-satunya sumber kontak di situs — tidak ada nilai dari env atau bawaan:

| Kolom | Tampil di |
|---|---|
| Email publik | Footer, menu mobile, halaman kontak, tombol "Send by email" formulir brief, blok `studio-cta`, JSON-LD |
| Telepon | Footer, halaman kontak (tautan `tel:`), JSON-LD |
| Nomor WhatsApp + pesan awal | Footer, halaman kontak, tombol WhatsApp blok `studio-cta`, tombol "Kirim via WhatsApp" formulir brief; blok `hero-service` memakai nomornya dengan pesan dari kolom `whatsappPrompt` blok |
| Alamat | Footer, halaman kontak, JSON-LD |
| Jam operasional | Footer, halaman kontak |

- Nomor WhatsApp dinormalisasi ke format E.164 tanpa `+` (`+62 812-3456-7890` → `6281234567890`; awalan `0` dibaca sebagai `+62`). Nomor di luar 8–15 digit ditolak. Tautan: `https://wa.me/<nomor>?text=<pesan awal>`, dibuka di tab baru.
- Kosongkan nomor WhatsApp untuk menyembunyikan semua tombol WhatsApp; blok `studio-cta` lalu menautkan ke `/contact`.

- Hanya SUPER_ADMIN dan CONTENT_ADMIN yang bisa menyimpan; role lain melihat mode baca.
- Simpan bersifat parsial: kolom yang dikelola di tempat lain tidak ikut terhapus.
- Galat tampil inline per kolom, fokus pindah ke kolom pertama yang salah.
- Simpan me-revalidate layout (semua halaman), `/contact`, `/about`, halaman layanan/portofolio/halaman dinamis, dan `/sitemap.xml`.
- Tombol **Perbarui cache halaman publik** me-revalidate `/` dan `/sitemap.xml` dan melaporkan hasil sebenarnya.

## Redirect

Tab **Redirect** menerima path di situs ini saja (`/lama` → `/baru`). URL luar, `//host`, dan loop (termasuk A→B saat B→A) ditolak dengan pesan yang jelas. Membuat/mengubah: SUPER_ADMIN, CONTENT_ADMIN, SEO_MANAGER, EDITOR; menghapus: SUPER_ADMIN, CONTENT_ADMIN.

## Alat SEO

Audit situs, PageSpeed, pengindeksan ulang, IndexNow, dan keyword untuk SUPER_ADMIN, CONTENT_ADMIN, EDITOR, SEO_MANAGER; sinkronisasi Search Console untuk SUPER_ADMIN, CONTENT_ADMIN, SEO_MANAGER. Crawler dan PageSpeed hanya ke situs sendiri. Tanpa kredensial (GSC, PageSpeed), tab menampilkan status "belum terhubung" tanpa angka.

## Celah yang diketahui

- Kunci editor artikel belum disimpan di database (lihat di atas).
- Riwayat halaman belum punya tombol pulihkan versi.
- Pustaka template blok lama (`/api/templates`) tidak lagi dipakai editor.
