# TASK PROMPT — UNIMASI (unimasi)

/goal
Menjadikan UNIMASI siap produksi di VPS Coolify tanpa kehilangan konten dan peringkat Google dari WordPress www.unimasi.com: seed, landing, dan portofolio setara situs asli, katalog 4 core layanan + turunan bisa dikelola user (manual & agent/MCP), UI/UX sinematik konsisten dengan brand guideline PDF, aman, dan compose/env lolos skema Coolify.

/workflow
Jalankan FASE 0–11 di bagian "WORKFLOW" di bawah, dengan penyesuaian khusus UNIMASI berikut.

## KONTEKS BRAND (diverifikasi dari repo; cocokkan ulang dengan PDF)
- Brand: UNIMASI — Animation & Motion Design Studio. Badan hukum: PT UDP (lihat `docs/company-profile/`).
- Tagline: "We Make Ideas Move" | "Make Ideas Move, Explain the Complex". Karakter: Specialist, Transparent, Story-driven.
- Palet: Bright Yellow `#FFD600`, Dark Blue `#0F3A79`, Pure White `#FFFFFF`. Font: heading Montserrat, body Sans Serif Regular. Estetika: cinematic, dynamic, high-contrast.
- 4 core layanan: 01 2D Animation · 02 3D Animation & Visual Production · 03 Motion Graphic · 04 Digital Visual Assets & AI-Assisted Production. (Jika PDF punya lebih dari 4, tambahkan.)
- Arsitektur: **unified** — situs publik + Studio Admin (`/admin`) + engine (Delivery API, AI Copilot, ToolRegistry/MCP) dalam satu aplikasi Next.js 16 + Prisma 8 + PostgreSQL 16. Block UI: HeroCinema, ProcessTimeline, StatsTicker, InteractiveCta, TextEditorial.

## TEMUAN AWAL DARI REPO (verifikasi dulu, lalu perbaiki)
1. **Kemungkinan salah ketik di `brand_guidelines_unimasi_ai.md`**: header "Versi: Modern Brand Guidelines (02/03/2030)" (tahun 2030 tidak masuk akal; brand lain bertanggal 28/10/2026) dan "Prepared by: Alfredo Torres" (guideline Segia: "UDP"). Cek PDF; koreksi MD sesuai PDF. Periksa juga palet, font, daftar layanan, dan aturan logo satu per satu terhadap PDF.
2. **Identitas kontak/domain tidak konsisten**: kode memakai `unimasi.studio` (`src/config/site.ts`: url default, email `hello@unimasi.studio`, Instagram) sedangkan situs asli adalah **www.unimasi.com**. Tentukan domain kanonis dari PDF/company profile/situs live, lalu selaraskan `site.ts`, canonical, sitemap, robots, JSON-LD, OG, `.env.example`, dan AGENTS.md. Jika tidak terverifikasi, jadikan `needs-confirmation`.
3. **`.env.example` basi** (variabel `VITE_*` dari proyek Vite lama), padahal kode memakai `NEXT_PUBLIC_*`, `SITE_API_KEY`, `REVALIDATE_SECRET`, `WEBHOOK_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, `GSC_*`, `PAGESPEED_API_KEY`, `GEMINI_API_KEY`/`OPENROUTER_API_KEY`, `CORE_SITE_KEY`, dll. Ada juga `next-env.d.ts` dan `next.config.mjs` — periksa konsistensi dengan Next 16 + TypeScript.
4. **Tidak ada `Dockerfile` maupun `docker-compose.yml`** di repo. Buat dari nol (app + `postgres:16-alpine` + `db-migrate`).
5. **Portofolio seed (6 entri)**: `coverImage` memakai logo klien (`/images/clients/unified-gray/*`), bukan frame/thumbnail proyek; angka hasil (mis. "94% pemahaman", "40 perkebunan") **tidak terverifikasi**. Daftar klien `public/images/clients/*` (34 logo) **identik dengan repo ERFO** — buktikan hanya klien UNIMASI yang tampil, sisanya pindah ke `_archive/` dan keluar dari seed/partners.
6. `seed_services.json` datar (4 item) — belum ada kategori → turunan. `seed_redirects.json` kosong, padahal situs WordPress lama punya URL yang harus dilindungi.
7. `scripts/sync-core-engine.sh` berisi path laptop lokal (`/Users/macprom12020/...`) dan menyalin ke `./backend` yang tidak ada. Tidak dipakai di deployment; arsipkan atau perbaiki dan dokumentasikan.
8. Referensi Supabase (`migrate-media-to-supabase.mjs`, `migrate-wp-to-supabase.mjs`) bertentangan dengan stack Prisma/PostgreSQL di AGENTS.md — arsipkan; skrip WP lain (`run-wp-migration.ts`, `scripts/seed.ts` bagian WP) dikonversi ke alat dev sesuai FASE 4.
9. **Integrasi WordPress aktif di runtime**: tab admin Impor, `StudioWpImporter`, `ArticleWordpressModal`, `api/import/*`, `lib/import/wp-*.ts`, referensi di AI tools/agent registry. Semua harus keluar dari aplikasi (FASE 4).
10. **Bug scheduler**: `lib/publishing/scheduler.ts` me-revalidate `/artikel` dan `/artikel/<slug>`, padahal rute artikel UNIMASI adalah `/journal` — artikel terjadwal tidak akan ter-refresh di rute yang benar dan IndexNow menunjuk URL yang salah.
11. **Data statis ganda**: `src/data/articles.ts`, `clients.ts`, `projects.ts`, `services.ts`, `site.ts` berdampingan dengan seed/DB. Jadikan DB satu-satunya sumber; hapus atau ubah file statis menjadi fallback yang jelas.

## TUGAS KHUSUS UNIMASI (tambahan di atas workflow)
**A. Paritas SEO WordPress (kritis)** — di FASE 3 dan FASE 7: ambil `sitemap_index.xml`/`page-sitemap.xml`/`post-sitemap.xml` dari www.unimasi.com; petakan semua URL ke route baru; isi `seed_redirects.json`/tabel `LegacyUrl` untuk URL yang berubah (301, maksimal 1 hop); pertahankan meta title/description, canonical, OG, JSON-LD. Output: `docs/services/seo-parity.csv`. Uji: 100% URL lama → 200 atau 301→200.

**B. Konten dari situs asli** — salin hero, section landing, daftar layanan, portofolio, klien, artikel, about, kontak apa adanya (rapikan ejaan saja) ke seed/block yang ada. Portofolio: ambil semua thumbnail/frame/poster proyek dari situs asli (video diembed lewat URL asli, bukan diunduh), jumlah entri sama dengan situs live, simpan di `public/images/portfolio/<slug>/` (WebP, `alt` deskriptif). Seed yang tidak ada padanan di situs asli dihapus atau ditandai `needs-confirmation`; jangan menyimpan angka hasil yang tidak bisa ditelusuri.

**C. Katalog layanan** — 4 `ServiceCategory` + turunan `Service` (mis. di bawah 2D Animation: explainer video, character animation, whiteboard, dst.; di 3D: product visualization, architectural/industrial visualization, dst.) sesuai PDF + halaman layanan situs asli; turunan yang tidak ada di sumber ditandai `proposed`. Admin dan tool agent harus bisa menambah core/kategori/turunan; hak agent mengikuti FASE 6f (boleh jadwalkan/publish dengan gate + alert + preview).

**D. UI/UX sinematik** — pertahankan high-contrast kuning di atas biru gelap, motion terarah (bukan dekoratif), `prefers-reduced-motion`, fallback tanpa WebGL, performa mobile. Casing ALL CAPS hanya headline. Logo: versi penuh (biru-kuning) vs monokrom untuk watermark; jaga clear-space.

**D2. WordPress → alat dev (FASE 4)** — `scripts/dev/wp-sync.ts` login administrator www.unimasi.com (Application Password), ambil semua artikel/halaman termasuk scheduled, tulis ke `src/data/seed/`, rekonsiliasi jumlah. Production hanya `npm run seed`.

**D3. Penjadwalan, kalender, SEO/GEO** — ikuti FASE 6 dan 7. Khusus UNIMASI: `VideoObject` untuk video portofolio dengan thumbnail/durasi/uploadDate; kalender editorial memakai palet kuning-biru brand.

**E. Keamanan tambahan** — repo ini memuat Studio Admin + AI Copilot + upload: audit NextAuth (secret kuat, `REQUIRE_STRONG_AUTH_SECRET`, bootstrap admin hanya via hash), rate limit endpoint `/api/ai/*` dan `/api/upload`, batas panjang prompt, perlindungan terhadap prompt injection pada tool agent (tool boleh menjadwalkan/mempublish hanya lewat gate + alert; tidak boleh menghapus atau mengubah konfigurasi keamanan), `/api/mcp` wajib auth, endpoint debug/test dimatikan di production.

**F. Deployment** — satu resource Coolify (Docker Compose): `postgres` (volume bernama, healthcheck), `db-migrate` (`exclude_from_hc: true`), `app` (domain `www.unimasi.com` via `SERVICE_FQDN_APP_<PORT>`, port sesuai server start). Port dev/start di AGENTS.md 3001 — samakan dengan Dockerfile/domain. Volume untuk `public/uploads`. Env lengkap termasuk yang opsional (GSC, PageSpeed, Gemini/OpenRouter) dengan `${VAR:-}`; secret wajib `:?` atau `SERVICE_*` magic.

**G. Aset** — hanya aset UNIMASI. Jangan ambil logo/gambar dari SegiaTech/ERFO.

---

## ATURAN UMUM (berlaku untuk semua fase)

1. **Sumber kebenaran, urutan prioritas**: (a) PDF brand guideline asli di `docs/brand-guideline/` → (b) website live brand (jika ada) → (c) file `.md` turunan → (d) AGENTS.md lama. Jika (a) dan (c) bertentangan, **PDF menang**; catat setiap selisih di `docs/brand-guideline/DISCREPANCIES.md` (kolom: item | isi PDF | isi MD | tindakan). Perbaiki MD mengikuti PDF.
2. **Baca PDF dan gambar sebagai file asli, bukan hanya teks**: rasterisasi tiap halaman PDF dan lihat visualnya (warna, logo, clear-space, font, daftar layanan). Buka kedua gambar di `docs/company-profile/` secara visual dan transkripsikan isinya.
3. **Dilarang mengarang fakta.** Tidak boleh ada klien, angka hasil, testimoni, alamat, nomor telepon, email, atau sertifikasi yang tidak bisa ditelusuri ke PDF, gambar company profile, website live, atau konfirmasi pemilik. Data yang belum ada diberi status `needs-confirmation` di `docs/CONTENT_GAPS.md`, bukan diisi karangan.
4. **Isolasi aset antar brand.** Logo, foto, dan aset klien tidak dibagikan antar repo. Daftar klien/partner hanya boleh berisi klien yang terbukti milik brand ini.
5. **Jangan sentuh repo lain.** Kerjakan hanya di repo ini. Jika butuh perubahan di repo lain, tulis di `docs/CROSS_REPO_REQUESTS.md`.
6. **Tidak ada secret di repo.** Tidak boleh commit `.env`, key, token, atau password. Nilai default yang lemah (`site_sec_default`, `segia-default-key`, admin default) harus ditolak di production.
7. **Jangan hapus tanpa bukti.** File yang dianggap tidak terpakai dipindah ke `_archive/` dulu dan dicatat di laporan akhir.
8. **Setiap fase berakhir dengan gerbang verifikasi** (perintah + hasil). Jangan lanjut ke fase berikutnya jika gerbang gagal; perbaiki dulu atau catat blocker.
9. **Commit per fase** dengan pesan jelas. Branch kerja: `chore/brand-audit-<brand>`. Tidak push ke `main`.

10. **WordPress hanya boleh ada sebagai alat development untuk membuat file seed.** Tidak boleh ada UI, route API, tab admin, tool AI/agent, kredensial, atau kode runtime yang berbicara dengan WordPress di production (lihat FASE 4).
11. **Tanggal & zona waktu**: simpan UTC, tampilkan Asia/Jakarta (WIB) di UI, simpan `publicationTimezone` per item.

## WORKFLOW (kerjakan berurutan; tiap fase punya Definition of Done)

### FASE 0 — Recon (read-only)
Baca: `AGENTS.md`, `package.json`, `prisma/schema.prisma` (atau `apps/core/prisma`), `src/data/seed/*`, `src/blocks/*` / `src/components/blocks/*`, `src/lib/blocks/ontology.ts`, `src/config/*`, `src/proxy.ts`, `scripts/seed.ts`. Jalankan `npm ci`, `npm run type-check`, `npm run build` dan catat kondisi awal (baseline) di `docs/AUDIT_BASELINE.md`.
**DoD**: baseline build/type-check tercatat, daftar temuan awal ada.

### FASE 1 — Rapikan dokumen baru ke `docs/`
Struktur target:
```
docs/
  README.md                      # indeks + cara memakai dokumen
  company-profile/
    PT-UDP-main-company.png      # gambar asli, jangan diubah
    <gambar-ke-2>.png            # gambar kedua, beri nama deskriptif
    company-profile.md           # transkripsi + ringkasan PT UDP sebagai badan hukum induk
  brand-guideline/
    <PDF asli>.pdf
    DISCREPANCIES.md
  brand-identity/
    <brand>_ai.md                # sudah dikoreksi sesuai PDF
  services/
    service-catalog.md           # 4+ core layanan → turunan layanan (sumber seed)
    content-inventory.md         # hasil audit konten (FASE 3)
```
Pahami tiap file: tulis ringkasan 5–10 baris per file di `docs/README.md` (apa isinya, dipakai di mana).
`company-profile.md` wajib memuat: nama resmi PT UDP, perannya sebagai badan resmi untuk brand ini, ringkasan usaha, serta hanya data kontak/legal yang benar-benar tertulis di gambar.
**DoD**: semua file berada di struktur target, setiap file punya ringkasan, tidak ada file tercecer di root.

### FASE 2 — Perbarui `AGENTS.md`
Selaraskan dengan hasil FASE 1: identitas, tagline, vision/mission, palet, font, tone of voice, **4+ core layanan dan turunannya (nice/service lines)**, struktur direktori aktual, port, env aktual, aturan konten, dan aturan asset-isolation. Hapus sisa brand lain (kalimat/tagline yang tersalin dari brand lain). Tambahkan bagian "Cara menambah core layanan / kategori / turunan" (manual via admin dan via agent/MCP).
**DoD**: tidak ada kalimat yang bertentangan dengan PDF; `grep -ri` untuk nama/tagline brand lain di AGENTS.md hasilnya kosong.

### FASE 3 — Audit landing page & konten
Buat tabel di `docs/services/content-inventory.md`: URL | tipe (page/post/layanan/portofolio) | judul | meta title | meta description | canonical | status di repo | tindakan.
Untuk brand yang punya website live: ambil dari website asli (WebFetch/browser) dan bandingkan dengan seed + halaman landing di repo. Periksa: teks hero, section, CTA, daftar layanan, portofolio, klien, FAQ, footer, kontak, tautan, sitemap.
Jika browser/fetch tidak bisa menjangkau situs: berhenti di item itu, catat di `CONTENT_GAPS.md`, jangan menebak.
**DoD**: setiap halaman live punya baris di inventory dengan status `match | fixed | missing | needs-confirmation`.

### FASE 4 — Hapus integrasi WordPress dari runtime; jadikan alat dev pembuat seed
**Tujuan akhir**: production berisi data lengkap dari seed (artikel asli, status published **dan** scheduled, kategori, penulis, media, SEO meta, redirect legacy). Tidak ada fitur sinkron WordPress yang tersisa di aplikasi yang berjalan.
**4a. Inventaris** — daftar semua titik WordPress (hasil `grep -rniE "wordpress|wp-json|wp_|wpApi|webshift"` di src, scripts, prisma, docs, AGENTS.md) di `docs/WP_REMOVAL_INVENTORY.md`: file | peran | tindakan (hapus / pindah ke dev / pertahankan karena dipakai redirect).
**4b. Hapus dari runtime**: tab admin "Impor WordPress" (`lib/admin/tabs.ts`), `StudioWpImporter`, `ArticleWordpressModal` dan tombolnya di `ArticleEditorHeader`, route `api/import/*` (`wp-json`, `wp-single`, `report`, `repair`, `reset`), referensi WP di `StudioAiSidebar`, `lib/ai/tool-definitions.ts`, `lib/ai/chat.ts`, `lib/agent/registry.ts`, `lib/voice/checker.ts`, serta `lib/import/wp-*.ts` dari bundle aplikasi. Tidak boleh ada `import` dari modul sinkron WP di kode `src/` yang ikut ter-build.
**4c. Alat dev (CLI, bukan UI)**: `scripts/dev/wp-sync.ts` (dijalankan manual: `npm run dev:wp-sync`), dengan syarat: (i) hanya jalan jika `NODE_ENV !== 'production'` dan flag `--i-know-this-is-dev`; (ii) login sebagai administrator WordPress memakai **Application Password** lewat REST API (`Authorization: Basic`, `context=edit`, `status=any`) — ini cara resmi dan lebih aman daripada scraping form `wp-login.php`; kredensial hanya dari env lokal (`WP_SITE_URL`, `WP_USER`, `WP_APP_PASSWORD`), tidak pernah disimpan ke repo/log/DB; (iii) mengambil **semua** posts dan pages berstatus `publish`, `future` (scheduled), `draft`, `pending`, `private` plus kategori, tag, penulis, media, dan data SEO (Yoast: title, description, canonical, focus keyphrase, OG, robots, schema); (iv) menulis hasil ke `src/data/seed/` (artikel dipecah per file atau per batch agar ukuran terkendali, media dioptimalkan ke WebP) dan membuat `seed-manifest.json` berisi jumlah per entitas + checksum; (v) membuat laporan rekonsiliasi `docs/services/wp-reconciliation.md`: jumlah di WordPress vs jumlah di seed per tipe dan status, dan daftar item yang gagal. **Jumlah harus sama persis**; item yang tidak bisa diambil dicatat, tidak dilewati diam-diam.
**4d. Seed production**: `npm run seed` memuat seluruh hasil sync secara idempotent. Artikel `scheduled` dengan tanggal di masa depan tetap `scheduled`; yang tanggalnya sudah lewat saat seed dijalankan **tidak dipublish otomatis** — masuk status `in_review` dengan `scheduleError` yang jelas dan muncul di kalender untuk keputusan manusia. Redirect/URL legacy (`Redirect`, `LegacyUrl`) tetap dipertahankan karena dibutuhkan untuk SEO. Kolom/tabel khusus WP (`WordPressSnapshot`, `ImportJob`, `wp_*`): hapus lewat **migrasi baru** (jangan ubah migrasi baseline) hanya jika aman; jika masih dibutuhkan sebagai pemetaan legacy, pertahankan dan beri komentar.
**4e. Dokumentasi**: tulis `docs/DEV_WP_SYNC.md` (cara menyiapkan Application Password, menjalankan sync, memeriksa rekonsiliasi, meng-commit seed) dan hapus sisa instruksi impor lewat UI dari AGENTS.md/README.
**DoD**: `grep -rniE "wp-json|application.?password|wordpress" src` hanya menyisakan komentar/URL legacy yang disengaja; build produksi tidak memuat modul sync; `wp-reconciliation.md` menunjukkan selisih 0; tab "Impor" tidak ada lagi.

### FASE 5 — Seed, katalog layanan, dan CRUD
**4a. Taksonomi layanan** mengikuti guideline: `ServiceCategory` = core layanan (≥4 sesuai PDF), `Service` = turunan di bawah core. Isi `title`, `slug`, `tag/indexNumber`, `shortDescription`, `keyOutcomes`, `order`, `showInNav`, SEO fields, dan `blocks` yang valid terhadap page builder.
**4b. Konten** (solusi, halaman, artikel, FAQ, CTA preset) harus memakai **block yang ada** di registry/ontology frontend. Jangan membuat block baru kecuali tidak ada padanannya; jika terpaksa, daftarkan di registry + contract + schema Zod + publication gate.
**4c. Seed idempotent**: `npm run seed` aman dijalankan berulang (upsert by slug), tidak menghapus data hasil input user, dan gagal dengan pesan jelas jika validasi block/SEO tidak lolos.
**4d. Penambahan oleh user**: pastikan core layanan, kategori, dan turunan **dapat ditambah, diubah, diurutkan, di-nonaktifkan** melalui (i) halaman admin dan (ii) agent/MCP tool. Hak agent/MCP mengikuti FASE 6f (buat, jadwalkan, publish dengan alert + preview + gate). Tambahkan tes untuk kedua jalur.
**4e. Validator seed**: skrip `scripts/validate-seed.ts` yang gagal bila ada slug ganda, gambar tanpa `alt`, meta kosong, referensi kategori yatim, atau path gambar yang file-nya tidak ada.
**DoD**: seed bersih dari DB kosong → semua halaman layanan/portofolio/landing/artikel render tanpa fallback; validator hijau; jumlah entitas di DB = `seed-manifest.json`.

### FASE 6 — Penjadwalan, kalender editorial, preview, dan alert
**Kondisi saat ini (hasil audit core)**: scheduler berbasis DB sudah ada (`lib/publishing/scheduler.ts`, tick 30 detik, `FOR UPDATE SKIP LOCKED`, lolos publication gate, mencatat `ContentRevision`/`SeoAuditLog`, `scheduleError`), UI penjadwalan berupa popover tanggal di `ArticleEditorHeader`, dan preview admin di `/admin/preview/[type]/[id]`. **Belum ada**: tampilan kalender, penjadwalan untuk selain Article, notifikasi ke manusia, dan webhook revalidasi satelit setelah publish terjadwal.
**6a. Perluas penjadwalan** ke `Page`, `Service`, `ServiceCategory`, `Portfolio`, `Solution` (kolom `scheduledAt`, `scheduledBy`, `scheduleError`, `publicationTimezone` lewat migrasi baru), dengan scheduler yang sama dan publication gate per tipe.
**6b. Perbaiki bug yang ditemukan**: scheduler meng-hardcode `revalidatePath('/artikel')` dan `normalizeIndexingUrl('/artikel/<slug>')`, padahal rute artikel UNIMASI adalah `/journal` dan ERFO `/insights`. Ambil path dari konfigurasi per brand (`config/site.ts`/`navigation.ts`). Di Segia, pastikan setelah publish terjadwal core memanggil `dispatchRevalidationWebhook` ke satelit (saat ini hanya `revalidatePath` lokal).
**6c. Kalender editorial** — tab admin baru "Kalender" (core Segia, UNIMASI, ERFO masing-masing di admin sendiri): tampilan Bulan / Minggu / Agenda; semua tipe konten dengan warna per status (draft, in_review, approved, scheduled, published, gagal-jadwal) dan ikon per tipe; filter tipe/status/penulis; klik item → editor atau preview; drag & drop untuk mengubah jadwal (hanya peran `canPublish`, validasi gate, konfirmasi, tercatat di audit); penanda item `scheduleError`; peringatan hari terlalu padat; tampilan WIB; dapat dioperasikan dengan keyboard dan screen reader; responsif (agenda di mobile). Hubungkan dua arah: popover jadwal di editor punya tautan "Lihat di kalender", dan dari kalender bisa "Buat jadwal" pada tanggal yang diklik. Tampilkan juga di tab Ringkasan: "Terbit berikutnya".
**6d. Preview**: setiap item terjadwal punya tautan preview yang memakai mekanisme yang sudah ada (`/admin/preview/[type]/[id]`) — perluas agar mendukung semua tipe di atas. Tautan itu dilampirkan di alert.
**6e. Alert ke manusia**: pusat notifikasi di admin (ikon lonceng + daftar) dan kanal luar (email SMTP dan/atau webhook, dikonfigurasi via env, opsional). Kirim alert saat: item dijadwalkan (oleh siapa pun, terutama agent/MCP), item terbit otomatis, jadwal gagal/ditolak gate, jadwal lewat saat seed. Isi alert: judul, tipe, aktor (user/agent), waktu WIB, tautan preview, tautan kalender, dan tombol/tautan "batalkan jadwal".
**6f. Hak agent/MCP (menggantikan aturan lama "hanya DRAFT")**: agent/MCP boleh membuat kategori, layanan, artikel, dan konten lain; boleh **menjadwalkan dan mempublish**, dengan syarat: (1) selalu melewati publication gate yang sama; (2) tiap jadwal/publish oleh agent **wajib memicu alert** ke manusia berisi preview; (3) tercatat di audit log dengan actor `agent:<nama>`; (4) ada aksi cepat "batalkan jadwal / unpublish" di alert dan kalender; (5) scope token agent dipisah (`read`, `draft`, `schedule`, `publish`) dan dapat dicabut per token; (6) agent tidak boleh menghapus konten atau mengubah konfigurasi keamanan. Rekomendasi (konfirmasi pemilik): beri jeda minimum jadwal yang dapat dikonfigurasi (mis. 15 menit) agar manusia sempat meninjau, dan batas jumlah publish per jam per token. Perbarui AGENTS.md, README MCP, dan tool registry; tambahkan tes untuk tiap syarat di atas.
**DoD**: kalender menampilkan item semua tipe dan dapat menjadwalkan ulang; item terjadwal oleh tool agent menghasilkan alert + preview yang berfungsi; scheduler lulus tes dengan 2 instance paralel (tidak ada publish ganda); revalidasi memakai path brand yang benar; seed dengan jadwal lampau tidak terbit otomatis.

### FASE 7 — Audit SEO lengkap: metadata (setara Yoast), JSON-LD, dan GEO
**7a. Metadata setara Yoast SEO** untuk setiap tipe halaman (home, halaman, artikel, kategori, layanan, portofolio, solusi, arsip, pencarian, 404): `title` template, meta description, canonical (satu sumber, tanpa duplikat), `robots` (index/follow, `max-snippet`, `max-image-preview:large`, `max-video-preview`), Open Graph (`og:type`, `og:title`, `og:description`, `og:image` + width/height/alt, `og:locale`, `article:published_time/modified_time/author/section/tag`), Twitter card, `hreflang`/`x-default` bila ada lebih dari satu bahasa, pagination `rel` (jika dipakai), favicon/manifest/theme-color, `lastmod` akurat di sitemap, image sitemap bila relevan, RSS feed artikel. Pertahankan nilai Yoast dari WordPress (focus keyphrase, meta title/description, canonical, OG, robots) saat sync seed; item tanpa meta lolos hanya jika digenerate dan lulus gate.
**7b. JSON-LD** dalam satu `@graph` per halaman dengan `@id` yang saling merujuk seperti pola Yoast: `Organization` (nama resmi PT UDP sebagai `parentOrganization`/`legalName` bila sesuai company profile, logo, `sameAs` resmi, `contactPoint`), `WebSite` (+ `SearchAction` hanya jika pencarian benar-benar ada), `WebPage`/`CollectionPage`/`AboutPage`/`ContactPage` sesuai tipe, `BreadcrumbList`, `Article`/`BlogPosting` (author `Person` dengan profil penulis, `datePublished`, `dateModified`, `image`, `publisher`), `Service` (+`provider`, `areaServed`, `hasOfferCatalog` untuk core → turunan), `FAQPage` hanya untuk FAQ yang tampil di halaman, `ItemList` untuk daftar, `ImageObject`. Khusus brand: Segia → `Service`, `LocalBusiness`/`ProfessionalService` bila ada alamat nyata; UNIMASI → `VideoObject` untuk video portofolio (thumbnail, durasi, uploadDate, embedUrl) dan `CreativeWork`; ERFO → `ProfessionalService`, serta `Article`/`CreativeWork` untuk studi kasus. **Temuan**: `lib/seo/jsonld.tsx` dan `lib/schema/index.ts` memuat set tipe yang identik di ketiga brand (hasil salin) — periksa tiap properti (nama, URL, logo, `sameAs`, alamat, telepon) agar tidak ada data brand lain atau placeholder (mis. `sameAs: []`, `LocalBusiness` tanpa alamat nyata). Jangan mengeluarkan properti yang tidak didukung datanya. Validasi dengan Rich Results Test dan validator schema.org; tidak ada error, warning dijelaskan.
**7c. GEO (Generative Engine Optimization) — acuan terbaru**: panduan resmi Google (Mei 2026, "Optimizing your website for generative AI features on Google Search") menyatakan bahwa optimasi untuk fitur AI adalah "tetap SEO": tidak perlu `llms.txt`/file khusus, tidak perlu memecah konten jadi potongan kecil, tidak perlu skema khusus selain structured data standar. Yang dipentingkan: konten non-komoditas dengan insight unik dan bukti pengalaman, halaman terindeks dan *snippet-eligible*, HTML semantik, JavaScript SEO yang benar (konten penting ada di HTML server-rendered), page experience, tidak ada duplikasi, serta profil bisnis lokal bila relevan. Terapkan: (i) konten kunci dirender server-side dan tidak bergantung pada interaksi WebGL/GSAP; (ii) struktur heading yang menjawab pertanyaan nyata, ringkasan di awal, definisi istilah, data/angka dengan sumber, tanggal terbit dan diperbarui yang terlihat; (iii) halaman penulis/tim dan "tentang" yang menunjukkan keahlian (E-E-A-T) — tanpa klaim palsu; (iv) kebijakan crawler eksplisit di `robots.ts`: izinkan `Googlebot`/`Bingbot`, putuskan secara sadar untuk crawler AI (`Google-Extended`, `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`) — **default rekomendasi: izinkan crawler pencarian AI agar bisa dikutip, dan tampilkan keputusan ini untuk disetujui pemilik**; (v) `llms.txt` boleh ditambahkan sebagai opsional berbiaya rendah, tetapi **bukan syarat** dan tidak boleh dijadikan klaim peningkatan visibilitas; (vi) IndexNow untuk Bing/lainnya (sudah ada `indexnow.ts`) tetap dijalankan setelah publish. Catatan: ringkasan panduan ini diambil dari liputan sekunder; agent harus membaca dokumen resmi Google di Search Central sebelum menetapkan keputusan final.
**7d. Pemeriksaan otomatis**: skrip `scripts/seo-audit.ts` yang me-crawl seluruh URL sitemap lokal dan melaporkan per halaman: title/description (ada, panjang), canonical, robots, OG lengkap, JSON-LD valid & terparse, H1 tunggal, `alt` gambar, status HTTP, `lastmod`. Keluaran `docs/SEO_AUDIT.md` + CSV. Segia & UNIMASI: gabungkan dengan `seo-parity.csv`.
**DoD**: 0 halaman indexable tanpa title/description/canonical; JSON-LD lolos validator pada semua tipe halaman; keputusan crawler AI tercatat; tidak ada data brand lain di schema; laporan audit terlampir.

### FASE 8 — Konsistensi UI/UX (khusus brand ini)
Terapkan token brand dari PDF (warna, font, casing, clear-space logo, versi logo penuh vs monokrom) di `tailwind.config.ts`, `globals.css`, dan `src/lib/theme/tokens.ts`. Periksa: kontras WCAG AA, fokus keyboard, `prefers-reduced-motion` untuk GSAP/WebGL, fallback tanpa WebGL, responsif 360/768/1280/1920, CLS/LCP, `next/image` dengan `alt`, tidak ada warna di luar palet resmi.
Screenshot sebelum/sesudah tiap halaman utama ke `docs/qa/` (viewport mobile + desktop). Perhatikan: jangan campurkan gaya brand lain.
**DoD**: checklist visual per halaman terisi; tidak ada error console; Lighthouse mobile ≥ 90 untuk Performance/SEO/Accessibility pada home + 1 halaman layanan (jika tidak tercapai, catat penyebab).

### FASE 9 — Keamanan
Audit dan perbaiki: sanitasi HTML/embed (XSS), SSRF pada import/fetch URL, upload guard (tipe, ukuran, nama file), validasi Zod semua route API, rate limit untuk form kontak/login/AI, CORS dan security headers di `src/proxy.ts`, verifikasi `x-site-key` dan `x-revalidate-secret` dengan `timingSafeEqual`, penolakan key placeholder di production, cookie/session flags, tidak ada secret atau stack trace di response, `npm audit` (catat high/critical), dependensi tidak terpakai. Pastikan data admin default dicabut (`revoke-default-credentials`).
**DoD**: daftar temuan (severity, file, perbaikan) di `docs/SECURITY_AUDIT.md`; semua critical/high sudah diperbaiki atau ada alasan tertulis.

### FASE 10 — Kesiapan deployment (Coolify + Docker Compose)
Skema Coolify (dicek dari dokumentasi resmi Coolify, 2 Nov 2026) yang **wajib** diikuti:
- Variabel di `environment:` ditulis eksplisit. `${VAR:?}` = wajib (deploy diblok jika kosong); `${VAR:-default}` = ada nilai awal; `${VAR}` = kosong tapi tampil di UI. Hanya beri default untuk nilai yang aman dipublikasikan; **secret wajib `:?`**.
- Magic variable: `SERVICE_FQDN_<SERVICE>_<PORT>` / `SERVICE_URL_<SERVICE>_<PORT>` untuk domain; `SERVICE_PASSWORD_<ID>`, `SERVICE_HEX_32_<ID>`, `SERVICE_BASE64_64_<ID>` untuk secret yang di-generate (ID satu token tanpa underscore, mis. `DBPASSWORD`). Nama yang sama menghasilkan nilai yang sama di seluruh stack.
- Jangan pakai `ports:` untuk service publik (melewati routing proxy Coolify). Domain diarahkan ke port internal lewat magic variable/Domains. Aplikasi harus listen di `0.0.0.0` (`HOSTNAME=0.0.0.0` untuk Next standalone).
- Hindari `env_file:` ke file yang tidak ada di git (`.env`, `.env.production`): tulis semua variabel di `environment:`.
- Service sekali jalan (migrasi) diberi `exclude_from_hc: true` dan `restart: "no"`; app `depends_on` dengan `condition: service_completed_successfully`; DB dengan `healthcheck`.
- Volume bernama untuk Postgres dan upload. Bind mount relatif hanya jika "Preserve repository" diaktifkan.
- Pin versi image (mis. `postgres:16-alpine`), jangan `latest`.
- Variabel `NEXT_PUBLIC_*` di Next.js dibaca **saat build**: harus diteruskan sebagai `build.args` di compose + `ARG/ENV` di Dockerfile, atau dibaca runtime lewat config server. Verifikasi dengan `docker build` nyata.
Hasil: `docker-compose.yml` (Coolify-ready), `Dockerfile` (multi-stage, user non-root, standalone output, healthcheck), `.env.example` yang **identik daftar variabelnya** dengan compose dan kode (`grep -rn "process.env\." src scripts` harus terpetakan semua), serta `docs/DEPLOYMENT_COOLIFY.md` berisi langkah klik di Coolify, daftar env (wajib/opsional/di-generate), urutan deploy, backup DB, dan rollback.
**DoD**: `docker compose config` valid, `docker build` sukses, container naik dan `/api/health` (buat jika belum ada) 200, tidak ada env yang dipakai kode tetapi tak tertulis di compose.

### FASE 11 — Verifikasi akhir & laporan
Jalankan (termasuk `scripts/seo-audit.ts` dan tes scheduler): `npm run type-check`, `npm run lint` (jika ada), `npm test`, `npm run build`, `validate-seed`, smoke test route utama dan sitemap/robots. Cek ulang pekerjaan dengan **review terpisah** (agent/sesi lain yang tidak melihat proses kerja) terhadap checklist DoD tiap fase.
Tulis `docs/FINAL_REPORT.md`: ringkasan perubahan per fase, bukti perintah + output, daftar `needs-confirmation`, risiko tersisa, dan langkah manual untuk pemilik.

## FORMAT LAPORAN KE PEMILIK (setiap selesai fase, maks 8 baris)
`Fase N: selesai/blocked | perubahan utama | bukti (perintah+hasil) | butuh keputusan pemilik?`
