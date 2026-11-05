'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  Bot,
  Sparkles,
  Send,
  X,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  FileText,
  Clock,
  Shield,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
  Sliders,
  ExternalLink,
  PenSquare,
  Maximize2,
  Minimize2,
  PanelRight,
  MessageSquare,
  Settings,
  Key,
  Eye,
  EyeOff,
  Briefcase,
  Boxes,
  Image as ImageIcon,
  Megaphone,
  Target,
  ShieldCheck,
  Gauge,
  ArrowRightLeft,
  History,
  Download,
  Server,
  Users,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Brain,
  KeyRound,
} from 'lucide-react'
import { ToolCallExecution } from '@/lib/ai/tool-definitions'
import { GeminiToolCallPill } from './GeminiToolCallPill'
import { StudioAiSettings } from './StudioAiSettings'
import { recordAiPromptLog } from '@/lib/ai/audit-logger'
import {
  getActiveApiKey,
  getStoredAiCredentials,
  triggerAiKeyPrompt,
  AiModelItem,
  getSelectedAiModels,
  detectModelCapabilities,
} from '@/lib/ai/key-manager'

export interface AgenticStep {
  step?: number
  name?: string
  label?: string
  type?: 'thought' | 'tool_call' | 'tool_result' | 'output' | string
  status?: string
  thought?: string
  details?: string
  toolName?: string
  toolInput?: any
  toolOutput?: any
  durationMs?: number
}

export interface AgenticReport {
  actionTitle?: string
  reportId?: string
  intent?: string
  context?: string
  targetContext?: string
  executionTimeMs?: number
  durationMs?: number
  status?: string
  confidenceScore?: number
  steps: AgenticStep[]
  metrics?: { label: string; value: string | number; change?: string; trend?: 'up' | 'down' | 'neutral' }[]
  keyFindings?: string[]
  findings?: { title: string; detail: string; severity?: 'info' | 'warning' | 'success' | 'critical' }[]
  recommendedAction?: string
}

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  text?: string
  thoughts?: string
  toolCalls?: ToolCallExecution[]
  agenticReport?: AgenticReport
  proposedChanges?: any
  isStreaming?: boolean
  streamingStatus?: string
  createdAt?: string
  meta?: {
    provider?: string
    model?: string
    latencyMs?: number
    failoverHistory?: Array<{ model: string; provider: string; error: string; durationMs: number }>
    [key: string]: any
  }
  timestamp?: string
}

export interface AiChatStreamEvent {
  type: 'status' | 'thought' | 'tool_start' | 'tool_result' | 'content_chunk' | 'proposed_changes' | 'error' | 'done'
  message?: string
  chunk?: string
  name?: string
  input?: any
  output?: any
  durationMs?: number
  errorType?: 'QUOTA_EXCEEDED' | 'RATE_LIMITED'
  quotaError?: any
  limitZero?: boolean
  provider?: string
  model?: string
  reply?: string
  proposedChanges?: any
  report?: any
  sessionId?: string
  thoughts?: string
  toolCalls?: ToolCallExecution[]
  meta?: any
  autoApply?: boolean
}

/**
 * Robust line-by-line NDJSON decoder for live AI response streaming
 */
export async function processNdjsonStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: AiChatStreamEvent) => void
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const event: AiChatStreamEvent = JSON.parse(trimmed)
        onEvent(event)
      } catch (err) {
        console.warn('[processNdjsonStream] Failed to parse NDJSON line:', trimmed, err)
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event: AiChatStreamEvent = JSON.parse(buffer.trim())
      onEvent(event)
    } catch (err) { console.warn("[observable error]:", err) }
  }
}

/**
 * Live Collapsible Thinking Bar with subtle pulse during active streaming
 */
export function LiveThinkingBar({
  thoughts,
  isStreaming,
}: {
  thoughts: string
  isStreaming?: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)

  if (!thoughts) return null

  return (
    <div
      data-testid="live-thinking-bar"
      className={`mb-2.5 rounded-xl border transition-all overflow-hidden text-xs ${
        isStreaming
          ? 'border-[#FFD600]/40 bg-[#FFD600]/[0.03] shadow-[0_0_12px_rgba(255, 214, 0,0.1)]'
          : 'border-white/10 bg-black/40'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-between text-left transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Brain className={`w-3.5 h-3.5 text-[#FFD600] ${isStreaming ? 'animate-pulse' : ''}`} />
          <span className="font-semibold text-white text-[11px] truncate">
            {isStreaming ? 'Proses Berpikir Model (Thinking Live)...' : 'Catatan Pemikiran Model (Reasoning)'}
          </span>
          {isStreaming && (
            <span className="px-1.5 py-0.2 rounded bg-[#FFD600]/20 text-[#FFD600] font-mono text-[9px] border border-[#FFD600]/30 animate-pulse">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="text-[10px] font-mono">{isOpen ? 'Tutup' : 'Lihat'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#FFD600]" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-2.5 border-t border-white/5 bg-black/50 font-mono text-[10px] text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
          {thoughts}
          {isStreaming && (
            <span
              data-testid="streaming-cursor-thought"
              className="inline-block text-[#FFD600] font-mono animate-pulse ml-0.5 select-none font-bold"
            >
              ▌
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export interface InteractiveWarningBannerProps {
  quotaError: any
  currentProvider: 'google' | 'openrouter'
  onSwitchProvider: () => void
  onSwitchToFreeModel: () => void
  onUpdateKey: () => void
  onOpenSettings: () => void
  onDismiss: () => void
}

/**
 * Interactive Warning Banner docked at the top of the chat panel for 429 Rate Limit & Quota Exhaustion
 */
export function InteractiveWarningBanner({
  quotaError,
  currentProvider,
  onSwitchProvider,
  onSwitchToFreeModel,
  onUpdateKey,
  onOpenSettings,
  onDismiss,
}: InteractiveWarningBannerProps) {
  if (!quotaError) return null

  const isLimitZero = Boolean(quotaError.isLimitZero)
  const isGoogle = currentProvider === 'google'

  return (
    <div
      data-testid="quota-warning-banner"
      className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/80 via-rose-900/50 to-amber-950/40 border-2 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.25)] text-xs text-rose-100 space-y-3 relative overflow-hidden backdrop-blur-md animate-fadeIn"
    >
      {/* Radiant ambient glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl" />

      {/* Header bar with Icon, Title, and Dismiss button */}
      <div className="flex items-center justify-between gap-2 border-b border-rose-500/30 pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shrink-0 text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <h4 className="font-bold text-sm text-white">
            Batas Kuota / Rate Limit Tercapai
          </h4>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          data-testid="banner-dismiss"
          className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Tutup peringatan kuota"
          aria-label="Tutup peringatan kuota"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Diagnostic message explaining failover was halted */}
      <div className="space-y-1.5 relative z-10">
        <p className="text-xs text-rose-200/90 leading-relaxed">
          {quotaError.message ||
            'Sistem menghentikan failover otomatis untuk mencegah penundaan siklus model. Kuota API atau batas laju request (429 Rate Limit) telah tercapai.'}
        </p>

        {/* Diagnostic Meta Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 text-rose-300">
            Provider: {quotaError.provider || currentProvider}
          </span>
          {quotaError.model && (
            <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 text-rose-300 truncate max-w-[200px]">
              Model: {quotaError.model}
            </span>
          )}
          {isLimitZero && (
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold border border-rose-400 animate-pulse">
              Limit 0 (Kredit Habis)
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Failover Dihentikan
          </span>
        </div>
      </div>

      {/* 4 Instant 1-Click Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 relative z-10">
        {/* 1. Beralih Provider */}
        <button
          type="button"
          data-testid="banner-switch-provider"
          onClick={onSwitchProvider}
          className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer text-center"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isGoogle ? 'Beralih ke OpenRouter' : 'Beralih ke Google AI Studio'}
          </span>
        </button>

        {/* 2. Pakai Model Gratis */}
        <button
          type="button"
          data-testid="banner-free-model"
          onClick={onSwitchToFreeModel}
          className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-rose-100 border border-rose-400/30 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-center"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="truncate">Pakai Model Gratis</span>
        </button>

        {/* 3. Perbarui API Key */}
        <button
          type="button"
          data-testid="banner-update-key"
          onClick={onUpdateKey}
          className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-rose-100 border border-rose-400/30 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-center"
        >
          <KeyRound className="w-3.5 h-3.5 text-rose-300 shrink-0" />
          <span className="truncate">Perbarui API Key</span>
        </button>

        {/* 4. Pengaturan AI */}
        <button
          type="button"
          data-testid="banner-ai-settings"
          onClick={onOpenSettings}
          className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-rose-100 border border-rose-400/30 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-center"
        >
          <Settings className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
          <span className="truncate">Pengaturan AI</span>
        </button>
      </div>
    </div>
  )
}


function parseMarkdownInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g
  const parts = text.split(regex)

  parts.forEach((part, i) => {
    if (!part) return
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      tokens.push(
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      tokens.push(
        <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-accent-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      )
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      tokens.push(
        <em key={i} className="italic text-neutral-300">
          {part.slice(1, -1)}
        </em>
      )
    } else {
      tokens.push(part)
    }
  })

  return tokens
}

export function getFriendlyToolLabel(name: string): string {
  switch (name) {
    case 'research_topic_intent':
      return '🎯 Tahap 1: Analisis Intent & Cakupan Topik'
    case 'web_search_multi_query':
      return '🔍 Tahap 2: Riset Multi-Sumber (Web & Katalog)'
    case 'fetch_web_evidence':
      return '📄 Tahap 2 & 3: Ekstraksi Bukti Faktual'
    case 'record_evidence_dossier':
      return '📑 Tahap 3: Verifikasi Evidence Dossier'
    case 'gap_analysis_and_cross_check':
      return '⚖️ Tahap 4: Analisis Gap & Cross-Check'
    case 'inspect_active_article':
      return '👁️ Inspeksi Konten Aktif di Editor'
    case 'analyze_keyword_and_readability':
      return '📊 Kalkulasi Metrik & Keterbacaan'
    case 'apply_article_draft_or_metadata':
      return '✍️ Tahap 5: Pembuatan / Pembaruan Draf'
    case 'edit_article_segment':
      return '✏️ Perbaikan Segmen Kalimat'
    case 'independent_seo_audit_gate':
      return '🛡️ Tahap 6: Audit Kelulusan Publikasi Yoast SEO'
    default:
      return `🛠️ Tool: ${name}`
  }
}

export function renderFormattedToolOutput(name: string, output: any) {
  if (!output) return null

  // 1. Evidence Dossier Display
  if (name === 'record_evidence_dossier' && Array.isArray(output.dossier)) {
    return (
      <div className="space-y-1.5 mt-1 font-sans">
        <div className="flex items-center gap-2 text-[10px] text-purple-300 font-mono">
          <span>Total Bukti: {output.totalClaims}</span>
          <span>•</span>
          <span>Terverifikasi: {output.verifiedClaimsCount}</span>
          <span>•</span>
          <span>Keyakinan: {output.averageConfidence}</span>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {output.dossier.map((d: any, i: number) => (
            <div key={i} className="p-2 rounded bg-black/50 border border-white/5 space-y-1 text-[10px]">
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-white">{d.claim}</span>
                <span className={`px-1 rounded text-[9px] font-mono ${d.verificationStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {d.verificationStatus}
                </span>
              </div>
              {d.supportingQuote && (
                <p className="text-neutral-400 italic text-[9px]">"{d.supportingQuote}"</p>
              )}
              {d.sourceUrl && (
                <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-info hover:underline flex items-center gap-1 text-[9px] font-mono">
                  <span>{d.sourceUrl}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 2. Multi-query Search Results
  if (name === 'web_search_multi_query' && Array.isArray(output.results)) {
    return (
      <div className="space-y-1.5 mt-1 font-sans">
        <div className="text-[10px] text-info-300 font-mono">
          Ditemukan {output.totalResultsFound || output.results.length} sumber kredibel
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {output.results.map((r: any, i: number) => (
            <div key={i} className="p-1.5 rounded bg-black/40 border border-white/5 text-[10px]">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-info-300 hover:underline block truncate">
                {r.title}
              </a>
              <p className="text-neutral-400 text-[9px] line-clamp-2 mt-0.5">{r.snippet}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 3. SEO Audit & Readability Results
  if (name === 'independent_seo_audit_gate' || name === 'analyze_keyword_and_readability') {
    const score = output.seoScore ?? 100
    const m = output.metrics || output
    return (
      <div className="space-y-1.5 mt-1 font-sans">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold text-neutral-300">Skor Yoast SEO &amp; Kelulusan:</span>
          <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${output.gatePassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {output.gatePassed ? 'LULUS GATE' : 'PERLU TINJAUAN'} ({score}/100)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-neutral-300 bg-black/40 p-1.5 rounded">
          <div>Kata: <strong className="text-white">{m.wordCount}</strong></div>
          <div>Kepadatan: <strong className="text-white">{m.keywordDensityPercent}</strong></div>
          <div>Kalimat Pasif: <strong className="text-white">{m.passiveVoicePercent}</strong></div>
          <div>Kata Transisi: <strong className="text-white">{m.transitionWordsPercent}</strong></div>
        </div>
        {output.violations && output.violations.length > 0 && (
          <div className="space-y-0.5 text-[9px] text-amber-300">
            {output.violations.map((v: string, i: number) => (
              <div key={i}>⚠️ {v}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <pre className="p-2 rounded bg-black/40 text-neutral-300 overflow-x-auto max-h-40 text-[9px]">
      {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
    </pre>
  )
}

export function AgenticReActSteps({
  thoughts,
  toolCalls,
  report,
}: {
  thoughts?: string
  toolCalls?: ToolCallExecution[]
  report?: AgenticReport
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({})

  const toggleStep = (idx: number) => {
    setOpenSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const unifiedSteps: Array<{
    id: string
    stepNum: number
    type: 'thought' | 'tool_call'
    name: string
    label: string
    thought?: string
    input?: any
    output?: any
    durationMs?: number
    status?: string
  }> = []

  const rawThought = thoughts || report?.steps?.find((s) => s.type === 'thought')?.thought
  if (rawThought) {
    unifiedSteps.push({
      id: 'step_thought',
      stepNum: 1,
      type: 'thought',
      name: 'Reasoning & Intent Analysis',
      label: 'Analisis Search Intent & Pola Pikir (Thinking)',
      thought: rawThought,
      status: 'success',
    })
  }

  if (report?.steps && report.steps.length > 0) {
    report.steps.forEach((s, idx) => {
      if (s.type === 'thought') return
      unifiedSteps.push({
        id: `step_${idx}`,
        stepNum: unifiedSteps.length + 1,
        type: 'tool_call',
        name: s.toolName || s.name || 'tool',
        label: getFriendlyToolLabel(s.toolName || s.name || ''),
        input: s.toolInput,
        output: s.toolOutput || s.details,
        durationMs: s.durationMs,
        status: s.status || 'success',
      })
    })
  } else if (toolCalls && toolCalls.length > 0) {
    toolCalls.forEach((tc, idx) => {
      unifiedSteps.push({
        id: `tc_${idx}`,
        stepNum: unifiedSteps.length + 1,
        type: 'tool_call',
        name: tc.toolName,
        label: getFriendlyToolLabel(tc.toolName),
        input: tc.input,
        output: tc.output,
        durationMs: tc.durationMs,
        status: tc.status || 'success',
      })
    })
  }

  if (unifiedSteps.length === 0) return null

  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-black/40 overflow-hidden text-xs">
      {/* Accordion Master Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-between text-left transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-500/20 border border-accent-400/30 text-accent-300">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-semibold text-white text-[11px] truncate">
            Alur Riset &amp; Eksekusi Agen ({unifiedSteps.length} Tahap)
          </span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] border border-emerald-500/30">
            Terverifikasi
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="text-[10px] font-mono">{isExpanded ? 'Tutup' : 'Lihat Detail'}</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-accent-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Steps Timeline */}
      {isExpanded && (
        <div className="p-2.5 space-y-2 border-t border-white/10 bg-[var(--studio-bg)]">
          {unifiedSteps.map((step, sIdx) => {
            const isOpen = Boolean(openSteps[sIdx])
            return (
              <div key={step.id} className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleStep(sIdx)}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-mono text-accent-300">
                      {step.stepNum}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-200 truncate">
                      {step.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                    {step.durationMs ? <span>{step.durationMs}ms</span> : null}
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-2.5 border-t border-white/5 space-y-2 text-[10px] bg-black/60 font-mono">
                    {step.type === 'thought' && step.thought && (
                      <div className="text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                        {step.thought}
                      </div>
                    )}

                    {step.type === 'tool_call' && (
                      <>
                        {step.input && Object.keys(step.input).length > 0 && (
                          <div className="space-y-1">
                            <span className="text-neutral-400 font-semibold uppercase">Parameter Input:</span>
                            <pre className="p-2 rounded bg-white/[0.03] text-neutral-300 overflow-x-auto max-h-32">
                              {JSON.stringify(step.input, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.output && (
                          <div className="space-y-1">
                            <span className="text-emerald-400 font-semibold uppercase">Hasil Eksekusi &amp; Bukti:</span>
                            {renderFormattedToolOutput(step.name, step.output)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockLines: string[] = []

  const flushList = (key: number) => {
    if (!currentList) return null
    const list = currentList
    currentList = null
    if (list.type === 'ul') {
      return (
        <ul key={`ul-${key}`} className="my-2 pl-4 list-disc space-y-1 text-neutral-200">
          {list.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseMarkdownInline(item)}
            </li>
          ))}
        </ul>
      )
    } else {
      return (
        <ol key={`ol-${key}`} className="my-2 pl-4 list-decimal space-y-1 text-neutral-200">
          {list.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseMarkdownInline(item)}
            </li>
          ))}
        </ol>
      )
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (currentList) elements.push(flushList(i))
      if (inCodeBlock) {
        if (!codeBlockLang.includes('article-changes')) {
          elements.push(
            <pre
              key={`code-${i}`}
              className="my-2 p-3 rounded-xl bg-[var(--studio-bg)] border border-white/10 text-neutral-300 font-mono text-[11px] overflow-x-auto"
            >
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          )
        }
        inCodeBlock = false
        codeBlockLang = ''
        codeBlockLines = []
      } else {
        inCodeBlock = true
        codeBlockLang = line.slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/)
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) elements.push(flushList(i))
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(ulMatch[1])
      continue
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) elements.push(flushList(i))
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(olMatch[1])
      continue
    }

    if (currentList) {
      elements.push(flushList(i))
    }

    if (!line.trim()) {
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-xs font-bold text-white mt-3 mb-1 tracking-tight">
          {parseMarkdownInline(line.slice(4))}
        </h4>
      )
      continue
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-sm font-bold text-white mt-3.5 mb-1.5 tracking-tight">
          {parseMarkdownInline(line.slice(3))}
        </h3>
      )
      continue
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-sm font-extrabold text-white mt-4 mb-2 tracking-tight">
          {parseMarkdownInline(line.slice(2))}
        </h2>
      )
      continue
    }

    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 pl-3 py-1 border-l-2 border-accent-400 bg-white/[0.02] rounded-r-lg text-neutral-300 italic"
        >
          {parseMarkdownInline(line.slice(2))}
        </blockquote>
      )
      continue
    }

    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-neutral-200">
        {parseMarkdownInline(line)}
      </p>
    )
  }

  if (currentList) {
    elements.push(flushList(lines.length))
  }

  return <div className="space-y-1 text-inherit">{elements}</div>
}

export interface TriggerOption {
  trigger: '/' | '@' | '$'
  id: string
  label: string
  desc: string
  insertText: string
  action?: 'clear' | 'draft' | 'submit' | 'compress'
  icon: React.ComponentType<{ className?: string }>
}

export interface StudioAiArticleContext {
  title?: string
  slug?: string
  originalSlug?: string
  category?: string
  tagInput?: string
  author?: string
  status?: string
  locale?: string
  coverUrl?: string
  coverAlt?: string
  excerpt?: string
  targetKeyword?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
  seoTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  breadcrumbTitle?: string
  schemaType?: string
  robots?: { index?: boolean; follow?: boolean }
  content?: string
  blocks?: any[]
  wordCount?: number
  readingTimeMinutes?: number
  internalLinksCount?: number
  seoScore?: number
  seoGrade?: string
  seoIndicators?: Array<{ id: string; label: string; status: string; message: string; value?: any }>
  readabilityScore?: number
  readabilityIndicators?: Array<{ id: string; label: string; status: string; message: string; fixHint?: string }>
  seoMetrics?: {
    wordCount?: number
    headingCount?: number
    imageCount?: number
    missingAltCount?: number
    internalLinkCount?: number
    externalLinkCount?: number
    keyphraseDensity?: number
  }
  gateViolations?: string[]
  locationName?: string
  violations?: string[]
}

export type StudioAiPageContext = StudioAiArticleContext

export interface StudioAiSidebarProps {
  isOpen: boolean
  onClose: () => void
  /** panel = dok kanan, drawer = overlay kanan (layar kecil), widget = chat melayang kecil */
  variant?: 'panel' | 'drawer' | 'widget'
  /** true saat panel diperbesar menempel di sisi kanan layar */
  isExpanded?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  onOpenWidget?: () => void
  onOpenPanel?: () => void
  pageContext?: StudioAiPageContext
  onApplyArticleChanges?: (changes: Partial<StudioAiArticleContext>) => void
  initialQuotaError?: any
  initialMessages?: Message[]
}

export function StudioAiSidebar({
  isOpen,
  onClose,
  variant = 'panel',
  isExpanded = false,
  onExpand,
  onCollapse,
  onOpenWidget,
  onOpenPanel,
  pageContext,
  onApplyArticleChanges,
  initialQuotaError,
  initialMessages,
}: StudioAiSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') || (pathname === '/admin/buat-artikel' ? 'buat-artikel' : 'overview')
  const { role, actorName } = useAuth()

  const [messages, setMessages] = useState<Message[]>(initialMessages || [])
  const [appliedChangesMap, setAppliedChangesMap] = useState<Record<string, boolean>>({})
  const [applyNotice, setApplyNotice] = useState<string | null>(null)
  const applyNoticeTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (applyNoticeTimerRef.current) {
        clearTimeout(applyNoticeTimerRef.current)
      }
    }
  }, [])

  const showApplyNotice = (notice: string) => {
    if (applyNoticeTimerRef.current) {
      clearTimeout(applyNoticeTimerRef.current)
    }
    setApplyNotice(notice)
    applyNoticeTimerRef.current = setTimeout(() => {
      setApplyNotice(null)
      applyNoticeTimerRef.current = null
    }, 6000)
  }

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      setElapsedTime(0)
      timer = setInterval(() => {
        setElapsedTime((prev) => +(prev + 0.5).toFixed(1))
      }, 500)
    } else {
      setElapsedTime(0)
    }
    return () => clearInterval(timer)
  }, [loading])

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTraceIndex, setActiveTraceIndex] = useState<number | null>(null)
  const [draftMode, setDraftMode] = useState(false)
  const [draftTopic, setDraftTopic] = useState('')
  const [draftKeyword, setDraftKeyword] = useState('')
  const [drafting, setDrafting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize upward helper for prompt textarea (min: 38px, max: 160px)
  const adjustTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(Math.max(el.scrollHeight, 38), 160)
    el.style.height = `${newHeight}px`
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  // Autocomplete Trigger State (/, @, $)
  const [activeTrigger, setActiveTrigger] = useState<'/' | '@' | '$' | null>(null)
  const [triggerQuery, setTriggerQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // AI Configuration State (Google AI Studio & OpenRouter)
  const [mounted, setMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [aiProvider, setAiProvider] = useState<'google' | 'openrouter'>('google')
  const [googleKey, setGoogleKey] = useState(() => {
    // Eagerly load from localStorage to prevent false "API key not set" warning on mount
    if (typeof window === 'undefined') return ''
    try {
      const raw = localStorage.getItem('unimasi_ai_config')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.googleApiKey) return String(parsed.googleApiKey).trim()
      }
    } catch (err) { console.warn("[observable error]:", err) }
    return ''
  })
  const [openrouterKey, setOpenrouterKey] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const raw = localStorage.getItem('unimasi_ai_config')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.openrouterApiKey) return String(parsed.openrouterApiKey).trim()
      }
    } catch (err) { console.warn("[observable error]:", err) }
    return ''
  })
  const [googleModel, setGoogleModel] = useState('')
  const [openrouterModel, setOpenrouterModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [availableModels, setAvailableModels] = useState<AiModelItem[]>([])
  const [thinkingMode, setThinkingMode] = useState<'auto' | 'off' | 'on'>('auto')
  const [fetchedGoogleModels, setFetchedGoogleModels] = useState<any[]>([])
  const [fetchedOpenrouterModels, setFetchedOpenrouterModels] = useState<any[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [manualModelInput, setManualModelInput] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [quotaError, setQuotaError] = useState<any | null>(initialQuotaError || null)

  const handleSwitchProvider = () => {
    if (aiProvider === 'google') {
      setAiProvider('openrouter')
      const targetModel = openrouterModel || 'google/gemini-2.0-flash-exp:free'
      setOpenrouterModel(targetModel)
      setCustomModel(targetModel)
      try {
        const raw = localStorage.getItem('unimasi_ai_config')
        const parsed = raw ? JSON.parse(raw) : {}
        localStorage.setItem(
          'unimasi_ai_config',
          JSON.stringify({
            ...parsed,
            provider: 'openrouter',
            model: targetModel,
            openrouterModel: targetModel,
          })
        )
      } catch (err) { console.warn("[observable error]:", err) }
      setQuotaError(null)
      showApplyNotice('Beralih ke OpenRouter')
    } else {
      setAiProvider('google')
      const targetModel = 'gemini-3.8-flash'
      setGoogleModel(targetModel)
      try {
        const raw = localStorage.getItem('unimasi_ai_config')
        const parsed = raw ? JSON.parse(raw) : {}
        localStorage.setItem(
          'unimasi_ai_config',
          JSON.stringify({
            ...parsed,
            provider: 'google',
            model: targetModel,
            googleModel: targetModel,
          })
        )
      } catch (err) { console.warn("[observable error]:", err) }
      setQuotaError(null)
      showApplyNotice('Beralih ke Google AI Studio (gemini-3.8-flash)')
    }
  }

  const handleSwitchToFreeModel = () => {
    const freeModel = 'google/gemini-2.0-flash-exp:free'
    setAiProvider('openrouter')
    setOpenrouterModel(freeModel)
    setCustomModel(freeModel)
    try {
      const raw = localStorage.getItem('unimasi_ai_config')
      const parsed = raw ? JSON.parse(raw) : {}
      localStorage.setItem(
        'unimasi_ai_config',
        JSON.stringify({
          ...parsed,
          provider: 'openrouter',
          model: freeModel,
          openrouterModel: freeModel,
        })
      )
    } catch (err) { console.warn("[observable error]:", err) }
    setQuotaError(null)
    showApplyNotice('Mengaktifkan Model Gratis: Gemini 2.0 Flash Exp (OpenRouter)')
  }

  const handleUpdateKey = () => {
    triggerAiKeyPrompt({
      provider: aiProvider,
      featureName: 'Studio AI Copilot',
      reason: quotaError?.message || 'Batas kuota atau rate limit tercapai. Silakan perbarui API Key.',
    })
  }

  // Server-Backed Sessions State (PostgreSQL Prisma 8 - Multi-Session & Isolated per User)
  const [sessions, setSessions] = useState<any[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeSessionSummary, setActiveSessionSummary] = useState<string | null>(null)
  const [sessionsDrawerOpen, setSessionsDrawerOpen] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [compressionNotice, setCompressionNotice] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitleInput, setEditTitleInput] = useState('')

  // Persistent User Memory & Custom Instructions State (ChatGPT / Gemini style)
  const [memoriesModalOpen, setMemoriesModalOpen] = useState(false)
  const [memories, setMemories] = useState<any[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(false)
  const [newMemoryKey, setNewMemoryKey] = useState('')
  const [newMemoryContent, setNewMemoryContent] = useState('')

  // Helper to resolve active API key & provider seamlessly across state and key pool
  const getEffectiveApiKey = (): { key: string; provider: 'google' | 'openrouter'; model: string } => {
    // 1. Direct state key
    const directKey = aiProvider === 'google' ? googleKey.trim() : openrouterKey.trim()
    if (directKey) {
      return {
        key: directKey,
        provider: aiProvider,
        model: aiProvider === 'google' ? googleModel : (customModel.trim() || openrouterModel),
      }
    }

    // 2. Stored key manager credentials for current provider
    const creds = getStoredAiCredentials(aiProvider)
    if (creds.apiKey?.trim()) {
      return {
        key: creds.apiKey.trim(),
        provider: creds.provider || aiProvider,
        model: creds.model || (aiProvider === 'google' ? googleModel : (customModel.trim() || openrouterModel)),
      }
    }

    // 3. Fallback to alternative provider if current has no key but the other does
    const altProv: 'google' | 'openrouter' = aiProvider === 'google' ? 'openrouter' : 'google'
    const altDirect = altProv === 'google' ? googleKey.trim() : openrouterKey.trim()
    if (altDirect) {
      return {
        key: altDirect,
        provider: altProv,
        model: altProv === 'google' ? googleModel : (customModel.trim() || openrouterModel),
      }
    }

    const altCreds = getStoredAiCredentials(altProv)
    if (altCreds.apiKey?.trim()) {
      return {
        key: altCreds.apiKey.trim(),
        provider: altProv,
        model: altCreds.model || (altProv === 'google' ? googleModel : (customModel.trim() || openrouterModel)),
      }
    }

    return {
      key: '',
      provider: aiProvider,
      model: aiProvider === 'google' ? googleModel : (customModel.trim() || openrouterModel),
    }
  }

  // Fetch all sessions belonging to the current authenticated user
  const fetchSessions = async (autoSelectFirst = true) => {
    try {
      setSessionsLoading(true)
      const res = await fetch('/api/ai/sessions')
      const data = await res.json()
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions)
        if (autoSelectFirst && data.sessions.length > 0 && !activeSessionId) {
          loadSession(data.sessions[0].id)
        }
      }
    } catch (err) {
      console.error('[fetchSessions] Error:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  // Load a specific session's messages and summary from PostgreSQL
  const loadSession = async (sessionId: string) => {
    try {
      setSessionsLoading(true)
      const res = await fetch(`/api/ai/sessions/${sessionId}`)
      const data = await res.json()
      if (data.success && data.session) {
        setActiveSessionId(data.session.id)
        setActiveSessionSummary(data.session.summary || null)
        if (data.session.model) {
          if (data.session.model.startsWith('gemini')) {
            setAiProvider('google')
            setGoogleModel(data.session.model)
          } else {
            setAiProvider('openrouter')
            setOpenrouterModel(data.session.model)
          }
        }
        setMessages(
          (data.session.messages || []).map((m: any) => ({
            role: m.role,
            content: m.content,
            model: m.model,
            toolCalls: m.toolCalls,
            agenticReport: m.agenticReport,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        )
        setSessionsDrawerOpen(false)
      }
    } catch (err) {
      console.error('[loadSession] Error:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  // Create a brand new session on PostgreSQL
  const handleCreateNewSession = async () => {
    try {
      setSessionsLoading(true)
      const res = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Obrolan Baru',
          model: aiProvider === 'google' ? googleModel : (customModel.trim() || openrouterModel),
        }),
      })
      const data = await res.json()
      if (data.success && data.session) {
        setActiveSessionId(data.session.id)
        setActiveSessionSummary(null)
        setMessages([])
        setSessions((prev) => [data.session, ...prev])
        setSessionsDrawerOpen(false)
      }
    } catch (err) {
      console.error('[handleCreateNewSession] Error:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  // Delete a session from PostgreSQL
  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const res = await fetch(`/api/ai/sessions/${sessionId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        const remaining = sessions.filter((s) => s.id !== sessionId)
        setSessions(remaining)
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            loadSession(remaining[0].id)
          } else {
            handleCreateNewSession()
          }
        }
      }
    } catch (err) {
      console.error('[handleDeleteSession] Error:', err)
    }
  }

  // Rename a session in PostgreSQL
  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    try {
      const res = await fetch(`/api/ai/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim() } : s))
        )
        setEditingSessionId(null)
      }
    } catch (err) {
      console.error('[handleRenameSession] Error:', err)
    }
  }

  // Compress session history to save tokens and optimize cache (Gemini / ChatGPT style)
  const handleCompressSession = async () => {
    if (!activeSessionId) return
    const activeInfo = getEffectiveApiKey()
    const currentKey = activeInfo.key
    const currentModel = activeInfo.model
    const effectiveProvider = activeInfo.provider

    if (!currentKey) {
      triggerAiKeyPrompt({
        featureName: 'Kompresi Sesi Percakapan',
        reason: `Silakan tambahkan API Key ${effectiveProvider === 'google' ? 'Google AI Studio' : 'OpenRouter'} untuk mengompresi riwayat sesi.`,
        provider: effectiveProvider,
      })
      return
    }

    try {
      setCompressing(true)

      const res = await fetch(`/api/ai/sessions/${activeSessionId}/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: currentKey,
          provider: aiProvider,
          model: currentModel,
          keepLatestCount: 4,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setActiveSessionSummary(data.summary)
        setCompressionNotice(data.message || 'Sesi berhasil dikompresi!')
        await loadSession(activeSessionId)
        setTimeout(() => setCompressionNotice(null), 6000)
      } else {
        setCompressionNotice(data.error || 'Gagal mengompresi sesi.')
        setTimeout(() => setCompressionNotice(null), 5000)
      }
    } catch (err: any) {
      setCompressionNotice('Kendala koneksi kompresi sesi.')
      setTimeout(() => setCompressionNotice(null), 5000)
    } finally {
      setCompressing(false)
    }
  }

  // Fetch persistent memories from PostgreSQL
  const fetchMemories = async () => {
    try {
      setMemoriesLoading(true)
      const res = await fetch('/api/ai/memory')
      const data = await res.json()
      if (data.success && Array.isArray(data.memories)) {
        setMemories(data.memories)
      }
    } catch (err) {
      console.error('[fetchMemories] Error:', err)
    } finally {
      setMemoriesLoading(false)
    }
  }

  // Save new memory to PostgreSQL
  const handleSaveMemory = async () => {
    if (!newMemoryKey.trim() || !newMemoryContent.trim()) return
    try {
      const res = await fetch('/api/ai/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newMemoryKey.trim(),
          content: newMemoryContent.trim(),
          enabled: true,
        }),
      })
      const data = await res.json()
      if (data.success && data.memory) {
        setNewMemoryKey('')
        setNewMemoryContent('')
        await fetchMemories()
      }
    } catch (err) {
      console.error('[handleSaveMemory] Error:', err)
    }
  }

  // Delete memory from PostgreSQL
  const handleDeleteMemory = async (idOrKey: string) => {
    try {
      const res = await fetch(`/api/ai/memory?id=${encodeURIComponent(idOrKey)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        await fetchMemories()
      }
    } catch (err) {
      console.error('[handleDeleteMemory] Error:', err)
    }
  }

  // Dynamic Model Fetching directly from Provider API (Zero-hardcode)
  const fetchDynamicModels = async (providerToFetch?: 'google' | 'openrouter', keyToUse?: string) => {
    const prov = providerToFetch || aiProvider
    const key = keyToUse !== undefined ? keyToUse : (prov === 'google' ? googleKey.trim() : openrouterKey.trim())
    if (!key && prov === 'google') return

    setFetchingModels(true)
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: prov,
          apiKey: key,
        }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.models)) {
        if (prov === 'google') {
          setFetchedGoogleModels(data.models)
          if (!googleModel && data.models.length > 0) {
            setGoogleModel(data.models[0].id)
          }
        } else {
          setFetchedOpenrouterModels(data.models)
          if (!openrouterModel && data.models.length > 0) {
            setOpenrouterModel(data.models[0].id)
          }
        }
      }
    } catch (err) {
      console.error('[fetchDynamicModels] Error:', err)
    } finally {
      setFetchingModels(false)
    }
  }

  // Load saved AI config and initialize server-backed sessions & memories on mount
  useEffect(() => {
    setMounted(true)
    setAvailableModels(getSelectedAiModels())

    const syncFromStorage = () => {
      let gKey = ''
      let oKey = ''
      let prov: 'google' | 'openrouter' = 'google'

      try {
        const raw = localStorage.getItem('unimasi_ai_config')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.provider) prov = parsed.provider
          if (parsed.googleApiKey) gKey = String(parsed.googleApiKey).trim()
          if (parsed.openrouterApiKey) oKey = String(parsed.openrouterApiKey).trim()
          if (parsed.googleModel) setGoogleModel(parsed.googleModel)
          if (parsed.openrouterModel) setOpenrouterModel(parsed.openrouterModel)
          if (parsed.customModel) setCustomModel(parsed.customModel)
          if (parsed.thinkingMode) setThinkingMode(parsed.thinkingMode)
        }
      } catch (err) { console.warn("[observable error]:", err) }

      // Check key pool
      const gCreds = getStoredAiCredentials('google')
      const oCreds = getStoredAiCredentials('openrouter')
      if (!gKey && gCreds.apiKey) gKey = gCreds.apiKey.trim()
      if (!oKey && oCreds.apiKey) oKey = oCreds.apiKey.trim()

      if (gKey) setGoogleKey(gKey)
      if (oKey) setOpenrouterKey(oKey)

      // Auto-select provider that actually has key configured
      if (prov === 'google' && !gKey && oKey) {
        prov = 'openrouter'
      } else if (prov === 'openrouter' && !oKey && gKey) {
        prov = 'google'
      }
      setAiProvider(prov)

      const activeK = prov === 'google' ? gKey : oKey
      if (activeK) {
        fetchDynamicModels(prov, activeK)
      }
    }

    syncFromStorage()
    fetchSessions(true)
    fetchMemories()

    const handleKeyUpdated = (e: Event) => {
      setAvailableModels(getSelectedAiModels())
      syncFromStorage()
      const detail = (e as CustomEvent).detail
      if (!detail) return
      if (detail.provider === 'google' && detail.apiKey) {
        setGoogleKey(detail.apiKey)
        setAiProvider('google')
        if (detail.model) setGoogleModel(detail.model)
        fetchDynamicModels('google', detail.apiKey)
      } else if (detail.provider === 'openrouter' && detail.apiKey) {
        setOpenrouterKey(detail.apiKey)
        setAiProvider('openrouter')
        if (detail.model) setOpenrouterModel(detail.model)
        fetchDynamicModels('openrouter', detail.apiKey)
      }
    }

    const handleModelsUpdated = () => {
      setAvailableModels(getSelectedAiModels())
      syncFromStorage()
    }

    window.addEventListener('unimasi:ai-key-updated', handleKeyUpdated)
    window.addEventListener('unimasi:ai-models-updated', handleModelsUpdated)
    window.addEventListener('storage', handleModelsUpdated)

    return () => {
      window.removeEventListener('unimasi:ai-key-updated', handleKeyUpdated)
      window.removeEventListener('unimasi:ai-models-updated', handleModelsUpdated)
      window.removeEventListener('storage', handleModelsUpdated)
    }
  }, [])

  const handleTestConnection = async () => {
    setTestLoading(true)
    setTestResult(null)
    const activeInfo = getEffectiveApiKey()
    const currentKey = activeInfo.key
    const currentModel = activeInfo.model
    const effectiveProvider = activeInfo.provider

    if (!currentKey) {
      setTestResult({
        success: false,
        error: `Silakan masukkan API Key ${effectiveProvider === 'google' ? 'Google AI Studio' : 'OpenRouter'} terlebih dahulu.`
      })
      setTestLoading(false)
      return
    }

    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: effectiveProvider,
          apiKey: currentKey,
          model: currentModel
        })
      })
      const data = await res.json()
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || `Terhubung sukses ke ${data.model} (${data.latencyMs}ms)!`
        })
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Pengujian koneksi gagal. Silakan periksa kunci API Anda.'
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Gagal menghubungi server untuk menguji koneksi.'
      })
    } finally {
      setTestLoading(false)
    }
  }

  const handleSaveSettings = () => {
    try {
      const config = {
        provider: aiProvider,
        googleApiKey: googleKey.trim(),
        openrouterApiKey: openrouterKey.trim(),
        googleModel,
        openrouterModel: customModel.trim() || openrouterModel,
      }
      localStorage.setItem('unimasi_ai_config', JSON.stringify(config))
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
        setSettingsOpen(false)
      }, 700)
    } catch (err) { console.warn("[observable error]:", err) }
  }

  // Label konteks yang mudah dibaca berdasarkan tab aktif
  const getContextInfo = (tab: string) => {
    switch (tab) {
      case 'overview':
        return { name: 'Ringkasan & KPI', scope: 'Metrik Konten & Perlindungan SEO', icon: Activity }
      case 'articles':
        return { name: 'Kelola Artikel', scope: 'Audit 886 Artikel & Status Editorial', icon: FileText }
      case 'buat-artikel':
        return { name: 'Studio Tulis Artikel', scope: 'Editor Blok & Audit SEO Real-Time', icon: PenSquare }
      case 'portfolio':
        return { name: 'Portofolio & Studi Kasus', scope: '15 Studi Kasus & Creative Tech', icon: Briefcase }
      case 'services':
        return { name: 'Katalog Layanan', scope: '142 Layanan Digital & Departemen', icon: Boxes }
      case 'solutions':
        return { name: 'Solusi Bisnis & Finder', scope: 'Solusi Industri, Venue, & Quiz', icon: Sparkles }
      case 'media':
        return { name: 'Pustaka Media', scope: 'Audit Alt-Text & Optimasi WebP', icon: ImageIcon }
      case 'cta':
        return { name: 'Blok CTA & Konversi', scope: 'Preset Ajakan Bertindak', icon: Megaphone }
      case 'keywords':
        return { name: 'Bank Keyword & SERP', scope: 'Peluang Query & Keyword Bank', icon: Target }
      case 'audit':
        return { name: 'Audit SEO Dua Lapis', scope: 'Audit Pre-Publish & Live Crawler', icon: ShieldCheck }
      case 'perf':
        return { name: 'Performa & IndexNow', scope: 'Core Web Vitals & Instant Indexing', icon: Gauge }
      case 'gsc':
        return { name: 'Google Search Console', scope: 'Analisis SERP & Query Trafik', icon: TrendingUp }
      case 'redirects':
        return { name: '301 Redirect Rules', scope: 'Pencegahan Broken Link SEO', icon: ArrowRightLeft }
      case 'migration':
        return { name: 'Audit URL Legacy', scope: 'Integritas URL & Status 200/410', icon: History }
      case 'ai-settings':
        return { name: 'Pengaturan AI & Tools', scope: 'Konfigurasi Model Inferensi & Tools', icon: Sliders }
      case 'system':
        return { name: 'Database & Sistem MCP', scope: 'Status PostgreSQL & Server MCP', icon: Server }
      case 'users':
      case 'roles':
        return { name: 'Manajemen Pengguna', scope: 'Hak Akses RBAC & Kredensial Tim', icon: Users }
      case 'settings':
        return { name: 'Pengaturan Global', scope: 'Konfigurasi Situs & Metadata SEO', icon: Settings }
      default:
        return { name: 'Studio Workspace', scope: 'Inspeksi & Bantuan Umum', icon: Bot }
    }
  }

  const contextInfo = getContextInfo(currentTab)
  // Mode widget = tampilan ringkas (chat melayang kecil)
  const isCompact = variant === 'widget'

  // Dynamic variables resolved from pageContext, route, tab, and role
  const dynamicSlug = pageContext?.slug || searchParams?.get('slug') || (pathname === '/admin/buat-artikel' ? 'artikel-baru' : currentTab)
  const dynamicTitle = pageContext?.title || (pathname === '/admin/buat-artikel' ? 'Draf Artikel Baru' : contextInfo.name)
  const dynamicKeyphrase = pageContext?.focusKeyphrase || '(belum ditentukan)'
  const dynamicLocale = pageContext?.locale || 'id'
  const dynamicStatus = pageContext?.status || 'draft'
  const dynamicCategory = pageContext?.category || 'Layanan Digital'
  const dynamicLocation = pageContext?.locationName || (pathname === '/admin/buat-artikel' ? 'Studio Editor Artikel (/admin/buat-artikel)' : `Admin Studio: ${contextInfo.name} (${pathname || '/admin'})`)
  const violationsList = pageContext?.violations || []
  const dynamicViolations = violationsList.length === 0
    ? '0 Pelanggaran (Lolos Gerbang Publikasi)'
    : `${violationsList.length} Pelanggaran: ${violationsList.slice(0, 2).join('; ')}${violationsList.length > 2 ? ' ...' : ''}`

  const dynamicTriggerOptions: TriggerOption[] = [
    // Slash Commands (/) — Dynamic based on active location and editor state
    {
      trigger: '/',
      id: '/audit',
      label: '/audit',
      desc: `Audit SEO & Gerbang Publikasi (${dynamicSlug})`,
      insertText: pathname === '/admin/buat-artikel'
        ? `Jalankan audit SEO teknis dan evaluasi Publication Gate untuk artikel "${dynamicTitle}" (slug: /artikel/${dynamicSlug}).`
        : `Jalankan audit SEO teknis dan evaluasi kepatuhan halaman pada area ${contextInfo.name} di lokasi ${dynamicLocation}.`,
      action: 'submit',
      icon: ShieldCheck,
    },
    {
      trigger: '/',
      id: '/draft',
      label: '/draft',
      desc: 'Buka mode generator draf konten otomatis',
      insertText: '',
      action: 'draft',
      icon: PenSquare,
    },
    {
      trigger: '/',
      id: '/keywords',
      label: '/keywords',
      desc: `Riset kata kunci SERP (${dynamicKeyphrase !== '(belum ditentukan)' ? dynamicKeyphrase : 'GSC'})`,
      insertText: dynamicKeyphrase !== '(belum ditentukan)'
        ? `Analisis peluang kata kunci SERP dan performa Search Console untuk target "${dynamicKeyphrase}".`
        : `Analisis peluang kata kunci posisi 8-20 dan query CTR tinggi dari Google Search Console untuk domain unimasi.com.`,
      action: 'submit',
      icon: Target,
    },
    {
      trigger: '/',
      id: '/links',
      label: '/links',
      desc: `Rekomendasi internal link (${dynamicCategory})`,
      insertText: `Rekomendasikan 3-5 tautan internal kontekstual untuk artikel "${dynamicTitle}" dengan kategori ${dynamicCategory}.`,
      action: 'submit',
      icon: ArrowRight,
    },
    {
      trigger: '/',
      id: '/readability',
      label: '/readability',
      desc: `Audit keterbacaan & tone (${dynamicLocale.toUpperCase()})`,
      insertText: `Evaluasi skor keterbacaan bahasa (${dynamicLocale.toUpperCase()}), gaya bahasa editorial, dan sebaran heading pada "${dynamicTitle}".`,
      action: 'submit',
      icon: FileText,
    },
    {
      trigger: '/',
      id: '/status',
      label: '/status',
      desc: 'Periksa metrik sistem & latensi PostgreSQL',
      insertText: `Periksa status latensi database PostgreSQL Prisma 8, status cache GSC, dan integrasi server MCP di lokasi ${dynamicLocation}.`,
      action: 'submit',
      icon: Activity,
    },
    {
      trigger: '/',
      id: '/compact',
      label: '/compact',
      desc: 'Kompres riwayat obrolan panjang ke ringkasan memori cache',
      insertText: '',
      action: 'compress',
      icon: Sparkles,
    },
    {
      trigger: '/',
      id: '/compress',
      label: '/compress',
      desc: 'Kompres sesi obrolan untuk menghemat token dan cache',
      insertText: '',
      action: 'compress',
      icon: Sparkles,
    },
    {
      trigger: '/',
      id: '/clear',
      label: '/clear',
      desc: 'Mulai obrolan baru (+ New Session)',
      insertText: '',
      action: 'clear',
      icon: RefreshCw,
    },
    {
      trigger: '/',
      id: '/resume',
      label: '/resume',
      desc: 'Lanjutkan pekerjaan/draf yang terputus dari tahap sebelumnya',
      insertText: 'Lanjutkan pekerjaan yang terputus dari langkah sebelumnya, periksa status terkini dan selesaikan bagian yang belum tuntas.',
      action: 'submit',
      icon: ArrowRight,
    },
    {
      trigger: '/',
      id: '/continue',
      label: '/continue',
      desc: 'Lanjutkan iterasi atau penulisan yang belum selesai',
      insertText: 'Lanjutkan langkah berikutnya untuk menyelesaikan pekerjaan ini.',
      action: 'submit',
      icon: ArrowRight,
    },

    // Context Targets (@) — Injects dynamic context metadata
    {
      trigger: '@',
      id: '@article',
      label: '@article',
      desc: `Sisipkan konteks: ${dynamicTitle}`,
      insertText: `@article [Judul: "${dynamicTitle}" | Slug: /artikel/${dynamicSlug} | Kategori: ${dynamicCategory} | Status: ${dynamicStatus}] `,
      icon: FileText,
    },
    {
      trigger: '@',
      id: '@seo',
      label: '@seo',
      desc: `Sisipkan metrik SEO (${dynamicKeyphrase})`,
      insertText: `@seo [Keyphrase: "${dynamicKeyphrase}" | Locale: ${dynamicLocale} | Slug: ${dynamicSlug}] `,
      icon: Sparkles,
    },
    {
      trigger: '@',
      id: '@gate',
      label: '@gate',
      desc: `Sisipkan status Gerbang Publikasi (${violationsList.length} isu)`,
      insertText: `@gate [Status: ${dynamicViolations}] `,
      icon: ShieldCheck,
    },
    {
      trigger: '@',
      id: '@location',
      label: '@location',
      desc: `Sisipkan lokasi kerja: ${dynamicLocation}`,
      insertText: `@location [Lokasi: ${dynamicLocation}] `,
      icon: MapPin,
    },
    {
      trigger: '@',
      id: '@gsc',
      label: '@gsc',
      desc: 'Sisipkan analitik Search Console 28 hari',
      insertText: `@gsc [Google Search Console: Metrik SERP & Query Trafik Organik] `,
      icon: TrendingUp,
    },
    {
      trigger: '@',
      id: '@db',
      label: '@db',
      desc: 'Sisipkan skema PostgreSQL & katalog',
      insertText: `@db [PostgreSQL Prisma 8: 878 Artikel, 15 Portofolio, 142 Layanan] `,
      icon: Server,
    },
    {
      trigger: '@',
      id: '@rules',
      label: '@rules',
      desc: `Sisipkan standar editorial & peran ${role || 'SUPER_ADMIN'}`,
      insertText: `@rules [Standar Editorial UNIMASI & Hak Akses: ${role || 'SUPER_ADMIN'}] `,
      icon: Shield,
    },

    // Variables & Tokens ($) — Dynamically populated from real state
    {
      trigger: '$',
      id: '$role',
      label: '$role',
      desc: `Peran aktif: ${role || 'SUPER_ADMIN'}`,
      insertText: '$role ',
      icon: Users,
    },
    {
      trigger: '$',
      id: '$slug',
      label: '$slug',
      desc: `Slug URL aktif: ${dynamicSlug}`,
      insertText: '$slug ',
      icon: ChevronRight,
    },
    {
      trigger: '$',
      id: '$title',
      label: '$title',
      desc: `Judul konten: ${dynamicTitle}`,
      insertText: '$title ',
      icon: FileText,
    },
    {
      trigger: '$',
      id: '$keyphrase',
      label: '$keyphrase',
      desc: `Focus keyphrase: ${dynamicKeyphrase}`,
      insertText: '$keyphrase ',
      icon: Target,
    },
    {
      trigger: '$',
      id: '$violations',
      label: '$violations',
      desc: `Status gate: ${dynamicViolations}`,
      insertText: '$violations ',
      icon: AlertTriangle,
    },
    {
      trigger: '$',
      id: '$location',
      label: '$location',
      desc: `Lokasi rute: ${dynamicLocation}`,
      insertText: '$location ',
      icon: MapPin,
    },
    {
      trigger: '$',
      id: '$locale',
      label: '$locale',
      desc: `Bahasa aktif: ${dynamicLocale}`,
      insertText: '$locale ',
      icon: Boxes,
    },
    {
      trigger: '$',
      id: '$category',
      label: '$category',
      desc: `Kategori: ${dynamicCategory}`,
      insertText: '$category ',
      icon: Boxes,
    },
  ]

  // Autocomplete Filtered Options
  const filteredOptions = activeTrigger
    ? dynamicTriggerOptions.filter(
        (opt) =>
          opt.trigger === activeTrigger &&
          (opt.id.toLowerCase().includes(triggerQuery) || opt.desc.toLowerCase().includes(triggerQuery))
      )
    : []

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    adjustTextareaHeight()

    const cursorPos = e.target.selectionStart ?? val.length
    const textBeforeCursor = val.slice(0, cursorPos)
    const lastWordMatch = textBeforeCursor.match(/(?:^|\s)([/@$])([a-zA-Z0-9_-]*)$/)

    if (lastWordMatch) {
      setActiveTrigger(lastWordMatch[1] as '/' | '@' | '$')
      setTriggerQuery(lastWordMatch[2].toLowerCase())
      setSelectedIndex(0)
    } else {
      setActiveTrigger(null)
      setTriggerQuery('')
    }
  }

  const handleSelectOption = (option: TriggerOption) => {
    if (option.action === 'compress') {
      setActiveTrigger(null)
      setInput('')
      handleCompressSession()
      return
    }

    if (option.action === 'clear') {
      handleCreateNewSession()
      setInput('')
      setActiveTrigger(null)
      return
    }

    if (option.action === 'draft') {
      setDraftMode(true)
      setActiveTrigger(null)
      return
    }

    if (option.action === 'submit') {
      setActiveTrigger(null)
      setInput('')
      sendMessage(option.insertText)
      return
    }

    // Token insertion (for @ and $)
    const cursorPos = textareaRef.current?.selectionStart ?? input.length
    const textBeforeCursor = input.slice(0, cursorPos)
    const textAfterCursor = input.slice(cursorPos)
    const replacedBefore = textBeforeCursor.replace(/(?:^|\s)([/@$])[a-zA-Z0-9_-]*$/, (match) => {
      const leadingSpace = match.startsWith(' ') ? ' ' : ''
      return `${leadingSpace}${option.insertText}`
    })

    const finalVal = `${replacedBefore}${textAfterCursor}`
    setInput(finalVal)
    setActiveTrigger(null)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return

    if (activeTrigger && filteredOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredOptions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
        return
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault()
        handleSelectOption(filteredOptions[selectedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setActiveTrigger(null)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading && input.trim()) {
        sendMessage()
        if (textareaRef.current) {
          textareaRef.current.style.height = '38px'
        }
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const sendMessage = async (textToSend?: string) => {
    const rawText = textToSend || input
    if (!rawText.trim() || loading) return

    // Fast commands
    if (rawText.trim().toLowerCase() === '/clear') {
      handleCreateNewSession()
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = '38px'
      setActiveTrigger(null)
      return
    }

    if (rawText.trim().toLowerCase() === '/compress' || rawText.trim().toLowerCase() === '/compact') {
      handleCompressSession()
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = '38px'
      setActiveTrigger(null)
      return
    }

    // Dynamically replace variables ($) with actual live values
    const resolvedText = rawText
      .replace(/\$role\b/g, role || 'SUPER_ADMIN')
      .replace(/\$slug\b/g, dynamicSlug)
      .replace(/\$title\b/g, dynamicTitle)
      .replace(/\$keyphrase\b/g, dynamicKeyphrase)
      .replace(/\$violations\b/g, dynamicViolations)
      .replace(/\$location\b/g, dynamicLocation)
      .replace(/\$locale\b/g, dynamicLocale)
      .replace(/\$category\b/g, dynamicCategory)
      .replace(/\$status\b/g, dynamicStatus)

    const activeInfo = getEffectiveApiKey()
    const currentKey = activeInfo.key
    const currentModel = activeInfo.model
    const effectiveProvider = activeInfo.provider

    if (!currentKey) {
      triggerAiKeyPrompt({
        featureName: 'Asisten Obrolan Studio AI',
        reason: `Silakan tambahkan API Key ${
          effectiveProvider === 'google' ? 'Google AI Studio (Gemini)' : 'OpenRouter'
        } Anda terlebih dahulu untuk memulai obrolan AI.`,
        provider: effectiveProvider,
        onSuccess: () => {
          const creds = getStoredAiCredentials(effectiveProvider)
          if (effectiveProvider === 'google') setGoogleKey(creds.apiKey)
          else setOpenrouterKey(creds.apiKey)
        },
      })
      return
    }

    const userMsg: Message = {
      role: 'user',
      content: rawText,
      text: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    // Drop welcome message on first chat so it doesn't appear after the first chat!
    const isFirstChat = messages.length === 1 && messages[0].role === 'assistant'
    const newMessages = isFirstChat ? [userMsg] : [...messages, userMsg]

    const streamingMsgId = `msg_stream_${Date.now()}`
    const initialAssistantMsg: Message = {
      id: streamingMsgId,
      role: 'assistant',
      content: '',
      text: '',
      thoughts: '',
      toolCalls: [],
      isStreaming: true,
      streamingStatus: 'Menghubungi model AI...',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages([...newMessages, initialAssistantMsg])
    if (!textToSend) {
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = '38px'
    }
    setActiveTrigger(null)
    setLoading(true)

    try {
      // Read extra parameters and token optimization from localStorage if available
      let extraConfig: any = {}
      try {
        const raw = localStorage.getItem('unimasi_ai_config')
        if (raw) extraConfig = JSON.parse(raw)
      } catch (err) { console.warn("[observable error]:", err) }

      let tokenOptConfig: any = {}
      try {
        const rawOpt = localStorage.getItem('unimasi_ai_token_opt')
        if (rawOpt) tokenOptConfig = JSON.parse(rawOpt)
      } catch (err) { console.warn("[observable error]:", err) }

      const activeKeyObj = getActiveApiKey(aiProvider)

      // Candidate fallback models from configured settings models
      const allSelectedModels = getSelectedAiModels()
      const fallbackModels = (allSelectedModels || [])
        .filter((m) => {
          const mId = (m.id || '').replace(/^openrouter\//, '')
          const currId = (currentModel || '').replace(/^openrouter\//, '')
          return m.id !== currentModel && mId !== currId && m.name !== currentModel
        })
        .map((m) => ({
          provider: m.provider,
          model: m.id,
        }))

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson',
        },
        body: JSON.stringify({
          sessionId: activeSessionId || undefined,
          model: currentModel,
          stream: true,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m === userMsg ? resolvedText : (m.content || m.text || ''),
          })),
          context: {
            currentTab,
            pathname,
            role,
            actorName,
            locationName: dynamicLocation,
            selectedSlug: dynamicSlug,
            pageTitle: dynamicTitle,
            focusKeyphrase: dynamicKeyphrase,
            violations: dynamicViolations,
            locale: dynamicLocale,
            article: pageContext ? {
              title: pageContext.title,
              slug: pageContext.slug,
              category: pageContext.category,
              tagInput: pageContext.tagInput,
              author: pageContext.author,
              status: pageContext.status,
              locale: pageContext.locale,
              coverUrl: pageContext.coverUrl,
              coverAlt: pageContext.coverAlt,
              excerpt: pageContext.excerpt,
              targetKeyword: pageContext.targetKeyword,
              focusKeyphrase: pageContext.focusKeyphrase,
              relatedKeyphrases: pageContext.relatedKeyphrases,
              seoTitle: pageContext.seoTitle,
              metaDescription: pageContext.metaDescription,
              canonicalUrl: pageContext.canonicalUrl,
              breadcrumbTitle: pageContext.breadcrumbTitle,
              schemaType: pageContext.schemaType,
              robots: pageContext.robots,
              content: pageContext.content,
              blocks: pageContext.blocks,
              wordCount: pageContext.wordCount,
              readingTimeMinutes: pageContext.readingTimeMinutes,
              internalLinksCount: pageContext.internalLinksCount,
              seoScore: pageContext.seoScore,
              seoGrade: pageContext.seoGrade,
              seoIndicators: pageContext.seoIndicators,
              readabilityScore: pageContext.readabilityScore,
              readabilityIndicators: pageContext.readabilityIndicators,
              seoMetrics: pageContext.seoMetrics,
              gateViolations: pageContext.gateViolations || pageContext.violations,
            } : undefined,
          },
          aiConfig: {
            provider: effectiveProvider,
            apiKey: currentKey,
            model: currentModel,
            fallbackModels,
            secondaryCredentials: {
              googleApiKey: googleKey?.trim() || undefined,
              openrouterApiKey: openrouterKey?.trim() || undefined,
            },
            temperature: extraConfig.temperature,
            topP: extraConfig.topP,
            proxyUrl: activeKeyObj?.proxyUrl || extraConfig.proxyUrl,
            thinkingMode: extraConfig.thinkingMode,
            systemInstruction: extraConfig.systemInstruction,
            enabledTools: extraConfig.enabledTools,
            tokenOptimization: tokenOptConfig,
            stream: true,
          },
        }),
      })

      const isNdjson = res.headers.get('content-type')?.includes('application/x-ndjson')

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const errMsg = errData.error || `HTTP ${res.status}: Gagal memproses permintaan AI.`
        if (
          res.status === 429 ||
          errData.errorType === 'QUOTA_EXCEEDED' ||
          errData.errorType === 'RATE_LIMITED' ||
          errData.quotaError
        ) {
          setQuotaError(errData.quotaError || {
            provider: aiProvider,
            model: currentModel,
            message: errMsg,
          })
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMsgId
              ? {
                  ...msg,
                  content: `⚠️ **Kendala Sistem**: ${errMsg}\n\nSilakan coba lagi atau pilih model AI lain di menu pengaturan.`,
                  text: `⚠️ **Kendala Sistem**: ${errMsg}\n\nSilakan coba lagi atau pilih model AI lain di menu pengaturan.`,
                  isStreaming: false,
                  streamingStatus: undefined,
                }
              : msg
          )
        )

        recordAiPromptLog({
          provider: aiProvider,
          model: currentModel,
          contextTab: currentTab,
          userPrompt: rawText,
          assistantReply: `⚠️ Kendala Sistem: ${errMsg}`,
          status: 'error',
          errorMessage: `HTTP ${res.status}: ${errMsg}`,
          failoverHistory: errData.failoverHistory,
          debugInfo: errData.debugInfo || { status: res.status, statusText: res.statusText },
        })

        setLoading(false)
        return
      }

      if (isNdjson && res.body) {
        // Stream reading
        const reader = res.body.getReader()
        let accumulatedText = ''
        let accumulatedThoughts = ''
        let streamingToolCalls: ToolCallExecution[] = []
        let streamingProposed: any = null
        let streamDoneEvent: any = null

        await processNdjsonStream(reader, (event) => {
          switch (event.type) {
            case 'status': {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? { ...msg, streamingStatus: event.message }
                    : msg
                )
              )
              break
            }
            case 'thought': {
              accumulatedThoughts += event.chunk || ''
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? { ...msg, thoughts: accumulatedThoughts }
                    : msg
                )
              )
              break
            }
            case 'tool_start': {
              const newTool: ToolCallExecution = {
                id: `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                toolName: event.name || 'tool',
                label: getFriendlyToolLabel(event.name || ''),
                category: 'system',
                input: event.input,
                durationMs: 0,
                status: 'running',
              }
              streamingToolCalls = [...streamingToolCalls, newTool]
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? { ...msg, toolCalls: [...streamingToolCalls] }
                    : msg
                )
              )
              break
            }
            case 'tool_result': {
              const idx = streamingToolCalls.findIndex(
                (tc) => tc.toolName === event.name && ((tc.status as string) === 'running' || !tc.output)
              )
              if (idx >= 0) {
                streamingToolCalls[idx] = {
                  ...streamingToolCalls[idx],
                  output: event.output,
                  durationMs: event.durationMs || 0,
                  status: 'completed',
                }
              } else {
                streamingToolCalls.push({
                  id: `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  toolName: event.name || 'tool',
                  label: getFriendlyToolLabel(event.name || ''),
                  category: 'system',
                  output: event.output,
                  durationMs: event.durationMs || 0,
                  status: 'completed',
                })
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? { ...msg, toolCalls: [...streamingToolCalls] }
                    : msg
                )
              )
              break
            }
            case 'content_chunk': {
              accumulatedText += event.chunk || ''
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? { ...msg, content: accumulatedText, text: accumulatedText }
                    : msg
                )
              )
              break
            }
            case 'proposed_changes': {
              streamingProposed = event.proposedChanges
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? { ...msg, proposedChanges: event.proposedChanges }
                    : msg
                )
              )
              break
            }
            case 'error': {
              const qErr = event.quotaError || {
                provider: event.provider || aiProvider,
                model: event.model || currentModel,
                message: event.message || 'Batas kuota atau rate limit tercapai',
              }
              if (
                event.errorType === 'QUOTA_EXCEEDED' ||
                event.errorType === 'RATE_LIMITED' ||
                event.limitZero ||
                event.quotaError
              ) {
                setQuotaError(qErr)
              }
              accumulatedText += (accumulatedText ? '\n\n' : '') + (event.message || '⚠️ Kendala Sistem.')
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? { ...msg, content: accumulatedText, text: accumulatedText }
                    : msg
                )
              )
              break
            }
            case 'done': {
              streamDoneEvent = event
              const finalReply = event.reply || accumulatedText
              const finalProposed = event.proposedChanges || streamingProposed || (() => {
                const m = (finalReply || '').match(/```json:article-changes\s*([\s\S]*?)\s*```/)
                if (m) {
                  try { return JSON.parse(m[1]) } catch (_) { return null }
                }
                return null
              })()

              if (event.quotaError || event.errorType === 'QUOTA_EXCEEDED' || event.errorType === 'RATE_LIMITED') {
                setQuotaError(event.quotaError || {
                  provider: event.meta?.provider || event.provider || aiProvider,
                  model: event.meta?.model || event.model || currentModel,
                  message: finalReply || 'Batas kuota atau rate limit tercapai',
                })
              }

              if (event.sessionId && event.sessionId !== activeSessionId) {
                setActiveSessionId(event.sessionId)
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? {
                        ...msg,
                        content: finalReply,
                        text: finalReply,
                        isStreaming: false,
                        streamingStatus: undefined,
                        thoughts: accumulatedThoughts || event.thoughts || msg.thoughts,
                        toolCalls: streamingToolCalls.length > 0 ? streamingToolCalls : (event.toolCalls || msg.toolCalls),
                        agenticReport: event.report || msg.agenticReport,
                        proposedChanges: finalProposed,
                        meta: event.meta || msg.meta,
                      }
                    : msg
                )
              )

              if (finalProposed && onApplyArticleChanges) {
                const isCreationPrompt = /(?:buatkan|buat|tuliskan|tulis|generate|terapkan|isi|ganti|ubah)/i.test(rawText)
                const isEditPrompt = /(?:perbaiki|koreksi|sesuaikan|edit)/i.test(rawText)
                if (event.autoApply || finalProposed.autoApply || isCreationPrompt || isEditPrompt) {
                  onApplyArticleChanges(finalProposed)
                  setAppliedChangesMap((p) => ({
                    ...p,
                    [`msg_${newMessages.length}`]: true,
                  }))
                  const articleTitle = finalProposed.title || pageContext?.title || 'Draf Artikel'
                  showApplyNotice(`Artikel "${articleTitle}" berhasil diterapkan ke editor!`)
                }
              }
              break
            }
          }
        })

        // Finalize state if stream ended without explicit 'done' event
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMsgId
              ? {
                  ...msg,
                  content: msg.content || accumulatedText || 'Respons selesai.',
                  text: msg.text || accumulatedText || 'Respons selesai.',
                  isStreaming: false,
                  streamingStatus: undefined,
                }
              : msg
          )
        )

        recordAiPromptLog({
          provider: streamDoneEvent?.meta?.provider || aiProvider,
          model: streamDoneEvent?.meta?.model || currentModel,
          latencyMs: streamDoneEvent?.meta?.latencyMs,
          contextTab: currentTab,
          userPrompt: rawText,
          assistantReply: accumulatedText || streamDoneEvent?.reply || '',
          toolCalls: streamingToolCalls,
          status: 'success',
          meta: streamDoneEvent?.meta,
        })
      } else {
        // Fallback: non-streaming JSON response
        const data = await res.json()
        if (data.needsKey) {
          triggerAiKeyPrompt({
            featureName: 'Asisten Obrolan Studio AI',
            reason: data.message || data.error || 'Silakan tambahkan API Key untuk melanjutkan percakapan.',
            provider: aiProvider,
          })
        }
        if (data.errorType === 'QUOTA_EXCEEDED' || data.errorType === 'RATE_LIMITED' || data.quotaError) {
          setQuotaError(data.quotaError || {
            provider: data.meta?.provider || data.provider || aiProvider,
            model: data.meta?.model || data.model || currentModel,
            message: data.reply || data.error || 'Batas kuota atau rate limit tercapai',
          })
        }
        if (data.sessionId && data.sessionId !== activeSessionId) {
          setActiveSessionId(data.sessionId)
        }
        fetchSessions(false)

        const report = data.report || data.agenticReport
        const proposed = data.proposedChanges || (() => {
          const m = (data.reply || '').match(/```json:article-changes\s*([\s\S]*?)\s*```/)
          if (m) {
            try { return JSON.parse(m[1]) } catch (_) { return null }
          }
          return null
        })()

        // Direct auto-apply of proposed changes to article editor
        const isCreationPrompt = /(?:buatkan|buat|tuliskan|tulis|generate|terapkan|isi|ganti|ubah)/i.test(rawText)
        const isEditPrompt = /(?:perbaiki|koreksi|sesuaikan|edit)/i.test(rawText)
        const shouldAutoApply = Boolean(
          proposed &&
          onApplyArticleChanges &&
          (data.autoApply || proposed.autoApply || isCreationPrompt || isEditPrompt)
        )

        if (shouldAutoApply && proposed && onApplyArticleChanges) {
          onApplyArticleChanges(proposed)
          const assistantIdx = newMessages.length
          setAppliedChangesMap((prev) => ({
            ...prev,
            [`msg_${assistantIdx}`]: true,
          }))
          const articleTitle = proposed.title || pageContext?.title || 'Draf Artikel'
          showApplyNotice(`Artikel "${articleTitle}" berhasil diterapkan ke editor!`)
        }

        if (data.reply || proposed) {
          const effectiveReply = data.reply || `Draf artikel "${proposed?.title || 'baru'}" telah dibuat dan diterapkan ke editor.`
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMsgId
                ? {
                    ...msg,
                    content: effectiveReply,
                    text: effectiveReply,
                    thoughts: data.thoughts,
                    toolCalls: data.toolCalls || [],
                    agenticReport: report,
                    proposedChanges: proposed,
                    meta: data.meta,
                    isStreaming: false,
                    streamingStatus: undefined,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }
                : msg
            )
          )

          // Catat ke Log Audit Prompt (Periksa apakah respon berisi pesan kendala koneksi atau error flag)
          const isAiError = Boolean(data.isError) || (!data.reply && !proposed) || data.reply?.includes('Kendala Koneksi') || data.reply?.includes('Kunci API Belum Dikonfigurasi') || data.reply?.startsWith('⚠️')
          recordAiPromptLog({
            provider: data.meta?.provider || aiProvider,
            model: data.meta?.model || currentModel,
            latencyMs: data.meta?.latencyMs,
            contextTab: currentTab,
            userPrompt: rawText,
            assistantReply: effectiveReply,
            toolCalls: data.toolCalls,
            status: isAiError ? 'error' : 'success',
            errorMessage: data.errorMessage || (isAiError ? effectiveReply.slice(0, 300) : undefined),
            failoverHistory: data.meta?.failoverHistory || data.failoverHistory,
            meta: data.meta,
          })
        } else {
          const failoverDetail = (data.meta?.failoverHistory || data.failoverHistory || [])
            .map((f: any) => `${f.model} (${f.error})`)
            .join('; ')
          const detailedError = data.error || data.message || (
            failoverDetail
              ? `Seluruh model cadangan gagal: ${failoverDetail}`
              : 'Respons kosong dari AI engine (tidak ada konten artikel atau balasan teks yang valid).'
          )
          const failureMessage = data.error || data.message || (
            failoverDetail
              ? `⚠️ **Kendala Inferensi AI**\n\nSeluruh model AI mengalami kendala inferensi:\n${(data.meta?.failoverHistory || []).map((f: any) => `- \`${f.model}\`: ${f.error}`).join('\n')}\n\nSilakan periksa API Key atau pilih model cadangan di pengaturan.`
              : 'Terjadi kendala saat memproses respons dari agentic engine.'
          )
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMsgId
                ? {
                    ...msg,
                    content: failureMessage,
                    text: failureMessage,
                    meta: data.meta,
                    isStreaming: false,
                    streamingStatus: undefined,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }
                : msg
            )
          )

          recordAiPromptLog({
            provider: data.meta?.provider || aiProvider,
            model: data.meta?.model || currentModel,
            latencyMs: data.meta?.latencyMs,
            contextTab: currentTab,
            userPrompt: rawText,
            assistantReply: failureMessage,
            status: 'error',
            errorMessage: detailedError,
            toolCalls: data.toolCalls,
            failoverHistory: data.meta?.failoverHistory || data.failoverHistory,
            debugInfo: { rawData: data },
            meta: data.meta,
          })
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMsgId
            ? {
                ...msg,
                content: 'Gagal terhubung ke endpoint Studio AI Copilot.',
                text: 'Gagal terhubung ke endpoint Studio AI Copilot.',
                isStreaming: false,
                streamingStatus: undefined,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            : msg
        )
      )

      recordAiPromptLog({
        provider: aiProvider,
        model: currentModel,
        contextTab: currentTab,
        userPrompt: rawText,
        assistantReply: 'Gagal terhubung ke endpoint Studio AI Copilot.',
        status: 'error',
        errorMessage: err?.message || 'Connection failed',
        debugInfo: { error: String(err), stack: err?.stack },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftTopic.trim() || drafting) return

    const activeInfo = getEffectiveApiKey()
    const currentKey = activeInfo.key
    const currentModel = activeInfo.model
    const effectiveProvider = activeInfo.provider

    if (!currentKey) {
      triggerAiKeyPrompt({
        featureName: 'Pembuat Draf Artikel Otomatis',
        reason: `Silakan tambahkan API Key ${
          effectiveProvider === 'google' ? 'Google AI Studio' : 'OpenRouter'
        } Anda terlebih dahulu untuk membuat draf artikel otomatis.`,
        provider: effectiveProvider,
        onSuccess: () => {
          const creds = getStoredAiCredentials(effectiveProvider)
          if (effectiveProvider === 'google') setGoogleKey(creds.apiKey)
          else setOpenrouterKey(creds.apiKey)
        },
      })
      return
    }

    setDrafting(true)

    try {
      let tokenOptConfig: any = {}
      try {
        const rawOpt = localStorage.getItem('unimasi_ai_token_opt')
        if (rawOpt) tokenOptConfig = JSON.parse(rawOpt)
      } catch (err) { console.warn("[observable error]:", err) }

      const activeKeyObj = getActiveApiKey(aiProvider)

      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: draftTopic,
          targetKeyword: draftKeyword || draftTopic,
          aiConfig: {
            provider: effectiveProvider,
            apiKey: currentKey,
            model: currentModel,
            proxyUrl: activeKeyObj?.proxyUrl,
            tokenOptimization: tokenOptConfig,
          },
        }),
      })
      const data = await res.json()
      if (data.needsKey) {
        triggerAiKeyPrompt({
          featureName: 'Pembuat Draf Artikel Otomatis',
          reason: data.error || 'Silakan tambahkan API Key untuk membuat draf artikel.',
          provider: aiProvider,
        })
      }
      if (data.success && data.article) {
        setDraftTopic('')
        setDraftKeyword('')
        setDraftMode(false)
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `**Draf Konten Baru Dibuat (Status: DRAFT)**\n\n- **Judul**: ${data.article.title}\n- **Slug**: \`/artikel/${data.article.slug}\`\n- **Target Keyword**: \`${draftKeyword || draftTopic}\`\n- **Estimasi Baca**: ${data.article.readingTime} menit\n- **Waktu Eksekusi**: Tersimpan aman ke basis data PostgreSQL.\n\nSesuai standar editorial UNIMASI Rule 8, konten disimpan dalam status draft untuk ditinjau oleh Editor/Admin sebelum dipublikasikan.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDrafting(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div
      className={
        variant === 'drawer'
          ? "fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-surface-overlay border-l border-white/15 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
          : "h-full w-full bg-surface-overlay flex flex-col overflow-hidden select-text border-l border-white/10"
      }
    >
      {/* -------------------------------------------------------------
          1. HEADER RINGKAS (identitas + konteks + aksi mode)
      ------------------------------------------------------------- */}
      <div className="px-3 py-2.5 border-b border-white/10 bg-[var(--studio-bg)] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent-500/15 border border-accent-400/30 flex items-center justify-center text-accent-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight truncate">AI Studio Copilot</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
              <span className="sr-only">online</span>
            </div>
            <p className="text-[10px] text-neutral-400 truncate">
              {variant === 'widget' ? 'Widget Chat' : isExpanded ? 'Panel Lebar · Sisi Kanan' : 'Panel Kanan'} · {contextInfo.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Mode widget chat kecil */}
          {onOpenWidget && variant !== 'widget' && (
            <button
              type="button"
              onClick={onOpenWidget}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
              title="Ubah ke mode widget chat kecil"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Kembali ke panel dok (dari widget) */}
          {onOpenPanel && variant === 'widget' && (
            <button
              type="button"
              onClick={onOpenPanel}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
              title="Buka sebagai sidebar dok di sisi kanan"
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Perbesar / kembalikan panel */}
          {variant === 'panel' && (isExpanded ? (
            <button
              type="button"
              onClick={onCollapse}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
              title="Kembalikan ke ukuran sidebar standar"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onExpand}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
              title="Perbesar sidebar di sisi kanan"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          ))}

          {/* Sesi Baru (+ New Chat) */}
          <button
            type="button"
            onClick={handleCreateNewSession}
            className="p-1.5 rounded-lg bg-accent-500/15 hover:bg-accent-500/25 border border-accent-400/30 text-accent-300 transition-all flex items-center justify-center shrink-0"
            title="Mulai Sesi Obrolan Baru"
            aria-label="Mulai Sesi Obrolan Baru"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Riwayat Sesi (Drawer) */}
          <button
            type="button"
            onClick={() => setSessionsDrawerOpen(!sessionsDrawerOpen)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 ${
              sessionsDrawerOpen
                ? 'bg-accent-500/20 border-accent-400/40 text-accent-300'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Daftar Sesi Obrolan (Tersimpan di Server PostgreSQL)"
          >
            <History className="w-3.5 h-3.5" />
            {sessions.length > 0 && (
              <span className="text-[9px] font-mono font-bold text-accent-400">{sessions.length}</span>
            )}
          </button>

          {/* Kompres Sesi (Token & Cache Saver) */}
          <button
            type="button"
            onClick={handleCompressSession}
            disabled={compressing || messages.length < 4}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
              compressing
                ? 'bg-accent-500/20 border-accent-400/40 text-accent-300 animate-pulse'
                : messages.length >= 4
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-white/5 border-white/10 text-neutral-600 cursor-not-allowed opacity-50'
            }`}
            title="Kompresi Sesi: Rangkum percakapan panjang ke memori cache server untuk menghemat token"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>


          {/* Draft Generator Mode Toggle */}
          <button
            type="button"
            onClick={() => setDraftMode(!draftMode)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
              draftMode
                ? 'bg-info/20 border-info/40 text-info-300'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Beralih ke Generator Draf Artikel"
          >
            <PenSquare className="w-3.5 h-3.5" />
          </button>

          {/* AI Settings Modal Toggle */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
              settingsOpen
                ? 'bg-accent-500/20 border-accent-400/40 text-accent-300'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Pengaturan Model & API Key (Google AI Studio & OpenRouter)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Close / Collapse Sidebar */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
            aria-label="Tutup AI Assistant"
            title="Sembunyikan AI Copilot"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. UNIVERSAL MODEL SELECTOR & CAPABILITIES BAR
          (Satu komponen select memuat semua model dari semua provider)
      ------------------------------------------------------------- */}
      {(() => {
        const currentModelId = aiProvider === 'google' ? googleModel : (customModel || openrouterModel)
        const currentModelObj = availableModels.find((m) => m.id === currentModelId)
        const hasVision = Boolean(
          currentModelObj?.hasVision ||
          currentModelObj?.capabilities?.includes('vision') ||
          currentModelId?.toLowerCase().includes('gemini') ||
          currentModelId?.toLowerCase().includes('vision') ||
          currentModelId?.toLowerCase().includes('vl')
        )
        const hasThinking = Boolean(
          currentModelObj?.hasThinking ||
          currentModelObj?.capabilities?.includes('thinking') ||
          currentModelId?.toLowerCase().includes('thinking') ||
          currentModelId?.toLowerCase().includes('nemotron') ||
          currentModelId?.toLowerCase().includes('reason')
        )
        const isFree = Boolean(currentModelObj?.isFree || currentModelId?.endsWith(':free'))
        const isCode = Boolean(currentModelObj?.capabilities?.includes('code') || currentModelId?.toLowerCase().includes('code'))

        return (
          <div className="px-3 py-2 bg-[var(--studio-bg)] border-b border-white/[0.08] space-y-1.5 shrink-0 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Universal Single Model Select Component */}
              <div className="relative flex-1 min-w-0">
                {manualModelInput ? (
                  <input
                    type="text"
                    value={currentModelId}
                    onChange={(e) => {
                      const val = e.target.value
                      if (aiProvider === 'google') setGoogleModel(val)
                      else {
                        setOpenrouterModel(val)
                        setCustomModel(val)
                      }
                      if (activeSessionId) {
                        fetch(`/api/ai/sessions/${activeSessionId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ model: val }),
                        }).catch(() => {})
                      }
                      try {
                        const raw = localStorage.getItem('unimasi_ai_config')
                        const parsed = raw ? JSON.parse(raw) : {}
                        localStorage.setItem(
                          'unimasi_ai_config',
                          JSON.stringify({
                            ...parsed,
                            ...(aiProvider === 'google' ? { googleModel: val } : { openrouterModel: val, customModel: val }),
                          })
                        )
                      } catch (err) { console.warn("[observable error]:", err) }
                    }}
                    placeholder="Ketik model kustom..."
                    className="w-full bg-white/5 border border-accent-400/50 rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#FFD600] focus:outline-none focus:border-accent-400"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={currentModelId}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '__custom__') {
                          setManualModelInput(true)
                          return
                        }
                        const chosen = availableModels.find((m) => m.id === val)
                        const nextProvider = chosen
                          ? chosen.provider
                          : val.toLowerCase().includes('gemini') && !val.includes('/')
                          ? 'google'
                          : 'openrouter'

                        setAiProvider(nextProvider)
                        if (nextProvider === 'google') {
                          setGoogleModel(val)
                        } else {
                          setOpenrouterModel(val)
                          setCustomModel(val)
                        }

                        if (activeSessionId) {
                          fetch(`/api/ai/sessions/${activeSessionId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model: val }),
                          }).catch(() => {})
                        }

                        try {
                          const raw = localStorage.getItem('unimasi_ai_config')
                          const parsed = raw ? JSON.parse(raw) : {}
                          localStorage.setItem(
                            'unimasi_ai_config',
                            JSON.stringify({
                              ...parsed,
                              provider: nextProvider,
                              model: val,
                              ...(nextProvider === 'google'
                                ? { googleModel: val }
                                : { openrouterModel: val, customModel: val }),
                            })
                          )
                        } catch (err) { console.warn("[observable error]:", err) }
                      }}
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-accent-400 truncate cursor-pointer appearance-none pr-6 shadow-sm"
                    >
                      {/* Current selected option if not in groups */}
                      {currentModelId &&
                        !availableModels.some((m) => m.id === currentModelId) && (
                          <option value={currentModelId}>
                            {currentModelId} ({aiProvider === 'google' ? 'Google' : 'OpenRouter'})
                          </option>
                        )}

                      {/* Group 1: Google AI Studio Models */}
                      <optgroup label="Google AI Studio (Gemini)">
                        {availableModels
                          .filter((m) => m.provider === 'google')
                          .map((m) => (
                            <option key={`google-${m.id}`} value={m.id}>
                              {m.name || m.id} {m.hasVision ? '[Vision]' : ''} {m.hasThinking ? '[Thinking]' : ''}
                            </option>
                          ))}
                      </optgroup>

                      {/* Group 2: OpenRouter Universal Models */}
                      <optgroup label="OpenRouter Universal Gateway">
                        {availableModels
                          .filter((m) => m.provider === 'openrouter')
                          .map((m) => (
                            <option key={`openrouter-${m.id}`} value={m.id}>
                              {m.name || m.id} {m.isFree ? '(Free)' : ''} {m.hasVision ? '[Vision]' : ''} {m.hasThinking ? '[Thinking]' : ''}
                            </option>
                          ))}
                      </optgroup>

                      <option value="__custom__">Ketik Model Kustom...</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Action buttons next to select */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setManualModelInput(!manualModelInput)}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
                  title={manualModelInput ? 'Ganti ke dropdown model' : 'Ketik model secara manual'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAvailableModels(getSelectedAiModels())
                    fetchDynamicModels()
                  }}
                  disabled={fetchingModels}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-40"
                  title="Tarik & refresh daftar model"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Model Capabilities & Thinking Controls Strip */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[10px] font-mono">
              <div className="flex flex-wrap items-center gap-1">
                {/* Vision / Multimodal Detection */}
                {hasVision ? (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-info/15 border border-info/30 px-1.5 py-0.2 text-info-300 font-semibold"
                    title="Model mendukung analisis visual & gambar (Multimodal Vision)"
                  >
                    <Eye className="w-2.5 h-2.5 text-info" />
                    <span>Vision</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-1.5 py-0.2 text-neutral-400"
                    title="Model teks standar (Text-only inference)"
                  >
                    <FileText className="w-2.5 h-2.5 text-neutral-400" />
                    <span>Text-Only</span>
                  </span>
                )}

                {/* Free Tier Indicator */}
                {isFree && (
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-emerald-300 font-semibold">
                    Free
                  </span>
                )}

                {/* Code Capability */}
                {isCode && (
                  <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-amber-300">
                    Code
                  </span>
                )}

                {/* Thinking / Reasoning Level Control */}
                {hasThinking && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = thinkingMode === 'auto' ? 'on' : thinkingMode === 'on' ? 'off' : 'auto'
                      setThinkingMode(nextMode)
                      try {
                        const raw = localStorage.getItem('unimasi_ai_config')
                        const parsed = raw ? JSON.parse(raw) : {}
                        localStorage.setItem('unimasi_ai_config', JSON.stringify({ ...parsed, thinkingMode: nextMode }))
                      } catch (err) { console.warn("[observable error]:", err) }
                    }}
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 font-semibold transition-colors border ${
                      thinkingMode === 'on'
                        ? 'bg-purple-500/25 border-purple-500/40 text-purple-200'
                        : thinkingMode === 'off'
                        ? 'bg-white/5 border-white/10 text-neutral-400'
                        : 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                    }`}
                    title="Klik untuk mengubah tingkat reasoning: Auto / On / Off"
                  >
                    <Brain className="w-2.5 h-2.5 text-purple-400" />
                    <span>Thinking: {thinkingMode.toUpperCase()}</span>
                  </button>
                )}
              </div>

              {/* Provider & Token Saver Status */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] border ${
                    aiProvider === 'google'
                      ? 'bg-info/10 border-info/20 text-info'
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                  }`}
                >
                  {aiProvider === 'google' ? 'Google' : 'OpenRouter'}
                </span>

              </div>
            </div>
          </div>
        )
      })()}

      {/* -------------------------------------------------------------
          SESSIONS DRAWER (ChatGPT / Gemini style thread list)
      ------------------------------------------------------------- */}
      {sessionsDrawerOpen && (
        <div className="border-b border-white/10 bg-[var(--studio-sidebar-bg)] p-3 space-y-2.5 max-h-[300px] overflow-y-auto animate-fadeIn shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <History className="w-3.5 h-3.5 text-accent-400" />
              <span>Riwayat Sesi Obrolan ({sessions.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCreateNewSession}
                className="px-2 py-0.5 rounded-md bg-accent-500 hover:bg-accent-400 text-accent-950 font-semibold text-[11px] flex items-center gap-1 transition-all shadow"
                title="Buat sesi obrolan baru"
              >
                <Plus className="w-3 h-3" />
                <span>Obrolan Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setSessionsDrawerOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {sessionsLoading && sessions.length === 0 && (
              <p className="text-[11px] text-neutral-500 py-3 text-center">Memuat riwayat sesi dari server PostgreSQL...</p>
            )}
            {sessions.length === 0 && !sessionsLoading && (
              <p className="text-[11px] text-neutral-500 py-3 text-center">Belum ada riwayat sesi. Klik "+ Obrolan Baru" untuk mulai.</p>
            )}
            {sessions.map((s) => {
              const isActive = s.id === activeSessionId
              const isEditing = editingSessionId === s.id

              return (
                <div
                  key={s.id}
                  onClick={() => !isEditing && loadSession(s.id)}
                  className={`group p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-accent-500/15 border-accent-400/40 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-neutral-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSession(s.id, editTitleInput)
                            if (e.key === 'Escape') setEditingSessionId(null)
                          }}
                          className="bg-black/60 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white w-full focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameSession(s.id, editTitleInput)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium truncate">{s.title || 'Obrolan Tanpa Judul'}</span>
                        {s.summary && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono shrink-0" title="Sesi terkompresi">
                            Cache
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5 font-mono">
                      <span>{s.messageCount || 0} pesan</span>
                      <span>·</span>
                      <span className="truncate">{s.model || 'gemini-2.5-flash'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSessionId(s.id)
                          setEditTitleInput(s.title || '')
                        }}
                        className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
                        title="Ubah judul sesi"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400"
                      title="Hapus sesi dari server"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[9px] font-mono text-neutral-500 text-center pt-1">
            Server PostgreSQL Prisma 8 · Terisolasi Per Pengguna (Non-shared)
          </p>
        </div>
      )}

      {/* -------------------------------------------------------------
          3. DRAFT GENERATOR MODAL VIEW (If draftMode is active)
      ------------------------------------------------------------- */}
      {draftMode ? (
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-surface-elevated">
          <div className="p-4 rounded-xl bg-info-950/30 border border-info/20 space-y-2">
            <div className="flex items-center gap-2 text-info-300 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Pembuatan Draf Konten Otomatis</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              AI akan menyusun draf artikel lengkap dengan struktur heading, ringkasan, dan optimasi SEO lokal.
              Konten disimpan otomatis dalam status <strong>DRAFT</strong> di SQLite untuk mematuhi kaidah editorial.
            </p>
          </div>

          <form onSubmit={handleGenerateDraft} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Topik atau Judul Utama *</label>
              <input
                type="text"
                value={draftTopic}
                onChange={(e) => setDraftTopic(e.target.value)}
                placeholder="Contoh: Optimasi Web Performance dengan Next.js 16"
                className="w-full bg-[var(--studio-bg)] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-accent-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Target Kata Kunci SEO</label>
              <input
                type="text"
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                placeholder="Contoh: performa web nextjs"
                className="w-full bg-[var(--studio-bg)] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-accent-400"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={drafting || !draftTopic.trim()}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-accent-500 to-info-500 hover:from-accent-400 hover:to-info-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {drafting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyusun Draf ke Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate &amp; Simpan ke Draf</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDraftMode(false)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral-300 text-xs hover:bg-white/10"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* -------------------------------------------------------------
            4. CHAT & AGENTIC EXECUTION STREAM
        ------------------------------------------------------------- */
        <div className={`flex-1 overflow-y-auto bg-surface-elevated ${
          isCompact ? 'p-2.5 space-y-2.5' : 'p-4 space-y-4'
        }`}>
          {/* Interactive Warning Banner for 429 Rate Limit & Quota Exhaustion */}
          {quotaError && (
            <InteractiveWarningBanner
              quotaError={quotaError}
              currentProvider={aiProvider}
              onSwitchProvider={handleSwitchProvider}
              onSwitchToFreeModel={handleSwitchToFreeModel}
              onUpdateKey={handleUpdateKey}
              onOpenSettings={() => setSettingsOpen(true)}
              onDismiss={() => setQuotaError(null)}
            />
          )}

          {/* Active Compressed Summary Banner */}
          {activeSessionSummary && (
            <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-400/25 text-neutral-300 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-accent-300 font-semibold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                  Memori Konteks Sesi Terkompresi (Prompt Cache Aktif)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {activeSessionSummary}
              </p>
            </div>
          )}

          {/* Compression notice toast */}
          {compressionNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{compressionNotice}</span>
            </div>
          )}

          {/* Direct Editor Apply Toast Notification */}
          {applyNotice && (
            <div
              data-testid="article-apply-toast"
              className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-fadeIn shadow-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-medium truncate">{applyNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (applyNoticeTimerRef.current) {
                    clearTimeout(applyNoticeTimerRef.current)
                    applyNoticeTimerRef.current = null
                  }
                  // onClick={() => setApplyNotice(null)}
                  setApplyNotice(null)
                }}
                className="text-emerald-400 hover:text-emerald-200 shrink-0 p-0.5 rounded transition-colors"
                title="Tutup pemberitahuan"
                aria-label="Tutup pemberitahuan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Contextual Active Article Pill (Shows AI is deeply synced to this article) */}
          {pageContext && (pageContext.title || pageContext.content) && (
            <div className="p-2.5 rounded-xl bg-accent-500/10 border border-accent-400/25 flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-accent-500/20 border border-accent-400/30 flex items-center justify-center shrink-0 text-accent-300">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-accent-400 tracking-wider">Konteks Halaman Aktif</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[260px]">
                    {pageContext.title || 'Draf Artikel Baru'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] font-bold">
                {typeof pageContext.seoScore === 'number' && (
                  <span className={`px-2 py-0.5 rounded-md border ${
                    pageContext.seoScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    pageContext.seoScore >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`} title="Skor SEO On-Page Real-time">
                    SEO: {pageContext.seoScore}
                  </span>
                )}
                {typeof pageContext.readabilityScore === 'number' && (
                  <span className={`px-2 py-0.5 rounded-md border ${
                    pageContext.readabilityScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    pageContext.readabilityScore >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`} title="Skor Keterbacaan Bahasa Real-time">
                    Baca: {pageContext.readabilityScore}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Empty state with contextual quick actions */}
          {messages.length === 0 && (
            <div className="py-6 px-3 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-500/15 border border-accent-400/30 flex items-center justify-center text-accent-400 shadow-inner">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">AI Studio Copilot</h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  {pageContext?.title
                    ? `Terhubung langsung ke draf "${pageContext.title}". Agen siap mengaudit dan merevisi penulisan agar SEO & Readability mencapai skor 100.`
                    : 'Asisten kecerdasan animasi UNIMASI siap mengaudit SEO, meriset kata kunci, dan menyusun konten editorial.'}
                </p>
              </div>

              {/* Contextual Action Chips for Article */}
              {pageContext && (pageContext.content || pageContext.title) && (
                <div className="pt-2 space-y-1.5 text-left max-w-sm mx-auto">
                  <p className="text-[10px] font-mono uppercase text-neutral-500 font-semibold px-1">Pilihan Cepat Artikel:</p>
                  <button
                    type="button"
                    onClick={() => {
                      setInput('tolong perbaiki penulisan artikel ini untuk membuat skor seo 100 dan keterbacaan 100 perbaiki masalahnya')
                      setTimeout(() => textareaRef.current?.focus(), 50)
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-accent-400/40 text-xs text-neutral-200 transition-all group flex items-start gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-accent-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Perbaiki ke Skor 100/100</div>
                      <div className="text-[10px] text-neutral-400">Analisis masalah &amp; revisi penulisan agar SEO &amp; Keterbacaan mencapai skor 100.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInput('Audit masalah SEO dan keterbacaan pada artikel ini serta jelaskan apa saja yang perlu diperbaiki.')
                      setTimeout(() => textareaRef.current?.focus(), 50)
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-info/40 text-xs text-neutral-200 transition-all group flex items-start gap-2"
                  >
                    <Target className="w-4 h-4 text-info shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Audit Masalah On-Page</div>
                      <div className="text-[10px] text-neutral-400">Tinjau kepadatan keyword, heading, meta deskripsi, dan keterbacaan.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInput('Rekomendasikan 3-5 tautan internal kontekstual ke layanan dan portofolio UNIMASI untuk artikel ini.')
                      setTimeout(() => textareaRef.current?.focus(), 50)
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-400/40 text-xs text-neutral-200 transition-all group flex items-start gap-2"
                  >
                    <ArrowRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Rekomendasi Tautan Internal</div>
                      <div className="text-[10px] text-neutral-400">Tautkan ke halaman layanan dan portofolio resmi UNIMASI.</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {messages.map((m, idx) => (
            <div key={m.id || idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
              {/* Message Bubble */}
              <div
                data-testid={m.role === 'assistant' ? (m.isStreaming ? 'streaming-assistant-bubble' : 'assistant-bubble') : 'user-bubble'}
                className={`rounded-2xl leading-relaxed ${
                  isCompact ? 'max-w-[96%] p-2.5 text-[11px]' : 'max-w-[92%] p-3.5 text-xs'
                } ${
                  m.role === 'user'
                    ? 'bg-accent-500 text-accent-950 rounded-br-none shadow-md font-medium'
                    : 'bg-surface-3 text-neutral-200 border border-white/10 rounded-bl-none shadow-sm'
                }`}
              >
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{m.content || m.text}</div>
                ) : (
                  <>
                    {/* Live Streaming Status Pill */}
                    {m.isStreaming && m.streamingStatus && (
                      <div
                        data-testid="streaming-status-pill"
                        className="mb-2 flex items-center gap-2 text-[10px] font-mono text-[#FFD600] bg-[#FFD600]/10 border border-[#FFD600]/20 px-2.5 py-1 rounded-lg animate-pulse"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD600] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD600]" />
                        </span>
                        <span>{m.streamingStatus}</span>
                      </div>
                    )}

                    {/* Live Collapsible Thinking Bar with subtle pulse */}
                    {m.thoughts && (
                      <LiveThinkingBar
                        thoughts={m.thoughts}
                        isStreaming={m.isStreaming}
                      />
                    )}

                    {/* Step-by-Step ReAct Accordion (Tools & Evidence Timeline) */}
                    {((m.toolCalls && m.toolCalls.length > 0) || m.agenticReport) && (
                      <AgenticReActSteps
                        toolCalls={m.toolCalls}
                        report={m.agenticReport}
                      />
                    )}

                    {/* Markdown Renderer with live blinking cursor */}
                    {(m.content || m.text) ? (
                      <div className="relative">
                        <MarkdownRenderer content={m.content || m.text || ''} />
                        {m.isStreaming && (
                          <span
                            data-testid="streaming-cursor"
                            className="inline-block text-[#FFD600] font-mono animate-pulse ml-0.5 select-none font-bold"
                          >
                            ▌
                          </span>
                        )}
                      </div>
                    ) : m.isStreaming ? (
                      <div className="flex items-center gap-1.5 text-neutral-400 italic text-[11px] py-1">
                        <span
                          data-testid="streaming-cursor"
                          className="inline-block text-[#FFD600] font-mono animate-pulse font-bold"
                        >
                          ▌
                        </span>
                        <span>{m.streamingStatus || 'Menghubungi model AI...'}</span>
                      </div>
                    ) : null}
                  </>
                )}

                {/* Proposed Article Changes Card (One-Click Apply to Editor) */}
                {(() => {
                  const proposed = m.proposedChanges || (() => {
                    const match = (m.content || '').match(/```json:article-changes\s*([\s\S]*?)\s*```/)
                    if (match) {
                      try { return JSON.parse(match[1]) } catch (_) { return null }
                    }
                    return null
                  })()

                  if (!proposed) return null
                  const isApplied = Boolean(appliedChangesMap[`msg_${idx}`])

                  return (
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 to-accent-950/20 border border-emerald-500/30 space-y-2.5 shadow-lg">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Perbaikan Draf Siap Diterapkan</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Target 100/100
                        </span>
                      </div>

                      {/* Summary of changes */}
                      <div className="text-[11px] text-neutral-300 space-y-1.5 bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {proposed.title && (
                          <div className="line-clamp-1">
                            <span className="text-neutral-400 font-medium">Judul Baru: </span>
                            <span className="text-white font-semibold">{proposed.title}</span>
                          </div>
                        )}
                        {proposed.focusKeyphrase && (
                          <div className="line-clamp-1">
                            <span className="text-neutral-400 font-medium">Focus Keyphrase: </span>
                            <span className="text-emerald-300 font-mono">{proposed.focusKeyphrase}</span>
                          </div>
                        )}
                        {proposed.metaDescription && (
                          <div className="line-clamp-2 text-[10px] text-neutral-400">
                            <span className="text-neutral-300 font-medium">Meta Description ({proposed.metaDescription.length} char): </span>
                            {proposed.metaDescription}
                          </div>
                        )}
                        {proposed.coverAlt && (
                          <div className="line-clamp-1 text-[10px] text-neutral-400">
                            <span className="text-neutral-300 font-medium">Alt Text: </span>
                            {proposed.coverAlt}
                          </div>
                        )}
                        {proposed.summary && (
                          <div className="text-[10px] text-neutral-400 italic pt-1 border-t border-white/5">
                            {proposed.summary}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isApplied}
                          onClick={() => {
                            if (onApplyArticleChanges) {
                              onApplyArticleChanges(proposed)
                              setAppliedChangesMap((prev) => ({ ...prev, [`msg_${idx}`]: true }))
                              const articleTitle = proposed.title || pageContext?.title || 'Draf Artikel'
                              showApplyNotice(`Artikel "${articleTitle}" berhasil diterapkan ke editor!`)
                            }
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                            isApplied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 cursor-pointer font-bold'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isApplied ? 'Perubahan Berhasil Diterapkan ke Editor' : 'Terapkan Perubahan ke Editor'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })()}


                {/* Quick Resume Button for Interrupted / Multi-Stage Work */}
                {m.role === 'assistant' && idx === messages.length - 1 && (m.content.includes('lanjutkan') || m.content.includes('Checkpoint')) && !loading && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center">
                    <button
                      type="button"
                      onClick={() => sendMessage('Lanjutkan pekerjaan yang terputus dan selesaikan bagian yang belum tuntas.')}
                      className="w-full py-2 px-3 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 border border-accent-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Lanjutkan Pekerjaan yang Terputus</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Timestamp & Action icons */}
              <div className="flex items-center gap-1.5 px-1 text-[9px] font-mono text-neutral-500">
                <span>{m.timestamp}</span>
                {m.meta?.model && (
                  <>
                    <span>•</span>
                    <span className="text-neutral-400 truncate max-w-[130px]">{m.meta.model}</span>
                    {m.meta.latencyMs && <span>({m.meta.latencyMs}ms)</span>}
                  </>
                )}
                {m.meta?.failoverHistory && m.meta.failoverHistory.length > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 cursor-help"
                    title={`Model Failover:\n${m.meta.failoverHistory.map((f: any) => `• ${f.provider}:${f.model} -> ${f.error}`).join('\n')}`}
                  >
                    Failover ({m.meta.failoverHistory.length})
                  </span>
                )}
                {m.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(m.content, `msg-${idx}`)}
                    className="hover:text-white transition-colors"
                    title="Salin jawaban"
                  >
                    {copiedId === `msg-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Real-time live thinking and responses are now rendered directly within streaming assistant bubbles */}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* -------------------------------------------------------------
          6. MINIMALIST CHAT INPUT WITH TRIGGERS (/, @, $)
      ------------------------------------------------------------- */}
      {!draftMode && (
        <div className={`relative border-t border-white/10 bg-[var(--studio-sidebar-bg)] flex flex-col gap-1.5 shrink-0 ${
          isCompact ? 'p-2' : 'p-3'
        }`}>
          {/* Autocomplete Popup Menu */}
          {activeTrigger && filteredOptions.length > 0 && (
            <div className="absolute bottom-full left-2 right-2 mb-1.5 bg-[var(--studio-bg)] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-30 backdrop-blur-md">
              <div className="px-3 py-1.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                  {activeTrigger === '/'
                    ? 'Perintah Cepat (/)'
                    : activeTrigger === '@'
                    ? 'Target Konteks (@)'
                    : 'Variabel Sistem ($)'}
                </span>
                <span className="text-[9px] text-neutral-500">↑↓ pilih · Enter apply · Esc tutup</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                {filteredOptions.map((opt, oIdx) => {
                  const IconComp = opt.icon
                  const isSelected = oIdx === selectedIndex
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setSelectedIndex(oIdx)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                        isSelected ? 'bg-accent-500/20 text-white' : 'hover:bg-white/5 text-neutral-300'
                      }`}
                    >
                      <div
                        className={`p-1 rounded-md shrink-0 ${
                          isSelected ? 'bg-accent-500/30 text-accent-300' : 'bg-white/5 text-neutral-400'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold font-mono text-accent-400">{opt.label}</span>
                          {opt.action && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-neutral-400 uppercase font-mono">
                              {opt.action}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}


          {/* Missing API Key Notice */}
          {mounted && !getEffectiveApiKey().key && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200">
              <div className="flex items-center gap-1.5 truncate">
                <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Kunci API belum diisi. Masukkan key untuk mengaktifkan AI.</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  triggerAiKeyPrompt({
                    featureName: 'Studio AI Assistant',
                    provider: aiProvider,
                    onSuccess: () => {
                      const creds = getStoredAiCredentials(aiProvider)
                      if (creds.apiKey) {
                        if (creds.provider === 'google') setGoogleKey(creds.apiKey)
                        else setOpenrouterKey(creds.apiKey)
                        setAiProvider(creds.provider)
                      }
                    },
                  })
                }
                className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[10px] shrink-0 transition-colors ml-2"
              >
                + Tambah Key
              </button>
            </div>
          )}

          {/* Clean Upward-Expandable Textarea Input */}
          <div className="flex items-end gap-1.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={`Tanya AI atau ketik / @ $ (${contextInfo.name})...`}
              className={`flex-1 bg-[var(--studio-bg)] border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-accent-400 resize-none min-h-[38px] max-h-[160px] overflow-y-auto leading-relaxed scrollbar-thin ${
                isCompact ? 'px-2.5 py-2 text-xs' : 'px-3.5 py-2.5 text-xs'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                sendMessage()
                if (textareaRef.current) textareaRef.current.style.height = '38px'
              }}
              disabled={loading || !input.trim()}
              className={`bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-accent-950 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center shrink-0 ${
                isCompact ? 'w-8 h-[38px]' : 'w-10 h-[38px]'
              }`}
              title="Kirim (Enter) · Baris baru (Shift + Enter)"
              aria-label="Kirim Pesan"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}


      {/* -------------------------------------------------------------
          8. AI SETTINGS MODAL (Google AI Studio, OpenRouter & UNIMASI Tools)
      ------------------------------------------------------------- */}
      {settingsOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-surface-elevated border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl text-neutral-200 overflow-hidden max-h-[92vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Pengaturan Agentic AI &amp; Tools Native UNIMASI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <StudioAiSettings
              onSaved={() => {
                setSettingsOpen(false)
                try {
                  const saved = localStorage.getItem('unimasi_ai_config')
                  if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed.provider) setAiProvider(parsed.provider)
                    if (parsed.googleApiKey) setGoogleKey(parsed.googleApiKey)
                    if (parsed.openrouterApiKey) setOpenrouterKey(parsed.openrouterApiKey)
                    if (parsed.googleModel) setGoogleModel(parsed.googleModel)
                    if (parsed.openrouterModel) setOpenrouterModel(parsed.openrouterModel)
                    if (parsed.customModel) setCustomModel(parsed.customModel)

                    const prov = parsed.provider || 'google'
                    const activeK = (prov === 'google' ? parsed.googleApiKey : parsed.openrouterApiKey) || ''
                    if (activeK) {
                      fetchDynamicModels(prov, activeK)
                    }
                  }
                } catch (err) { console.warn("[observable error]:", err) }
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
