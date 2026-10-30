'use client'

export interface AiPromptLog {
  id: string
  timestamp: string
  provider: string
  model: string
  latencyMs?: number
  contextTab?: string
  userPrompt: string
  assistantReply: string
  toolCalls?: {
    toolName: string
    durationMs: number
    status: string
    input?: any
    output?: any
  }[]
  status: 'success' | 'error'
  errorMessage?: string
  failoverHistory?: Array<{
    model: string
    provider: string
    error: string
    durationMs: number
  }>
  debugInfo?: Record<string, any>
  meta?: Record<string, any>
}

const STORAGE_LOGS_KEY = 'segiatech_ai_prompt_logs'
const MAX_LOGS = 200

export function getAiPromptLogs(): AiPromptLog[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (_) {
    return []
  }
}

export function recordAiPromptLog(
  data: Omit<AiPromptLog, 'id' | 'timestamp'>
): AiPromptLog {
  const currentLogs = getAiPromptLogs()
  const newLog: AiPromptLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...data,
  }

  const updatedLogs = [newLog, ...currentLogs].slice(0, MAX_LOGS)

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updatedLogs))
    } catch (_) {}
  }

  return newLog
}

export function clearAiPromptLogs(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_LOGS_KEY)
    } catch (_) {}
  }
}

export function exportLogsAsJson(logs?: AiPromptLog[]): void {
  const dataToExport = logs || getAiPromptLogs()
  const jsonStr = JSON.stringify(dataToExport, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `segiatech-ai-prompt-audit-log-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportLogsAsCsv(logs?: AiPromptLog[]): void {
  const dataToExport = logs || getAiPromptLogs()
  if (dataToExport.length === 0) return

  const headers = ['ID', 'Waktu', 'Provider', 'Model', 'Latensi (ms)', 'Konteks Tab', 'Status', 'Prompt User', 'Jawaban AI', 'Tools Dijalankan']

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""'
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    return `"${str.replace(/"/g, '""')}"`
  }

  const rows = dataToExport.map((log) => [
    escapeCsv(log.id),
    escapeCsv(log.timestamp),
    escapeCsv(log.provider),
    escapeCsv(log.model),
    escapeCsv(log.latencyMs ?? ''),
    escapeCsv(log.contextTab ?? 'overview'),
    escapeCsv(log.status),
    escapeCsv(log.userPrompt),
    escapeCsv(log.assistantReply),
    escapeCsv(log.toolCalls ? log.toolCalls.map((t) => t.toolName).join('; ') : ''),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `segiatech-ai-prompt-audit-log-${dateStr}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
