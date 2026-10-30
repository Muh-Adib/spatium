'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ShieldCheck, ArrowRight, Lock, Mail, Loader2, Sparkles } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Kredensial tidak valid. Silakan periksa email dan kata sandi Anda.')
        setLoading(false)
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem saat autentikasi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-accent-500/10 via-primary/05 to-transparent rounded-full blur-[140px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-accent-400/50 transition-colors">
              <Image
                src="/images/logo.png"
                alt="SegiaTech"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div className="text-left">
              <span className="font-display font-bold text-lg text-white group-hover:text-accent-300 transition-colors">
                SegiaTech
              </span>
              <span className="block text-[10px] font-mono text-accent-400 uppercase tracking-widest font-semibold">
                Studio Workspace
              </span>
            </div>
          </Link>

          <h1 className="text-2xl font-bold font-display tracking-tight text-white mt-2">
            Autentikasi Studio
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5">
            Masuk ke panel manajemen konten, audit SEO, dan operasional platform SegiaTech.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-[#242424]/90 p-7 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs leading-relaxed flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="studio-email" className="block text-xs font-mono font-medium text-neutral-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="studio-email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  required
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition-colors"
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label htmlFor="studio-password" className="block text-xs font-mono font-medium text-neutral-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="studio-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition-colors"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm text-[#1A1A1A] bg-accent-400 hover:bg-accent-300 transition-all font-display flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengautentikasi...
                </>
              ) : (
                <>
                  Masuk ke Studio
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-neutral-500 mt-6 font-mono">
          © {new Date().getFullYear()} SegiaTech. Arsitektur Terproteksi NextAuth.js
        </p>
      </div>
    </div>
  )
}
