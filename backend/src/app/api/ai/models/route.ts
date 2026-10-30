import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { detectModelCapabilities, RECOMMENDED_FREE_HIGH_CONTEXT_MODELS } from '@/lib/ai/model-capabilities'

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  try {
    const body = await req.json().catch(() => ({}))
    const { provider = 'google', apiKey, proxyUrl } = body

    const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : ''
    const customProxy = typeof proxyUrl === 'string' && proxyUrl.trim() ? proxyUrl.trim().replace(/\/$/, '') : null

    // 1. Google AI Studio (Gemini)
    if (provider === 'google') {
      const activeKey = trimmedKey
      if (!activeKey) {
        return NextResponse.json(
          { success: false, error: 'API Key Google AI Studio wajib diisi untuk mengambil daftar model.' },
          { status: 400 }
        )
      }

      const url = customProxy
        ? `${customProxy}/v1beta/models?key=${activeKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`

      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.error?.message || `HTTP ${res.status}: Gagal memuat model Google`
        return NextResponse.json({ success: false, error: errorMsg }, { status: res.status })
      }

      const rawModels = Array.isArray(data.models) ? data.models : []
      const filtered = rawModels
        .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map((m: any) => {
          const id = m.name ? m.name.replace(/^models\//, '') : ''
          const isThinking = id.includes('2.5') || id.includes('thinking')
          const caps = detectModelCapabilities(id, m)
          const isVision = caps.includes('vision')
          return {
            id,
            name: m.displayName || m.name || '',
            description: m.description || '',
            inputTokenLimit: m.inputTokenLimit || 0,
            outputTokenLimit: m.outputTokenLimit || 0,
            contextLength: m.inputTokenLimit || 1048576,
            hasThinking: isThinking,
            hasVision: isVision,
            capabilities: caps,
            isFree: false,
          }
        })
        .sort((a: any, b: any) => {
          if (a.id.includes('2.5') && !b.id.includes('2.5')) return -1
          if (!a.id.includes('2.5') && b.id.includes('2.5')) return 1
          if (a.id.includes('flash') && !b.id.includes('flash')) return -1
          if (!a.id.includes('flash') && b.id.includes('flash')) return 1
          return a.id.localeCompare(b.id)
        })

      return NextResponse.json({
        success: true,
        provider: 'google',
        count: filtered.length,
        models: filtered,
        recommendedFreeModels: [],
      })
    }

    // 2. OpenRouter
    if (provider === 'openrouter') {
      const activeKey = trimmedKey
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (activeKey) {
        headers['Authorization'] = `Bearer ${activeKey}`
      }

      let fetchUrl = 'https://openrouter.ai/api/v1/models'
      if (customProxy) {
        if (customProxy.includes('/models')) {
          fetchUrl = customProxy
        } else if (customProxy.includes('/v1')) {
          fetchUrl = `${customProxy}/models`
        } else {
          fetchUrl = `${customProxy}/api/v1/models`
        }
      }

      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers,
      })
      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.error?.message || `HTTP ${res.status}: Gagal memuat model OpenRouter`
        return NextResponse.json({ success: false, error: errorMsg }, { status: res.status })
      }

      const rawModels = Array.isArray(data.data) ? data.data : []
      const mapped = rawModels.map((m: any) => {
        const isFree = Boolean(
          (m.id && m.id.endsWith(':free')) ||
          (m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0')
        )
        const ctx = m.context_length || 0
        const caps = detectModelCapabilities(m.id || '', m)
        const hasThinking = caps.includes('thinking')
        const hasVision = caps.includes('vision')

        return {
          id: m.id || '',
          name: m.name || m.id || '',
          description: m.description || '',
          contextLength: ctx,
          pricing: m.pricing || null,
          isFree,
          hasThinking,
          hasVision,
          capabilities: caps,
        }
      })

      // Sort: free models first, then largest context length
      mapped.sort((a: any, b: any) => {
        if (a.isFree && !b.isFree) return -1
        if (!a.isFree && b.isFree) return 1
        return (b.contextLength || 0) - (a.contextLength || 0)
      })

      return NextResponse.json({
        success: true,
        provider: 'openrouter',
        count: mapped.length,
        models: mapped,
        recommendedFreeModels: RECOMMENDED_FREE_HIGH_CONTEXT_MODELS,
      })
    }

    return NextResponse.json({ success: false, error: `Penyedia "${provider}" tidak didukung.` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat memproses permintaan daftar model.' },
      { status: 500 }
    )
  }
}
