import { describe, it, expect } from 'vitest'
import { syncContentNode, getNodeById, getNodeByUrl } from '../src/lib/graph/nodes'
import { findLinkTargets } from '../src/lib/graph/search'

describe('Content Graph, Clusters & Link Cards (Sprint S4 / ADR-0010)', () => {
  it('synchronizes service and article entities to content_nodes', async () => {
    const serviceNode = await syncContentNode('service', 'website-development')
    expect(serviceNode).toBeDefined()
    expect(serviceNode?.type).toBe('service')
    expect(serviceNode?.url).toBe('/layanan/website-development')
    expect(serviceNode?.title).toBeTruthy()

    const foundByUrl = await getNodeByUrl('/layanan/website-development')
    expect(foundByUrl).toBeDefined()
    expect(foundByUrl?.id).toBe(serviceNode?.id)
  })

  it('ranks link targets with cluster, keyword, location, and type scoring weights', async () => {
    const targets = await findLinkTargets({
      text: 'Kami menyediakan jasa pembuatan website untuk bisnis dan korporasi di Jakarta.',
      location: 'Jakarta',
      limit: 5,
    })

    expect(Array.isArray(targets)).toBe(true)
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.length).toBeLessThanOrEqual(5)

    const top = targets[0]
    expect(top.score).toBeGreaterThan(0)
    expect(top.url).toBeTruthy()
    expect(top.suggestedAnchors.length).toBeGreaterThan(0)
    expect(top.reason).toBeTruthy()
  })

  it('excludes sourceNodeId from recommendation candidates to prevent self-linking', async () => {
    const initialTargets = await findLinkTargets({ limit: 5 })
    expect(initialTargets.length).toBeGreaterThan(0)

    const excludedId = initialTargets[0].nodeId
    const targetsWithoutSelf = await findLinkTargets({
      sourceNodeId: excludedId,
      limit: 5,
    })

    const containsExcluded = targetsWithoutSelf.some((t) => t.nodeId === excludedId)
    expect(containsExcluded).toBe(false)
  })
})
