# Pengembangan lokal

## Prasyarat

- Node.js 22+ dan **pnpm** (wajib — `preinstall` menolak npm/yarn).
- PostgreSQL 16 lokal.

## Setup pertama

```bash
pnpm install
cp .env.example .env.local        # isi DATABASE_URL dan AUTH_SECRET
```

Buat role dan database (contoh, ganti password):

```bash
psql -d postgres -c "CREATE ROLE spatium LOGIN PASSWORD '<password>';"
psql -d postgres -c "CREATE DATABASE spatium OWNER spatium;"
```

Lalu terapkan skema dan isi konten awal:

```bash
pnpm exec prisma contract emit    # PSL → prisma/schema.json + schema.d.ts
pnpm run db:push                  # terapkan kontrak ke database
pnpm run db:seed                  # konten awal SPATIUM (portofolio, use case, artikel, redirect)
pnpm run dev                      # http://localhost:3002
```

### Akun Studio Admin

Seed **tidak** membuat akun. Pilih salah satu:

- Isi `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD_HASH` (hash dari `pnpm dlx tsx scripts/hash-password.ts`), lalu login di `/pawon`.
- Atau jalankan `pnpm dlx tsx scripts/create-superadmin.ts` (interaktif).

Akun lama di `src/data/seed/seed_users.json` hanya diimpor bila diminta eksplisit: `SEED_USERS=true pnpm run db:seed`.

## Mengubah skema database (Prisma 8)

Database dibaca dari **kontrak yang di-generate** (`prisma/schema.json`), bukan langsung dari `schema.prisma`. Setiap perubahan skema:

1. Edit `prisma/schema.prisma`.
2. `pnpm exec prisma contract emit` — wajib, kalau dilewati `db:push` melaporkan "already matches" dan perubahan tidak terjadi.
3. `pnpm run db:push`.
4. Commit ketiga file: `schema.prisma`, `schema.json`, `schema.d.ts`.

Kolom `updatedAt` ditulis `TimestamptzString @onCreate(now()) @onUpdate(now())`. Alias lama `temporal.UpdatedAtString` tidak dikenali toolchain dan membuat emit gagal.

Mengubah atau menghapus kolom/tabel di database produksi adalah operasi destruktif — rencanakan dengan `prisma migration` dan backup (`scripts/db-backup.ts`).

## Verifikasi sebelum merge

```bash
pnpm run typecheck       # 0 error
pnpm exec vitest run     # termasuk test yang memakai database lokal
pnpm run audit:senior    # aturan kualitas AGENTS.md §3.6; laporan di .tmp/reports/
pnpm run build
```

`tests/db-persistence.test.ts` dan `tests/pages-repository.test.ts` memakai database lokal sungguhan dan membersihkan data uji mereka sendiri.

## Folder scratch

`.tmp/` diabaikan git. Dipakai untuk laporan audit (`.tmp/reports/`) dan file kerja lokal. Jangan simpan apa pun yang perlu dibagikan di sana.
