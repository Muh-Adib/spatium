import { NextResponse } from 'next/server'
import { BLOCK_CATALOG, BLOCK_CATEGORY_LABEL, blockJsonSchema } from '@/lib/blocks/catalog'

/**
 * Public block manifest, generated from the block catalogue (the single source
 * of truth). For each block: label, description, category, where it may be
 * used (`targets`), the editable `fields`, a valid `example` and the JSON
 * Schema of accepted input.
 */
export async function GET() {
  const blocks = BLOCK_CATALOG.map((entry) => ({
    type: entry.type,
    label: entry.label,
    description: entry.description,
    category: entry.category,
    categoryLabel: BLOCK_CATEGORY_LABEL[entry.category],
    targets: entry.targets,
    fields: entry.fields,
    example: entry.example,
    jsonSchema: blockJsonSchema(entry.type),
  }))

  return NextResponse.json(
    { studio: 'SPATIUM', version: '2.0.0', totalBlocks: blocks.length, blocks },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    },
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
