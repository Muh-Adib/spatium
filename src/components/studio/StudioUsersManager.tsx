'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  Calendar,
  Mail,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROLE_META } from '@/lib/admin/tabs'
import {
  IconButton,
  Modal,
  Panel,
  SearchField,
  StatusPill,
  TextButton,
  fieldCls,
} from '@/components/admin/AdminUi'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAuth } from '@/lib/auth/AuthContext'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  createdAt: string | null
  isBootstrap?: boolean
}

const ROLES_LIST = [
  'SUPER_ADMIN',
  'CONTENT_ADMIN',
  'EDITOR',
  'AUTHOR',
  'REVIEWER',
  'SEO_MANAGER',
  'MEDIA_MANAGER',
] as const

const initials = (name: string) =>
  (name || 'UNIMASI')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST'

function generateSecurePassword(len = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  let pwd = ''
  for (let i = 0; i < len; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

export function StudioUsersManager() {
  const { role: currentUserRole, actorName, email: currentEmail } = useAuth()
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN'

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  // Notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, message })
    setTimeout(() => setNotice(null), 4000)
  }

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)

  // Add form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<string>('EDITOR')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copiedPwd, setCopiedPwd] = useState(false)

  // Edit form
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')

  // Reset password form
  const [resetPassword, setResetPassword] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
      } else {
        notify(data.error || 'Gagal mengambil data pengguna.', 'error')
      }
    } catch {
      notify('Koneksi ke server gagal saat memuat daftar pengguna.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Handlers
  const handleOpenAdd = () => {
    setNewName('')
    setNewEmail('')
    setNewRole('EDITOR')
    setNewPassword(generateSecurePassword())
    setModalError(null)
    setAddModalOpen(true)
  }

  const handleCreateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setModalError(null)

    if (!newName.trim() || newName.trim().length < 2) {
      setModalError('Nama pengguna minimal 2 karakter.')
      return
    }
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setModalError('Format alamat email tidak valid.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setModalError('Kata sandi awal minimal 8 karakter.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          password: newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        notify(`Pengguna baru "${newName}" (${newEmail}) berhasil ditambahkan!`)
        setAddModalOpen(false)
        setNewName('')
        setNewEmail('')
        setNewPassword('')
        setModalError(null)
        fetchUsers()
      } else {
        const msg = data.error || data.message || 'Gagal menambahkan pengguna baru.'
        setModalError(msg)
        notify(msg, 'error')
      }
    } catch {
      const msg = 'Kesalahan server saat membuat pengguna.'
      setModalError(msg)
      notify(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user)
    setEditName(user.name)
    setEditRole(user.role)
    setModalError(null)
    setEditModalOpen(true)
  }

  const handleUpdateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedUser) return
    setModalError(null)

    if (!editName.trim() || editName.trim().length < 2) {
      setModalError('Nama pengguna minimal 2 karakter.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          name: editName.trim(),
          role: editRole,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        notify(`Data pengguna "${editName}" berhasil diperbarui!`)
        setEditModalOpen(false)
        setModalError(null)
        fetchUsers()
      } else {
        const msg = data.error || data.message || 'Gagal memperbarui data pengguna.'
        setModalError(msg)
        notify(msg, 'error')
      }
    } catch {
      const msg = 'Kesalahan server saat memperbarui data.'
      setModalError(msg)
      notify(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenReset = (user: UserItem) => {
    setSelectedUser(user)
    setResetPassword(generateSecurePassword())
    setModalError(null)
    setResetModalOpen(true)
  }

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedUser) return
    setModalError(null)

    if (!resetPassword || resetPassword.length < 8) {
      setModalError('Kata sandi baru minimal 8 karakter.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          password: resetPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        notify(`Kata sandi untuk "${selectedUser.name}" berhasil direset!`)
        setResetModalOpen(false)
        setModalError(null)
      } else {
        const msg = data.error || data.message || 'Gagal mereset kata sandi.'
        setModalError(msg)
        notify(msg, 'error')
      }
    } catch {
      const msg = 'Kesalahan server saat mereset kata sandi.'
      setModalError(msg)
      notify(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDelete = (user: UserItem) => {
    setSelectedUser(user)
    setModalError(null)
    setDeleteModalOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    setModalError(null)
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(selectedUser.id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        notify(data.message || `Pengguna "${selectedUser.name}" dihapus.`)
        setDeleteModalOpen(false)
        setModalError(null)
        fetchUsers()
      } else {
        const msg = data.error || data.message || 'Gagal menghapus pengguna.'
        setModalError(msg)
        notify(msg, 'error')
      }
    } catch {
      const msg = 'Kesalahan server saat menghapus pengguna.'
      setModalError(msg)
      notify(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const copyPasswordToClipboard = (pwd: string) => {
    navigator.clipboard.writeText(pwd)
    setCopiedPwd(true)
    setTimeout(() => setCopiedPwd(false), 2000)
  }

  return (
    <div className="space-y-6 text-white">
      {/* Toast Notification */}
      {notice && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-[100] flex max-w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
              : 'border-red-500/30 bg-red-950/90 text-red-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          <span className="min-w-0 flex-1">{notice.message}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:max-w-md lg:flex-1">
          <SearchField
            icon={Search}
            value={search}
            onChange={setSearch}
            placeholder="Cari nama atau email pengguna…"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter berdasarkan peran"
          className={`${fieldCls} lg:w-56`}
        >
          <option value="ALL">Semua Peran</option>
          {ROLES_LIST.map((r) => (
            <option key={r} value={r}>
              {ROLE_META[r]?.label || r}
            </option>
          ))}
        </select>

        <span className="font-mono text-xs text-neutral-500 lg:ml-auto">
          {filteredUsers.length} pengguna
        </span>

        <div className="flex items-center gap-2">
          <IconButton
            icon={RefreshCw}
            label="Muat ulang data"
            onClick={fetchUsers}
            disabled={loading}
            spinning={loading}
          />
          {isSuperAdmin && (
            <Tooltip side="top" label="Tambah Akun Baru" hint="Buat kredensial akun pengguna studio">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-500 px-4 text-xs font-semibold text-accent-950 shadow-yellow-glow transition-all hover:bg-accent-300"
              >
                <UserPlus className="h-4 w-4" />
                <span>Tambah Pengguna</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 3. Users Table Panel */}
      <Panel className="overflow-hidden">
        {loading ? (
          <div className="py-24 text-center font-mono text-sm text-neutral-500">Memuat daftar pengguna…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-24 text-center text-sm text-neutral-500">
            Tidak ada akun pengguna yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs font-medium text-neutral-500">
                  <th className="px-6 py-4 font-medium">Pengguna</th>
                  <th className="px-4 py-4 font-medium">Peran / Role</th>
                  <th className="px-4 py-4 font-medium">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((user) => {
                  const roleMeta = ROLE_META[user.role] || ROLE_META.AUTHOR
                  const RoleIcon = roleMeta.icon
                  const isCurrent = currentEmail?.toLowerCase() === user.email.toLowerCase()

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500 font-mono text-xs font-bold text-accent-950 ring-1 ring-white/15">
                            {initials(user.name)}
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-surface-elevated" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold text-white">{user.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-info/20 px-1.5 py-0.5 text-[10px] font-medium text-info-300">
                                  Anda
                                </span>
                              )}
                              {user.isBootstrap && (
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                                  Bootstrap
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                              <Mail className="h-3 w-3 shrink-0 text-neutral-500" />
                              <span className="truncate font-mono">{user.email}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Tooltip label={roleMeta.label} hint={roleMeta.description} side="top">
                          <span
                            tabIndex={0}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${roleMeta.badge}`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {roleMeta.label}
                          </span>
                        </Tooltip>
                      </td>

                      <td className="px-4 py-4 text-xs text-neutral-400 font-mono">
                        {user.createdAt ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                            {new Date(user.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {isSuperAdmin && !user.isBootstrap && (
                            <>
                              <IconButton
                                icon={Edit3}
                                label="Edit nama & peran"
                                size="sm"
                                onClick={() => handleOpenEdit(user)}
                              />
                              <IconButton
                                icon={KeyRound}
                                label="Reset kata sandi"
                                size="sm"
                                tone="info"
                                onClick={() => handleOpenReset(user)}
                              />
                              {!isCurrent ? (
                                <IconButton
                                  icon={Trash2}
                                  label="Hapus pengguna"
                                  size="sm"
                                  tone="danger"
                                  onClick={() => handleOpenDelete(user)}
                                />
                              ) : (
                                <Tooltip label="Terlindungi" hint="Akun aktif Anda tidak dapat dihapus.">
                                  <span tabIndex={0} className="flex h-8 w-8 items-center justify-center text-neutral-600">
                                    <Lock className="h-3.5 w-3.5" />
                                  </span>
                                </Tooltip>
                              )}
                            </>
                          )}
                          {!isSuperAdmin && (
                            <span className="text-xs text-neutral-600">Hanya Super Admin</span>
                          )}
                          {user.isBootstrap && (
                            <Tooltip label="Akun Server" hint="Dikonfigurasi via server env">
                              <span tabIndex={0} className="flex h-8 w-8 items-center justify-center text-amber-500/60">
                                <Shield className="h-3.5 w-3.5" />
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3.5 text-xs text-neutral-500 font-mono">
          <span>Menampilkan {filteredUsers.length} dari {users.length} total pengguna</span>
          <span>Role Policy: Strict RBAC</span>
        </div>
      </Panel>

      {/* 4. MODAL: Tambah Pengguna Baru */}
      <Modal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setModalError(null)
        }}
        title="Tambah Pengguna Baru"
        icon={UserPlus}
        tone="info"
        footer={
          <>
            <TextButton
              onClick={() => {
                setAddModalOpen(false)
                setModalError(null)
              }}
              disabled={submitting}
            >
              Batal
            </TextButton>
            <TextButton
              tone="primary"
              type="submit"
              form="add-user-form"
              disabled={submitting}
              onClick={() => handleCreateUser()}
            >
              {submitting ? 'Menyimpan…' : 'Simpan Pengguna'}
            </TextButton>
          </>
        }
      >
        <form id="add-user-form" onSubmit={handleCreateUser} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Nama Lengkap</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                if (modalError) setModalError(null)
              }}
              placeholder="Contoh: Budi Santoso"
              className={fieldCls}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Alamat Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value)
                if (modalError) setModalError(null)
              }}
              placeholder="budi@unimasi.com"
              className={fieldCls}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Peran &amp; Hak Akses</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className={fieldCls}
            >
              {ROLES_LIST.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r]?.label} — {ROLE_META[r]?.description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">Kata Sandi Awal</label>
              <button
                type="button"
                onClick={() => {
                  setNewPassword(generateSecurePassword())
                  if (modalError) setModalError(null)
                }}
                className="text-[11px] text-accent-400 hover:text-accent-300 font-medium"
              >
                Generate Acak
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (modalError) setModalError(null)
                }}
                placeholder="Minimal 8 karakter"
                className={`${fieldCls} font-mono text-xs`}
                required
                minLength={8}
              />
              <Tooltip label="Salin kata sandi">
                <button
                  type="button"
                  onClick={() => copyPasswordToClipboard(newPassword)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white"
                >
                  {copiedPwd ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </Tooltip>
            </div>
            <p className="text-[11px] text-neutral-500">
              Kata sandi akan dienkripsi dengan standar Scrypt sebelum disimpan.
            </p>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL: Edit Pengguna */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setModalError(null)
        }}
        title="Ubah Data Pengguna"
        icon={Edit3}
        tone="info"
        footer={
          <>
            <TextButton
              onClick={() => {
                setEditModalOpen(false)
                setModalError(null)
              }}
              disabled={submitting}
            >
              Batal
            </TextButton>
            <TextButton
              tone="primary"
              type="submit"
              form="edit-user-form"
              disabled={submitting}
              onClick={() => handleUpdateUser()}
            >
              {submitting ? 'Menyimpan…' : 'Simpan Perubahan'}
            </TextButton>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Nama Lengkap</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value)
                if (modalError) setModalError(null)
              }}
              className={fieldCls}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Alamat Email (Tetap)</label>
            <input
              type="email"
              value={selectedUser?.email || ''}
              disabled
              className={`${fieldCls} opacity-60 font-mono text-xs`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Peran &amp; Hak Akses</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className={fieldCls}
            >
              {ROLES_LIST.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r]?.label} — {ROLE_META[r]?.description}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL: Reset Kata Sandi */}
      <Modal
        open={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false)
          setModalError(null)
        }}
        title="Reset Kata Sandi Pengguna"
        icon={KeyRound}
        tone="warning"
        footer={
          <>
            <TextButton
              onClick={() => {
                setResetModalOpen(false)
                setModalError(null)
              }}
              disabled={submitting}
            >
              Batal
            </TextButton>
            <TextButton
              tone="primary"
              type="submit"
              form="reset-user-form"
              disabled={submitting}
              onClick={() => handleResetPassword()}
            >
              {submitting ? 'Menyimpan…' : 'Reset Kata Sandi'}
            </TextButton>
          </>
        }
      >
        <form id="reset-user-form" onSubmit={handleResetPassword} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{modalError}</span>
            </div>
          )}

          <p className="text-xs text-neutral-400">
            Atur kata sandi baru untuk <strong className="text-white">{selectedUser?.name}</strong> ({selectedUser?.email}).
          </p>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">Kata Sandi Baru</label>
              <button
                type="button"
                onClick={() => {
                  setResetPassword(generateSecurePassword())
                  if (modalError) setModalError(null)
                }}
                className="text-[11px] text-accent-400 hover:text-accent-300 font-medium"
              >
                Generate Acak
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={resetPassword}
                onChange={(e) => {
                  setResetPassword(e.target.value)
                  if (modalError) setModalError(null)
                }}
                placeholder="Minimal 8 karakter"
                className={`${fieldCls} font-mono text-xs`}
                required
                minLength={8}
              />
              <Tooltip label="Salin kata sandi">
                <button
                  type="button"
                  onClick={() => copyPasswordToClipboard(resetPassword)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white"
                >
                  {copiedPwd ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </Tooltip>
            </div>
          </div>
        </form>
      </Modal>

      {/* 7. MODAL: Konfirmasi Hapus Pengguna */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setModalError(null)
        }}
        title="Hapus Akun Pengguna?"
        icon={Trash2}
        tone="danger"
        footer={
          <>
            <TextButton
              onClick={() => {
                setDeleteModalOpen(false)
                setModalError(null)
              }}
              disabled={submitting}
            >
              Batal
            </TextButton>
            <TextButton
              tone="danger"
              disabled={submitting}
              onClick={handleDeleteUser}
            >
              {submitting ? 'Menghapus…' : 'Hapus Permanen'}
            </TextButton>
          </>
        }
      >
        <div className="space-y-3 text-xs text-neutral-400">
          {modalError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{modalError}</span>
            </div>
          )}
          <p>
            Apakah Anda yakin ingin menghapus akun <strong className="text-white">{selectedUser?.name}</strong> ({selectedUser?.email})?
          </p>
          <p className="text-rose-400/90">
            Tindakan ini permanen. Pengguna tidak akan dapat login lagi ke studio.
          </p>
        </div>
      </Modal>
    </div>
  )
}
