import { describe, expect, it, vi, afterEach } from 'vitest'
const state = vi.hoisted(() => ({ readCache: vi.fn() }))
vi.mock('@/lib/db/prisma', () => ({ prisma: { orm: { public: { GscCache: { where: () => ({ first: state.readCache }) } } } } }))
vi.mock('@/lib/db/siteProfile', () => ({ getSiteProfile: async () => ({ url: 'https://fixture.invalid' }) }))
import { aggregateKeywordRows, getVerifiedKeywordDataset } from '../src/lib/gsc/keyword-data'
import { getKeywordOpportunities } from '../src/lib/db/keywords'
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
const rows = [
  { keys: ['2026-10-01', 'https://fixture.invalid/page', 'query'], clicks: 10, impressions: 100, ctr: 0.1, position: 4 },
  { keys: ['2026-10-02', 'https://fixture.invalid/page', 'query'], clicks: 10, impressions: 900, ctr: 10 / 900, position: 10 },
]
describe('Keyword provenance and calculations', () => {
  it('does not present legacy database rows as verified GSC when credentials are absent', async () => {
    vi.stubEnv('GSC_CLIENT_EMAIL', '')
    vi.stubEnv('GSC_PRIVATE_KEY', '')
    expect((await getVerifiedKeywordDataset()).connected).toBe(false)
    expect(await getKeywordOpportunities()).toEqual([])
    expect(state.readCache).not.toHaveBeenCalled()
  })
  it('requires an official sync dataset even when credentials are configured', async () => {
    vi.stubEnv('GSC_CLIENT_EMAIL', 'fixture@example.invalid')
    vi.stubEnv('GSC_PRIVATE_KEY', 'test-only')
    state.readCache.mockResolvedValue(null)
    expect((await getVerifiedKeywordDataset()).connected).toBe(false)
  })
  it('combines daily rows, computes percentage CTR and weights position by impressions', () => {
    expect(aggregateKeywordRows(rows)).toEqual([{ query: 'query', page: 'https://fixture.invalid/page', clicks: 20, impressions: 1000, ctr: 2, position: 9.4 }])
  })
  it('does not report high CTR as low CTR by confusing fractions with percentages', async () => {
    expect(await getKeywordOpportunities('id', [{ keys: ['2026-10-01', 'https://fixture.invalid/page', 'query'], clicks: 100, impressions: 1000, ctr: 0.1, position: 3 }])).toEqual([])
  })
})
