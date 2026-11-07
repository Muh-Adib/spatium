import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireCan } from '@/lib/auth/capabilities'
import { revokeMcpApiKey } from '@/lib/mcp/keys'

/** Studio → MCP: revoke one key. Revocation is immediate and permanent. */
export const dynamic = 'force-dynamic'

const idParam = z.coerce.number().int().positive()

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireCan(request, 'mcp:manage')
  if (auth.error) return auth.error

  const id = idParam.safeParse((await context.params).id)
  if (!id.success) return NextResponse.json({ error: 'ID kunci tidak valid.' }, { status: 400 })

  try {
    const key = await revokeMcpApiKey(id.data, `${auth.user.source === 'session_token' ? 'user' : 'token'}:${auth.user.name}`)
    if (!key) return NextResponse.json({ error: 'Kunci tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ key })
  } catch (err) {
    console.error('[api/mcp-keys] revoke failed:', err)
    return NextResponse.json({ error: 'Kunci gagal dicabut. Coba lagi.' }, { status: 500 })
  }
}
