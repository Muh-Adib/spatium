/**
 * Validates and retrieves the AUTH_SECRET environment variable.
 * Kept standalone without any database or Node fs dependencies so it can safely
 * be used in Middleware, Proxy, and Edge runtimes.
 */
export function getValidatedAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

  // In Next.js build phase (e.g. docker build without runtime secrets), allow a placeholder secret
  // so static analysis and route collection pass without requiring production credentials.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

  if (isBuildPhase && (!secret || secret.length < 32)) {
    return 'build-phase-placeholder-secret-at-least-32-chars-long'
  }

  if (process.env.NODE_ENV === 'production' || process.env.REQUIRE_STRONG_AUTH_SECRET === 'true') {
    if (!secret || secret.length < 32) {
      throw new Error('FATAL: AUTH_SECRET must be set and at least 32 characters long in production.')
    }
  }
  return secret || ''
}

/**
 * Timing-safe string comparison that works across Node.js and Edge Runtime.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Validates a Bearer token in constant-time against configured API/Admin tokens.
 * Requires configured secret to be at least 32 characters long.
 */
export function validateBearerToken(token: string): boolean {
  if (!token) return false
  const configured =
    process.env.API_BEARER_TOKEN ||
    process.env.ADMIN_TOKEN ||
    process.env.ADMIN_SECRET ||
    process.env.WEB_ADMIN_TOKEN

  if (!configured || configured.length < 32) {
    return false
  }

  return safeEqual(token, configured)
}
