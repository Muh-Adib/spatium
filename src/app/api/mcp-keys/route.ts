import { NextResponse, type NextRequest } from 'next/server'
import { requireCan } from '@/lib/auth/capabilities'
import { siteConfig } from '@/config/site'
import { createMcpApiKey, createMcpKeySchema, listMcpApiKeys } from '@/lib/mcp/keys'

/** Studio → MCP: list and create per-client MCP API keys (plaintext returned once). */
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  const auth = await requireCan(request, 'mcp:manage')
  if (auth.error) return auth.error
  try {
    return NextResponse.json({ keys: await listMcpApiKeys(), endpoint: `${siteConfig.url.replace(/\/+$/, '')}/api/mcp` }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/mcp-keys] list failed:', err)
    return NextResponse.json({ error: 'Daftar kunci MCP gagal dimuat. Coba lagi.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'mcp:manage')
  if (auth.error) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.warn('[api/mcp-keys] invalid JSON body:', err)
    return NextResponse.json({ error: 'Body permintaan harus JSON.' }, { status: 400 })
  }
  const parsed = createMcpKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Data kunci tidak valid.',
        fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [i.path.map(String).join('.') || 'form', i.message])),
      },
      { status: 400 },
    )
  }

  try {
    const { plaintext, key } = await createMcpApiKey(parsed.data, `${auth.user.source === 'session_token' ? 'user' : 'token'}:${auth.user.name}`)
    return NextResponse.json({ key, plaintext }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/mcp-keys] create failed:', err)
    return NextResponse.json({ error: 'Kunci MCP gagal dibuat. Coba lagi.' }, { status: 500 })
  }
}
