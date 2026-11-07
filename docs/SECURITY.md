# Model keamanan

## Lapisan

1. **`src/proxy.ts`** (Next 16 proxy, tidak ada `middleware.ts`):
   - `/admin/**` tanpa sesi → `/pawon`.
   - `/api/**` membutuhkan sesi JWT atau token servis, kecuali rute publik (`PUBLIC_API_RULES`: Delivery API, manifest blok, health, dll.) dan rute dengan autentikasi sendiri (`ROUTE_AUTHENTICATED_API_RULES`: `/api/mcp`).
   - Mutasi dari browser wajib same-origin.
   - Rate limit percobaan login (429 + `Retry-After`).
   - Header: CSP (termasuk `frame-src` dari `src/lib/media/embedValidator.ts`), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS di HTTPS.
2. **Handler route**: `requireUser` / `requireRole` dan validasi Zod di setiap mutasi. Respons galat tidak pernah memuat stack trace atau pesan galat mentah: galat dicatat di server dan klien menerima pesan umum. Pesan yang memang ditujukan ke editor (validasi, slug bentrok) dilempar sebagai `PublicError` dan diteruskan apa adanya (`src/lib/http/errors.ts`).
3. **Data**: mutasi multi-tabel dalam transaksi, dengan revisi dan audit log.

## Akun & sesi

- Login hanya lewat database (`User`, password scrypt) atau akun pemulihan dari env (`BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD_HASH`).
- Tidak ada akun atau password yang tertulis di kode. (Versi lama berisi akun "master" dengan password plaintext; sudah dihapus. Password itu masih ada di riwayat git — anggap bocor dan jangan dipakai lagi.)
- Role yang tidak dikenal ditolak, tidak dinaikkan menjadi SUPER_ADMIN.
- **Role dicek ulang dari database pada setiap panggilan API** (`resolveCurrentRole` di `src/lib/auth/credentials.ts`, dipanggil `requireUser`). Role di JWT hanya petunjuk: pengguna yang diturunkan role-nya atau dihapus langsung kehilangan akses pada permintaan berikutnya (akun yang dihapus mendapat 401), tidak menunggu sesi 30 hari kedaluwarsa. Tampilan Studio masih memakai role dari sesi sampai pengguna masuk ulang; API tetap memakai role terbaru.
- Pengguna tidak bisa mengubah role-nya sendiri atau menghapus akunnya sendiri; hanya SUPER_ADMIN yang bisa memberi atau mencabut role SUPER_ADMIN.

## Hak akses per fitur

Satu sumber: `src/lib/auth/capability-matrix.ts` (murni, aman untuk klien). Setiap rute API memeriksa kapabilitas dengan `requireCan(request, '<kapabilitas>')` (`src/lib/auth/capabilities.ts`; role dibaca ulang dari database per permintaan) — tidak ada daftar role di rute. Aksi tambahan di dalam handler (mis. menerbitkan lewat endpoint simpan) memakai `forbidUnless(role, '<kapabilitas>')`. `ROLE_PERMISSIONS` (alur editorial artikel, `src/lib/auth/types.ts`) diturunkan dari matriks yang sama. UI Studio memakai `useAuth().can('<kapabilitas>')` untuk menampilkan tombol, tab, dan aksi; role diambil segar dari `GET /api/auth/me` (`{ role, capabilities }`) sehingga penurunan role langsung terlihat tanpa masuk ulang. `tests/rbac-route-enforcement.test.ts` memanggil setiap rute untuk setiap role dan memastikan 403 muncul tepat ketika matriks menolak.

Prinsip: menghapus konten hanya SUPER_ADMIN dan CONTENT_ADMIN; menerbitkan (artikel, halaman, portofolio, layanan) SUPER_ADMIN, CONTENT_ADMIN, EDITOR; REVIEWER menyetujui artikel dan AUTHOR mengajukan review; role pemilik domain boleh menghapus di domainnya (SEO_MANAGER → redirect, MEDIA_MANAGER → media); pengguna, pengaturan, kunci MCP, dan aksi sistem hanya SUPER_ADMIN dan CONTENT_ADMIN.

SA = SUPER_ADMIN, CA = CONTENT_ADMIN, ED = EDITOR, AU = AUTHOR, RV = REVIEWER, SEO = SEO_MANAGER, MM = MEDIA_MANAGER.

| Fitur (kapabilitas) | SA | CA | ED | AU | RV | SEO | MM |
|---|---|---|---|---|---|---|---|
| Membaca konten editorial (`article:read`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Artikel: buat, ubah draf, ajukan review (`article:create`, `article:update`, `article:submit`) | ✓ | ✓ | ✓ | draf sendiri | – | – | – |
| Artikel: ubah draf siapa pun (`article:update-any`) | ✓ | ✓ | ✓ | – | – | – | – |
| Artikel: setujui / kembalikan ke draf (`article:review`) | ✓ | ✓ | ✓ | – | ✓ | – | – |
| Artikel: terbit, jadwal, tarik, arsip (`article:publish`) | ✓ | ✓ | ✓ | – | – | – | – |
| Kategori artikel: buat (`article-category:create`) | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Kategori artikel: ubah (`article-category:update`) | ✓ | ✓ | ✓ | – | – | – | – |
| Halaman dinamis, portofolio, layanan, kategori layanan: buat, ubah (`page:*`, `portfolio:*`, `service:*`, `service-category:*` create/update) | ✓ | ✓ | ✓ | – | – | – | – |
| …terbit, tarik, arsip (`*:publish`) | ✓ | ✓ | ✓ | – | – | – | – |
| Logo klien, preset CTA, template: buat, ubah (`client:manage`, `cta:manage`, `template:create`/`update`) | ✓ | ✓ | ✓ | – | – | – | – |
| **Menghapus konten** (artikel, kategori, halaman, portofolio, layanan, kategori layanan, logo klien, CTA, template — `*:delete`) | ✓ | ✓ | – | – | – | – | – |
| Unggah gambar lewat pemilih (`/api/upload`, `media:upload`) | ✓ | ✓ | ✓ | ✓ | – | – | ✓ |
| Pustaka media: unggah, metadata, ganti nama (`media:manage`) | ✓ | ✓ | ✓ | – | – | – | ✓ |
| Hapus media (`media:delete`) | ✓ | ✓ | – | – | – | – | ✓ |
| Alat SEO: audit, PageSpeed, pengindeksan, IndexNow, bank keyword, sinkronisasi Search Console (`seo:manage`) | ✓ | ✓ | ✓ | – | – | ✓ | – |
| Redirect: buat, ubah (`redirect:manage`) | ✓ | ✓ | ✓ | – | – | ✓ | – |
| Hapus redirect (`redirect:delete`) | ✓ | ✓ | – | – | – | ✓ | – |
| Pengguna (`user:manage`), pengaturan situs (`settings:manage`), kunci MCP (`mcp:manage`), tema (`theme:manage`), perbarui cache & aksi sistem (`system:manage`) | ✓ | ✓ | – | – | – | – | – |

Membaca (GET) lainnya terbuka untuk semua pengguna Studio yang masuk. Tab Studio ikut matriks: Artikel butuh `article:read`, MCP butuh `mcp:manage`, Pengguna butuh `user:manage`; membuka `?tab=` yang tidak diizinkan menampilkan pesan, bukan panel. Menambah aksi baru: tambahkan kapabilitas di matriks, pakai `requireCan` di rute dan `can()` di UI, lalu tambahkan kasusnya di `tests/rbac-route-enforcement.test.ts` (test gagal bila ada kapabilitas tanpa rute teruji).

## Permintaan keluar (SSRF) & kuota

- **Crawler audit situs** (`src/lib/seo/crawler.ts`) hanya mengunjungi origin situs dari pengaturan (`site_configs.url`). `baseUrl` dari body permintaan diabaikan; redirect hanya diikuti bila origin-nya persis sama (`spatium.id.evil.com` ditolak). Batas waktu 15 detik per halaman.
- **PageSpeed, pengindeksan ulang, dan IndexNow** hanya menerima URL di host situs sendiri (`src/lib/seo/site-url.ts`); host lain ditolak 400 (`FOREIGN_HOST`). Ini juga menjaga kuota API Google.
- `GET /api/audit` hanya membaca hasil terakhir, tidak menjalankan audit.
- `/api/vitals` (publik) divalidasi Zod dan dibatasi 60 permintaan/menit per IP.
- `/api/revalidate`: webhook memakai `REVALIDATE_SECRET`; tombol "Perbarui cache" di Studio memakai sesi SUPER_ADMIN/CONTENT_ADMIN dan wajib same-origin (proxy menganggap rute ini publik, jadi pemeriksaan origin dilakukan di handler).

## Redirect

- Sumber dan tujuan harus path di situs ini (`/portfolio/nama`). Tujuan `//host`, backslash, spasi, atau skema (`https:`, `javascript:`) ditolak — mencegah open redirect.
- Loop ditolak: sumber sama dengan tujuan, atau tujuan sudah dialihkan kembali ke sumber (A→B saat B→A).
- Simpan dan hapus berjalan dalam satu transaksi dengan `SeoAuditLog`.

## Pengaturan situs

- `POST /api/settings` memakai skema Zod ketat (kunci tak dikenal ditolak) dan **pembaruan parsial**: hanya kolom yang dikirim yang ditulis; string kosong mengosongkan kolom. Kolom yang tidak dikirim tidak lagi ikut terhapus.
- Akun sosial (`instagram`, `linkedin`, `youtube`, `tiktok`, `facebook`, `x`, `vimeo`, `behance`) hanya menerima URL `https://`. Logo dan favicon: path lokal atau URL `https://`.
- Kontak publik: email divalidasi; telepon hanya angka, spasi, `+ ( ) - .` (≥6 digit); WhatsApp dinormalisasi ke E.164 (8–15 digit, tanpa `+`) sebelum disimpan; pesan awal WhatsApp ≤500 karakter, jam operasional ≤300. Situs hanya membangun tautan `mailto:`, `tel:`, dan `https://wa.me/` dari nilai tervalidasi ini (`src/lib/contact/public-contact.ts`); tautan WhatsApp memakai `target="_blank"` + `rel="noopener noreferrer"`.
- Kontak publik hanya dibaca dari database lewat `getPublicContact()` (`src/lib/content/contact.ts`); tidak ada variabel env atau alamat bawaan. Galat database → profil kosong (semua kanal disembunyikan) dan dicatat.
- Setiap simpan menulis `ContentRevision` (sebelum + perubahan) dan `SeoAuditLog` dalam satu transaksi.
- Tidak ada nilai bawaan palsu: logo/favicon kosong sampai diisi di Studio.

## Token & kunci

| Jenis | Dipakai oleh | Disimpan |
|---|---|---|
| Sesi NextAuth | Studio | Cookie JWT (`AUTH_SECRET`) |
| `API_BEARER_TOKEN` | Integrasi servis internal | Env, ≥32 karakter |
| `SITE_API_KEY` | Delivery API (`x-site-key`) | Env / tabel `sites` |
| `REVALIDATE_SECRET` | Webhook ISR | Env |
| API key MCP (`spm_…`) | Klien MCP | Tabel `mcp_api_keys`, hanya hash SHA-256 |

Rotasi: buat nilai baru, perbarui di Coolify, redeploy. API key MCP dicabut dari Studio → tab MCP.

## Konten yang disematkan

- Iframe hanya ke domain di `ALLOWED_EMBED_DOMAINS` (termasuk `superspl.at`).
- Blok `splat-viewer` menyimpan ID scene, bukan URL; URL dibangun di renderer.
- HTML artikel dan blok paragraf disanitasi (`src/lib/security/sanitize-html.ts`).
- Unggahan tur (`/api/portfolio/upload-tour`) hanya untuk editor, maks. 250 MB, ekstraksi ZIP dilindungi dari path traversal, dan hasilnya masuk sebagai draft. Unggah ulang ke slug yang sama hanya memperbarui tautan tur dan kolom yang diisi; status item tidak berubah.
- Unggahan gambar diperiksa dari magic bytes (bukan ekstensi), maks. 5 MB, dibatasi laju, SVG disanitasi. Setiap unggahan lewat `/api/upload` atau `/api/media` tercatat sebagai baris `media_items` dengan ID pengunggah asli; bila penulisan baris gagal, file dihapus lagi.
- URL logo klien dan tautan tombol CTA hanya path lokal, `https:`, `mailto:`, atau `tel:` (`javascript:` ditolak).

## Hal yang perlu ditindaklanjuti

- Ganti password akun mana pun yang pernah memakai password "master" lama.
- Kunci API PageSpeed dan ID akun R2 lama sempat ter-commit di `.env.example` / `docker-compose.yml`; anggap bocor dan rotasi bila masih aktif.
- Kunci editor artikel dan rate limit (login, MCP) disimpan di memori proses; dengan beberapa replika, perilakunya per instance.
