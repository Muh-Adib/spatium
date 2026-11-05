/**
 * Embed Validator & Security Policy for UNIMASI Media Architecture
 *
 * Enforces strict domain allowlists and protocol sanity checks
 * to prevent SSRF, XSS, and clickjacking attacks via CMS-driven iframe previews.
 */

export const ALLOWED_EMBED_DOMAINS = [
  'unimasi.id',
  'www.unimasi.id',
  'unimasi.studio',
  'www.unimasi.studio',
  'unimasi.com',
  'www.unimasi.com',
  'unicamstudio.com',
  'www.unicamstudio.com',
  'smkpbsoedirman2.sch.id',
  'www.smkpbsoedirman2.sch.id',
  'smkmahanaim.sch.id',
  'www.smkmahanaim.sch.id',
  'pmb.umby.ac.id',
  'umby.ac.id',
  'figma.com',
  'www.figma.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtube.com',
  'www.youtube.com',
  'vimeo.com',
  'player.vimeo.com',
  'github.com',
  'www.github.com',
] as const

export interface EmbedValidationResult {
  isValid: boolean
  safeUrl?: string
  domain?: string
  reason?: string
}

/**
 * Validates any external URL intended for iframe embedding or live preview.
 */
export function validateEmbedUrl(rawUrl: string): EmbedValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, reason: 'URL kosong atau tidak valid.' }
  }

  const trimmed = rawUrl.trim()

  // 1. Strict Protocol Check (Reject javascript:, data:, file:, vbscript:, etc.)
  if (/^(javascript|data|file|vbscript|about|blob):/i.test(trimmed)) {
    return { isValid: false, reason: 'Skema protokol tidak diizinkan untuk alasan keamanan.' }
  }

  // 2. Parse URL structure
  let parsed: URL
  try {
    parsed = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed)
  } catch {
    return { isValid: false, reason: 'Format URL tidak valid.' }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { isValid: false, reason: 'Hanya protokol HTTP/HTTPS yang didukung.' }
  }

  // 3. Reject IP address hosts (prevent SSRF against localhost, metadata service, or internal IPs)
  const hostname = parsed.hostname.toLowerCase()
  if (
    /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.|::1|0\.0\.0\.0)/.test(
      hostname
    ) ||
    hostname === 'localhost'
  ) {
    return { isValid: false, reason: 'Alamat IP lokal atau internal tidak diizinkan.' }
  }

  // 4. Check domain allowlist
  const isAllowed = ALLOWED_EMBED_DOMAINS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  )

  if (!isAllowed) {
    return {
      isValid: false,
      domain: hostname,
      reason: `Domain "${hostname}" tidak terdaftar dalam allowlist mitra resmi UNIMASI.`,
    }
  }

  return {
    isValid: true,
    safeUrl: parsed.toString(),
    domain: hostname,
  }
}

/**
 * Generates standard sandbox attributes for iframe rendering.
 */
export function getEmbedSandboxPolicy(): string {
  return 'allow-scripts allow-same-origin allow-popups allow-forms'
}

/** Article video embeds use the shared policy plus a narrow HTTPS provider set. */
export function validateVideoEmbedUrl(rawUrl: string): EmbedValidationResult {
  const result = validateEmbedUrl(rawUrl)
  if (!result.isValid || !result.safeUrl) return result
  const url = new URL(result.safeUrl)
  if (url.protocol !== 'https:' || url.username || url.password || !['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'player.vimeo.com'].includes(url.hostname)) {
    return { isValid: false, reason: 'Video harus memakai penyedia HTTPS yang diizinkan.' }
  }
  return result
}
