import { NextResponse } from 'next/server'
import { getLocations } from '@/lib/db/locations'
import { errorResponse } from '@/lib/http/errors'

export async function GET() {
  try {
    const data = await getLocations()
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err) {
    return errorResponse('locations', err, 'Lokasi tidak dapat dimuat.')
  }
}
