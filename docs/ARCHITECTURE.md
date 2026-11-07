# Arsitektur SPATIUM

Satu aplikasi Next.js 16 (App Router) yang berisi situs publik, Studio Admin (`/admin`), API konten, dan server MCP. Data tersimpan di PostgreSQL 16 lewat Prisma 8 (`@prisma/orm-postgres`).

```
Browser / klien MCP
   │
   ▼
src/proxy.ts ─ autentikasi /admin & /api, CORS Delivery API, header keamanan (CSP, HSTS, …)
   │
   ├─ Situs publik (Server Components, ISR)   src/app/{page,services,portfolio,journal,[slug],…}
   ├─ Studio Admin (client)                    src/app/admin/**, src/components/studio/**
   ├─ API Studio (session / RBAC)              src/app/api/**
   ├─ Delivery API (x-site-key)                src/app/api/v1/delivery/**
   └─ MCP (API key per klien)                  src/app/api/mcp
   │
   ▼
src/lib/** (domain & data access) ── prisma/db.ts ── PostgreSQL 16
```

## Prinsip

1. **Database adalah sumber kebenaran** untuk semua konten yang dikelola di Studio: artikel, halaman, portofolio, layanan, redirect, pengaturan. UI publik tidak membaca file seed. Error database dicatat dan ditampilkan sebagai state kosong yang jujur — tidak pernah diganti data palsu.
2. **Satu katalog blok** (`src/blocks/registry.ts`, satu modul per tipe di `src/blocks/<tipe>/`) dipakai editor, renderer, API manifest, dan MCP; `src/lib/blocks/catalog.ts` adalah fasadnya.
3. **Manusia yang mempublikasikan.** Klien MCP dan proses otomatis hanya membuat draft. Publikasi melewati gerbang publikasi.
4. **Setiap mutasi multi-tabel memakai transaksi**, lengkap dengan revisi (`ContentRevision`) dan audit log (`SeoAuditLog`).

## Situs publik

| Rute | Sumber data | Catatan |
|---|---|---|
| `/` | `Portfolio`, `ServiceCategory` + narasi brand (`src/config/spatium-story.ts`) | Hero 3D Gaussian Splat (Three.js) |
| `/services`, `/services/[slug]` | `ServiceCategory` (use case) + `Service` (kapabilitas) | Konten tambahan dari `blocks` |
| `/portfolio`, `/portfolio/[slug]` | `Portfolio` | Viewer SuperSplat |
| `/journal`, `/journal/[slug]` | `Article` | Sanitasi HTML |
| `/[slug]` | `Page` terbit → `BlockRenderer` | Lalu: artikel lama (308) → redirect DB → 404 |
| `/sitemap.xml` | Semua di atas | Revalidasi tiap jam + saat Studio menerbitkan |

Rute lama (`/layanan`, `/portofolio`, `/artikel`, `/solusi`, `/solutions`, `/kontak`, `/tentang`) di-308 di `next.config.mjs`; `/solusi` dan `/solutions` (fitur Solusi sudah dihapus) diarahkan ke `/services`. Redirect yang dikelola di Studio (tabel `redirects`) diterapkan oleh halaman detail sebelum mengembalikan 404 (`src/lib/redirects/resolve.ts`).

Header dan footer (root layout) membaca use case terbit dengan `show_in_nav` (`getUseCaseMenu`) dan profil sosial dari `site_configs.social_links` (`getSocialLinks`, hanya URL https); keduanya disembunyikan bila kosong. Sektor di `/about` dan `/services` diturunkan dari kategori portofolio terbit (`projectSectors`) — tidak ada sektor tanpa scene. Kontak publik berasal dari env `NEXT_PUBLIC_*` (`src/data/site.ts`) dan disembunyikan bila kosong.

Narasi brand yang bukan konten CMS (pipeline, manfaat, perbandingan media, cerita use case, nilai, FAQ kontak) ada di `src/config/spatium-story.ts`, bersumber dari deck produk.

## Studio Admin

- Shell: `src/app/admin/layout.tsx`. Daftar tab dan grup navigasi satu sumber di `src/lib/admin/tabs.ts`; `?tab=` di URL adalah state-nya.
- Tiap tab adalah komponen sendiri yang dimuat saat dibuka (`src/components/studio/admin/tabRegistry.tsx`) dan mengambil datanya sendiri.
- Grup tab: **Konten** (ringkasan, artikel, halaman, portofolio, layanan, blok, klien, media, CTA, kalender), **SEO** (kata kunci, audit, performa, GSC, redirect, URL lama), **Sistem & integrasi** (sistem, MCP), **Tata kelola** (pengguna, pengaturan).
- Editor: lihat [EDITORS.md](EDITORS.md).
- Komponen UI bersama: `src/components/admin/AdminUi.tsx` (dialog native `<dialog>`, field form, pesan status, tombol).

## Konten & data

| Domain | Kode |
|---|---|
| Blok | `src/lib/blocks/{schema,catalog,publication-gate}.ts`, `src/components/blocks/*` |
| Halaman dinamis | `src/lib/pages/*` (skema input, repository, gerbang, HTTP), `src/app/api/pages/**` |
| Artikel | `src/lib/db/articles.ts`, `src/lib/articles/*`, `src/app/api/articles/**` |
| Portofolio & layanan | `src/lib/content/spatium.ts` (adapter untuk UI publik), `src/lib/db/*` |
| SEO | `src/lib/seo/*` (analyzer, validasi gerbang artikel, indexing) |
| Penjadwalan | `src/lib/publishing/scheduler.ts`, dijalankan oleh `src/instrumentation.ts` |
| Seed | `scripts/seed.ts` + `src/data/seed/*.json` (hanya untuk mengisi database) |

## Autentikasi & otorisasi

- **Studio**: NextAuth v5 (credentials, JWT) di `/pawon`. Role: SUPER_ADMIN, CONTENT_ADMIN, EDITOR, AUTHOR, REVIEWER, SEO_MANAGER, MEDIA_MANAGER (`src/lib/auth/types.ts`). Role tak dikenal ditolak.
- **API Studio**: `requireUser` / `requireRole` (`src/lib/auth/rbac.ts`) di setiap handler mutasi, ditambah validasi Zod.
- **Delivery API**: header `x-site-key`, dibandingkan constant-time; placeholder ditolak di produksi.
- **MCP**: API key per klien dengan scope (lihat [MCP.md](MCP.md)).
- Detail: [SECURITY.md](SECURITY.md).

## Cache

Halaman publik memakai ISR (`revalidate` per rute). Mutasi dari Studio memanggil `revalidatePath` untuk rute yang terdampak; webhook `POST /api/revalidate` tersedia untuk pemicu eksternal.

## Dokumen terkait

- [DEVELOPMENT.md](DEVELOPMENT.md) — setup lokal, skema, verifikasi
- [DEPLOYMENT.md](DEPLOYMENT.md) — Docker/Coolify, variabel env
- [BLOCKS.md](BLOCKS.md) — sistem blok
- [EDITORS.md](EDITORS.md) — editor artikel & blok, halaman dinamis
- [MCP.md](MCP.md) — server MCP
- [SECURITY.md](SECURITY.md) — model keamanan
- [brand-guideline/README.md](brand-guideline/README.md) — merek SPATIUM
