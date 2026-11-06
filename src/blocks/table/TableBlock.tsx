

export function TableBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const headers: string[] = block?.headers || data.headers || []
  const rows: string[][] = block?.rows || data.rows || []
  const caption: string = block?.caption || data.caption || ''
  const title: string = block?.title || data.title || ''

  if (!headers.length && !rows.length) return null

  return (
    <section className="py-8 bg-[var(--color-background)] text-white">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        {title && (
          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white mb-4">
            {title}
          </h3>
        )}
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm border-collapse">
            {headers.length > 0 && (
              <thead className="bg-[#0F3A79]/40 border-b border-white/10 text-white font-semibold">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="py-3 px-4 text-xs font-mono tracking-wider uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-white/5">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.04] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3 px-4 text-[var(--text-muted)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {caption && (
          <p className="mt-2 text-xs text-neutral-400 font-mono italic">
            {caption}
          </p>
        )}
      </div>
    </section>
  )
}
