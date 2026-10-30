/**
 * Dynamic Block Manifest Synchronizer (Server-Driven UI)
 *
 * Connects the Core Backend to satellite frontends (UNIMASI, ERFO, Segia Web):
 * 1. Fetches the block manifest from frontend: GET ${frontendUrl}/api/blocks/manifest
 * 2. Ingests all block contracts, props, animation presets, and sizing variants
 * 3. Registers them dynamically into the Block Ontology for the Studio Page Builder and AI Agent Copilot
 */

import { blockOntology, BlockDefinition } from './ontology'

export interface RemoteBlockManifest {
  studio?: string
  agency?: string
  version: string
  totalBlocks: number
  blocks: Array<{
    type: string
    name: string
    category: string
    description: string
    dataSchema: Record<string, { type: string; required?: boolean; description?: string }>
    settingsSchema: Record<string, any>
    samplePayload?: Record<string, any>
  }>
}

/**
 * Ingests a remote frontend block manifest into the Core Backend's Block Registry.
 */
export function ingestRemoteBlockManifest(manifest: RemoteBlockManifest): {
  registeredCount: number
  types: string[]
} {
  if (!manifest || !Array.isArray(manifest.blocks)) {
    return { registeredCount: 0, types: [] }
  }

  const registeredTypes: string[] = []

  for (const block of manifest.blocks) {
    const inputs = Object.entries(block.dataSchema || {}).map(([key, field]) => ({
      name: key,
      type: (field.type as any) || 'string',
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      description: field.description || `Parameter ${key}`,
      required: !!field.required,
      effectOnRender: `Mempengaruhi visual blok ${block.name}`,
    }))

    // Add settings inputs if present
    if (block.settingsSchema) {
      Object.entries(block.settingsSchema).forEach(([settingKey, values]) => {
        if (Array.isArray(values)) {
          inputs.push({
            name: `settings.${settingKey}`,
            type: 'enum',
            label: settingKey.charAt(0).toUpperCase() + settingKey.slice(1),
            description: `Pilihan ${settingKey} untuk blok ${block.name}`,
            required: false,
            allowedValues: values.map(String),
            effectOnRender: `Mengatur styling visual dan animasi (${settingKey})`,
          })
        }
      })
    }

    const definition: BlockDefinition = {
      type: block.type,
      label: block.name,
      category: (block.category as any) || 'editorial',
      purpose: block.description || `Dynamic block ${block.name} dari frontend`,
      idealHierarchyIndex:
        block.category === 'hero'
          ? 10
          : block.category === 'framework' || block.category === 'narrative'
          ? 30
          : block.category === 'stats'
          ? 60
          : block.category === 'cta'
          ? 80
          : 40,
      supportedPageKinds: ['all'],
      inputs,
      examplePayload: block.samplePayload || {
        type: block.type,
        data: {},
        settings: {},
      },
      generateDefault: () => block.samplePayload || { type: block.type, data: {}, settings: {} },
    }

    blockOntology.register(definition)
    registeredTypes.push(block.type)
  }

  return {
    registeredCount: registeredTypes.length,
    types: registeredTypes,
  }
}

/**
 * Fetches and syncs the block manifest from a running satellite frontend.
 */
export async function syncFrontendBlockManifest(frontendBaseUrl: string): Promise<{
  success: boolean
  registeredCount: number
  types: string[]
  error?: string
}> {
  const manifestUrl = `${frontendBaseUrl.replace(/\/$/, '')}/api/blocks/manifest`

  try {
    const res = await fetch(manifestUrl, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return {
        success: false,
        registeredCount: 0,
        types: [],
        error: `HTTP ${res.status}: ${res.statusText}`,
      }
    }

    const manifest: RemoteBlockManifest = await res.json()
    const result = ingestRemoteBlockManifest(manifest)

    return {
      success: true,
      registeredCount: result.registeredCount,
      types: result.types,
    }
  } catch (error: any) {
    return {
      success: false,
      registeredCount: 0,
      types: [],
      error: error.message || 'Network fetch failed',
    }
  }
}
