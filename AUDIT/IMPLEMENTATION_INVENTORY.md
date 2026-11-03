# IMPLEMENTATION INVENTORY — UNIMASI STUDIO
**Auditor**: Principal Software Architect & Adversarial System Auditor  
**Audit Standard**: Zero-Trust (NO EVIDENCE = NO PASS)  
**Date**: 2026-11-03  
**Database Engine**: PostgreSQL 16 via Prisma 8 ORM (`@prisma/orm-postgres`)  
**Frontend / Server Engine**: Next.js 16.4.2 (App Router, Turbopack) + React 19.3.1  

---

## 1. System Architecture & Boundaries

```
[Public Visitor / Crawler]          [Studio Administrator / Editor]
        │                                         │
        ▼                                         ▼
Next.js 16 App Router Proxy (`src/proxy.ts` / NextAuth / Security Headers)
        │                                         │
        ├───────────────────┬─────────────────────┤
        ▼                   ▼                     ▼
[Public Pages]     [Studio Admin /api/**]   [Headless Delivery API]
  / (Home)           /admin (Cockpit)         /api/v1/delivery/articles
  /services/*        /admin/buat-artikel      /api/v1/delivery/services
  /portfolio/*       /admin/preview/*         /api/v1/delivery/portfolios
  /journal/*         /api/articles            /api/v1/delivery/pages
  /about             /api/articles/lock       /api/v1/delivery/blocks
  /contact           /api/ai/*                /api/v1/delivery/redirects
                     /api/users               /api/v1/delivery/seo
                            │
                            ▼
              [Prisma 8 ORM PostgreSQL Layer]
                  47 Physical DB Tables
```

---

## 2. Comprehensive Implementation Inventory

| ID | Module / Domain | Feature | Entry Point / Path | Current Status | Notes & Verification Scope |
|---|---|---|---|---|---|
| **FE-01** | Public Frontend | Cinema Hero Section | `src/components/home/Hero.tsx` | `IMPLEMENTED` | Real showreel `.webm`, 4-discipline switcher, HUD reel timer, interactive pipeline. |
| **FE-02** | Public Frontend | WebGL Particle Stage | `src/components/webgl/AnimationWebGL.tsx` | `IMPLEMENTED` | Three.js particle constellation (#FFD600/#0F3A79), raycaster parallax, zero-leak dispose. |
| **FE-03** | Public Frontend | Services Showcase | `src/app/services/page.tsx` | `IMPLEMENTED` | 4 canonical services (2D Animation, 3D CGI, Motion Graphics, Digital Visual Assets & AI). |
| **FE-04** | Public Frontend | Service Detail Page | `src/app/services/[slug]/page.tsx` | `IMPLEMENTED` | Dynamic block renderer + technical pipeline specs. |
| **FE-05** | Public Frontend | Portfolio Showcase | `src/app/portfolio/page.tsx` | `IMPLEMENTED` | 8 authentic client production items (Telkom, YPTI, Mercu Buana, UGM, Sanata Dharma, etc.). |
| **FE-06** | Public Frontend | Portfolio Detail Case Study | `src/app/portfolio/[slug]/page.tsx` | `IMPLEMENTED` | Video showcase, project metadata, technical scope. |
| **FE-07** | Public Frontend | Journal Index & Pagination | `src/app/journal/page.tsx` | `IMPLEMENTED` | 1,144 published articles via Delivery API/core layer with 12 items/page. |
| **FE-08** | Public Frontend | Journal Detail Post | `src/app/journal/[slug]/page.tsx` | `IMPLEMENTED` | Complete article rendering with Yoast SEO schema and breadcrumbs. |
| **FE-09** | Public Frontend | About Page | `src/app/about/page.tsx` | `IMPLEMENTED` | Studio manifesto, brand colors, PT UDP legal corporate separation. |
| **FE-10** | Public Frontend | Contact Page | `src/app/contact/page.tsx` | `IMPLEMENTED` | Contact channels (`www.unimasi.id`, `@unimasi`). |
| **FE-11** | Public Frontend | Dynamic CMS Page Router | `src/app/[slug]/page.tsx` | `IMPLEMENTED` | Resolves custom static/dynamic pages with block rendering. |
| **ADM-01** | Studio Admin | Authentication & Route Guard | `src/proxy.ts`, `src/auth.ts` | `IMPLEMENTED` | NextAuth v5 JWT, protected `/admin` & `/api/**` with public whitelist. |
| **ADM-02** | Studio Admin | Dual-Identifier Login | `src/lib/auth/credentials.ts` | `IMPLEMENTED` | Allows login via WordPress email or username (`Adib IT`). |
| **ADM-03** | Studio Admin | Multi-User Management | `src/components/studio/StudioUsersManager.tsx` | `IMPLEMENTED` | 8 WordPress users synced, role RBAC management. |
| **ADM-04** | Studio Admin | Article Editor (Block & Raw) | `src/app/admin/buat-artikel/page.tsx` | `IMPLEMENTED` | Full block editor, live preview, SEO inspector, publication gate modal. |
| **ADM-05** | Studio Admin | Real-Time Multi-User Presence | `src/app/api/articles/lock/route.ts` | `IMPLEMENTED` | Heartbeat polling (25s) with active editor warning banner. |
| **ADM-06** | Studio Admin | Optimistic Concurrency Control | `src/app/api/articles/route.ts` (PATCH) | `IMPLEMENTED` | HTTP 409 Conflict detection on outdated `expectedUpdatedAt`. |
| **ADM-07** | Studio Admin | Portfolio Manager | `src/components/studio/StudioPortfolioManager.tsx` | `IMPLEMENTED` | CRUD portfolio items and case studies. |
| **ADM-08** | Studio Admin | Services Manager | `src/components/studio/StudioServicesManager.tsx` | `IMPLEMENTED` | Category & service ordering and metadata. |
| **ADM-09** | Studio Admin | Media Manager & Upload | `src/app/api/upload/route.ts`, `src/app/api/media/route.ts` | `IMPLEMENTED` | File upload with magic-number validation and image metadata. |
| **ADM-10** | Studio Admin | AI Copilot Chat & Agent | `src/app/api/ai/chat/route.ts`, `src/lib/ai/*` | `IMPLEMENTED` | Bi-provider (Gemini / OpenRouter), function calling tools. |
| **API-01** | Headless API | Delivery Articles | `src/app/api/v1/delivery/articles/route.ts` | `PARTIALLY_IMPLEMENTED` | Works but `Site` table lacked seeded tenant entity. |
| **API-02** | Headless API | Delivery Services | `src/app/api/v1/delivery/services/route.ts` | `IMPLEMENTED` | Serves public services with CDN cache headers. |
| **API-03** | Headless API | Delivery Portfolios | `src/app/api/v1/delivery/portfolios/route.ts` | `IMPLEMENTED` | Serves portfolio items with CDN cache headers. |
| **API-04** | Headless API | Delivery Block Sync | `src/app/api/v1/delivery/blocks/sync/route.ts` | `IMPLEMENTED` | Ingests SDUI block manifests. |
| **API-05** | Headless API | Delivery SEO Metadata | `src/app/api/v1/delivery/seo/route.ts` | `IMPLEMENTED` | Canonical, JSON-LD, robots verification. |
| **SEC-01** | Security | Security Headers & CSP | `src/proxy.ts` | `IMPLEMENTED` | X-Frame-Options, X-Content-Type-Options, CSP with Vimeo/YouTube/Unimasi allowances. |
| **SEC-02** | Security | SSRF Protection | `src/lib/security/ssrf.ts` | `IMPLEMENTED` | Blocks internal private IP ranges (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, AWS metadata). |
| **SEC-03** | Security | HTML Sanitization | `src/lib/security/sanitize-html.ts` | `IMPLEMENTED` | Strips unsafe script/style/iframe tags from article HTML. |
| **SEO-01** | SEO Engine | Publication Gate | `src/lib/seo/validation.ts` | `IMPLEMENTED` | Enforces meta title (≤60 chars), meta desc (≤160 chars), image alt text, keyphrase presence. |
| **SEO-02** | SEO Engine | IndexNow Submission | `src/app/api/indexnow/route.ts` | `IMPLEMENTED` | Submits published URLs to Bing / IndexNow protocol. |
| **SEO-03** | SEO Engine | Automated Publishing Scheduler | `src/lib/publishing/scheduler.ts` | `IMPLEMENTED` | Auto-transitions `scheduled` articles to `published` when `scheduledAt <= NOW()`. |

---

## 3. Discovered Vulnerabilities & Implementation Gaps (Audit Target)

1. **Missing `Site` record in PostgreSQL database (`Site` table empty)**:
   - *Impact*: In production or strict Delivery API auth (`src/lib/delivery/auth.ts`), API requests without `Site` records in DB return 403 Forbidden.
   - *Severity*: P1 (High).
2. **Missing Unit / Integration Test Runner in `package.json`**:
   - *Impact*: No automated Vitest test script configured in `package.json` (`npm test` does not exist).
   - *Severity*: P1 (High).
3. **Delivery API Error Fallback relies on synchronous `require('@/data/seed/seed_articles.json')`**:
   - *Impact*: Memory overhead when seed file is >4MB.
   - *Severity*: P2 (Medium).
