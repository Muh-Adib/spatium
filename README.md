# SPATIUM — Spatial Technology Studio

Situs dan Studio Admin SPATIUM: digital twin untuk industri kreatif. Ruang nyata direkam dan direkonstruksi menjadi 3D Gaussian Splat yang bisa dijelajahi dari browser.

Satu aplikasi Next.js 16 berisi situs publik, Studio Admin (`/admin`), API konten, Delivery API, dan server MCP untuk menyusun halaman dari blok.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v3 · PostgreSQL 16 + Prisma 8 · NextAuth v5 · Zod 4 · GSAP · Three.js

## Mulai

```bash
pnpm install
cp .env.example .env.local     # isi DATABASE_URL dan AUTH_SECRET
pnpm exec prisma contract emit && pnpm run db:push && pnpm run db:seed
pnpm run dev                   # http://localhost:3002
```

Panduan lengkap: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Rute utama

| Rute | Isi |
|---|---|
| `/` | Beranda |
| `/services`, `/services/[slug]` | Use case dan kapabilitas |
| `/portfolio`, `/portfolio/[slug]` | Scene 3D Gaussian Splat |
| `/journal`, `/journal/[slug]` | Artikel |
| `/[slug]` | Halaman dinamis dari editor blok |
| `/admin` | Studio Admin (login di `/pawon`) |
| `/api/mcp` | Server MCP (API key per klien) |

## Verifikasi

```bash
pnpm run typecheck && pnpm exec vitest run && pnpm run audit:senior && pnpm run build
```

## Dokumentasi

[docs/README.md](docs/README.md) · aturan kontribusi untuk engineer dan agen koding: [AGENTS.md](AGENTS.md).
