import { describe, it, expect } from 'vitest'
import { calculateStylometry, buildProfileFromArticles, extractCleanText } from '../src/lib/voice/stylometry'
import { checkVoiceMatch, evaluateContentVoice, getActiveVoiceProfile } from '../src/lib/voice/checker'

describe('Sprint S6: Tone Profile & Stylometry Engine (ADR-0012)', () => {
  it('extracts clean text and computes deterministic stylometry metrics', () => {
    const rawMarkdown = `
# Arsitektur Web Modern

Kami di SegiaTech mengembangkan sistem aplikasi berbasis Next.js 16. Pendekatan ini dirancang untuk memastikan performa sub-detik pada seluruh rute produksi.

Apakah Anda siap meningkatkan konversi digital bisnis Anda? Solusi kami telah teruji melayani ribuan transaksi setiap hari.

- Integrasi SQLite zero-downtime
- Latensi kueri di bawah 3ms
- Proteksi keamanan berlapis
`
    const metrics = calculateStylometry(rawMarkdown)

    expect(metrics.wordCount).toBeGreaterThan(30)
    expect(metrics.sentenceCount).toBeGreaterThanOrEqual(3)
    expect(metrics.avgSentenceLength).toBeGreaterThan(5)
    expect(metrics.povRatios.firstPersonPlural).toBeGreaterThan(0) // kami
    expect(metrics.povRatios.secondPerson).toBeGreaterThan(0) // Anda
    expect(metrics.povRatios.firstPersonSingular).toBe(0) // no saya/aku
    expect(metrics.listRatio).toBeGreaterThan(0)
    expect(metrics.numberRatio).toBeGreaterThan(0) // 16, 3ms
  })

  it('aggregates baseline stylometry across multiple articles deterministically', () => {
    const articles = [
      'Kami merancang website modern untuk perusahaan manufaktur. Sistem kami menjamin performa tinggi.',
      'Apakah Anda membutuhkan transformasi digital? Kami menyediakan layanan rekayasa perangkat lunak enterprise dengan standar 99.9% uptime.',
    ]

    const baseline = buildProfileFromArticles(articles)
    expect(baseline.wordCount).toBeGreaterThan(0)
    expect(baseline.avgSentenceLength).toBeGreaterThan(0)
    expect(baseline.povRatios.firstPersonPlural).toBeGreaterThan(0.5)
  })

  it('retrieves active voice profile from database', async () => {
    const profile = await getActiveVoiceProfile()
    expect(profile).not.toBeNull()
    expect(profile?.name).toBe('SegiaTech Engineering Editorial Voice')
    expect(profile?.lexicon.bannedPhrases).toContain('termurah se-indonesia')
    expect(profile?.lexicon.signaturePhrases).toContain('arsitektur web modern')
  })

  it('passes voice match on high-quality SegiaTech engineering article', async () => {
    const sampleArticle = `
Dalam era digital saat ini, arsitektur web modern menjadi pondasi utama keberhasilan bisnis.
Kami di SegiaTech mengimplementasikan Next.js dan performa sub-detik untuk menjamin pengalaman pengguna optimal.
Apakah Anda mengalami kendala latensi pada platform lama Anda? Kami siap membantu proses modernisasi teknologi Anda.
`
    const result = await checkVoiceMatch(sampleArticle)
    expect(result.pass).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.deviations.filter((d) => d.severity === 'error').length).toBe(0)
  })

  it('flags email ban violation when email address is exposed in content body', async () => {
    const contentWithEmail = `
Kami menyediakan layanan rekayasa website enterprise.
Untuk konsultasi lebih lanjut, silakan kirim email ke admin@segiatech.com atau kontak tim kami.
`
    const result = await checkVoiceMatch(contentWithEmail)
    expect(result.pass).toBe(false)
    const emailError = result.deviations.find((d) => d.dimension === 'email_ban')
    expect(emailError).toBeDefined()
    expect(emailError?.severity).toBe('error')
  })

  it('flags banned hyperbolic phrases as critical errors', async () => {
    const spamContent = `
Kami menawarkan jasa website termurah se-indonesia dengan fitur paling lengkap dan dijamin nomor satu di Google.
`
    const result = await checkVoiceMatch(spamContent)
    expect(result.pass).toBe(false)
    const bannedError = result.deviations.find((d) => d.dimension === 'banned_phrase')
    expect(bannedError).toBeDefined()
    expect(bannedError?.severity).toBe('error')
  })

  it('warns on first-person singular POV drift', async () => {
    const personalBlog = `
Saya ingin menceritakan pengalaman saya ketika saya membuat blog pribadi saya kemarin.
Saya merasa bahwa proyek saya ini sangat memuaskan bagi saya sendiri dan aku sangat menyukainya.
`
    const result = await checkVoiceMatch(personalBlog)
    const povDev = result.deviations.find((d) => d.dimension === 'pov_consistency')
    expect(povDev).toBeDefined()
    expect(povDev?.severity).toBe('warning')
  })
})
