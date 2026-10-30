import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createAiSession,
  getAiSessionById,
  getUserAiSessions,
  appendSessionMessage,
  compressAiSession,
  deleteAiSession,
  saveUserAiMemory,
  getUserAiMemories,
  deleteUserAiMemory,
} from '../src/lib/ai/sessions'
import { buildSystemPrompt } from '../src/lib/agent/llm'

// In-memory mock storage for sessions & memories
const mockStore = {
  users: [{ id: 'usr_1', email: 'user1@segiatech.com', name: 'User 1' }],
  sessions: [] as any[],
  messages: [] as any[],
  memories: [] as any[],
}

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        User: {
          where: vi.fn(({ id }: { id: string }) => ({
            first: vi.fn(async () => mockStore.users.find((u) => u.id === id) || null),
          })),
          create: vi.fn(async (data: any) => {
            mockStore.users.push(data)
            return data
          }),
        },
        AiSession: {
          where: vi.fn((criteria: { id?: string; userId?: string }) => ({
            first: vi.fn(async () => mockStore.sessions.find((s) => s.id === criteria.id) || null),
            orderBy: vi.fn(() => ({
              all: vi.fn(async () => mockStore.sessions.filter((s) => s.userId === criteria.userId)),
            })),
            all: vi.fn(async () => mockStore.sessions.filter((s) => !criteria.userId || s.userId === criteria.userId)),
            update: vi.fn(async (updateData: any) => {
              const idx = mockStore.sessions.findIndex((s) => s.id === criteria.id)
              if (idx !== -1) {
                mockStore.sessions[idx] = { ...mockStore.sessions[idx], ...updateData }
                return mockStore.sessions[idx]
              }
              return null
            }),
            delete: vi.fn(async () => {
              const idx = mockStore.sessions.findIndex((s) => s.id === criteria.id)
              if (idx !== -1) mockStore.sessions.splice(idx, 1)
              return true
            }),
          })),
          create: vi.fn(async (data: any) => {
            mockStore.sessions.push(data)
            return data
          }),
        },
        AiSessionMessage: {
          where: vi.fn((criteria: { id?: string; sessionId?: string }) => ({
            all: vi.fn(async () => mockStore.messages.filter((m) => m.sessionId === criteria.sessionId)),
            orderBy: vi.fn(() => ({
              all: vi.fn(async () => mockStore.messages.filter((m) => m.sessionId === criteria.sessionId)),
            })),
            delete: vi.fn(async () => {
              const idx = mockStore.messages.findIndex((m) => m.id === criteria.id)
              if (idx !== -1) mockStore.messages.splice(idx, 1)
              return true
            }),
          })),
          create: vi.fn(async (data: any) => {
            mockStore.messages.push(data)
            return data
          }),
        },
        AiUserMemory: {
          where: vi.fn((criteria: { id?: string; userId?: string }) => ({
            all: vi.fn(async () => mockStore.memories.filter((m) => m.userId === criteria.userId)),
            orderBy: vi.fn(() => ({
              all: vi.fn(async () => mockStore.memories.filter((m) => m.userId === criteria.userId)),
            })),
            update: vi.fn(async (updateData: any) => {
              const idx = mockStore.memories.findIndex((m) => m.id === criteria.id)
              if (idx !== -1) {
                mockStore.memories[idx] = { ...mockStore.memories[idx], ...updateData }
                return mockStore.memories[idx]
              }
              return null
            }),
            delete: vi.fn(async () => {
              const idx = mockStore.memories.findIndex((m) => m.id === criteria.id)
              if (idx !== -1) mockStore.memories.splice(idx, 1)
              return true
            }),
          })),
          create: vi.fn(async (data: any) => {
            mockStore.memories.push(data)
            return data
          }),
        },
        SiteSettings: {
          first: vi.fn(async () => ({
            siteName: 'SegiaTech',
            siteDescription: 'Digital Product Studio',
            siteUrl: 'https://www.segiatech.com',
          })),
        },
        SiteConfig: {
          where: vi.fn(() => ({
            first: vi.fn(async () => null),
          })),
        },
      },
    },
  },
}))

describe('Server-Backed Multi-Session & Memory Architecture (L11-T6)', () => {
  beforeEach(() => {
    mockStore.sessions = []
    mockStore.messages = []
    mockStore.memories = []
  })

  it('creates an isolated server session and prevents cross-user access', async () => {
    const sessionUser1 = await createAiSession('usr_1', { title: 'Audit SEO Kalasan Valley', model: 'gemini-2.5-flash' })
    expect(sessionUser1.id).toBeDefined()
    expect(sessionUser1.userId).toBe('usr_1')
    expect(sessionUser1.title).toBe('Audit SEO Kalasan Valley')

    // User 1 can retrieve their session
    const fetchedByUser1 = await getAiSessionById(sessionUser1.id, 'usr_1')
    expect(fetchedByUser1).not.toBeNull()
    expect(fetchedByUser1?.title).toBe('Audit SEO Kalasan Valley')

    // User 2 CANNOT access User 1's session (Strict User Isolation)
    const fetchedByUser2 = await getAiSessionById(sessionUser1.id, 'usr_2')
    expect(fetchedByUser2).toBeNull()
  })

  it('appends messages and compresses session to optimize prompt caching and save tokens', async () => {
    const session = await createAiSession('usr_1', { title: 'Percakapan Panjang' })

    // Simulate 8 conversation turns
    for (let i = 1; i <= 8; i++) {
      await appendSessionMessage(session.id, 'usr_1', {
        role: i % 2 === 1 ? 'user' : 'assistant',
        content: `Pesan nomor ${i} mengenai optimasi performa web dan audit SEO.`,
      })
    }

    const beforeCompress = await getAiSessionById(session.id, 'usr_1')
    expect(beforeCompress?.messages?.length).toBe(8)

    // Run session compression (keep latest 4 messages, summarize older 4)
    const compressionResult = await compressAiSession(session.id, 'usr_1', { keepLatestCount: 4 })
    expect(compressionResult.success).toBe(true)
    expect(compressionResult.remainingMessagesCount).toBe(4)
    expect(compressionResult.tokenSavingsEstimatePercent).toBeGreaterThan(0)
    expect(compressionResult.summary).toContain('Ringkasan Konteks Terkompresi')

    // Verify session updated with summary
    const afterCompress = await getAiSessionById(session.id, 'usr_1')
    expect(afterCompress?.summary).toBeDefined()
    expect(afterCompress?.messages?.length).toBe(4)
  })

  it('saves and retrieves persistent user memories (ChatGPT / Gemini style)', async () => {
    await saveUserAiMemory('usr_1', 'gaya_penulisan', 'Santai, lugas, mengutamakan data riil.')
    await saveUserAiMemory('usr_1', 'fokus_layanan', 'Next.js 16 App Router dan WebGL.')

    const memories = await getUserAiMemories('usr_1')
    expect(memories.length).toBe(2)
    expect(memories.find((m) => m.key === 'gaya_penulisan')?.content).toBe('Santai, lugas, mengutamakan data riil.')

    // Deleting a memory
    const deleted = await deleteUserAiMemory('usr_1', 'fokus_layanan')
    expect(deleted).toBe(true)

    const remaining = await getUserAiMemories('usr_1')
    expect(remaining.length).toBe(1)
  })

  it('buildSystemPrompt injects persistent memories and session summary as cache prefix', async () => {
    const prompt = await buildSystemPrompt({
      role: 'SUPER_ADMIN',
      actorName: 'Lead Engineer',
      userMemories: [
        { key: 'gaya_bahasa', content: 'Gunakan tone editorial berkelas.' },
        { key: 'target_audiens', content: 'Institusi pendidikan dan korporasi enterprise.' },
      ],
      sessionSummary: 'Diskusi sebelumnya menyepakati perbaikan 301 redirects pada 887 URL WordPress lama.',
    })

    expect(prompt).toContain('MEMORI & PREFERENSI PENGGUNA')
    expect(prompt).toContain('gaya_bahasa: Gunakan tone editorial berkelas.')
    expect(prompt).toContain('target_audiens: Institusi pendidikan dan korporasi enterprise.')
    expect(prompt).toContain('RINGKASAN SESI TERDAHULU (Prompt Cache Prefix)')
    expect(prompt).toContain('Diskusi sebelumnya menyepakati perbaikan 301 redirects pada 887 URL WordPress lama.')
  })
})
