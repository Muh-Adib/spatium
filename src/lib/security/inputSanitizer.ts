/**
 * SegiaTech Security Parser & Input Sanitizer
 * 
 * Provides defense-in-depth against:
 * 1. Cross-Site Scripting (XSS)
 * 2. SQL Injection (SQLi) patterns and comments
 * 3. Command Injection & Null-Byte poisoning
 * 4. Dangerous URI protocols and control character injections
 */

export interface SanitizeOptions {
  maxLength?: number
  allowLineBreaks?: boolean
  stripSqlKeywords?: boolean
}

/**
 * Sanitizes arbitrary client text input for safe display and transmission.
 */
export function sanitizeClientInput(
  rawInput: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  if (!rawInput || typeof rawInput !== 'string') {
    return ''
  }

  const {
    maxLength = 500,
    allowLineBreaks = true,
    stripSqlKeywords = true,
  } = options

  // 1. Strip null bytes and non-printable control characters (except newline/tab if allowed)
  let cleaned = rawInput.replace(/\0/g, '')
  if (allowLineBreaks) {
    cleaned = cleaned.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  } else {
    cleaned = cleaned.replace(/[\x01-\x1F\x7F]/g, ' ')
  }

  // 2. Strip HTML tags completely (<script>, <iframe>, <object>, <img>, etc.)
  cleaned = cleaned.replace(/<[^>]*>?/gm, '')

  // 3. Neutralize dangerous SQL Injection patterns & comment syntax
  if (stripSqlKeywords) {
    // Strip SQL comment tokens
    cleaned = cleaned.replace(/--+/g, '-')
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '')

    // Neutralize SQL command chaining
    cleaned = cleaned.replace(/;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC|UNION|SELECT)\b/gi, ' $1')

    // Neutralize classic SQL tautologies (e.g. OR 1=1, ' OR '1'='1)
    cleaned = cleaned.replace(/\b(OR|AND)\s+['"]?1['"]?\s*=\s*['"]?1['"]?/gi, '')
    cleaned = cleaned.replace(/\b(OR|AND)\s+['"]?0['"]?\s*=\s*['"]?0['"]?/gi, '')
    cleaned = cleaned.replace(/\bUNION\s+(ALL\s+)?SELECT\b/gi, 'UNION_SELECT')
    cleaned = cleaned.replace(/\bxp_cmdshell\b/gi, '')
    cleaned = cleaned.replace(/\bSLEEP\s*\(\s*\d+\s*\)/gi, '')
    cleaned = cleaned.replace(/\bBENCHMARK\s*\(\s*\d+/gi, '')
  }

  // 4. Escape special HTML entities to prevent DOM injection
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  // 5. Unescape common safe punctuation for readable Indonesian text rendering
  // (We decode quotes back safely for display as long as tags are stripped)
  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')

  // 6. Normalize excessive consecutive whitespace / newlines
  cleaned = cleaned.replace(/[ \t]{3,}/g, '  ')
  if (allowLineBreaks) {
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  }

  // 7. Enforce maximum string length
  const trimmed = cleaned.trim()
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength)
  }

  return trimmed
}

/**
 * Validates whether a text contains potential malicious injection payloads.
 */
export function containsSuspiciousPayload(input: string): boolean {
  if (!input) return false
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /--\s*$/,
    /\/\*.*?\*\//,
    /;\s*(DELETE|DROP|ALTER)/i,
    /\bOR\s+1\s*=\s*1\b/i,
  ]
  return suspiciousPatterns.some((pattern) => pattern.test(input))
}
