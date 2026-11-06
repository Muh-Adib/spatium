# Server MCP

SPATIUM menyediakan server [Model Context Protocol](https://modelcontextprotocol.io) di **`/api/mcp`**. Klien MCP (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, Codex) bisa membaca katalog blok dan menulis **halaman dinamis, artikel jurnal, portofolio (scene), dan layanan sebagai draft**. Klien MCP tidak pernah bisa mempublikasikan, menjadwalkan, mengarsipkan, atau menghapus konten — publikasi selalu dilakukan manusia di Studio.

## Transport

- JSON-RPC 2.0 lewat **Streamable HTTP**, stateless (tanpa `Mcp-Session-Id`).
- Protokol 2025-06-18; `initialize` juga menerima 2025-03-26.
- `POST /api/mcp` saja. `GET`/`DELETE` → 405 (tidak ada stream SSE).
- Batch diterima (maks. 50 pesan) untuk klien lama.
- Kapabilitas: `tools`, `resources` (`spatium://blocks/catalog`), `prompts` (`build_landing_page`, `write_article`).

## Autentikasi

Setiap klien memakai **API key sendiri**, dibuat di Studio → tab **MCP** oleh SUPER_ADMIN atau CONTENT_ADMIN.

```
Authorization: Bearer spm_…
```

- Kunci hanya ditampilkan sekali saat dibuat. Database menyimpan hash SHA-256 dan prefiks tampilan, bukan kuncinya.
- Kunci bisa diberi masa berlaku dan dicabut kapan saja; kunci yang dicabut atau kedaluwarsa langsung ditolak (401 + `WWW-Authenticate`).
- Pembuatan dan pencabutan kunci tercatat di audit log.
- Batas laju per kunci: burst 60 pesan, terisi ulang 1 per detik (429 + `Retry-After`). Batas ini per proses; dengan beberapa replika, batas efektifnya berlipat.

### Scope

| Scope | Tool |
|---|---|
| `blocks:read` | `list_block_types`, `get_block_type`, `validate_blocks` |
| `pages:read` | `list_pages`, `get_page`, `get_page_url` |
| `pages:draft` | `create_page_draft`, `update_page_draft`, `insert_blocks`, `update_block`, `remove_block`, `move_block` |
| `articles:read` | `list_articles`, `get_article`, `list_article_taxonomy` |
| `articles:draft` | `create_article_draft`, `update_article_draft` |
| `portfolio:read` | `list_portfolios`, `get_portfolio` |
| `portfolio:draft` | `create_portfolio_draft`, `update_portfolio_draft` |
| `services:read` | `list_services`, `get_service` |
| `services:draft` | `create_service_draft`, `update_service_draft` |

Kunci baru di Studio otomatis mencentang `blocks:read`, `pages:read`, `pages:draft`; scope konten lain dipilih manual. Kunci lama tetap memakai scope yang tersimpan.

`tools/list` hanya menampilkan tool yang diizinkan scope kunci tersebut.

## Alur kerja yang dianjurkan untuk klien

### Halaman

1. `list_block_types` (target `page`) → pilih blok.
2. `get_block_type` → field, contoh, dan JSON Schema lengkap.
3. `validate_blocks` → cek susunan blok sebelum menyimpan (`target` bisa `portfolio`/`service`).
4. `create_page_draft` → judul, slug, meta, dan blok. ID blok dibuat otomatis bila kosong.
5. Perbaikan bertahap: `insert_blocks`, `update_block`, `move_block`, `remove_block` (tanpa mengirim ulang seluruh halaman).
6. `get_page` → lihat `publication`, yaitu hal yang harus dilengkapi manusia sebelum publikasi.
7. Serahkan `editUrl` (`/admin?tab=pages&page=<id>`) ke editor untuk ditinjau dan dipublikasikan.

### Artikel jurnal

1. `list_article_taxonomy` → kategori dan penulis yang sudah ada (MCP tidak membuat kategori/penulis baru; email penulis tidak pernah dikirim).
2. `create_article_draft` → `title`, `content` (HTML, atau markdown dengan `contentFormat: "markdown"`), `excerpt`, `category`, `author`, `tags`, `coverUrl`/`coverMediaId` + `coverAlt`, `metaTitle`, `metaDescription`, `focusKeyphrase`, `locale`. Slug opsional (diturunkan dari judul) dan tetap setelah dibuat.
3. `get_article` → isi HTML, `updatedAt`, `publication`.
4. `update_article_draft` (`id`, `expectedUpdatedAt`, field yang diubah).
5. Serahkan `editUrl` (`/admin/buat-artikel?slug=<slug>`).

Isi artikel disimpan sebagai HTML yang sama dengan keluaran editor artikel, disanitasi dengan `sanitizeHtmlContent` (script, event handler, dan skema `javascript:` dibuang; iframe hanya ke domain di `embedValidator`). Penulisan memakai `createArticle`/`updateArticle` (`src/lib/db/articles.ts`); `updateArticle` menerima guard opsional (`expectedUpdatedAt`, `editableStatuses`) yang dicek di dalam transaksi pada baris terkunci.

### Portofolio dan layanan

- `create_portfolio_draft` → `title`, `slug?`, `client`, `year`, `category`, `summary`, `challenge`, `approach` (satu langkah per baris), `solution`, `process`, `result` (satu hasil per baris), `heroImage`/`heroMediaId` + `heroImageAlt`, `liveUrl` (https), `technologies`, `metrics` (`{label, value, detail?}` — hanya fakta terukur), `blocks` (target `portfolio`), `metaTitle`, `metaDescription`, `focusKeyphrase`. `update_portfolio_draft` menerima field yang sama (`null` mengosongkan).
- `list_services` juga mengembalikan kategori layanan (use case). `create_service_draft` → `name`, `slug?`, `category` (slug kategori yang sudah ada), `shortDescription`, `longDescription`, `highlightWord`, `blocks` (target `service`), `metaTitle`, `metaDescription`, `focusKeyphrase`. Kategori layanan sendiri tidak bisa dibuat/diubah lewat MCP.
- `editUrl`: `/admin?tab=portfolio&slug=<slug>` dan `/admin?tab=services&slug=<slug>`.

### Gerbang publikasi yang dilaporkan (`publication`)

| Entitas | Gerbang |
|---|---|
| Halaman | `computePageGate` (`src/lib/pages/gate.ts`) |
| Artikel | `checkPublicationGate` (`src/lib/seo/validation.ts`) dengan gambar dari `extractContentImages` dan cover — sama dengan PATCH `/api/articles` |
| Portofolio, layanan | `validateCatalogPublication` (`src/lib/blocks/publication-gate.ts`) — sama dengan POST `/api/portfolio` |

### Aturan yang ditegakkan server

- Draft baru selalu berstatus `draft`. Hanya entri berstatus `draft` atau `in_review` yang bisa diubah; status lain (`approved`, `scheduled`, `published`, `archived`) ditolak — buat draft baru atau minta editor di Studio.
- Argumen `status`, `publishedAt`, `scheduledAt`, `publicationTimezone`, `scheduledBy`, `archived`, `archivedAt`, `published` pada tool `*:draft` **ditolak** (`isError`, kode `forbidden`), tidak diam-diam diabaikan. Input tool memakai objek ketat: kunci yang tidak dikenal juga ditolak.
- Setiap perubahan memakai `expectedUpdatedAt`; status dan versi dicek ulang di dalam transaksi pada baris terkunci, jadi suntingan yang bertabrakan dengan editor manusia ditolak sebagai konflik.
- Slug artikel, portofolio, dan layanan tidak bisa diganti lewat MCP (penggantian slug membuat redirect; itu keputusan editor).
- Gambar hanya berupa path situs (`/…`) atau URL `https://`, atau ID item Media (`coverMediaId`/`heroMediaId`, alt default dari Media).
- Blok divalidasi dengan skema yang sama seperti editor Studio (`src/lib/blocks/catalog.ts`) dan harus tersedia untuk target entitasnya.
- Setiap mutasi berjalan dalam satu transaksi bersama `ContentRevision` dan `SeoAuditLog` dengan aktor `mcp:<nama kunci>`.
- Kesalahan input dikembalikan sebagai hasil tool `isError: true` beserta petunjuk perbaikan; stack trace tidak pernah dikirim.

## Konfigurasi klien

Studio → tab **MCP** menampilkan snippet siap salin dengan URL endpoint yang benar. Contoh untuk Claude Code:

```bash
claude mcp add --transport http spatium https://spatium.id/api/mcp \
  --header "Authorization: Bearer spm_KUNCI_ANDA"
```

Uji cepat dengan curl:

```bash
curl -s https://spatium.id/api/mcp \
  -H "Authorization: Bearer spm_KUNCI_ANDA" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Keamanan transport

- Permintaan tanpa header `Origin` (klien CLI) diterima. Permintaan browser harus berasal dari `NEXT_PUBLIC_SITE_URL` atau `MCP_ALLOWED_ORIGINS` (perlindungan DNS rebinding). Header `Host` tidak dipercaya.
- `src/proxy.ts` meneruskan `/api/mcp` ke autentikasi tingkat route (`ROUTE_AUTHENTICATED_API_RULES`) tanpa melonggarkan rute API lain.

## Kode

| File | Isi |
|---|---|
| `src/app/api/mcp/route.ts` | Handler HTTP |
| `src/lib/mcp/server.ts` | Dispatcher JSON-RPC, negosiasi versi, cek Origin |
| `src/lib/mcp/tools.ts` | Tool halaman/blok, registri tool, `callTool` (Zod → JSON Schema) |
| `src/lib/mcp/tool-kit.ts` | Tipe tool, helper hasil, guard draft-only, validasi blok & gambar |
| `src/lib/mcp/content/*.ts` | Tool artikel, portofolio, layanan; repositori draft portofolio/layanan (`history.ts`: transaksi + riwayat) |
| `src/lib/mcp/keys.ts`, `scopes.ts`, `rate-limit.ts` | Kunci API, scope, batas laju |
| `src/app/api/mcp-keys/**` | API pengelolaan kunci untuk Studio |
| `src/components/studio/mcp/StudioMcpManager.tsx` | Tab MCP di Studio |
| `tests/mcp-server.test.ts` | Test protokol, auth, dan alur end-to-end halaman |
| `tests/mcp-content.test.ts` | Test scope dan alur draft artikel, portofolio, layanan (database lokal) |
