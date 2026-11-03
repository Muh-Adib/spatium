# Dokumentasi UNIMASI

Indeks dokumen brand & teknis. Semua file di sini adalah **sumber referensi**, bukan kode.

## Struktur

| Path | Isi | Dipakai di mana |
|---|---|---|
| `company-profile/PT-UDP-main-company.png` | Gambar asli profil grup Unicam / PT UDP | Referensi identitas induk; **jangan diubah** |
| `company-profile/company-profile.md` | Transkripsi + ringkasan PT UDP | AGENTS.md §PT UDP |
| `brand-guideline/Brand_Guidelines_Unimasi_Compressed.pdf` | PDF brand guideline resmi | **Sumber otoritatif tertinggi** |
| `brand-guideline/DISCREPANCIES.md` | Selisih sumber + tindakan | Audit brand |
| `brand-identity/brand_guidelines_unimasi_ai.md` | Ringkasan brand guideline (turunan) | Prompt AI, AGENTS.md |
| `services/service-catalog.md` | 4 core → 25 turunan (sumber seed) | Seed, admin CRUD, tool agent |
| `services/content-inventory.md` | Audit konten landing vs www.unimasi.com | FASE 3 |
| `services/seo-parity.csv` | Peta URL WordPress lama → baru | FASE 3/7 |
| `services/wp-reconciliation.md` | Rekonsiliasi jumlah WordPress vs seed | FASE 4 |
| `DEV_WP_SYNC.md` | Cara memakai `scripts/dev/wp-sync.ts` | Dev only |
| `TASK_PROMPT.md` | Prompt kerja resmi untuk agent | Acuan eksekusi |
| `AUDIT_BASELINE.md` | Kondisi awal + temuan | FASE 0 |
| `CONTENT_GAPS.md` | Data menunggu konfirmasi pemilik | Sebelum publish |
| `SEO_AUDIT.md` | Hasil `scripts/seo-audit.ts` | FASE 7 |
| `SECURITY_AUDIT.md` | Temuan keamanan | FASE 9 |
| `DEPLOYMENT_COOLIFY.md` | Panduan deploy Coolify | FASE 10 |
| `FINAL_REPORT.md` | Laporan akhir | Serah terima |

## Cara memakai

1. Sebelum menulis konten: baca `brand-identity/` + `services/service-catalog.md`.
2. Konten landing/artikel harus setara situs asli; jika tidak bisa diakses, catat di `CONTENT_GAPS.md`.
3. WordPress **hanya** alat dev: `npm run dev:wp-sync`. Production hanya `npm run seed`.
4. Jika PDF dan MD bertentangan: **PDF menang**.

## Catatan lingkungan

PDF tidak dapat di-OCR di lingkungan ini. Verifikasi visual dilakukan pada `unimasi-brand.png` dan `PT-UDP-main-company.png`.
