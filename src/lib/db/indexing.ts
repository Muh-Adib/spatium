import 'server-only'
import { prisma } from './prisma'

export type IndexingProvider = 'indexnow' | 'google' | (string & {})
export type IndexingStatus =
  | 'submitted'
  | 'accepted'
  | 'success'
  | 'failed'
  | 'rate_limited'
  | 'unconfigured'
  | (string & {})
export type IndexingTrigger = 'auto' | 'manual' | 'bulk' | 'mcp' | (string & {})

export interface IndexingSubmissionRecord {
  id: number
  url: string
  entityType: string | null
  entityId: number | null
  provider: IndexingProvider
  status: IndexingStatus
  httpStatus: number | null
  responsePayload: string | null
  trigger: IndexingTrigger
  actor: string | null
  submittedAt: string
}

export interface CreateIndexingSubmissionInput {
  url: string
  provider: IndexingProvider
  status: IndexingStatus
  entityType?: string | null
  entityId?: number | null
  httpStatus?: number | null
  responsePayload?: string | null
  trigger?: IndexingTrigger
  actor?: string | null
}

export interface GetIndexingHistoryOptions {
  limit?: number
  offset?: number
  url?: string
  entityType?: string
  entityId?: number
  provider?: IndexingProvider
  status?: IndexingStatus
  trigger?: IndexingTrigger
  search?: string
}

export interface GetIndexingHistoryResult {
  data: IndexingSubmissionRecord[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
    totalPages: number
  }
}

/**
 * Persists an indexing submission event in the database.
 */
export async function createIndexingSubmission(
  data: CreateIndexingSubmissionInput
): Promise<IndexingSubmissionRecord> {
  try {
    const created = await prisma.orm.public.IndexingSubmission.create({
      url: data.url,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      provider: data.provider,
      status: data.status,
      httpStatus: data.httpStatus ?? null,
      responsePayload: data.responsePayload ?? null,
      trigger: data.trigger ?? 'auto',
      actor: data.actor ?? null,
    })

    return {
      id: created.id,
      url: created.url,
      entityType: created.entityType,
      entityId: created.entityId,
      provider: created.provider,
      status: created.status,
      httpStatus: created.httpStatus,
      responsePayload: created.responsePayload,
      trigger: created.trigger,
      actor: created.actor,
      submittedAt: created.submittedAt,
    }
  } catch (error) {
    console.error('Failed to create indexing submission:', error)
    throw error
  }
}

/**
 * Retrieves the most recent indexing submission for a given URL and optional provider.
 * Optimized via composite index on (url, provider, submitted_at).
 */
export async function getLatestIndexingSubmission(
  url: string,
  provider?: IndexingProvider
): Promise<IndexingSubmissionRecord | null> {
  try {
    const where: any = { url }
    if (provider && provider !== 'all') {
      where.provider = provider
    }

    const row = await prisma.orm.public.IndexingSubmission
      .where(where)
      .orderBy((s: any) => s.submittedAt.desc())
      .first()

    if (!row) return null

    return {
      id: row.id,
      url: row.url,
      entityType: row.entityType,
      entityId: row.entityId,
      provider: row.provider,
      status: row.status,
      httpStatus: row.httpStatus,
      responsePayload: row.responsePayload,
      trigger: row.trigger,
      actor: row.actor,
      submittedAt: row.submittedAt,
    }
  } catch (error) {
    console.error(`Failed to fetch latest indexing submission for ${url}:`, error)
    return null
  }
}

/**
 * Alias for getLatestIndexingSubmission.
 */
export const getLatestSubmission = getLatestIndexingSubmission

/**
 * Retrieves latest submission status for both IndexNow and Google for a URL.
 */
export async function getLatestSubmissionsForUrl(url: string): Promise<{
  indexnow: IndexingSubmissionRecord | null
  google: IndexingSubmissionRecord | null
}> {
  const [indexnow, google] = await Promise.all([
    getLatestIndexingSubmission(url, 'indexnow'),
    getLatestIndexingSubmission(url, 'google'),
  ])

  return { indexnow, google }
}

/**
 * Retrieves paginated indexing submission history with optional filters.
 */
export async function getIndexingHistory(
  options: GetIndexingHistoryOptions = {}
): Promise<GetIndexingHistoryResult> {
  const limit = Math.max(1, Math.min(options.limit ?? 20, 100))
  const offset = Math.max(0, options.offset ?? 0)

  try {
    const where: any = {}
    if (options.url) where.url = options.url
    if (options.entityType) where.entityType = options.entityType
    if (options.entityId !== undefined) where.entityId = options.entityId
    if (options.provider && options.provider !== 'all') where.provider = options.provider
    if (options.status) where.status = options.status
    if (options.trigger) where.trigger = options.trigger

    let query: any = prisma.orm.public.IndexingSubmission
    if (Object.keys(where).length > 0) {
      query = query.where(where)
    }

    if (options.search) {
      const term = `%${options.search.replace(/[\\%_]/g, '\\$&')}%`
      query = query.where((s: any) => s.url.ilike(term))
    }

    const agg = await query.aggregate((s: any) => ({ total: s.count() }))
    const total = Number(agg.total || 0)

    const rows = await query
      .orderBy((s: any) => s.submittedAt.desc())
      .limit(limit)
      .offset(offset)
      .all()

    const data: IndexingSubmissionRecord[] = rows.map((row: any) => ({
      id: row.id,
      url: row.url,
      entityType: row.entityType,
      entityId: row.entityId,
      provider: row.provider,
      status: row.status,
      httpStatus: row.httpStatus,
      responsePayload: row.responsePayload,
      trigger: row.trigger,
      actor: row.actor,
      submittedAt: row.submittedAt,
    }))

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Failed to fetch indexing history:', error)
    return {
      data: [],
      meta: { total: 0, limit, offset, hasMore: false, totalPages: 0 },
    }
  }
}
