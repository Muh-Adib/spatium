import { prisma } from '../src/lib/db/prisma'

interface MissingBlockEntity {
  type: 'category' | 'service' | 'solution'
  id: number
  slug: string
  title: string
  status: string | null
}

async function runCoverage() {
  console.log('[catalog-coverage] Inspecting published catalog entities for blocks...\n')

  const categories = await prisma.orm.public.ServiceCategory.all()
  const allServices = await prisma.orm.public.Service.all()
  const allSolutions = await prisma.orm.public.Solution.all()

  const missing: MissingBlockEntity[] = []

  let catWithBlocks = 0
  for (const c of categories) {
    let hasBlocks = false
    try {
      const parsed = typeof c.blocks === 'string' ? JSON.parse(c.blocks) : c.blocks
      if (Array.isArray(parsed) && parsed.length > 0) {
        hasBlocks = true
      }
    } catch {}

    if (hasBlocks) {
      catWithBlocks++
    } else if (c.status === 'published' || !c.status) {
      missing.push({
        type: 'category',
        id: c.id,
        slug: c.slug,
        title: c.title,
        status: c.status,
      })
    }
  }

  let svcWithBlocks = 0
  for (const s of allServices) {
    let hasBlocks = false
    try {
      const parsed = typeof s.blocks === 'string' ? JSON.parse(s.blocks) : s.blocks
      if (Array.isArray(parsed) && parsed.length > 0) {
        hasBlocks = true
      }
    } catch {}

    if (hasBlocks) {
      svcWithBlocks++
    } else if (s.status === 'published' || !s.status) {
      missing.push({
        type: 'service',
        id: s.id,
        slug: s.slug,
        title: s.name,
        status: s.status,
      })
    }
  }

  let solWithBlocks = 0
  for (const sol of allSolutions) {
    let hasBlocks = false
    try {
      const parsed = typeof sol.blocks === 'string' ? JSON.parse(sol.blocks) : sol.blocks
      if (Array.isArray(parsed) && parsed.length > 0) {
        hasBlocks = true
      }
    } catch {}

    if (hasBlocks) {
      solWithBlocks++
    } else if (sol.status === 'published' || !sol.status) {
      missing.push({
        type: 'solution',
        id: sol.id,
        slug: sol.slug,
        title: sol.title,
        status: sol.status,
      })
    }
  }

  console.log('--- CATALOG BLOCK COVERAGE SUMMARY ---')
  console.log(`Service Categories : ${catWithBlocks}/${categories.length} have blocks`)
  console.log(`Services           : ${svcWithBlocks}/${allServices.length} have blocks`)
  console.log(`Solutions          : ${solWithBlocks}/${allSolutions.length} have blocks`)
  console.log(`Total Entities Missing Blocks: ${missing.length}`)

  if (missing.length > 0) {
    console.log('\nEntities Missing Blocks:')
    for (const m of missing) {
      console.log(`- [${m.type.toUpperCase()}] id=${m.id} slug="${m.slug}" title="${m.title}"`)
    }
  } else {
    console.log('\n✓ 100% of published catalog entities have valid blocks in database!')
  }

  return {
    categories: { total: categories.length, withBlocks: catWithBlocks },
    services: { total: allServices.length, withBlocks: svcWithBlocks },
    solutions: { total: allSolutions.length, withBlocks: solWithBlocks },
    missing,
  }
}

runCoverage()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[catalog-coverage] Error:', err)
    process.exit(1)
  })
