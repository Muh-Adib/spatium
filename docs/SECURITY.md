# Model keamanan

## Lapisan

1. **`src/proxy.ts`** (Next 16 proxy, tidak ada `middleware.ts`):
   - `/admin/**` tanpa sesi → `/pawon`.
   - `/api/**` membutuhkan sesi JWT atau token servis, kecuali rute publik (`PUBLIC_API_RULES`: Delivery API, manifest blok, health, dll.) dan rute dengan autentikasi sendiri (`ROUTE_AUTHENTICATED_API_RULES`: `/api/mcp`).
   - Mutasi dari browser wajib same-origin.
   - Rate limit percobaan login (429 + `Retry-After`).
   - Header: CSP (termasuk `frame-src` dari `src/lib/media/embedValidator.ts`), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS di HTTPS.
2. **Handler route**: `requireUser` / `requireRole` dan validasi Zod di setiap mutasi. Respons galat tidak pernah memuat stack trace atau pesan galat mentah.
3. **Data**: mutasi multi-tabel dalam transaksi, dengan revisi dan audit log.

## Akun & sesi

- Login hanya lewat database (`User`, password scrypt) atau akun pemulihan dari env (`BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD_HASH`).
- Tidak ada akun atau password yang tertulis di kode. (Versi lama berisi akun "master" dengan password plaintext; sudah dihapus. Password itu masih ada di riwayat git — anggap bocor dan jangan dipakai lagi.)
- Role yang tidak dikenal ditolak, tidak dinaikkan menjadi SUPER_ADMIN.
- Pengguna tidak bisa mengubah role-nya sendiri atau menghapus akunnya sendiri; hanya SUPER_ADMIN yang bisa memberi atau mencabut role SUPER_ADMIN.

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
- Unggahan tur (`/api/portfolio/upload-tour`) hanya untuk editor, maks. 250 MB, ekstraksi ZIP dilindungi dari path traversal, dan hasilnya masuk sebagai draft.

## Hal yang perlu ditindaklanjuti

- Ganti password akun mana pun yang pernah memakai password "master" lama.
- Kunci API PageSpeed dan ID akun R2 lama sempat ter-commit di `.env.example` / `docker-compose.yml`; anggap bocor dan rotasi bila masih aktif.
- Kunci editor artikel dan rate limit (login, MCP) disimpan di memori proses; dengan beberapa replika, perilakunya per instance.
