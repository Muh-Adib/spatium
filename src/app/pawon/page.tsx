'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ShieldCheck, ArrowRight, Lock, Mail, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react'

export default function PawonLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Kredensial tidak valid. Silakan periksa email/username dan kata sandi Anda.')
        setLoading(false)
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat autentikasi.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[var(--studio-bg,#0b0f19)] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-accent-500/15 via-primary/05 to-transparent rounded-full blur-[140px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-accent-400/50 transition-colors">
              <span className="font-heading font-black text-xl text-accent-400">S</span>
            </div>
            <div className="text-left">
              <span className="font-heading font-bold text-lg text-white group-hover:text-accent-400 transition-colors">
                SPATIUM
              </span>
              <span className="block text-[10px] font-mono text-accent-400 uppercase tracking-widest font-semibold">
                Studio Workspace • Pawon
              </span>
            </div>
          </Link>

          <h1 className="text-2xl font-bold font-heading tracking-tight text-white mt-2">
            Autentikasi Studio (Pawon)
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 font-sans">
            Masuk ke panel manajemen konten, katalog layanan, dan operasional platform Spatium.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-accent-400/20 bg-surface-elevated/90 p-7 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs leading-relaxed flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="studio-email" className="block text-xs font-mono font-medium text-neutral-300 mb-1.5">
                Alamat Email atau Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="studio-email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@spatium.id"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-neutral-900/60 border border-neutral-700/60 focus:border-accent-400 focus:ring-1 focus:ring-accent-400 text-white text-sm placeholder:text-neutral-500 transition-colors outline-none font-sans"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
            </div>

            <div>
              <label htmlFor="studio-password" className="block text-xs font-mono font-medium text-neutral-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="studio-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-neutral-900/60 border border-neutral-700/60 focus:border-accent-400 focus:ring-1 focus:ring-accent-400 text-white text-sm placeholder:text-neutral-500 transition-colors outline-none font-mono"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-accent-400 hover:bg-accent-300 text-brand-dark font-medium font-sans text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-accent-400/20 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-dark" />
                  <span>Memverifikasi Sesi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-brand-dark" />
                </>
              )}
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
              <span>RBAC NextAuth Protected</span>
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent-400" />
              <span>Studio Engine</span>
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-neutral-400 hover:text-white transition-colors font-mono"
          >
            ← Kembali ke Beranda Spatium
          </Link>
        </div>
      </div>
    </div>
  )
}
