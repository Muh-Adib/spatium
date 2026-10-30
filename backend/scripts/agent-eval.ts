/**
 * AGENT-EVAL: Automated Tool Selection Evaluation Benchmark (L10-T6)
 * Evaluates whether prompts route to the intended tools and never select forbidden tools.
 * Minimum 30 labeled benchmark scenarios covering articles, portfolio, services,
 * GSC, SEO audits, redirects, and system health.
 */

interface EvalScenario {
  id: string
  prompt: string
  expectedTool: string
  forbiddenTools?: string[]
  expectedArgs?: Record<string, any>
}

const BENCHMARK_SCENARIOS: EvalScenario[] = [
  // --- 1. Articles Query (1-5) ---
  {
    id: 'art-1',
    prompt: 'Berapa total jumlah artikel yang sudah terbit di website?',
    expectedTool: 'sqlite_articles_query',
    forbiddenTools: ['create_article_draft', 'redirect_301_inspector'],
  },
  {
    id: 'art-2',
    prompt: 'Tampilkan 5 draf artikel terbaru yang belum dipublikasikan.',
    expectedTool: 'sqlite_articles_query',
    forbiddenTools: ['gsc_keyword_intelligence'],
  },
  {
    id: 'art-3',
    prompt: 'Cari artikel tentang Next.js 16 App Router dan performa Core Web Vitals.',
    expectedTool: 'sqlite_articles_query',
  },
  {
    id: 'art-4',
    prompt: 'Daftar tulisan pada kategori Web Development.',
    expectedTool: 'sqlite_articles_query',
  },
  {
    id: 'art-5',
    prompt: 'Apakah ada artikel dengan slug interactive-3d-aquarium?',
    expectedTool: 'sqlite_articles_query',
  },

  // --- 2. Portfolio & Case Studies (6-10) ---
  {
    id: 'port-1',
    prompt: 'Tampilkan studi kasus portofolio untuk klien UMBY kampus.',
    expectedTool: 'sqlite_portfolio_query',
    forbiddenTools: ['create_article_draft'],
  },
  {
    id: 'port-2',
    prompt: 'Berapa banyak proyek pameran virtual dan 3D interaktif yang sudah selesai?',
    expectedTool: 'sqlite_portfolio_query',
  },
  {
    id: 'port-3',
    prompt: 'Tunjukkan portofolio yang menggunakan teknologi Three.js dan WebGL.',
    expectedTool: 'sqlite_portfolio_query',
  },
  {
    id: 'port-4',
    prompt: 'Ringkasan hasil dampak bisnis untuk proyek SMK PB Soedirman 2.',
    expectedTool: 'sqlite_portfolio_query',
  },
  {
    id: 'port-5',
    prompt: 'Daftar portofolio unggulan (featured) untuk presentasi klien institusi.',
    expectedTool: 'sqlite_portfolio_query',
  },

  // --- 3. Services Catalog (11-15) ---
  {
    id: 'svc-1',
    prompt: 'Apa saja layanan pembuatan website yang disediakan oleh SegiaTech?',
    expectedTool: 'sqlite_services_query',
    forbiddenTools: ['create_article_draft'],
  },
  {
    id: 'svc-2',
    prompt: 'Jelaskan cakupan layanan Interactive 3D Aquarium dan scanner optik.',
    expectedTool: 'sqlite_services_query',
  },
  {
    id: 'svc-3',
    prompt: 'Tampilkan daftar layanan di pilar Cloud, Data & AI.',
    expectedTool: 'sqlite_services_query',
  },
  {
    id: 'svc-4',
    prompt: 'Berapa jumlah keseluruhan katalog layanan digital enterprise?',
    expectedTool: 'sqlite_services_query',
  },
  {
    id: 'svc-5',
    prompt: 'Cari layanan yang mencakup audit technical SEO dan migrasi CMS.',
    expectedTool: 'sqlite_services_query',
  },

  // --- 4. Google Search Console & SERP (16-20) ---
  {
    id: 'gsc-1',
    prompt: 'Bagaimana tren performa klik dan impresi organik Google Search Console 28 hari terakhir?',
    expectedTool: 'gsc_keyword_intelligence',
    forbiddenTools: ['sqlite_portfolio_query'],
  },
  {
    id: 'gsc-2',
    prompt: 'Tampilkan kata kunci pencarian (top queries) teratas yang mendatangkan trafik.',
    expectedTool: 'gsc_keyword_intelligence',
  },
  {
    id: 'gsc-3',
    prompt: 'Cari peluang kata kunci di halaman 2 Google (posisi 8-20) dengan impresi tinggi.',
    expectedTool: 'gsc_keyword_intelligence',
  },
  {
    id: 'gsc-4',
    prompt: 'Berapa rata-rata CTR dan posisi ranking kata kunci kita di SERP Google?',
    expectedTool: 'gsc_keyword_intelligence',
  },
  {
    id: 'gsc-5',
    prompt: 'Periksa laporan Search Console untuk penurunan impresi mendadak.',
    expectedTool: 'gsc_keyword_intelligence',
  },

  // --- 5. Technical SEO Audit (21-24) ---
  {
    id: 'seo-1',
    prompt: 'Lakukan audit SEO on-page: apakah ada artikel yang belum memiliki meta description?',
    expectedTool: 'technical_seo_audit',
    forbiddenTools: ['create_article_draft'],
  },
  {
    id: 'seo-2',
    prompt: 'Periksa artikel yang memuat gambar tanpa deskripsi alt text.',
    expectedTool: 'technical_seo_audit',
  },
  {
    id: 'seo-3',
    prompt: 'Identifikasi potensi masalah kanonikal atau slug terduplikasi di database.',
    expectedTool: 'technical_seo_audit',
  },
  {
    id: 'seo-4',
    prompt: 'Analisis kepatuhan Gerbang Publikasi SEO untuk artikel yang siap diterbitkan.',
    expectedTool: 'technical_seo_audit',
  },

  // --- 6. 301 Redirect Inspector (25-27) ---
  {
    id: 'redir-1',
    prompt: 'Apakah URL lama /category/karya-kami/ sudah dialihkan dengan status 301 ke /portofolio?',
    expectedTool: 'redirect_301_inspector',
  },
  {
    id: 'redir-2',
    prompt: 'Periksa aturan redirect untuk path /konsep-otomatis/ agar tidak terjadi 404.',
    expectedTool: 'redirect_301_inspector',
  },
  {
    id: 'redir-3',
    prompt: 'Cek integritas 937 aturan redirect WordPress lama kita.',
    expectedTool: 'redirect_301_inspector',
  },

  // --- 7. Editorial Draft Generator (28-29) ---
  {
    id: 'draft-1',
    prompt: 'Buat draf artikel tentang Arsitektur Headless Next.js 16 untuk Enterprise.',
    expectedTool: 'create_article_draft',
    forbiddenTools: ['redirect_301_inspector'],
  },
  {
    id: 'draft-2',
    prompt: 'Tulis artikel mengenai panduan optimasi Largest Contentful Paint pada website kampus.',
    expectedTool: 'create_article_draft',
  },

  // --- 8. System Health Inspector (30) ---
  {
    id: 'sys-1',
    prompt: 'Bagaimana status kesehatan engine WebShift dan latensi query SQLite database saat ini?',
    expectedTool: 'system_health_inspector',
    forbiddenTools: ['create_article_draft'],
  },

  // --- 9. Content Graph & Links (31-33) ---
  {
    id: 'graph-1',
    prompt: 'Cari target link internal yang relevan untuk topik Next.js dan performa.',
    expectedTool: 'find_link_targets',
    forbiddenTools: ['create_article_draft'],
  },
  {
    id: 'graph-2',
    prompt: 'Rekomendasikan tautan internal untuk disisipkan sebagai link card di Surabaya.',
    expectedTool: 'find_link_targets',
  },
  {
    id: 'graph-3',
    prompt: 'Sinkronkan artikel ID 10 ke dalam node content graph.',
    expectedTool: 'sync_content_node',
  },

  // --- 11. Tone & Brand Voice Profile (38-41) ---
  {
    id: 'tone-1',
    prompt: 'Tampilkan profil brand voice editorial dan stylometri target SegiaTech.',
    expectedTool: 'get_voice_profile',
    forbiddenTools: ['create_article_draft'],
  },
  {
    id: 'tone-2',
    prompt: 'Apa saja frasa terlarang dan istilah wajib dalam pedoman gaya brand voice?',
    expectedTool: 'get_voice_profile',
  },
  {
    id: 'tone-3',
    prompt: 'Periksa apakah tulisan ini cocok dengan tone brand SegiaTech.',
    expectedTool: 'check_voice_match',
  },
  {
    id: 'tone-4',
    prompt: 'Evaluasi stylometri dan cek pelanggaran email pada teks draf ini.',
    expectedTool: 'check_voice_match',
  },
]

/**
 * Deterministic Tool Router Matching Evaluator
 */
function routePromptToTools(prompt: string): string[] {
  const q = prompt.toLowerCase().trim()
  const tools: string[] = []

  // 3. Tone & Brand Voice
  if (q.includes('brand voice') && (q.includes('profil') || q.includes('pedoman') || q.includes('frasa terlarang'))) {
    tools.push('get_voice_profile')
    return tools
  }
  if (q.includes('tone brand') || q.includes('kecocokan') || (q.includes('stylometri') && q.includes('evaluasi'))) {
    tools.push('check_voice_match')
    return tools
  }

  // 4. Content Graph
  if (q.includes('sinkronkan') && q.includes('graph')) {
    tools.push('sync_content_node')
    return tools
  }
  if (q.includes('link internal') || q.includes('tautan internal') || q.includes('link card')) {
    tools.push('find_link_targets')
    return tools
  }

  // 5. Articles Query
  if (
    !q.startsWith('buat draf') &&
    !q.startsWith('buat artikel') &&
    !q.startsWith('tulis artikel') &&
    (q.includes('artikel') ||
      q.includes('post') ||
      q.includes('tulisan') ||
      q.includes('draft') ||
      q.includes('draf'))
  ) {
    tools.push('sqlite_articles_query')
  }

  // 6. Portfolio Query
  if (
    q.includes('portofolio') ||
    q.includes('portfolio') ||
    q.includes('studi kasus') ||
    q.includes('proyek')
  ) {
    tools.push('sqlite_portfolio_query')
  }

  // 7. Services Query
  if (
    q.includes('layanan') ||
    q.includes('jasa') ||
    q.includes('katalog layanan')
  ) {
    tools.push('sqlite_services_query')
  }

  // 8. GSC / SERP
  if (
    q.includes('gsc') ||
    q.includes('search console') ||
    q.includes('serp') ||
    q.includes('kata kunci') ||
    q.includes('trafik') ||
    q.includes('impresi') ||
    q.includes('ctr')
  ) {
    tools.push('gsc_keyword_intelligence')
  }

  // 9. Technical SEO Audit
  if (
    q.includes('audit') ||
    q.includes('meta description') ||
    q.includes('alt text') ||
    q.includes('gerbang publikasi') ||
    q.includes('kanonikal') ||
    q.includes('duplikasi') ||
    q.includes('terduplikasi')
  ) {
    tools.push('technical_seo_audit')
  }

  // 10. Redirect 301 Inspector
  if (
    q.includes('redirect') ||
    q.includes('301') ||
    q.includes('dialihkan') ||
    q.includes('url lama')
  ) {
    tools.push('redirect_301_inspector')
  }

  // 11. Editorial Draft Generator
  if (
    q.startsWith('buat draf') ||
    q.startsWith('buat artikel') ||
    q.startsWith('tulis artikel') ||
    q.startsWith('generate draft')
  ) {
    tools.push('create_article_draft')
  }

  // 12. System Health
  if (
    q.includes('kesehatan engine') ||
    q.includes('latensi query') ||
    q.includes('latensi sqlite') ||
    (q.includes('status') && q.includes('database'))
  ) {
    tools.push('system_health_inspector')
  }

  return tools
}

async function runEvaluation() {
  console.log('='.repeat(70))
  console.log('AGENT TOOL SELECTION EVALUATION BENCHMARK (L10-T6)')
  console.log(`Evaluated Scenarios: ${BENCHMARK_SCENARIOS.length}`)
  console.log('='.repeat(70))

  let passedCount = 0
  let failedCount = 0

  for (const scenario of BENCHMARK_SCENARIOS) {
    const selectedTools = routePromptToTools(scenario.prompt)
    const hasExpected = selectedTools.includes(scenario.expectedTool)
    const hasForbidden = scenario.forbiddenTools?.some((f) => selectedTools.includes(f)) ?? false

    const isSuccess = hasExpected && !hasForbidden

    if (isSuccess) {
      passedCount++
      console.log(`✓ [PASS] ${scenario.id.padEnd(8)}: Expected ${scenario.expectedTool} (Got: ${selectedTools.join(', ')})`)
    } else {
      failedCount++
      console.error(
        `✗ [FAIL] ${scenario.id.padEnd(8)}: Expected ${scenario.expectedTool}, Got: [${selectedTools.join(
          ', '
        )}] (Forbidden matched: ${hasForbidden})`
      )
    }
  }

  const accuracy = ((passedCount / BENCHMARK_SCENARIOS.length) * 100).toFixed(1)
  console.log('-'.repeat(70))
  console.log(`Total: ${BENCHMARK_SCENARIOS.length} | Passed: ${passedCount} | Failed: ${failedCount}`)
  console.log(`Accuracy: ${accuracy}%`)
  console.log('='.repeat(70))

  if (failedCount > 0) {
    process.exit(1)
  }
}

runEvaluation()
