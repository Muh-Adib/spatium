# Content Inventory — UNIMASI

Audit konten per 2026-11-02. Acuan: `unimasi-brand.png` + PDF + situs live `www.unimasi.com` (bila dapat diakses).

## Halaman publik (dari `next build`)

| URL | Tipe | Judul | Status | Tindakan |
|---|---|---|---|---|
| `/` | Landing | Home | `fixed` | Hero "We Make Ideas Move"; selaraskan dengan situs asli |
| `/about` | Page | About | `fixed` | Hapus kontak placeholder |
| `/services` | Page | Services | `fixed` | Tampilkan 4 core → turunan |
| `/services/2d-animation` | Service | 2D Animation | `fixed` | 6 turunan sesuai katalog |
| `/services/3d-animation` | Service | 3D Animation & Visual Production | `fixed` | 7 turunan sesuai katalog |
| `/services/motion-graphics` | Service | Motion Graphics | `fixed` | 7 turunan sesuai katalog |
| `/services/digital-assets-ai` | Service | Digital Visual Assets & AI-Assisted Production | `fixed` | 5 turunan sesuai katalog |
| `/portfolio` | Page | Portfolio | `needs-confirmation` | Cover logo klien → frame proyek |
| `/portfolio/[slug]` | Detail | 6 proyek | `needs-confirmation` | Angka hasil belum terverifikasi |
| `/journal` | Page | Articles | `fixed` | Rute artikel = `/journal` (bukan `/artikel`) |
| `/journal/[slug]` | Detail | 15 artikel | `fixed` | Audit klaim |
| `/contact` | Page | Contact | `needs-confirmation` | Placeholder `+00 000 000 000` |
| `/[slug]` | Dynamic | 6 halaman CMS | `match` | — |

## Seed

| File | Jumlah | Status |
|---|---|---|
| `seed_services.json` | 4 (datar, `categoryId: null`) | `missing` — perlu kategori + 25 turunan |
| `seed_portfolio.json` | 6 | `needs-confirmation` — cover logo klien, angka tidak terverifikasi |
| `seed_articles.json` | 15 | `fixed` — audit klaim |
| `seed_pages.json` | 6 | `match` |
| `seed_partners.json` | 34 logo | `missing` — identik dengan ERFO |
| `seed_redirects.json` | 0 | `missing` — situs WP lama punya URL yang harus dilindungi |

## Temuan kunci

1. **Rute artikel `/journal`** tetapi scheduler me-revalidate `/artikel` → artikel terjadwal tidak ter-refresh.
2. **`seed_redirects.json` kosong** padahal situs WordPress lama punya URL terindeks → risiko kehilangan SEO.
3. **Portfolio** memakai logo klien sebagai cover (`/images/clients/unified-gray/*`), bukan frame proyek.
4. **34 logo klien identik** dengan repo ERFO.
5. **Data statis ganda**: `src/data/articles.ts`, `clients.ts`, `projects.ts`, `services.ts`, `site.ts`.

## Gerbang FASE 3

- [x] Setiap halaman punya baris dengan status
- [x] Setiap seed punya status
- [x] Temuan kunci tercatat
- [ ] `seo-parity.csv` (butuh akses situs live — lihat `CONTENT_GAPS.md`)
