import { describe, it, expect } from 'vitest'
import {
  BUSINESS_GOALS,
  INDUSTRIES,
  SOLUTION_TAXONOMY,
  calculateRecommendedSolutions,
} from '../archive/legacy-data/solutions-data'
import {
  renderWhyItFits,
  renderWhyPoints,
  calculateScoredSolutions,
  SolutionTaxonomyItemStored,
} from '../src/lib/solutions/scoring'

describe('L2-T7 Solution Template String & Scoring Parity Test', () => {
  // Convert SOLUTION_TAXONOMY items into template-based records using placeholder '{industry}'
  const storedTaxonomy: SolutionTaxonomyItemStored[] = SOLUTION_TAXONOMY.map((sol) => {
    // Generate template by passing placeholder '{industry}' into old closure
    const whyItFitsTemplate = sol.whyItFits('{goal}', '{industry}', ['{needs}'])
    const whyPointsTemplate = sol.whyPoints
      ? sol.whyPoints('{goal}', '{industry}', ['{needs}'])
      : undefined

    return {
      id: sol.id,
      name: sol.name,
      badge: sol.badge,
      category: sol.category,
      shortDesc: sol.shortDesc,
      targetGoals: sol.targetGoals,
      targetIndustries: sol.targetIndustries,
      matchedKeywords: sol.matchedKeywords,
      whyItFitsTemplate,
      whyPointsTemplate,
      differenceFromAlternative: sol.differenceFromAlternative,
      keyFeatures: sol.keyFeatures,
      businessBenefits: sol.businessBenefits,
      deliverables: sol.deliverables,
      relatedPortfolio: sol.relatedPortfolio,
      technologies: sol.technologies,
    }
  })

  // Test matrix: 5 goals x 6 industries = 30 combinations (exceeds criteria >= 20)
  const testGoals = [
    'increase_sales',
    'build_brand',
    'digitalize_business',
    'automate_workflow',
    'immersive_exp',
  ]

  const testIndustries = [
    { id: 'pendidikan', name: 'Pendidikan & Kampus' },
    { id: 'restoran', name: 'Restoran & F&B' },
    { id: 'retail', name: 'Retail & Toko' },
    { id: 'pariwisata', name: 'Wisata & Rekreasi' },
    { id: 'corporate', name: 'Korporasi & Bisnis B2B' },
    { id: 'kesehatan', name: 'Kesehatan & Klinik' },
  ]

  let combinationsTested = 0

  it('proves 100% string equality between template replacement and legacy closures for >= 20 combinations', () => {
    for (const goalId of testGoals) {
      const goal = BUSINESS_GOALS.find((g) => g.id === goalId) || BUSINESS_GOALS[0]

      for (const ind of testIndustries) {
        combinationsTested++

        for (const sol of SOLUTION_TAXONOMY) {
          const storedSol = storedTaxonomy.find((s) => s.id === sol.id)!

          // Legacy closure result
          const legacyWhy = sol.whyItFits(goal.title, ind.name, ['Kebutuhan Test'])

          // Template replacement result
          const templateWhy = renderWhyItFits(storedSol.whyItFitsTemplate, {
            goal: goal.title,
            industry: ind.name,
            needs: ['Kebutuhan Test'],
          })

          expect(templateWhy).toBe(legacyWhy)

          if (sol.whyPoints && storedSol.whyPointsTemplate) {
            const legacyPoints = sol.whyPoints(goal.title, ind.name, ['Kebutuhan Test'])
            const templatePoints = renderWhyPoints(storedSol.whyPointsTemplate, {
              goal: goal.title,
              industry: ind.name,
              needs: ['Kebutuhan Test'],
            })
            expect(templatePoints).toEqual(legacyPoints)
          }
        }
      }
    }

    expect(combinationsTested).toBeGreaterThanOrEqual(20)
  })

  it('proves scoring engine parity between legacy and new DB-configurable scoring function', () => {
    const questions = [
      {
        id: 'sales_needs',
        category: 'retail',
        title: 'Kebutuhan Penjualan',
        subtitle: 'Sub',
        options: [
          { id: 'catalog_web', label: 'Katalog Web', desc: '', iconName: 'Grid' },
          { id: 'online_checkout', label: 'Online Checkout', desc: '', iconName: 'Cart' },
        ],
      },
    ]

    const legacyScored = calculateRecommendedSolutions('increase_sales', 'retail', [
      'catalog_web',
      'online_checkout',
    ])

    const newScored = calculateScoredSolutions(
      'increase_sales',
      'retail',
      ['catalog_web', 'online_checkout'],
      storedTaxonomy,
      BUSINESS_GOALS,
      INDUSTRIES,
      questions
    )

    expect(newScored.length).toBe(legacyScored.length)
    expect(newScored[0].solution.id).toBe(legacyScored[0].solution.id)
    expect(newScored[0].score).toBe(legacyScored[0].score)
  })
})
