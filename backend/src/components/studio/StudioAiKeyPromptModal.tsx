'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  KeyRound,
  Sparkles,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  ArrowRight,
} from 'lucide-react'
import {
  saveApiKeyItem,
  getStoredAiCredentials,
  type AiKeyPromptEventDetail,
} from '@/lib/ai/key-manager'
import Link from 'next/link'

export function StudioAiKeyPromptModal() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [featureName, setFeatureName] = useState<string>('Fitur AI')
  const [reason, setReason] = useState<string>('')
  const [provider, setProvider] = useState<'google' | 'openrouter'>('google')
  const [apiKey, setApiKey] = useState<string>('')
  const [model, setModel] = useState<string>('gemini-2.5-flash')
  const [showKey, setShowKey] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null)

  useEffect(() => {
    setMounted(true)

    const handlePrompt = (event: Event) => {
      const customEvent = event as CustomEvent<AiKeyPromptEventDetail>
      const detail = customEvent.detail || {}

      const creds = getStoredAiCredentials(detail.provider)
      const targetProvider = detail.provider || creds.provider || 'google'

      setFeatureName(detail.featureName || 'Fitur AI')
      setReason(
        detail.reason ||
          `Fitur ini memerlukan API Key aktif (${
            targetProvider === 'google' ? 'Google AI Studio' : 'OpenRouter'
          }) untuk memproses permintaan Anda.`
      )
      setProvider(targetProvider)
      setApiKey(creds.apiKey || '')
      setModel(
        creds.model ||
          (targetProvider === 'google' ? 'gemini-2.5-flash' : 'google/gemini-2.0-flash-exp:free')
      )
      setError(null)
      setSuccessMsg(null)
      setShowKey(false)
      setOnSuccessCallback(() => detail.onSuccess || null)
      setIsOpen(true)
    }

    window.addEventListener('segiatech:open-ai-key-modal', handlePrompt)
    window.addEventListener('open-ai-key-modal', handlePrompt)

    return () => {
      window.removeEventListener('segiatech:open-ai-key-modal', handlePrompt)
      window.removeEventListener('open-ai-key-modal', handlePrompt)
    }
  }, [])

  const handleProviderChange = (newProvider: 'google' | 'openrouter') => {
    setProvider(newProvider)
    const creds = getStoredAiCredentials(newProvider)
    setApiKey(creds.apiKey || '')
    setModel(
      newProvider === 'google' ? 'gemini-2.5-flash' : 'google/gemini-2.0-flash-exp:free'
    )
    setError(null)
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanKey = apiKey.trim()

    if (!cleanKey) {
      setError(`Silakan masukkan API Key ${provider === 'google' ? 'Google AI Studio' : 'OpenRouter'}.`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // 1. Simpan ke Key Pool via key-manager
      saveApiKeyItem({
        name: `${provider === 'google' ? 'Google Gemini' : 'OpenRouter'} Primary`,
        provider,
        key: cleanKey,
        isActive: true,
        testedModel: model.trim(),
      })

      // 2. Sinkronisasi ke legacy localStorage `segiatech_ai_config`
      try {
        const raw = localStorage.getItem('segiatech_ai_config')
        const current = raw ? JSON.parse(raw) : {}
        const updated = {
          ...current,
          provider,
          [provider === 'google' ? 'googleApiKey' : 'openrouterApiKey']: cleanKey,
          [provider === 'google' ? 'googleModel' : 'openrouterModel']: model.trim(),
        }
        localStorage.setItem('segiatech_ai_config', JSON.stringify(updated))
      } catch (_) {}

      // 3. Dispatch notifikasi perubahan key ke seluruh listener
      window.dispatchEvent(
        new CustomEvent('segiatech:ai-key-updated', {
          detail: { provider, apiKey: cleanKey, model: model.trim() },
        })
      )

      setSuccessMsg('Kunci API berhasil disimpan dan diaktifkan!')

      if (onSuccessCallback) {
        try {
          onSuccessCallback()
        } catch (_) {}
      }

      setTimeout(() => {
        setIsOpen(false)
        setSuccessMsg(null)
      }, 900)
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan kunci API.')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-key-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-[#181818] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-neutral-200 overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 id="ai-key-modal-title" className="text-base font-bold text-white tracking-wide">
                Kunci API Diperlukan
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Konfigurasi API Key untuk menjalankan <span className="text-amber-300 font-semibold">{featureName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason banner */}
        {reason && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{reason}</span>
          </div>
        )}

        {/* Provider Switcher */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
            Pilih Provider AI
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleProviderChange('google')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                provider === 'google'
                  ? 'bg-amber-500/20 border-amber-400/50 text-white shadow-sm'
                  : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200'
              }`}
            >
              <span>Google AI Studio</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gratis
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange('openrouter')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                provider === 'openrouter'
                  ? 'bg-amber-500/20 border-amber-400/50 text-white shadow-sm'
                  : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200'
              }`}
            >
              <span>OpenRouter</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Multi-Model
              </span>
            </button>
          </div>
        </div>

        {/* Key Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
                API Key {provider === 'google' ? 'Google Gemini' : 'OpenRouter'}
              </label>
              {provider === 'google' ? (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                >
                  <span>Dapatkan Kunci Gratis</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                >
                  <span>Buka OpenRouter Keys</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === 'google'
                    ? 'AIzaSy...'
                    : 'sk-or-v1-...'
                }
                autoFocus
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                aria-label={showKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
              Model yang Digunakan
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === 'google' ? 'gemini-2.5-flash' : 'google/gemini-2.0-flash-exp:free'}
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-neutral-200 text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-400/50"
            />
            <p className="text-[10px] text-neutral-500">
              Rekomendasi: {provider === 'google' ? 'gemini-2.5-flash (tercepat & gratis)' : 'google/gemini-2.0-flash-exp:free (gratis 1M token)'}
            </p>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/admin?tab=ai-settings"
              onClick={() => setIsOpen(false)}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors order-2 sm:order-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan AI Lengkap</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || !apiKey.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan & Aktifkan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
