# Sistem blok

Halaman dinamis, portofolio, dan layanan disusun dari **blok**: objek JSON dengan field `type` dan isi yang divalidasi Zod. Satu sistem dipakai oleh editor Studio, halaman publik, dan server MCP.

## Sumber kebenaran

| File | Peran |
|---|---|
| `src/lib/blocks/schema.ts` | Skema Zod setiap tipe blok (`blockSchema`, union diskriminatif) dan `parseBlocks`. Penentu valid/tidaknya data. |
| `src/lib/blocks/catalog.ts` | **Katalog**: label, deskripsi, kategori, target, field kanonik, dan contoh valid untuk tipe yang ditawarkan ke editor dan MCP. |
| `src/components/blocks/BlockRenderer.tsx` | Renderer publik dan pratinjau editor. |
| `src/lib/blocks/publication-gate.ts` | Syarat publikasi (judul, slug, meta, alt text, blok valid). |

Tidak ada daftar tipe blok lain yang boleh ditulis tangan. Palet editor, form properti, `/api/blocks/manifest`, dan tool MCP semuanya membaca `catalog.ts`.

### Tipe yang ditawarkan vs tipe lama

Katalog hanya berisi tipe yang relevan untuk SPATIUM. Skema masih menerima tipe lama (warisan situs sebelumnya, mis. `comparison-matrix`, `blocks.*`) supaya konten yang sudah tersimpan tetap tervalidasi dan tampil. Tipe lama tidak muncul di palet atau MCP; editor menampilkannya dengan editor JSON dan label "tipe lama".

### Target

Setiap entri katalog punya `targets`: `page` (halaman dinamis di `/<slug>`), `portfolio`, `service`, `solution`. `listBlocksFor(target)` mengembalikan blok untuk konteks itu.

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

1. **Skema**: tambahkan `xxxBlockSchema` di `schema.ts` dan daftarkan di `blockSchema`. Validasi URL lewat `safeUrlSchema`; jangan menerima URL bebas untuk iframe (lihat `splat-viewer`, yang hanya menerima ID scene).
2. **Renderer**: buat komponen di `src/components/blocks/` dan tambahkan `case` di `BlockRenderer.tsx`. Komponen harus aksesibel (judul, alt, fokus, reduced motion).
3. **Katalog**: tambahkan entri di `BLOCK_CATALOG` dengan `fields` dan `example` yang valid dan jujur.
4. **Test**: `pnpm exec vitest run` — test katalog memastikan setiap contoh lolos skema dan setiap field ada di skema.

Editor dan MCP otomatis mengenali tipe baru tanpa perubahan lain.

## Blok `splat-viewer`

Menyematkan scene SuperSplat (3D Gaussian Splat). Yang disimpan hanya `splatId`; URL viewer (`https://superspl.at/s?id=…`) dibangun di renderer. Viewer dimuat saat pengunjung mengeklik, kecuali `autoLoad: true`. `superspl.at` diizinkan di CSP `frame-src` lewat `src/lib/media/embedValidator.ts`.
