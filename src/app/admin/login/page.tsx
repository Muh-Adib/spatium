'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Lock, Mail, ShieldAlert, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import '@/styles/admin.css'

export default function AdminLoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function checkState() {
      try {
        // If already logged in, redirect straight to admin
        const { data: sessionData } = await supabaseBrowser.auth.getSession()
        if (sessionData?.session) {
          router.replace('/admin/')
          return
        }

        // Check if initial admin exists
        const res = await fetch('/api/admin/auth/')
        const data = await res.json()
        setHasAdmin(data.hasAdmin ?? true)
      } catch (err) {
        setHasAdmin(true)
      } finally {
        setChecking(false)
      }
    }
    checkState()
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        router.replace('/admin/')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during login')
      setLoading(false)
    }
  }

  async function handleInitialSetup(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Create user via admin API
      const res = await fetch('/api/admin/auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create admin user')
        setLoading(false)
        return
      }

      // Automatically sign in with newly created account
      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setErrorMsg('User created, but auto sign-in failed. Please login manually.')
        setHasAdmin(true)
        setLoading(false)
        return
      }

      router.replace('/admin/')
    } catch (err: any) {
      setErrorMsg(err.message || 'Setup failed')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="admin-scope" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--adm-emerald)' }} />
      </div>
    )
  }

  return (
    <div className="admin-scope" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div
        className="adm-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.25rem 2rem',
          background: 'var(--adm-card)',
          border: '1px solid var(--adm-border)',
          borderRadius: 'var(--adm-radius-xl)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 1rem',
              borderRadius: '12px',
              background: 'var(--adm-emerald-subtle)',
              border: '1px solid var(--adm-emerald-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--adm-emerald)',
            }}
          >
            {hasAdmin === false ? <Sparkles size={22} /> : <Lock size={22} />}
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--adm-text-primary)', marginBottom: '0.35rem' }}>
            {hasAdmin === false ? 'Setup Admin Account' : 'UNIMASI Studio CMS'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--adm-text-muted)' }}>
            {hasAdmin === false
              ? 'Create your primary administrator account to manage articles.'
              : 'Enter your credentials to access the article management studio.'}
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--adm-radius-md)',
              background: 'var(--adm-red-subtle)',
              border: '1px solid var(--adm-red-border)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1.5rem',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={hasAdmin === false ? handleInitialSetup : handleLogin}>
          <div className="adm-form-group">
            <label className="adm-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              required
              className="adm-input"
              placeholder="admin@unimasi.studio"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="adm-form-group">
            <label className="adm-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              required
              className="adm-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={hasAdmin === false ? 'new-password' : 'current-password'}
            />
          </div>

          {hasAdmin === false && (
            <div className="adm-form-group">
              <label className="adm-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} /> Confirm Password
              </label>
              <input
                type="password"
                required
                className="adm-input"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="adm-btn adm-btn--primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '1.25rem', fontSize: '0.88rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : hasAdmin === false ? (
              <>
                <span>Create & Login</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--adm-border-subtle)', paddingTop: '1.25rem' }}>
          <a
            href="/"
            style={{
              fontSize: '0.78rem',
              color: 'var(--adm-text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--adm-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--adm-text-muted)')}
          >
            ← Back to UNIMASI Website
          </a>
        </div>
      </div>
    </div>
  )
}
