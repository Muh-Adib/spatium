# Spatium — Flagship Interactive Digital Platform

Interactive platform website for **Spatium**, built as a unified Next.js 16 application with an integrated Studio admin and a Prisma 8 content layer.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** — public site, API routes, and Studio.
- **Tailwind CSS v3** with token-driven theming (`src/styles/tokens.css`, `src/tokens/tokens.css`).
- **Prisma 8** (`@prisma/orm-postgres`) — PostgreSQL content layer (`prisma/`).
- **NextAuth** for Studio access; route security lives in `src/proxy.ts` (Next.js 16 convention — no `middleware.ts`).
- GSAP for motion; Three.js/WebGL as a progressive enhancement layer.

## Getting started

```bash
pnpm install
pnpm run dev          # dev server on http://localhost:3002
pnpm run build        # production build
pnpm run start        # serve production build on port 3002
pnpm run typecheck    # tsc --noEmit
pnpm test             # run vitest suite
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/services`, `/services/[slug]` | Services catalog and service detail |
| `/portfolio`, `/portfolio/[slug]` | Case studies |
| `/journal`, `/journal/[slug]` | Articles |
| `/about`, `/contact` | Company profile and contact |
| `/admin` | Studio admin (content, media, SEO) |

## Brand

Official brand rules will be placed in `docs/` and referenced in **`AGENTS.md`** as the single source of truth.
