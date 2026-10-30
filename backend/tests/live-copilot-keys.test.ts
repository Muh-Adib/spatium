import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { handleAiAssistantChat } from '@/lib/ai/chat'

// Load .env.local keys if not in process.env
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim()
      const v = trimmed.slice(eq + 1).trim()
      if (!process.env[k]) {
        process.env[k] = v
      }
    }
  }
}

describe('Live Copilot End-to-End Verification with Real Keys', () => {
  it('authenticates with OpenRouter and generates creative article ideas on service query', async () => {
    expect(process.env.OPENROUTER_API_KEY).toBeDefined()
    expect(process.env.OPENROUTER_API_KEY?.startsWith('sk-or-v1-')).toBe(true)

    const initialContext = {
      currentTab: 'buat-artikel',
      activeItem: {
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        status: 'draft'
      }
    }

    const response = await handleAiAssistantChat({
      message: 'hai carikan saya ide artikel untuk menjual service yang ada di web ini',
      context: initialContext,
      userRole: 'SUPER_ADMIN',
      aiConfig: {
        provider: 'openrouter',
        model: 'nvidia/nemotron-3.5-lightning:free',
        temperature: 0.7,
        maxTokens: 1500
      }
    })

    console.log('[DEBUG TEST 1 RESPONSE]:', JSON.stringify({
      reply: response.reply,
      meta: response.meta,
      toolCalls: response.toolCalls?.map(t => t.toolName)
    }, null, 2))

    expect(response).toBeDefined()
    expect(response.reply).toBeTruthy()
    expect(response.reply.length).toBeGreaterThan(50)
    console.log('[LIVE TEST] Turn 1 Idea Response snippet:\n', response.reply.slice(0, 200))
  }, 90000)

  it('generates full proposedChanges when asked to create the article on active canvas', async () => {
    const initialContext = {
      currentTab: 'buat-artikel',
      activeItem: {
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        status: 'draft'
      }
    }

    const response = await handleAiAssistantChat({
      message: 'oke buatkan artikel nya di halaman ini',
      context: initialContext,
      history: [
        { role: 'user', text: 'hai carikan saya ide artikel untuk menjual service yang ada di web ini' },
        {
          role: 'assistant',
          text: 'Konsep Artikel: Immersive Company Profile Storytelling sebagai Branding & Pitchdeck Perusahaan Besar\n\nMenggunakan Next.js 16 App Router + Three.js/WebGL untuk membangun company profile yang interaktif...'
        }
      ],
      userRole: 'SUPER_ADMIN',
      aiConfig: {
        provider: 'openrouter',
        model: 'nvidia/nemotron-3.5-lightning:free',
        temperature: 0.7,
        maxTokens: 2500
      }
    })

    expect(response).toBeDefined()
    expect(response.proposedChanges).toBeDefined()
    if (response.proposedChanges) {
      expect(response.proposedChanges.title).toBeTruthy()
      expect(response.proposedChanges.slug).toBeTruthy()
      expect(response.proposedChanges.content).toBeTruthy()
      expect(response.proposedChanges.content.length).toBeGreaterThan(100)
      console.log('[LIVE TEST] Generated Article Title:', response.proposedChanges.title)
      console.log('[LIVE TEST] Generated Article Slug:', response.proposedChanges.slug)
      console.log('[LIVE TEST] Generated Content Length:', response.proposedChanges.content.length)
      console.log('[LIVE TEST] Focus Keyphrase:', response.proposedChanges.focusKeyphrase)
    }
  }, 90000)

  it('automatically falls back across model cascades when primary model returns an error', async () => {
    const initialContext = {
      currentTab: 'buat-artikel',
      activeItem: {
        title: '',
        slug: '',
        content: '',
        status: 'draft'
      }
    }

    // Pass thinkingmachines/inkling:free (which OpenRouter blocks on web endpoints)
    // The agentic engine should automatically cascade to the next available working model from settings
    const response = await handleAiAssistantChat({
      message: 'ringkas strategi digital segiatech dalam 2 poin singkat',
      context: initialContext,
      userRole: 'SUPER_ADMIN',
      aiConfig: {
        provider: 'openrouter',
        model: 'thinkingmachines/inkling:free',
        temperature: 0.7,
        maxTokens: 500
      }
    })

    expect(response).toBeDefined()
    expect(response.reply).toBeTruthy()
    expect(response.reply.length).toBeGreaterThan(20)
    console.log('[LIVE TEST] Cascade fallback recovered reply:', response.reply.slice(0, 150))
    console.log('[LIVE TEST] Model used:', response.meta?.model)
    expect(response.meta?.model).toBeTruthy()
  }, 45000)
})
