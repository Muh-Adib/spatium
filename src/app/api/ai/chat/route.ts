import { NextRequest, NextResponse } from 'next/server'
import { handleAiAssistantChat, classifyAiError } from '@/lib/ai/chat'
import { requireUser } from '@/lib/auth/rbac'
import { checkRateLimit, clientKey, rateLimitResponse } from '@/lib/security/rate-limit'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/api-schemas'
import {
  getAiSessionById,
  createAiSession,
  appendSessionMessage,
  getUserAiMemories,
} from '@/lib/ai/sessions'

const aiChatBodySchema = z.object({
  sessionId: z.string().optional(),
  model: z.string().optional(),
  stream: z.boolean().optional(),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string().optional().nullable().default(''),
  })).min(1, 'Messages array is required'),
  context: z.record(z.string(), z.unknown()).optional(),
  aiConfig: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  const rl = checkRateLimit({ key: clientKey(req, 'ai-chat'), limit: 20, windowMs: 60_000 })
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  try {
    const rawBody = await req.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Body JSON is required' }, { status: 400 })
    }

    const validation = validateBody(aiChatBodySchema, rawBody)
    if (!validation.success) {
      return validation.response
    }

    const { sessionId, model, stream, messages, context, aiConfig } = validation.data
    const userId = auth.user.id

    // 1. Resolve or create AI Session
    let activeSession = sessionId ? await getAiSessionById(sessionId, userId) : null
    if (!activeSession) {
      const firstUserMsg = messages.find((m) => m.role === 'user')
      const initialTitle =
        firstUserMsg && firstUserMsg.content ? firstUserMsg.content.slice(0, 38).trim() : 'Obrolan Baru'
      activeSession = await createAiSession(userId, {
        title: initialTitle || 'Obrolan Baru',
        model: model || (aiConfig as any)?.model || '',
      })
    }

    // 2. Fetch persistent user memories (Gemini / ChatGPT style memory)
    const rawMemories = await getUserAiMemories(userId)
    const activeMemories = rawMemories
      .filter((m) => m.enabled)
      .map((m) => ({ key: m.key, content: m.content }))

    // 3. Inject memory & compressed session summary into context for prompt caching
    const enrichedContext = {
      ...(context || {}),
      userMemories: activeMemories,
      sessionSummary: activeSession.summary || undefined,
    }

    // 4. Save latest incoming user message to PostgreSQL
    const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (latestUserMsg) {
      await appendSessionMessage(activeSession.id, userId, {
        role: 'user',
        content: latestUserMsg.content || '',
      })
    }

    const isStreamingRequested = Boolean(
      stream ||
      req.headers.get('accept')?.includes('application/x-ndjson') ||
      (aiConfig as any)?.stream
    )

    // 5A. Handle NDJSON Live Streaming Response
    if (isStreamingRequested) {
      const encoder = new TextEncoder()
      const customReadable = new ReadableStream({
        async start(controller) {
          let doneEmitted = false

          const sendEvent = (event: any) => {
            try {
              if (event.type === 'done') {
                doneEmitted = true
              }
              const line = JSON.stringify(event) + '\n'
              controller.enqueue(encoder.encode(line))
            } catch (err) {
              console.error('Failed to encode stream event:', err)
            }
          }

          try {
            const result = await handleAiAssistantChat(
              messages as any,
              enrichedContext as any,
              aiConfig as any,
              sendEvent
            )

            // Save assistant reply to PostgreSQL
            if (result && (result.reply || result.proposedChanges)) {
              const savedContent =
                result.reply ||
                (result.proposedChanges
                  ? `Perubahan draf artikel disiapkan untuk editor.`
                  : 'Proses eksekusi tool selesai dilaksanakan.')
              await appendSessionMessage(activeSession.id, userId, {
                role: 'assistant',
                content: savedContent,
                model: result.meta?.model || activeSession.model || model,
                toolCalls: result.toolCalls,
                agenticReport: result.agenticReport,
              }).catch((err) => console.warn('Failed to append assistant message in stream:', err))
            }

            if (!doneEmitted) {
              sendEvent({
                type: 'done',
                reply: result.reply,
                proposedChanges: result.proposedChanges,
                report: result.agenticReport || result.report,
                quotaError: result.quotaError,
              })
            }
          } catch (error: any) {
            console.error('[/api/ai/chat] Stream execution error:', error)
            const classification = classifyAiError(error)
            const errorType =
              classification.isLimitZero || classification.isQuotaExceeded ? 'QUOTA_EXCEEDED' : 'RATE_LIMITED'
            sendEvent({
              type: 'error',
              errorType: classification.isQuotaOrRateLimit ? errorType : 'SYSTEM_ERROR',
              quotaError: classification.isQuotaOrRateLimit ? classification : undefined,
              message: error.message || 'Stream processing failed',
            })
            if (!doneEmitted) {
              sendEvent({
                type: 'done',
                reply: `⚠️ Terjadi kendala saat memproses respons: ${error.message || 'Unknown error'}`,
                quotaError: classification.isQuotaOrRateLimit ? classification : undefined,
              })
            }
          } finally {
            controller.close()
          }
        },
      })

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // 5B. Standard Synchronous Batch Response (Backward Compatible)
    const result = await handleAiAssistantChat(
      messages as any,
      enrichedContext as any,
      aiConfig as any
    )

    // 6. Save assistant reply to PostgreSQL
    if (result && (result.reply || result.proposedChanges)) {
      const savedContent =
        result.reply ||
        (result.proposedChanges
          ? `Perubahan draf artikel disiapkan untuk editor.`
          : 'Proses eksekusi tool selesai dilaksanakan.')
      await appendSessionMessage(activeSession.id, userId, {
        role: 'assistant',
        content: savedContent,
        model: result.meta?.model || activeSession.model || model,
        toolCalls: result.toolCalls,
        agenticReport: result.agenticReport,
      })
    }

    return NextResponse.json({
      ...result,
      sessionId: activeSession.id,
      sessionTitle: activeSession.title,
      needsKey: Boolean((result as any)?.needsKey),
      failoverHistory: result.meta?.failoverHistory,
    })
  } catch (error: any) {
    console.error('[/api/ai/chat] Fatal error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal Server Error',
        status: 'error',
        debugInfo: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
