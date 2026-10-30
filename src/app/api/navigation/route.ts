import { NextResponse } from 'next/server'
import { getNavigationEntries, getFooterNavEntries } from '@/lib/navigation/getNav'

export async function GET() {
  try {
    const [header, footer] = await Promise.all([
      getNavigationEntries(),
      getFooterNavEntries(),
    ])
    return NextResponse.json({ success: true, data: header, footer })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

