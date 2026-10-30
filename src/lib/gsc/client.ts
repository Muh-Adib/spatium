import crypto from 'node:crypto'

export interface GoogleServiceAccountAuth {
  clientEmail: string
  privateKey: string
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null

/**
 * Generate Google OAuth2 Access Token for Service Account using Node.js built-in crypto (RS256).
 * Zero external library dependencies required.
 */
export async function getGoogleAccessToken(
  auth: GoogleServiceAccountAuth,
  scopes: string[] = ['https://www.googleapis.com/auth/webmasters.readonly']
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  // Reuse cached token if valid for at least 5 more minutes
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 300) {
    return cachedAccessToken.token
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const claims = {
    iss: auth.clientEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const base64UrlEncode = (obj: object | string) => {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj)
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  const encodedHeader = base64UrlEncode(header)
  const encodedClaims = base64UrlEncode(claims)
  const signatureInput = `${encodedHeader}.${encodedClaims}`

  // Normalize private key (handle escaped newlines)
  const formattedKey = auth.privateKey.replace(/\\n/g, '\n')

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signatureInput)
  signer.end()

  const signature = signer.sign(formattedKey, 'base64')
  const encodedSignature = signature
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const jwt = `${signatureInput}.${encodedSignature}`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text().catch(() => '')
    throw new Error(`Google OAuth2 Token Exchange failed (${tokenResponse.status}): ${errorBody}`)
  }

  const tokenData = await tokenResponse.json()
  const token = tokenData.access_token as string
  const expiresIn = (tokenData.expires_in as number) || 3600

  cachedAccessToken = {
    token,
    expiresAt: now + expiresIn,
  }

  return token
}

export interface GscSearchAnalyticsQueryOptions {
  startDate: string
  endDate: string
  dimensions?: ('date' | 'query' | 'page' | 'country' | 'device')[]
  rowLimit?: number
  startRow?: number
  dimensionFilterGroups?: any[]
}

export interface GscSearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/**
 * Execute searchAnalytics.query against Google Search Console API.
 */
export async function querySearchAnalytics(
  siteUrl: string,
  options: GscSearchAnalyticsQueryOptions,
  auth?: GoogleServiceAccountAuth
): Promise<{ rows: GscSearchAnalyticsRow[]; responseAggregationType?: string }> {
  const clientEmail = auth?.clientEmail || process.env.GSC_CLIENT_EMAIL
  const privateKey = auth?.privateKey || process.env.GSC_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error('GSC_CLIENT_EMAIL atau GSC_PRIVATE_KEY belum dikonfigurasi.')
  }

  const accessToken = await getGoogleAccessToken({ clientEmail, privateKey })

  // Clean siteUrl for Search Console API endpoint
  // Domain properties use 'sc-domain:example.com', URL-prefix properties use exact URL with protocol
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`

  const payload: any = {
    startDate: options.startDate,
    endDate: options.endDate,
    rowLimit: options.rowLimit || 1000,
  }

  if (options.dimensions && options.dimensions.length > 0) {
    payload.dimensions = options.dimensions
  }
  if (options.startRow) {
    payload.startRow = options.startRow
  }
  if (options.dimensionFilterGroups) {
    payload.dimensionFilterGroups = options.dimensionFilterGroups
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    throw new Error(`Google Search Console API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  return {
    rows: data.rows || [],
    responseAggregationType: data.responseAggregationType,
  }
}
