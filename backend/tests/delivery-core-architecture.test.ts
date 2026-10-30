import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { isPublicApi } from '../src/proxy'
import { authenticateDeliveryRequest } from '../src/lib/delivery/auth'
import { dispatchRevalidationWebhook } from '../src/lib/webhooks/dispatcher'
import { GET as getOpenApi, OPTIONS as optionsOpenApi } from '../src/app/api/openapi.json/route'
import { GET as getArticles } from '../src/app/api/v1/delivery/articles/route'
import { GET as getArticleBySlug } from '../src/app/api/v1/delivery/articles/[slug]/route'
import { GET as getPages } from '../src/app/api/v1/delivery/pages/route'
import { GET as getPageBySlug } from '../src/app/api/v1/delivery/pages/[slug]/route'
import { GET as getServices } from '../src/app/api/v1/delivery/services/route'
import { GET as getPortfolios } from '../src/app/api/v1/delivery/portfolios/route'
import { GET as getSeo } from '../src/app/api/v1/delivery/seo/route'
import { GET as getRedirects } from '../src/app/api/v1/delivery/redirects/route'
import { createClient, SegiaClient } from '../../../packages/client/src/index'

describe('Core Delivery API & Satellite Architecture Suite', () => {
  const originalEnv = process.env.NODE_ENV
  const originalSiteKey = process.env.SITE_API_KEY

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    process.env.SITE_API_KEY = 'site_sec_test_suite_key'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    process.env.SITE_API_KEY = originalSiteKey
    vi.restoreAllMocks()
  })

  describe('1. Proxy Whitelisting for Delivery & OpenAPI (Next.js 16 Standard)', () => {
    it('whitelists /api/v1/delivery/* for GET and OPTIONS', () => {
      expect(isPublicApi('/api/v1/delivery/articles', 'GET')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/articles/test-article', 'GET')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/pages/home', 'GET')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/services', 'GET')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/portfolios', 'GET')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/seo', 'GET')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/redirects', 'GET')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/articles', 'OPTIONS')).toBe(true)
      expect(isPublicApi('/api/v1/delivery/articles', 'POST')).toBe(false)
    })

    it('whitelists /api/openapi.json for API discovery', () => {
      expect(isPublicApi('/api/openapi.json', 'GET')).toBe(true)
      expect(isPublicApi('/api/openapi.json', 'OPTIONS')).toBe(true)
      expect(isPublicApi('/api/openapi.json', 'POST')).toBe(false)
    })
  })

  describe('2. Multi-Tenant Delivery Authentication (x-site-key)', () => {
    it('authenticates request with valid x-site-key header', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/articles', {
        headers: { 'x-site-key': 'site_sec_test_suite_key' },
      })
      const auth = await authenticateDeliveryRequest(req)
      expect('site' in auth).toBe(true)
      if ('site' in auth) {
        expect(auth.site.apiKey).toBe('site_sec_test_suite_key')
        expect(auth.site.isActive).toBe(true)
      }
    })

    it('authenticates request with query param siteKey', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/articles?siteKey=site_sec_test_suite_key')
      const auth = await authenticateDeliveryRequest(req)
      expect('site' in auth).toBe(true)
    })

    it('rejects invalid site key in production mode', async () => {
      process.env.NODE_ENV = 'production'
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/articles', {
        headers: { 'x-site-key': 'invalid_fraud_key' },
      })
      const auth = await authenticateDeliveryRequest(req)
      expect('response' in auth).toBe(true)
      if ('response' in auth) {
        expect(auth.response.status).toBe(403)
        expect(auth.response.headers.get('access-control-allow-origin')).toBe('*')
        expect(auth.response.headers.get('cache-control')).toBe('no-store')
      }
    })

    it('rejects missing site key in production mode', async () => {
      process.env.NODE_ENV = 'production'
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/articles')
      const auth = await authenticateDeliveryRequest(req)
      expect('response' in auth).toBe(true)
      if ('response' in auth) {
        expect(auth.response.status).toBe(401)
        expect(auth.response.headers.get('access-control-allow-origin')).toBe('*')
        expect(auth.response.headers.get('cache-control')).toBe('no-store')
      }
    })

    it('strictly rejects insecure default keys (segia-default-key, site_sec_default) in production mode', async () => {
      process.env.NODE_ENV = 'production'
      delete process.env.SITE_API_KEY

      const reqDefault = new NextRequest('http://localhost:3000/api/v1/delivery/articles', {
        headers: { 'x-site-key': 'segia-default-key' },
      })
      const authDefault = await authenticateDeliveryRequest(reqDefault)
      expect('response' in authDefault).toBe(true)
      if ('response' in authDefault) {
        expect(authDefault.response.status).toBe(403)
      }

      const reqSec = new NextRequest('http://localhost:3000/api/v1/delivery/articles', {
        headers: { 'x-site-key': 'site_sec_default' },
      })
      const authSec = await authenticateDeliveryRequest(reqSec)
      expect('response' in authSec).toBe(true)
      if ('response' in authSec) {
        expect(authSec.response.status).toBe(403)
      }
    })
  })

  describe('3. OpenAPI 3.1 JSON Specification & Endpoints', () => {
    it('handles OPTIONS CORS preflight request with 204 status', async () => {
      const res = await optionsOpenApi()
      expect(res.status).toBe(204)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS')
    })

    it('exposes valid OpenAPI 3.1 specification with securitySchemes and delivery routes', async () => {
      const res = await getOpenApi()
      expect(res.status).toBe(200)
      const spec = await res.json()

      expect(spec.openapi).toBe('3.1.0')
      expect(spec.info.title).toContain('SegiaTech Core Delivery API')
      expect(spec.components.securitySchemes.SiteKeyAuth).toBeDefined()
      expect(spec.components.securitySchemes.SiteKeyAuth.name).toBe('x-site-key')

      // Verify delivery routes
      expect(spec.paths['/api/v1/delivery/articles']).toBeDefined()
      expect(spec.paths['/api/v1/delivery/articles/{slug}']).toBeDefined()
      expect(spec.paths['/api/v1/delivery/pages']).toBeDefined()
      expect(spec.paths['/api/v1/delivery/pages/{slug}']).toBeDefined()
      expect(spec.paths['/api/v1/delivery/services']).toBeDefined()
      expect(spec.paths['/api/v1/delivery/portfolios']).toBeDefined()
      expect(spec.paths['/api/v1/delivery/seo']).toBeDefined()
      expect(spec.paths['/api/v1/delivery/redirects']).toBeDefined()
    })
  })

  describe('4. Delivery Route Handlers Execution', () => {
    const validHeaders = { 'x-site-key': 'site_sec_test_suite_key' }

    it('GET /api/v1/delivery/articles returns paginated response', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/articles?pageSize=5', {
        headers: validHeaders,
      })
      const res = await getArticles(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveProperty('data')
      expect(json).toHaveProperty('meta')
      expect(Array.isArray(json.data)).toBe(true)
    })

    it('GET /api/v1/delivery/articles/[slug] returns 404 for unknown slug', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/articles/non-existent-slug-xyz', {
        headers: validHeaders,
      })
      const res = await getArticleBySlug(req, {
        params: Promise.resolve({ slug: 'non-existent-slug-xyz' }),
      })
      expect(res.status).toBe(404)
    })

    it('GET /api/v1/delivery/pages returns list of pages', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/pages', {
        headers: validHeaders,
      })
      const res = await getPages(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveProperty('pages')
      expect(Array.isArray(json.pages)).toBe(true)
    })

    it('GET /api/v1/delivery/pages/[slug] handles slug lookup', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/pages/home', {
        headers: validHeaders,
      })
      const res = await getPageBySlug(req, {
        params: Promise.resolve({ slug: 'home' }),
      })
      expect([200, 404]).toContain(res.status)
    })

    it('GET /api/v1/delivery/services returns services and categories', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/services', {
        headers: validHeaders,
      })
      const res = await getServices(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveProperty('services')
      expect(json).toHaveProperty('categories')
    })

    it('GET /api/v1/delivery/portfolios returns portfolio items', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/portfolios', {
        headers: validHeaders,
      })
      const res = await getPortfolios(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveProperty('portfolios')
    })

    it('GET /api/v1/delivery/seo resolves metadata for path', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/seo?path=/', {
        headers: validHeaders,
      })
      const res = await getSeo(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveProperty('path', '/')
      expect(json).toHaveProperty('seo')
      expect(json.seo).toHaveProperty('metaTitle')
    })

    it('GET /api/v1/delivery/seo normalizes trailing slashes on paths', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/seo?path=/artikel/sample-post/', {
        headers: validHeaders,
      })
      const res = await getSeo(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.path).toBe('/artikel/sample-post')
    })

    it('GET /api/v1/delivery/redirects checks redirect map', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/delivery/redirects?path=/sample-old-url', {
        headers: validHeaders,
      })
      const res = await getRedirects(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveProperty('redirect')
    })
  })

  describe('5. On-Demand ISR Webhook Dispatcher', () => {
    it('dispatches revalidation events safely without throwing', async () => {
      // Mock global fetch for webhook receiver
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ revalidated: true }), { status: 200 })
      )
      global.fetch = mockFetch

      const results = await dispatchRevalidationWebhook({
        type: 'article',
        slug: 'ai-transformation',
        path: '/artikel/ai-transformation',
        tags: ['articles', 'article:ai-transformation'],
      })

      expect(Array.isArray(results)).toBe(true)
    })

    it('handles network failure gracefully without interrupting callers', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'))

      const results = await dispatchRevalidationWebhook({
        type: 'page',
        slug: 'about',
      })

      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('6. TypeScript Client SDK (@segiatech/client)', () => {
    it('creates client instance and enforces required parameters', () => {
      expect(() => createClient({ baseUrl: '', siteKey: 'key' })).toThrow()
      expect(() => createClient({ baseUrl: 'http://localhost:3000', siteKey: '' })).toThrow()

      const client = createClient({
        baseUrl: 'https://core.segiatech.com',
        siteKey: 'site_sec_xyz123',
      })
      expect(client).toBeInstanceOf(SegiaClient)
      expect(client.articles).toBeDefined()
      expect(client.pages).toBeDefined()
      expect(client.services).toBeDefined()
      expect(client.portfolios).toBeDefined()
      expect(client.seo).toBeDefined()
      expect(client.redirects).toBeDefined()
    })

    it('attaches proper x-site-key and next cache options during SDK requests', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [], meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      global.fetch = mockFetch

      const client = createClient({
        baseUrl: 'https://core.segiatech.com',
        siteKey: 'site_sec_xyz123',
      })

      await client.articles.list({ page: 2, pageSize: 10 })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toBe('https://core.segiatech.com/api/v1/delivery/articles?page=2&pageSize=10')
      expect(init.headers['x-site-key']).toBe('site_sec_xyz123')
      expect(init.next?.tags).toContain('articles')
    })
  })
})
