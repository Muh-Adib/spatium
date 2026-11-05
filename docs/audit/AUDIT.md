# Audit Blok Builder — unimasi

- Path: `/Users/macprom12020/Code/unimasi`
- Port dev: 3001
- Gate typecheck: `npm run typecheck`
- Temuan: 15 · terperbaiki: 7 · belum diperbaiki: 7 · belum terkonfirmasi: 2

## unimasi (/Users/macprom12020/Code/unimasi)

- Gate: npm --prefix /Users/macprom12020/Code/unimasi run typecheck lulus
- [UNIMASI-F1] (belum dikonfirmasi) Blok 'table' dan 'internal-links' ditawarkan editor admin & ontologi LLM, tapi ditolak Zod gate dan dirender null di frontend, jadi konten yang dibuat admin/agent bisa hilang total tanpa jejak di halaman publik.
- [UNIMASI-OVERFLOW] (belum dikonfirmasi) 5 temuan tambahan di luar batas 15 per repo tidak diaudit mendalam.

| ID | Temuan | Lokasi | Prioritas | Status | Perbaikan |
|---|---|---|---|---|---|
| UNIMASI-F1 | Blok 'table' dan 'internal-links' ditawarkan editor admin & ontologi LLM, tapi ditolak Zod gate dan dirender null di frontend, jadi konten yang dibuat admin/agent bisa hilang total tanpa jejak di halaman publik. | src/lib/blocks/schema.ts:842-884 | high | unconfirmed | tidak diproses |
| UNIMASI-F2 | Detail artikel /journal/[slug] (dan alias /artikel/[slug]) memprioritaskan artikel statis src/data/articles sehingga editan admin di DB (judul, kategori, excerpt, tanggal, tag, meta) diabaikan bila slug-nya sama dengan artikel statis — hanya HTML konten yang dioverlay. | src/app/journal/[slug]/page.tsx:29-37 | high | verified | terperbaiki |
| UNIMASI-F3 | /services/[slug] dan /portfolio/[slug] tetap merender seksi konten dari import statis (intro, capabilities, deliverables, FAQ, brief/approach/delivered, related) bila entri DB tidak punya blocks — dan seed DB memang kosong blok untuk semua 25 layanan + 4 kategori, plus generateStaticParams hanya dari data statis. | src/app/services/[slug]/page.tsx:84-149 | high | verified | terperbaiki |
| UNIMASI-F4 | ComparisonMatrixBlock menampilkan 3 baris fallback hardcoded ber-branding Segia (termasuk klaim 'Next.js 16 App Router + Prisma 8') pada situs UNIMASI, dan payload sesuai manifest ('items') diabaikan karena renderer membaca 'rows'. | src/components/blocks/CatalogBlocks.tsx:786-790 | high | verified | terperbaiki |
| UNIMASI-F5 | Mayoritas seksi beranda dirender dari JSX/dataset statis tanpa jalur admin — Hero (disiplin + nama klien + gambar), ProcessTimeline, Capabilities, WhyUnimasi, Industries, PartnerLogos, InquirySection — dan JSON-LD ItemList dibangun dari SERVICES statis. | src/app/page.tsx:104-114 | high | verified | tidak terperbaiki |
| UNIMASI-F6 | Sepuluh-plus blok menampilkan konten fallback hardcoded (klaim stat, jaminan, FAQ, studi kasus fiktif) ketika data blok kosong, sehingga teks tampil di frontend tanpa kontrol admin sama sekali. | src/components/blocks/CatalogBlocks.tsx:866-871 | medium | verified | tidak terperbaiki |
| UNIMASI-F7 | Tiga jalur render menyuntikkan HTML dari data blok/DB tanpa sanitasi (text-editorial, case-study-chapter, page.content di /p/[slug]), berbeda dari jalur legacy yang dibersihkan, sehingga konten admin/agent bisa mengeksekusi markup berbahaya. | src/blocks/InteractiveCtaBlock.tsx:91-94 | medium | verified | terperbaiki |
| UNIMASI-F8 | Media hero-cinema tidak bisa diisi admin secara andal karena empat konvensi field berbeda: kontrak mendeklarasikan mediaUrl/mediaType, Zod mendefinisikan media{src,url,poster}, manifest tidak mendokumentasikan media apa pun, dan renderer hanya membaca showreelUrl/videoUrl/heroImage/image — bila kosong, panel placeholder '4K DCI CINEMATIC MASTER' hardcoded tampil. | src/blocks/HeroCinemaBlock.tsx:27-28 | medium | verified | tidak terperbaiki |
| UNIMASI-F9 | Konten /p/[slug] (entitas Page) tidak punya editor admin sama sekali — tidak ada tab 'pages', tidak ada StudioPageManager, tidak ada API CRUD pages — dan /about serta /contact juga 100% statis tanpa jalur edit. | src/lib/admin/tabs.ts:30-51 | medium | verified | tidak terperbaiki |
| UNIMASI-F10 | MediaShowcaseBlock membocorkan teks instruksi internal admin ke halaman publik saat gambar kosong, dan ArchitectureBlueprintBlock menampilkan fallback dengan field yang tidak pernah terisi (level/badge/tech) sehingga elemen UI kosong tampil. | src/components/blocks/CatalogBlocks.tsx:1815-1825 | medium | verified | terperbaiki |
| UNIMASI-F11 | Alt text gambar di hampir semua blok disintesis dari title/headline atau hardcoded, bukan berasal dari data alt media, dan hanya alt heroImage level-halaman yang diwajibkan publication gate. | src/components/blocks/CatalogBlocks.tsx:922 | medium | verified | tidak terperbaiki |
| UNIMASI-F12 | CTA WhatsApp publik memakai nomor placeholder 6281234567890 (dari .env dan fallback hardcoded yang diduplikasi di kode), bertentangan dengan default siteConfig 6283121138821 dan fallback getSiteSettings 6285227702811 — tiga sumber nomor berbeda, tak satu pun terverifikasi brand (AGENTS.md menandai nomor lain = needs-confirmation). | src/components/blocks/CatalogBlocks.tsx:356 | medium | verified | tidak terperbaiki |
| UNIMASI-F13 | Bahasa visual admin tidak memakai identitas brand: tombol primer & elemen info sky/biru, permukaan abu netral hardcoded (#1B1B1B/#1E1E1E/#161616/#111111), heading tanpa Montserrat/display-scale, padahal token --studio-* navy/yellow sudah tersedia — perlu restyle ke token brand tanpa ubah fungsi. | src/components/admin/AdminUi.tsx:18 | medium | verified | terperbaiki |
| UNIMASI-F14 | Design system admin.css bergaya Supabase (palet emerald --adm-*) yatim — tidak pernah diimpor siapa pun — sehingga membingungkan arah style admin dan sebaiknya dihapus/digabung ke token --studio-* saat restyle. | src/styles/admin.css:5-37 | low | verified | terperbaiki |
| UNIMASI-F15 | Sisa brand Segia masih tertanam di permukaan admin & AI UNIMASI: id DOM/localStorage 'segia-*', prompt ontologi 'SEGIA STUDIO', header publication gate 'SEGIA', default tautan internal artikel ke halaman SEGIA, dan copy API/embed Segia. | src/app/admin/layout.tsx:223 | low | verified | tidak terperbaiki |
| UNIMASI-OVERFLOW | 5 temuan tambahan di luar batas 15 per repo tidak diaudit mendalam. | /Users/macprom12020/Code/unimasi | low | unconfirmed | tidak diproses |

**Masih tersisa:**
- Syarat 1 (rute '/' & semua [slug] merender konten dinamis DB/admin): TIDAK terpenuhi. Rute [slug] konten DB-first OK. TAPI beranda '/' masih render mayoritas seksi statis tanpa jalur admin: Hero (Hero.tsx:21-80 DISCIPLINES), Capabilities, ProcessTimeline (PROCESS @/data/site), WhyUnimasi (VALUES @/data/site), Industries (INDUSTRIES @/data/site), JournalPreview, InquirySection (CONTACT @/data/site) — src/app/page.tsx:93-100. Tak ada model Prisma. /about & /contact 100% statis.
- Syarat 2 (blok render teks & gambar dari data, tak ada hardcode tampil): TIDAK terpenuhi. ~8 blok masih fallback hardcoded: ClientStatsImpactBlock (CatalogBlocks.tsx:1003-1008), DeliverablesChecklistBlock (:1057-1062), InteractiveTechMatrixBlock (:1114-1118), PortfolioProofGridBlock (:1179-1190), FaqAccordionBlock (:1284+), VisualShowcaseGalleryBlock (:1620+), DepartmentServiceListBlock (:1456+), ArchitectureBlueprintBlock (:868-878); HeroCinemaBlock badge/headline/placeholder (:17-18,:101-107); alt 'Production Showcase' (:931).
- Syarat 3 (UI admin pakai gaya frontend — token warna & font sama): TERPENUHI. Admin pakai token --studio-* (tokens.css:156-165) & accent-500/font-heading; tak ada bg-sky-500 atau #hex sisa (grep kosong pada AdminUi.tsx, admin/layout.tsx, admin/buat-artikel/*).

---

## Sisa pekerjaan (dari laporan lengkap)

| ID | Prioritas | Masalah | Lokasi |
|---|---|---|---|
| UNIMASI-F5 | high | Beranda mayoritas JSX/dataset statis (Hero + nama klien + gambar, ProcessTimeline, Capabilities, WhyUnimasi, Industries, PartnerLogos) | `src/app/page.tsx:104-114`; `src/components/sections/Hero.tsx:21-80` |
| UNIMASI-F6 | medium | 10+ blok fallback hardcode (stat, jaminan, FAQ, studi kasus fiktif) | `src/components/blocks/CatalogBlocks.tsx:866-871,982-987,1041-1046,1098-1103,1607-1629,1174-1189,1462-1479` |
| UNIMASI-F8 | medium | `hero-cinema` media: 4 konvensi field bentrok → admin tak bisa isi | `src/blocks/HeroCinemaBlock.tsx:27-28`; `src/blocks/contracts.ts:39-40`; `src/blocks/registry.ts:25-31` |
| UNIMASI-F9 | medium | Entitas Page (`/p/[slug]`) tanpa editor admin; `/about` & `/contact` statis | `src/lib/admin/tabs.ts:30-51` |
| UNIMASI-F11 | medium | Alt gambar disintesis dari title / hardcode | `src/components/blocks/CatalogBlocks.tsx:922,153,238` |
| UNIMASI-F12 | medium | 3 nomor WhatsApp berbeda; `6281234567890` placeholder tampil publik | `src/components/blocks/CatalogBlocks.tsx:356,1401`; `.env`; `src/config/site.ts:12`; `src/lib/content/queries.ts:192` |
| UNIMASI-F15 | low | Sisa brand Segia di admin & AI | `src/app/admin/layout.tsx:87,223,246,283`; `src/lib/blocks/ontology.ts:74`; `src/lib/blocks/publication-gate.ts:3` |
| UNIMASI-F1 | high | `table` & `internal-links` ditawarkan editor/ontologi tapi ditolak Zod + render null — **konfirmasi dulu** | `src/lib/blocks/schema.ts:842-884`; `src/app/admin/buat-artikel/page.tsx:698-719` |

## Gate

```bash
npm run typecheck   # harus lulus
```

## Workflow otomatis

Script 4 fase khusus repo ini: `docs/audit/unimasi/workflow.dwf.ts`
