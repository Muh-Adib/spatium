import { NextResponse } from 'next/server'
import { corsHeaders, handleOptions } from '@/lib/delivery/cors'

export const dynamic = 'force-static'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'SPATIUM Core Delivery API',
      version: '1.0.0',
      description:
        'Enterprise multi-tenant headless content delivery API for SPATIUM websites and microsites. Provides typed access to published articles, dynamic pages, services, portfolios, technical SEO metadata, and 301 redirects.',
      contact: {
        name: 'SPATIUM',
        url: 'https://spatium.id',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Core Backend Environment',
      },
    ],
    security: [
      {
        SiteKeyAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        SiteKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-site-key',
          description: 'Tenant site API key provisioned in Core Admin Studio',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['error'],
        },
        SEOComponent: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            canonicalUrl: { type: 'string' },
            robotsIndex: { type: 'boolean' },
            robotsFollow: { type: 'boolean' },
            ogTitle: { type: 'string' },
            ogDescription: { type: 'string' },
            ogImage: { type: 'string' },
            focusTopic: { type: 'string' },
            secondaryTopics: { type: 'string' },
          },
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            documentId: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            excerpt: { type: 'string' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'in_review', 'approved', 'published', 'archived'] },
            readingTime: { type: 'number' },
            publishedAt: { type: 'string', nullable: true },
            coverUrl: { type: 'string', nullable: true },
            category: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                slug: { type: 'string' },
              },
            },
            author: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                slug: { type: 'string' },
                avatar: { type: 'string', nullable: true },
              },
            },
            seo: { $ref: '#/components/schemas/SEOComponent' },
          },
          required: ['id', 'slug', 'title'],
        },
        PageBlock: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            variant: { type: 'string' },
            data: { type: 'object', additionalProperties: true },
          },
          required: ['type'],
        },
        Page: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            slug: { type: 'string' },
            title: { type: 'string' },
            excerpt: { type: 'string', nullable: true },
            content: { type: 'string', nullable: true },
            kind: { type: 'string', enum: ['standard', 'landing', 'system'] },
            status: { type: 'string', enum: ['draft', 'in_review', 'approved', 'published', 'archived'] },
            blocks: {
              type: 'array',
              items: { $ref: '#/components/schemas/PageBlock' },
            },
            seo: { $ref: '#/components/schemas/SEOComponent' },
          },
          required: ['id', 'slug', 'title'],
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            slug: { type: 'string' },
            name: { type: 'string' },
            shortDescription: { type: 'string', nullable: true },
            longDescription: { type: 'string', nullable: true },
            heroImage: { type: 'string', nullable: true },
            features: { type: 'array', items: { type: 'string' } },
            deliverables: { type: 'array', items: { type: 'string' } },
            seo: { $ref: '#/components/schemas/SEOComponent' },
          },
          required: ['id', 'slug', 'name'],
        },
        Portfolio: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            slug: { type: 'string' },
            title: { type: 'string' },
            client: { type: 'string', nullable: true },
            year: { type: 'number', nullable: true },
            category: { type: 'string', nullable: true },
            summary: { type: 'string' },
            challenge: { type: 'string', nullable: true },
            approach: { type: 'string', nullable: true },
            solution: { type: 'string', nullable: true },
            result: { type: 'string', nullable: true },
            livePreviewUrl: { type: 'string', nullable: true },
            blocks: {
              type: 'array',
              items: { $ref: '#/components/schemas/PageBlock' },
            },
            seo: { $ref: '#/components/schemas/SEOComponent' },
          },
          required: ['id', 'slug', 'title'],
        },
        RedirectLookup: {
          type: 'object',
          properties: {
            sourcePath: { type: 'string' },
            destinationPath: { type: 'string' },
            statusCode: { type: 'number' },
          },
          required: ['sourcePath', 'destinationPath', 'statusCode'],
        },
      },
    },
    paths: {
      '/api/v1/delivery/articles': {
        get: {
          summary: 'List published articles',
          description: 'Retrieve paginated published articles filtered by category, search term, or locale.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'locale', in: 'query', schema: { type: 'string', enum: ['id', 'en'] } },
          ],
          responses: {
            '200': {
              description: 'List of articles with pagination metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
                      meta: {
                        type: 'object',
                        properties: {
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              pageSize: { type: 'integer' },
                              pageCount: { type: 'integer' },
                              total: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/delivery/articles/{slug}': {
        get: {
          summary: 'Get article by slug',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Article entity',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { article: { $ref: '#/components/schemas/Article' } },
                  },
                },
              },
            },
            '404': { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '/api/v1/delivery/services': {
        get: {
          summary: 'List services and service categories',
          responses: {
            '200': {
              description: 'Services and categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      services: { type: 'array', items: { $ref: '#/components/schemas/Service' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/delivery/services/{slug}': {
        get: {
          summary: 'Get service by slug',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Service entity with full deliverables and related items',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { service: { $ref: '#/components/schemas/Service' } },
                  },
                },
              },
            },
            '404': { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '/api/v1/delivery/portfolios': {
        get: {
          summary: 'List case studies and portfolio projects',
          responses: {
            '200': {
              description: 'List of portfolios',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      portfolios: { type: 'array', items: { $ref: '#/components/schemas/Portfolio' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/delivery/portfolios/{slug}': {
        get: {
          summary: 'Get portfolio item by slug',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Portfolio entity',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { portfolio: { $ref: '#/components/schemas/Portfolio' } },
                  },
                },
              },
            },
            '404': { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '/api/v1/delivery/seo': {
        get: {
          summary: 'Resolve SEO metadata for any path',
          parameters: [
            { name: 'path', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Resolved technical SEO metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      seo: { $ref: '#/components/schemas/SEOComponent' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/delivery/redirects': {
        get: {
          summary: 'Check 301 redirect map for an incoming path',
          parameters: [
            { name: 'path', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Matching redirect if registered, or null',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      redirect: {
                        nullable: true,
                        $ref: '#/components/schemas/RedirectLookup',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  return NextResponse.json(spec, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
