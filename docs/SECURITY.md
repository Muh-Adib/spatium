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

Role dan izin editorial: `src/lib/auth/types.ts` (`ROLE_PERMISSIONS`) dan `src/lib/auth/capabilities.ts` (`requireCan`). Ringkasan yang diuji per role:

| Fitur | Membuat / mengubah | Menghapus |
|---|---|---|
| Artikel | SUPER_ADMIN, CONTENT_ADMIN, EDITOR, AUTHOR (draft sendiri) · REVIEWER hanya mengubah status review | SUPER_ADMIN, CONTENT_ADMIN |
| Menarik artikel terbit ke draft | Hanya role yang boleh menerbitkan (SUPER_ADMIN, CONTENT_ADMIN, EDITOR) | – |
| Kategori artikel | Membuat: role yang boleh membuat artikel · mengubah: SUPER_ADMIN, CONTENT_ADMIN, EDITOR | SUPER_ADMIN, CONTENT_ADMIN |
| Portofolio, layanan, kategori layanan | SUPER_ADMIN, CONTENT_ADMIN, EDITOR | SUPER_ADMIN, CONTENT_ADMIN |
| Halaman dinamis | SUPER_ADMIN, CONTENT_ADMIN, EDITOR (terbit/arsip: SUPER_ADMIN, CONTENT_ADMIN) | SUPER_ADMIN, CONTENT_ADMIN |
| Logo klien, preset CTA | SUPER_ADMIN, CONTENT_ADMIN, EDITOR | SUPER_ADMIN, CONTENT_ADMIN (`DELETE /api/cta?id=`) |
| Pustaka media (`/api/media`: unggah, metadata, ganti nama) | SUPER_ADMIN, CONTENT_ADMIN, EDITOR, MEDIA_MANAGER | Sama |
| Unggah gambar (`/api/upload`, dipakai editor artikel & pemilih media) | Role media + AUTHOR | – |
| Alat SEO (audit situs, PageSpeed, pengindeksan, IndexNow, keyword) | SUPER_ADMIN, CONTENT_ADMIN, EDITOR, SEO_MANAGER (`SEO_TOOL_ROLES`, `src/lib/seo/access.ts`) | – |
| Sinkronisasi Search Console | SUPER_ADMIN, CONTENT_ADMIN, SEO_MANAGER | – |
| Redirect | SUPER_ADMIN, CONTENT_ADMIN, SEO_MANAGER, EDITOR | SUPER_ADMIN, CONTENT_ADMIN |
| Pengaturan situs, pengguna, kunci MCP, perbarui cache dari Studio | SUPER_ADMIN, CONTENT_ADMIN | Sama |

Membaca (GET) terbuka untuk semua pengguna Studio yang masuk, kecuali konten editorial untuk MEDIA_MANAGER, serta pengguna dan kunci MCP (SUPER_ADMIN, CONTENT_ADMIN).

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
