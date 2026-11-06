# Roadmap & backlog menuju deployment

Tujuan: deployment produksi yang aman dan stabil. Fase dikerjakan berurutan; fase berikutnya dimulai setelah semua item **wajib** fase sebelumnya selesai.

Prioritas: **P0** = wajib sebelum deploy produksi · **P1** = sebaiknya sebelum deploy, boleh menyusul dengan risiko yang dicatat · **P2** = setelah deploy.

---

## Fase 0 — Review & stabilisasi kode

| # | Prioritas | Item | Selesai bila |
|---|---|---|---|
| 0.1 | P0 | Review perubahan besar (rebrand SPATIUM, migrasi konten ke DB, editor blok, halaman dinamis, MCP, shell admin, penghapusan agent AI) | Pull request di-review dan disetujui |
| 0.2 | P0 | Uji manual seluruh Studio dengan akun non-super-admin (EDITOR, AUTHOR, REVIEWER) | Setiap role hanya bisa melakukan aksi yang diizinkan |
| 0.3 | P1 | Ganti 82 blok `catch {}` tanpa logging di kode lama (tidak terdeteksi `audit:senior`) | `grep -rn "catch {" src` hanya menyisakan kasus yang sengaja dan dikomentari; aturan ditambahkan ke `scripts/senior-code-audit.ts` |
| 0.4 | P1 | Audit aksesibilitas manajer Portofolio, Layanan, Solusi, Media, Klien, CTA (belum disentuh refactor) | Lulus checklist AGENTS.md §3.7 |
| 0.5 | P1 | Putuskan nasib fitur **Solusi** (manajer di Studio ada dan CRUD-nya berfungsi setelah QA, tapi tidak ada rute publik; rute lama sudah di-redirect ke `/services`) | Dihapus dari Studio, atau diberi rute publik |
| 0.6 | P2 | Hapus atau sambungkan ulang `/api/templates` (tidak dipakai editor baru) | Tidak ada endpoint yatim |
| 0.7 | P1 | Selaraskan hak akses yang tidak konsisten (temuan QA Studio): (a) EDITOR tidak bisa menghapus portofolio (`portfolio:delete`), tapi tombol Hapus tetap tampil dan berujung 403; (b) EDITOR tidak bisa menerbitkan halaman (`PAGE_ROLES.publish`) padahal `catalog:publish` memuat EDITOR; (c) SEO_MANAGER bisa membuat redirect tapi tidak bisa menghapusnya; (d) EDITOR boleh menjalankan audit/PageSpeed/IndexNow (`canManageSeo`) tapi tidak sinkronisasi GSC (`seo:manage`); (e) hapus media terbuka untuk EDITOR dan MEDIA_MANAGER, katalog lain hanya admin | Satu sumber role per aksi di `src/lib/auth/**`; UI menyembunyikan aksi yang ditolak API |
| 0.8 | P2 | Putuskan endpoint tanpa pemanggil di UI: `/api/theme/tokens`, `/api/seo/analyze`, `POST /api/indexnow`, `POST /api/system/status`, serta `/api/navigation` dan `/api/locations` (tidak dipakai Studio). Preset CTA belum dirender di halaman publik | Dihapus, atau disambungkan ke UI/renderer |
| 0.9 | P1 | Isi alt text sampul empat kategori layanan terbit (filmmaking-vfx, marketing-branding, entertainment-installation, memory-documentary); gerbang publikasi kini menolak simpan ulang tanpa alt | Keempatnya lolos gerbang |
| 0.10 | P2 | Kebijakan kecil dari QA Studio: panjang minimal password (Studio 8, `create-superadmin` 12); pengajuan indeks berstatus `unconfigured` tetap memicu cooldown 24 jam; `/api/revalidate` masih menerima `?secret=` di URL; daftar media menjalankan sinkronisasi filesystem → DB di setiap GET dan `usedIn` tidak pernah terisi (filter "Belum digunakan" tidak bermakna); GET `/api/settings` mengembalikan teks merek bawaan bila baris `site_configs` belum ada | Masing-masing diputuskan dan dicatat |

## Fase 1 — Keamanan

| # | Prioritas | Item | Selesai bila |
|---|---|---|---|
| 1.1 | P0 | **Rotasi rahasia yang bocor di riwayat git**: password akun "master" lama, `PAGESPEED_API_KEY` lama, ID akun R2 lama | Nilai lama tidak berlaku lagi di mana pun |
| 1.2 | P0 | Ganti password setiap akun produksi yang pernah memakai password "master" | Konfirmasi pemilik akun |
| 1.3 | P0 | Putuskan akun warisan di `src/data/seed/seed_users.json` (8 akun, 6 super admin). Default: tidak diimpor | Daftar akun produksi disetujui pemilik; sisanya dihapus dari seed |
| 1.4 | P0 | ✅ (dibuat 2026-11-06, tersimpan di Coolify) Buat rahasia produksi baru: `AUTH_SECRET`, `API_BEARER_TOKEN`, `SITE_API_KEY`, `REVALIDATE_SECRET` (≥32 karakter acak) | Tersimpan di Coolify, tidak di repo |
| 1.5 | P0 | ✅ (login bootstrap terverifikasi di spatium.id) Akun pemulihan: `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD_HASH` | Login berhasil di staging |
| 1.6 | P0 | Hapus akun QA lokal `qa-admin@spatium.local` dari database mana pun selain lokal | Tidak ada di staging/produksi |
| 1.9 | P0 | Rotasi `sites.api_key` yang bernilai `site_sec_spatium`/`site_sec_default` (dulu default `db:seed` bila `SITE_API_KEY` kosong; diterima Delivery API di produksi). Seed kini membuat key acak | `SELECT slug FROM sites WHERE api_key IN ('site_sec_spatium','site_sec_default')` kosong di staging/produksi |
| 1.7 | P1 | Verifikasi header keamanan di domain produksi (CSP termasuk `superspl.at`, HSTS, frame-ancestors) | Diperiksa dengan securityheaders.com / curl |
| 1.8 | P1 | Rate limit login & MCP saat ini per proses. Tetapkan **satu replika** app, atau pindahkan ke Postgres/Redis | Keputusan dicatat di DEPLOYMENT.md |

## Fase 2 — Database & data

| # | Prioritas | Item | Selesai bila |
|---|---|---|---|
| 2.1 | P0 | **Backup database produksi** sebelum menerapkan skema baru (`scripts/db-backup.ts` atau `pg_dump`) | File backup terverifikasi bisa di-restore |
| 2.2 | P0 | Terapkan skema di **staging dulu**: `prisma contract emit` + `db:push`. Perubahan: tabel baru `mcp_api_keys`, default `pages.status` = `draft` | `db:push` di staging hanya menampilkan perubahan yang diharapkan |
| 2.3 | P0 | Isi konten produksi: jalankan `db:seed` **hanya** pada database kosong; pada database berisi, impor selektif | Portofolio (10), use case (4), artikel (4), redirect (10) tampil benar |
| 2.4 | P0 | Verifikasi tidak ada konten lama UNIMASI di database produksi (artikel, layanan, logo klien, halaman) | Query cek kosong, atau konten diarsipkan |
| 2.5 | P1 | Lengkapi data portofolio dari pemilik: tahun capture, nama klien resmi, izin tampil, poster untuk 8 scene tanpa gambar | Data dikonfirmasi tertulis |
| 2.6 | P1 | Kontak publik dari pemilik: telepon, WhatsApp, alamat, jam kerja, akun sosial (Instagram/LinkedIn belum terkonfirmasi) | Env `NEXT_PUBLIC_*` terisi atau sengaja kosong |
| 2.7 | P2 | Migrasi terencana untuk menghapus tabel yang tidak dipakai lagi: `ai_*`, `voice_profiles`, `content_nodes`, `content_links`, `clusters`, `wordpress_snapshots`, `legacy_urls`, tabel `solution*` (bila fitur Solusi dihapus) | Backup dulu; migrasi dijalankan di staging lalu produksi |
| 2.8 | P2 | Jadwalkan backup otomatis harian + uji restore bulanan | Cron/Coolify backup aktif |

## Fase 3 — Infrastruktur

| # | Prioritas | Item | Selesai bila |
|---|---|---|---|
| 3.1 | P0 | ⚠️ Saat ini spatium.id dipakai langsung sebagai staging (auto-deploy dari `feat/spatium-rebuild`). Lingkungan **staging** terpisah (domain, database, env sendiri) | Staging bisa di-deploy ulang dari branch |
| 3.2 | P0 | ✅ (2026-11-06, Coolify app `spatium`) Isi semua env wajib (lihat DEPLOYMENT.md), termasuk build args `NEXT_PUBLIC_*` | Build Coolify sukses tanpa peringatan env |
| 3.3 | P0 | ✅ (terverifikasi di spatium.id) Healthcheck compose & Dockerfile memakai `/api/health`; probe DB dengan batas waktu 3 dtk, 503 saat DB mati (`tests/health-route.test.ts`) | Container ditandai unhealthy saat DB mati — tinggal verifikasi di staging |
| 3.4 | P1 | ✅ Volume `tours_data` untuk `/app/public/tours` bila fitur Upload Tour dipakai (saat ini hilang saat container dibuat ulang) | Tur bertahan setelah redeploy |
| 3.5 | P1 | Ganti default `POSTGRES_USER`/`POSTGRES_DB` (`uni`) — hanya untuk instalasi baru; instalasi lama memakai volume yang sudah ada | Diputuskan per lingkungan |
| 3.6 | P1 | Kunci editor artikel di database (tabel `EditorLock`) agar aman saat restart/multi-instance | Dua tab editor saling terkunci walau server restart |
| 3.7 | P2 | Logging terpusat dan pelaporan galat (`onRequestError` di `src/instrumentation.ts`) | Galat produksi terlihat di satu tempat |

## Fase 4 — Quality assurance di staging

| # | Prioritas | Item | Selesai bila |
|---|---|---|---|
| 4.1 | P0 | ✅ CI `.github/workflows/ci.yml`: typecheck, vitest (service Postgres, DB kosong), `audit:senior` (kini gagal bila ada temuan), build, cek kontrak Prisma ter-commit | Pipeline hijau wajib untuk merge — **sisa**: aktifkan branch protection `main` dengan check `CI / verify` |
| 4.2 | P0 | Uji alur kritis di staging: login, tulis & terbitkan artikel, jadwalkan artikel (penjadwal), buat & terbitkan halaman `/<slug>`, ganti slug (redirect 301), upload media, kelola redirect, kelola pengguna | Checklist ditandatangani |
| 4.3 | P0 | ✅ (2026-11-06 di spatium.id: halaman, artikel, portofolio, layanan dibuat sebagai draft; publish & edit konten terbit ditolak; key dicabut → 401) Uji MCP di staging: buat API key, `tools/list`, `create_page_draft`, edit blok, pastikan publish ditolak, cabut key | Sesuai MCP.md |
| 4.4 | P0 | Viewer SuperSplat tampil di domain staging (CSP `frame-src`) di beranda, portofolio, blok `splat-viewer` | Ke-10 scene termuat |
| 4.5 | P1 | Lighthouse (performa, aksesibilitas, SEO) beranda, portofolio, artikel, halaman dinamis — desktop & mobile | Skor dan temuan dicatat; regresi besar diperbaiki |
| 4.6 | P1 | Uji perangkat nyata: iOS Safari, Android Chrome, 320 px, zoom 200%, keyboard saja, screen reader | Tidak ada konten terpotong atau kontrol tak terjangkau |
| 4.7 | P1 | Test end-to-end (Playwright) untuk alur 4.2 di CI | Berjalan otomatis |
| 4.8 | P1 | Uji beban ringan pada halaman publik dan `/api/mcp` | Tidak ada galat pada beban yang diharapkan |

## Fase 5 — Deployment produksi

Runbook (dijalankan berurutan, satu orang memimpin):

1. Umumkan jendela deploy; bekukan perubahan konten di Studio lama.
2. **Backup database produksi** dan simpan di luar server.
3. Merge branch ke `main` setelah CI hijau dan staging lulus Fase 4.
4. Deploy di Coolify (build menjalankan `prisma contract emit` + `next build`).
5. Jalankan `pnpm run db:push`; periksa bahwa perubahannya hanya yang diharapkan (Fase 2.2).
6. Smoke test: `/`, `/portfolio`, satu scene, `/journal`, `/services/filmmaking-vfx`, `/sitemap.xml`, `/robots.txt`, login `/pawon`, tab Halaman & MCP.
7. Cek redirect lama: `/portofolio/...`, `/artikel/...`, slug portofolio lama → 308/301 ke URL baru.
8. Kirim sitemap ke Google Search Console.

**Rollback**: redeploy image sebelumnya di Coolify. Perubahan skema saat ini hanya menambah tabel dan mengubah default, sehingga image lama tetap kompatibel. Restore backup hanya bila data rusak.

## Fase 6 — Setelah deploy

| # | Prioritas | Item |
|---|---|---|
| 6.1 | P1 | Pantau log galat dan Search Console (404, coverage) selama 2 minggu |
| 6.2 | P2 | Pulihkan versi halaman dari Riwayat (fitur restore revisi) |
| 6.3 | P2 | Pertimbangkan hosting scene splat sendiri bila ketergantungan pada SuperSplat jadi risiko |
| 6.4 | P2 | Konfirmasi hubungan SPATIUM dengan grup PT UDP sebelum dicantumkan di komunikasi brand |

---

Perbarui dokumen ini setiap kali item selesai atau prioritas berubah.
