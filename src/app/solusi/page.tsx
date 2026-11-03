import type { Metadata } from 'next'
import Link from 'next/link'
import { getSolutions } from '@/lib/db/solutions'
import { siteConfig } from '@/config/site'
import { ThematicWave } from '@/components/ui/ThematicWave'
import { CheckCircle2, ArrowRight, Sparkles, ChevronRight } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Solusi Animasi & Visualisasi Industri · UNIMASI Studio',
  description:
    'Jelajahi solusi animasi 3D, motion design, dan aset CGI berstandar industri untuk mempermudah komunikasi teknis dan mendorong konversi bisnis.',
  alternates: {
    canonical: `${siteConfig.url}/solusi`,
  },
  openGraph: {
    type: 'website',
    title: 'Solusi Animasi & Visualisasi Industri · UNIMASI Studio',
    description:
      'Solusi visualisasi CGI 3D untuk sektor manufaktur, arsitektur, teknologi, dan edukasi.',
    url: `${siteConfig.url}/solusi`,
    siteName: 'UNIMASI Studio',
  },
}

export default async function SolusiIndexPage() {
  const solutions = await getSolutions()

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-white">
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 border-b border-[var(--card-border)]">
        <ThematicWave opacity={0.65} showBottomWave={true} />
        <div className="pointer-events-none absolute -left-20 top-20 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full bg-[#0F3A79]/[0.08] blur-[150px]" />

        <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SOLUSI SPESIALIS INDUSTRI</span>
          </div>

          <h1 className="text-display-md sm:text-display-lg font-bold tracking-tight text-white leading-[1.15]">
            Solusi Rekayasa Visual &amp; Animasi Presisi
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Mengubah materi teknis rumit menjadi pengalaman visual memukau yang meningkatkan pemahaman stakeholder dan mempercepat keputusan bisnis.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 bg-[var(--color-surface)] border-b border-[var(--card-border)]">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((sol) => (
              <div
                key={sol.id}
                className="rounded-3xl border border-[var(--card-border)] bg-[var(--color-background)] p-8 flex flex-col justify-between hover:border-accent/40 transition-all group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono font-semibold">
                      {sol.category || 'Solusi Bisnis'}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">
                      Production Ready
                    </span>
                  </div>

                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
                    {sol.title}
                  </h2>

                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed mb-6">
                    {sol.shortDescription || sol.description}
                  </p>

                  {/* Benefits */}
                  {Array.isArray(sol.keyBenefits) && sol.keyBenefits.length > 0 && (
                    <div className="space-y-2 mb-8">
                      {sol.keyBenefits.slice(0, 3).map((b: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-300">
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[var(--card-border)] flex items-center justify-between">
                  <Link
                    href={`/solusi/${sol.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-mono text-accent font-bold group-hover:translate-x-1 transition-transform"
                  >
                    <span>Pelajari Solusi Lengkap</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--color-background)] text-center">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-display-sm sm:text-display-md font-bold text-white">
            Punya Kebutuhan Spesifik di Luar Katalog?
          </h2>
          <p className="mt-4 text-body-md text-[var(--text-muted)] max-w-xl mx-auto">
            Diskusikan langsung bersama tim sutradara dan technical artist UNIMASI Studio. Kami siap menyusun alur kerja produksi yang disesuaikan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-[var(--color-primaryForeground)] font-bold text-xs font-mono uppercase tracking-wider hover:bg-[#ffe855] transition-all shadow-[0_0_25px_rgba(255,214,0,0.3)]"
            >
              <span>Konsultasi Proyek</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
