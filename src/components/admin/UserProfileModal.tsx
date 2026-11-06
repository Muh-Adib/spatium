'use client'

import React, { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { Check, Lock, User } from 'lucide-react'
import { roleMetaFor } from '@/lib/admin/tabs'
import { FormField, Modal, StatusMessage, TextButton, fieldCls, type StatusTone } from './AdminUi'

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
    canManageRedirects: boolean
  }
}

const profileResponseSchema = z.object({
  name: z.string().optional(),
  isBootstrap: z.boolean().optional(),
  error: z.string().optional(),
})

type PasswordErrors = Partial<Record<'current' | 'next' | 'confirm', string>>

export function UserProfileModal({ open, onClose, userRole, userName, userEmail, permissions }: UserProfileModalProps) {
  const [name, setName] = useState(userName)
  const [nameError, setNameError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwErrors, setPwErrors] = useState<PasswordErrors>({})
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null)
  const [isBootstrap, setIsBootstrap] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const currentRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const roleMeta = roleMetaFor(userRole)

  useEffect(() => {
    setName(userName)
  }, [userName])

  useEffect(() => {
    if (!open) {
      setStatus(null)
      setNameError(null)
      setPwErrors({})
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      return
    }
    const controller = new AbortController()
    fetch('/api/auth/profile', { signal: controller.signal })
      .then((res) => res.json())
      .then((raw: unknown) => {
        const data = profileResponseSchema.safeParse(raw)
        if (!data.success) {
          console.warn('[profile] Unexpected profile response shape')
          return
        }
        if (data.data.name) setName(data.data.name)
        setIsBootstrap(Boolean(data.data.isBootstrap))
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        console.warn('[profile] Could not load profile:', err)
      })
    return () => controller.abort()
  }, [open])

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingName) return
    if (name.trim().length < 2) {
      setNameError('Isi nama minimal 2 karakter.')
      nameRef.current?.focus()
      return
    }
    setNameError(null)
    setSavingName(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = profileResponseSchema.safeParse(await res.json())
      if (res.ok) setStatus({ tone: 'success', message: 'Nama tampilan disimpan.' })
      else setStatus({ tone: 'error', message: (data.success && data.data.error) || 'Nama belum tersimpan. Coba lagi.' })
    } catch (err) {
      console.error('[profile] Save name failed:', err)
      setStatus({ tone: 'error', message: 'Server tidak terjangkau. Periksa koneksi lalu coba lagi.' })
    } finally {
      setSavingName(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingPassword) return
    const errors: PasswordErrors = {}
    if (!currentPassword) errors.current = 'Isi kata sandi saat ini.'
    if (newPassword.length < 8) errors.next = 'Kata sandi baru minimal 8 karakter.'
    if (confirmPassword !== newPassword) errors.confirm = 'Konfirmasi harus sama dengan kata sandi baru.'
    setPwErrors(errors)
    if (errors.current) return currentRef.current?.focus()
    if (errors.next) return nextRef.current?.focus()
    if (errors.confirm) return confirmRef.current?.focus()

    setSavingPassword(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = profileResponseSchema.safeParse(await res.json())
      if (res.ok) {
        setStatus({ tone: 'success', message: 'Kata sandi diperbarui.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setStatus({ tone: 'error', message: (data.success && data.data.error) || 'Kata sandi belum diperbarui. Coba lagi.' })
      }
    } catch (err) {
      console.error('[profile] Save password failed:', err)
      setStatus({ tone: 'error', message: 'Server tidak terjangkau. Periksa koneksi lalu coba lagi.' })
    } finally {
      setSavingPassword(false)
    }
  }

  const perms: { label: string; allowed: boolean }[] = [
    { label: 'Menerbitkan konten', allowed: permissions.canPublish },
    { label: 'Menyetujui draf', allowed: permissions.canApprove },
    { label: 'Menghapus permanen', allowed: permissions.canDeleteArticle },
    { label: 'Mengelola redirect & SEO', allowed: permissions.canManageRedirects },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profil & kata sandi"
      description={
        <>
          {userEmail || '—'} · Peran: {roleMeta.label}
          {isBootstrap ? ' · akun bootstrap (diatur lewat env server)' : ''}
        </>
      }
      icon={User}
      tone="info"
      className="w-[min(34rem,calc(100%-2rem))]"
      footer={<TextButton onClick={onClose}>Tutup</TextButton>}
    >
      <StatusMessage message={status?.message ?? null} tone={status?.tone} onDismiss={() => setStatus(null)} />

      <form onSubmit={handleSaveName} noValidate className="space-y-3">
        <FormField label="Nama tampilan" error={nameError}>
          {(p) => (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                {...p}
                ref={nameRef}
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldCls}
              />
              <TextButton type="submit" tone="primary" busy={savingName} className="shrink-0">
                {savingName ? 'Menyimpan…' : 'Simpan nama'}
              </TextButton>
            </div>
          )}
        </FormField>
      </form>

      <section aria-labelledby="profile-perm-heading" className="space-y-2 rounded-xl border border-white/10 p-3">
        <h3 id="profile-perm-heading" className="text-xs font-semibold text-white">
          Hak akses peran {roleMeta.label}
        </h3>
        <p className="text-[11px] text-neutral-300">{roleMeta.description}</p>
        <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
          {perms.map((p) => (
            <li key={p.label} className="flex items-center gap-2">
              {p.allowed ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
              )}
              <span className={p.allowed ? 'text-neutral-100' : 'text-neutral-300'}>
                {p.label}: {p.allowed ? 'boleh' : 'tidak'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {isBootstrap ? (
        <p className="rounded-xl border border-amber-400/40 p-3 text-xs leading-relaxed text-amber-100">
          Kata sandi akun bootstrap diatur lewat variabel{' '}
          <code className="font-mono text-[11px]">BOOTSTRAP_ADMIN_PASSWORD_HASH</code> di server.
        </p>
      ) : (
        <form onSubmit={handleSavePassword} noValidate className="space-y-3">
          <h3 className="text-xs font-semibold text-white">Ganti kata sandi</h3>
          <FormField label="Kata sandi saat ini" error={pwErrors.current}>
            {(p) => (
              <input
                {...p}
                ref={currentRef}
                type="password"
                name="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldCls}
              />
            )}
          </FormField>
          <FormField label="Kata sandi baru" hint="Minimal 8 karakter." error={pwErrors.next}>
            {(p) => (
              <input
                {...p}
                ref={nextRef}
                type="password"
                name="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldCls}
              />
            )}
          </FormField>
          <FormField label="Ulangi kata sandi baru" error={pwErrors.confirm}>
            {(p) => (
              <input
                {...p}
                ref={confirmRef}
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldCls}
              />
            )}
          </FormField>
          <div className="flex justify-end">
            <TextButton type="submit" tone="primary" busy={savingPassword}>
              {savingPassword ? 'Memperbarui…' : 'Perbarui kata sandi'}
            </TextButton>
          </div>
        </form>
      )}
    </Modal>
  )
}
