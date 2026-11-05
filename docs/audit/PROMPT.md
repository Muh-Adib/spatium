# Prompt untuk Agent Lain — Repo unimasi

Tempelkan ke agent (Claude Code / Cursor / Codex / Antigravity) dengan working
directory `/Users/macprom12020/Code/unimasi`. Prompt ini mandiri.

---

## PROMPT

Anda melanjutkan pekerjaan audit + perbaikan di repo **unimasi** (/Users/macprom12020/Code/unimasi).
Port dev: 3001.

**Konteks repo:** Situs Unimasi (industri/animasi 3D). Identitas void-navy sendiri; jangan pakai branding Segia/ERFO.

Stack: Next.js 16 App Router + React 19 + Prisma 8 (`@prisma/orm-postgres`)
+ NextAuth v5 + Tailwind 3 + GSAP/Three.js, `src/proxy.ts` (BUKAN `middleware.ts`),
blok SDUI di `src/blocks` (contracts.ts + registry.ts + BlockRenderer.tsx),
studio admin di `/admin` (`src/app/admin`), Delivery API `/api/v1/delivery/*`.

**Laporan audit lengkap repo ini ada di `docs/audit/unimasi/AUDIT.md`** (di repo erfo,
path absolut `/Users/macprom12020/Code/erfo/docs/audit/unimasi/AUDIT.md`).
Baca dulu: berisi temuan dengan lokasi `path:line`, status verifikasi, status perbaikan,
dan tabel "Sisa pekerjaan". Jangan audit ulang dari nol — verifikasi temuan yang
ditandai "tidak terperbaiki", lalu perbaiki.

### Aturan kerja (WAJIB)

1. Baca `AGENTS.md` / `CLAUDE.md` di root repo sebelum mengubah apa pun.
   Untuk erfo: jangan buat `middleware.ts` (semua di `src/proxy.ts`); Prisma 8 via `src/lib/db`;
   blok wajib lolos kontrak Zod; AI/agent hanya boleh menghasilkan DRAFT, bukan publish.
2. Jangan mengubah `schema.prisma`, jangan `db:push`, jangan menambah dependency,
   jangan menjalankan dev server atau build produksi.
3. Perbaikan konten: pastikan rute `/` dan semua rute `[slug]` merender konten dari DB
   (Prisma) / sumber yang diedit admin. Hapus import statis/hardcode JSX yang menggerakkan
   konten. Konten seed di DB = dinamis (sah). Fallback saat DB kosong boleh, asal konten
   utama dari DB dan tidak menampilkan teks/gambar fiktif (klien karangan, metrik karangan).
4. Setiap blok merender teks & gambar dari props/data blok; semua gambar punya `alt`
   dari data. Placeholder instruksi admin ("pilih dari Media Manager") tidak boleh tampil
   di frontend publik.
5. Restyle admin: tarik gaya dari frontend repo itu sendiri (token warna di
   `design-tokens.json` / `tokens.css` / `globals.css`, font heading & body, radius,
   spacing, pola komponen). Pertahankan fungsi, struktur komponen, dan props —
   restyle, bukan rombak total. Pemetaan warna yang sudah diputuskan pemilik:
   kuning/aksen brand = aksi utama; biru = info/status; amber = warning.
6. Jangan mengarang konten halaman baru (copy `/`, `/tentang`, `/privasi`,
   `/syarat-ketentuan` = keputusan pemilik brand). Nomor WhatsApp/email/domain final
   juga butuh konfirmasi pemilik — kode boleh dibuat membaca env, nilai jangan diganti.
7. Setelah selesai, jalankan gate typecheck dan pastikan lulus: `npm run typecheck`
   Perbaiki error yang Anda sebabkan; jangan matikan pengecekan.


### Verifikasi akhir

Setelah semua perbaikan: jalankan gate typecheck repo ini, lalu laporkan —
temuan mana yang selesai (dengan bukti `path:line`), mana yang tersisa dan alasannya.
Jangan melaporkan pemeriksaan yang tidak Anda jalankan.


