import { describe, it, expect, beforeEach } from 'vitest'
import { toolRegistry } from '../src/lib/agent/registry'
import { z } from 'zod'

describe('Agent Tool Registry (ADR-0011 & L10-T1)', () => {
  it('registers and retrieves tools correctly', () => {
    const list = toolRegistry.list()
    expect(list.length).toBeGreaterThanOrEqual(10)

    const sysStatus = toolRegistry.get('system_status')
    expect(sysStatus).toBeDefined()
    expect(sysStatus?.category).toBe('system')
    expect(sysStatus?.scope).toBe('read')
    expect(sysStatus?.mutates).toBe(false)
  })

  it('rejects registering any tool with scope "publish" (ADR-0011 & Rule 8)', () => {
    expect(() => {
      toolRegistry.register({
        name: 'forbidden_publish_tool',
        label: 'Illegal Publish Tool',
        description: 'Should fail',
        category: 'content',
        scope: 'publish' as any,
        mutates: true,
        idempotent: false,
        parameters: z.object({}),
        handler: async () => ({}),
      })
    }).toThrow(/Agents are prohibited from holding 'publish' scope/)
  })

  it('blocks read-only tokens from executing mutating tools', async () => {
    await expect(
      toolRegistry.execute(
        'create_article_draft',
        {
          title: 'Unauthorized Test Draft',
          topic: 'Security testing',
          content: 'This draft should not be created with a read token',
        },
        { tokenScope: 'read' }
      )
    ).rejects.toThrow(/Token 'read' tidak diizinkan mengeksekusi tool mutasi/)
  })

  it('validates input parameters with Zod schema', async () => {
    await expect(
      toolRegistry.execute('db_articles_query', {
        action: 'invalid_action_not_in_enum',
      })
    ).rejects.toThrow()
    await expect(
      toolRegistry.execute('sqlite_articles_query', {
        action: 'invalid_action_not_in_enum',
      })
    ).rejects.toThrow()
  })

  it('executes read tool system_status successfully', async () => {
    const res = await toolRegistry.execute('system_status', {})
    expect(res.status).toBe('healthy')
    expect(res.engine).toContain('Next.js 16')
    expect(typeof res.dbLatencyMs).toBe('number')
    expect(typeof res.counts.articles).toBe('number')
  })

  it('converts tools to Gemini function declaration format', () => {
    const declarations = toolRegistry.toGeminiFunctionDeclarations()
    expect(declarations.length).toBeGreaterThanOrEqual(10)
    const draftDecl = declarations.find((d) => d.name === 'create_article_draft')
    expect(draftDecl).toBeDefined()
    expect(draftDecl?.parameters?.properties?.title).toBeDefined()
    expect(draftDecl?.parameters?.required).toContain('title')
  })

  it('lists block types and validates page block payloads', async () => {
    const listRes = await toolRegistry.execute('list_block_types', {})
    expect(listRes.totalTypes).toBe(25)
    expect(listRes.supportedTypes).toContain('hero-service')
    expect(listRes.supportedTypes).toContain('feature-bento-grid')

    // Valid block validation
    const validBlock = {
      type: 'paragraph',
      content: 'Valid paragraph text for testing',
    }
    const valRes = await toolRegistry.execute('validate_page_blocks', {
      blocks: [validBlock],
    })
    expect(valRes.valid).toBe(true)
    expect(valRes.blockCount).toBe(1)

    // Invalid block validation (missing required type)
    const invalidRes = await toolRegistry.execute('validate_page_blocks', {
      blocks: [{ invalidProp: 'no type' }],
    })
    expect(invalidRes.valid).toBe(false)
    expect(invalidRes.issues.length).toBeGreaterThan(0)
  })

  it('queries solutions and service categories from SQLite', async () => {
    const solCount = await toolRegistry.execute('sqlite_solutions_query', { action: 'count' })
    expect(typeof solCount.total).toBe('number')

    const catRes = await toolRegistry.execute('sqlite_service_categories_query', {})
    expect(typeof catRes.count).toBe('number')
    expect(Array.isArray(catRes.categories)).toBe(true)
  })

  it('executes graph, landing, and voice tools via registry', async () => {
    // 1. Voice profile tool
    const voiceRes = await toolRegistry.execute('get_voice_profile', {})
    expect(voiceRes.found).toBe(true)
    expect(voiceRes.name).toContain('SegiaTech')

    // 2. Voice match tool
    const matchRes = await toolRegistry.execute('check_voice_match', {
      content: 'Kami mengembangkan platform web Next.js 16 modern untuk performa tinggi.',
    })
    expect(matchRes.score).toBeGreaterThan(0)
    expect(typeof matchRes.pass).toBe('boolean')

    // 3. Link targets graph tool
    const linkRes = await toolRegistry.execute('find_link_targets', {
      keyword: 'website',
      limit: 3,
    })
    expect(typeof linkRes.count).toBe('number')
    expect(Array.isArray(linkRes.targets)).toBe(true)
  })
})
