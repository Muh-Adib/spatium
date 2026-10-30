import path from 'path'
import crypto from 'crypto'

export interface MimeDetectionResult {
  mime: string
  ext: string
}

/**
 * Detects MIME type strictly from the file buffer magic bytes.
 * Never trusts client-supplied Content-Type or file extension.
 */
export function detectMimeFromBytes(buffer: Buffer): MimeDetectionResult | null {
  if (!buffer || buffer.length < 4) {
    return null
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' }
  }

  // 3. GIF: 'GIF87a' or 'GIF89a'
  if (
    buffer.length >= 6 &&
    buffer.subarray(0, 4).toString('ascii') === 'GIF8' &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { mime: 'image/gif', ext: 'gif' }
  }

  // 4. WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' }
  }

  // 5. AVIF: ....ftypavif or ....ftypavis
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString('ascii') === 'ftyp'
  ) {
    const brand = buffer.subarray(8, 12).toString('ascii')
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
      return { mime: 'image/avif', ext: 'avif' }
    }
  }

  // 6. SVG: XML or SVG markup
  const textSample = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf-8').trim()
  if (
    textSample.startsWith('<?xml') ||
    textSample.startsWith('<svg') ||
    /<svg[\s>]/i.test(textSample)
  ) {
    return { mime: 'image/svg+xml', ext: 'svg' }
  }

  return null
}

export interface SvgSanitizeResult {
  valid: boolean
  sanitized?: string
  error?: string
}

/**
 * Strict SVG Sanitizer
 * Rejects scripts, event handlers, foreignObject, iframe, embed, object, javascript: URLs, and XXE DTD entities.
 */
export function sanitizeSvg(svgContent: string): SvgSanitizeResult {
  if (!svgContent || typeof svgContent !== 'string') {
    return { valid: false, error: 'Empty or invalid SVG content' }
  }

  const trimmed = svgContent.trim()

  // 1. Must contain an <svg tag and </svg> closing tag
  if (!/<svg[\s>]/i.test(trimmed) || !/<\/svg>/i.test(trimmed)) {
    return { valid: false, error: 'Missing root <svg> element' }
  }

  // 2. Reject XML entity expansion / DOCTYPE attacks (XXE / Billion Laughs)
  if (/<!DOCTYPE|<!ENTITY/i.test(trimmed)) {
    return { valid: false, error: 'SVG DOCTYPE and ENTITY declarations are forbidden (XXE protection)' }
  }

  // 3. Reject active script tags
  if (/<script[\s>]/i.test(trimmed) || /<\/script>/i.test(trimmed)) {
    return { valid: false, error: 'SVG contains prohibited <script> tag' }
  }

  // 4. Reject dangerous embedding elements
  const dangerousTags = ['foreignobject', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'applet', 'meta', 'link']
  for (const tag of dangerousTags) {
    const tagRegex = new RegExp(`<${tag}[\\s>]`, 'i')
    if (tagRegex.test(trimmed)) {
      return { valid: false, error: `SVG contains prohibited <${tag}> element` }
    }
  }

  // 5. Reject inline event handlers (on*)
  if (/\s+on[a-z]+\s*=/i.test(trimmed)) {
    return { valid: false, error: 'SVG contains prohibited inline event handler attributes' }
  }

  // 6. Reject javascript: / vbscript: / data: URI schemes in href / xlink:href / src
  if (/(?:href|src|xlink:href)\s*=\s*["']\s*(?:javascript:|vbscript:|data:text\/html)/i.test(trimmed)) {
    return { valid: false, error: 'SVG contains prohibited pseudo-protocol in href or src' }
  }

  return { valid: true, sanitized: trimmed }
}

/**
 * Generates an unguessable server-side filename (UUID + extension).
 */
export function generateSafeFilename(ext: string): string {
  const cleanExt = ext.replace(/^\./, '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${crypto.randomUUID()}.${cleanExt}`
}

/**
 * Verifies that a target file path is safely contained within public/uploads.
 * Defends against path traversal attacks (e.g. `../../etc/passwd`).
 */
export function isPathInsideUploads(targetPath: string): boolean {
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
  const resolved = path.resolve(targetPath)
  return resolved.startsWith(uploadsDir + path.sep) || resolved === uploadsDir
}
