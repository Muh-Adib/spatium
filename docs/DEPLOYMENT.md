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

## Skema & seed otomatis

Compose punya tiga service: `postgres`, `migrate` (sekali jalan) dan `app`.

- `migrate` dibangun dari stage `migrate` di `Dockerfile` dan menjalankan `prisma db update --yes` pada **setiap** deploy, lalu `scripts/seed-if-empty.ts`.
- Seed hanya berjalan bila database belum punya portofolio, artikel, halaman, dan layanan — `db:seed` melakukan upsert, jadi menjalankannya di database berisi akan menimpa editan Studio. Matikan dengan `SEED_ON_EMPTY=false`.
- `app` baru start setelah `migrate` selesai sukses. Perubahan skema yang destruktif ditolak `db update` → deploy berhenti dan versi lama tetap jalan. Untuk itu: backup, lalu jalankan migrasi terencana secara manual.

Akun pertama: login di `/pawon` dengan `BOOTSTRAP_ADMIN_EMAIL` + password yang hash-nya ada di `BOOTSTRAP_ADMIN_PASSWORD_HASH` (`pnpm exec tsx scripts/hash-password.ts`), lalu buat akun editor sungguhan dari tab **Pengguna**.

Isi `SITE_API_KEY` (≥32 karakter acak) **sebelum** deploy pertama: seed menyimpannya sebagai API key Site untuk header `x-site-key`. Bila kosong, seed membuat key acak yang tidak dicetak. Tidak ada key bawaan yang bisa ditebak; `site_sec_spatium`/`site_sec_default` ditolak di produksi.

## Coolify

Aplikasi `spatium` (project **WEB UDP**, environment `production`), build pack *Docker Compose*, sumber GitHub App ke `Muh-Adib/spatium`, branch `feat/spatium-rebuild`, compose `/docker-compose.yml`, domain service `app`: `https://spatium.id,https://www.spatium.id`.

- **Auto-deploy aktif**: setiap push ke branch tersebut memicu build + deploy. Ganti branch di Coolify setelah merge ke `main`.
- `SERVICE_PASSWORD_POSTGRES` dibuat otomatis oleh Coolify; tidak ada password DB di repo.
- Env rahasia (`AUTH_SECRET`, `API_BEARER_TOKEN`, `SITE_API_KEY`, `REVALIDATE_SECRET`, `WEBHOOK_SECRET`, `BOOTSTRAP_ADMIN_*`) diisi di Coolify, ditandai *literal*. Salinan lokal pemilik ada di `.env.coolify.local` (gitignored).
- `NEXT_PUBLIC_*` adalah build-time: mengubahnya butuh redeploy.

## Penyimpanan berkas

- Unggahan media disimpan di `public/uploads` (volume `uploads_data`).
- Tur yang diunggah lewat **Portfolio → Upload Tour** ditulis ke `public/tours` (volume `tours_data`), sehingga bertahan setelah redeploy.

## Cache dan revalidasi

Halaman publik memakai ISR. Perubahan dari Studio memanggil `revalidatePath` pada rute terkait. Webhook `POST /api/revalidate` (header `x-revalidate-secret`) tersedia untuk pemicu eksternal.

## CI

`.github/workflows/ci.yml` berjalan pada setiap PR dan push ke `main`: `prisma contract emit` (gagal bila `schema.json`/`schema.d.ts` belum di-commit), `db:push` ke Postgres kosong, typecheck, vitest, `audit:senior` (gagal bila ada temuan), build. Aktifkan branch protection `main` dengan check `CI / verify` agar wajib hijau sebelum merge.
