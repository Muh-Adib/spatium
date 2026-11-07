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

Setiap entri katalog punya `targets`: `page` (halaman dinamis di `/<slug>`), `portfolio`, `service`. `listBlocksFor(target)` mengembalikan blok untuk konteks itu.

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
5. **Test**: `pnpm exec vitest run` — `tests/block-registry.test.ts` memastikan setiap tipe punya skema, renderer, dan (bila ditawarkan) entri katalog yang contohnya lolos skema dan field wajib; `tests/block-editor-model.test.ts` memastikan setiap field ada di skema.

Editor, manifest, dan MCP otomatis mengenali tipe baru tanpa perubahan lain. Jenis field baru (`BlockField['kind']`) butuh kontrol di `src/components/studio/blocks/fields/` dan entri di peta `FieldControl.tsx`.

## Blok `splat-viewer`

Menyematkan scene SuperSplat (3D Gaussian Splat). Yang disimpan hanya `splatId`; URL viewer (`https://superspl.at/s?id=…`) dibangun di renderer. Viewer dimuat saat pengunjung mengeklik, kecuali `autoLoad: true`. `superspl.at` diizinkan di CSP `frame-src` lewat `src/lib/media/embedValidator.ts`.
