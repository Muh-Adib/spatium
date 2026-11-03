# AUDIT BASELINE — UNIMASI

Tanggal: 2026-11-02
Branch: `feature/nextjs-migration`

## Kondisi awal (sebelum perubahan)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Type-check | `npm run typecheck` | PASS (0 error) |
| Production build | `npm run build` | PASS (exit 0) |

## Stack terverifikasi

- Next.js 16.4.2 (App Router, Turbopack), React 19.3.1, TypeScript 5.6.3
- Prisma 8 (`@prisma/orm-postgres`), PostgreSQL 16
- NextAuth v5 beta, Tailwind v3, GSAP 3.12, Three.js 0.187
- Port dev/start: **3001**
- Arsitektur: unified (situs publik + Studio Admin `/admin` + Delivery API + AI Copilot + ToolRegistry)

## Rute ter-build (dari output `next build`)

- `/`, `/about`, `/contact`, `/journal`, `/journal/[slug]`
- `/portfolio`, `/portfolio/[slug]`
- `/services`, `/services/2d-animation`, `/services/3d-animation`, `/services/motion-graphics`, `/services/digital-assets-ai`
- `/admin/*`, `/api/*`, `robots.txt`, `sitemap.xml`

## Temuan awal (dari TASK_PROMPT + verifikasi repo)

1. **Salah ketik di MD**: "Versi: 02/03/2030" dan "Prepared by: Alfredo Torres" — cek PDF.
2. **Domain tidak konsisten**: kode memakai `unimasi.studio` (site.ts, email, Instagram), gambar brand resmi memakai `www.unimasi.id` dan `@unimasi`. TASK_PROMPT menyebut situs asli `www.unimasi.com`. → Selisih, perlu keputusan pemilik.
3. **`.env.example` basi** (variabel `VITE_*` dari proyek Vite lama).
4. **Tidak ada `Dockerfile` / `docker-compose.yml`**.
5. **Portofolio seed (6 entri)**: `coverImage` memakai logo klien, bukan frame proyek; angka hasil tidak terverifikasi; logo klien (34) identik dengan repo ERFO.
6. **`seed_services.json` datar** — belum ada kategori → turunan. Sumber kanonis turunan ada di `unimasi-brand.png` (6–7 turunan per core).
7. **Bug scheduler**: `revalidatePath('/artikel')` padahal rute artikel UNIMASI = `/journal`.
8. **Data statis ganda**: `src/data/articles.ts`, `clients.ts`, `projects.ts`, `services.ts`, `site.ts` berdampingan dengan seed/DB.
9. **Integrasi WordPress aktif di runtime** (tab Impor, `StudioWpImporter`, `ArticleWordpressModal`, `api/import/*`, `lib/import/wp-*`).

## Status gerbang FASE 0

- [x] Baseline type-check tercatat
- [x] Baseline build tercatat
- [x] Daftar temuan awal ada
