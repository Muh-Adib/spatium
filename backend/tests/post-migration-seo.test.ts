import { describe, it, expect, beforeEach } from 'vitest'
import {
  redirectChainAudit,
  migrationTrafficDiff,
  findStrikingDistance,
  findCannibalization,
  findLowCtr,
  detectContentDecay,
  findContentGaps,
} from '../src/lib/seo/post-migration'
import { db, prisma } from '../src/lib/db/prisma'

describe('Post-Migration SEO & Intelligence Tools (L11-T5)', () => {
  beforeEach(async () => {
    // This suite runs only in the disposable database supplied by global setup.
    await prisma.orm.public.Redirect.where((row) => row.sourcePath.like('/test-%')).deleteAll()
    await prisma.orm.public.LegacyUrl.where((row) => row.legacyUrl.like('/test-%')).deleteAll()
    await prisma.orm.public.GscDaily.where((row) => row.page.like('/test-%')).deleteAll()
  })

  describe('redirectChainAudit', () => {
    it('detects direct chains (A -> B -> C), loops (A -> B -> A), and self-redirects', async () => {
      // Clean previous test records
      for (const p of ['/test-chain-a', '/test-chain-b', '/test-self']) {
        const ex = await prisma.orm.public.Redirect.where({ sourcePath: p }).first()
        if (ex) await prisma.orm.public.Redirect.where({ id: ex.id }).delete()
      }

      // Seed test redirect chain: A -> B, B -> C
      await prisma.orm.public.Redirect.create({ sourcePath: '/test-chain-a', destinationPath: '/test-chain-b', active: true })
      await prisma.orm.public.Redirect.create({ sourcePath: '/test-chain-b', destinationPath: '/test-chain-c', active: true })
      // Self-redirect
      await prisma.orm.public.Redirect.create({ sourcePath: '/test-self', destinationPath: '/test-self', active: true })

      const issues = await redirectChainAudit()

      const chainIssue = issues.find((i) => i.sourcePath === '/test-chain-a')
      expect(chainIssue).toBeDefined()
      expect(chainIssue?.type).toBe('chain')
      expect(chainIssue?.finalDestination).toBe('/test-chain-c')
      expect(chainIssue?.hopCount).toBe(2)

      const selfIssue = issues.find((i) => i.sourcePath === '/test-self')
      expect(selfIssue).toBeDefined()
      expect(selfIssue?.type).toBe('self_redirect')
    })

    it('detects redirect loops (A -> B -> A)', async () => {
      for (const p of ['/test-loop-a', '/test-loop-b']) {
        const ex = await prisma.orm.public.Redirect.where({ sourcePath: p }).first()
        if (ex) await prisma.orm.public.Redirect.where({ id: ex.id }).delete()
      }

      await prisma.orm.public.Redirect.create({ sourcePath: '/test-loop-a', destinationPath: '/test-loop-b', active: true })
      await prisma.orm.public.Redirect.create({ sourcePath: '/test-loop-b', destinationPath: '/test-loop-a', active: true })

      const issues = await redirectChainAudit()
      const loopIssue = issues.find((i) => i.sourcePath === '/test-loop-a' || i.sourcePath === '/test-loop-b')
      expect(loopIssue).toBeDefined()
      expect(loopIssue?.type).toBe('loop')
    })
  })

  describe('migrationTrafficDiff', () => {
    it('returns notConnected with helpful message when legacy_urls has no data', async () => {
      // Ensure no legacy urls
      await db.execute(db.sql.public.legacy_urls.delete().build())
      const res = await migrationTrafficDiff()
      expect(res.connected).toBe(false)
      if (!res.connected) {
        expect(res.reason).toContain('legacy_urls')
      }
    })

    it('calculates traffic delta and detects unmapped or dropped URLs', async () => {
      for (const u of ['/test-legacy-1', '/test-legacy-unmapped']) {
        const ex = await prisma.orm.public.LegacyUrl.where({ legacyUrl: u }).first()
        if (ex) await prisma.orm.public.LegacyUrl.where({ id: ex.id }).delete()
      }

      const existingGsc = await prisma.orm.public.GscDaily.where({ page: '/test-page-1' }).all()
      for (const g of existingGsc) {
        await prisma.orm.public.GscDaily.where({ id: g.id }).delete()
      }

      await prisma.orm.public.LegacyUrl.create({
        legacyUrl: '/test-legacy-1',
        targetUrl: '/test-page-1',
        migrationStatus: 'dropped',
        impressionsBefore: 1000,
        clicksBefore: 100,
      })
      await prisma.orm.public.LegacyUrl.create({
        legacyUrl: '/test-legacy-unmapped',
        targetUrl: null,
        migrationStatus: 'unmapped',
        impressionsBefore: 500,
        clicksBefore: 50,
      })

      await prisma.orm.public.GscDaily.create({
        date: '2026-10-20',
        page: '/test-page-1',
        query: 'test query',
        impressions: 200, // 80% drop from 1000
        clicks: 10,
        position: 12,
        ctr: 5.0,
      })

      const res = await migrationTrafficDiff()
      expect(res.connected).toBe(true)
      if (res.connected) {
        const item1 = res.data.find((d) => d.legacyUrl === '/test-legacy-1')
        expect(item1).toBeDefined()
        expect(item1?.migrationStatus).toBe('dropped')
        expect(item1?.trafficDeltaPercent).toBe(-80.0)

        const unmappedItem = res.data.find((d) => d.legacyUrl === '/test-legacy-unmapped')
        expect(unmappedItem).toBeDefined()
        expect(unmappedItem?.migrationStatus).toBe('unmapped')
      }
    })
  })

  describe('findStrikingDistance', () => {
    it('accurately filters queries in positions 7.5 to 20.0', async () => {
      await prisma.orm.public.GscDaily.create({
        date: '2026-10-20',
        page: '/test-page-strike',
        query: 'striking query test',
        impressions: 500,
        clicks: 25,
        position: 11.4,
        ctr: 5.0,
        locale: 'id',
      })
      await prisma.orm.public.GscDaily.create({
        date: '2026-10-20',
        page: '/test-page-top',
        query: 'top 1 query test',
        impressions: 500,
        clicks: 100,
        position: 1.5,
        ctr: 20.0,
        locale: 'id',
      })

      const res = await findStrikingDistance({ minImpressions: 100 })
      expect(res.connected).toBe(true)
      if (res.connected) {
        const found = res.data.find((d) => d.query === 'striking query test')
        expect(found).toBeDefined()
        expect(found?.position).toBe(11.4)
        expect(found?.priorityScore).toBeGreaterThan(0)

        const top1 = res.data.find((d) => d.query === 'top 1 query test')
        expect(top1).toBeUndefined()
      }
    })
  })

  describe('findCannibalization', () => {
    it('detects when multiple distinct pages compete for the same query', async () => {
      await prisma.orm.public.GscDaily.create({
        date: '2026-10-20',
        page: '/test-page-a',
        query: 'cannibalized query',
        impressions: 300,
        clicks: 15,
        position: 4.2,
      })
      await prisma.orm.public.GscDaily.create({
        date: '2026-10-20',
        page: '/test-page-b',
        query: 'cannibalized query',
        impressions: 200,
        clicks: 5,
        position: 8.5,
      })

      const res = await findCannibalization()
      expect(res.connected).toBe(true)
      if (res.connected) {
        const issue = res.data.find((d) => d.query === 'cannibalized query')
        expect(issue).toBeDefined()
        expect(issue?.pages.length).toBe(2)
        expect(issue?.totalImpressions).toBe(500)
      }
    })
  })

  describe('findLowCtr', () => {
    it('identifies queries with position <= 5.5 but CTR < 5.0%', async () => {
      await prisma.orm.public.GscDaily.create({
        date: '2026-10-20',
        page: '/test-page-low-ctr',
        query: 'low ctr high rank query',
        impressions: 400,
        clicks: 4,
        position: 2.1,
        ctr: 1.0,
      })

      const res = await findLowCtr({ minImpressions: 100 })
      expect(res.connected).toBe(true)
      if (res.connected) {
        const opp = res.data.find((d) => d.query === 'low ctr high rank query')
        expect(opp).toBeDefined()
        expect(opp?.position).toBe(2.1)
        expect(opp?.ctr).toBe(1.0)
      }
    })
  })

  describe('detectContentDecay', () => {
    it('flags pages suffering >20% decline across multi-day records', async () => {
      await prisma.orm.public.GscDaily.create({
        date: '2026-09-01',
        page: '/test-page-decay',
        query: 'decay query 1',
        impressions: 1000,
        clicks: 100,
        position: 3.0,
      })
      await prisma.orm.public.GscDaily.create({
        date: '2026-10-20',
        page: '/test-page-decay',
        query: 'decay query 1',
        impressions: 400,
        clicks: 40,
        position: 9.0,
      })

      const res = await detectContentDecay()
      expect(res.connected).toBe(true)
      if (res.connected) {
        const decay = res.data.find((d) => d.page === '/test-page-decay')
        expect(decay).toBeDefined()
        expect(decay?.clicksDropPercent).toBe(60.0)
        expect(decay?.status).toBe('severe_decay')
      }
    })
  })
})
