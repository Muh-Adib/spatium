# Sistem blok

Halaman dinamis, portofolio, dan layanan disusun dari **blok**: objek JSON dengan field `type` dan isi yang divalidasi Zod. Satu sistem dipakai oleh editor Studio, halaman publik, dan server MCP.

## Sumber kebenaran

Setiap tipe blok punya **modul sendiri** di `src/blocks/<tipe>/`:

```
src/blocks/
├── registry.ts              # SATU-SATUNYA daftar tipe blok (urutan = urutan palet)
├── renderers.tsx            # peta tipe → renderer; tipe TS memaksa satu renderer per tipe
├── hero-cinema/
│   ├── definition.ts        # skema Zod + entri katalog (label, kategori, target, fields, contoh, alias)
│   └── HeroCinemaBlock.tsx  # renderer
├── splat-viewer/            # definition.ts, SplatViewerBlock.tsx, splat-viewer-block.css
├── heading/                 # satu skema untuk heading2 + heading3
├── media-showcase/          # satu skema untuk media-showcase, editorial-image, image
├── hero-portfolio/          # hero-portfolio + hero-case-study (renderer sama)
├── legacy-strapi/           # tipe lama `blocks.*` dari situs Strapi, dikelompokkan
└── …                        # satu folder per tipe lainnya
```

| File | Peran |
|---|---|
| `src/blocks/<tipe>/definition.ts` | `defineBlock({ schema, catalog?, pageHero? })`. Tanpa React — aman diimpor di server (MCP, gerbang publikasi). |
| `src/blocks/<tipe>/<Nama>Block.tsx` | Renderer publik dan pratinjau editor. |
| `src/blocks/registry.ts` | `BLOCK_DEFINITIONS`: daftar definisi. Dari sini diturunkan union Zod, `BlockType`, katalog, dan tipe hero halaman. |
| `src/blocks/renderers.tsx` | `BLOCK_RENDERERS: { [T in BlockType]: … }`. Tipe yang hilang atau tidak dikenal gagal di `typecheck`. |
| `src/lib/blocks/define.ts` | Tipe bersama: `BlockField`, `BlockTarget`, `BlockCategory`, `defineBlock`. |
| `src/lib/blocks/primitives.ts` | Primitif Zod bersama (`safeUrlSchema`, `iconNameSchema`, batas blok). |
| `src/lib/blocks/schema.ts` | Fasad validasi: `blockSchema`, `blocksListSchema`, `parseBlocks`, tipe `Block`. |
| `src/lib/blocks/catalog.ts` | Fasad katalog: `BLOCK_CATALOG`, `listBlocksFor`, `createBlock`, `validateBlockList`, dll. |
| `src/components/blocks/BlockRenderer.tsx` | Merender daftar blok lewat `getBlockRenderer(type)`; tipe tak dikenal tidak dirender. |
| `src/components/studio/blocks/fields/` | Satu kontrol form per jenis field (`text`, `image`, `list`, …); `FieldControl.tsx` memetakan jenis → kontrol. |
| `src/lib/blocks/publication-gate.ts` | Syarat publikasi (judul, slug, meta, alt text, blok valid). |

Tidak ada daftar tipe blok lain yang boleh ditulis tangan. Palet editor, form properti, alias field lama, aturan hero halaman, `/api/blocks/manifest`, dan tool MCP semuanya diturunkan dari `src/blocks/registry.ts`.

### Tipe yang ditawarkan vs tipe lama

Katalog hanya berisi tipe yang relevan untuk SPATIUM. Skema masih menerima tipe lama (warisan situs sebelumnya, mis. `comparison-matrix`, `blocks.*`) supaya konten yang sudah tersimpan tetap tervalidasi dan tampil. Tipe lama tidak muncul di palet atau MCP; editor menampilkannya dengan editor JSON dan label "tipe lama".

### Target

Setiap entri katalog punya `targets`: `page` (halaman dinamis di `/<slug>`), `service-category` (use case di `/services/<slug>`), `service` (layanan turunan di `/services/<kategori>/<slug>`), `portfolio` (`/portfolio/<slug>`). `listBlocksFor(target)` mengembalikan blok untuk konteks itu; `validateBlockListFor(target, blocks)` menolak tipe katalog yang tidak ditawarkan untuk target tersebut (route simpan Studio, gerbang publikasi dengan `target`, dan MCP memakainya). Tipe lama tanpa entri katalog tetap diterima.

## Halaman entri: blok data-bound dan preset

Halaman kategori layanan, layanan, dan portofolio **seluruhnya tersusun dari blok**. Tidak ada template tetap lagi: rute publik dan pratinjau Studio sama-sama merender `resolveEntityBlocks(target, blocks tersimpan)` lewat satu view per entri (`src/components/entity/EntityViews.tsx`: `ServiceCategoryView`, `ServiceView`, `PortfolioView`), jadi pratinjau = halaman publik.

### Blok data-bound

Blok data-bound (`dataBound: true` di definisi) merender **data entri** dari konteks render (`BlockRenderContext.entity`, tipe `EntityContext` di `src/lib/content/spatium-types.ts`). JSON blok hanya menyimpan opsi tampilan (eyebrow/judul pengganti, batas jumlah, toggle). Markup dan CSS-nya adalah markup template lama (`src/components/entity/sections.tsx`), sehingga preset tampil sama persis seperti sebelumnya. Tanpa konteks entri (mis. katalog blok di Studio) blok menampilkan placeholder, bukan data. Di editor entitas, baris blok data-bound diberi label **Isi dari tab Konten** dan tombol untuk membuka tab itu.

| Target | Tipe | Isi (dari entri) | Opsi blok |
|---|---|---|---|
| `service-category` | `category-hero` | H1, tagline, ringkasan, tools, breadcrumb | `eyebrow`, `showTools`, `toolLimit` |
| | `category-intro` | paragraf pengantar, tools, `ServiceVisual` | `paragraphs` (bila kosong: ringkasan), `showTools`, `showVisual`, `visualLabel` |
| | `category-capabilities` | layanan turunan **terbit**, tiap kartu menautkan ke `/services/<kategori>/<layanan>` (`id` kartu = slug, anchor lama tetap) | `eyebrow`, `heading`, `lede`, `limit` |
| | `category-deliverables` | keluaran (`key_outcomes` deliverable) + timeline `SPATIAL_PIPELINE` | `eyebrow`, `heading`, `lede`, `showPipeline`, `pipelineLabel` |
| | `category-faq` | pertanyaan di blok (`items`) + JSON-LD FAQPage | `eyebrow`, `heading`, `items` |
| | `category-related-work` | portofolio **terbit** berdasarkan `portfolioSlugs` | `eyebrow`, `heading`, `portfolioSlugs`, `limit` (bawaan 3) |
| | `category-next` | use case terbit lainnya | `eyebrow`, `heading` |
| `service` | `service-hero` | H1, ringkasan, teknologi, breadcrumb lewat kategori induk | `eyebrow`, `showTools`, `toolLimit` |
| | `service-description` | deskripsi panjang (satu paragraf per baris) + visual kategori | `heading`, `showVisual`, `visualLabel` |
| | `service-deliverables` | `services.deliverables` (bila tercatat) + timeline alur | seperti `category-deliverables` |
| | `service-related-work` | portofolio terbit yang ditautkan (`service_portfolios`) | `eyebrow`, `heading`, `limit` |
| | `service-siblings` | tautan ke kategori induk + layanan terbit lain di kategori yang sama | `eyebrow`, `heading` |
| `portfolio` | `portfolio-hero` | H1, tagline, pill sektor/tahun/klien/lokasi | `eyebrow`, `showMeta` |
| | `portfolio-scene` | viewer SuperSplat: URL iframe dibangun dari ID scene di `liveUrl`; URL lain hanya bila lolos `embedValidator` (CSP); tanpa scene → poster → seni placeholder | `label`, `height` (`standard`/`compact`) |
| | `portfolio-brief` | challenge, langkah approach, result, kartu detail scene (klien, tahun, lokasi, metrik terukur, teknologi, scene terkait) | `eyebrow`, `heading`, `approachHeading`, `deliveredHeading`, `showFacts` |
| | `portfolio-related` | scene terbit lainnya | `eyebrow`, `heading`, `limit` (bawaan 3) |
| ketiganya | `entity-cta` | CTA penutup berjudul nama entri | `eyebrow`, `heading`, `body`, `primaryLabel/Href`, `secondaryLabel/Href` |

Blok generik (paragraf, `splat-viewer`, `media-showcase`, `faq-accordion`, `studio-cta`, …) tetap bisa disisipkan di mana saja; target `service-category` menerima semua blok `ALL_TARGETS`. Galeri portofolio memakai blok generik `media-showcase` / `visual-showcase-gallery` (kolom `portfolios.gallery` belum punya format atau editor).

### Preset (`src/blocks/presets.ts`)

| Target | Preset (urutan) |
|---|---|
| `service-category` | `category-hero`, `category-intro`, `category-capabilities`, `category-deliverables`, `category-faq`, `category-related-work`, `category-next`, `entity-cta` |
| `service` | `service-hero`, `service-description`, `service-deliverables`, `service-related-work`, `service-siblings`, `entity-cta` |
| `portfolio` | `portfolio-hero`, `portfolio-scene`, `portfolio-brief`, `portfolio-related`, `entity-cta` |

- `BLOCK_PRESETS[target]`: preset dengan id stabil `preset-<tipe>` (dipakai saat render). `buildPreset(target, { ids: 'fresh' })`: preset dengan id baru (disimpan saat membuat entri).
- **Membuat entri tanpa blok** (Studio `POST /api/<entitas>` tanpa `id`, atau MCP `create_*_draft` tanpa `blocks`) menyimpan preset. `[]`/`null` saat update mengosongkan kolom → halaman kembali ke preset.
- **`resolveEntityBlocks(target, stored)`** menentukan blok yang dirender:
  - *eksplisit* — daftar berisi minimal satu blok data-bound: dirender apa adanya;
  - *kosong* — preset;
  - *lama* (hanya blok generik): `service-category` → preset dengan pembawa konten lama dilipat ke dalamnya (`paragraph` → `category-intro.paragraphs`, `faq-accordion` → `category-faq.items`, `internal-links` ke `/portfolio/<slug>` → `category-related-work.portfolioSlugs`) dan blok lain (dulu `extraBlocks`) disisipkan **setelah `category-deliverables`**, posisi lamanya; `service` → preset dengan blok tersimpan sebelum `entity-cta`; `portfolio` → blok tersimpan apa adanya (dulu memang menggantikan template).
  - Hasilnya *lossless*: menyimpan daftar hasil resolve mengubah entri ke mode eksplisit tanpa perubahan tampilan. Editor sebaiknya memuat daftar ini (MCP `get_*` mengembalikannya sebagai `resolvedBlocks`).
- Baris lama tanpa blok tidak perlu migrasi data; HTML `/services/filmmaking-vfx`, `/services/marketing-branding` dan dua halaman portofolio identik isinya sebelum/sesudah (hanya tautan kapabilitas baru).

### Gerak

Blok entri memakai `Reveal` (`[data-reveal]`, observer global di `src/hooks`) seperti template lama: hanya opacity/transform (tanpa layout shift), mati pada `prefers-reduced-motion`, dan tampil tanpa JavaScript (`<noscript>` di root layout). Pratinjau blok Studio (`.studio-block-preview`) menampilkan konten statis.

## API katalog

```ts
import {
  BLOCK_CATALOG, listBlocksFor, getBlockEntry,
  blockJsonSchema, createBlock, validateBlockList,
} from '@/lib/blocks/catalog'

createBlock('splat-viewer')            // blok baru berisi contoh + id unik
blockJsonSchema('faq-accordion')       // JSON Schema 2020-12 (untuk MCP)
validateBlockList(raw)                 // { ok, blocks, issues: [{ index, blockId, type, message }] }
```

## Field kanonik

Banyak skema menerima alias lama (`headline`/`title`, `content`/`text`). Konten baru memakai field yang tercantum di `fields` entri katalog. Jenis field: `text`, `textarea`, `url`, `number`, `boolean`, `select`, `image` (selalu berpasangan dengan field alt), `link` (`{ label, href }`), `stringList`, `list` (daftar objek dengan field sendiri).

## Aturan konten

- Tidak ada angka, klien, testimoni, atau klaim yang tidak bisa dibuktikan. `stats-ticker` hanya untuk data terukur.
- Setiap gambar wajib punya alt text. Gerbang publikasi menolak gambar tanpa alt.
- Judul bagian berurutan (H2 lalu H3).
- Maksimal 60 blok per halaman.

## Menambah tipe blok

1. **Folder**: buat `src/blocks/<tipe>/`.
2. **Definisi** (`definition.ts`, tanpa React):
   ```ts
   import { z } from 'zod'
   import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'
   import { safeUrlSchema } from '@/lib/blocks/primitives'

   export const calloutBlockSchema = z.object({
     id: z.string().optional(),
     type: z.literal('callout'),
     title: z.string().max(300),
     href: safeUrlSchema.optional(),
   })

   export const calloutBlock = defineBlock({
     schema: calloutBlockSchema,
     catalog: [{
       type: 'callout', label: 'Callout', description: '…', category: 'content', targets: ALL_TARGETS,
       fields: [{ key: 'title', label: 'Judul', kind: 'text', required: true }],
       example: { type: 'callout', title: 'Contoh jujur, tanpa klaim' },
     }],
   })
   ```
   Validasi URL lewat `safeUrlSchema`; jangan menerima URL bebas untuk iframe (lihat `splat-viewer`, yang hanya menerima ID scene). Tipe lama yang hanya perlu tetap tervalidasi cukup tanpa `catalog`. Isi `aliases` bila skema menerima nama field lama (mis. `{ title: ['headline'] }`), dan `pageHero: true` bila blok merender `<h1>` halaman.
3. **Renderer**: buat `CalloutBlock.tsx` di folder yang sama. Komponen harus aksesibel (judul, alt, fokus, reduced motion).
4. **Daftarkan**: impor definisi di `src/blocks/registry.ts` (posisi = urutan palet) dan renderer di `src/blocks/renderers.tsx`. `pnpm run typecheck` gagal sampai keduanya cocok.
5. **Test**: `pnpm exec vitest run` — `tests/entity-blocks.test.ts` (preset, resolve, view entri, loader publik) dan `tests/block-registry.test.ts` memastikan setiap tipe punya skema, renderer, dan (bila ditawarkan) entri katalog yang contohnya lolos skema dan field wajib; `tests/block-editor-model.test.ts` memastikan setiap field ada di skema.

Editor, manifest, dan MCP otomatis mengenali tipe baru tanpa perubahan lain. Jenis field baru (`BlockField['kind']`) butuh kontrol di `src/components/studio/blocks/fields/` dan entri di peta `FieldControl.tsx`.

## Blok `splat-viewer`

Menyematkan scene SuperSplat (3D Gaussian Splat). Yang disimpan hanya `splatId`; URL viewer (`https://superspl.at/s?id=…`) dibangun di renderer. Viewer dimuat saat pengunjung mengeklik, kecuali `autoLoad: true`. `superspl.at` diizinkan di CSP `frame-src` lewat `src/lib/media/embedValidator.ts`.
