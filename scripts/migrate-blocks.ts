import { prisma } from '../src/lib/db/prisma'
import { parseBlocks } from '../src/lib/blocks/schema'

function parseJsonSafe(val: any, fallback: any = []): any {
  if (!val) return fallback
  if (typeof val !== 'string') return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

async function migrateBlocks() {
  console.log('🚀 Memulai migrasi otomatis SDUI Blocks untuk database UNIMASI Studio...')

  // ─── 1. KATEGORI LAYANAN (Service Categories) ───────────────────────────────
  const categories = await prisma.orm.public.ServiceCategory.all()
  console.log(`\n📦 Ditemukan ${categories.length} Kategori Layanan:`)
  let catCount = 0

  for (const cat of categories as any[]) {
    const rawOutcomes = parseJsonSafe(cat.keyOutcomes, [])
    const outcomes = Array.isArray(rawOutcomes) && rawOutcomes.length > 0
      ? rawOutcomes.map((o: any) => ({
          label: o.label || o.title || 'Fitur Utama',
          value: o.value || o.description || 'Standar Studio',
        }))
      : [
          { label: 'Standar Mutu', value: 'Kualitas Bioskop 4K' },
          { label: 'Hak Komersial', value: '100% Milik Klien' },
          { label: 'Pipeline Studio', value: 'Transparan & On-Time' },
        ]

    const blocks = [
      {
        id: `hero-${cat.slug}`,
        type: 'hero-department',
        title: cat.title || 'Departemen Animasi',
        badge: cat.tag || 'Layanan Inti',
        description: cat.shortDescription || 'Layanan produksi visual dan animasi terdepan untuk menyampaikan pesan kompleks secara memukau.',
        keyOutcomes: outcomes,
      },
      {
        id: `services-${cat.slug}`,
        type: 'department-service-list',
        title: `Spesialisasi Produksi ${cat.title}`,
        description: `Jelajahi kapabilitas teknis dan solusi visual spesifik dalam departemen ${cat.title}.`,
      },
      {
        id: `features-${cat.slug}`,
        type: 'feature-bento-grid',
        badge: 'Keunggulan Studio',
        title: `Mengapa Memilih UNIMASI untuk ${cat.title}`,
        description: 'Kombinasi storytelling kuat, teknologi visual modern, dan transparansi pengerjaan di setiap milestone.',
        features: [
          {
            title: 'Storytelling Berorientasi Pemahaman',
            description: 'Kami tidak sekadar menganimasikan objek, kami memastikan pesan rumit Anda dipahami secara intuitif oleh audiens sasaran.',
            icon: 'Workflow',
          },
          {
            title: 'Aset Orisinal & Hak Cipta Penuh',
            description: 'Seluruh aset 2D/3D, karakter, dan visual yang kami buat menjadi milik komersial penuh klien tanpa biaya tersembunyi.',
            icon: 'ShieldCheck',
          },
          {
            title: 'Presisi Teknis & Konsistensi Visual',
            description: 'Standar kontrol kualitas ketat pada setiap frame dengan pencahayaan realistis dan ritme gerak yang dinamis.',
            icon: 'Sparkles',
          },
        ],
      },
      {
        id: `portfolio-${cat.slug}`,
        type: 'portfolio-proof-grid',
        title: 'Karya Nyata & Studi Kasus Terkait',
        description: 'Jelajahi bagaimana animasi kami memberikan dampak nyata bagi klien di berbagai sektor.',
      },
      {
        id: `cta-${cat.slug}`,
        type: 'interactive-cta',
        eyebrow: 'Mulai Proyek Animasi Anda',
        headline: `Wujudkan Komunikasi Visual Mengesankan dengan ${cat.title}`,
        description: 'Konsultasikan ide atau naskah proyek Anda bersama tim sutradara dan animator UNIMASI.',
        primaryCta: { label: 'Konsultasi Proyek Gratis', href: '/contact' },
        secondaryCta: { label: 'Lihat Seluruh Portofolio', href: '/portfolio' },
      },
    ]

    const validated = parseBlocks(blocks)
    if (!validated.ok) {
      console.error(`❌ Validasi blok gagal untuk kategori ${cat.slug}:`, validated.issues)
      continue
    }

    await prisma.orm.public.ServiceCategory.where({ id: cat.id }).update({
      blocks: JSON.stringify(validated.blocks),
    })
    catCount++
    console.log(`  ✓ Kategori [${cat.slug}]: Berhasil disuntik ${blocks.length} blok`)
  }

  // ─── 2. LAYANAN REKAYASA (Services) ─────────────────────────────────────────
  const services = await prisma.orm.public.Service.all()
  console.log(`\n📦 Ditemukan ${services.length} Layanan Spesifik:`)
  let svcCount = 0

  for (const svc of services as any[]) {
    const rawFeatures = parseJsonSafe(svc.features, [])
    const featuresList = Array.isArray(rawFeatures) && rawFeatures.length > 0
      ? rawFeatures.map((f: any) => typeof f === 'string' ? { title: f, description: '' } : f)
      : [
          { title: 'Art Direction Sinematik', description: 'Konsep visual dirancang khusus agar menonjol dan sesuai identitas brand.' },
          { title: 'Pipeline Animasi Presisi', description: 'Tahapan produksi terukur dengan preview rutin di setiap tahapan pengerjaan.' },
          { title: 'Master Output Multi-Format', description: 'Pengiriman format video siap tayang untuk web, presentasi, videotron, maupun broadcast.' },
        ]

    const rawDeliverables = parseJsonSafe(svc.deliverables, [])
    const deliverablesList = Array.isArray(rawDeliverables) && rawDeliverables.length > 0
      ? rawDeliverables.map((d: any) => typeof d === 'string' ? { title: d } : d)
      : [
          { title: 'Master Video 4K Ultra HD (ProRes & H.264/H.265)' },
          { title: 'Format Vertikal & Horizontal untuk Media Sosial' },
          { title: 'Seluruh File Proyek & Aset Visual Orisinal' },
          { title: 'Dokumentasi Lisensi & Hak Komersial Penuh' },
        ]

    const rawFaqs = parseJsonSafe(svc.faq, [])
    const faqsList = Array.isArray(rawFaqs) && rawFaqs.length > 0
      ? rawFaqs
      : [
          {
            question: `Berapa lama estimasi waktu pengerjaan untuk ${svc.name}?`,
            answer: 'Durasi pengerjaan berkisar antara 2 hingga 6 minggu tergantung kompleksitas durasi, detail aset 3D, dan jumlah revisi yang disepakati.',
          },
          {
            question: 'Apakah UNIMASI membantu dalam pembuatan naskah dan storyboard?',
            answer: 'Ya, tim kreatif kami dapat membantu menyusun konsep cerita, naskah puitis/teknis, dan storyboard komprehensif dari brief dasar Anda.',
          },
          {
            question: 'Bagaimana kepemilikan aset setelah proyek selesai?',
            answer: 'Seluruh hak komersial dan aset orisinal yang diproduksi untuk proyek ini 100% dialihkan kepada klien tanpa biaya royalti tambahan.',
          },
        ]

    const rawTech = parseJsonSafe(svc.technologies, [])
    const techList = Array.isArray(rawTech) && rawTech.length > 0
      ? rawTech
      : ['Maya', 'Blender', 'Unreal Engine 5', 'Houdini', 'After Effects', 'Cinema 4D', 'DaVinci Resolve']

    const blocks = [
      {
        id: `hero-${svc.slug}`,
        type: 'hero-service',
        name: svc.name,
        title: svc.name,
        highlightWord: svc.highlightWord || svc.name.split(' ').slice(-1)[0] || 'Studio',
        categoryBadge: svc.categoryBadge || 'Layanan Produksi',
        description: svc.shortDescription || svc.description || 'Layanan produksi animasi dengan standar estetika tinggi dan alur kerja terstruktur.',
        whatsappPrompt: svc.whatsappPrompt || `Halo UNIMASI, saya ingin konsultasi mengenai layanan ${svc.name}.`,
        metrics: [
          { value: '4K UHD', label: 'Master Output', subtext: 'Kualitas Bioskop' },
          { value: '100%', label: 'Hak Cipta Komersial', subtext: 'Milik Klien Penuh' },
          { value: 'Milestone', label: 'Jaminan Jadwal Pengiriman', subtext: 'Zero Delay SLA' },
        ],
      },
      {
        id: `features-${svc.slug}`,
        type: 'feature-bento-grid',
        badge: 'Kapabilitas Layanan',
        title: `Fitur & Keunggulan ${svc.name}`,
        description: 'Setiap elemen dirancang dengan ketelitian tingkat tinggi demi hasil visual yang memikat dan komunikatif.',
        features: featuresList.slice(0, 4),
      },
      {
        id: `deliverables-${svc.slug}`,
        type: 'deliverables-checklist',
        badge: 'Transparansi Serah Terima',
        title: 'Checklist Deliverables & Kepemilikan Aset',
        description: 'Kami memberikan jaminan transparansi penuh atas seluruh hasil karya dan materi produksi yang diserahkan.',
        items: deliverablesList,
      },
      {
        id: `pipeline-${svc.slug}`,
        type: 'workflow-phases',
        badge: 'Tahapan Produksi',
        title: `Pipeline Pengerjaan ${svc.name}`,
        description: 'Metodologi pengerjaan terstruktur dengan evaluasi berkala untuk memastikan hasil akhir sempurna.',
        phases: [
          { step: '01', title: 'Creative Brief & Concept Art', description: 'Penyelarasan naskah, tone of voice, dan look-development visual awal.' },
          { step: '02', title: 'Storyboard & Animatics', description: 'Penyusunan alur adegan, ritme waktu, dan pergerakan kamera 2D/3D.' },
          { step: '03', title: 'Asset Modeling, Animation & FX', description: 'Pembuatan aset presisi, simulasi partikel, dan animasi dinamis.' },
          { step: '04', title: 'Lighting, Compositing & Master 4K', description: 'Pewarnaan sinematik, sound design, dan final rendering resolusi tinggi.' },
        ],
      },
      {
        id: `tech-${svc.slug}`,
        type: 'tech-stack-chips',
        title: 'Software & Pipeline Tools yang Digunakan',
        description: 'Standar industri global untuk menjamin kompatibilitas aset, kualitas render, dan efisiensi waktu produksi.',
        technologies: techList,
      },
      {
        id: `faq-${svc.slug}`,
        type: 'faq-accordion',
        title: 'Tanya Jawab Seputar Layanan',
        items: faqsList,
      },
      {
        id: `cta-${svc.slug}`,
        type: 'interactive-cta',
        eyebrow: 'Mulai Diskusi Proyek',
        headline: `Siap Mewujudkan Animasi ${svc.name} Anda?`,
        description: 'Kirimkan brief atau jadwalkan sesi konsultasi daring untuk mendapatkan estimasi jadwal dan anggaran terukur.',
        primaryCta: { label: 'Konsultasi Sekarang', href: '/contact' },
        secondaryCta: { label: 'Lihat Portofolio Terkait', href: '/portfolio' },
      },
    ]

    const validated = parseBlocks(blocks)
    if (!validated.ok) {
      console.error(`❌ Validasi blok gagal untuk layanan ${svc.slug}:`, validated.issues)
      continue
    }

    await prisma.orm.public.Service.where({ id: svc.id }).update({
      blocks: JSON.stringify(validated.blocks),
    })
    svcCount++
    if (svcCount % 8 === 0 || svcCount === services.length) {
      console.log(`  ✓ Layanan [${svc.slug}] (${svcCount}/${services.length}) terupdate`)
    }
  }

  // ─── 3. SOLUSI BISNIS (Solutions) ───────────────────────────────────────────
  const solutions = await prisma.orm.public.Solution.all()
  console.log(`\n📦 Ditemukan ${solutions.length} Solusi Bisnis:`)
  let solCount = 0

  for (const sol of solutions as any[]) {
    const rawBenefits = parseJsonSafe(sol.keyBenefits, [])
    const benefitsList = Array.isArray(rawBenefits) && rawBenefits.length > 0
      ? rawBenefits
      : typeof sol.keyBenefits === 'string'
      ? sol.keyBenefits.split('\n').filter(Boolean)
      : [
          'Mempermudah penjelasan mekanisme kerja rumit tanpa risiko lapangan',
          'Mempersingkat siklus penjualan B2B dan edukasi stakeholder hingga 3x lipat',
          'Aset visual 3D aset reusable untuk berbagai media promosi dan pelatihan',
        ]

    const rawTech = parseJsonSafe(sol.technologies, [])
    const techList = Array.isArray(rawTech) && rawTech.length > 0
      ? rawTech
      : ['Unreal Engine 5', 'Blender', 'Maya', 'After Effects', 'Web3D / GLTF']

    const blocks = [
      {
        id: `hero-${sol.slug}`,
        type: 'hero-solution',
        badge: sol.category || 'Solusi Bisnis & Industri',
        title: sol.title,
        shortDescription: sol.shortDescription || sol.description || 'Solusi visualisasi animasi komprehensif untuk mengoptimalkan komunikasi industri dan bisnis.',
        keyBenefits: benefitsList,
        heroImage: sol.heroImage || '',
        category: sol.category || 'Enterprise Solution',
        primaryCta: { label: 'Konsultasi Solusi Ini', href: '/contact' },
        secondaryCta: { label: 'Lihat Studi Kasus', href: '/portfolio' },
      },
      {
        id: `features-${sol.slug}`,
        type: 'feature-bento-grid',
        badge: 'Manfaat Nyata',
        title: 'Nilai Strategis Solusi untuk Organisasi Anda',
        description: 'Bagaimana pendekatan rekayasa visual UNIMASI memberikan keunggulan kompetitif bagi komunikasi bisnis Anda.',
        features: [
          {
            title: 'Visualisasi Risiko Nol',
            description: 'Simulasikan prosedur berbahaya, lingkungan ekstrim, atau mesin internal tanpa mengganggu operasional riil.',
            icon: 'ShieldCheck',
          },
          {
            title: 'Daya Ingat & Retensi Tinggi',
            description: 'Animasi 3D terbukti meningkatkan pemahaman materi teknis hingga 85% lebih cepat dibandingkan manual dokumen teks.',
            icon: 'TrendingUp',
          },
          {
            title: 'Skalabilitas Produksi Multi-Kanal',
            description: 'Model 3D yang dibangun dapat diekspor ke berbagai format tayang: video horizontal, format reels, hingga AR/VR interaktif.',
            icon: 'Layers',
          },
        ],
      },
      {
        id: `blueprint-${sol.slug}`,
        type: 'architecture-blueprint',
        badge: 'Arsitektur Produksi',
        title: 'Alur Implementasi Solusi End-to-End',
        description: 'Sistem alur kerja yang terintegrasi dari analisis kebutuhan bisnis hingga deployment aset visual.',
      },
      {
        id: `tech-${sol.slug}`,
        type: 'tech-stack-chips',
        title: 'Standar Teknologi & Software Pendukung',
        description: 'Software dan pipeline visual berstandar studio internasional.',
        technologies: techList,
      },
      {
        id: `portfolio-${sol.slug}`,
        type: 'portfolio-proof-grid',
        title: 'Penerapan Solusi pada Studi Kasus Nyata',
        description: 'Lihat portofolio klien yang telah sukses menerapkan solusi visual sejenis.',
      },
      {
        id: `cta-${sol.slug}`,
        type: 'interactive-cta',
        eyebrow: 'Implementasikan Solusi Ini',
        headline: `Tingkatkan Efektivitas Komunikasi Bisnis dengan Solusi ${sol.title}`,
        description: 'Jadwalkan sesi konsultasi dengan tim ahli kami untuk mendapatkan demo alur kerja dan estimasi proposal.',
        primaryCta: { label: 'Mulai Konsultasi Solusi', href: '/contact' },
        secondaryCta: { label: 'Hubungi via WhatsApp', href: 'https://wa.me/6283121138821' },
      },
    ]

    const validated = parseBlocks(blocks)
    if (!validated.ok) {
      console.error(`❌ Validasi blok gagal untuk solusi ${sol.slug}:`, validated.issues)
      continue
    }

    await prisma.orm.public.Solution.where({ id: sol.id }).update({
      blocks: JSON.stringify(validated.blocks),
    })
    solCount++
    console.log(`  ✓ Solusi [${sol.slug}]: Berhasil disuntik ${blocks.length} blok`)
  }

  // ─── 4. STUDI PORTOFOLIO (Portfolio) ─────────────────────────────────────────
  const portfolios = await prisma.orm.public.Portfolio.all()
  console.log(`\n📦 Ditemukan ${portfolios.length} Studi Portofolio:`)
  let portCount = 0

  for (const p of portfolios as any[]) {
    const rawMetrics = parseJsonSafe(p.metrics, [])
    const metricsList = Array.isArray(rawMetrics) && rawMetrics.length > 0
      ? rawMetrics
      : [
          { value: '4K', label: 'Master Resolution', detail: 'Bioskop & Broadcast Ready' },
          { value: '100%', label: 'Original CGI Assets', detail: 'Custom Look-Dev' },
          { value: 'On-Time', label: 'Milestone Delivery', detail: 'Strict Studio Schedule' },
        ]

    const rawTech = parseJsonSafe(p.technologies, [])
    const techList = Array.isArray(rawTech) && rawTech.length > 0
      ? rawTech
      : ['Maya', 'Blender', 'Unreal Engine', 'After Effects', 'DaVinci Resolve']

    const blocks = [
      {
        id: `hero-${p.slug}`,
        type: 'hero-portfolio',
        title: p.title || 'Studi Kasus Animasi & Visual Production',
        client: p.client || 'Mitra Klien UNIMASI',
        year: p.year ? `${p.year}` : `${new Date().getFullYear()}`,
        category: p.category || 'Animation Case Study',
        discipline: 'CGI, 3D Animation & Motion Design',
        summary: p.summary || 'Sebuah studi kapabilitas dan eksekusi visual berkualitas tinggi dari UNIMASI Studio.',
        heroImage: p.heroImage || '',
        liveUrl: p.liveUrl || '',
        primaryCta: { label: 'Konsultasi Proyek Serupa', href: '/contact' },
      },
      {
        id: `case-study-${p.slug}`,
        type: 'portfolio-case-study',
        eyebrow: 'Production Case Study',
        title: 'Tantangan, Pendekatan & Solusi Produksi',
        description: 'Bagaimana UNIMASI merancang solusi visual presisi untuk mengatasi hambatan komunikasi ide rumit.',
        challenge: p.challenge || 'Menjelaskan alur teknis dan pesan rumit agar mudah dipahami secara visual tanpa kehilangan akurasi informasi.',
        approach: p.approach || 'Mengembangkan narasi visual terstruktur dengan pendekatan sinematik, komposisi warna elegan, dan transisi mulus.',
        solution: p.solution || 'Memanfaatkan alur kerja CGI presisi dengan pemodelan aset fotorealistik, simulasi partikel, dan rendering resolusi tinggi.',
        result: p.result || 'Meningkatkan pemahaman audiens secara terukur dan memberikan aset visual yang bernilai jangka panjang bagi klien.',
        highlights: metricsList,
      },
      {
        id: `pipeline-${p.slug}`,
        type: 'workflow-phases',
        badge: 'Tahapan Produksi',
        title: 'Tahapan Eksekusi Produksi',
        description: 'Alur kerja terstruktur yang dilalui studio dalam menyelesaikan proyek animasi ini.',
        phases: [
          { step: '01', title: 'Treatment & Visual Script', description: 'Penyusunan naskah visual, penentuan ritme, dan perumusan konsep artistik.' },
          { step: '02', title: 'Storyboarding & 2D Animatic', description: 'Penguncian timing durasi, komposisi pergerakan kamera, dan sudut pandang.' },
          { step: '03', title: 'Asset Modeling, Look-Dev & FX', description: 'Pembuatan model 2D/3D presisi, texturing realistis, dan simulasi fisika.' },
          { step: '04', title: 'Compositing, Sound & 4K Master', description: 'Pewarnaan akhir, tata suara sinematik, dan final render kualitas bioskop.' },
        ],
      },
      {
        id: `tech-${p.slug}`,
        type: 'tech-stack-chips',
        title: 'Software & Pipeline Tools yang Digunakan',
        description: 'Teknologi rendering dan animasi yang digunakan dalam proyek ini.',
        technologies: techList,
      },
      {
        id: `cta-${p.slug}`,
        type: 'interactive-cta',
        eyebrow: 'Tertarik dengan Hasil Serupa?',
        headline: 'Diskusikan Kebutuhan Animasi Anda Bersama Tim UNIMASI',
        description: 'Kami siap membantu mewujudkan ide kompleks Anda menjadi karya visual animasi yang memikat.',
        primaryCta: { label: 'Mulai Proyek Animasi', href: '/contact' },
        secondaryCta: { label: 'Jelajahi Portofolio Lain', href: '/portfolio' },
      },
    ]

    const validated = parseBlocks(blocks)
    if (!validated.ok) {
      console.error(`❌ Validasi blok gagal untuk portofolio ${p.slug}:`, validated.issues)
      continue
    }

    await prisma.orm.public.Portfolio.where({ id: p.id }).update({
      blocks: JSON.stringify(validated.blocks),
    })
    portCount++
    console.log(`  ✓ Portofolio [${p.slug}]: Berhasil disuntik ${blocks.length} blok`)
  }

  console.log('\n🎉 MIGRASI BLOK SELESAI DENGAN SUKSES!')
  console.log(`- Kategori Layanan : ${catCount}/${categories.length} entitas terkonversi`)
  console.log(`- Layanan Spesifik : ${svcCount}/${services.length} entitas terkonversi`)
  console.log(`- Solusi Bisnis    : ${solCount}/${solutions.length} entitas terkonversi`)
  console.log(`- Studi Portofolio : ${portCount}/${portfolios.length} entitas terkonversi`)
}

migrateBlocks().catch((err) => {
  console.error('Fatal error during block migration:', err)
  process.exit(1)
})
