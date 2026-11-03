# SECURITY AUDIT — UNIMASI

Tanggal: 2026-11-02

## Ringkasan

| Area | Status | Tindakan |
|---|---|---|
| Rate limit `/api/ai/chat` | **DIPERBAIKI** | 20 req/menit per IP (`src/lib/security/rate-limit.ts`) |
| Rate limit `/api/ai/draft` | **DIPERBAIKI** | 10 req/menit per IP |
| Rate limit `/api/upload` | **DIPERBAIKI** | 30 req/menit per IP |
| Auth `/api/mcp` | OK | `requireUser()` di GET & POST |
| Auth `/api/agent/tools` | OK | `requireUser()` di GET & POST |
| Delivery API key | **DIPERBAIKI** | Tolak placeholder/`<16` char di production; `timingSafeEqual` |
| Session cookie | **DIPERBAIKI** | `httpOnly`, `sameSite=lax`, `secure` di production, maxAge 8 jam |
| Upload guard | OK | MIME allowlist, 5 MB cap, `isPathInsideUploads` |
| SSRF | OK | `src/lib/security/ssrf.ts` dipakai `media-storage` |
| XSS sanitasi | OK | `sanitize-html` di `lib/security/sanitize-html.ts` |
| Zod validation | OK | `validateBody` di route AI & artikel |
| `npm audit --omit=dev` | OK | 0 vulnerabilities |
| Secret di repo | OK | `.env`/`.env.local` di `.gitignore`; tidak ada key hardcoded |

## Temuan & perbaikan detail

### 1. Tidak ada rate limiting (HIGH → FIXED)
Sebelumnya `/api/ai/*` dan `/api/upload` tanpa batas → risiko penyalahgunaan kuota LLM dan disk.
Ditambahkan `src/lib/security/rate-limit.ts` (sliding window in-memory) dan diterapkan pada:
- `src/app/api/ai/chat/route.ts` — 20/menit
- `src/app/api/ai/draft/route.ts` — 10/menit
- `src/app/api/upload/route.ts` — 30/menit

**Batas**: in-process Map, per-instance. Untuk multi-replica, ganti store ke Redis (tanda `ponytail:` di file).

### 2. Delivery API tanpa constant-time compare & tanpa penolakan placeholder (HIGH → FIXED)
`src/lib/delivery/auth.ts`:
- Tolak key placeholder (`segia-default-key`, `site_sec_default`, `default`, `changeme`, `test`) dan key `<16` karakter saat `NODE_ENV=production`.
- Verifikasi akhir dengan `timingSafeEqual` (node:crypto).

### 3. Cookie session tanpa flag eksplisit (MEDIUM → FIXED)
`src/auth.ts`: `useSecureCookies` di production, `httpOnly`, `sameSite=lax`, `maxAge` 8 jam.

## Temuan yang belum ditindak (dengan alasan)

| Temuan | Severity | Alasan |
|---|---|---|
| Rate limit in-memory | LOW | Cukup untuk 1 instance; upgrade Redis saat scale-out |
| Belum ada endpoint `/api/contact` | INFO | Form kontak saat ini client-side; jika ditambah, wajib rate limit + Zod + honeypot |
| CSP header belum ketat | LOW | Perlu audit inline script (`next/script`, JSON-LD); ditunda agar tidak merusak render |

## Verifikasi

```bash
npm run typecheck   # PASS
npm audit --omit=dev  # 0 vulnerabilities
```
