import { NextRequest, NextResponse } from 'next/server'
import { syncFrontendBlockManifest, ingestRemoteBlockManifest } from '@/lib/blocks/manifestSync'
import { blockOntology } from '@/lib/blocks/ontology'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'

/**
 * GET: Lists all blocks known to Core, or syncs from query ?url=...
 * Protected by x-site-key header.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateDeliveryRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  const targetUrl = req.nextUrl.searchParams.get('url')

  if (targetUrl) {
    const syncRes = await syncFrontendBlockManifest(targetUrl)
    return NextResponse.json({
      action: 'sync',
      targetUrl,
      ...syncRes,
    })
  }

  const allBlocks = blockOntology.list()
  return NextResponse.json({
    totalBlocks: allBlocks.length,
    blocks: allBlocks.map((b) => ({
      type: b.type,
      label: b.label,
      category: b.category,
      purpose: b.purpose,
      inputs: b.inputs,
      examplePayload: b.examplePayload,
    })),
  })
}

/**
 * POST: Directly ingest block manifest payload or trigger sync by URL
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateDeliveryRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  try {
    const body = await req.json()

    if (body.url) {
      const syncRes = await syncFrontendBlockManifest(body.url)
      return NextResponse.json(syncRes)
    }

    if (body.blocks && Array.isArray(body.blocks)) {
      const result = ingestRemoteBlockManifest(body)
      return NextResponse.json({
        success: true,
        ...result,
      })
    }

    return NextResponse.json(
      { error: 'Invalid payload. Provide { url: string } or { blocks: BlockManifestEntry[] }' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process block sync', details: error.message },
      { status: 500 }
    )
  }
}
