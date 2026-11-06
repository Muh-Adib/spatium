# Editor Studio

Studio punya dua editor dengan model data yang berbeda:

| | Editor artikel | Editor blok |
|---|---|---|
| Untuk | Artikel jurnal (`/journal/<slug>`) | Halaman dinamis (`/<slug>`), portofolio, layanan, solusi |
| Disimpan sebagai | HTML (`Article.content`) | JSON blok (`blocks`) |
| Dibuka dari | `/admin/buat-artikel` | Tab **Halaman** (`/admin?tab=pages&page=<id>`) dan manajer portofolio/layanan/solusi |
| Kode | `src/app/admin/buat-artikel/page.tsx`, `src/components/studio/editor/*`, `src/lib/articles/*` | `src/components/studio/blocks/*`, `src/components/studio/pages/*`, `src/lib/blocks/catalog.ts` |

## Editor artikel

Artikel ditulis sebagai rangkaian blok penulisan (paragraf, subjudul, gambar, video, kutipan, daftar, FAQ, kode, HTML, garis pemisah, tautan internal, tabel). Saat disimpan, blok diubah menjadi HTML (`blocksToContent`); saat dibuka, HTML dipecah lagi menjadi blok (`contentToBlocks`). Format HTML tersimpan tidak berubah dan dijaga oleh test.

- **State** dikelola satu reducer (`src/lib/articles/editorState.ts`). Baris blok di-memoize, jadi mengetik di satu blok hanya merender ulang blok itu.
- **Skor SEO** dihitung sekali, 300 ms setelah berhenti mengetik, lalu dipakai bersama oleh header dan panel SEO.
- **Slug** diisi otomatis dari judul (400 ms setelah berhenti mengetik) selama belum diubah manual.
- **Simpan lokal**: draft otomatis disimpan di browser dengan status "Tersimpan lokal · belum disimpan ke server". Saat dibuka lagi, editor menawarkan pulihkan atau buang.
- **Kunci editor**: hanya artikel yang sudah tersimpan yang dikunci (heartbeat tiap 25 detik), agar dua orang tidak menimpa satu sama lain. Kunci disimpan di memori proses — hilang saat restart dan tidak dibagi antar-instance.
- **Konflik**: setiap simpan mengirim `expectedUpdatedAt`; bila artikel diubah orang lain, editor menampilkan dialog konflik.
- **Gerbang publikasi**: sebelum terbit atau dijadwalkan, `checkPublicationGate` (`src/lib/seo/validation.ts`) memeriksa judul, slug, meta, dan alt text. Setiap masalah adalah tautan yang memfokuskan kolom terkait.
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

## Celah yang diketahui

- Kunci editor artikel belum disimpan di database (lihat di atas).
- Riwayat halaman belum punya tombol pulihkan versi.
- Pustaka template blok lama (`/api/templates`) tidak lagi dipakai editor.
