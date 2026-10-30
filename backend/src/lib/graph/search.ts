import { prisma } from '@/lib/db/prisma'
import { ContentNodeEntity, getNodeById } from './nodes'

export interface LinkTargetCandidate {
  nodeId: number
  type: string
  url: string
  title: string
  summary: string | null
  image: string | null
  score: number
  reason: string
  suggestedAnchors: string[]
}

export interface FindTargetsOptions {
  text?: string
  sourceNodeId?: number
  clusterId?: number
  location?: string
  limit?: number
}

/**
 * Weighted content graph link target recommendation (ADR-0010 & Lampiran B)
 */
export async function findLinkTargets(options: FindTargetsOptions): Promise<LinkTargetCandidate[]> {
  const { text = '', sourceNodeId, clusterId, location, limit = 5 } = options
  const normalizedText = text.toLowerCase().trim()

  // 1. Fetch indexable and published content nodes
  const allNodes = await prisma.orm.public.ContentNode
    .where({ status: 'published', indexable: true })
    .all()

  const nodes = sourceNodeId ? allNodes.filter((n: any) => n.id !== sourceNodeId) : allNodes

  // 2. Identify nodes already linked by sourceNodeId if provided
  const existingLinkedTargetIds = new Set<number>()
  if (sourceNodeId) {
    const existingLinks = await prisma.orm.public.ContentLink
      .where({ sourceNodeId })
      .all()

    existingLinks.forEach((l: any) => existingLinkedTargetIds.add(l.targetNodeId))
  }

  // 3. Compute relevance scores
  const candidates: LinkTargetCandidate[] = []

  for (const node of nodes) {
    // If already linked, skip or apply heavy penalty
    if (existingLinkedTargetIds.has(node.id)) {
      continue
    }

    let score = 0
    const reasons: string[] = []

    // A. Cluster Match (30%)
    if (clusterId && node.clusterId === clusterId) {
      score += 0.30
      reasons.push('Kecocokan klaster topik (30%)')
    }

    // B. Keyword Match (20%)
    const kw = (node.primaryKeyword || '').toLowerCase()
    const title = node.title.toLowerCase()
    let kwMatch = false

    if (normalizedText) {
      if (kw && normalizedText.includes(kw)) {
        score += 0.20
        kwMatch = true
        reasons.push(`Kata kunci utama "${node.primaryKeyword}" hadir dalam teks`)
      } else if (normalizedText.includes(title)) {
        score += 0.15
        kwMatch = true
        reasons.push('Judul entitas disebut dalam konten')
      } else {
        // Partial word overlap
        const words = kw.split(/\s+/).filter((w: string) => w.length > 3)
        const matchedWord = words.find((w: string) => normalizedText.includes(w))
        if (matchedWord) {
          score += 0.10
          reasons.push(`Frasa terkait "${matchedWord}" relevan`)
        }
      }
    }

    // C. Location Match (15%)
    if (location && node.location) {
      if (location.toLowerCase() === node.location.toLowerCase()) {
        score += 0.15
        reasons.push(`Target wilayah GEO identik (${node.location})`)
      }
    }

    // D. Type Priority for transactional/intent value (15%)
    // Landing > Solution > Portfolio > Service > Article
    if (node.type === 'landing') {
      score += 0.15
      reasons.push('Halaman pilar konversi landing page wilayah')
    } else if (node.type === 'solution') {
      score += 0.14
      reasons.push('Solusi bisnis praktis terapan')
    } else if (node.type === 'portfolio') {
      score += 0.12
      reasons.push('Studi kasus bukti nyata (proof layer)')
    } else if (node.type === 'service') {
      score += 0.10
      reasons.push('Layanan kapabilitas inti')
    } else {
      score += 0.05
    }

    // E. Freshness / Baseline (10%)
    score += 0.10

    // Build anchor variations
    const suggestedAnchors: string[] = []
    if (node.primaryKeyword) {
      suggestedAnchors.push(node.primaryKeyword.toLowerCase())
    }
    suggestedAnchors.push(node.title)
    if (node.type === 'service') {
      suggestedAnchors.push(`layanan ${node.title.toLowerCase()}`)
    } else if (node.type === 'portfolio') {
      suggestedAnchors.push(`proyek ${node.title.toLowerCase()}`)
    } else if (node.type === 'landing' && node.location) {
      suggestedAnchors.push(`jasa pembuatan website di ${node.location}`)
    }

    candidates.push({
      nodeId: node.id,
      type: node.type,
      url: node.url,
      title: node.title,
      summary: node.summary,
      image: node.image,
      score: Math.round(score * 100) / 100,
      reason: reasons.join(' · ') || 'Relevansi indeks graf',
      suggestedAnchors: Array.from(new Set(suggestedAnchors)),
    })
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score)

  return candidates.slice(0, limit)
}
