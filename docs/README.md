# Dokumentasi SPATIUM

| Dokumen | Isi |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Gambaran sistem: rute, data, Studio, autentikasi, cache |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Setup lokal, mengubah skema Prisma 8, verifikasi |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Docker/Coolify, variabel lingkungan, penyimpanan berkas |
| [BLOCKS.md](BLOCKS.md) | Sistem blok, katalog, menambah tipe blok |
| [EDITORS.md](EDITORS.md) | Editor artikel, editor blok, halaman dinamis, pintasan |
| [MCP.md](MCP.md) | Server MCP: transport, API key, scope, tools, konfigurasi klien |
| [SECURITY.md](SECURITY.md) | Model keamanan, token & kunci, hal yang perlu ditindaklanjuti |
| [ROADMAP.md](ROADMAP.md) | Backlog berprioritas dan tahapan menuju deployment produksi |
| [brand-guideline/](brand-guideline/README.md) | Merek SPATIUM + sumber otoritatif (PDF, HTML portofolio) |
| [company-profile/](company-profile/company-profile.md) | Profil grup PT UDP (referensi) |

Aturan wajib untuk engineer dan agen koding ada di [`../AGENTS.md`](../AGENTS.md).

Laporan hasil generate (`pnpm run audit:senior`, `scripts/seo-audit.ts`) ditulis ke `.tmp/reports/` dan tidak di-commit.
