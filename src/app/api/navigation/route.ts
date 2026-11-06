import { NextResponse } from 'next/server'
import { getNavigationEntries, getFooterNavEntries } from '@/lib/navigation/getNav'
import { errorResponse } from '@/lib/http/errors'

export async function GET() {
  try {
    const [header, footer] = await Promise.all([
      getNavigationEntries(),
      getFooterNavEntries(),
    ])
    return NextResponse.json({ success: true, data: header, footer })
  } catch (err) {
    return errorResponse('navigation', err, 'Navigasi tidak dapat dimuat.')
  }
}
