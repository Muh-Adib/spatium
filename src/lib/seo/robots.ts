/** Normalize stored/Yoast robots directives into the same public/editor contract. */
export function parseRobots(value: unknown) {
  const raw = typeof value === 'string' ? value : value && typeof value === 'object' ? Object.values(value).filter((v) => typeof v === 'string').join(', ') : ''
  const object = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const numeric = (name: string) => {
    const match = raw.match(new RegExp(`${name}:\\s*(-?\\d+)`, 'i'))
    return match ? Number(match[1]) : undefined
  }
  const preview = raw.match(/max-image-preview:\s*(none|standard|large)/i)?.[1]
  return {
    index: typeof object.index === 'boolean' ? object.index : !/\bnoindex\b/i.test(raw),
    follow: typeof object.follow === 'boolean' ? object.follow : !/\bnofollow\b/i.test(raw),
    noarchive: object.noarchive === true || /\bnoarchive\b/i.test(raw),
    nosnippet: object.nosnippet === true || /\bnosnippet\b/i.test(raw),
    maxSnippet: typeof object.maxSnippet === 'number' ? object.maxSnippet : numeric('max-snippet'),
    maxVideoPreview: typeof object.maxVideoPreview === 'number' ? object.maxVideoPreview : numeric('max-video-preview'),
    maxImagePreview: typeof object.maxImagePreview === 'string' ? object.maxImagePreview : preview,
  }
}
