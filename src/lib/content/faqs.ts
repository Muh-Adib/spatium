/**
 * UNIMASI Centralized FAQ Content Service (Lane 8 / L8-T3)
 * Provides centralized deterministic retrieval for FAQs across homepage, services,
 * portfolio, and location landing pages for UNIMASI Animation & Motion Design Studio.
 */

export interface FAQItem {
  question: string
  answer: string
}

export const SEED_FAQS: Record<'homepage' | 'services' | 'portfolio', FAQItem[]> = {
  homepage: [
    {
      question: 'Berapa lama tahapan produksi animasi 2D, 3D, atau motion graphics di UNIMASI Studio?',
      answer:
        'Waktu produksi bervariasi sesuai gaya visual, durasi, dan tingkat detail aset. Video motion graphics atau 2D explainer 60–90 detik umumnya membutuhkan 2–4 minggu. Untuk animasi 3D produk industri atau simulasi teknis komprehensif, timeline pengerjaan berkisar 4–8 minggu mencakup tahap naskah, storyboard, modeling CAD/3D, animatic, texturing/lighting, rendering hingga sound design.',
    },
    {
      question: 'Apakah UNIMASI dapat menerjemahkan materi teknis dan proses bisnis yang rumit menjadi visual yang mudah dipahami?',
      answer:
        'Tentu. Filosofi kami adalah "We Make Ideas Move, Explain the Complex". Spesialis senior kami berpengalaman membedah dokumentasi teknik industri, SOP operasional, hingga alur sistem kompleks menjadi visual storytelling yang menarik, akurat, dan mudah dipahami audiens awam maupun pemangku kepentingan bisnis.',
    },
    {
      question: 'Bagaimana proses peninjauan (review) dan revisi selama pengerjaan animasi?',
      answer:
        'Kami menerapkan prinsip transparansi tanpa "black boxes". Setiap proyek memiliki milestone terstruktur: persetujuan naskah, approval visual style frame & storyboard, animatic 2D/3D (preview pergerakan kasar), hingga render akhir. Setiap milestone dilengkapi sesi review terjadwal sehingga klien memiliki kendali penuh atas arah visual.',
    },
    {
      question: 'Software dan pipeline apa saja yang digunakan oleh UNIMASI Studio?',
      answer:
        'Pipeline produksi kami mengombinasikan standar industri terdepan: Blender, Cinema 4D, Maya, dan Houdini untuk pemodelan dan simulasi 3D; After Effects dan Premiere Pro untuk motion graphics dan pengomposisian; Illustrator dan Photoshop untuk aset 2D/storyboard; serta Unreal Engine untuk rendering real-time dan eksplorasi aset visual modern.',
    },
    {
      question: 'Bagaimana jika kami belum memiliki naskah atau storyboard yang siap pakai?',
      answer:
        'Tim konseptor dan sutradara kreatif UNIMASI dapat membantu menyusun naskah (scriptwriting) dari nol berdasarkan materi brief atau tujuan kampanye Anda. Kami menyusun alur cerita, call-to-action, dan visual treatment sebelum tahap produksi dimulai.',
    },
  ],
  services: [
    {
      question: 'Apa perbedaan utama antara animasi 2D, 3D visual production, dan motion graphics?',
      answer:
        'Animasi 2D berfokus pada ilustrasi vektor dan karakter ekspresif yang efektif untuk video edukasi dan explainer. Animasi 3D menghadirkan kedalaman ruang volumetrik, pencahayaan fotorealistis, dan keakuratan geometri untuk visualisasi produk industri atau arsitektur. Sementara Motion Graphics menitikberatkan pada tipografi kinetik, grafik beranimasi, dan visualisasi data dinamis untuk kebutuhan promosi brand dan korporasi.',
    },
    {
      question: 'Apakah klien menerima master file dan hak kepemilikan aset setelah proyek selesai?',
      answer:
        'Ya, kepemilikan penuh adalah komitmen kami. Setelah termin pembayaran selesai, seluruh hak cipta komersial dan output video beresolusi tinggi (4K/ProRes/MP4) diserahkan 100% kepada pihak klien tanpa royalti berulang. Kami juga menyediakan opsi penyerahan file mentah (open project file / 3D source assets) sesuai kesepakatan kontrak awal.',
    },
    {
      question: 'Apakah UNIMASI menyediakan layanan sulih suara (voiceover), musik latar, dan sound design?',
      answer:
        'Ya, kami menyediakan paket produksi audio lengkap end-to-end. Termasuk seleksi talenta voiceover profesional multibahasa (Indonesia, Inggris native, dan bahasa lainnya), lisensi musik latar komersial resmi, serta sound effects (SFX) dan audio mixing/mastering standar siaran.',
    },
    {
      question: 'Bagaimana integrasi teknologi AI-Assisted Production diterapkan di UNIMASI?',
      answer:
        'Kami memanfaatkan AI secara etis dan terarah untuk mempercepat fase ideasi visual, pembuatan variasi moodboard, percepatan tekstur latar, serta upscaling rendering beresolusi tinggi. Sentuhan akhir, konsistensi karakter, akurasi pergerakan, dan storytelling tetap dieksekusi manual oleh artis dan animator profesional kami.',
    },
    {
      question: 'Apakah UNIMASI menerima proyek dengan format visual khusus seperti Videotron Anamorphic 3D atau Vertikal Reels?',
      answer:
        'Tentu. Kami berpengalaman memproduksi animasi dengan berbagai aspek rasio khusus: mulai dari layar videotron 3D naked-eye sudut melengkung dengan perhitungan sudut pandang (sweet spot) presisi, format vertikal 9:16 untuk media sosial, hingga format multi-layar lebar untuk pameran dan presentasi panggung.',
    },
  ],
  portfolio: [
    {
      question: 'Bagaimana tahapan pengerjaan proyek dari konsep awal hingga final render?',
      answer:
        'Proses diawali dengan Brief & Discovery untuk membedah pesan utama dan sasaran audiens. Tahap berikutnya adalah Scriptwriting & Storyboard, dilanjutkan Animatic (tes pergerakan & timing), Modeling & Texturing (pada 3D), Animasi Penuh, Lighting & Compositing, Sound Design, dan diakhiri dengan Color Grading serta final master delivery.',
    },
    {
      question: 'Siapa saja klien dan industri yang pernah berkolaborasi dengan UNIMASI?',
      answer:
        'Kami dipercaya oleh BUMN terkemuka (seperti Telkom Indonesia), perusahaan manufaktur presisi (PT Yogya Presisi Tehnikatama Industri / YPTI), korporat multinasional FMCG (Danone Indonesia), hingga institusi pendidikan tinggi (UGM dan Sanata Dharma). Portofolio kami mencakup sektor teknologi, manufaktur industri, edukasi publik, dan kampanye produk komersial.',
    },
    {
      question: 'Berapa revisi yang diperbolehkan di setiap tahapan milestone?',
      answer:
        'Setiap milestone (naskah, storyboard, animatic, dan final render) mencakup 2 hingga 3 putaran revisi terstruktur. Dengan menyepakati setiap milestone sebelum melangkah ke tahap berikutnya, kami memastikan revisi berjalan efisien tanpa perlu merombak ulang dari awal.',
    },
    {
      question: 'Apakah UNIMASI dapat bekerja di bawah Non-Disclosure Agreement (NDA) ketat?',
      answer:
        'Sangat bisa. Banyak klien industri dan teknologi mempercayakan prototipe produk baru atau proses rahasia yang belum dirilis ke publik kepada kami. Kami menandatangani NDA legal sebelum materi dibagikan dan menerapkan protokol keamanan data ketat.',
    },
    {
      question: 'Bagaimana spesifikasi output akhir yang kami terima?',
      answer:
        'Hasil akhir diserahkan dalam format digital resolusi tinggi sesuai kebutuhan distribusi: Master 4K ProRes 422 HQ / MP4 H.264 atau H.265 untuk siaran dan web, versi optimal untuk media sosial (1:1, 9:16, 16:9), serta arsip render pass jika disepakati dalam kontrak.',
    },
  ],
}

/**
 * Synchronous fallback retrieval (client components and build utilities)
 */
export function getFaqsByScopeSync(
  scope: 'homepage' | 'services' | 'portfolio' | 'city',
  context?: { cityName?: string }
): FAQItem[] {
  if (scope === 'city') {
    const cityName = context?.cityName || 'Indonesia'
    return [
      {
        question: `Berapa lama estimasi waktu produksi animasi untuk klien di wilayah ${cityName}?`,
        answer: `Waktu pengerjaan umumnya berkisar antara 2 hingga 4 minggu untuk motion graphics/2D explainer dan 4 hingga 8 minggu untuk animasi 3D produk industri. Jadwal disesuaikan dengan durasi video, tingkat kerumitan aset, dan kesiapan materi dari klien di ${cityName}.`,
      },
      {
        question: `Apa saja cakupan layanan dalam paket produksi animasi UNIMASI?`,
        answer: `Setiap paket mencakup penyusunan konsep & naskah, storyboard visual, desain karakter/aset 3D bespoke, proses animasi profesional, sulih suara (voiceover), sound effects, musik latar berlisensi resmi, hingga master video 4K siap tayang.`,
      },
      {
        question: `Apakah proses konsultasi dan koordinasi dapat dilakukan secara daring untuk ${cityName}?`,
        answer: `Ya, seluruh alur kerja kami telah dioptimalkan untuk kolaborasi remote yang mulus. Klien di ${cityName} dapat mengikuti sesi brainstorming via Google Meet/Zoom, memantau progress animasi lewat link preview interaktif, dan berdiskusi real-time via WhatsApp.`,
      },
      {
        question: `Bagaimana alur komunikasi dan pelaporan progress selama produksi animasi berjalan?`,
        answer: `Kami mengedepankan transparansi penuh dengan membagikan video progress di setiap checkpoint utama (storyboard, animatic kasar, render draft) sehingga Anda dapat memberikan masukan konkret sebelum tahap rendering akhir.`,
      },
      {
        question: `Apakah video animasi yang dihasilkan cocok untuk kampanye pemasaran digital dan media sosial?`,
        answer: `Tentu. Kami memproduksi variasi rasio aspek (16:9 widescreen, 9:16 reels/tiktok, 1:1 feed) dengan visual hook menarik di 3 detik pertama untuk memaksimalkan retensi audiens dan performa kampanye pemasaran Anda di ${cityName}.`,
      },
    ]
  }

  return SEED_FAQS[scope] || []
}
