'use client'

import React, { useState } from 'react'
import {
  Database,
  Search,
  ShieldCheck,
  PenSquare,
  Cpu,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { ToolCallExecution } from '@/lib/ai/tool-definitions'

interface GeminiToolCallPillProps {
  toolCall: ToolCallExecution
}

export function GeminiToolCallPill({ toolCall }: GeminiToolCallPillProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'output' | 'input'>('output')
  const [copied, setCopied] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database':
        return <Database className="w-3.5 h-3.5 text-info shrink-0" />
      case 'serp':
        return <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      case 'seo':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      case 'editorial':
        return <PenSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      case 'system':
      default:
        return <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const textToCopy = JSON.stringify(activeTab === 'output' ? toolCall.output : toolCall.input, null, 2)
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-1.5 rounded-xl border border-white/10 bg-[var(--studio-sidebar-bg)] overflow-hidden text-xs transition-all duration-200 hover:border-white/20">
      {/* Pill Header / Trigger Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between gap-2.5 text-left bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-black/50 border border-white/10">
            {getCategoryIcon(toolCall.category)}
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              Tool
            </span>
            <span className="text-neutral-200 font-medium truncate">{toolCall.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
            {toolCall.durationMs}ms
          </span>

          {toolCall.status === 'success' && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Selesai</span>
            </span>
          )}

          {toolCall.status === 'warning' && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Perhatian</span>
            </span>
          )}

          {toolCall.status === 'error' && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <span>Gagal</span>
            </span>
          )}

          <div className="text-neutral-400 ml-0.5">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>

      {/* Expanded Accordion Body (Like Gemini Inspector) */}
      {expanded && (
        <div className="border-t border-white/10 bg-[var(--studio-bg)] p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('output')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  activeTab === 'output'
                    ? 'bg-info/20 text-info-300 font-bold border border-info/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Hasil Output
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('input')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  activeTab === 'input'
                    ? 'bg-info/20 text-info-300 font-bold border border-info/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Parameter Input
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-neutral-400" />
                  <span>Salin JSON</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg bg-black/60 border border-white/5 p-2.5 max-h-56 overflow-y-auto">
            <pre className="font-mono text-[11px] text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
              {JSON.stringify(activeTab === 'output' ? toolCall.output : toolCall.input || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
