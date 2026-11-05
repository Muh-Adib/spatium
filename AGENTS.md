# AGENTS.md — UNIMASI Studio (Official Source of Truth)

Version: 1.0
Audience: Human engineers, AI coding agents, architecture reviewers, MCP automations

---

## 0. Mission & Repo Purpose

Repo ini adalah **website immersive UNIMASI Studio** — Animation & Motion Design Studio. Tujuan: mendorong penjualan jasa animasi (2D, 3D, motion graphics, digital visual assets & AI-assisted production) ke audien lokal dan global melalui pengalaman web premium berbasis interaksi, animasi GSAP + Three.js/WebGL, dan konten editorial berkualitas tinggi (non-hard-sell, keyword deskripsi transaksional).

UNIMASI menyediakan 4 layanan inti (sumber kanonis: `unimasi-brand.png`; katalog turunan lengkap di `docs/services/service-catalog.md`):
1. **01 2D Animation** — 2D Explainer, 2D Educational, 2D Character, 2D Infographic, 2D Illustration, 2D Training & Safety Animation.
2. **02 3D Animation & Visual Production** — 3D Product, 3D Industrial, 3D Architectural Visualization, 3D Modeling & Texturing, 3D Character, 3D Process Visualization, 3D Asset Production.
3. **03 Motion Graphics** — Corporate Motion Graphics, Kinetic Typography, Animated Infographics, Logo Animation, UI Motion Graphics, Motion Graphics Package, Video Graphics & Compositing.
4. **04 Digital Visual Assets & AI-Assisted Production** — 3D Asset Library, Real-Time 3D Assets, Animation Assets, AI-Assisted Visual Production, High-Volume Visual Production.

Stack: Next.js 16 (App Router, Turbopack) + React 19 + PostgreSQL 16 via Prisma 8 ORM (`@prisma/orm-postgres`), NextAuth, Tailwind v3, GSAP, Three.js/WebGL. Port dev: 3001. Port start: 3001.

Repo ini **unified**: public site + Studio Admin (`/admin`) + backend engine (Delivery API, AI Copilot, agentic loop) dalam satu aplikasi. Bukan headless decoupled seperti SegiaTech.

Kontak terverifikasi (dari `unimasi-brand.png`): `www.unimasi.id`, `@unimasi`. Domain alternatif di kode: `unimasi.studio` (site.ts/email/Instagram) — **selisih, `needs-confirmation`** (lihat `docs/CONTENT_GAPS.md` item 1–5). Jangan tampilkan email/telepon/alamat lain di footer/JSON-LD sebelum dikonfirmasi.

---

## 1. Brand Identity (Ringkas — detail di §6)

- **Brand**: UNIMASI — Animation & Motion Design Studio
- **Tagline**: "We Make Ideas Move" | "Make Ideas Move, Explain the Complex"
- **Posisi**: Studio animasi terdepan — mengubah ide teknis dan kompleks menjadi pengalaman visual yang memukau melalui animasi dan motion design. Mengutamakan storytelling dan keahlian spesialis senior pada setiap frame untuk membantu audiens memahami subjek rumit secara visual dan intuitif.
- **Karakter Studio**: Specialist, Transparent, Story-driven.
- **Palet**: Bright Yellow `#FFD600`, Dark Blue `#0F3A79`, Pure White `#FFFFFF`.
- **Font**: Heading `Montserrat` (Regular, Medium, Bold), Body `Sans Serif Regular` (Regular, Medium, Bold, Black).
- ALL CAPS hanya untuk judul utama/headline penekanan informasi penting.

Tone of voice: Clear & Transparent — komunikasi terbuka tanpa "black boxes", terjemah subjek teknis ke alur visual terstruktur, praktis tanpa jargon kosong.

---

## 2. Architecture & Key Directories

```
unimasi/
├── src/
│   ├── app/                # Next.js 16 App Router (pages + API routes)
│   │   ├── admin/          # Studio Admin (content, media, SEO, blocks)
│   │   ├── api/
│   │   │   ├── v1/delivery/*  # Headless Delivery API
│   │   │   ├── ai/*            # Studio AI Copilot (chat, draft, models, sessions, memory, tools)
│   │   │   ├── agent/tools     # Tool registry HTTP surface
│   │   │   ├── mcp             # MCP server status endpoint
│   │   │   ├── seo/*           # SEO analyzer, suggest
│   │   │   ├── blocks/manifest  # Block manifest
│   │   │   ├── revalidate      # On-demand ISR webhook
│   │   ├── [slug]/page.tsx     # Dynamic pages
│   │   ├── services/*, portfolio/*, journal/*, about, contact
│   ├── blocks/             # Unimasi SDUI blocks (HeroCinema, ProcessTimeline, StatsTicker, InteractiveCta, TextEditorial) + contracts + registry + BlockRenderer
│   ├── components/         # UI, sections, studio editors, motion
│   ├── lib/
│   │   ├── agent/          # ToolRegistry + LLM (Gemini/OpenRouter)
│   │   ├── ai/             # Agentic loop, copilot runner, draft, sessions, tools, token optimizer
│   │   ├── blocks/         # Ontology, schema, publication-gate, manifestSync, animation, perf-budget, seo-text
│   │   ├── db/             # Prisma 8 data access (articles, portfolio, services, media, redirects, etc.)
│   │   ├── seo/            # Analyzer, readability, metadata, jsonld, indexing, indexnow
│   │   ├── voice/          # Brand voice checker & stylometry
│   │   ├── graph/          # Content graph
│   │   ├── publishing/     # Scheduler, validation
│   │   ├── webhooks/       # Dispatcher
│   ├── config/             # site.ts, navigation.ts (NAV, CONTACT, PROCESS, VALUES, INDUSTRIES, SOCIALS)
│   ├── data/               # Static data + seed JSON
│   ├── proxy.ts            # Next.js 16 proxy (auth, CORS, security headers)
│   ├── auth.ts             # NextAuth
├── prisma/                 # schema.prisma + migrations
├── scripts/                # seed.ts
├── public/                 # static assets
├── docs/                   # dokumentasi brand (company-profile, brand-identity, brand-guideline, services)
```

---

## 3. Invariant Engineering Rules

### 3.1 Next.js 16 Proxy Convention (STRICT)
- Gunakan `src/proxy.ts` SAJA. JANGAN buat `middleware.ts`. Co-existence menyebabkan fatal compile error.
- Session validation, route guarding, Delivery API CORS, security headers — semua di `src/proxy.ts`.

### 3.2 Prisma 8 ORM
- PostgreSQL 16 via `@prisma/orm-postgres`. Jangan pakai Drizzle/SQLite legacy.
- Query via `prisma.orm.public.*` atau Prisma Client di `src/lib/db/prisma.ts`.
- Schema: `prisma/schema.prisma`. Migrasi: `npm run db:push` / `npx prisma db migrate`.

### 3.3 Headless Delivery API (`/api/v1/delivery/*`)
- Multi-tenant: wajib header `x-site-key` (atau query `siteKey`). Verifikasi constant-time (`crypto.timingSafeEqual`).
- Production: placeholder keys ditolak 401.
- Edge caching: setiap GET Delivery emit `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` + `CDN-Cache-Control: max-age=3600`.
- CORS: OPTIONS preflight → 204 + `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Content-Type, x-site-key`.

### 3.4 On-Demand ISR Webhooks
- Saat konten → `published`, trigger `dispatchWebhookRevalidation()` (non-blocking).
- Auth via `x-revalidate-secret`.

### 3.5 Safe Editorial Lifecycle & Publication Gate
- Transisi status: `DRAFT` → `IN_REVIEW` → `APPROVED` → `PUBLISHED` → `ARCHIVED`.
- Gate sebelum publish: valid SDUI block schemas (Zod), non-empty `metaTitle` & `metaDescription`, semua image punya `alt`, tenant-scoped slug unik.
- AI Copilot & MCP/agent HANYA generate `DRAFT`. Dilarang publish sepihak.

### 3.6 Studio AI Copilot & ReAct Loop
- Reasoning first; LLM pilih tools via Function Calling.
- Multi-turn loop hingga 10 iterasi.
- Context decoupling: gunakan tool `inspect_active_article` on-demand, jangan inject artikel penuh ke system prompt.
- Bi-provider schema normalization: semua tool schema support Google Gemini dan OpenRouter/OpenAI.

### 3.7 Agent Tool Registry
- ToolRegistry di `src/lib/agent/registry.ts`. Scope: `read` | `draft` | `admin`. **Tidak ada scope `publish`**.
- Tools: post-migration SEO (migration_traffic_diff, redirect_chain_audit, find_striking_distance, find_cannibalization, find_low_ctr, detect_content_decay, find_content_gaps), DB query (articles/portfolio/services/solutions/service-categories), create_article_draft, redirect_301_inspector, system_status, submit_indexnow, list_block_types, validate_page_blocks, sync_content_node, find_link_targets, suggest_internal_links, update_article_content, inspect_article_seo, get_block_catalog, compose_page_blocks, get_voice_profile, check_voice_match.

### 3.8 Block System (Server-Driven UI)
- Kontrak blok: `src/blocks/contracts.ts` (HeroCinema, ProcessTimeline, StatsTicker, InteractiveCta, TextEditorial, BaseBlockMeta).
- Manifest: `src/blocks/registry.ts` (`UNIMASI_BLOCK_MANIFEST`, `BLOCK_COMPONENT_REGISTRY`).
- Ontology dinamis: `src/lib/blocks/ontology.ts` — blok: paragraph, heading2, heading3, table, feature-bento-grid, faq-accordion, studio-cta, internal-links.
- BlockRenderer: `src/blocks/BlockRenderer.tsx`.
- Validasi: `parseBlocks` (Zod). Gerbang publikasi via `src/lib/blocks/publication-gate.ts`.

### 3.9 MCP / A2A
- Endpoint status: `/api/mcp` (GET/POST, auth required). Admin UI menyediakan snippet konfigurasi MCP client (Antigravity, Claude, Cursor, Windsurf, Codex).
- A2A: agent loop + tool registry diekspos via `/api/agent/tools` dan `/api/ai/*`.

### 3.10 Senior Engineering & Code Quality Invariants (MANDATORY)
- **Zero Silent Failures**: Dilarang menggunakan empty catch blocks (`catch {}`). Semua error wajib ditangani dan observable (logging terstruktur via `console.warn`/`console.error` atau return payload terukur).
- **Defense-in-Depth Trust Boundary**: Setiap route handler mutasi (`POST`/`PUT`/`DELETE`) wajib memvalidasi otorisasi di server (session NextAuth / Bearer token / proxy guard) dan memvalidasi tipe/skema runtime (Zod), bukan sekadar mengandalkan validasi di UI.
- **Data Atomicity & Concurrency**: Setiap mutasi multi-tabel wajib dibungkus dalam transaksi Prisma (`prisma.$transaction`) untuk mencegah state inkonsisten.
- **Type Safety Strictness**: Hindari `as any` dan non-null assertion `!`. Gunakan TypeScript discriminated unions, type narrowing, atau inferensi skema Zod.
- **Security & Data Exposure**: Dilarang membocorkan raw error stack trace (`err.stack`) ke dalam response JSON di lingkungan produksi.
- **Resource & Performance Budget**: Setiap komponen `<Image>` wajib memiliki atribut `alt` eksplisit; fallback data kosong wajib bersih (`null`), dilarang memunculkan metrik atau aset fiktif.
- **Automated Verification**: Jalankan `npm run audit:senior` untuk memverifikasi kepatuhan seluruh aturan ini sebelum merge/publish.

### 3.11 Content Authenticity & Dynamic Data Invariants (Zero-Mock Policy)
- **Single Source of Truth**: Seluruh konten bisnis yang dikelola admin (Artikel, Layanan, Portofolio, Klien, Redirects) wajib bersumber dari database PostgreSQL melalui Prisma 8 ORM. CMS-managed content dilarang keras membaca data statis.
- **Zero Fictional Business Data**: Tidak boleh menggunakan fictional business data, angka karangan, metrik palsu, atau logo klien tanpa konfirmasi tertulis pada production runtime.
- **No Direct Seed/Fixture Imports on Production UI**: Dilarang mengimpor file seed (`@/data/seed/*`) atau fixture langsung ke dalam komponen UI produksi, sitemap, atau delivery API. File seed hanya diperuntukkan bagi migration/seeding script.
- **No Fictional / Camouflaged Fallbacks**: Dilarang menggunakan fake fallback (`dbData || MOCK_DATA` atau `catch { return seedData }`) untuk menutupi database error atau hasil query kosong. Bedakan database error (observable logging) dengan empty result; sajikan empty state yang jujur (`null` atau empty array `[]`).
- **Centralized Business Configuration**: Semua konfigurasi bisnis dinamis (kontak, WhatsApp, alamat, jam kerja, dsb.) harus memiliki sumber terpusat melalui `SiteConfig` di database atau fallback terverifikasi di `siteConfig` / `companyInfo`. Dilarang menyebarkan hardcoded kontak acak di JSX.
- **Contextual Static Content**: Static data yang sah (metodologi brand, enumerasi, navigation structure fallback, UI design tokens) harus memiliki konteks dan alasan arsitektural yang jelas.
- **Pre-Implementation Source of Truth Definition**: Setiap data atau entitas baru wajib ditentukan dan didokumentasikan source of truth-nya di database sebelum implementasi kode.
- **End-to-End Traceability**: Setiap perubahan yang disimpan melalui Studio Admin wajib tercermin pada halaman publik terkait tanpa "Ghost CMS" (`Admin CRUD → Database → Query/Service → Server Component/API → Public UI`).

### 3.12 Mandatory Package Manager: pnpm (STRICT)
- **Hanya gunakan pnpm (`pnpm@11.18.0`+)**: Dilarang keras menggunakan `npm` atau `yarn`. File `package-lock.json` dan `yarn.lock` dilarang ada di repositori.
- Konfigurasi `.npmrc` dengan `auto-install-peers=true`, `strict-peer-dependencies=false`, dan `shamefully-hoist=true` adalah wajib.
- Guard `preinstall: "npx only-allow pnpm"` terpasang aktif di `package.json`.
- Seluruh script verifikasi, build, database, dan dev server wajib dieksekusi via `pnpm` (misal: `pnpm run dev`, `pnpm run build`, `pnpm run typecheck`, `pnpm run db:push`).

---

## 4. Agentic Architecture & Content Workflow

- **ReAct Loop**: `src/lib/ai/agent-loop.ts` — multi-turn tool calling (Google Gemini & OpenRouter), hingga 10 iterasi.
- **Agentic Article Loop**: `executeAgenticArticleLoop` — inspect → mutate → re-evaluate, target SEO ≥85 & readability ≥85, max 5–10 langkah.
- **Universal Refinement**: `refineArticleContent` — optimasi judul, meta title, meta description, cover alt, konten (keyphrase intro/H2, split kalimat, transisi, internal/external links, word count ≥300).
- **Key Rotation**: `executeWithResilientRotation` — failover API key + fallback model pada HTTP 429.
- **Content Graph**: `src/lib/graph/*` — content_nodes, internal link targets, sync.
- **Voice/Brand**: `src/lib/voice/*` — profil tone, stylometry, forbidden phrases.

**Aturan konten (non-hard-sell, keyword transaksional)**:
- Artikel = wawasan teknis animasi berkualitas tinggi, bukan hard sell.
- Meta description & tag deskripsi menggunakan kalimat transaksional (siap konsultasi/produksi) dengan fokus keyphrase.
- Setiap artikel wajib lolos publication gate (meta, alt, slug unik, block schema).
- AI hanya draft; human review wajib sebelum publish.

---

## 5. Verification & Quality Gates

```bash
pnpm run typecheck     # tsc --noEmit (0 errors)
pnpm run build         # Next.js 16 Turbopack build
pnpm run db:push       # apply Prisma schema
pnpm run db:seed       # seed starter content (pnpm dlx tsx scripts/seed.ts)
```

Dev server: `pnpm run dev` → http://localhost:3001.

---

## 6. Brand Guidelines (Official — JANGAN diubah tanpa approval)

Sumber otoritatif: `docs/brand-guideline/Brand_Guidelines_Unimasi_Compressed.pdf` (lebih otoritatif dari Markdown). Turunan: `docs/brand-identity/brand_guidelines_unimasi_ai.md`. Identitas perusahaan induk: `docs/company-profile/PT-UDP-main-company.png`.

### 6.1 Identity & Positioning
- Brand Name: UNIMASI
- Descriptor: Animation & Motion Design Studio
- Taglines: "We Make Ideas Move" | "Make Ideas Move, Explain the Complex"
- Core Purpose: Mengubah ide teknis dan kompleks menjadi pengalaman visual yang memukau melalui animasi dan motion design. Mengutamakan storytelling dan keahlian spesialis senior pada setiap frame untuk membantu audiens memahami subjek rumit secara visual dan intuitif.
- Vision: Menjadi studio animasi terdepan yang dikenal dalam mengubah hal-hal teknis yang rumit menjadi komunikasi visual yang jelas, berkesan, dan tepat sasaran.
- Mission: Menghasilkan animasi 2D, 3D, dan motion graphics dengan kualitas produksi tinggi dan sistem alur kerja terstruktur guna menjawab kebutuhan komunikasi visual di berbagai sektor industri.
- Studio Personality: Specialist, Transparent, Story-driven.

### 6.2 Color Palette
| Token | Hex | Name | Usage |
|---|---|---|---|
| Primary Accent | `#FFD600` | Bright Yellow | Aksen utama untuk elemen interaktif, CTA, penekanan visual, aksen dinamis animasi |
| Brand Surface / Background | `#0F3A79` | Dark Blue | Latar belakang elegan, stabilitas, mendukung visual dark mode sinematik |
| Neutral / Contrast | `#FFFFFF` | Pure White | Teks utama di atas Dark Blue, white space, penyeimbang kontras visual |

### 6.3 Typography
- Heading: `Montserrat` (Regular, Medium, Bold) — ALL CAPS hanya untuk judul utama/headline penekanan informasi penting.
- Body: `Sans Serif Regular` (Regular, Medium, Bold, Black) — sentence case untuk paragraf naratif, deskripsi, teks penjelas. Hierarki ukuran sesuai media (digital/print).

### 6.4 Tone of Voice: Clear & Transparent
- Transparent: Komunikasi terbuka dan lugas tanpa "kotak hitam" (no black boxes) di setiap tahapan pipeline kreatif/teknis.
- Clear: Menguraikan dan menerjemahkan subjek teknis berat menjadi alur naratif terstruktur yang mengalir serta mudah diikuti audiens non-teknis.
- Practical: Berbicara dengan perspektif keahlian senior dan solusi visual konkret, bukan jargon industri yang mengawang-awang.

### 6.5 4 Core Services
1. **01 2D Animation** — 2D Explainer, 2D Educational, 2D Character, 2D Infographic, 2D Illustration, 2D Training & Safety Animation.
2. **02 3D Animation & Visual Production** — 3D Product, 3D Industrial, 3D Architectural Visualization, 3D Modeling & Texturing, 3D Character, 3D Process Visualization, 3D Asset Production.
3. **03 Motion Graphics** — Corporate Motion Graphics, Kinetic Typography, Animated Infographics, Logo Animation, UI Motion Graphics, Motion Graphics Package, Video Graphics & Compositing.
4. **04 Digital Visual Assets & AI-Assisted Production** — 3D Asset Library, Real-Time 3D Assets, Animation Assets, AI-Assisted Visual Production, High-Volume Visual Production.

### 6.5b Cara menambah core layanan / kategori / turunan
- **Manual (admin)**: Studio Admin → Services Manager (`src/components/studio/StudioServicesManager.tsx`) — tambah/ubah/urutkan/nonaktifkan `ServiceCategory` (core) dan `Service` (turunan).
- **Agent/MCP**: tool `db_services_query`, `sqlite_service_categories_query`, `create_article_draft` (konten), dan `update_article_content`. Penambahan layanan oleh agent wajib lewat publication gate + alert + preview (FASE 6f), tercatat di audit log dengan actor `agent:<nama>`.
- **Aturan**: turunan baru yang tidak ada di `service-catalog.md` berstatus `proposed` → `draft` sampai dikonfirmasi pemilik.

### 6.6 Visual Style
- Aesthetic: Cinematic, Dynamic, & High-Contrast.
- Komposisi: Pemanfaatan palet gelap elegan yang dihidupkan dengan highlights kuning cerah energik. Memadukan aset storyboard 2D presisi, visualisasi wireframe 3D teknis, dan motion design dinamis. Setiap visual mengantar audiens melewati perjalanan visual terstruktur.
- Do: palet resmi (`#FFD600`, `#0F3A79`, `#FFFFFF`), logo dengan clear-space proporsional, komunikasikan konsep kompleks dengan bahasa solutif, percaya diri, dan jelas, tata letak terstruktur rapi berfokus pada motion.
- Don't: campur font tidak berizin, variasi warna di luar panduan, distorsi/stretch/crop/ubah warna logo/watermark, tata letak visual berantakan/clutter, gaya bahasa terlalu santai/informal, sarkastik, atau bernada samar.

### 6.7 PT UDP (Perusahaan Induk)
- PT UDP merupakan badan usaha resmi yang menaungi website UNIMASI (dan brand lain: Erfo, Segia).
- Informasi perusahaan induk **harus dibedakan** dari identitas, positioning, layanan, dan komunikasi UNIMASI. Jangan campur informasi PT UDP dengan layanan brand apabila konteksnya berbeda.
- Referensi visual perusahaan induk: `docs/company-profile/PT-UDP-main-company.png`.

---

## 7. Next.js 16 Agent Rules (auto-generated, jangan buang)

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
