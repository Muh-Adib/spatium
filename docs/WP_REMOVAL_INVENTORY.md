# WordPress Removal Inventory — UNIMASI

Hasil `grep -rniE "wordpress|wp-json|wp_|wpApi|webshift"` di src, scripts, prisma. UNIMASI **punya situs WP lama** (`www.unimasi.com`) → fitur impor dipindah ke alat dev `scripts/dev/wp-sync.ts`.

## Dihapus dari runtime

| File | Peran | Tindakan |
|---|---|---|
| `src/app/api/import/wp-json/route.ts` | Route impor WP | **DIHAPUS** |
| `src/app/api/import/wp-single/route.ts` | Route impor WP | **DIHAPUS** |
| `src/app/api/import/report/route.ts` | Laporan impor | **DIHAPUS** |
| `src/app/api/import/repair/route.ts` | Perbaikan impor | **DIHAPUS** |
| `src/app/api/import/reset/route.ts` | Reset impor | **DIHAPUS** |
| `src/app/api/import/status/route.ts` | Status impor | **DIHAPUS** |
| `src/components/studio/StudioWpImporter.tsx` | Tab admin "Impor WP" | **DIHAPUS** |
| `src/components/studio/editor/ArticleWordpressModal.tsx` | Modal WP di editor | **DIHAPUS** |
| `src/lib/import/wp-rest.ts` | Klien REST WP | **DIHAPUS** |
| `src/lib/import/wp-client.ts` | Klien WP | **DIHAPUS** |
| `src/lib/import/seo-extractor.ts` | Ekstrak SEO WP | **DIHAPUS** |
| `src/lib/import/transform.ts` | Transformasi WP | **DIHAPUS** (helper generik dipindah ke `src/lib/content/html.ts`) |
| `scripts/run-wp-migration.ts` | Skrip migrasi WP lama | **DIHAPUS** |
| `scripts/migrate-wp-to-supabase.mjs` | Migrasi Supabase (arsip) | **DIHAPUS** |
| `scripts/migrate-media-to-supabase.mjs` | Migrasi media Supabase (arsip) | **DIHAPUS** |

## Diubah (referensi WP dihapus/diganti)

| File | Perubahan |
|---|---|
| `src/app/admin/page.tsx` | Hapus import/tab `StudioWpImporter`, hapus `'import'` dari `AdminTab`, ganti teks "URL WordPress" → "URL Legacy", hapus klaim "887 aturan 301". |
| `src/app/admin/buat-artikel/page.tsx` | Hapus `ArticleWordpressModal`, state `wpModalOpen`, handler `handleWordPressSyncSuccess`, prop `onOpenWpModal`. |
| `src/components/studio/editor/ArticleEditorHeader.tsx` | Hapus tombol "Tarik WP", prop `onOpenWpModal`, import `Download` (tidak dipakai lagi). |
| `src/lib/admin/tabs.ts` | Hapus entri `'import'`, definisi tab Impor, grup `['import', 'system']` → `['system']`, import `Download`. |
| `src/components/studio/StudioAiSidebar.tsx` | Hapus case `'import'`, ganti "Audit 887 URL Legacy" → "Audit URL Legacy". |
| `src/lib/ai/chat.ts` | Ganti klaim "887 aturan pengalihan 301 aktif melindungi ranking WordPress lama" → netral. |
| `src/lib/ai/tool-definitions.ts` | Ganti label/deskripsi "Redirect 301 WordPress" → "Redirect 301", hapus angka 887+. |
| `src/lib/import/media-storage.ts` | Import `slugify` dari `@/lib/content/html`, ganti komentar "WordPress images" → "remote images". |
| `src/lib/security/sanitize-html.ts` | Ganti komentar "CMS, WordPress imports" → "CMS imports". |
| `src/lib/voice/checker.ts` | Ganti "WordPress alur kerja editorial" → "alur kerja editorial". |
| `src/components/blocks/BlockRenderer.tsx` | Import `cleanRichHtml` dari `@/lib/content/html` (bukan `cleanWpHtml`). |
| `src/lib/ai/draft.ts`, `src/lib/ai/chat.ts` | Import `slugify`/`calculateReadingTime` dari `@/lib/content/html`. |

## Dipertahankan (fungsi umum / legacy redirect)

| File | Alasan |
|---|---|
| `src/lib/import/media-storage.ts` | Fungsi download/compress gambar umum, bukan WP-specific. |
| `src/lib/seo/post-migration.ts` | Audit URL legacy; nama merujuk migrasi tapi fungsi valid untuk redirect management. |
| `src/lib/redirects/registry.ts` | Redirect registry umum; referensi WP hanya di komentar. |
| `src/lib/articles/blockEditor.ts` | Komentar "Clean browser/WordPress extension artifacts" — sanitasi HTML umum. |
| `prisma/schema.prisma` | Kolom `wpTermId`, `wpPostId`, `wpSourceUrl` dipertahankan sebagai nullable untuk kompatibilitas data lama. Tabel `ImportJob`/`WordPressSnapshot` **dihapus** (tidak dipakai di kode). |

## Alat dev pengganti

- `scripts/dev/wp-sync.ts` — CLI-only, butuh flag `--i-know-this-is-dev` + env `WP_SITE_URL`, `WP_USER`, `WP_APP_PASSWORD`. Mengambil semua posts/pages (publish/future/draft/pending/private) via REST API Application Password. Output: sharded seed + manifest + `docs/services/wp-reconciliation.md`.
- `package.json`: script `dev:wp-sync` ditambahkan.

## Verifikasi

- `npm run typecheck` → PASS (0 error) setelah hapus `.next` cache.
- `grep -rniE "wordpress|wp-json|wpApi" src` hanya menyisakan komentar/teks legacy yang disengaja (lihat tabel "Dipertahankan").