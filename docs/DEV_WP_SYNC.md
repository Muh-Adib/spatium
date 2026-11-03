# DEV WordPress Sync — UNIMASI

Alat development-only untuk menyinkronkan konten dari situs WordPress lama (`www.unimasi.com`) ke seed lokal. **Tidak termasuk dalam build produksi.**

## Prasyarat

1. Buat **Application Password** di WordPress:
   - Login ke `https://www.unimasi.com/wp-admin/` sebagai administrator.
   - Buka **Users → Profile → Application Passwords**.
   - Beri nama (mis. `unimasi-dev-sync`), klik **Add New Application Password**.
   - Salin password yang muncul (hanya ditampilkan sekali).

2. Set variabel lingkungan di shell lokal (jangan commit ke repo):
   ```bash
   export WP_SITE_URL=https://www.unimasi.com
   export WP_USER=admin           # username administrator WP
   export WP_APP_PASSWORD='xxxx xxxx xxxx xxxx'  # Application Password
   ```

## Menjalankan sync

```bash
npm run dev:wp-sync -- --i-know-this-is-dev
```

Script akan:
1. Memvalidasi env dan flag `--i-know-this-is-dev`.
2. Mengambil semua posts & pages (status: publish, future, draft, pending, private) via REST API dengan Basic auth.
3. Mengambil categories, tags, users, media.
4. Menulis seed ke `src/data/seed/`:
   - `seed_articles.<n>.json` (sharded, max 2 MB per file)
   - `seed_pages.<n>.json` (sharded)
   - `seed-manifest.json` (jumlah entitas + checksum + status breakdown)
5. Menulis laporan rekonsiliasi ke `docs/services/wp-reconciliation.md`.

## Rekonsiliasi

Setelah sync selesai, buka `docs/services/wp-reconciliation.md` dan pastikan selisih = 0 untuk semua entitas. Jika ada item yang gagal diambil, catat secara manual di file tersebut.

## Seed ke database

Jalankan seed production seperti biasa:
```bash
npm run db:seed
```

Artikel berstatus `future` dengan tanggal di masa depan tetap `scheduled`. Artikel `future` yang tanggalnya sudah lewat saat seed dijalankan masuk status `in_review` dengan `scheduleError` — tidak dipublish otomatis.

## Keamanan

- Kredensial WP **tidak pernah** disimpan di repo, log, atau database.
- Script menolak berjalan jika `NODE_ENV=production`.
- Script menolak berjalan tanpa flag `--i-know-this-is-dev`.
- Gunakan Application Password (bukan password login utama) agar bisa dicabut kapan saja dari WP admin.