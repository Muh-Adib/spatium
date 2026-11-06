# Server MCP

SPATIUM menyediakan server [Model Context Protocol](https://modelcontextprotocol.io) di **`/api/mcp`**. Klien MCP (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, Codex) bisa membaca katalog blok dan **menyusun halaman dinamis sebagai draft**. Klien MCP tidak pernah bisa mempublikasikan, mengarsipkan, atau menghapus halaman — publikasi selalu dilakukan manusia di Studio.

## Transport

- JSON-RPC 2.0 lewat **Streamable HTTP**, stateless (tanpa `Mcp-Session-Id`).
- Protokol 2025-06-18; `initialize` juga menerima 2025-03-26.
- `POST /api/mcp` saja. `GET`/`DELETE` → 405 (tidak ada stream SSE).
- Batch diterima (maks. 50 pesan) untuk klien lama.
- Kapabilitas: `tools`, `resources` (`spatium://blocks/catalog`), `prompts` (`build_landing_page`).

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

`tools/list` hanya menampilkan tool yang diizinkan scope kunci tersebut.

## Alur kerja yang dianjurkan untuk klien

1. `list_block_types` (target `page`) → pilih blok.
2. `get_block_type` → field, contoh, dan JSON Schema lengkap.
3. `validate_blocks` → cek susunan blok sebelum menyimpan.
4. `create_page_draft` → judul, slug, meta, dan blok. ID blok dibuat otomatis bila kosong.
5. Perbaikan bertahap: `insert_blocks`, `update_block`, `move_block`, `remove_block` (tanpa mengirim ulang seluruh halaman).
6. `get_page` → lihat `publicationIssues`, yaitu hal yang harus dilengkapi manusia sebelum publikasi.
7. Serahkan `editUrl` (`/admin?tab=pages&page=<id>`) ke editor untuk ditinjau dan dipublikasikan.

Aturan yang ditegakkan server:

- Hanya halaman berstatus `draft` atau `in_review` yang bisa diubah. Halaman yang sudah terbit ditolak — buat draft baru.
- Setiap perubahan memakai `expectedUpdatedAt`, jadi suntingan yang bertabrakan dengan editor manusia ditolak sebagai konflik.
- Blok divalidasi dengan skema yang sama seperti editor Studio (`src/lib/blocks/catalog.ts`).
- Setiap mutasi tercatat di `SeoAuditLog` dan `ContentRevision` dengan aktor `mcp:<nama kunci>`.
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
| `src/lib/mcp/tools.ts` | Definisi tool (Zod → JSON Schema) |
| `src/lib/mcp/keys.ts`, `scopes.ts`, `rate-limit.ts` | Kunci API, scope, batas laju |
| `src/app/api/mcp-keys/**` | API pengelolaan kunci untuk Studio |
| `src/components/studio/mcp/StudioMcpManager.tsx` | Tab MCP di Studio |
| `tests/mcp-server.test.ts` | Test protokol, auth, dan alur end-to-end |
