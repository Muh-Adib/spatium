import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { normalizeGoogleModel } from '@/lib/ai/model-capabilities'

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  const startTime = Date.now()
  try {
    const body = await req.json()
    const { provider, apiKey, model, testType = 'auth', proxyUrl, pool } = body

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          statusMessage: '[400]: Kunci API wajib diisi',
          error: 'API Key wajib diisi untuk melakukan pengujian.',
        },
        { status: 400 }
      )
    }

    const trimmedKey = apiKey.trim()
    const customProxy = typeof proxyUrl === 'string' && proxyUrl.trim() ? proxyUrl.trim().replace(/\/$/, '') : null

    // =========================================================================
    // 1. Google AI Studio (Gemini)
    // =========================================================================
    if (provider === 'google') {
      const isModelInference = testType === 'inference' && Boolean(model?.trim())

      if (isModelInference) {
        // Mode Uji Inferensi Model Spesifik
        const selectedModel = normalizeGoogleModel(model.trim())
        const apiUrl = customProxy
          ? `${customProxy}/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(trimmedKey)}`
          : `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(trimmedKey)}`

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Halo! Tolong balas hanya dengan kata: "KONEKSI_BERHASIL"' }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 20,
          },
        }

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': trimmedKey,
          },
          body: JSON.stringify(payload),
        })

        const latencyMs = Date.now() - startTime
        const rawText = await res.text()
        let data: any = {}
        try {
          data = JSON.parse(rawText)
        } catch (_) {
          data = { error: { message: rawText } }
        }

        if (!res.ok) {
          const errorMsg = data.error?.message || data.error?.status || `HTTP ${res.status}: ${res.statusText}`
          const statusSnippet = `[${res.status}]: ${JSON.stringify(data).slice(0, 180)}`
          return NextResponse.json(
            {
              success: false,
              statusCode: res.status,
              statusMessage: statusSnippet,
              error: `Google Gemini Error: ${errorMsg}`,
              latencyMs,
              pool: pool || (customProxy ? 'proxy-custom' : undefined),
            },
            { status: 400 }
          )
        }

        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK'

        return NextResponse.json({
          success: true,
          statusCode: 200,
          statusMessage: `[200 OK]: Model ${selectedModel} aktif (${latencyMs}ms)`,
          provider: 'google',
          model: selectedModel,
          reply: candidateText,
          latencyMs,
          pool: pool || (customProxy ? 'proxy-custom' : undefined),
          message: `Model Google ${selectedModel} merespons dalam ${latencyMs}ms!`,
        })
      } else {
        // Mode Resmi Dokumentasi Google: Verifikasi Key & Ketersediaan Model via GET /v1beta/models
        const apiUrl = customProxy
          ? `${customProxy}/v1beta/models?key=${trimmedKey}`
          : `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`

        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': trimmedKey,
          },
        })

        const latencyMs = Date.now() - startTime
        const rawText = await res.text()
        let data: any = {}
        try {
          data = JSON.parse(rawText)
        } catch (_) {
          data = { error: { message: rawText } }
        }

        if (!res.ok) {
          const errorMsg = data.error?.message || data.error?.status || `HTTP ${res.status}: ${res.statusText}`
          const statusSnippet = `[${res.status}]: ${JSON.stringify(data).slice(0, 180)}`
          return NextResponse.json(
            {
              success: false,
              statusCode: res.status,
              statusMessage: statusSnippet,
              error: `Google Gemini Auth Error: ${errorMsg}`,
              latencyMs,
              pool: pool || (customProxy ? 'proxy-custom' : undefined),
            },
            { status: 400 }
          )
        }

        const modelCount = Array.isArray(data.models) ? data.models.length : 0

        return NextResponse.json({
          success: true,
          statusCode: 200,
          statusMessage: `[200 OK]: Kunci Google Gemini Valid (${modelCount} model tersedia)`,
          provider: 'google',
          modelCount,
          latencyMs,
          pool: pool || (customProxy ? 'proxy-custom' : undefined),
          message: `Kunci Google AI Studio terverifikasi resmi oleh Google API (${modelCount} model aktif, ${latencyMs}ms)!`,
        })
      }
    }

    // =========================================================================
    // 2. OpenRouter
    // =========================================================================
    if (provider === 'openrouter') {
      const isModelInference = testType === 'inference' && Boolean(model?.trim())

      if (isModelInference) {
        // Mode Uji Inferensi Model Spesifik
        const selectedModel = model.trim().replace(/^openrouter\//, '')
        let apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

        if (customProxy) {
          if (customProxy.includes('/chat/completions')) {
            apiUrl = customProxy
          } else if (customProxy.includes('/v1')) {
            apiUrl = `${customProxy}/chat/completions`
          } else {
            apiUrl = `${customProxy}/api/v1/chat/completions`
          }
        }

        const payload = {
          model: selectedModel,
          messages: [{ role: 'user', content: 'Halo! Tolong balas hanya dengan kata: "KONEKSI_BERHASIL"' }],
          max_tokens: 20,
          temperature: 0.1,
        }

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
            'HTTP-Referer': 'https://segiatech.com',
            'X-Title': 'SegiaTech AI Studio',
          },
          body: JSON.stringify(payload),
        })

        const latencyMs = Date.now() - startTime
        const rawText = await res.text()
        let data: any = {}
        try {
          data = JSON.parse(rawText)
        } catch (_) {
          data = { error: { message: rawText } }
        }

        if (!res.ok) {
          const errorMsg = data.error?.message || `HTTP ${res.status}: ${res.statusText}`
          const statusSnippet = `[${res.status}]: ${JSON.stringify(data).slice(0, 180)}`
          return NextResponse.json(
            {
              success: false,
              statusCode: res.status,
              statusMessage: statusSnippet,
              error: `OpenRouter Error: ${errorMsg}`,
              latencyMs,
              pool: pool || (customProxy ? 'proxy-custom' : undefined),
            },
            { status: 400 }
          )
        }

        const replyText = data.choices?.[0]?.message?.content?.trim() || 'OK'

        return NextResponse.json({
          success: true,
          statusCode: 200,
          statusMessage: `[200 OK]: Model ${selectedModel} aktif (${latencyMs}ms)`,
          provider: 'openrouter',
          model: selectedModel,
          reply: replyText,
          latencyMs,
          pool: pool || (customProxy ? 'proxy-custom' : undefined),
          message: `Model OpenRouter (${selectedModel}) merespons dalam ${latencyMs}ms!`,
        })
      } else {
        // Mode Resmi Dokumentasi OpenRouter: GET https://openrouter.ai/api/v1/auth/key
        // Memeriksa keabsahan kunci + kuota tersisa + limit + is_free_tier
        let apiUrl = 'https://openrouter.ai/api/v1/auth/key'
        if (customProxy) {
          if (customProxy.includes('/auth/key')) {
            apiUrl = customProxy
          } else if (customProxy.includes('/v1')) {
            apiUrl = `${customProxy}/auth/key`
          } else {
            apiUrl = `${customProxy}/api/v1/auth/key`
          }
        }

        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
            'HTTP-Referer': 'https://segiatech.com',
            'X-Title': 'SegiaTech AI Studio',
          },
        })

        const latencyMs = Date.now() - startTime
        const rawText = await res.text()
        let data: any = {}
        try {
          data = JSON.parse(rawText)
        } catch (_) {
          data = { error: { message: rawText } }
        }

        if (!res.ok) {
          const errorMsg = data.error?.message || `HTTP ${res.status}: ${res.statusText}`
          const statusSnippet = `[${res.status}]: ${JSON.stringify(data).slice(0, 180)}`
          return NextResponse.json(
            {
              success: false,
              statusCode: res.status,
              statusMessage: statusSnippet,
              error: `OpenRouter Auth Error: ${errorMsg}`,
              latencyMs,
              pool: pool || (customProxy ? 'proxy-custom' : undefined),
            },
            { status: 400 }
          )
        }

        const keyData = data.data || {}
        const quotaUsage = typeof keyData.usage === 'number' ? keyData.usage : 0
        const quotaLimit = typeof keyData.limit === 'number' ? keyData.limit : null
        const isFreeTier = Boolean(keyData.is_free_tier)
        const rateLimitInfo = keyData.rate_limit ? `${keyData.rate_limit.requests} req / ${keyData.rate_limit.interval}` : undefined
        const label = keyData.label || 'OpenRouter Key'

        const statusSnippet = `[200 OK]: Usage: $${quotaUsage.toFixed(4)}${quotaLimit !== null ? ` / $${quotaLimit.toFixed(2)}` : ' / Unlimited'} (${isFreeTier ? 'Free' : 'Paid'})`

        return NextResponse.json({
          success: true,
          statusCode: 200,
          statusMessage: statusSnippet,
          provider: 'openrouter',
          label,
          quotaUsage,
          quotaLimit,
          isFreeTier,
          rateLimitInfo,
          latencyMs,
          pool: pool || (customProxy ? 'proxy-custom' : undefined),
          message: `Kunci OpenRouter valid! Kuota terpakai: $${quotaUsage.toFixed(4)}${quotaLimit !== null ? ` dari limit $${quotaLimit.toFixed(2)}` : ''} (${isFreeTier ? 'Free Tier' : 'Paid Tier'}, ${latencyMs}ms)`,
        })
      }
    }

    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        statusMessage: '[400]: Provider tidak valid',
        error: 'Provider tidak dikenali. Pilih "google" atau "openrouter".',
      },
      { status: 400 }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        statusMessage: `[500]: ${err.message || 'Koneksi gagal'}`,
        error: err.message || 'Gagal menghubungi server penyedia AI.',
      },
      { status: 500 }
    )
  }
}
