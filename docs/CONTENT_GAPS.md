# CONTENT GAPS — UNIMASI

Data yang **belum terverifikasi** dan menunggu konfirmasi pemilik. Jangan diisi karangan.

| # | Item | Status | Dampak | Yang dibutuhkan dari pemilik |
|---|---|---|---|---|
| 1 | Domain kanonis | `needs-confirmation` | canonical, sitemap, OG, JSON-LD | `www.unimasi.id` (gambar brand) vs `unimasi.studio` (kode) vs `www.unimasi.com` (situs WP lama) |
| 2 | Email resmi | `needs-confirmation` | footer, kontak, `contactPoint` | Email aktif (kode memakai placeholder `hello@unimasi.studio`) |
| 3 | Nomor telepon | `needs-confirmation` | footer, kontak | Nomor aktif (kode memakai placeholder `+00 000 000 000`) |
| 4 | Alamat studio | `needs-confirmation` | JSON-LD, halaman about | Alamat nyata (kode menulis "Yogyakarta" dan "remote-first") |
| 5 | Sosial media resmi | `needs-confirmation` | `sameAs` | URL Behance/Vimeo/LinkedIn/Instagram yang benar (kode memakai URL generik) |
| 6 | Angka hasil portofolio | `needs-confirmation` | portfolio copy | Angka yang benar-benar terjadi (mis. "94% pemahaman", "40 perkebunan" belum terverifikasi) |
| 7 | Daftar klien sah | `needs-confirmation` | section klien | Klien yang boleh ditampilkan; logo klien saat ini identik dengan repo ERFO |
| 8 | Aset portfolio | `needs-confirmation` | portfolio | Thumbnail/frame proyek asli (cover saat ini memakai logo klien) |

## Aturan

- Item di atas **tidak boleh** tampil di HTML publik, JSON-LD, atau sitemap sebelum dikonfirmasi.
- Portfolio yang datanya belum lengkap disimpan sebagai `draft` dengan penanda peringatan di admin.
- Jangan menyalin aset/klien dari repo ERFO atau SEGIA (asset isolation).
