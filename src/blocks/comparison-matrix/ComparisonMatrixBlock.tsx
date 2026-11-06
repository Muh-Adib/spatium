import { CheckCircle2, XCircle, Check } from 'lucide-react'

export function ComparisonMatrixBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const pickRows = (val: any): any[] | null =>
    Array.isArray(val) && val.length > 0 ? val : null
  const rawRows =
    pickRows(block?.rows) ||
    pickRows(data.rows) ||
    // Manifest documents the payload as `items`; normalise it here so an
    // admin-authored block renders instead of falling back to defaults.
    pickRows(block?.items) ||
    pickRows(data.items)
  const rows = (
    rawRows || [
      { feature: 'Pengalaman Ruang', highlight: 'Walkable 3D Gaussian Splat dari ruang nyata', traditional: 'Foto atau video statis' },
      { feature: 'Akurasi Data', highlight: 'Berbasis laser scan dan point cloud terkalibrasi', traditional: 'Estimasi visual tanpa skala' },
      { feature: 'Pemanfaatan Aset', highlight: 'Pindai sekali, pakai untuk banyak format keluaran', traditional: 'Satu aset untuk satu kebutuhan' },
    ]
  ).map((row: any) => ({
    feature: row.feature || row.aspect || row.title || '',
    highlight: row.highlight || row.unimasi || row.segia || '',
    traditional: row.traditional || row.conventional || '',
  }))
  const title = block?.title || data.title || 'Mengapa Memilih Layanan Kami untuk Proyek Anda'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -top-24 -translate-x-1/2 w-[700px] h-[350px] bg-accent/[0.05] rounded-full blur-[140px]" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Perbandingan Nilai
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xl">
          {/* Header row */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[var(--card-border)] bg-[var(--color-surface)] text-xs font-mono">
            <div className="p-4 md:col-span-4 text-[var(--text-dim)] font-semibold uppercase tracking-wider">
              Kebutuhan Bisnis Anda
            </div>
            <div className="p-4 md:col-span-4 bg-accent/10 text-accent font-bold uppercase tracking-wider flex items-center gap-2 border-l border-r border-accent/20">
              <Check className="w-4 h-4 text-accent" />
              <span>Standar SPATIUM</span>
            </div>
            <div className="p-4 md:col-span-4 text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Agensi Konvensional
            </div>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-white/5 text-sm">
            {rows.map((row: any, rIdx: number) => (
              <div
                key={rIdx}
                className="grid grid-cols-1 md:grid-cols-12 items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="p-4 md:col-span-4 font-medium text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                  <span>{row.feature}</span>
                </div>
                <div className="p-4 md:col-span-4 bg-accent/[0.04] border-l border-r border-accent/15 font-mono text-xs text-accent flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>{row.highlight}</span>
                </div>
                <div className="p-4 md:col-span-4 font-mono text-xs text-[var(--text-dim)] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[var(--text-dim)] shrink-0" />
                  <span>{row.traditional}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
