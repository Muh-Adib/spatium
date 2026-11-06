import { Cpu, ShieldCheck, Zap } from 'lucide-react'

export function EngineeringPillarsBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const pillars = Array.isArray(block?.pillars)
    ? block.pillars
    : Array.isArray(data.pillars)
    ? data.pillars
    : []
  const title = block?.title || data.title
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-accent block mb-2 font-semibold">
              Engineering Disciplines
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-3 text-[var(--text-muted)] max-w-2xl text-body-md sm:text-body-lg">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 cq-cols-3 gap-6">
          {pillars.map((pil: any, idx: number) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:-translate-y-1 shadow-lg relative group overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform" />
              <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-[var(--card-border)] flex items-center justify-center text-accent mb-5 group-hover:bg-accent/10 transition-colors">
                {idx === 0 ? <Cpu className="w-5 h-5" /> : idx === 1 ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">{pil.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{pil.description || pil.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
