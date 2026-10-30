export function normalizeSchedule(value: unknown, timezone: unknown, now = new Date()): { scheduledAt: string; publicationTimezone: string } {
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('Jadwal wajib memuat zona waktu UTC atau offset.')
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date <= now) throw new Error('Jadwal publikasi harus berada di masa depan.')
  if (typeof timezone !== 'string') throw new Error('Zona waktu publikasi wajib diisi.')
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(date) } catch { throw new Error('Zona waktu tidak valid.') }
  return { scheduledAt: date.toISOString(), publicationTimezone: timezone }
}

export function extractContentImages(html: string) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map(([tag]) => ({
    url: tag.match(/\bsrc=["']([^"']*)["']/i)?.[1] || '',
    altText: tag.match(/\balt=["']([^"']*)["']/i)?.[1] || '',
    decorative: /\b(?:role=["']presentation["']|aria-hidden=["']true["'])/i.test(tag),
  }))
}
