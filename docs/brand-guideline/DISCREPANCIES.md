# DISCREPANCIES — UNIMASI

Urutan prioritas: **PDF asli > gambar brand > MD turunan > AGENTS.md lama**.

| # | Item | Isi PDF / Gambar (otoritatif) | Isi MD turunan | Tindakan |
|---|---|---|---|---|
| 1 | Versi dokumen | — | "Modern Brand Guidelines (02/03/2030)" — tahun tidak masuk akal | **Perbaiki** di MD; catat sebagai salah ketik. |
| 2 | Prepared by | — | "Alfredo Torres" (guideline Segia: "UDP") | **Perbaiki** menjadi "UDP" bila PDF menyebut demikian. |
| 3 | Domain | `www.unimasi.id` + `@unimasi` (gambar brand) | Kode: `unimasi.studio` (url, email, Instagram). TASK_PROMPT menyebut situs asli `www.unimasi.com` | **Selisih 3 arah** — perlu keputusan pemilik. Rekomendasi: `www.unimasi.id`. |
| 4 | Kontak | Hanya `www.unimasi.id` / `@unimasi` | `hello@unimasi.studio`, phone `+00 000 000 000` (placeholder) | **Placeholder** — jangan tampil sampai dikonfirmasi. |
| 5 | Turunan layanan | `unimasi-brand.png`: 6–7 turunan per core (total 25) | `seed_services.json` hanya 4 core datar | **Tambahkan** kategori → turunan sesuai `docs/services/service-catalog.md`. |
| 6 | Rute artikel | — | Scheduler me-revalidate `/artikel`, rute sebenarnya `/journal` | **Perbaiki** scheduler. |
| 7 | Font body | "Sans Serif Regular" (generik) | MD sama | **Tidak ada selisih**; implementasi memakai Inter / Plus Jakarta Sans. |

## Catatan verifikasi

- PDF `Brand_Guidelines_Unimasi_Compressed.pdf` tidak dapat di-OCR di lingkungan ini. Verifikasi visual dilakukan pada `unimasi-brand.png` (1024×1536).
- Palet `#FFD600` / `#0F3A79` / `#FFFFFF` konsisten antara gambar dan MD — tidak ada selisih.
