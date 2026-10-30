import { NextResponse } from 'next/server'

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-site-key',
  }
}

export function jsonResponse(
  data: any,
  status = 200,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders(),
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      ...extraHeaders,
    },
  })
}

export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
