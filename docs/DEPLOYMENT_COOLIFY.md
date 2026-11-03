# Deployment — Coolify (UNIMASI)

Satu resource Coolify (Docker Compose): `postgres` + `db-migrate` + `app`.

## Prasyarat

- VPS dengan Docker + Coolify terpasang.
- Repo terhubung ke Coolify (GitHub App / deploy key).
- Domain `unimasi.id` (atau domain final) sudah mengarah ke IP VPS.

## Langkah di Coolify

1. **New Resource → Docker Compose** → pilih repo `unimasi`, branch `main`.
2. **Build Pack**: Docker Compose (`docker-compose.yml` di root).
3. **Domains**: isi `SERVICE_FQDN_APP_3001` = `https://unimasi.id` (Coolify mengisi port internal otomatis).
4. **Environment Variables**: tempel daftar dari `.env.example`. Variabel bertanda `[generated]` diisi otomatis oleh Coolify (`SERVICE_HEX_32_*`).
5. **Persistent Storage**: `postgres_data` dan `uploads_data` sudah dideklarasikan sebagai volume bernama.
6. **Deploy**. Urutan otomatis: `postgres` (healthy) → `db-migrate` (selesai) → `app`.

## Variabel wajib

| Variable | Sumber |
|---|---|
| `DATABASE_URL` | dibangun dari `POSTGRES_*` + `SERVICE_PASSWORD_POSTGRES` |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | `SERVICE_HEX_32_AUTHSECRET` |
| `API_BEARER_TOKEN` | `SERVICE_HEX_32_APIBEARER` |
| `SITE_API_KEY` | `SERVICE_HEX_32_SITEAPIKEY` |
| `REVALIDATE_SECRET` | `SERVICE_HEX_32_REVALIDATE` |
| `WEBHOOK_SECRET` | `SERVICE_HEX_32_WEBHOOK` |

## Seed awal (sekali, manual)

```bash
docker compose exec app npx tsx scripts/seed.ts
docker compose exec app npm run validate-seed
```

## Health check

`GET /api/health` → 200 jika proses hidup **dan** database menjawab; 503 jika DB down.

## Backup

```bash
docker compose exec postgres pg_dump -U uni uni | gzip > backup-$(date +%F).sql.gz
```

## Rollback

Coolify → Deployments → pilih deployment sebelumnya → **Redeploy**.

## Catatan

- `NEXT_PUBLIC_*` dibaca **saat build**; sudah diteruskan sebagai `build.args` di compose + `ARG/ENV` di Dockerfile.
- Jangan menambahkan `ports:` pada `app` — routing publik ditangani proxy Coolify.
- `db-migrate` memakai stage `builder` (punya Prisma CLI) dan `restart: "no"`.
