import dns from 'dns'
import net from 'net'

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number
  maxBytes?: number
  maxRedirects?: number
  allowedHosts?: string[]
}

export class SsrfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SsrfError'
  }
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to a private, loopback,
 * link-local, or cloud metadata range.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  // Normalize IPv6-mapped IPv4 addresses (e.g., ::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7)
  }

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(isNaN)) {
      return true
    }

    const [a, b, c, d] = parts

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true
    // 10.0.0.0/8 (Private)
    if (a === 10) return true
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true
    // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true
    // 169.254.0.0/16 (Link-local & Cloud Metadata, e.g. 169.254.169.254)
    if (a === 169 && b === 254) return true
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true
    // 198.18.0.0/15 (Network benchmark tests)
    if (a === 198 && (b === 18 || b === 19)) return true
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true
    // 255.255.255.255 (Broadcast)
    if (a === 255 && b === 255 && c === 255 && d === 255) return true

    return false
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase()
    // ::1 (Loopback)
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true
    // :: (Unspecified)
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true
    // fe80::/10 (Link-local)
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true
    // fc00::/7 (Unique local / private)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true

    return false
  }

  return true
}

/**
 * Validates a target URL against SSRF attacks:
 * - Only HTTPS protocol is permitted
 * - Hostname is resolved via DNS and checked against private/loopback/cloud metadata IP ranges
 * - Rejects intranet hosts (e.g. localhost, web, db, *.internal, *.local)
 */
export async function validateSafeUrl(urlStr: string, allowedHosts?: string[]): Promise<URL> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(urlStr)
  } catch {
    throw new SsrfError(`URL tidak valid: ${urlStr}`)
  }

  // 1. Enforce HTTPS only
  if (parsedUrl.protocol !== 'https:') {
    throw new SsrfError(`Protokol tidak diizinkan (${parsedUrl.protocol}). Hanya HTTPS yang diizinkan untuk keamanan SSRF.`)
  }

  const hostname = parsedUrl.hostname.toLowerCase()

  // 2. Reject obvious dangerous / internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    !hostname.includes('.') // bare names like 'web', 'db', 'app'
  ) {
    throw new SsrfError(`Hostname tidak diizinkan: ${hostname}`)
  }

  // 3. Check allowedHosts if configured
  if (allowedHosts && allowedHosts.length > 0) {
    const isAllowed = allowedHosts.some(
      (allowed) => hostname === allowed.toLowerCase() || hostname.endsWith(`.${allowed.toLowerCase()}`)
    )
    if (!isAllowed) {
      throw new SsrfError(`Host ${hostname} tidak terdaftar dalam daftar host yang diizinkan.`)
    }
  }

  // 4. If hostname is already a raw IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new SsrfError(`Akses ke IP privat/link-local/metadata dilarang: ${hostname}`)
    }
    return parsedUrl
  }

  // 5. DNS Resolution
  try {
    const records = await dns.promises.lookup(hostname, { all: true })
    if (!records || records.length === 0) {
      throw new SsrfError(`Resolusi DNS gagal untuk host: ${hostname}`)
    }

    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new SsrfError(
          `Host ${hostname} teresolusi ke IP privat/link-local/metadata yang dilarang: ${record.address}`
        )
      }
    }
  } catch (err: any) {
    if (err instanceof SsrfError) throw err
    throw new SsrfError(`Gagal menyelesaikan DNS untuk ${hostname}: ${err.message}`)
  }

  return parsedUrl
}

/**
 * SSRF-Safe Fetch Wrapper
 * Validates destination URL, adheres to timeout, checks response size limit,
 * and validates all redirect hops against SSRF policies.
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 30000,
    maxBytes = 10 * 1024 * 1024, // 10 MB
    maxRedirects = 3,
    allowedHosts,
    ...fetchInit
  } = options

  let currentUrl = url
  let redirectsCount = 0

  while (true) {
    const validatedUrl = await validateSafeUrl(currentUrl, allowedHosts)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(validatedUrl.toString(), {
        ...fetchInit,
        signal: controller.signal,
        redirect: 'manual', // handle redirects manually to check each hop!
      })

      clearTimeout(timeout)

      // Handle Redirects
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        redirectsCount++
        if (redirectsCount > maxRedirects) {
          throw new SsrfError(`Melebihi batas maksimal redirect (${maxRedirects})`)
        }

        const location = res.headers.get('location')
        if (!location) {
          throw new SsrfError(`Respons redirect (${res.status}) tanpa header Location`)
        }

        currentUrl = new URL(location, validatedUrl).toString()
        continue
      }

      // Check Content-Length header if present
      const contentLength = res.headers.get('content-length')
      if (contentLength && parseInt(contentLength, 10) > maxBytes) {
        throw new SsrfError(
          `Ukuran respons (${(parseInt(contentLength, 10) / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal ${(maxBytes / 1024 / 1024).toFixed(2)} MB`
        )
      }

      return res
    } catch (err: any) {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        throw new SsrfError(`Permintaan waktu habis (> ${timeoutMs}ms)`)
      }
      throw err
    }
  }
}
