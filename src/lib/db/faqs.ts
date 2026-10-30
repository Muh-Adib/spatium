import 'server-only'
import { prisma } from './prisma'
import { getFaqsByScopeSync, type FAQItem } from '@/lib/content/faqs'

/**
 * Server-only database query for centralized FAQs (ADR-0007 / L8-T3)
 * Queries PostgreSQL `faq_items` with graceful deterministic fallback.
 */
export async function getFaqsByScope(
  scope: 'homepage' | 'services' | 'portfolio' | 'city',
  context?: { cityName?: string }
): Promise<FAQItem[]> {
  if (scope === 'city') {
    return getFaqsByScopeSync('city', context)
  }

  try {
    const rows = await prisma.orm.public.FaqItem
      .where({ scope, active: true })
      .orderBy((f: any) => f.position.asc())
      .all()

    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        question: r.question,
        answer: r.answer,
      }))
    }
  } catch (err) {
    // Graceful fallback to static seed
  }

  return getFaqsByScopeSync(scope, context)
}

export type { FAQItem }
