'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { Check, Copy, Edit3, KeyRound, Lock, RefreshCw, Search, Trash2, UserPlus, X } from 'lucide-react'
import { ROLE_META, ROLE_ORDER, isRole, roleMetaFor } from '@/lib/admin/tabs'
import { ROLE_PERMISSIONS, type Role, type RolePermissions } from '@/lib/auth/types'
import { FormField, IconButton, Modal, StatusMessage, TextButton, fieldCls, type StatusTone } from '@/components/admin/AdminUi'
import { useAuth } from '@/lib/auth/AuthContext'
import { fetchJson, jsonHeaders } from '@/components/studio/admin/fetchJson'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.string().nullable(),
  isBootstrap: z.boolean().optional(),
})
type UserItem = z.infer<typeof userSchema>
const listSchema = z.object({ users: z.array(userSchema) })
const messageSchema = z.object({ message: z.string().optional() }).passthrough()

const USER_ADMINS: readonly Role[] = ['SUPER_ADMIN', 'CONTENT_ADMIN']

/** Cryptographically random initial password (no ambiguous characters). */
function generatePassword(len = 16): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*'
  const bytes = new Uint32Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; user: UserItem }
  | { kind: 'reset'; user: UserItem }
  | { kind: 'delete'; user: UserItem }
  | null

type FormErrors = Partial<Record<'name' | 'email' | 'password', string>>

/* ------------------------------------------------------------------ */
/* Role & permission matrix (formerly the "roles" tab)                 */
/* ------------------------------------------------------------------ */

const PERMISSION_COLUMNS: { key: keyof RolePermissions; label: string }[] = [
  { key: 'canCreateArticle', label: 'Buat draf' },
  { key: 'canSubmitForReview', label: 'Ajukan review' },
  { key: 'canApprove', label: 'Setujui' },
  { key: 'canPublish', label: 'Terbitkan' },
  { key: 'canArchive', label: 'Arsipkan' },
  { key: 'canDeleteArticle', label: 'Hapus' },
  { key: 'canManageSeo', label: 'SEO & redirect' },
]

function RolesMatrix({ currentRole }: { currentRole: Role }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-[var(--studio-bg)]">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-3 text-sm font-semibold">
        <span>Peran &amp; hak akses</span>
        <span className="text-xs font-normal text-neutral-300">
          <span className="group-open:hidden">Tampilkan</span>
          <span className="hidden group-open:inline">Sembunyikan</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-white/10 p-5">
        <p className="text-xs text-neutral-300">
          Alur editorial: Draf → Ditinjau → Disetujui → Terbit → Arsip. Hak di bawah ini ditegakkan di server
          (<code className="font-mono">src/lib/auth/types.ts</code>).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-xs">
            <caption className="sr-only">Hak akses per peran</caption>
            <thead>
              <tr className="border-b border-white/10 text-neutral-200">
                <th scope="col" className="py-2 pr-3 font-semibold">Peran</th>
                {PERMISSION_COLUMNS.map((c) => (
                  <th key={c.key} scope="col" className="px-2 py-2 text-center font-semibold">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLE_ORDER.map((r) => {
                const meta = ROLE_META[r]
                const perms = ROLE_PERMISSIONS[r]
                return (
                  <tr key={r} className="border-b border-white/[0.06]">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      <span className="font-semibold text-white">{meta.label}</span>
                      {r === currentRole && <span className="ml-2 text-[11px] text-accent-300">(peran Anda)</span>}
                      <span className="block text-[11px] text-neutral-300">{meta.description}</span>
                    </th>
                    {PERMISSION_COLUMNS.map((c) => (
                      <td key={c.key} className="px-2 py-2 text-center">
                        {perms[c.key] ? (
                          <>
                            <Check className="mx-auto h-4 w-4 text-emerald-300" aria-hidden="true" />
                            <span className="sr-only">Ya</span>
                          </>
                        ) : (
                          <>
                            <X className="mx-auto h-4 w-4 text-neutral-400" aria-hidden="true" />
                            <span className="sr-only">Tidak</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  )
}

/* ------------------------------------------------------------------ */

export function StudioUsersManager() {
  const { role: myRole, email: myEmail, userId } = useAuth()
  const canManage = USER_ADMINS.includes(myRole)
  const isSuperAdmin = myRole === 'SUPER_ADMIN'

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL')
  const [notice, setNotice] = useState<{ message: string; tone: StatusTone } | null>(null)

  const [dialog, setDialog] = useState<Dialog>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('EDITOR')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!canManage) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    fetchJson('/api/users', listSchema, { signal: controller.signal, fallbackError: 'Daftar pengguna belum bisa dimuat.' }).then((r) => {
      if (controller.signal.aborted) return
      if (r.ok) {
        setUsers(r.data.users)
        setLoadError(null)
      } else setLoadError(r.error)
      setLoading(false)
    })
    return () => controller.abort()
  }, [canManage, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(
      (u) => (roleFilter === 'ALL' || u.role === roleFilter) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
  }, [users, search, roleFilter])

  const assignableRoles = ROLE_ORDER.filter((r) => isSuperAdmin || r !== 'SUPER_ADMIN')
  const isSelf = (u: UserItem) => u.id === userId || u.email.toLowerCase() === myEmail.toLowerCase()
  const canModify = (u: UserItem) => canManage && !u.isBootstrap && (isSuperAdmin || u.role !== 'SUPER_ADMIN')

  const open = (next: Dialog) => {
    setErrors({})
    setFormError(null)
    setCopied(false)
    if (next?.kind === 'add') {
      setName('')
      setEmail('')
      setRole('EDITOR')
      setPassword(generatePassword())
    } else if (next?.kind === 'edit') {
      setName(next.user.name)
      setRole(isRole(next.user.role) ? next.user.role : 'AUTHOR')
    } else if (next?.kind === 'reset') {
      setPassword(generatePassword())
    }
    setDialog(next)
  }
  const close = () => setDialog(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dialog || submitting) return
    const next: FormErrors = {}
    if (dialog.kind === 'add' || dialog.kind === 'edit') {
      if (name.trim().length < 2) next.name = 'Isi nama minimal 2 karakter.'
    }
    if (dialog.kind === 'add' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Isi alamat email yang valid, misalnya nama@spatium.id.'
    if ((dialog.kind === 'add' || dialog.kind === 'reset') && password.length < 8) next.password = 'Kata sandi minimal 8 karakter.'
    setErrors(next)
    if (next.name) return nameRef.current?.focus()
    if (next.email) return emailRef.current?.focus()
    if (next.password) return passwordRef.current?.focus()

    setSubmitting(true)
    setFormError(null)
    const request =
      dialog.kind === 'add'
        ? { method: 'POST', body: { name: name.trim(), email: email.trim().toLowerCase(), role, password } }
        : dialog.kind === 'edit'
        ? { method: 'PATCH', body: { id: dialog.user.id, name: name.trim(), role } }
        : dialog.kind === 'reset'
        ? { method: 'PATCH', body: { id: dialog.user.id, password } }
        : null
    if (!request) {
      setSubmitting(false)
      return
    }
    const r = await fetchJson('/api/users', messageSchema, {
      method: request.method,
      headers: jsonHeaders,
      body: JSON.stringify(request.body),
      fallbackError: 'Perubahan belum tersimpan.',
    })
    setSubmitting(false)
    if (r.ok) {
      setNotice({
        tone: 'success',
        message:
          dialog.kind === 'add'
            ? `Akun ${email.trim().toLowerCase()} dibuat. Bagikan kata sandi awal lewat saluran aman.`
            : dialog.kind === 'reset'
            ? `Kata sandi ${dialog.user.name} direset.`
            : r.data.message || 'Data pengguna diperbarui.',
      })
      close()
      reload()
    } else setFormError(r.error)
  }

  const handleDelete = async () => {
    if (dialog?.kind !== 'delete' || submitting) return
    setSubmitting(true)
    const r = await fetchJson(`/api/users?id=${encodeURIComponent(dialog.user.id)}`, messageSchema, {
      method: 'DELETE',
      fallbackError: 'Akun belum terhapus.',
    })
    setSubmitting(false)
    if (r.ok) {
      setNotice({ tone: 'success', message: r.data.message || `Akun ${dialog.user.name} dihapus.` })
      close()
      reload()
    } else setFormError(r.error)
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch (err) {
      console.warn('[users] Clipboard write failed:', err)
      setFormError('Kata sandi tidak bisa disalin otomatis. Pilih teksnya lalu salin manual.')
    }
  }

  const passwordField = (label: string) => (
    <FormField
      label={label}
      hint="Minimal 8 karakter. Disimpan sebagai hash scrypt."
      error={errors.password}
      action={
        <button type="button" onClick={() => setPassword(generatePassword())} className="min-h-8 rounded-lg px-2 text-[11px] font-semibold text-accent-300 hover:bg-white/10">
          Buat acak
        </button>
      }
    >
      {(p) => (
        <div className="flex gap-2">
          <input
            {...p}
            ref={passwordRef}
            data-autofocus={dialog?.kind === 'reset' ? true : undefined}
            type="text"
            name="new-password"
            autoComplete="new-password"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${fieldCls} font-mono text-xs`}
          />
          <button
            type="button"
            onClick={copyPassword}
            aria-label={copied ? 'Kata sandi tersalin' : 'Salin kata sandi'}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 text-neutral-200 hover:bg-white/10"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      )}
    </FormField>
  )

  const roleField = (
    <FormField label="Peran" hint={ROLE_META[role].description}>
      {(p) => (
        <select {...p} value={role} onChange={(e) => isRole(e.target.value) && setRole(e.target.value)} className={fieldCls}>
          {assignableRoles.map((r) => (
            <option key={r} value={r}>
              {ROLE_META[r].label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  )

  if (!canManage) {
    return (
      <div className="space-y-6">
        <p className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 text-sm text-neutral-200">
          <Lock className="mr-2 inline h-4 w-4 text-neutral-300" aria-hidden="true" />
          Pengelolaan akun hanya untuk Super Admin dan Content Admin. Hubungi admin bila perlu akun baru atau perubahan peran.
        </p>
        <RolesMatrix currentRole={myRole} />
      </div>
    )
  }

  const dialogTitle =
    dialog?.kind === 'add'
      ? 'Tambah pengguna'
      : dialog?.kind === 'edit'
      ? `Ubah ${dialog.user.name}`
      : dialog?.kind === 'reset'
      ? `Reset kata sandi ${dialog.user.name}`
      : ''

  return (
    <div className="space-y-6">
      <StatusMessage message={notice?.message ?? null} tone={notice?.tone} onDismiss={() => setNotice(null)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 sm:w-72">
          <label htmlFor="users-search" className="mb-1 block text-[11px] font-semibold text-neutral-300">
            Cari
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input id="users-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nama atau email" className={`${fieldCls} pl-9`} />
          </div>
        </div>
        <div className="min-w-0 sm:w-56">
          <label htmlFor="users-role" className="mb-1 block text-[11px] font-semibold text-neutral-300">
            Peran
          </label>
          <select
            id="users-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value === 'ALL' || !isRole(e.target.value) ? 'ALL' : e.target.value)}
            className={fieldCls}
          >
            <option value="ALL">Semua peran</option>
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <IconButton icon={RefreshCw} label="Muat ulang daftar pengguna" onClick={reload} spinning={loading} disabled={loading} />
          <TextButton tone="primary" onClick={() => open({ kind: 'add' })}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Tambah pengguna
          </TextButton>
        </div>
      </div>

      <section aria-labelledby="users-heading" className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--studio-bg)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
          <h2 id="users-heading" className="text-sm font-semibold">
            Akun studio
          </h2>
          <p className="text-xs text-neutral-300" aria-live="polite">
            {loading ? 'Memuat…' : `${filtered.length} dari ${users.length} pengguna`}
          </p>
        </div>
        {loadError ? (
          <div role="alert" className="space-y-3 px-5 py-8 text-center text-sm text-red-200">
            <p>{loadError}</p>
            <TextButton onClick={reload}>Coba lagi</TextButton>
          </div>
        ) : !loading && filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-300">
            {users.length === 0 ? 'Belum ada akun di database.' : 'Tidak ada pengguna yang cocok dengan filter.'}
          </p>
        ) : (
          <>
          <p className="px-4 pt-2 text-[11px] text-neutral-300 md:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel pengguna (bisa digeser)">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-neutral-200">
                  <th scope="col" className="px-5 py-2.5 font-semibold">Pengguna</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Peran</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Dibuat</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const meta = roleMetaFor(u.role)
                  const RoleIcon = meta.icon
                  const self = isSelf(u)
                  return (
                    <tr key={u.id} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <span className="block break-words font-semibold text-white">
                          {u.name}
                          {self && <span className="ml-2 text-[11px] font-normal text-accent-300">(Anda)</span>}
                          {u.isBootstrap && <span className="ml-2 text-[11px] font-normal text-amber-200">(bootstrap env)</span>}
                        </span>
                        <span className="block break-all font-mono text-xs text-neutral-300">{u.email}</span>
                      </th>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
                          <RoleIcon className="h-3 w-3" aria-hidden="true" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-200">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canModify(u) ? (
                            <>
                              <IconButton icon={Edit3} size="sm" label={`Ubah nama dan peran ${u.name}`} onClick={() => open({ kind: 'edit', user: u })} />
                              <IconButton icon={KeyRound} size="sm" label={`Reset kata sandi ${u.name}`} onClick={() => open({ kind: 'reset', user: u })} />
                              <IconButton
                                icon={Trash2}
                                size="sm"
                                tone="danger"
                                label={self ? 'Akun Anda sendiri tidak bisa dihapus' : `Hapus akun ${u.name}`}
                                disabled={self}
                                onClick={() => open({ kind: 'delete', user: u })}
                              />
                            </>
                          ) : (
                            <span className="text-xs text-neutral-300">
                              {u.isBootstrap ? 'Diatur lewat env server' : 'Hanya Super Admin'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      <RolesMatrix currentRole={myRole} />

      <Modal
        open={dialog !== null && dialog.kind !== 'delete'}
        onClose={close}
        title={dialogTitle}
        icon={dialog?.kind === 'reset' ? KeyRound : dialog?.kind === 'edit' ? Edit3 : UserPlus}
        tone="info"
        footer={
          <>
            <TextButton onClick={close}>Batal</TextButton>
            <TextButton tone="primary" type="submit" form="user-form" busy={submitting}>
              {submitting ? 'Menyimpan…' : dialog?.kind === 'reset' ? 'Reset kata sandi' : 'Simpan'}
            </TextButton>
          </>
        }
      >
        <form id="user-form" onSubmit={submit} noValidate className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-xl border border-red-400/40 p-3 text-xs text-red-100">
              {formError}
            </p>
          )}
          {(dialog?.kind === 'add' || dialog?.kind === 'edit') && (
            <FormField label="Nama lengkap" error={errors.name}>
              {(p) => <input {...p} data-autofocus ref={nameRef} type="text" name="name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} />}
            </FormField>
          )}
          {dialog?.kind === 'add' && (
            <FormField label="Email" error={errors.email}>
              {(p) => (
                <input {...p} ref={emailRef} type="email" name="email" autoComplete="off" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
              )}
            </FormField>
          )}
          {dialog?.kind === 'edit' && <p className="text-xs text-neutral-300">Email: <span className="font-mono">{dialog.user.email}</span> (tidak bisa diubah)</p>}
          {(dialog?.kind === 'add' || dialog?.kind === 'edit') && roleField}
          {dialog?.kind === 'add' && passwordField('Kata sandi awal')}
          {dialog?.kind === 'reset' && (
            <>
              <p className="text-xs text-neutral-300">
                Kata sandi lama <span className="font-mono">{dialog.user.email}</span> tidak berlaku lagi setelah disimpan.
              </p>
              {passwordField('Kata sandi baru')}
            </>
          )}
        </form>
      </Modal>

      <Modal
        open={dialog?.kind === 'delete'}
        onClose={close}
        title="Hapus akun pengguna?"
        description={
          dialog?.kind === 'delete' ? (
            <>
              {dialog.user.name} ({dialog.user.email}) tidak akan bisa login lagi. Tindakan ini permanen.
            </>
          ) : null
        }
        icon={Trash2}
        tone="danger"
        footer={
          <>
            <TextButton onClick={close}>Batal</TextButton>
            <TextButton tone="danger" onClick={handleDelete} busy={submitting}>
              {submitting ? 'Menghapus…' : 'Hapus akun'}
            </TextButton>
          </>
        }
      >
        {formError && (
          <p role="alert" className="rounded-xl border border-red-400/40 p-3 text-xs text-red-100">
            {formError}
          </p>
        )}
      </Modal>
    </div>
  )
}

export default StudioUsersManager
