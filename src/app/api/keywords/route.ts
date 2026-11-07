import { NextRequest, NextResponse } from 'next/server'
import {
  getKeywordOpportunities,
  detectSearchCannibalization,
  getKeywordBank,
  addKeywordToBank,
  getKeywordMap,
} from '@/lib/db/keywords'
import { getVerifiedKeywordDataset } from '@/lib/gsc/keyword-data'
import { createKeywordSchema, validateBody } from '@/lib/validation/api-schemas'
import { Locale } from '@/lib/seo/schema'
import { requireUser } from '@/lib/auth/rbac'
import { requireCan } from '@/lib/auth/capabilities'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const localeInput = searchParams.get('locale') || 'id'
    if (!['id', 'en'].includes(localeInput)) return NextResponse.json({ error: 'Bahasa keyword tidak valid.' }, { status: 400 })
    const locale = localeInput as Locale

    if (action === 'opportunities' || action === 'cannibalization') {
      const source = await getVerifiedKeywordDataset()
      if (!source.connected) return NextResponse.json({ data: [], integration: source, errors: [], warnings: [] })
      const data = action === 'opportunities' ? await getKeywordOpportunities(locale, source.data.rows) : await detectSearchCannibalization(source.data.rows)
      const { rows, ...provenance } = source.data

      // Lean bandwidth optimization: return top 100 items by default (configurable up to 500)
      const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)
      const slicedData = Array.isArray(data) ? data.slice(0, limit) : data

      const res = NextResponse.json({
        data: slicedData,
        integration: { connected: true, ...provenance },
        errors: [],
        warnings: source.data.truncated ? ['Dataset mencapai batas respons API; analisis belum mencakup seluruh kueri.'] : [],
      })
      res.headers.set('Cache-Control', 'private, max-age=1800, stale-while-revalidate=86400')
      return res
    }

    if (action === 'map') {
      const mapResult = await getKeywordMap(locale)
      return NextResponse.json({
        data: mapResult,
        errors: [],
        warnings: mapResult.conflictWarnings,
      })
    }

    // Default: Keyword Bank
    const bank = await getKeywordBank(locale)
    return NextResponse.json({
      data: bank,
      errors: [],
      warnings: [],
    })
  } catch (err) {
    console.error('[keywords] Keyword operation failed', err)
    return NextResponse.json(
      { data: null, errors: ['Gagal memuat data kata kunci.'] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'seo:manage')
  if (auth.error) return auth.error

  try {
    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ data: null, errors: ['Body JSON wajib diisi.'] }, { status: 400 })
    }
    const { action = 'add', ...data } = body as Record<string, unknown>

    if (action === 'sync') return NextResponse.json({ error: 'Metrik dari browser tidak dapat dianggap data GSC. Gunakan sinkronisasi resmi pada /api/gsc.' }, { status: 400 })

    const validation = validateBody(createKeywordSchema, data)
    if (!validation.success) return validation.response
    const created = await addKeywordToBank({ keyword: validation.data.keyword, locale: validation.data.locale, intent: validation.data.intent, priorityScore: validation.data.priorityScore })
    return NextResponse.json({
      data: created,
      message: `Kata kunci "${created.keyword}" berhasil disimpan ke Keyword Bank.`,
      errors: [],
      warnings: [],
    })
  } catch (err) {
    console.error('[keywords] Keyword operation failed', err)
    return NextResponse.json(
      { data: null, errors: ['Gagal memproses kata kunci.'] },
      { status: 500 }
    )
  }
}
