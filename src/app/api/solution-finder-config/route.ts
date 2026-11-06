import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSolutionFinderConfig } from '@/lib/db/solutions'
import { requireCan } from '@/lib/auth/capabilities'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { solutionFinderConfigSchema, validateCatalogBody } from '@/lib/validation/api-schemas'
import { errorResponse } from '@/lib/http/errors'
import { actorOf, parseJsonArray, recordCatalogHistory } from '@/lib/db/catalogMutations'

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB
const CONFIG_KEY = 'default'

/** Current finder config, or `data: null` when none has been saved yet. */
export async function GET() {
  try {
    const config = await getSolutionFinderConfig()
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    return errorResponse('API solution-finder-config GET', error, 'Gagal mengambil konfigurasi Solution Finder.')
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran payload melebihi batas 1MB.' }, { status: 413 })
  }

  const auth = await requireCan(request, 'solution:manage')
  if (auth.error) return auth.error

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch (err) {
    console.warn('[API solution-finder-config] invalid JSON body:', err)
    rawBody = null
  }
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
  }

  const validation = validateCatalogBody(solutionFinderConfigSchema, rawBody)
  if (!validation.success) return validation.response
  const data = validation.data

  // Each list must be a JSON array; a string form is accepted only if it parses to one.
  const lists = {
    businessGoals: data.businessGoals,
    industries: data.industries,
    questions: data.questions,
    recommendationMatrix: data.recommendationMatrix,
  }
  // Omitted lists keep their saved value; null / '' clears a list.
  const values: Partial<Record<keyof typeof lists, string>> = {}
  for (const key of Object.keys(lists) as (keyof typeof lists)[]) {
    const raw = lists[key]
    if (raw === undefined) continue
    if (raw === null || raw === '') {
      values[key] = '[]'
      continue
    }
    const arr = parseJsonArray(raw)
    if (!arr) {
      return NextResponse.json(
        { success: false, error: `${key}: harus berupa daftar JSON (array).` },
        { status: 400 },
      )
    }
    values[key] = JSON.stringify(arr)
  }

  try {
    const actor = actorOf(auth.user)
    await prisma.transaction(async (tx) => {
      const existing = await tx.orm.public.SolutionFinderConfig.where({ configKey: CONFIG_KEY }).forUpdate().first()
      let row
      if (existing) {
        await tx.orm.public.SolutionFinderConfig.where({ configKey: CONFIG_KEY }).update(values)
        row = existing
      } else {
        row = await tx.orm.public.SolutionFinderConfig.create({
          configKey: CONFIG_KEY,
          businessGoals: '[]',
          industries: '[]',
          questions: '[]',
          recommendationMatrix: '[]',
          ...values,
        })
      }
      await recordCatalogHistory(tx, 'solution_finder_config', row.id, actor, existing ? 'update' : 'create', existing ?? row)
    })

    await revalidateCatalog('config')

    return NextResponse.json({ success: true, message: 'Konfigurasi Solution Finder berhasil diperbarui.' })
  } catch (error) {
    return errorResponse('API solution-finder-config POST', error, 'Gagal menyimpan konfigurasi Solution Finder.')
  }
}
