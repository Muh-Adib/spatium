# AGENTS.md — SPATIUM

Instruksi untuk engineer dan agen koding yang bekerja di repo ini. Detail arsitektur ada di [`docs/`](docs/README.md); dokumen ini memuat aturan yang wajib dipatuhi.

## 1. Apa repo ini

Situs dan Studio Admin **SPATIUM — Spatial Technology Studio** (digital twin untuk industri kreatif: laser scan → point cloud → 3D geometry → 3D Gaussian Splat). Satu aplikasi Next.js 16 berisi situs publik, Studio Admin (`/admin`), API konten, Delivery API, dan server MCP.

- Stack: Next.js 16 (App Router), React 19, Tailwind v3, PostgreSQL 16 via Prisma 8 (`@prisma/orm-postgres`), NextAuth v5, Zod 4, GSAP, Three.js.
- Port dev/start: **3002**.
- Merek: [`docs/brand-guideline/README.md`](docs/brand-guideline/README.md). Sumber otoritatif: PDF product knowledge dan HTML portofolio di folder yang sama.

## 2. Peta kode

```
src/
├── app/                 # Rute (situs publik, /admin, /api/**, /[slug] halaman dinamis)
├── blocks/              # Komponen blok tertentu (HeroCinema, ProcessTimeline, …)
├── components/
│   ├── blocks/          # BlockRenderer + komponen blok katalog
│   ├── studio/          # UI Studio: blocks/ (editor blok), pages/, editor/ (artikel), mcp/, admin/ (tab)
│   ├── spatium/         # Homepage (hero splat, section naratif)
│   └── layout/          # Header, footer
├── lib/
│   ├── blocks/          # schema.ts (Zod), catalog.ts (katalog), publication-gate.ts
│   ├── pages/           # Halaman dinamis: skema input, repository, gerbang, HTTP
│   ├── mcp/             # Server MCP: protokol, tools, API key, rate limit
│   ├── articles/        # Model editor artikel, kunci editor
│   ├── content/         # Adapter konten untuk UI publik
│   ├── db/              # Akses data Prisma
│   ├── auth/            # NextAuth, RBAC, kredensial
│   ├── seo/, publishing/, redirects/, security/, admin/
├── config/              # site.ts, spatium-story.ts (narasi brand non-CMS)
├── data/seed/           # JSON seed — HANYA untuk scripts/seed.ts
├── proxy.ts             # Auth, CORS, header keamanan (Next 16; JANGAN buat middleware.ts)
└── instrumentation.ts   # Menjalankan penjadwal publikasi
prisma/                  # schema.prisma + kontrak hasil generate (schema.json, schema.d.ts)
docs/                    # Dokumentasi arsitektur & merek
tests/                   # Vitest (sebagian memakai database lokal)
```

## 3. Aturan wajib

### 3.1 Next.js 16
- Gunakan `src/proxy.ts`. **Jangan** membuat `middleware.ts`.
- Baca panduan di `node_modules/next/dist/docs/` sebelum memakai API yang belum Anda kenal (lihat §6).

### 3.2 Database (Prisma 8)
- Akses lewat `prisma.orm.public.<Model>`; transaksi dengan `prisma.transaction(async (tx) => …)`.
- Ubah skema: edit `schema.prisma` → `pnpm exec prisma contract emit` → `pnpm run db:push` → commit ketiga file. Kolom `updatedAt` memakai `TimestamptzString @onCreate(now()) @onUpdate(now())`.
- Jangan menghapus/mengubah kolom produksi tanpa rencana migrasi dan backup.

### 3.3 Konten jujur (Zero-Mock)
- Konten yang dikelola Studio (artikel, halaman, portofolio, layanan, redirect, pengaturan) **hanya** dibaca dari database. UI, sitemap, dan Delivery API tidak boleh mengimpor `src/data/seed/*`.
- Tidak ada fallback palsu (`dbData || MOCK`). Galat database dicatat; tampilkan state kosong yang jujur (`[]`/`null`).
- Tidak ada angka, klien, testimoni, kontak, atau klaim yang tidak bisa dibuktikan — termasuk nilai default form dan contoh blok. Kontak publik berasal dari env dan disembunyikan bila kosong.
- Narasi brand statis (pipeline, manfaat) hanya di `src/config/spatium-story.ts`, bersumber dari deck.

### 3.4 Blok
- Satu sumber: `src/lib/blocks/schema.ts` (validasi) + `src/lib/blocks/catalog.ts` (katalog). Jangan menulis daftar tipe blok di tempat lain.
- Menambah tipe blok: ikuti [`docs/BLOCKS.md`](docs/BLOCKS.md) (skema → renderer → entri katalog → test).
- Iframe hanya ke domain di `src/lib/media/embedValidator.ts`; simpan ID, bukan URL bebas.

### 3.5 Siklus editorial
- Status: `draft` → `in_review` → `published` → `archived` (artikel juga `scheduled`).
- Publikasi selalu lewat gerbang: judul, slug unik, meta title & description, alt text setiap gambar, blok valid.
- **Klien MCP dan proses otomatis hanya membuat/mengubah draft.** Mereka tidak boleh mempublikasikan, mengarsipkan, atau menghapus.
- Saat konten terbit atau berubah, panggil `revalidatePath` untuk rute terkait (termasuk `/sitemap.xml`).

### 3.6 Kualitas kode
- **Tidak ada kegagalan diam**: tidak ada `catch {}` kosong; catat galat (`console.warn`/`console.error`) atau kembalikan galat terukur.
- **Batas kepercayaan**: setiap handler mutasi memeriksa otorisasi di server (`requireUser`/`requireRole` atau API key MCP) dan memvalidasi input dengan Zod.
- **Atomik**: mutasi multi-tabel dalam transaksi, beserta `ContentRevision` dan `SeoAuditLog`.
- **Tipe**: hindari `as any` dan `!`; gunakan narrowing, union, atau inferensi Zod.
- **Data sensitif**: respons tidak pernah memuat stack trace atau pesan galat mentah. Tidak ada rahasia atau password di kode, test, atau `.env.example`.
- **Gambar**: setiap `<Image>`/`<img>` punya `alt` yang sesuai tujuan.

### 3.7 UI & aksesibilitas (Studio dan situs)
- Elemen native lebih dulu (`<button>`, `<a href>`, `<dialog>`); setiap kontrol punya nama yang terbaca; tombol ikon wajib `aria-label`.
- Fokus terlihat (`:focus-visible`), seluruh alur bisa dijalankan dengan keyboard, urutan blok bisa diubah tanpa drag.
- Dialog: fokus terkurung, Escape menutup, fokus kembali ke pemicu.
- Galat form inline (`aria-invalid` + `aria-describedby`), fokus ke kolom pertama yang salah; status lewat `role="status"`.
- Status tidak hanya lewat warna; animasi menghormati `prefers-reduced-motion`; tidak terpotong di lebar 320 px atau zoom 200%.

### 3.8 Paket
- **pnpm saja.** Jangan memakai npm/yarn atau meng-commit `package-lock.json`/`yarn.lock`.

## 4. Verifikasi sebelum merge

```bash
pnpm run typecheck       # 0 error
pnpm exec vitest run     # semua lulus (butuh database lokal, lihat docs/DEVELOPMENT.md)
pnpm run audit:senior    # 0 temuan
pnpm run build
```

## 5. Dokumentasi

[`docs/README.md`](docs/README.md) adalah indeks. Perbarui dokumen terkait saat mengubah perilaku: arsitektur, blok, editor, MCP, keamanan, deployment.

## 6. Next.js 16 Agent Rules (auto-generated, jangan buang)

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
