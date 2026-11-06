# Deployment

SPATIUM dideploy sebagai satu image Docker (Next.js 16 `output: 'standalone'`) bersama PostgreSQL 16, lewat `docker-compose.yml` (dipakai Coolify).

## Build image

`Dockerfile` bertingkat: `deps` → `builder` → `runner`.

- `builder` menjalankan `prisma contract emit` lalu `pnpm run build`. Kegagalan emit menghentikan build.
- Variabel `NEXT_PUBLIC_*` di-inline saat build. Kirim lewat build args: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_STUDIO_ADDRESS`, `NEXT_PUBLIC_STUDIO_HOURS`. Mengubahnya butuh rebuild.
- Runtime berjalan sebagai user `nextjs` di port 3000.
- Healthcheck (`Dockerfile` dan `docker-compose.yml`) memanggil `GET /api/health`: 200 bila proses hidup dan database menjawab dalam 3 detik, 503 bila tidak — container ditandai *unhealthy* saat database mati.

## Variabel lingkungan

Wajib di produksi:

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Tanda tangan sesi NextAuth (≥32 karakter acak) |
| `NEXT_PUBLIC_SITE_URL` | URL kanonik (sitemap, metadata, URL MCP) |
| `SITE_API_KEY` | Kunci Delivery API (`x-site-key`); placeholder ditolak di produksi |
| `REVALIDATE_SECRET` | Webhook revalidasi ISR (`x-revalidate-secret`) |
| `API_BEARER_TOKEN` | Token servis internal (≥32 karakter). Bukan untuk klien MCP. |

Opsional: `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD_HASH` (akun pemulihan), `WEBHOOK_SECRET`, `GSC_CLIENT_EMAIL` + `GSC_PRIVATE_KEY` (Search Console), `PAGESPEED_API_KEY`, `NEXT_PUBLIC_STUDIO_EMAIL`, `NEXT_PUBLIC_INQUIRY_ENDPOINT`.

Kontak publik (`NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_STUDIO_ADDRESS`, `NEXT_PUBLIC_STUDIO_HOURS`) disembunyikan dari situs bila kosong — jangan isi dengan placeholder.

Klien MCP **tidak** memakai variabel env; mereka memakai API key per klien yang dibuat di Studio (lihat [MCP.md](MCP.md)).

## Setelah deploy pertama

```bash
pnpm run db:push     # di container atau dari mesin dengan akses DB
pnpm run db:seed     # hanya untuk database kosong
```

Isi `SITE_API_KEY` (≥32 karakter acak) **sebelum** `db:seed`: nilainya disimpan sebagai API key Site dan dipakai klien Delivery API di header `x-site-key`. Bila kosong, seed membuat key acak yang tidak dicetak — tidak bisa dipakai sampai Anda mengisi `SITE_API_KEY` (diterima lewat fallback env) atau membaca `sites.api_key` langsung dari database. Tidak ada lagi key bawaan yang bisa ditebak; `site_sec_spatium`/`site_sec_default` ditolak di produksi.

Lalu login di `/pawon` dengan akun bootstrap dan buat akun editor sungguhan dari tab **Pengguna**.

## Penyimpanan berkas

- Unggahan media disimpan di `public/uploads` (volume `uploads_data`).
- Tur yang diunggah lewat **Portfolio → Upload Tour** ditulis ke `public/tours`. Folder ini **tidak** punya volume di compose saat ini, jadi isinya hilang saat container dibuat ulang. Tambahkan volume `/app/public/tours` bila fitur ini dipakai di produksi, atau pakai scene SuperSplat (ID scene) yang tidak butuh penyimpanan lokal.

## Cache dan revalidasi

Halaman publik memakai ISR. Perubahan dari Studio memanggil `revalidatePath` pada rute terkait. Webhook `POST /api/revalidate` (header `x-revalidate-secret`) tersedia untuk pemicu eksternal.

## CI

`.github/workflows/ci.yml` berjalan pada setiap PR dan push ke `main`: `prisma contract emit` (gagal bila `schema.json`/`schema.d.ts` belum di-commit), `db:push` ke Postgres kosong, typecheck, vitest, `audit:senior` (gagal bila ada temuan), build. Aktifkan branch protection `main` dengan check `CI / verify` agar wajib hijau sebelum merge.
