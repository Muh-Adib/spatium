import { NextResponse } from 'next/server'
import { UNIMASI_BLOCK_MANIFEST } from '@/blocks/registry'

/**
 * Public Block Manifest API for UNIMASI Studio.
 * Consumed by SegiaTech Core Admin Studio Page Builder & AI Agent Copilots.
 */
export async function GET() {
  return NextResponse.json(
    {
      studio: 'UNIMASI',
      version: '1.0.0',
      totalBlocks: UNIMASI_BLOCK_MANIFEST.length,
      blocks: UNIMASI_BLOCK_MANIFEST,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
