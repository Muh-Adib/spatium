'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Trash2,
  Lock,
  Edit3,
  ExternalLink,
  Crown,
  SearchCheck,
  PenTool,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROLE_META } from '@/lib/admin/tabs'
import { fieldCls, IconButton, TextButton } from './AdminUi'
import { Tooltip } from '@/components/ui/Tooltip'

interface UserProfileModalProps {
  open: boolean
  onClose: () => void
  userRole: string
  userName: string
  userEmail: string
  permissions: {
    canPublish: boolean
    canDeleteArticle: boolean
    canApprove: boolean
    canReview: boolean
    canManageRedirects: boolean
    canManageSeo: boolean
  }
}

const initials = (name: string) =>
  (name || 'UNIMASI')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST'

export function UserProfileModal({
  open,
  onClose,
  userRole,
  userName,
  userEmail,
  permissions,
}: UserProfileModalProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'security'>('profile')

  // Form states
  const [name, setName] = useState(userName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // State loading & messages
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isBootstrap, setIsBootstrap] = useState(false)

  const roleMeta = ROLE_META[userRole] || ROLE_META.AUTHOR
  const RoleIcon = roleMeta.icon

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setName(userName)
  }, [userName])

  useEffect(() => {
    if (!open) {
      setNotice(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      return
    }

    // Fetch live profile details
    fetch('/api/auth/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setName(data.name)
        if (data.isBootstrap) setIsBootstrap(true)
      })
      .catch(() => {})

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSavingName(true)
    setNotice(null)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotice({ type: 'success', message: 'Nama profil berhasil diperbarui.' })
      } else {
        setNotice({ type: 'error', message: data.error || 'Gagal menyimpan nama profil.' })
      }
    } catch {
      setNotice({ type: 'error', message: 'Koneksi ke server gagal.' })
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      setNotice({ type: 'error', message: 'Harap isi kata sandi saat ini dan kata sandi baru.' })
      return
    }
    if (newPassword.length < 8) {
      setNotice({ type: 'error', message: 'Kata sandi baru minimal 8 karakter.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok.' })
      return
    }

    setIsSavingPassword(true)
    setNotice(null)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotice({ type: 'success', message: 'Kata sandi berhasil diperbarui.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setNotice({ type: 'error', message: data.error || 'Gagal memperbarui kata sandi.' })
      }
    } catch {
      setNotice({ type: 'error', message: 'Koneksi ke server gagal.' })
    } finally {
      setIsSavingPassword(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan Pengguna & Profil"
        className="relative my-auto w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header Profil */}
        <div className="relative border-b border-white/[0.06] bg-gradient-to-r from-white/[0.04] to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-500 font-mono text-lg font-bold text-accent-950 ring-2 ring-white/20">
                {initials(name || userName)}
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#1A1A1A]" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-white">{name || userName || 'Pengguna Admin'}</h3>
                <p className="truncate text-xs text-neutral-400">{userEmail || 'admin@unimasi.com'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${roleMeta.badge}`}>
                    <RoleIcon className="h-3 w-3" aria-hidden="true" />
                    {roleMeta.label}
                  </span>
                  {isBootstrap && (
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                      Bootstrap Mode
                    </span>
                  )}
                </div>
              </div>
            </div>
            <IconButton icon={X} label="Tutup" size="sm" onClick={onClose} />
          </div>

          {/* Section Navigation */}
          <div className="mt-6 flex items-center gap-2 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === 'profile'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Profil &amp; Hak Akses
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('security')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === 'security'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Keamanan Kata Sandi
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5 scrollbar-none">
          {/* Notification feedback */}
          {notice && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                notice.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {notice.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="flex-1 leading-relaxed">{notice.message}</span>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Form Nama Lengkap */}
              <form onSubmit={handleSaveName} className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Nama Tampilan
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className={fieldCls}
                    required
                  />
                  <TextButton
                    type="submit"
                    tone="primary"
                    onClick={undefined}
                  >
                    {isSavingName ? 'Menyimpan…' : 'Simpan'}
                  </TextButton>
                </div>
              </form>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Alamat Email
                </label>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs">
                  <span className="font-mono text-neutral-200">{userEmail || 'admin@unimasi.com'}</span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Terotentikasi
                  </span>
                </div>
              </div>

              {/* Otoritas & Hak Akses Pengguna */}
              <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Ringkasan Hak Akses Anda</span>
                  <span className="text-[11px] text-neutral-400">{roleMeta.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
                    {permissions.canPublish ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-neutral-500" />
                    )}
                    <span className={permissions.canPublish ? 'text-neutral-200' : 'text-neutral-500'}>
                      Publikasi Konten
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
                    {permissions.canDeleteArticle ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-neutral-500" />
                    )}
                    <span className={permissions.canDeleteArticle ? 'text-neutral-200' : 'text-neutral-500'}>
                      Hapus Permanen
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
                    {permissions.canApprove ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-neutral-500" />
                    )}
                    <span className={permissions.canApprove ? 'text-neutral-200' : 'text-neutral-500'}>
                      Setujui Draf
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
                    {permissions.canManageRedirects ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-neutral-500" />
                    )}
                    <span className={permissions.canManageRedirects ? 'text-neutral-200' : 'text-neutral-500'}>
                      Kelola 301 &amp; SEO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-4">
              {isBootstrap ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-200">
                  <p className="font-semibold text-amber-300">Akun Bootstrap Super Admin</p>
                  <p className="mt-1 text-amber-200/80">
                    Akun ini dikonfigurasi melalui environment variable server. Untuk memperbarui kredensial, ubah variabel <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[11px]">BOOTSTRAP_ADMIN_PASSWORD_HASH</code> di file konfigurasi server.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Kata Sandi Saat Ini</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={fieldCls}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Kata Sandi Baru (min. 8 karakter)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={fieldCls}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Konfirmasi Kata Sandi Baru</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={fieldCls}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <TextButton type="submit" tone="primary">
                      {isSavingPassword ? 'Memperbarui…' : 'Perbarui Kata Sandi'}
                    </TextButton>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/[0.06] bg-[#141414] px-6 py-3.5">
          <TextButton onClick={onClose}>Tutup</TextButton>
        </div>
      </div>
    </div>,
    document.body
  )
}

