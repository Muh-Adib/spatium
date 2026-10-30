import { NextResponse } from 'next/server'
import { getLocations } from '@/lib/db/locations'

export async function GET() {
  try {
    const data = await getLocations()
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
