import { describe, it, expect } from 'vitest'
import { prisma } from '../src/lib/db/prisma'
import { getSolutionBySlug, getSolutions } from '../src/lib/db/solutions'
import { getRelatedServicesForPortfolio, getRelatedSolutionsForPortfolio } from '../src/lib/db/portfolio'

describe('L9-T1 & L9-T4 Content Graph & Solution-Services Bidirectional Relations', () => {
  it('has backfilled solution_services junction records in database', async () => {
    const res = await prisma.orm.public.SolutionService.aggregate((m: any) => ({
      total: m.count(),
    }))
    expect(res.total).toBeGreaterThanOrEqual(40)
  })

  it('ensures every solution has at least one related service linked', async () => {
    const allSolutions = await getSolutions()
    expect(allSolutions.length).toBeGreaterThan(0)

    for (const sol of allSolutions) {
      const detailed = await getSolutionBySlug(sol.slug)
      expect(detailed).toBeDefined()
      expect(detailed?.relatedServices).toBeDefined()
      expect(detailed?.relatedServices?.length).toBeGreaterThanOrEqual(1)

      const svc = detailed!.relatedServices![0]
      expect(svc.id).toBeDefined()
      expect(svc.slug).toBeTruthy()
      expect(svc.name).toBeTruthy()
    }
  })

  it('returns relatedPortfolios and relatedServices on getSolutionBySlug', async () => {
    const sol = await getSolutionBySlug('booking-transaction-platform')
    expect(sol).toBeDefined()
    expect(sol?.slug).toBe('booking-transaction-platform')
    expect(sol?.relatedServices).toBeDefined()
    expect(sol?.relatedServices?.length).toBeGreaterThanOrEqual(3)

    const serviceSlugs = sol?.relatedServices?.map((s) => s.slug)
    expect(serviceSlugs).toContain('custom-web-application')
    expect(serviceSlugs).toContain('mobile-first-application')
    expect(serviceSlugs).toContain('website-development')
  })

  it('verifies bidirectional relations for portfolios (getRelatedServicesForPortfolio & getRelatedSolutionsForPortfolio)', async () => {
    // Portfolio ID 1: interactive-3d-aquarium
    const relatedServices = await getRelatedServicesForPortfolio(1)
    expect(Array.isArray(relatedServices)).toBe(true)
    expect(relatedServices.length).toBeGreaterThanOrEqual(1)

    const relatedSolutions = await getRelatedSolutionsForPortfolio(1)
    expect(Array.isArray(relatedSolutions)).toBe(true)
    expect(relatedSolutions.length).toBeGreaterThanOrEqual(1)
  })
})
