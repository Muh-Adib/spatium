import { describe, it, expect } from 'vitest'
import {
  createArticleSchema,
  serviceMutationSchema,
  portfolioMutationSchema,
  settingsMutationSchema,
  databaseResetSchema,
  validateBody,
} from '../src/lib/validation/api-schemas'

describe('P0.8 Zod Mutation Schemas & Structured Validation', () => {
  describe('createArticleSchema', () => {
    it('accepts valid article input', () => {
      const validArticle = {
        title: 'Modern Web Architecture',
        slug: 'modern-web-architecture',
        content: '<p>Content</p>',
        status: 'draft',
      }
      const res = validateBody(createArticleSchema, validArticle)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.title).toBe('Modern Web Architecture')
      }
    })

    it('rejects missing title with 400 and structured error', async () => {
      const invalidArticle = {
        title: '',
        slug: 'some-slug',
        content: 'content',
      }
      const res = validateBody(createArticleSchema, invalidArticle)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.response.status).toBe(400)
        const json = await res.response.json()
        expect(json.error).toBe('Validation failed')
        expect(json.issues.some((i: any) => i.field === 'title')).toBe(true)
      }
    })

    it('rejects invalid slug containing dangerous characters or spaces', async () => {
      const invalidArticle = {
        title: 'Title',
        slug: 'invalid slug with spaces!',
        content: 'content',
      }
      const res = validateBody(createArticleSchema, invalidArticle)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.response.status).toBe(400)
        const json = await res.response.json()
        expect(json.issues.some((i: any) => i.field === 'slug')).toBe(true)
      }
    })

    it('rejects invalid article status (e.g. unknown status injection)', async () => {
      const invalidArticle = {
        title: 'Title',
        slug: 'valid-slug',
        status: 'hacked_status',
      }
      const res = validateBody(createArticleSchema, invalidArticle)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.response.status).toBe(400)
      }
    })
  })

  describe('serviceMutationSchema', () => {
    it('rejects empty name and slug', async () => {
      const res = validateBody(serviceMutationSchema, { name: '', slug: '' })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.response.status).toBe(400)
        const json = await res.response.json()
        expect(json.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('databaseResetSchema', () => {
    it('accepts confirm: true', () => {
      const res = validateBody(databaseResetSchema, { confirm: true })
      expect(res.success).toBe(true)
    })

    it('rejects confirm: false or missing confirm with 400', async () => {
      const res = validateBody(databaseResetSchema, { confirm: false })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.response.status).toBe(400)
      }
    })
  })
})
