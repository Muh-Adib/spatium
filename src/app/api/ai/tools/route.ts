import { NextRequest, NextResponse } from 'next/server'
import { UNIMASI_TOOLS_CATALOG, executeUnimasiTool } from '@/lib/ai/tools'
import { requireUser, requireRole } from '@/lib/auth/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  return NextResponse.json({
    success: true,
    tools: UNIMASI_TOOLS_CATALOG,
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { toolId, params } = body

    if (!toolId || typeof toolId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Parameter toolId wajib disertakan.' },
        { status: 400 }
      )
    }

    const execution = await executeUnimasiTool(toolId, params || {})
    return NextResponse.json({
      success: execution.status !== 'error',
      execution,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengeksekusi tool.' },
      { status: 500 }
    )
  }
}
