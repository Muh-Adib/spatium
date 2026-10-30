'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Sliders,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Database,
  Search,
  ShieldCheck,
  PenSquare,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  Check,
  Copy,
  X,
  Key,
  Plus,
  Trash2,
  History,
  Download,
  FileText,
  Layers,
  Activity,
  Server,
  Radio,
  Shield,
  Terminal,
  Code2,
  Gauge,
  CornerDownRight,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Network,
  Share2,
  FlaskConical,
  Settings,
  Brain,
} from 'lucide-react'
import { ToolDefinition, ToolParameter, SEGIA_TOOLS_CATALOG, ToolCallExecution } from '@/lib/ai/tool-definitions'
import {
  ApiKeyItem,
  getStoredApiKeys,
  saveApiKeyItem,
  deleteApiKeyItem,
  setActiveApiKey,
  getActiveApiKey,
  updateKeyTestStatus,
  maskApiKey,
  getConnectionConfig,
  saveConnectionConfig,
  bulkImportApiKeys,
  ConnectionStrategy,
  AiConnectionConfig,
  AiModelItem,
  getSelectedAiModels,
  saveSelectedAiModel,
  saveSelectedAiModelsBatch,
  removeSelectedAiModel,
  updateModelTestStatus,
  detectModelCapabilities,
  DEFAULT_SELECTED_MODELS,
} from '@/lib/ai/key-manager'

export function GoogleGeminiLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
        fill="url(#gemini_spark_grad_settings)"
      />
      <defs>
        <linearGradient id="gemini_spark_grad_settings" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="0.5" stopColor="#818CF8" />
          <stop offset="1" stopColor="#C084FC" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function OpenRouterLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5L3.5 7.5V16.5L12 21.5L20.5 16.5V7.5L12 2.5Z"
        stroke="#A855F7"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 21.5V12M12 12L3.5 7.5M12 12L20.5 7.5"
        stroke="#C084FC"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="#E879F9" />
    </svg>
  )
}
import {
  TokenOptimizationConfig,
  DEFAULT_TOKEN_OPTIMIZATION_CONFIG,
  getTokenOptimizationConfig,
  saveTokenOptimizationConfig,
} from '@/lib/ai/token-optimizer'
import {
  AiPromptLog,
  getAiPromptLogs,
  clearAiPromptLogs,
  exportLogsAsJson,
  exportLogsAsCsv,
} from '@/lib/ai/audit-logger'
import { Tooltip } from '@/components/ui/Tooltip'
import { IconButton, Panel, StatusPill, Segmented, SearchField, fieldCls } from '@/components/admin/AdminUi'
import { useAuth } from '@/lib/auth/AuthContext'
import { RECOMMENDED_FREE_HIGH_CONTEXT_MODELS } from '@/app/api/ai/models/route'

export const SUGGESTED_FREE_MODELS = [
  'inkling-small:free',
  'inkling:free',
  'lyria-3-pro-preview',
  'lyria-3-clip-preview',
  'nemotron-3.5-super-vl:free',
  'dots-3-note-preview:free',
  'flint-v1.0:free',
  'xing4.0-29b-a4b:free',
  'laguna-s-2.1:free',
  'gemma-4-26b-a4b-it:free',
  'gemma-4-31b-it:free',
  'nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'free',
]

interface StudioAiSettingsProps {
  onSaved?: () => void
}

export function StudioAiSettings({ onSaved }: StudioAiSettingsProps) {
  const { getAuthHeaders } = useAuth()

  // --- Sub-Tab Navigation (Clean Unified Tabs) ---
  const [activeTab, setActiveTab] = useState<'providers' | 'token' | 'memory' | 'tools' | 'logs'>('providers')

  // --- Memory State (ChatGPT / Gemini Persistent Memory) ---
  const [memories, setMemories] = useState<any[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(false)
  const [newMemoryKey, setNewMemoryKey] = useState('')
  const [newMemoryContent, setNewMemoryContent] = useState('')

  const fetchMemories = async () => {
    setMemoriesLoading(true)
    try {
      const res = await fetch('/api/ai/memory')
      const data = await res.json()
      if (data.success && Array.isArray(data.memories)) {
        setMemories(data.memories)
      }
    } catch (_) {
    } finally {
      setMemoriesLoading(false)
    }
  }

  const handleSaveMemory = async () => {
    if (!newMemoryKey.trim() || !newMemoryContent.trim()) return
    try {
      const res = await fetch('/api/ai/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newMemoryKey.trim(), content: newMemoryContent.trim() }),
      })
      const data = await res.json()
      if (data.success && data.memory) {
        setMemories((prev) => [data.memory, ...prev.filter((m) => m.key !== data.memory.key)])
        setNewMemoryKey('')
        setNewMemoryContent('')
      }
    } catch (_) {}
  }

  const handleDeleteMemory = async (idOrKey: string) => {
    try {
      const res = await fetch(`/api/ai/memory?id=${encodeURIComponent(idOrKey)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== idOrKey && m.key !== idOrKey))
      }
    } catch (_) {}
  }

  // --- Provider Selector & Interactive Provider Modal State ---
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'openrouter'>('google')
  const [providerModalOpen, setProviderModalOpen] = useState<'google' | 'openrouter' | null>(null)

  // --- Selected Models Available for Studio & Chat ---
  const [selectedAiModels, setSelectedAiModels] = useState<AiModelItem[]>([])
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [autocompleteOpen, setAutocompleteOpen] = useState(false)
  const [modelTestStatus, setModelTestStatus] = useState<Record<string, { success: boolean; latencyMs?: number; reply?: string }>>({})
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddInput, setQuickAddInput] = useState('')

  // --- Connection & Multi-Key State ---
  const [connConfig, setConnConfig] = useState<AiConnectionConfig>({ strategy: 'priority', stickyCount: 1 })
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([])

  // --- Single Key Modal State ---
  const [addKeyModalOpen, setAddKeyModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [newKeyPriority, setNewKeyPriority] = useState(1)
  const [newKeyProxyUrl, setNewKeyProxyUrl] = useState('')
  const [newKeyPool, setNewKeyPool] = useState('')
  const [newKeyShow, setNewKeyShow] = useState(false)
  const [newKeySetActive, setNewKeySetActive] = useState(true)
  const [newKeyError, setNewKeyError] = useState('')

  // --- Bulk Key Modal State ---
  const [bulkAddModalOpen, setBulkAddModalOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkProxyUrl, setBulkProxyUrl] = useState('')
  const [bulkPool, setBulkPool] = useState('cloudflare-relay')
  const [bulkNotice, setBulkNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // --- Key Testing State ---
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null)
  const [testingAllKeys, setTestingAllKeys] = useState(false)
  const [testResult, setTestResult] = useState<{
    keyId?: string
    success?: boolean
    message?: string
    error?: string
  } | null>(null)

  // --- Dynamic Model Catalog State per Provider ---
  const [fetchedGoogleModels, setFetchedGoogleModels] = useState<any[]>([])
  const [fetchedOpenrouterModels, setFetchedOpenrouterModels] = useState<any[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchNotice, setFetchNotice] = useState<string | null>(null)
  const [modelSearch, setModelSearch] = useState('')
  const [modelFilter, setModelFilter] = useState<'all' | 'free' | '200k' | 'thinking'>('all')
  const [testingModelId, setTestingModelId] = useState<string | null>(null)
  const [modelPingResult, setModelPingResult] = useState<{ id: string; success: boolean; latencyMs?: number; reply?: string } | null>(null)
  const [activeModel, setActiveModel] = useState('')

  // --- Hyperparameters per Provider ---
  const [temperature, setTemperature] = useState(0.4)
  const [topP, setTopP] = useState(0.9)
  const [maxOutputTokens, setMaxOutputTokens] = useState(2500)
  const [thinkingMode, setThinkingMode] = useState<'auto' | 'off' | 'on'>('auto')

  // --- Token Optimization State (RTK, Caveman, Ponytail, Headroom) ---
  const [tokenOpt, setTokenOpt] = useState<TokenOptimizationConfig>(DEFAULT_TOKEN_OPTIMIZATION_CONFIG)

  // --- Native Tools Catalog State ---
  const [enabledTools, setEnabledTools] = useState<string[]>(SEGIA_TOOLS_CATALOG.map((t) => t.id))
  const [toolsCollapsed, setToolsCollapsed] = useState(false)
  const [searchTool, setSearchTool] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'database' | 'seo' | 'serp' | 'editorial' | 'system'>('all')
  const [selectedParamTool, setSelectedParamTool] = useState<ToolDefinition | null>(null)
  const [testingToolId, setTestingToolId] = useState<string | null>(null)
  const [toolExecutionResult, setToolExecutionResult] = useState<ToolCallExecution | null>(null)

  // --- Audit Logs State ---
  const [promptLogs, setPromptLogs] = useState<AiPromptLog[]>([])
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'success' | 'error'>('all')
  const [searchLogQuery, setSearchLogQuery] = useState('')
  const [inspectingLog, setInspectingLog] = useState<AiPromptLog | null>(null)

  // Save Feedback
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Reload local state
  const reloadData = () => {
    setApiKeys(getStoredApiKeys())
    setConnConfig(getConnectionConfig())
    setTokenOpt(getTokenOptimizationConfig())
    setPromptLogs(getAiPromptLogs())
    setSelectedAiModels(getSelectedAiModels())
    fetchMemories()
  }

  useEffect(() => {
    reloadData()

    try {
      const raw = localStorage.getItem('segiatech_ai_config')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.provider) setSelectedProvider(parsed.provider)
        const prov = parsed.provider || 'google'
        const savedModel = prov === 'google' ? (parsed.googleModel || parsed.model || '') : (parsed.openrouterModel || parsed.model || '')
        setActiveModel(savedModel)
        if (typeof parsed.temperature === 'number') setTemperature(parsed.temperature)
        if (typeof parsed.topP === 'number') setTopP(parsed.topP)
        if (typeof parsed.maxOutputTokens === 'number') setMaxOutputTokens(parsed.maxOutputTokens)
        if (parsed.thinkingMode) setThinkingMode(parsed.thinkingMode)
        if (Array.isArray(parsed.enabledTools)) setEnabledTools(parsed.enabledTools)
        if (typeof parsed.toolsCollapsed === 'boolean') setToolsCollapsed(parsed.toolsCollapsed)
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('segiatech_ai_config')
      if (raw) {
        const parsed = JSON.parse(raw)
        const savedModel = selectedProvider === 'google' ? (parsed.googleModel || '') : (parsed.openrouterModel || '')
        if (savedModel) setActiveModel(savedModel)
      }
    } catch (_) {}
  }, [selectedProvider])

  // Provider Keys
  const currentProviderKeys = useMemo(() => {
    return apiKeys
      .filter((k) => k.provider === selectedProvider)
      .sort((a, b) => a.priority - b.priority)
  }, [apiKeys, selectedProvider])

  // Save Configuration
  const handleSave = () => {
    try {
      const activeKey = apiKeys.find((k) => k.provider === selectedProvider && k.isActive) || apiKeys.find((k) => k.provider === selectedProvider)
      const activeGoogle = apiKeys.find((k) => k.provider === 'google' && k.isActive) || apiKeys.find((k) => k.provider === 'google')
      const activeOpenrouter = apiKeys.find((k) => k.provider === 'openrouter' && k.isActive) || apiKeys.find((k) => k.provider === 'openrouter')

      const rawExisting = localStorage.getItem('segiatech_ai_config')
      const existing = rawExisting ? JSON.parse(rawExisting) : {}

      const config = {
        ...existing,
        provider: selectedProvider,
        model: activeModel,
        googleModel: selectedProvider === 'google' ? activeModel : (existing.googleModel || 'gemini-2.5-flash'),
        openrouterModel: selectedProvider === 'openrouter' ? activeModel : (existing.openrouterModel || 'google/gemini-2.0-flash-exp:free'),
        googleApiKey: activeGoogle?.key || existing.googleApiKey || '',
        openrouterApiKey: activeOpenrouter?.key || existing.openrouterApiKey || '',
        temperature,
        topP,
        maxOutputTokens,
        thinkingMode,
        proxyUrl: activeKey?.proxyUrl,
        enabledTools,
        toolsCollapsed,
      }
      localStorage.setItem('segiatech_ai_config', JSON.stringify(config))

      saveConnectionConfig(connConfig)
      saveTokenOptimizationConfig(tokenOpt)

      window.dispatchEvent(
        new CustomEvent('segiatech:ai-key-updated', {
          detail: {
            provider: selectedProvider,
            apiKey: activeKey?.key || (selectedProvider === 'google' ? config.googleApiKey : config.openrouterApiKey),
            model: activeModel,
            googleKey: config.googleApiKey,
            openrouterKey: config.openrouterApiKey,
          },
        })
      )

      setSaveSuccess(true)
      if (onSaved) onSaved()
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (_) {}
  }

  const handleSelectActiveModel = (modelId: string) => {
    setActiveModel(modelId)
    try {
      const raw = localStorage.getItem('segiatech_ai_config')
      const parsed = raw ? JSON.parse(raw) : {}
      const updated = {
        ...parsed,
        model: modelId,
        ...(selectedProvider === 'google' ? { googleModel: modelId } : { openrouterModel: modelId }),
      }
      localStorage.setItem('segiatech_ai_config', JSON.stringify(updated))
    } catch (_) {}
  }

  // Handle Fetch Dynamic Models from Provider (Secara Otomatis Sinkron ke Daftar Model Aktif)
  const handleFetchModels = async (providerTarget?: 'google' | 'openrouter') => {
    const prov = providerTarget || providerModalOpen || selectedProvider
    const provKeys = apiKeys.filter((k) => k.provider === prov)
    const activeKey = provKeys.find((k) => k.isActive) || provKeys[0]

    setFetchingModels(true)
    setFetchNotice(null)

    if (!activeKey?.key) {
      const errMsg = `Kunci API untuk ${prov === 'google' ? 'Google AI Studio' : 'OpenRouter'} belum diisi. Masukkan kunci API terlebih dahulu.`
      setFetchNotice(errMsg)
      setModelPingResult({
        id: prov === 'google' ? 'Google AI Studio' : 'OpenRouter',
        success: false,
        reply: errMsg,
      })
      setFetchingModels(false)
      return
    }

    try {
      const authHeaders = getAuthHeaders()
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          provider: prov,
          apiKey: activeKey.key,
          proxyUrl: activeKey.proxyUrl,
        }),
      })

      const data = await res.json()
      if (data.success && Array.isArray(data.models)) {
        if (prov === 'google') {
          setFetchedGoogleModels(data.models)
        } else {
          setFetchedOpenrouterModels(data.models)
        }

        // Siapkan model-model baru untuk disinkronkan ke daftar model aktif
        const currentStored = getSelectedAiModels()
        const modelsToAdd: AiModelItem[] = []

        // Untuk Google: ambil model-model kandidat
        // Untuk OpenRouter: ambil model free & teratas
        const candidates = prov === 'google' ? data.models : data.models.slice(0, 15)

        for (const m of candidates) {
          const rawId = m.id || ''
          const canonicalId =
            prov === 'openrouter' && !rawId.startsWith('openrouter/')
              ? `openrouter/${rawId}`
              : rawId.replace(/^models\//, '')

          const alreadyExists = currentStored.some(
            (x) =>
              x.id === canonicalId ||
              x.id === rawId ||
              (prov === 'openrouter' && x.id.replace(/^openrouter\//, '') === rawId.replace(/^openrouter\//, ''))
          )

          if (!alreadyExists) {
            const caps = m.capabilities || detectModelCapabilities(canonicalId, m)
            modelsToAdd.push({
              id: canonicalId,
              name: m.name || rawId,
              provider: prov,
              isFree: Boolean(m.isFree),
              hasThinking: caps.includes('thinking'),
              hasVision: caps.includes('vision'),
              capabilities: caps,
              contextLength: m.contextLength || m.inputTokenLimit || 200000,
              description: m.description,
            })
          }
        }

        let updatedList = currentStored
        if (modelsToAdd.length > 0) {
          updatedList = saveSelectedAiModelsBatch(modelsToAdd)
        }
        setSelectedAiModels(updatedList)
        reloadData()

        const successNotice = `Berhasil mengambil ${data.models.length} model resmi dari ${prov === 'google' ? 'Google AI Studio' : 'OpenRouter'}${modelsToAdd.length > 0 ? ` dan menambahkan ${modelsToAdd.length} model baru ke daftar aktif!` : ' (semua model kandidat sudah ada di daftar aktif).'}`
        setFetchNotice(successNotice)

        setModelPingResult({
          id: `${data.models.length} Model (${prov === 'google' ? 'Google' : 'OpenRouter'})`,
          success: true,
          reply: successNotice,
        })
      } else {
        const errorMsg = data.error || 'Gagal memuat model. Periksa kunci API atau koneksi relay.'
        setFetchNotice(errorMsg)
        setModelPingResult({
          id: prov === 'google' ? 'Google AI Studio' : 'OpenRouter',
          success: false,
          reply: errorMsg,
        })
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Gagal terhubung ke endpoint model.'
      setFetchNotice(errorMsg)
      setModelPingResult({
        id: prov === 'google' ? 'Google AI Studio' : 'OpenRouter',
        success: false,
        reply: errorMsg,
      })
    } finally {
      setFetchingModels(false)
      setTimeout(() => setFetchNotice(null), 8000)
    }
  }

  // Handle Testing a Key (Menggunakan Endpoint Resmi Provider: OpenRouter auth/key & Google models list)
  const handleTestKey = async (keyItem: ApiKeyItem) => {
    setTestingKeyId(keyItem.id)
    setTestResult(null)

    try {
      const authHeaders = getAuthHeaders()
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          provider: keyItem.provider,
          apiKey: keyItem.key,
          testType: 'auth',
          proxyUrl: keyItem.proxyUrl,
          pool: keyItem.pool,
        }),
      })

      const data = await res.json()
      if (data.success) {
        updateKeyTestStatus(keyItem.id, {
          status: 'valid',
          statusCode: data.statusCode || 200,
          statusMessage: data.statusMessage || `[200 OK]: Terhubung sukses (${data.latencyMs}ms)`,
          latencyMs: data.latencyMs,
          quotaUsage: data.quotaUsage,
          quotaLimit: data.quotaLimit,
          isFreeTier: data.isFreeTier,
          rateLimitInfo: data.rateLimitInfo,
        })
        setTestResult({
          keyId: keyItem.id,
          success: true,
          message: data.message || `Terhubung sukses (${data.latencyMs}ms)`,
        })
      } else {
        updateKeyTestStatus(keyItem.id, {
          status: 'invalid',
          statusCode: data.statusCode || 400,
          statusMessage: data.statusMessage || `[${data.statusCode || 400}]: ${data.error || 'Error'}`,
          latencyMs: data.latencyMs,
        })
        setTestResult({
          keyId: keyItem.id,
          success: false,
          error: data.error || 'Gagal melakukan otentikasi kunci.',
        })
      }
      reloadData()
    } catch (err: any) {
      updateKeyTestStatus(keyItem.id, {
        status: 'invalid',
        statusCode: 500,
        statusMessage: `[500]: ${err.message || 'Network timeout'}`,
      })
      setTestResult({
        keyId: keyItem.id,
        success: false,
        error: err.message || 'Gagal terhubung ke server pengujian.',
      })
      reloadData()
    } finally {
      setTestingKeyId(null)
    }
  }

  // Handle Testing All Keys for Current Provider
  const handleTestAllKeys = async (providerTarget = selectedProvider) => {
    setTestingAllKeys(true)
    const targetKeys = apiKeys.filter((k) => k.provider === providerTarget)
    for (const key of targetKeys) {
      await handleTestKey(key)
    }
    setTestingAllKeys(false)
  }

  // Handle Quick Model Ping (Inference test per model)
  const handleTestModelPing = async (modelId: string, providerTarget?: 'google' | 'openrouter', specificKeyId?: string) => {
    const prov: 'google' | 'openrouter' =
      modelId.startsWith('openrouter/') || providerTarget === 'openrouter'
        ? 'openrouter'
        : modelId.startsWith('gemini') || modelId.includes('gemini') || providerTarget === 'google'
        ? 'google'
        : ((providerModalOpen || selectedProvider || 'google') as 'google' | 'openrouter')

    setTestingModelId(modelId)
    setModelPingResult(null)

    // Cari key yang digunakan: specific key atau active key provider
    let keyItem: ApiKeyItem | undefined
    if (specificKeyId) {
      keyItem = apiKeys.find((k) => k.id === specificKeyId && k.provider === prov)
    }
    if (!keyItem) {
      keyItem = apiKeys.find((k) => k.provider === prov && k.isActive) || apiKeys.find((k) => k.provider === prov)
    }

    if (!keyItem?.key) {
      const errReply = `Kunci API belum disetel untuk penyedia ${prov === 'google' ? 'Google AI Studio' : 'OpenRouter'}. Klik kartu penyedia di atas untuk memasukkan kunci.`
      setModelPingResult({ id: modelId, success: false, reply: errReply })
      updateModelTestStatus(modelId, prov, { status: 'invalid', reply: errReply })
      setTestingModelId(null)
      reloadData()
      return
    }

    try {
      const authHeaders = getAuthHeaders()
      const cleanModelToSend = prov === 'openrouter' ? modelId.replace(/^openrouter\//, '') : modelId
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          provider: prov,
          apiKey: keyItem.key,
          model: cleanModelToSend,
          testType: 'inference',
          proxyUrl: keyItem.proxyUrl,
        }),
      })

      const data = await res.json()
      const isSuccess = Boolean(data.success)
      const replyMsg = isSuccess
        ? (data.message || `[200 OK]: Respon diterima dalam ${data.latencyMs}ms ("${data.reply || 'Koneksi Berhasil'}")`)
        : (data.error || data.statusMessage || 'Uji inferensi model gagal.')

      setModelPingResult({
        id: modelId,
        success: isSuccess,
        latencyMs: data.latencyMs,
        reply: replyMsg,
      })

      updateModelTestStatus(modelId, prov, {
        status: isSuccess ? 'valid' : 'invalid',
        latencyMs: data.latencyMs,
        reply: replyMsg,
      })
      reloadData()
    } catch (err: any) {
      const errMsg = err.message || 'Koneksi gagal menghubungi server pengujian.'
      setModelPingResult({
        id: modelId,
        success: false,
        reply: errMsg,
      })
      updateModelTestStatus(modelId, prov, {
        status: 'invalid',
        reply: errMsg,
      })
      reloadData()
    } finally {
      setTestingModelId(null)
    }
  }

  // Quick helper to copy model ID
  const handleCopyModelId = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id)
      setCopiedModelId(id)
      setTimeout(() => setCopiedModelId(null), 2000)
    }
  }

  // Quick helper to add model from dashed box
  const handleQuickAddModel = () => {
    const trimmed = quickAddInput.trim()
    if (!trimmed) return
    const isGoogle = trimmed.startsWith('gemini') || trimmed.includes('models/gemini')
    const provider: 'google' | 'openrouter' = isGoogle ? 'google' : 'openrouter'
    const fullId = provider === 'openrouter' && !trimmed.startsWith('openrouter/') ? `openrouter/${trimmed}` : trimmed
    const isFree = trimmed.includes(':free') || trimmed === 'free'
    const caps = detectModelCapabilities(trimmed)
    const newModel: AiModelItem = {
      id: fullId,
      name: trimmed,
      provider,
      isFree,
      hasThinking: caps.includes('thinking'),
      hasVision: caps.includes('vision'),
      capabilities: caps,
      contextLength: 200000,
    }
    const updated = saveSelectedAiModel(newModel)
    setSelectedAiModels(updated)
    reloadData()
    setQuickAddInput('')
    setQuickAddOpen(false)
    setModelPingResult({
      id: fullId,
      success: true,
      reply: `Model "${trimmed}" berhasil ditambahkan ke daftar model aktif!`,
    })
  }

  // Quick helper to add suggested free model chip
  const handleAddSuggestedChip = (chipId: string) => {
    const isGoogle = chipId.startsWith('gemini') || chipId.includes('google')
    const prov: 'google' | 'openrouter' = isGoogle ? 'google' : 'openrouter'
    const fullId = prov === 'openrouter' && !chipId.startsWith('openrouter/') ? `openrouter/${chipId}` : chipId

    const currentStored = getSelectedAiModels()
    const alreadyExists = currentStored.some(
      (m) =>
        m.id === chipId ||
        m.id === fullId ||
        (prov === 'openrouter' && m.id.replace(/^openrouter\//, '') === chipId)
    )

    if (alreadyExists) {
      setModelPingResult({
        id: fullId,
        success: true,
        reply: `Model "${chipId}" sudah ada di daftar model aktif Anda.`,
      })
      return
    }

    const caps = detectModelCapabilities(chipId)
    const newModel: AiModelItem = {
      id: fullId,
      name: chipId,
      provider: prov,
      isFree: true,
      hasThinking: caps.includes('thinking'),
      hasVision: caps.includes('vision'),
      capabilities: caps,
      contextLength: 200000,
    }
    const updated = saveSelectedAiModel(newModel)
    setSelectedAiModels(updated)
    reloadData()
    setModelPingResult({
      id: fullId,
      success: true,
      reply: `Model gratis "${chipId}" berhasil ditambahkan ke daftar model aktif!`,
    })
  }

  // Current Provider Models (100% Dynamic from Fetch Model)
  const currentModelList = useMemo(() => {
    const activeProv = providerModalOpen || selectedProvider
    if (activeProv === 'google') {
      if (fetchedGoogleModels.length > 0) return fetchedGoogleModels
      return [
        { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'Flagship modern Google AI Studio dengan penalaran thinking adaptif dan latensi ultra rendah', contextLength: 1048576, capabilities: ['text', 'vision', 'thinking'] },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Flagship cepat terbaru Google AI Studio (Multimodal & Reasoning)', contextLength: 1048576, capabilities: ['text', 'vision', 'thinking'] },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Model penalaran kompleks dengan jendela konteks raksasa 2M token', contextLength: 2097152, capabilities: ['text', 'vision', 'thinking'] },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Inferensi berkecepatan tinggi dengan multimodal vision', contextLength: 1048576, capabilities: ['text', 'vision'] },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Model serbaguna cepat dan hemat biaya', contextLength: 1048576, capabilities: ['text', 'vision'] },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Model kontekstual mendalam untuk analisis dokumen', contextLength: 2097152, capabilities: ['text', 'vision', 'thinking'] },
      ]
    } else {
      if (fetchedOpenrouterModels.length > 0) return fetchedOpenrouterModels
      return RECOMMENDED_FREE_HIGH_CONTEXT_MODELS
    }
  }, [providerModalOpen, selectedProvider, fetchedGoogleModels, fetchedOpenrouterModels])

  const filteredModels = useMemo(() => {
    return currentModelList.filter((m: any) => {
      const q = modelSearch.toLowerCase().trim()
      const matchSearch =
        !q ||
        m.id.toLowerCase().includes(q) ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))

      let matchFilter = true
      if (modelFilter === 'free') matchFilter = Boolean(m.isFree)
      if (modelFilter === '200k') matchFilter = (m.contextLength || 0) >= 200000
      if (modelFilter === 'thinking') matchFilter = Boolean(m.hasThinking)

      return matchSearch && matchFilter
    })
  }, [currentModelList, modelSearch, modelFilter])

  // Filtered Tools
  const filteredTools = useMemo(() => {
    return SEGIA_TOOLS_CATALOG.filter((tool) => {
      const matchCat = categoryFilter === 'all' || tool.category === categoryFilter
      const matchSearch =
        !searchTool.trim() ||
        tool.label.toLowerCase().includes(searchTool.toLowerCase()) ||
        tool.name.toLowerCase().includes(searchTool.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTool.toLowerCase())
      return matchCat && matchSearch
    })
  }, [categoryFilter, searchTool])

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return promptLogs.filter((log) => {
      const matchStatus = logStatusFilter === 'all' || log.status === logStatusFilter
      const matchQuery =
        !searchLogQuery.trim() ||
        log.userPrompt.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        log.assistantReply.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        log.model.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        (log.contextTab && log.contextTab.toLowerCase().includes(searchLogQuery.toLowerCase()))
      return matchStatus && matchQuery
    })
  }, [promptLogs, logStatusFilter, searchLogQuery])

  // Live tool execution test
  const handleExecuteToolTest = async (toolId: string) => {
    setTestingToolId(toolId)
    setToolExecutionResult(null)

    try {
      const authHeaders = getAuthHeaders()
      let sampleParams: Record<string, any> = {}
      if (toolId === 'db_articles_query') sampleParams = { limit: 3, status: 'published' }
      if (toolId === 'db_portfolio_query') sampleParams = { limit: 3 }
      if (toolId === 'db_services_query') sampleParams = { limit: 3 }
      if (toolId === 'gsc_keyword_intelligence') sampleParams = { days: 28, limit: 3 }
      if (toolId === 'technical_seo_audit') sampleParams = { checkType: 'all', limit: 3 }
      if (toolId === 'redirect_301_inspector') sampleParams = { limit: 3 }
      if (toolId === 'create_article_draft') sampleParams = { topic: 'Uji Native Tool SegiaTech' }
      if (toolId === 'system_health_inspector') sampleParams = { deepCheck: true }

      const res = await fetch('/api/ai/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ toolName: toolId, parameters: sampleParams }),
      })

      const data = await res.json()
      if (data.success && data.execution) {
        setToolExecutionResult(data.execution)
      } else {
        setToolExecutionResult({
          id: `err_${Date.now()}`,
          toolName: toolId,
          label: toolId,
          category: 'system',
          durationMs: 0,
          status: 'error',
          output: { error: data.error || 'Gagal mengeksekusi tool' },
        })
      }
    } catch (err: any) {
      setToolExecutionResult({
        id: `err_${Date.now()}`,
        toolName: toolId,
        label: toolId,
        category: 'system',
        durationMs: 0,
        status: 'error',
        output: { error: err.message || 'Gagal mengeksekusi tool' },
      })
    } finally {
      setTestingToolId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* ----------------- 1. MINIMALIST EDITORIAL HEADER ----------------- */}
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Pengaturan AI &amp; Optimasi Platform
              </h2>
              <span className="text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                Gateway &amp; Savers
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Kelola kredensial multi-kunci, katalog model per penyedia, serta kompresi token (RTK, Caveman, Ponytail).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <IconButton
              icon={RotateCcw}
              label="Reset ke Default"
              hint="Kembalikan semua konfigurasi ke standar awal"
              tone="neutral"
              onClick={() => {
                setTemperature(0.4)
                setTopP(0.9)
                setThinkingMode('auto')
                setTokenOpt(DEFAULT_TOKEN_OPTIMIZATION_CONFIG)
                setEnabledTools(SEGIA_TOOLS_CATALOG.map((t) => t.id))
                setTestResult(null)
              }}
              side="bottom"
            />
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-sky-500 px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-sky-400 focus-visible:outline-none"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Save Feedback */}
        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span>Pengaturan berhasil disimpan dan aktif langsung di seluruh sesi admin.</span>
          </div>
        )}

        {/* Unified 4-Tab Navigation */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/[0.08] pt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === 'providers'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Key className="h-3.5 w-3.5 text-sky-400" />
            <span>Penyedia AI &amp; Model</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-mono">
              {apiKeys.length} Kunci
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('token')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === 'token'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Penghematan Token &amp; Persona</span>
            <span className="rounded bg-amber-500/15 text-amber-300 text-[10px] px-1 font-mono">
              RTK + Caveman
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === 'memory'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-purple-400" />
            <span>Memori &amp; Preferensi</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-mono">
              {memories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === 'tools'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>Katalog Tools Native</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-mono">
              {enabledTools.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === 'logs'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <History className="h-3.5 w-3.5 text-purple-400" />
            <span>Log Audit &amp; Debug</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-mono">
              {promptLogs.length}
            </span>
          </button>
        </div>
      </Panel>

      {/* =========================================================================
          TAB 1: PENYEDIA AI & MODEL (Card-Based Presentation & Interactive Modals)
      ========================================================================= */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white">Penyedia AI &amp; Gateway Model Studio</h3>
                <Tooltip label="Pilih kartu penyedia untuk mengelola daftar kunci API, pelacakan kuota resmi, rotasi relay, serta katalog model.">
                  <span className="cursor-help text-neutral-400 hover:text-neutral-200">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </Tooltip>
              </div>
            </div>

            <Tooltip label="Model aktif untuk percakapan &amp; penulisan artikel dipilih langsung di panel Chat Copilot.">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/40 px-2.5 py-1 text-[11px] text-neutral-300 cursor-help shrink-0">
                <Info className="h-3 w-3 text-sky-400 shrink-0" />
                <span>Model aktif dipilih di Chat Copilot</span>
              </div>
            </Tooltip>
          </div>

          {/* =========================================================================
              PROVIDER CARDS (Grid 2 Kolom dengan Logo Asli Provider)
          ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CARD 1: Google AI Studio (Gemini) */}
            {(() => {
              const googleKeys = apiKeys.filter((k) => k.provider === 'google')
              const activeGoogleKey = googleKeys.find((k) => k.isActive) || googleKeys[0]
              const googleModelsCount = selectedAiModels.filter((m) => m.provider === 'google').length

              return (
                <div
                  onClick={() => {
                    setSelectedProvider('google')
                    setProviderModalOpen('google')
                  }}
                  className="group relative cursor-pointer rounded-2xl border border-sky-500/25 bg-gradient-to-b from-sky-950/20 via-black/40 to-black/60 p-5 shadow-lg transition-all hover:border-sky-400/50 hover:shadow-sky-500/10 hover:shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-sky-400/30 shadow-inner group-hover:scale-105 transition-transform">
                        <GoogleGeminiLogo className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                            Google AI Studio
                          </h4>
                          <span className="rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-mono px-1.5 py-0.2 font-semibold">
                            Gemini 2.5
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Multimodal Vision, Thinking Reasoning &amp; Konteks hingga 2M token.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {googleKeys.length > 0 ? (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono px-2 py-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {googleKeys.length} Kunci
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono px-2 py-0.5">
                          Belum Ada Kunci
                        </span>
                      )}
                      <Tooltip label="Buka Pengaturan &amp; Kunci Google">
                        <div className="p-1.5 rounded-lg text-neutral-400 group-hover:text-sky-300 group-hover:bg-sky-500/10 transition-colors">
                          <Settings className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                        </div>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="mt-4 pt-3.5 border-t border-white/[0.08] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Kunci Aktif:</span>
                      {activeGoogleKey ? (
                        <span className="font-mono text-neutral-200 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          {activeGoogleKey.name} ({maskApiKey(activeGoogleKey.key)})
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic">Belum dikonfigurasi</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Model Tersedia di Studio:</span>
                      <span className="font-mono text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {googleModelsCount} Model Aktif
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Status Gateway:</span>
                      <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Terverifikasi Google Generative API
                      </span>
                    </div>
                  </div>

                  {/* Action Link Footer - Icon Base Only */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400">
                      Google Generative Language API
                    </span>
                    <Tooltip label="Buka Pengaturan &amp; Kunci Google">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 border border-sky-500/25 px-2.5 py-1 text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
                        <Settings className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                        <CornerDownRight className="h-3 w-3" />
                      </div>
                    </Tooltip>
                  </div>
                </div>
              )
            })()}

            {/* CARD 2: OpenRouter Gateway */}
            {(() => {
              const openrouterKeys = apiKeys.filter((k) => k.provider === 'openrouter')
              const activeOpenrouterKey = openrouterKeys.find((k) => k.isActive) || openrouterKeys[0]
              const openrouterModelsCount = selectedAiModels.filter((m) => m.provider === 'openrouter').length

              return (
                <div
                  onClick={() => {
                    setSelectedProvider('openrouter')
                    setProviderModalOpen('openrouter')
                  }}
                  className="group relative cursor-pointer rounded-2xl border border-purple-500/25 bg-gradient-to-b from-purple-950/20 via-black/40 to-black/60 p-5 shadow-lg transition-all hover:border-purple-400/50 hover:shadow-purple-500/10 hover:shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 shadow-inner group-hover:scale-105 transition-transform">
                        <OpenRouterLogo className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                            OpenRouter Gateway
                          </h4>
                          <span className="rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono px-1.5 py-0.2 font-semibold">
                            Universal AI
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Ratusan model global, Free Tier Nemotron 1M, Cohere Code, &amp; Claude.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {openrouterKeys.length > 0 ? (
                        <span className="rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono px-2 py-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          {openrouterKeys.length} Kunci
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono px-2 py-0.5">
                          Belum Ada Kunci
                        </span>
                      )}
                      <Tooltip label="Buka Pengaturan &amp; Kunci OpenRouter">
                        <div className="p-1.5 rounded-lg text-neutral-400 group-hover:text-purple-300 group-hover:bg-purple-500/10 transition-colors">
                          <Settings className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                        </div>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Body Info with Quota Tracking */}
                  <div className="mt-4 pt-3.5 border-t border-white/[0.08] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Kunci Aktif:</span>
                      {activeOpenrouterKey ? (
                        <span className="font-mono text-neutral-200 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          {activeOpenrouterKey.name} ({maskApiKey(activeOpenrouterKey.key)})
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic">Belum dikonfigurasi</span>
                      )}
                    </div>

                    {/* Kuota Tracking OpenRouter */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Tracking Kuota &amp; Saldo:</span>
                      {activeOpenrouterKey?.quotaUsage !== undefined ? (
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="text-amber-300 font-bold">
                            ${activeOpenrouterKey.quotaUsage.toFixed(4)}
                          </span>
                          <span className="text-neutral-500">/</span>
                          <span className="text-emerald-400 font-semibold">
                            {activeOpenrouterKey.quotaLimit !== null && activeOpenrouterKey.quotaLimit !== undefined
                              ? `$${activeOpenrouterKey.quotaLimit.toFixed(2)}`
                              : 'Unlimited'}
                          </span>
                          {activeOpenrouterKey.isFreeTier && (
                            <span className="rounded bg-emerald-500/20 text-emerald-300 text-[9px] px-1 py-0.2">
                              Free Tier
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-500 font-mono text-[10px]">Klik uji untuk cek kuota</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Model Tersedia di Studio:</span>
                      <span className="font-mono text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {openrouterModelsCount} Model Aktif
                      </span>
                    </div>
                  </div>

                  {/* Action Link Footer - Icon Base Only */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400">
                      OpenRouter API &amp; Relay
                    </span>
                    <Tooltip label="Buka Pengaturan &amp; Kunci OpenRouter">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                        <Settings className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                        <CornerDownRight className="h-3 w-3" />
                      </div>
                    </Tooltip>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* =========================================================================
              DAFTAR MODEL TERSEDIA LINTAS PENYEDIA (Persis media_1793209666517_98717548.png)
          ========================================================================= */}
          <div className="rounded-2xl border border-neutral-800 bg-[#121316] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Model Tersedia</h3>
              <div className="relative inline-flex items-center">
                <select
                  value={thinkingMode}
                  onChange={(e) => setThinkingMode(e.target.value as any)}
                  className="appearance-none bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 pr-8 text-xs font-mono text-neutral-200 focus:outline-none focus:border-neutral-500 cursor-pointer"
                >
                  <option value="auto">Thinking: Auto</option>
                  <option value="on">Thinking: On</option>
                  <option value="off">Thinking: Off</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Peringatan / Banner Feedback Uji Model & Penambahan */}
            {modelPingResult && (
              <div
                className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 text-xs transition-all animate-in fade-in duration-200 ${
                  modelPingResult.success
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 shadow-sm shadow-emerald-500/10'
                    : 'border-red-500/40 bg-red-500/10 text-red-200 shadow-sm shadow-red-500/10'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {modelPingResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-white flex flex-wrap items-center gap-2">
                      <span>{modelPingResult.success ? 'Uji Inferensi Berhasil' : 'Uji Inferensi Gagal'}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/50 border border-white/10 text-neutral-300">
                        {modelPingResult.id}
                      </span>
                      {modelPingResult.latencyMs !== undefined && (
                        <span className="font-mono text-[11px] text-emerald-300 font-bold">
                          ({modelPingResult.latencyMs}ms)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 mt-1 break-words">
                      {modelPingResult.reply}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModelPingResult(null)}
                  className="text-neutral-400 hover:text-white p-1 shrink-0 rounded-lg hover:bg-white/5 transition-colors"
                  title="Tutup pesan"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Model Items Grid (2 Kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedAiModels.map((m) => {
                const isTestingThisModel = testingModelId === m.id

                return (
                  <div
                    key={`${m.provider}-${m.id}`}
                    className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-all text-xs group ${
                      isTestingThisModel
                        ? 'border-sky-500/60 bg-sky-500/10 shadow-md shadow-sky-500/10'
                        : m.testedStatus === 'valid'
                        ? 'border-emerald-500/40 bg-neutral-900/80 hover:border-emerald-500/60'
                        : m.testedStatus === 'invalid'
                        ? 'border-red-500/40 bg-neutral-900/80 hover:border-red-500/60'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            isTestingThisModel
                              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                              : m.testedStatus === 'valid'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : m.testedStatus === 'invalid'
                              ? 'bg-red-500/15 border-red-500/30 text-red-400'
                              : 'bg-neutral-800 border-neutral-700/80 text-neutral-300'
                          }`}
                        >
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-mono text-xs text-neutral-200 truncate bg-neutral-800/80 px-2 py-0.5 rounded border border-white/[0.04]">
                            {m.id}
                          </div>
                          <div className="font-mono text-[10px] text-neutral-400 italic truncate flex items-center gap-1">
                            <span>{m.name && m.name !== m.id ? m.name : m.id.replace(/^openrouter\//, '')}</span>
                            <Info className="h-2.5 w-2.5 opacity-60 shrink-0" />
                            {m.isFree && <span className="not-italic text-[9px] text-emerald-400 font-semibold ml-0.5">free</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Latency / Test Status Pill */}
                        {m.testedStatus === 'valid' && (
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {m.testedLatencyMs || 0}ms
                          </span>
                        )}
                        {m.testedStatus === 'invalid' && (
                          <span className="text-[10px] font-mono text-red-300 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                            <X className="h-2.5 w-2.5" />
                            Gagal
                          </span>
                        )}

                        {/* Play Button: Outline when idle, FILLED when testing/valid/invalid (NO SPIN) */}
                        <Tooltip
                          label={
                            isTestingThisModel
                              ? 'Sedang menguji inferensi...'
                              : m.testedStatus === 'valid'
                              ? `Uji Ulang (${m.testedLatencyMs || 0}ms)`
                              : m.testedStatus === 'invalid'
                              ? 'Inferensi Gagal - Uji Ulang'
                              : 'Uji Model (Inferensi)'
                          }
                        >
                          <button
                            type="button"
                            onClick={() => handleTestModelPing(m.id, m.provider, m.assignedKeyId)}
                            disabled={isTestingThisModel}
                            className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                              isTestingThisModel
                                ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/50'
                                : m.testedStatus === 'valid'
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : m.testedStatus === 'invalid'
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'text-neutral-400 hover:text-sky-300 hover:bg-neutral-800'
                            } disabled:opacity-40`}
                            title="Uji Model"
                          >
                            <Play
                              className={`h-4 w-4 transition-all duration-200 ${
                                isTestingThisModel
                                  ? 'fill-sky-400 text-sky-400 scale-110'
                                  : m.testedStatus === 'valid'
                                  ? 'fill-emerald-400 text-emerald-400'
                                  : m.testedStatus === 'invalid'
                                  ? 'fill-red-400 text-red-400'
                                  : 'text-neutral-400 hover:text-sky-300'
                              }`}
                            />
                          </button>
                        </Tooltip>

                        <Tooltip label={copiedModelId === m.id ? 'ID Tersalin!' : 'Salin ID'}>
                          <button
                            type="button"
                            onClick={() => handleCopyModelId(m.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Salin ID"
                          >
                            {copiedModelId === m.id ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </Tooltip>

                        <Tooltip label="Hapus dari model aktif">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = removeSelectedAiModel(m.id, m.provider)
                              setSelectedAiModels(updated)
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            title="Hapus Model"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Inline server feedback on test */}
                    {m.testedReply && (
                      <div
                        className={`pt-1.5 border-t text-[10px] font-mono truncate flex items-center gap-1.5 ${
                          m.testedStatus === 'valid'
                            ? 'border-emerald-500/20 text-emerald-300/90'
                            : 'border-red-500/20 text-red-300/90'
                        }`}
                      >
                        <span className="opacity-60">{m.testedStatus === 'valid' ? 'Respon:' : 'Error:'}</span>
                        <span className="truncate">{m.testedReply}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Dashed Button Tambah Model */}
            <button
              type="button"
              onClick={() => setQuickAddOpen((v) => !v)}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-amber-600/60 hover:border-amber-500 bg-amber-500/[0.03] hover:bg-amber-500/[0.08] text-amber-500 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Model</span>
            </button>

            {quickAddOpen && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-neutral-900 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickAddInput}
                    onChange={(e) => setQuickAddInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAddModel()
                    }}
                    placeholder="Ketik ID model (misal: gemini-3.8-flash, gemini-2.5-flash, atau openrouter/anthropic/claude-3.5-sonnet)..."
                    className="flex-1 h-9 rounded-lg bg-black/60 border border-white/15 px-3 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddModel}
                    className="h-9 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAddOpen(false)}
                    className="h-9 px-2 rounded-lg text-neutral-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Model Gratis yang Disarankan (≥200k konteks) */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs text-neutral-400 font-medium">
                Model gratis yang disarankan (≥200k konteks):
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SUGGESTED_FREE_MODELS.map((chip) => {
                  const isAlreadyAdded = selectedAiModels.some(
                    (m) => m.id === chip || m.id === `openrouter/${chip}` || m.name === chip
                  )
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAddSuggestedChip(chip)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-mono transition-colors border ${
                        isAlreadyAdded
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {isAlreadyAdded ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Plus className="h-3.5 w-3.5 text-neutral-400" />}
                      <span>{chip}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Hyperparameters Config */}
          <Panel className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white">Parameter Inferensi Bawaan</h4>
              <Tooltip label="Parameter inferensi mengatur keacakan, sampling token, dan batas panjang token keluaran model.">
                <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-white cursor-pointer" />
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <Tooltip label="Temperatur 0.0 untuk presisi koding, 0.4 seimbang, 0.8 kreatif.">
                    <span className="text-neutral-400 cursor-help border-b border-dotted border-neutral-600">Temperatur</span>
                  </Tooltip>
                  <span className="font-mono text-sky-400 font-bold">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <Tooltip label="Top-P nucleus sampling membatasi probabilitas kumulatif token.">
                    <span className="text-neutral-400 cursor-help border-b border-dotted border-neutral-600">Top-P</span>
                  </Tooltip>
                  <span className="font-mono text-purple-400 font-bold">{topP.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <Tooltip label="Batas jumlah token maksimum keluaran per satu inferensi respon.">
                    <span className="text-neutral-400 cursor-help border-b border-dotted border-neutral-600">Max Output</span>
                  </Tooltip>
                  <span className="font-mono text-emerald-400 font-bold">{maxOutputTokens} tokens</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={maxOutputTokens}
                  onChange={(e) => setMaxOutputTokens(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE PROVIDER MODAL (Pengaturan Lengkap Kunci, Kuota, & Model Fetch)
      ========================================================================= */}
      {providerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-white/20 bg-[#14161C] shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#1A1D24] px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  {providerModalOpen === 'google' ? (
                    <GoogleGeminiLogo className="h-6 w-6" />
                  ) : (
                    <OpenRouterLogo className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {providerModalOpen === 'google'
                      ? 'Pengaturan Google AI Studio (Gemini)'
                      : 'Pengaturan OpenRouter Universal Gateway'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                    <span>Kredensial multi-key, pelacakan kuota resmi, serta pemilihan model fetch.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Official Provider Get-Key Link */}
                <Tooltip label={`Dapatkan API Key di ${providerModalOpen === 'google' ? 'Google AI Studio' : 'OpenRouter'}`}>
                  <a
                    href={
                      providerModalOpen === 'google'
                        ? 'https://aistudio.google.com/app/apikey'
                        : 'https://openrouter.ai/keys'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 px-2.5 py-1.5 text-xs font-semibold text-sky-300 transition-colors shadow-sm"
                  >
                    <Key className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Dapatkan API Key</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                </Tooltip>

                <button
                  type="button"
                  onClick={() => setProviderModalOpen(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* 1. Real-time Quota & Status Meter */}
              {(() => {
                const provKeys = apiKeys.filter((k) => k.provider === providerModalOpen)
                const activeKey = provKeys.find((k) => k.isActive) || provKeys[0]

                if (providerModalOpen === 'openrouter') {
                  const quotaUsage = activeKey?.quotaUsage ?? 0
                  const quotaLimit = activeKey?.quotaLimit ?? null
                  const isFreeTier = Boolean(activeKey?.isFreeTier)

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-purple-500/30 bg-purple-950/20">
                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 font-medium">Penggunaan Kuota:</span>
                        <div className="text-sm font-mono font-bold text-amber-300">
                          ${quotaUsage.toFixed(4)} USD
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 font-medium">Batas Kredit (Limit):</span>
                        <div className="text-sm font-mono font-bold text-white">
                          {quotaLimit !== null ? `$${quotaLimit.toFixed(2)} USD` : 'Unlimited'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 font-medium">Sisa Kuota Kredit:</span>
                        <div className="text-sm font-mono font-bold text-emerald-400">
                          {quotaLimit !== null ? `$${Math.max(0, quotaLimit - quotaUsage).toFixed(2)} USD` : 'Aktif'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 font-medium">Tipe Akun:</span>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${isFreeTier ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                            {isFreeTier ? 'Free Tier' : 'Paid Tier'}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {activeKey?.rateLimitInfo || 'Resmi'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-sky-500/30 bg-sky-950/20">
                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 font-medium">Endpoint Verifikasi:</span>
                        <div className="text-xs font-mono font-bold text-sky-300">
                          Google Generative Language API
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 font-medium">Jendela Konteks Maksimal:</span>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          2,097,152 Tokens (Gemini 2.5 Pro)
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 font-medium">Kapabilitas Multimodal:</span>
                        <div className="text-xs font-mono font-bold text-purple-300">
                          Vision Image-to-Text &amp; Deep Reasoning
                        </div>
                      </div>
                    </div>
                  )
                }
              })()}

              {/* 2. Key Management Section */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Daftar Kunci API &amp; Relay Proxy</h4>
                    <Tooltip label="Kelola kunci aktif, prioritas failover, dan uji status koneksi sesuai dokumentasi resmi provider.">
                      <span className="cursor-help text-neutral-400 hover:text-neutral-200">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProvider(providerModalOpen)
                        setNewKeyName(providerModalOpen === 'google' ? 'Google Gemini Key' : 'OpenRouter Key')
                        setNewKeyValue('')
                        setNewKeyPriority(currentProviderKeys.length + 1)
                        setNewKeyProxyUrl('')
                        setNewKeyPool(providerModalOpen === 'openrouter' ? 'cloudflare-relay' : '')
                        setNewKeyError('')
                        setAddKeyModalOpen(true)
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 px-3 text-xs font-semibold text-sky-300 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Kunci</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProvider(providerModalOpen)
                        setBulkNotice(null)
                        setBulkAddModalOpen(true)
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 px-3 text-xs font-semibold text-white transition-colors"
                    >
                      <Terminal className="h-3.5 w-3.5 text-accent-400" />
                      <span>Impor Massal</span>
                    </button>
                  </div>
                </div>

                {/* Toolbar Strategi & Uji Semua */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-white text-[11px]">Strategi Rotasi Kunci:</span>
                    <div className="inline-flex rounded-md border border-white/10 bg-black/40 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...connConfig, strategy: 'priority' as ConnectionStrategy }
                          setConnConfig(updated)
                          saveConnectionConfig(updated)
                        }}
                        className={`px-2.5 py-0.5 rounded transition-colors ${
                          connConfig.strategy === 'priority'
                            ? 'bg-sky-500/25 text-sky-300 font-semibold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Prioritas (#1, #2)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...connConfig, strategy: 'round-robin' as ConnectionStrategy }
                          setConnConfig(updated)
                          saveConnectionConfig(updated)
                        }}
                        className={`px-2.5 py-0.5 rounded transition-colors ${
                          connConfig.strategy === 'round-robin'
                            ? 'bg-sky-500/25 text-sky-300 font-semibold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Putaran Bulat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...connConfig, strategy: 'sticky' as ConnectionStrategy }
                          setConnConfig(updated)
                          saveConnectionConfig(updated)
                        }}
                        className={`px-2.5 py-0.5 rounded transition-colors ${
                          connConfig.strategy === 'sticky'
                            ? 'bg-sky-500/25 text-sky-300 font-semibold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Lengket (Sticky)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestAllKeys(providerModalOpen)}
                    disabled={testingAllKeys || apiKeys.filter((k) => k.provider === providerModalOpen).length === 0}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors disabled:opacity-40"
                  >
                    <Play className={`h-3 w-3 transition-all ${testingAllKeys ? 'fill-emerald-400 text-emerald-400 scale-110' : ''}`} />
                    <span>{testingAllKeys ? 'Menguji Semua Kunci...' : 'Uji Semua Kunci'}</span>
                  </button>
                </div>

                {/* Peringatan / Banner Feedback Uji Kunci API */}
                {testResult && (
                  <div
                    className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 text-xs transition-all animate-in fade-in duration-200 ${
                      testResult.success
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 shadow-sm shadow-emerald-500/10'
                        : 'border-red-500/40 bg-red-500/10 text-red-200 shadow-sm shadow-red-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-white">
                          {testResult.success ? 'Uji Koneksi Kunci Sukses' : 'Uji Koneksi Kunci Gagal'}
                        </div>
                        <p className="text-[11px] opacity-90 mt-0.5 break-words">
                          {testResult.message || testResult.error}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTestResult(null)}
                      className="text-neutral-400 hover:text-white p-1 shrink-0 rounded-lg hover:bg-white/5 transition-colors"
                      title="Tutup pesan"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Key Cards List */}
                <div className="space-y-2.5">
                  {apiKeys.filter((k) => k.provider === providerModalOpen).length > 0 ? (
                    apiKeys
                      .filter((k) => k.provider === providerModalOpen)
                      .map((k) => (
                        <div
                          key={k.id}
                          className={`rounded-xl border p-3.5 transition-all ${
                            k.isActive
                              ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                              : 'border-white/[0.08] bg-black/30'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="font-bold text-white text-xs">{k.name}</h5>
                                {k.isActive ? (
                                  <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-1.5 py-0.2 font-bold uppercase">
                                    aktif
                                  </span>
                                ) : (
                                  <span className="rounded bg-white/5 text-neutral-400 text-[10px] font-mono px-1.5 py-0.2">
                                    cadangan
                                  </span>
                                )}
                                <span className="rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono px-1.5 py-0.2 font-bold">
                                  #{k.priority}
                                </span>
                              </div>

                              <div className="font-mono text-[11px] text-neutral-400">
                                {maskApiKey(k.key)}
                              </div>

                              {k.statusMessage && (
                                <div
                                  className={`font-mono text-[10px] px-2 py-0.5 rounded border max-w-2xl truncate ${
                                    k.status === 'valid'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                                  }`}
                                >
                                  {k.statusMessage}
                                </div>
                              )}

                              {k.proxyUrl && (
                                <div className="font-mono text-[10px] text-sky-400/90 underline truncate pt-0.5">
                                  Proxy: {k.proxyUrl} {k.pool ? `(Pool: ${k.pool})` : ''}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                              {!k.isActive && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveApiKey(k.id)
                                    reloadData()
                                  }}
                                  className="px-2.5 py-1 rounded text-[11px] font-mono text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                >
                                  Jadikan Aktif
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleTestKey(k)}
                                disabled={testingKeyId === k.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 transition-colors disabled:opacity-40"
                              >
                                <Play className={`h-2.5 w-2.5 transition-all ${testingKeyId === k.id ? 'fill-sky-400 text-sky-400 scale-110 animate-pulse' : ''}`} />
                                <span>{testingKeyId === k.id ? 'Menguji...' : 'Uji'}</span>
                              </button>

                              <Tooltip label="Hapus Kunci">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Hapus kunci "${k.name}"?`)) {
                                      deleteApiKeyItem(k.id)
                                      reloadData()
                                    }
                                  }}
                                  className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                                  title="Hapus Kunci"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 text-center text-xs text-neutral-400 italic">
                      Belum ada kunci terdaftar untuk penyedia ini. Klik tombol tambah kunci di atas.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Dynamic Model Fetching & Autocomplete Picker */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      Katalog Model ({providerModalOpen === 'google' ? 'Google' : 'OpenRouter'})
                    </h4>
                    <Tooltip label="Tarik daftar model dari endpoint resmi provider, cari dengan autocomplete, lalu tambahkan ke daftar model aktif studio.">
                      <span className="cursor-help text-neutral-400 hover:text-neutral-200">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </Tooltip>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider(providerModalOpen)
                      handleFetchModels(providerModalOpen)
                    }}
                    disabled={fetchingModels}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 px-3 text-xs font-semibold text-sky-300 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                    <span>{fetchingModels ? 'Menyinkronkan...' : 'Sinkronkan Model'}</span>
                  </button>
                </div>

                {fetchNotice && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs text-sky-300">
                    {fetchNotice}
                  </div>
                )}

                {/* Feedback Uji Model & Sinkronisasi di dalam Modal */}
                {modelPingResult && (
                  <div
                    className={`rounded-xl border p-3 flex items-start justify-between gap-3 text-xs transition-all animate-in fade-in duration-200 ${
                      modelPingResult.success
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 shadow-sm shadow-emerald-500/10'
                        : 'border-red-500/40 bg-red-500/10 text-red-200 shadow-sm shadow-red-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {modelPingResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-white flex flex-wrap items-center gap-2">
                          <span>{modelPingResult.success ? 'Operasi / Uji Sukses' : 'Operasi / Uji Gagal'}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/50 border border-white/10 text-neutral-300">
                            {modelPingResult.id}
                          </span>
                          {modelPingResult.latencyMs !== undefined && (
                            <span className="font-mono text-[11px] text-emerald-300 font-bold">
                              ({modelPingResult.latencyMs}ms)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] opacity-90 mt-1 break-words">
                          {modelPingResult.reply}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModelPingResult(null)}
                      className="text-neutral-400 hover:text-white p-1 shrink-0 rounded-lg hover:bg-white/5 transition-colors"
                      title="Tutup pesan"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Autocomplete Search & Add Input */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="h-3.5 w-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={autocompleteQuery}
                        onChange={(e) => {
                          setAutocompleteQuery(e.target.value)
                          setAutocompleteOpen(true)
                        }}
                        onFocus={() => setAutocompleteOpen(true)}
                        placeholder={`Cari model ${providerModalOpen === 'google' ? 'Google (e.g. 2.5-flash)' : 'OpenRouter (e.g. nemotron, cohere, free)'}...`}
                        className="w-full h-9 rounded-lg bg-black/60 border border-white/20 pl-9 pr-3 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>

                  {/* Autocomplete Dropdown Menu */}
                  {autocompleteOpen && autocompleteQuery.trim() && (
                    <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-white/20 bg-[#1A1D24] shadow-2xl max-h-64 overflow-y-auto p-1.5 space-y-1">
                      {currentModelList
                        .filter((m: any) => {
                          const q = autocompleteQuery.toLowerCase().trim()
                          return (
                            m.id.toLowerCase().includes(q) ||
                            (m.name && m.name.toLowerCase().includes(q)) ||
                            (m.description && m.description.toLowerCase().includes(q))
                          )
                        })
                        .slice(0, 15)
                        .map((m: any) => {
                          const caps = detectModelCapabilities(m.id, m)
                          const targetProv = (providerModalOpen || selectedProvider || (m.id.startsWith('gemini') ? 'google' : 'openrouter')) as 'google' | 'openrouter'
                          const canonicalId =
                            targetProv === 'openrouter' && !m.id.startsWith('openrouter/')
                              ? `openrouter/${m.id}`
                              : m.id
                          const isAlreadyAdded = selectedAiModels.some(
                            (x) =>
                              x.id === canonicalId ||
                              x.id === m.id ||
                              (targetProv === 'openrouter' && x.id.replace(/^openrouter\//, '') === m.id.replace(/^openrouter\//, ''))
                          )

                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                const newModelItem: AiModelItem = {
                                  id: canonicalId,
                                  name: m.name || m.id,
                                  provider: targetProv,
                                  contextLength: m.contextLength,
                                  isFree: Boolean(m.isFree),
                                  hasThinking: caps.includes('thinking'),
                                  hasVision: caps.includes('vision'),
                                  capabilities: caps,
                                  description: m.description,
                                }
                                const updated = saveSelectedAiModel(newModelItem)
                                setSelectedAiModels(updated)
                                reloadData()
                                setAutocompleteQuery('')
                                setAutocompleteOpen(false)
                                setModelPingResult({
                                  id: canonicalId,
                                  success: true,
                                  reply: `Model "${m.name || m.id}" berhasil ditambahkan ke daftar model aktif!`,
                                })
                              }}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-white text-xs truncate">{m.name || m.id}</div>
                                <div className="font-mono text-[10px] text-neutral-400 truncate">{canonicalId}</div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {m.isFree && (
                                  <span className="rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono px-1.5 py-0.2">
                                    Free
                                  </span>
                                )}
                                {caps.includes('vision') && (
                                  <span className="rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono px-1.5 py-0.2">
                                    Vision
                                  </span>
                                )}
                                {caps.includes('thinking') && (
                                  <span className="rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono px-1.5 py-0.2">
                                    Thinking
                                  </span>
                                )}
                                {isAlreadyAdded ? (
                                  <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                    <Check className="h-2.5 w-2.5" />
                                    Tersimpan
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 font-mono text-[10px] text-sky-300 bg-white/10 hover:bg-sky-500 hover:text-white px-1.5 py-0.5 rounded transition-colors">
                                    <Plus className="h-2.5 w-2.5" />
                                    Tambah
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>

                {/* Model yang sudah ditambahkan untuk provider ini */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-semibold text-neutral-300">
                    Model Terdaftar untuk {providerModalOpen === 'google' ? 'Google AI Studio' : 'OpenRouter'}:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedAiModels
                      .filter((m) => m.provider === providerModalOpen || (!m.provider && (providerModalOpen === 'google' ? m.id.startsWith('gemini') : m.id.startsWith('openrouter/'))))
                      .map((m) => {
                        const isTestingThis = testingModelId === m.id

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col justify-between p-2.5 rounded-lg border transition-all text-xs ${
                              isTestingThis
                                ? 'border-sky-500/60 bg-sky-500/10 shadow-sm'
                                : m.testedStatus === 'valid'
                                ? 'border-emerald-500/40 bg-black/40'
                                : m.testedStatus === 'invalid'
                                ? 'border-red-500/40 bg-black/40'
                                : 'border-white/10 bg-black/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-white truncate text-xs">{m.name || m.id}</div>
                                <div className="font-mono text-[10px] text-neutral-400 truncate">{m.id}</div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {m.testedStatus === 'valid' && (
                                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                                    <Check className="h-2.5 w-2.5" />
                                    {m.testedLatencyMs || 0}ms
                                  </span>
                                )}
                                {m.testedStatus === 'invalid' && (
                                  <span className="text-[9px] font-mono text-red-300 bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                                    <X className="h-2.5 w-2.5" />
                                    Gagal
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleTestModelPing(m.id, m.provider, m.assignedKeyId)}
                                  disabled={isTestingThis}
                                  className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
                                    isTestingThis
                                      ? 'bg-sky-500/25 text-sky-200 ring-1 ring-sky-500/50'
                                      : m.testedStatus === 'valid'
                                      ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                      : m.testedStatus === 'invalid'
                                      ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                                      : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                                  }`}
                                  title="Uji Inferensi Model"
                                >
                                  <Play
                                    className={`h-2.5 w-2.5 transition-all ${
                                      isTestingThis
                                        ? 'fill-sky-400 text-sky-400 scale-110'
                                        : m.testedStatus === 'valid'
                                        ? 'fill-emerald-400 text-emerald-400'
                                        : m.testedStatus === 'invalid'
                                        ? 'fill-red-400 text-red-400'
                                        : 'text-sky-300'
                                    }`}
                                  />
                                  <span>{isTestingThis ? 'Menguji...' : 'Uji'}</span>
                                </button>
                                <Tooltip label="Hapus Model">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = removeSelectedAiModel(m.id, m.provider)
                                      setSelectedAiModels(updated)
                                    }}
                                    className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                                    title="Hapus Model"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Response snippet */}
                            {m.testedReply && (
                              <div
                                className={`mt-1.5 pt-1 border-t text-[9px] font-mono truncate ${
                                  m.testedStatus === 'valid' ? 'border-emerald-500/20 text-emerald-300/80' : 'border-red-500/20 text-red-300/80'
                                }`}
                              >
                                <span className="opacity-70">{m.testedStatus === 'valid' ? 'Respon:' : 'Error:'}</span>{' '}
                                {m.testedReply}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="border-t border-white/10 bg-[#1A1D24] px-6 py-3 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setProviderModalOpen(null)}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PENGHEMATAN TOKEN & PERSONA (RTK, Caveman, Ponytail, Headroom)
      ========================================================================= */}
      {activeTab === 'token' && (
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6 space-y-6">
            <div className="border-b border-white/[0.06] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Arsitektur Penghematan Token &amp; Persona Model</h3>
                  <p className="text-[11px] text-neutral-400">
                    Engine terintegrasi ke seluruh input sistem (chat, draft artikel, pencarian database, &amp; audit SEO).
                  </p>
                </div>
              </div>
            </div>

            {/* 1. RTK (Rust Tool-output Kit) */}
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rtkEnabled"
                    checked={tokenOpt.rtkEnabled}
                    onChange={(e) => setTokenOpt({ ...tokenOpt, rtkEnabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-sky-500 cursor-pointer"
                  />
                  <label htmlFor="rtkEnabled" className="text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5">
                    <span>Kompresi keluaran alat</span>
                    <a
                      href="https://github.com/rtk-ai/rtk"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      (RTK)
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </label>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  git/grep/ls/tree/logs/database JSON → 60-90% lebih sedikit token masukan
                </span>
              </div>

              {tokenOpt.rtkEnabled && (
                <div className="pl-6 pt-2 space-y-3 border-t border-white/[0.04] text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-400 font-medium">Mode Agresivitas RTK</label>
                      <Segmented
                        value={tokenOpt.rtkMode}
                        onChange={(val) => setTokenOpt({ ...tokenOpt, rtkMode: val })}
                        options={[
                          { id: 'aggressive', label: 'Aggressive (85% Save)', hint: 'Array max 2, strip semua whitespace' },
                          { id: 'balanced', label: 'Balanced (65% Save)', hint: 'Array max 3, ringkasan standar' },
                          { id: 'minimal', label: 'Minimal (40% Save)', hint: 'Pangkas karakter panjang saja' },
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-400 font-medium">Maksimum Karakter per Tool Output</label>
                      <input
                        type="number"
                        value={tokenOpt.rtkMaxOutputChars}
                        onChange={(e) => setTokenOpt({ ...tokenOpt, rtkMaxOutputChars: parseInt(e.target.value) || 2500 })}
                        className="w-full h-8 rounded-lg bg-black/60 border border-white/15 px-2.5 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="smartCrusher"
                      checked={tokenOpt.rtkSmartCrusher}
                      onChange={(e) => setTokenOpt({ ...tokenOpt, rtkSmartCrusher: e.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-sky-500 cursor-pointer"
                    />
                    <label htmlFor="smartCrusher" className="text-[11px] text-neutral-300 cursor-pointer">
                      SmartCrusher for JSON: Otomatis ringkas array database panjang dan hapus field kosong/null
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Headroom (Context Compression) */}
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="headroomEnabled"
                    checked={tokenOpt.headroomEnabled}
                    onChange={(e) => setTokenOpt({ ...tokenOpt, headroomEnabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="headroomEnabled" className="text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5">
                    <span>Kompresi konteks</span>
                    <a
                      href="https://github.com/chopratejas/headroom"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      (Headroom)
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </label>
                </div>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Kompresi prompt melalui sanitasi sliding window sebelum merutekan ke model
                </span>
              </div>

              {tokenOpt.headroomEnabled && (
                <div className="pl-6 pt-2 space-y-2.5 border-t border-white/[0.04] text-xs">
                  <div className="text-[11px] text-neutral-400">
                    Compression extras:
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                      <input
                        type="checkbox"
                        checked={tokenOpt.headroomExtras.code}
                        onChange={(e) =>
                          setTokenOpt({
                            ...tokenOpt,
                            headroomExtras: { ...tokenOpt.headroomExtras, code: e.target.checked },
                          })
                        }
                        className="h-3.5 w-3.5 rounded accent-purple-500"
                      />
                      <span>[code] AST compression (strip docstrings, format komentar, whitespace)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                      <input
                        type="checkbox"
                        checked={tokenOpt.headroomExtras.ml}
                        onChange={(e) =>
                          setTokenOpt({
                            ...tokenOpt,
                            headroomExtras: { ...tokenOpt.headroomExtras, ml: e.target.checked },
                          })
                        }
                        className="h-3.5 w-3.5 rounded accent-purple-500"
                      />
                      <span>[ml] Kompress-v2 HF model simulation (deduplikasi semantik obrolan)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Caveman (Concise Output Compression) */}
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Kompresi keluaran LLM</span>
                    <a
                      href="https://github.com/JuliusBrussee/caveman"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      (Caveman)
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </label>
                </div>
                <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Prompt sistem gaya ringkas → ~65% lebih sedikit token keluaran (hingga 87%)
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <Segmented
                  value={tokenOpt.cavemanMode}
                  onChange={(val) => setTokenOpt({ ...tokenOpt, cavemanMode: val })}
                  options={[
                    { id: 'off', label: 'Standar (Off)', hint: 'Respon normal dengan paragraf penjelasan lengkap' },
                    { id: 'terse', label: 'Terse Profesional (~50% Save)', hint: 'Ringkas, padat, tanpa basa-basi pembuka/penutup' },
                    { id: 'caveman', label: 'Caveman Ekstrem (~80% Save)', hint: 'Drop articles, fragments OK, gaya telegram hemat biaya' },
                  ]}
                />
              </div>
            </div>

            {/* 4. Ponytail (Lazy Senior Developer) */}
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ponytailEnabled"
                    checked={tokenOpt.ponytailEnabled}
                    onChange={(e) => setTokenOpt({ ...tokenOpt, ponytailEnabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="ponytailEnabled" className="text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5">
                    <span>Developer senior malas</span>
                    <a
                      href="https://github.com/DietrichGebert/ponytail"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      (Ponytail)
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </label>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ladder enforced: stdlib/native first
                </span>
              </div>

              <p className="text-[11px] text-neutral-400 pl-6 leading-relaxed">
                Membimbing model ke kode minimal: YAGNI (You Aren&apos;t Gonna Need It), gunakan ulang library standar dan API native Next.js/PostgreSQL sebelum menyarankan library baru, serta hapus kode mati daripada menambah lapisan abstraksi.
              </p>
            </div>

            {/* 5. Custom System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">Custom System Prompt</label>
                <span className="text-[11px] text-neutral-400">
                  Appends your own instruction to every request, independently of the savers above
                </span>
              </div>
              <textarea
                rows={3}
                value={tokenOpt.customSystemPrompt}
                onChange={(e) => setTokenOpt({ ...tokenOpt, customSystemPrompt: e.target.value })}
                placeholder="Tambahkan arahan persona khusus tim Anda, aturan styling kustom, atau instruksi domain..."
                className="w-full rounded-xl bg-black/50 border border-white/15 p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400 leading-relaxed font-mono"
              />
            </div>
          </Panel>
        </div>
      )}

      {/* =========================================================================
          TAB: MEMORI & PREFERENSI PENGGUNA (ChatGPT / Gemini Persistent Memory)
      ========================================================================= */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Memori &amp; Preferensi Pengguna (Persisten Server)</h3>
                  <p className="text-[11px] text-neutral-400">
                    Disimpan di basis data PostgreSQL. AI secara otomatis membawa memori ini pada setiap sesi percakapan dan riset artikel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchMemories}
                disabled={memoriesLoading}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-all self-start sm:self-auto"
                title="Muat ulang memori dari PostgreSQL"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${memoriesLoading ? 'animate-spin text-purple-400' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3.5 text-xs text-purple-200 leading-relaxed">
              💡 <strong>Prinsip Context Decoupling:</strong> Preferensi penulisan, persona merek, dan batasan konten disimpan sebagai memori persisten di tingkat pengguna. Memori ini diformat sebagai prefix instruksi sistem terpisah agar tidak mengunci context window model.
            </div>

            {/* List of active memories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono">
                  Memori Aktif ({memories.length})
                </h4>
              </div>

              {memories.length === 0 && !memoriesLoading && (
                <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center text-xs text-neutral-400">
                  Belum ada memori yang tersimpan. Tambahkan preferensi persona, gaya bahasa, atau instruksi editorial di bawah ini.
                </div>
              )}

              {memories.map((mem) => (
                <div
                  key={mem.id || mem.key}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-semibold">
                      {mem.key}
                    </span>
                    <p className="text-neutral-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {mem.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(mem.id || mem.key)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 transition-colors"
                    title="Hapus memori ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form to add memory */}
            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono">
                Tambah Memori Baru
              </h4>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  placeholder="Kunci (contoh: gaya_bahasa, audiens_b2b, aturan_cta, standar_intro)"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400 font-mono"
                />
                <textarea
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  placeholder="Instruksi memori (contoh: Selalu gunakan nada editorial profesional, gunakan sudut pandang arsitektur perangkat lunak modern, dan hindari kata klise)"
                  rows={2}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400 leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleSaveMemory}
                  disabled={!newMemoryKey.trim() || !newMemoryContent.trim()}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan ke Memori Server</span>
                </button>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* =========================================================================
          TAB 3: KATALOG TOOLS NATIVE (Standar 9Router)
      ========================================================================= */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Katalog Tools Native &amp; Ekosistem Skill</h3>
                  <p className="text-[11px] text-neutral-400">
                    Sesuai spesifikasi 9router: tools OpenAI-compatible dengan verifikasi parameter dan zero-mock policy
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setToolsCollapsed(!toolsCollapsed)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 px-3 text-xs font-semibold text-white transition-colors"
              >
                {toolsCollapsed ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 text-accent-400" />
                    <span>Tampilkan Katalog ({SEGIA_TOOLS_CATALOG.length} Tools)</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 text-accent-400" />
                    <span>Sembunyikan Katalog</span>
                  </>
                )}
              </button>
            </div>

            {!toolsCollapsed && (
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      value={searchTool}
                      onChange={(e) => setSearchTool(e.target.value)}
                      placeholder="Cari nama tool / deskripsi..."
                      className="w-full h-8 rounded-lg bg-black/40 border border-white/15 px-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {(['all', 'database', 'seo', 'serp', 'editorial', 'system'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                          categoryFilter === cat
                            ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold'
                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTools.map((t) => {
                    const isEnabled = enabledTools.includes(t.id)
                    return (
                      <div
                        key={t.id}
                        className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                          isEnabled
                            ? 'border-white/[0.08] bg-black/30'
                            : 'border-white/[0.04] bg-black/10 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => {
                                if (isEnabled) {
                                  setEnabledTools(enabledTools.filter((id) => id !== t.id))
                                } else {
                                  setEnabledTools([...enabledTools, t.id])
                                }
                              }}
                              className="h-3.5 w-3.5 rounded accent-sky-500 cursor-pointer"
                            />
                            <div className="font-semibold text-white text-xs truncate">{t.label}</div>
                          </div>
                          <span className="rounded bg-white/10 text-neutral-300 font-mono text-[10px] px-1.5 py-0.2 shrink-0">
                            {t.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>

                        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedParamTool(t)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:underline"
                          >
                            <Info className="h-3 w-3" />
                            <span>{t.parameters.length} Parameter (Lihat Spesifikasi)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExecuteToolTest(t.id)}
                            disabled={testingToolId === t.id}
                            className="inline-flex items-center gap-1 rounded bg-white/10 hover:bg-white/15 px-2 py-0.5 text-[11px] font-mono text-white transition-colors disabled:opacity-40"
                          >
                            <Play className={`h-2.5 w-2.5 transition-all ${testingToolId === t.id ? 'fill-sky-400 text-sky-400 scale-110 animate-pulse' : ''}`} />
                            <span>Uji Tool</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {toolExecutionResult && (
                  <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-emerald-400 font-semibold">
                        Eksekusi Tool Live: {toolExecutionResult.label} ({toolExecutionResult.durationMs}ms)
                      </span>
                      <button
                        type="button"
                        onClick={() => setToolExecutionResult(null)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-black/60 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-48">
                      {JSON.stringify(toolExecutionResult.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* =========================================================================
          TAB 4: LOG AUDIT & DEBUG
      ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Log Audit Prompt &amp; Debugging AI</h3>
                  <p className="text-[11px] text-neutral-400">
                    Inspeksi riwayat prompt pengguna, tool calls yang dipanggil, latensi, serta status eksekusi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportLogsAsJson()}
                  disabled={promptLogs.length === 0}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 px-3 text-xs font-semibold text-sky-300 transition-colors disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Ekspor JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportLogsAsCsv()}
                  disabled={promptLogs.length === 0}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 text-xs font-semibold text-emerald-300 transition-colors disabled:opacity-40"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Ekspor CSV</span>
                </button>

                <IconButton
                  icon={Trash2}
                  label="Hapus Log"
                  size="sm"
                  tone="danger"
                  onClick={() => {
                    if (confirm('Bersihkan semua riwayat log audit prompt?')) {
                      clearAiPromptLogs()
                      reloadData()
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  placeholder="Cari isi prompt / respon..."
                  className="w-full h-8 rounded-lg bg-black/40 border border-white/15 px-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {(['all', 'success', 'error'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLogStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                      logStatusFilter === st
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 font-semibold'
                        : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'SEMUA' : st === 'success' ? 'BERHASIL' : 'GAGAL'}
                  </button>
                ))}
              </div>
            </div>

            {filteredLogs.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/30">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-mono uppercase text-neutral-400">
                    <tr>
                      <th className="px-4 py-2.5">Waktu</th>
                      <th className="px-4 py-2.5">Model &amp; Konteks</th>
                      <th className="px-4 py-2.5">Prompt Pengguna</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono text-white text-[11px] font-semibold">{log.model}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {log.contextTab || 'studio'} • {log.latencyMs ? `${log.latencyMs}ms` : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs sm:max-w-md truncate">
                          <div className="text-white truncate font-medium">{log.userPrompt}</div>
                          {log.errorMessage ? (
                            <div className="text-[11px] text-rose-400 truncate mt-0.5 font-mono">
                              Error: {log.errorMessage}
                            </div>
                          ) : (
                            <div className="text-[11px] text-neutral-400 truncate mt-0.5">{log.assistantReply}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Sukses</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-mono">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectingLog(log)}
                            className="inline-flex items-center gap-1 rounded bg-white/10 hover:bg-white/15 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Inspeksi</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-xs text-neutral-400">
                Belum ada log prompt yang tercatat. Prompt yang Anda kirimkan ke AI Copilot akan otomatis diarsipkan di sini.
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: TAMBAH KUNCI TUNGGAL
      ========================================================================= */}
      {addKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  Tambah Kunci API — {selectedProvider === 'google' ? 'Google Gemini' : 'OpenRouter'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddKeyModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Nama / Label</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Misal: Production Key, Backup Key #1"
                  className="w-full h-9 rounded-lg bg-black/60 border border-white/15 px-3 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Kunci API</label>
                <div className="relative">
                  <input
                    type={newKeyShow ? 'text' : 'password'}
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder={selectedProvider === 'google' ? 'AIzaSy...' : 'sk-or-v1-...'}
                    className="w-full h-9 rounded-lg bg-black/60 border border-white/15 pl-3 pr-10 text-white font-mono focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setNewKeyShow(!newKeyShow)}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                  >
                    {newKeyShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Prioritas (#)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={newKeyPriority}
                    onChange={(e) => setNewKeyPriority(parseInt(e.target.value) || 1)}
                    className="w-full h-9 rounded-lg bg-black/60 border border-white/15 px-3 text-white font-mono focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Nama Pool (Opsional)</label>
                  <input
                    type="text"
                    value={newKeyPool}
                    onChange={(e) => setNewKeyPool(e.target.value)}
                    placeholder="Misal: cloudflare-relay"
                    className="w-full h-9 rounded-lg bg-black/60 border border-white/15 px-3 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Proxy Relay / Base URL (Opsional)</label>
                <input
                  type="text"
                  value={newKeyProxyUrl}
                  onChange={(e) => setNewKeyProxyUrl(e.target.value)}
                  placeholder="https://cloudflare-relay.adwk-project.workers.dev"
                  className="w-full h-9 rounded-lg bg-black/60 border border-white/15 px-3 text-white font-mono text-[11px] focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newKeySetActive"
                  checked={newKeySetActive}
                  onChange={(e) => setNewKeySetActive(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-sky-500 cursor-pointer"
                />
                <label htmlFor="newKeySetActive" className="text-neutral-300 cursor-pointer text-xs">
                  Jadikan kunci aktif langsung untuk penyedia {selectedProvider}
                </label>
              </div>

              {newKeyError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                  {newKeyError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setAddKeyModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newKeyValue.trim()) {
                    setNewKeyError('Kunci API tidak boleh kosong.')
                    return
                  }
                  saveApiKeyItem({
                    name: newKeyName.trim() || 'Production Key',
                    provider: selectedProvider,
                    key: newKeyValue.trim(),
                    priority: newKeyPriority,
                    proxyUrl: newKeyProxyUrl.trim(),
                    pool: newKeyPool.trim(),
                    isActive: newKeySetActive,
                  })
                  reloadData()
                  setAddKeyModalOpen(false)
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-sm"
              >
                Simpan Kunci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: TAMBAH KUNCI MASSAL
      ========================================================================= */}
      {bulkAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-accent-400" />
                <h3 className="text-sm font-bold text-white">
                  Tambah Kunci Massal — {selectedProvider === 'google' ? 'Google Gemini' : 'OpenRouter'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBulkAddModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-400 leading-relaxed">
                Satu kunci per baris. Format: <code className="text-sky-300 font-mono">name|apiKey</code> atau cukup <code className="text-sky-300 font-mono">apiKey</code> (auto-named by index).
              </p>

              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`name1|sk-key1\nname2|sk-key2\nsk-key-only-auto-named`}
                className="w-full rounded-xl bg-black/60 border border-white/15 p-3 font-mono text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Default Pool Tag</label>
                  <input
                    type="text"
                    value={bulkPool}
                    onChange={(e) => setBulkPool(e.target.value)}
                    placeholder="cloudflare-relay"
                    className="w-full h-8 rounded-lg bg-black/60 border border-white/15 px-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Default Proxy URL (Opsional)</label>
                  <input
                    type="text"
                    value={bulkProxyUrl}
                    onChange={(e) => setBulkProxyUrl(e.target.value)}
                    placeholder="https://cloudflare-relay..."
                    className="w-full h-8 rounded-lg bg-black/60 border border-white/15 px-2.5 text-xs text-white font-mono text-[11px] focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {bulkNotice && (
                <div
                  className={`rounded-lg p-2.5 text-xs border ${
                    bulkNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/25 text-red-300'
                  }`}
                >
                  {bulkNotice.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setBulkAddModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!bulkText.trim()) {
                    setBulkNotice({ message: 'Masukkan setidaknya satu baris kunci API.', type: 'error' })
                    return
                  }
                  const res = bulkImportApiKeys({
                    provider: selectedProvider,
                    text: bulkText,
                    proxyUrl: bulkProxyUrl,
                    pool: bulkPool,
                  })
                  if (res.added > 0) {
                    setBulkNotice({
                      message: `Berhasil menambahkan ${res.added} kunci API!`,
                      type: 'success',
                    })
                    setBulkText('')
                    reloadData()
                    setTimeout(() => setBulkAddModalOpen(false), 1500)
                  } else {
                    setBulkNotice({
                      message: `Tidak ada kunci yang ditambahkan. ${res.errors.join('; ')}`,
                      type: 'error',
                    })
                  }
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-sm"
              >
                Impor Kunci Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: SPESIFIKASI PARAMETER TOOL
      ========================================================================= */}
      {selectedParamTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{selectedParamTool.label}</h3>
                  <span className="font-mono text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded">
                    {selectedParamTool.name}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">{selectedParamTool.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParamTool(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white">Daftar Parameter ({selectedParamTool.parameters.length}):</h4>
              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-mono uppercase text-neutral-400">
                    <tr>
                      <th className="px-3 py-2">Parameter</th>
                      <th className="px-3 py-2">Tipe</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Default</th>
                      <th className="px-3 py-2">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {selectedParamTool.parameters.map((param) => (
                      <tr key={param.name}>
                        <td className="px-3 py-2 font-mono text-sky-300 font-semibold">{param.name}</td>
                        <td className="px-3 py-2 font-mono text-neutral-400">{param.type}</td>
                        <td className="px-3 py-2">
                          {param.required ? (
                            <span className="text-[10px] font-mono text-amber-400 font-bold">Wajib</span>
                          ) : (
                            <span className="text-[10px] font-mono text-neutral-500">Opsional</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-neutral-400">
                          {param.defaultValue !== undefined ? String(param.defaultValue) : '-'}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-neutral-300 leading-relaxed">
                          {param.description}
                          {param.allowedValues && (
                            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                              Pilihan: [{param.allowedValues.join(', ')}]
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setSelectedParamTool(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: LOG AUDIT INSPECTOR
      ========================================================================= */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Inspeksi Log Audit Prompt AI</h3>
                <div className="font-mono text-[11px] text-neutral-400 mt-0.5">
                  ID: {inspectingLog.id} • {new Date(inspectingLog.timestamp).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-400">User Prompt:</label>
                <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-white font-mono mt-1 whitespace-pre-wrap">
                  {inspectingLog.userPrompt}
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-400">Assistant Reply:</label>
                <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-neutral-200 mt-1 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {inspectingLog.assistantReply}
                </div>
              </div>

              {inspectingLog.errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300">
                  <div className="font-semibold text-rose-400 text-xs mb-1">Pesan Error / Diagnostik:</div>
                  <div className="font-mono text-[11px] whitespace-pre-wrap">{inspectingLog.errorMessage}</div>
                </div>
              )}

              {inspectingLog.failoverHistory && inspectingLog.failoverHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-amber-400">Riwayat Failover & Model Cascade:</label>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {inspectingLog.failoverHistory.length} model dicoba
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/60 border border-amber-500/20 space-y-2">
                    {inspectingLog.failoverHistory.map((fb, idx) => (
                      <div key={idx} className="font-mono text-[11px] border-b border-white/[0.06] pb-2 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="font-semibold text-white">#{idx + 1} {fb.provider.toUpperCase()} / {fb.model}</span>
                          <span className="text-neutral-500 text-[10px]">{fb.durationMs}ms</span>
                        </div>
                        <div className="text-rose-400/90 mt-0.5 whitespace-pre-wrap">{fb.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-neutral-400">Payload Mentah (Raw JSON):</label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(inspectingLog, null, 2))
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Salin JSON</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-black/70 border border-white/10 text-neutral-300 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(inspectingLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
