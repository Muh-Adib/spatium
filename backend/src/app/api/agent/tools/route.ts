import { NextRequest, NextResponse } from 'next/server'
import { toolRegistry } from '@/lib/agent/registry'
import { requireUser } from '@/lib/auth/rbac'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const category = (searchParams.get('category') as any) || undefined
  const scope = (searchParams.get('scope') as any) || undefined

  const tools = toolRegistry.list({ category, scope }).map((t) => ({
    name: t.name,
    label: t.label,
    description: t.description,
    category: t.category,
    scope: t.scope,
    mutates: t.mutates,
    idempotent: t.idempotent,
    costHint: t.costHint,
  }))

  return NextResponse.json({
    data: tools,
    total: tools.length,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { tool: toolName, params = {} } = body

    if (!toolName) {
      return NextResponse.json(
        { error: 'Field "tool" wajib disertakan.' },
        { status: 400 }
      )
    }

    const tool = toolRegistry.get(toolName)
    if (!tool) {
      return NextResponse.json(
        { error: `Tool "${toolName}" tidak ditemukan di registri.` },
        { status: 404 }
      )
    }

    // Role checks: e.g. 'admin' scope requires SUPER_ADMIN or CONTENT_ADMIN
    if (tool.scope === 'admin' && auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'CONTENT_ADMIN') {
      return NextResponse.json(
        { error: `Akses ditolak: Tool "${toolName}" membutuhkan izin peran admin.` },
        { status: 403 }
      )
    }

    const result = await toolRegistry.execute(toolName, params, {
      actor: auth.user.name,
      actorRole: auth.user.role,
    })

    return NextResponse.json({
      success: true,
      tool: toolName,
      data: result,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengeksekusi tool.' },
      { status: 500 }
    )
  }
}
