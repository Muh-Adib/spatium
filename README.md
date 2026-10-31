# UNIMASI — Animation & Motion Design Studio

Studio website for **UNIMASI** (2D animation, 3D animation & visual production, motion
graphics), built as a unified Next.js application with an integrated Studio admin and a
Prisma-backed content layer.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** — public site, API routes, and Studio.
- **Tailwind CSS v3** with token-driven theming (`src/styles/tokens.css`, `src/tokens/tokens.css`).
- **Prisma 8** (`@prisma/orm-postgres`) — PostgreSQL content layer (`prisma/`).
- **NextAuth** for Studio access; route security lives in `src/proxy.ts` (Next.js 16 convention — no `middleware.ts`).
- GSAP for motion; Three.js/WebGL as a progressive enhancement layer.

## Getting started

```bash
npm install
npm run dev          # dev server on http://localhost:3001
npm run build        # production build
npm run start        # serve production build on port 3001
npm run type-check   # tsc --noEmit
npm run db:push      # apply the Prisma schema
npm run db:seed      # seed starter content
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/services`, `/services/[slug]` | Services catalog and service detail |
| `/portfolio`, `/portfolio/[slug]` | Case studies |
| `/journal`, `/journal/[slug]` | Articles |
| `/about`, `/contact` | Studio profile and contact |
| `/admin` | Studio admin (content, media, SEO) |

## Brand

Official brand rules (palette, typography, tone of voice) live in **`AGENTS.md`** — the single
source of truth. Key tokens: Bright Yellow `#FFD600`, Cinematic Navy `#0F3A79`, Montserrat for
headings, Inter / Plus Jakarta Sans for body text.
