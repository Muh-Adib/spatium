/**
 * Solution Scoring & Template Engine
 *
 * Implements weighted matching recommendation engine (K-2 / ADR-0008)
 * using configurable weights and serialized string templates ({goal}, {industry}, {needs})
 * stored in SQLite instead of runtime JS closures.
 */

export interface BusinessGoal {
  id: string
  title: string
  description: string
  bulletPoints: string[]
  iconName: string
}

export interface Industry {
  id: string
  name: string
  desc: string
  iconName: string
}

export interface DynamicQuestionOption {
  id: string
  label: string
  desc: string
  iconName: string
}

export interface DynamicQuestion {
  id: string
  category: string
  title: string
  subtitle: string
  options: DynamicQuestionOption[]
}

export interface SolutionTaxonomyItemStored {
  id: string
  name: string
  badge: string
  category: string
  shortDesc: string
  targetGoals: string[]
  targetIndustries: string[]
  matchedKeywords: string[]
  whyItFitsTemplate: string
  whyPointsTemplate?: string[]
  differenceFromAlternative?: string
  keyFeatures: string[]
  businessBenefits: string[]
  deliverables: string[]
  relatedPortfolio?: {
    slug: string
    title: string
    client: string
    category: string
    image: string
    highlight: string
  }
  technologies: string[]
}

export interface SolutionWeights {
  goalWeight: number
  industryWeight: number
  needsWeight: number
}

export const DEFAULT_SOLUTION_WEIGHTS: SolutionWeights = {
  goalWeight: 40,
  industryWeight: 25,
  needsWeight: 35,
}

export function renderWhyItFits(
  template: string,
  params: { goal?: string; industry?: string; needs?: string[] }
): string {
  let res = template
  if (params.industry) {
    res = res.replace(/\{industry\}/g, params.industry)
  }
  if (params.goal) {
    res = res.replace(/\{goal\}/g, params.goal)
  }
  if (params.needs) {
    res = res.replace(/\{needs\}/g, params.needs.join(', '))
  }
  return res
}

export function renderWhyPoints(
  templates: string[],
  params: { goal?: string; industry?: string; needs?: string[] }
): string[] {
  return templates.map((t) => renderWhyItFits(t, params))
}

export interface SolutionFinderConfigData {
  businessGoals: BusinessGoal[]
  industries: Industry[]
  questions: DynamicQuestion[]
  recommendationMatrix: SolutionTaxonomyItemStored[]
  weights?: SolutionWeights
}

export interface ScoredSolutionResult {
  solution: SolutionTaxonomyItemStored
  score: number
  whyReasons: string[]
  primaryReason: string
}

export type ScoredSolution = ScoredSolutionResult

export function getDynamicQuestion(
  goalId: string,
  industryId: string,
  questions: DynamicQuestion[]
): DynamicQuestion {
  if (industryId === 'restoran') {
    const q = questions.find((x) => x.category === 'restoran' || x.id === 'resto_needs')
    if (q) return q
  }
  if (industryId === 'pendidikan') {
    const q = questions.find((x) => x.category === 'pendidikan' || x.id === 'edu_needs')
    if (q) return q
  }
  if (goalId === 'immersive_exp' || industryId === 'pariwisata' || industryId === 'kreatif') {
    const q = questions.find((x) => x.category === 'immersive' || x.id === 'immersive_needs')
    if (q) return q
  }
  if (goalId === 'increase_sales' || industryId === 'retail' || industryId === 'umkm') {
    const q = questions.find((x) => x.category === 'sales' || x.id === 'sales_needs')
    if (q) return q
  }
  if (
    goalId === 'automate_workflow' ||
    goalId === 'custom_app' ||
    industryId === 'corporate' ||
    industryId === 'manufaktur'
  ) {
    const q = questions.find((x) => x.category === 'corporate' || x.id === 'workflow_needs')
    if (q) return q
  }
  const defaultQ = questions.find((x) => x.category === 'default' || x.id === 'brand_needs')
  if (defaultQ) return defaultQ
  return (
    questions[0] || {
      id: 'default',
      category: 'default',
      title: 'Kebutuhan Utama',
      subtitle: 'Pilih modul atau kebutuhan utama yang ingin diprioritaskan.',
      options: [],
    }
  )
}

export function calculateScoredSolutions(
  goalId: string,
  industryId: string,
  selectedNeedIds: string[],
  taxonomy: SolutionTaxonomyItemStored[],
  goals: BusinessGoal[],
  industries: Industry[],
  questions: DynamicQuestion[],
  weights: SolutionWeights = DEFAULT_SOLUTION_WEIGHTS
): ScoredSolutionResult[] {
  const goal = goals.find((g) => g.id === goalId) || goals[0] || { id: goalId, title: goalId }
  const industry = industries.find((i) => i.id === industryId) || industries[0] || { id: industryId, name: industryId }

  // Resolve matching question
  const matchingQ = getDynamicQuestion(goalId, industryId, questions)
  const selectedOptions = (matchingQ.options || []).filter((o) => selectedNeedIds.includes(o.id))
  const needsLabels = selectedOptions.map((o) => o.label)

  const scored: ScoredSolutionResult[] = taxonomy.map((sol) => {
    let score = 0

    // 1. Goal Match
    const targetGoals = Array.isArray(sol.targetGoals) ? sol.targetGoals : []
    if (targetGoals.includes(goalId)) {
      score += weights.goalWeight
    } else {
      score += Math.round(weights.goalWeight * 0.375) // 15 on 40
    }

    // 2. Industry Match
    const targetIndustries = Array.isArray(sol.targetIndustries) ? sol.targetIndustries : []
    if (targetIndustries.includes(industryId)) {
      score += weights.industryWeight
    } else if (targetIndustries.includes('corporate') || targetIndustries.includes('lainnya')) {
      score += Math.round(weights.industryWeight * 0.48) // 12 on 25
    } else {
      score += Math.round(weights.industryWeight * 0.2) // 5 on 25
    }

    // 3. Needs Match
    const matchedKeywords = Array.isArray(sol.matchedKeywords) ? sol.matchedKeywords : []
    const matchedCount = selectedNeedIds.filter((nid) => matchedKeywords.includes(nid)).length
    if (matchedCount >= 2) {
      score += weights.needsWeight
    } else if (matchedCount === 1) {
      score += Math.round(weights.needsWeight * 0.628) // 22 on 35
    } else {
      score += Math.round(weights.needsWeight * 0.142) // 5 on 35
    }

    const whyReasons = sol.whyPointsTemplate && sol.whyPointsTemplate.length > 0
      ? renderWhyPoints(sol.whyPointsTemplate, { goal: goal.title, industry: industry.name, needs: needsLabels })
      : [
          `Membantu mencapai tujuan ${goal.title.toLowerCase()}`,
          `Mendukung kebutuhan ${needsLabels[0] || 'operasional'} secara terarah`,
          `Dapat disesuaikan sepenuhnya dengan proses bisnis ${industry.name}`,
          `Mengurangi proses manual dan meningkatkan efisiensi operasional`,
        ]

    const primaryReason = renderWhyItFits(sol.whyItFitsTemplate, {
      goal: goal.title,
      industry: industry.name,
      needs: needsLabels,
    })

    return {
      solution: sol,
      score,
      whyReasons,
      primaryReason,
    }
  })

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score)
}
