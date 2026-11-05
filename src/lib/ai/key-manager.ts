'use client'

export interface ApiKeyItem {
  id: string
  name: string
  provider: 'google' | 'openrouter'
  key: string
  isActive: boolean
  priority: number // Prioritas: 1, 2, 3...
  proxyUrl?: string // URL Relay / Proxy custom, misal: https://cloudflare-relay.adwk-project.workers.dev
  pool?: string // Nama Pool, misal: cloudflare-relay
  createdAt: string
  lastUsedAt?: string
  status?: 'valid' | 'invalid' | 'untested'
  statusCode?: number // e.g. 200, 404, 429
  statusMessage?: string // Cuplikan pesan error/status misal: '[404]: {"error":{"message":"..."}}'
  latencyMs?: number
  testedModel?: string
  // Tracking kuota & kredit resmi provider:
  quotaUsage?: number // Pengeluaran USD (OpenRouter: usage)
  quotaLimit?: number | null // Batas kredit USD (OpenRouter: limit)
  isFreeTier?: boolean // Akun free tier
  rateLimitInfo?: string // e.g. "50 req / 10s"
  assignedModels?: string[] // Model-model yang ditentukan khusus untuk key ini
}

export * from './model-capabilities'
import {
  ModelCapability,
  AiModelItem,
  detectModelCapabilities,
  DEFAULT_SELECTED_MODELS,
  normalizeGoogleModel,
} from './model-capabilities'

export type ConnectionStrategy = 'round-robin' | 'sticky' | 'priority'

export interface AiConnectionConfig {
  strategy: ConnectionStrategy
  stickyCount: number // Jumlah request sebelum rotasi (default: 1)
  googlePool?: string
  openrouterPool?: string
}

const STORAGE_KEYS_KEY = 'unimasi_ai_keys'
const STORAGE_CONN_CONFIG_KEY = 'unimasi_ai_conn_config'
const STORAGE_SELECTED_MODELS_KEY = 'unimasi_ai_selected_models'
const LEGACY_CONFIG_KEY = 'unimasi_ai_config'

/**
 * Mengambil daftar model aktif yang tersedia untuk digunakan
 */
export function getSelectedAiModels(): AiModelItem[] {
  if (typeof window === 'undefined') return DEFAULT_SELECTED_MODELS

  try {
    const raw = localStorage.getItem(STORAGE_SELECTED_MODELS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) { console.warn("[observable error]:", err) }

  // Simpan default jika belum ada
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SELECTED_MODELS_KEY, JSON.stringify(DEFAULT_SELECTED_MODELS))
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return DEFAULT_SELECTED_MODELS
}

/**
 * Menyimpan / menambahkan model ke daftar model tersedia
 */
export function saveSelectedAiModel(model: AiModelItem): AiModelItem[] {
  const current = getSelectedAiModels()
  const existsIndex = current.findIndex(
    (m) =>
      m.id === model.id ||
      (m.provider === model.provider && (m.id === model.id || m.name === model.name)) ||
      (model.provider === 'openrouter' && m.id.replace(/^openrouter\//, '') === model.id.replace(/^openrouter\//, ''))
  )

  let updated: AiModelItem[]
  if (existsIndex >= 0) {
    current[existsIndex] = { ...current[existsIndex], ...model }
    updated = [...current]
  } else {
    updated = [...current, model]
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SELECTED_MODELS_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('unimasi:ai-models-updated'))
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return updated
}

/**
 * Menyimpan / menambahkan kumpulan model sekaligus ke daftar model yang tersedia
 */
export function saveSelectedAiModelsBatch(models: AiModelItem[]): AiModelItem[] {
  const current = getSelectedAiModels()
  const list = [...current]

  for (const model of models) {
    const existsIndex = list.findIndex(
      (m) =>
        m.id === model.id ||
        (m.provider === model.provider && (m.id === model.id || m.name === model.name)) ||
        (model.provider === 'openrouter' && m.id.replace(/^openrouter\//, '') === model.id.replace(/^openrouter\//, ''))
    )

    if (existsIndex >= 0) {
      list[existsIndex] = { ...list[existsIndex], ...model }
    } else {
      list.push(model)
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SELECTED_MODELS_KEY, JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('unimasi:ai-models-updated'))
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return list
}

/**
 * Menghapus model dari daftar model yang tersedia
 */
export function removeSelectedAiModel(modelId: string, provider: 'google' | 'openrouter'): AiModelItem[] {
  const current = getSelectedAiModels()
  const cleanId = modelId.replace(/^openrouter\//, '')
  const updated = current.filter(
    (m) =>
      !(
        (m.id === modelId || m.id === cleanId || m.id === `openrouter/${cleanId}`) &&
        (!m.provider || m.provider === provider)
      )
  )

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SELECTED_MODELS_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('unimasi:ai-models-updated'))
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return updated
}

/**
 * Memperbarui status uji/ping model tertentu
 */
export function updateModelTestStatus(
  modelId: string,
  provider: 'google' | 'openrouter',
  result: {
    status: 'valid' | 'invalid'
    latencyMs?: number
    reply?: string
  }
): void {
  const current = getSelectedAiModels()
  const cleanId = modelId.replace(/^openrouter\//, '')
  const target =
    current.find((m) => m.id === modelId) ||
    current.find((m) => m.id === cleanId || m.id === `openrouter/${cleanId}`) ||
    current.find((m) => m.name === modelId)
  if (!target) return

  target.testedStatus = result.status
  target.testedLatencyMs = result.latencyMs
  target.testedReply = result.reply

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SELECTED_MODELS_KEY, JSON.stringify(current))
    } catch (err) { console.warn("[observable error]:", err) }
  }
}

export function getConnectionConfig(): AiConnectionConfig {
  if (typeof window === 'undefined') {
    return { strategy: 'priority', stickyCount: 1 }
  }

  try {
    const raw = localStorage.getItem(STORAGE_CONN_CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        strategy: parsed.strategy || 'priority',
        stickyCount: Number(parsed.stickyCount) || 1,
        googlePool: parsed.googlePool || '',
        openrouterPool: parsed.openrouterPool || '',
      }
    }
  } catch (err) { console.warn("[observable error]:", err) }

  return { strategy: 'priority', stickyCount: 1 }
}

export function saveConnectionConfig(config: Partial<AiConnectionConfig>): AiConnectionConfig {
  const current = getConnectionConfig()
  const updated: AiConnectionConfig = {
    ...current,
    ...config,
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_CONN_CONFIG_KEY, JSON.stringify(updated))
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return updated
}

export function getStoredApiKeys(): ApiKeyItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEYS_KEY)
    let keys: ApiKeyItem[] = raw ? JSON.parse(raw) : []

    // Automatic migration from legacy single-key config if empty
    if (!Array.isArray(keys) || keys.length === 0) {
      const legacyRaw = localStorage.getItem(LEGACY_CONFIG_KEY)
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw)
        const migrated: ApiKeyItem[] = []
        const now = new Date().toISOString()

        if (legacy.googleApiKey && typeof legacy.googleApiKey === 'string' && legacy.googleApiKey.trim()) {
          migrated.push({
            id: 'key_google_default',
            name: 'Production Key',
            provider: 'google',
            key: legacy.googleApiKey.trim(),
            isActive: legacy.provider === 'google',
            priority: 1,
            createdAt: now,
            status: 'untested',
          })
        }

        if (legacy.openrouterApiKey && typeof legacy.openrouterApiKey === 'string' && legacy.openrouterApiKey.trim()) {
          migrated.push({
            id: 'key_openrouter_default',
            name: 'OpenRouter Primary',
            provider: 'openrouter',
            key: legacy.openrouterApiKey.trim(),
            isActive: legacy.provider === 'openrouter' || migrated.length === 0,
            priority: 1,
            createdAt: now,
            status: 'untested',
          })
        }

        if (migrated.length > 0) {
          localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(migrated))
          return migrated
        }
      }
      return []
    }

    // Ensure priority exists on legacy items
    let needsUpdate = false
    keys = keys.map((k, idx) => {
      if (typeof k.priority !== 'number') {
        needsUpdate = true
        return { ...k, priority: idx + 1 }
      }
      return k
    })

    if (needsUpdate && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(keys))
      } catch (err) { console.warn("[observable error]:", err) }
    }

    return keys
  } catch (_) {
    return []
  }
}

export function saveApiKeyItem(data: {
  id?: string
  name: string
  provider: 'google' | 'openrouter'
  key: string
  isActive?: boolean
  priority?: number
  proxyUrl?: string
  pool?: string
  status?: 'valid' | 'invalid' | 'untested'
  statusCode?: number
  statusMessage?: string
  latencyMs?: number
  testedModel?: string
  quotaUsage?: number
  quotaLimit?: number | null
  isFreeTier?: boolean
  rateLimitInfo?: string
  assignedModels?: string[]
}): ApiKeyItem {
  const keys = getStoredApiKeys()
  const now = new Date().toISOString()
  const id = data.id || `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  // Default priority if not given
  const providerKeys = keys.filter((k) => k.provider === data.provider)
  const defaultPriority = data.priority ?? (providerKeys.length + 1)

  // If this key is set to active, deactivate others for this provider
  const shouldBeActive = data.isActive ?? (providerKeys.length === 0)

  let updatedList: ApiKeyItem[]

  const existingIndex = keys.findIndex((k) => k.id === id)
  const newItem: ApiKeyItem = {
    id,
    name: data.name.trim() || (data.provider === 'google' ? 'Google Gemini Key' : 'OpenRouter Key'),
    provider: data.provider,
    key: data.key.trim(),
    isActive: shouldBeActive,
    priority: defaultPriority,
    proxyUrl: data.proxyUrl?.trim() || undefined,
    pool: data.pool?.trim() || undefined,
    createdAt: existingIndex >= 0 ? keys[existingIndex].createdAt : now,
    lastUsedAt: existingIndex >= 0 ? keys[existingIndex].lastUsedAt : undefined,
    status: data.status || (existingIndex >= 0 ? keys[existingIndex].status : 'untested'),
    statusCode: data.statusCode ?? (existingIndex >= 0 ? keys[existingIndex].statusCode : undefined),
    statusMessage: data.statusMessage ?? (existingIndex >= 0 ? keys[existingIndex].statusMessage : undefined),
    latencyMs: data.latencyMs ?? (existingIndex >= 0 ? keys[existingIndex].latencyMs : undefined),
    testedModel: data.testedModel ?? (existingIndex >= 0 ? keys[existingIndex].testedModel : undefined),
    quotaUsage: data.quotaUsage ?? (existingIndex >= 0 ? keys[existingIndex].quotaUsage : undefined),
    quotaLimit: data.quotaLimit !== undefined ? data.quotaLimit : (existingIndex >= 0 ? keys[existingIndex].quotaLimit : undefined),
    isFreeTier: data.isFreeTier ?? (existingIndex >= 0 ? keys[existingIndex].isFreeTier : undefined),
    rateLimitInfo: data.rateLimitInfo ?? (existingIndex >= 0 ? keys[existingIndex].rateLimitInfo : undefined),
    assignedModels: data.assignedModels ?? (existingIndex >= 0 ? keys[existingIndex].assignedModels : undefined),
  }

  if (shouldBeActive) {
    keys.forEach((k) => {
      if (k.provider === data.provider) k.isActive = false
    })
  }

  if (existingIndex >= 0) {
    keys[existingIndex] = newItem
    updatedList = [...keys]
  } else {
    updatedList = [newItem, ...keys]
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(updatedList))
      syncLegacyConfig(updatedList)
    } catch (err) { console.warn("[observable error]:", err) }
  }

  return newItem
}

export function bulkImportApiKeys(input: {
  provider: 'google' | 'openrouter'
  text: string
  proxyUrl?: string
  pool?: string
  startPriority?: number
}): { added: number; errors: string[] } {
  const lines = input.text.split('\n')
  const keys = getStoredApiKeys()
  const providerKeys = keys.filter((k) => k.provider === input.provider)
  let currentPriority = input.startPriority ?? (providerKeys.length + 1)
  let addedCount = 0
  const errors: string[] = []
  const now = new Date().toISOString()
  const newItems: ApiKeyItem[] = []

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) return

    let name = ''
    let key = ''

    if (line.includes('|')) {
      const parts = line.split('|')
      name = parts[0]?.trim() || ''
      key = parts.slice(1).join('|').trim()
    } else {
      key = line
      name = `${input.provider === 'google' ? 'Gemini' : 'OpenRouter'} #${providerKeys.length + addedCount + 1}`
    }

    if (!key) {
      errors.push(`Baris ${idx + 1}: Kunci API kosong.`)
      return
    }

    // Check duplicate key
    const exists = keys.some((k) => k.provider === input.provider && k.key === key)
    if (exists) {
      errors.push(`Baris ${idx + 1}: Kunci "${name}" sudah terdaftar sebelumnya.`)
      return
    }

    const item: ApiKeyItem = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${idx}`,
      name: name || `Key #${currentPriority}`,
      provider: input.provider,
      key,
      isActive: providerKeys.length === 0 && addedCount === 0,
      priority: currentPriority++,
      proxyUrl: input.proxyUrl?.trim() || undefined,
      pool: input.pool?.trim() || undefined,
      createdAt: now,
      status: 'untested',
    }

    newItems.push(item)
    addedCount++
  })

  if (newItems.length > 0) {
    const combined = [...keys, ...newItems]
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(combined))
        syncLegacyConfig(combined)
      } catch (err) { console.warn("[observable error]:", err) }
    }
  }

  return { added: addedCount, errors }
}

export function deleteApiKeyItem(id: string): void {
  const keys = getStoredApiKeys()
  const filtered = keys.filter((k) => k.id !== id)

  // If we deleted the active key, pick the next one of the same provider
  if (keys.find((k) => k.id === id && k.isActive)) {
    const nextKey = filtered.find((k) => k.provider === keys.find((old) => old.id === id)?.provider)
    if (nextKey) nextKey.isActive = true
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(filtered))
      syncLegacyConfig(filtered)
    } catch (err) { console.warn("[observable error]:", err) }
  }
}

export function setActiveApiKey(id: string): void {
  const keys = getStoredApiKeys()
  const target = keys.find((k) => k.id === id)
  if (!target) return

  keys.forEach((k) => {
    if (k.provider === target.provider) {
      k.isActive = k.id === id
    }
  })

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(keys))
      syncLegacyConfig(keys)
    } catch (err) { console.warn("[observable error]:", err) }
  }
}

export function updateKeyTestStatus(
  id: string,
  result: {
    status: 'valid' | 'invalid'
    statusCode?: number
    statusMessage?: string
    latencyMs?: number
    testedModel?: string
    quotaUsage?: number
    quotaLimit?: number | null
    isFreeTier?: boolean
    rateLimitInfo?: string
  }
): void {
  const keys = getStoredApiKeys()
  const target = keys.find((k) => k.id === id)
  if (!target) return

  target.status = result.status
  target.statusCode = result.statusCode
  target.statusMessage = result.statusMessage
  target.latencyMs = result.latencyMs
  target.testedModel = result.testedModel
  if (result.quotaUsage !== undefined) target.quotaUsage = result.quotaUsage
  if (result.quotaLimit !== undefined) target.quotaLimit = result.quotaLimit
  if (result.isFreeTier !== undefined) target.isFreeTier = result.isFreeTier
  if (result.rateLimitInfo !== undefined) target.rateLimitInfo = result.rateLimitInfo
  target.lastUsedAt = new Date().toISOString()

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(keys))
      syncLegacyConfig(keys)
    } catch (err) { console.warn("[observable error]:", err) }
  }
}

export function getActiveApiKey(provider?: 'google' | 'openrouter'): ApiKeyItem | null {
  const keys = getStoredApiKeys()
  if (provider) {
    // Sort by priority ASC so priority 1 is preferred if multiple are eligible
    const providerKeys = keys.filter((k) => k.provider === provider).sort((a, b) => a.priority - b.priority)
    return providerKeys.find((k) => k.isActive) || providerKeys[0] || null
  }
  return keys.find((k) => k.isActive) || keys[0] || null
}

function syncLegacyConfig(keys: ApiKeyItem[]) {
  try {
    const raw = localStorage.getItem(LEGACY_CONFIG_KEY)
    const existing = raw ? JSON.parse(raw) : {}

    const activeGoogle = keys.find((k) => k.provider === 'google' && k.isActive) || keys.find((k) => k.provider === 'google')
    const activeOpenrouter = keys.find((k) => k.provider === 'openrouter' && k.isActive) || keys.find((k) => k.provider === 'openrouter')

    const updated = {
      ...existing,
      googleApiKey: activeGoogle?.key || existing.googleApiKey || '',
      openrouterApiKey: activeOpenrouter?.key || existing.openrouterApiKey || '',
      googleProxyUrl: activeGoogle?.proxyUrl || '',
      openrouterProxyUrl: activeOpenrouter?.proxyUrl || '',
    }
    localStorage.setItem(LEGACY_CONFIG_KEY, JSON.stringify(updated))

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('unimasi:ai-key-updated', {
          detail: {
            googleKey: updated.googleApiKey,
            openrouterKey: updated.openrouterApiKey,
            provider: existing.provider || (activeOpenrouter ? 'openrouter' : 'google'),
          },
        })
      )
    }
  } catch (err) { console.warn("[observable error]:", err) }
}

export function maskApiKey(key: string): string {
  if (!key) return '(Kosong)'
  const trimmed = key.trim()
  if (trimmed.length <= 8) return '••••••••'
  return `${trimmed.slice(0, 6)}••••••••${trimmed.slice(-4)}`
}

export interface StoredAiCredentials {
  provider: 'google' | 'openrouter'
  apiKey: string
  model: string
  proxyUrl?: string
  hasKey: boolean
}

export interface AiKeyPromptEventDetail {
  reason?: string
  featureName?: string
  provider?: 'google' | 'openrouter'
  onSuccess?: () => void
}

/**
 * Triggers a global prompt modal asking the user to configure their AI API key.
 * Dispatched across all components in the platform when an AI capability is invoked without a key.
 */
export function triggerAiKeyPrompt(detail?: AiKeyPromptEventDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('unimasi:open-ai-key-modal', { detail }))
  window.dispatchEvent(new CustomEvent('open-ai-key-modal', { detail }))
}

/**
 * Resolves active AI credentials from localStorage (key pool + legacy config)
 */
export function getStoredAiCredentials(preferredProvider?: 'google' | 'openrouter'): StoredAiCredentials {
  if (typeof window === 'undefined') {
    return {
      provider: preferredProvider || 'google',
      apiKey: '',
      model: '',
      hasKey: false,
    }
  }

  // 1. Read legacy / active config from localStorage
  let configProvider: 'google' | 'openrouter' = 'google'
  let googleModel = ''
  let openrouterModel = ''
  let customModel = ''

  try {
    const rawConfig = localStorage.getItem(LEGACY_CONFIG_KEY)
    if (rawConfig) {
      const parsed = JSON.parse(rawConfig)
      if (parsed.provider === 'google' || parsed.provider === 'openrouter') {
        configProvider = parsed.provider
      }
      googleModel = parsed.googleModel || parsed.model || ''
      openrouterModel = parsed.openrouterModel || ''
      customModel = parsed.customModel || ''
    }
  } catch (err) { console.warn("[observable error]:", err) }

  let provider: 'google' | 'openrouter' = preferredProvider || configProvider

  // 2. Read from keys pool
  const activeKeyObj = getActiveApiKey(provider)
  let apiKey = activeKeyObj?.key?.trim() || ''
  let proxyUrl = activeKeyObj?.proxyUrl?.trim()

  // 3. Fallback to legacy config keys if keys pool didn't have it
  if (!apiKey) {
    try {
      const rawConfig = localStorage.getItem(LEGACY_CONFIG_KEY)
      if (rawConfig) {
        const parsed = JSON.parse(rawConfig)
        if (provider === 'google' && parsed.googleApiKey) {
          apiKey = String(parsed.googleApiKey).trim()
        } else if (provider === 'openrouter' && parsed.openrouterApiKey) {
          apiKey = String(parsed.openrouterApiKey).trim()
        }
        if (!proxyUrl) {
          proxyUrl = provider === 'google' ? parsed.googleProxyUrl : parsed.openrouterProxyUrl
        }
      }
    } catch (err) { console.warn("[observable error]:", err) }
  }

  // 4. If selected provider has no key, check alternative provider
  if (!apiKey) {
    const altProvider = provider === 'google' ? 'openrouter' : 'google'
    const altKeyObj = getActiveApiKey(altProvider)
    let altKey = altKeyObj?.key?.trim() || ''
    if (!altKey) {
      try {
        const rawConfig = localStorage.getItem(LEGACY_CONFIG_KEY)
        if (rawConfig) {
          const parsed = JSON.parse(rawConfig)
          altKey = String(altProvider === 'google' ? parsed.googleApiKey : parsed.openrouterApiKey || '').trim()
        }
      } catch (err) { console.warn("[observable error]:", err) }
    }
    if (altKey) {
      provider = altProvider
      apiKey = altKey
      proxyUrl = altKeyObj?.proxyUrl?.trim()
    }
  }

  // 5. Resolve active model
  let model = ''
  if (provider === 'google') {
    model = googleModel.trim() || 'gemini-2.5-flash'
  } else {
    model = customModel.trim() || openrouterModel.trim() || 'google/gemini-2.0-flash-exp:free'
  }

  return {
    provider,
    apiKey,
    model,
    proxyUrl: proxyUrl || undefined,
    hasKey: Boolean(apiKey),
  }
}

/**
 * Checks whether an active API key exists in storage.
 */
export function hasActiveAiKey(provider?: 'google' | 'openrouter'): boolean {
  return getStoredAiCredentials(provider).hasKey
}

