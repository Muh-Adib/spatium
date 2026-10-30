import { prisma } from '@/lib/db/prisma'
import { callLlm } from '@/lib/agent/llm'

export interface SessionMessageItem {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string | null
  toolCalls?: any[] | null
  agenticReport?: any | null
  tokenCount?: number | null
  createdAt: string
}

export interface AiSessionData {
  id: string
  userId: string
  title: string
  model?: string | null
  systemPrompt?: string | null
  summary?: string | null
  pinned: boolean
  createdAt: string
  updatedAt: string
  messageCount?: number
  messages?: SessionMessageItem[]
}

export interface AiUserMemoryItem {
  id: string
  userId: string
  key: string
  content: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Get all sessions for a specific user, ordered by most recently updated.
 * Sessions are strictly isolated per user (not shared).
 */
export async function getUserAiSessions(userId: string): Promise<AiSessionData[]> {
  try {
    const sessions = await prisma.orm.public.AiSession
      .where({ userId })
      .orderBy((s) => s.updatedAt.desc())
      .all()

    const result: AiSessionData[] = []
    for (const session of sessions) {
      // Count messages per session
      const msgs = await prisma.orm.public.AiSessionMessage
        .where({ sessionId: session.id })
        .all()

      result.push({
        id: session.id,
        userId: session.userId,
        title: session.title,
        model: session.model,
        systemPrompt: session.systemPrompt,
        summary: session.summary,
        pinned: session.pinned ?? false,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: msgs.length,
      })
    }

    return result
  } catch (err: any) {
    console.error('[getUserAiSessions] Error fetching sessions:', err.message)
    return []
  }
}

/**
 * Get a single session with all its messages by session ID.
 * Verifies that the session belongs to the requesting user.
 */
export async function getAiSessionById(
  sessionId: string,
  userId: string
): Promise<AiSessionData | null> {
  try {
    const session = await prisma.orm.public.AiSession
      .where({ id: sessionId })
      .first()

    if (!session || session.userId !== userId) {
      return null
    }

    const rawMsgs = await prisma.orm.public.AiSessionMessage
      .where({ sessionId })
      .orderBy((m) => m.createdAt.asc())
      .all()

    const messages: SessionMessageItem[] = rawMsgs.map((m) => {
      let toolCalls = null
      let agenticReport = null
      try {
        if (m.toolCalls) toolCalls = JSON.parse(m.toolCalls)
      } catch (_) {}
      try {
        if (m.agenticReport) agenticReport = JSON.parse(m.agenticReport)
      } catch (_) {}

      return {
        id: m.id,
        sessionId: m.sessionId,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        model: m.model,
        toolCalls,
        agenticReport,
        tokenCount: m.tokenCount,
        createdAt: m.createdAt,
      }
    })

    return {
      id: session.id,
      userId: session.userId,
      title: session.title,
      model: session.model,
      systemPrompt: session.systemPrompt,
      summary: session.summary,
      pinned: session.pinned ?? false,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: messages.length,
      messages,
    }
  } catch (err: any) {
    console.error('[getAiSessionById] Error:', err.message)
    return null
  }
}

/**
 * Create a new AI Session for a user.
 */
export async function createAiSession(
  userId: string,
  data?: { title?: string; model?: string; systemPrompt?: string }
): Promise<AiSessionData> {
  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const now = new Date().toISOString()

  // Ensure user exists in users table (e.g. for fallback or fresh accounts)
  try {
    const existingUser = await prisma.orm.public.User.where({ id: userId }).first()
    if (!existingUser) {
      await prisma.orm.public.User.create({
        id: userId,
        email: `${userId}@segiatech.com`,
        name: 'Studio User',
        role: 'SUPER_ADMIN',
        createdAt: now,
      })
    }
  } catch (_) {}

  await prisma.orm.public.AiSession.create({
    id: sessionId,
    userId,
    title: data?.title || 'Obrolan Baru',
    model: data?.model || 'gemini-2.5-flash',
    systemPrompt: data?.systemPrompt || null,
    summary: null,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  })

  return {
    id: sessionId,
    userId,
    title: data?.title || 'Obrolan Baru',
    model: data?.model || 'gemini-2.5-flash',
    systemPrompt: data?.systemPrompt || null,
    summary: null,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    messages: [],
  }
}

/**
 * Update an existing AI Session (title, model, pinned, summary).
 */
export async function updateAiSession(
  sessionId: string,
  userId: string,
  data: { title?: string; model?: string; pinned?: boolean; summary?: string }
): Promise<boolean> {
  try {
    const session = await prisma.orm.public.AiSession.where({ id: sessionId }).first()
    if (!session || session.userId !== userId) return false

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }
    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.model !== undefined) updateData.model = data.model
    if (data.pinned !== undefined) updateData.pinned = data.pinned
    if (data.summary !== undefined) updateData.summary = data.summary

    await prisma.orm.public.AiSession.where({ id: sessionId }).update(updateData)
    return true
  } catch (err: any) {
    console.error('[updateAiSession] Error:', err.message)
    return false
  }
}

/**
 * Delete an AI session and all its messages.
 */
export async function deleteAiSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    const session = await prisma.orm.public.AiSession.where({ id: sessionId }).first()
    if (!session || session.userId !== userId) return false

    // Delete messages first
    const msgs = await prisma.orm.public.AiSessionMessage.where({ sessionId }).all()
    for (const msg of msgs) {
      await prisma.orm.public.AiSessionMessage.where({ id: msg.id }).delete()
    }

    await prisma.orm.public.AiSession.where({ id: sessionId }).delete()
    return true
  } catch (err: any) {
    console.error('[deleteAiSession] Error:', err.message)
    return false
  }
}

/**
 * Append a message to an active AI session.
 */
export async function appendSessionMessage(
  sessionId: string,
  userId: string,
  data: {
    role: 'user' | 'assistant' | 'system'
    content: string
    model?: string
    toolCalls?: any[]
    agenticReport?: any
    tokenCount?: number
  }
): Promise<SessionMessageItem | null> {
  try {
    const session = await prisma.orm.public.AiSession.where({ id: sessionId }).first()
    if (!session || session.userId !== userId) return null

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()

    await prisma.orm.public.AiSessionMessage.create({
      id: messageId,
      sessionId,
      role: data.role,
      content: data.content,
      model: data.model || session.model,
      toolCalls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
      agenticReport: data.agenticReport ? JSON.stringify(data.agenticReport) : null,
      tokenCount: data.tokenCount || null,
      createdAt: now,
    })

    // Auto-update session title on first user turn if title is still default
    const updatePayload: any = { updatedAt: now }
    if (session.title === 'Obrolan Baru' && data.role === 'user') {
      const generatedTitle = data.content.slice(0, 38).trim()
      updatePayload.title = generatedTitle.length > 0 ? generatedTitle : 'Obrolan Baru'
    }

    await prisma.orm.public.AiSession.where({ id: sessionId }).update(updatePayload)

    return {
      id: messageId,
      sessionId,
      role: data.role,
      content: data.content,
      model: data.model || session.model,
      toolCalls: data.toolCalls || null,
      agenticReport: data.agenticReport || null,
      tokenCount: data.tokenCount || null,
      createdAt: now,
    }
  } catch (err: any) {
    console.error('[appendSessionMessage] Error:', err.message)
    return null
  }
}

/**
 * Session Compression & Summarization (Gemini/ChatGPT Style):
 * Condenses long conversation turns into an updated structured summary prefix.
 * Prunes redundant intermediate messages to drastically cut token consumption while
 * preserving key facts, entity mentions, SEO findings, and user preferences.
 */
export async function compressAiSession(
  sessionId: string,
  userId: string,
  options?: {
    apiKey?: string
    provider?: 'google' | 'openrouter'
    model?: string
    keepLatestCount?: number
  }
): Promise<{
  success: boolean
  summary: string
  originalMessagesCount: number
  remainingMessagesCount: number
  tokenSavingsEstimatePercent: number
  error?: string
}> {
  try {
    const session = await prisma.orm.public.AiSession.where({ id: sessionId }).first()
    if (!session || session.userId !== userId) {
      return {
        success: false,
        summary: '',
        originalMessagesCount: 0,
        remainingMessagesCount: 0,
        tokenSavingsEstimatePercent: 0,
        error: 'Sesi tidak ditemukan atau tidak berwenang.',
      }
    }

    const messages = await prisma.orm.public.AiSessionMessage
      .where({ sessionId })
      .orderBy((m) => m.createdAt.asc())
      .all()

    const keepLatest = options?.keepLatestCount || 4

    if (messages.length <= keepLatest) {
      return {
        success: true,
        summary: session.summary || 'Sesi masih ringkas, belum memerlukan kompresi mendalam.',
        originalMessagesCount: messages.length,
        remainingMessagesCount: messages.length,
        tokenSavingsEstimatePercent: 0,
      }
    }

    const messagesToCompress = messages.slice(0, messages.length - keepLatest)
    const messagesToKeep = messages.slice(messages.length - keepLatest)

    // Formulate compression transcript
    const transcript = messagesToCompress
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n---\n')

    let newSummary = ''

    // Attempt AI-assisted summarization if API key available
    if (options?.apiKey) {
      try {
        const compressPrompt = `Anda adalah asisten kompresi memori obrolan (Conversation Context Compressor) untuk platform SEGIA Studio.
Tugas Anda adalah merangkum percakapan panjang menjadi satu blok ringkasan terstruktur dan padat untuk dimasukkan ke memori AI (Prompt Cache).

Format Ringkasan Wajib:
1. Topik Utama & Entitas (artikel, layanan, kata kunci, slug)
2. Keputusan & Tindakan yang Telah Diambil (audit SEO, pembuatan draf, perbaikan URL)
3. Preferensi & Instruksi Khusus Pengguna (tone, lokasi, batasan)
4. Masalah Terbuka atau Pertanyaan Lanjutan

Percakapan sebelumnya yang perlu dikompresi:
"""
${transcript}
"""

${session.summary ? `Catatan ringkasan sesi terdahulu:\n"""\n${session.summary}\n"""\n` : ''}

Tuliskan ringkasan padat dan jelas dalam bahasa Indonesia (maksimal 250 kata):`

        const aiResponse = await callLlm({
          provider: options.provider || 'google',
          apiKey: options.apiKey,
          model: options.model || 'gemini-2.5-flash',
          systemInstruction: 'Anda adalah mesin perangkum memori konteks AI yang ringkas dan akurat.',
          messages: [{ role: 'user', content: compressPrompt }],
        })

        if (aiResponse.reply && aiResponse.reply.trim().length > 10) {
          newSummary = aiResponse.reply.trim()
        }
      } catch (err: any) {
        console.warn('[compressAiSession] LLM summarization fallback to deterministic:', err.message)
      }
    }

    // Deterministic fallback summarizer if LLM not configured
    if (!newSummary) {
      const topics: string[] = []
      let lastDecision = ''

      for (const m of messagesToCompress) {
        if (m.role === 'user') {
          if (m.content.includes('/audit')) topics.push('Audit Technical SEO')
          if (m.content.includes('/keywords')) topics.push('Riset Kata Kunci GSC')
          if (m.content.includes('/draft')) topics.push('Pembuatan Draf Artikel')
          if (m.content.includes('@location')) topics.push('Konteks Lokasi Dinamis')
        }
        if (m.role === 'assistant' && m.content.length > 50) {
          lastDecision = m.content.slice(0, 150).replace(/\n/g, ' ') + '...'
        }
      }

      const uniqueTopics = Array.from(new Set(topics))
      newSummary = `**Ringkasan Konteks Terkompresi (${messagesToCompress.length} pesan terdahulu):**
- Topik yang dibahas: ${uniqueTopics.length > 0 ? uniqueTopics.join(', ') : 'Diskusi editorial & SEO'}
- Tindakan terakhir: ${lastDecision || 'Pemeriksaan performa konten & optimasi'}
- Tanggal kompresi: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' })}`
    }

    // Prune the older messages from DB to save storage & token bandwidth
    for (const oldMsg of messagesToCompress) {
      await prisma.orm.public.AiSessionMessage.where({ id: oldMsg.id }).delete()
    }

    // Save summary in session record
    await prisma.orm.public.AiSession.where({ id: sessionId }).update({
      summary: newSummary,
      updatedAt: new Date().toISOString(),
    })

    const tokenSavingsEstimatePercent = Math.min(
      85,
      Math.round((messagesToCompress.length / messages.length) * 80)
    )

    return {
      success: true,
      summary: newSummary,
      originalMessagesCount: messages.length,
      remainingMessagesCount: messagesToKeep.length,
      tokenSavingsEstimatePercent,
    }
  } catch (err: any) {
    console.error('[compressAiSession] Error:', err.message)
    return {
      success: false,
      summary: '',
      originalMessagesCount: 0,
      remainingMessagesCount: 0,
      tokenSavingsEstimatePercent: 0,
      error: err.message,
    }
  }
}

/**
 * Get all active persistent memories for a specific user.
 * (ChatGPT/Gemini Custom Instructions & Memory profile)
 */
export async function getUserAiMemories(userId: string): Promise<AiUserMemoryItem[]> {
  try {
    const memories = await prisma.orm.public.AiUserMemory
      .where({ userId })
      .orderBy((m) => m.updatedAt.desc())
      .all()

    return memories.map((m) => ({
      id: m.id,
      userId: m.userId,
      key: m.key,
      content: m.content,
      enabled: m.enabled ?? true,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }))
  } catch (err: any) {
    console.error('[getUserAiMemories] Error:', err.message)
    return []
  }
}

/**
 * Save or update a persistent user memory (ChatGPT / Gemini style).
 */
export async function saveUserAiMemory(
  userId: string,
  key: string,
  content: string,
  enabled = true
): Promise<AiUserMemoryItem | null> {
  try {
    const memoryKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    const now = new Date().toISOString()

    const existing = await prisma.orm.public.AiUserMemory
      .where({ userId })
      .all()

    const found = existing.find((m) => m.key === memoryKey)

    if (found) {
      await prisma.orm.public.AiUserMemory.where({ id: found.id }).update({
        content: content.trim(),
        enabled,
        updatedAt: now,
      })

      return {
        id: found.id,
        userId,
        key: memoryKey,
        content: content.trim(),
        enabled,
        createdAt: found.createdAt,
        updatedAt: now,
      }
    } else {
      const memId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await prisma.orm.public.AiUserMemory.create({
        id: memId,
        userId,
        key: memoryKey,
        content: content.trim(),
        enabled,
        createdAt: now,
        updatedAt: now,
      })

      return {
        id: memId,
        userId,
        key: memoryKey,
        content: content.trim(),
        enabled,
        createdAt: now,
        updatedAt: now,
      }
    }
  } catch (err: any) {
    console.error('[saveUserAiMemory] Error:', err.message)
    return null
  }
}

/**
 * Delete a user memory item.
 */
export async function deleteUserAiMemory(userId: string, memoryIdOrKey: string): Promise<boolean> {
  try {
    const memories = await prisma.orm.public.AiUserMemory.where({ userId }).all()
    const target = memories.find((m) => m.id === memoryIdOrKey || m.key === memoryIdOrKey)

    if (!target) return false

    await prisma.orm.public.AiUserMemory.where({ id: target.id }).delete()
    return true
  } catch (err: any) {
    console.error('[deleteUserAiMemory] Error:', err.message)
    return false
  }
}
