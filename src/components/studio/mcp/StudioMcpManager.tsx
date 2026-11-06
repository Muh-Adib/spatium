'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Ban, Check, CheckCircle2, Clock, Copy, KeyRound, Plus, RefreshCw, ShieldAlert, Plug, AlertTriangle } from 'lucide-react'
import { Panel, fieldCls } from '@/components/admin/AdminUi'
import { DEFAULT_MCP_SCOPES, MCP_SCOPES, MCP_SCOPE_INFO, type McpScope } from '@/lib/mcp/scopes'

/**
 * Studio → MCP. Manages per-client API keys for the MCP endpoint and shows
 * ready-to-copy client configuration. Backed by /api/mcp-keys.
 */

type KeyStatus = 'active' | 'revoked' | 'expired'
type McpKey = {
  id: number
  name: string
  keyPrefix: string
  scopes: McpScope[]
  createdBy: string | null
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
  expiresAt: string | null
  status: KeyStatus
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400'
const btnBase = `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${focusRing}`
const btnPrimary = `${btnBase} bg-accent-500 text-accent-950 hover:bg-accent-300`
const btnSecondary = `${btnBase} border border-white/15 text-neutral-200 hover:bg-white/10 hover:text-white`
const btnDanger = `${btnBase} bg-red-500 text-white hover:bg-red-400`

const KEY_PLACEHOLDER = 'spm_KUNCI_ANDA'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object') {
      const rec = body as Record<string, unknown>
      if (typeof rec.message === 'string' && res.status === 403) return 'Hanya Super Admin dan Content Admin yang dapat mengelola kunci MCP.'
      if (typeof rec.error === 'string') return rec.error
    }
  } catch (err) {
    console.warn('[StudioMcpManager] non-JSON error response:', err)
  }
  return fallback
}

// ─── Dialog (native <dialog>: inert background, Escape, focus trap) ──────────

function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusRef,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  initialFocusRef?: React.RefObject<HTMLElement | null>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      initialFocusRef?.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, initialFocusRef])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClose={() => {
        returnFocus.current?.focus()
        returnFocus.current = null
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-white/10 bg-surface-overlay p-0 text-white shadow-2xl backdrop:bg-black/80"
    >
      {open && (
        <div className="max-h-[85dvh] space-y-5 overflow-y-auto p-6">
          <div className="space-y-1.5">
            <h2 id={titleId} className="font-heading text-base font-semibold text-white">
              {title}
            </h2>
            {description && (
              <div id={descId} className="text-sm leading-relaxed text-neutral-300">
                {description}
              </div>
            )}
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

// ─── Status badge (icon + text, never color alone) ────────────────────────────

const STATUS_META: Record<KeyStatus, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  active: { label: 'Aktif', icon: CheckCircle2, cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  revoked: { label: 'Dicabut', icon: Ban, cls: 'border-red-500/30 bg-red-500/10 text-red-300' },
  expired: { label: 'Kedaluwarsa', icon: Clock, cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
}

function StatusBadge({ status }: { status: KeyStatus }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label, onCopied }: { text: string; label: string; onCopied: (message: string) => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopied(`${label} disalin ke clipboard.`)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('[StudioMcpManager] clipboard write failed:', err)
      onCopied('Gagal menyalin. Pilih teksnya lalu salin manual (Ctrl/Cmd + C).')
    }
  }
  return (
    <button type="button" onClick={copy} className={`${btnSecondary} min-h-9 px-3 text-xs`}>
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? 'Disalin' : `Salin ${label.toLowerCase()}`}
    </button>
  )
}

// ─── Client config snippets ───────────────────────────────────────────────────

type Snippet = { id: string; label: string; where: string; code: string }

function buildSnippets(endpoint: string): Snippet[] {
  const k = KEY_PLACEHOLDER
  return [
    {
      id: 'claude-code',
      label: 'Claude Code',
      where: 'Jalankan di terminal (Streamable HTTP).',
      code: `claude mcp add --transport http spatium ${endpoint} \\\n  --header "Authorization: Bearer ${k}"`,
    },
    {
      id: 'claude-desktop',
      label: 'Claude Desktop',
      where: 'claude_desktop_config.json (Settings → Developer → Edit Config). Memakai jembatan mcp-remote karena konfigurasi ini hanya menjalankan perintah lokal.',
      code: JSON.stringify(
        {
          mcpServers: {
            spatium: {
              command: 'npx',
              args: ['-y', 'mcp-remote', endpoint, '--header', 'Authorization:${SPATIUM_AUTH}'],
              env: { SPATIUM_AUTH: `Bearer ${k}` },
            },
          },
        },
        null,
        2,
      ),
    },
    {
      id: 'cursor',
      label: 'Cursor',
      where: '~/.cursor/mcp.json (global) atau .cursor/mcp.json (per proyek).',
      code: JSON.stringify({ mcpServers: { spatium: { url: endpoint, headers: { Authorization: `Bearer ${k}` } } } }, null, 2),
    },
    {
      id: 'windsurf',
      label: 'Windsurf',
      where: '~/.codeium/windsurf/mcp_config.json.',
      code: JSON.stringify({ mcpServers: { spatium: { serverUrl: endpoint, headers: { Authorization: `Bearer ${k}` } } } }, null, 2),
    },
    {
      id: 'vscode',
      label: 'VS Code',
      where: '.vscode/mcp.json di workspace.',
      code: JSON.stringify({ servers: { spatium: { type: 'http', url: endpoint, headers: { Authorization: `Bearer ${k}` } } } }, null, 2),
    },
    {
      id: 'codex',
      label: 'Codex',
      where: '~/.codex/config.toml, lalu set variabel lingkungan SPATIUM_MCP_KEY.',
      code: `[mcp_servers.spatium]\nurl = "${endpoint}"\nbearer_token_env_var = "SPATIUM_MCP_KEY"\n\n# di shell Anda:\n# export SPATIUM_MCP_KEY="${k}"`,
    },
    {
      id: 'curl',
      label: 'Uji curl',
      where: 'Uji cepat: harus mengembalikan daftar tool.',
      code: `curl -s ${endpoint} \\\n  -H "Authorization: Bearer ${k}" \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: application/json, text/event-stream" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
    },
  ]
}

function SnippetTabs({ endpoint, announce }: { endpoint: string; announce: (m: string) => void }) {
  const snippets = buildSnippets(endpoint)
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = snippets.length - 1
    const next =
      e.key === 'ArrowRight' ? (active === last ? 0 : active + 1)
      : e.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  const current = snippets[active]
  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Klien MCP" className="flex flex-wrap gap-1.5" onKeyDown={onKeyDown}>
        {snippets.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${s.id}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`min-h-9 rounded-lg border px-3 text-xs font-semibold transition-colors ${focusRing} ${
              i === active ? 'border-accent-400/60 bg-accent-500/15 text-accent-300' : 'border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${current.id}`} className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 flex-1 basis-60 text-sm text-neutral-300">{current.where}</p>
          <CopyButton text={current.code} label={`Konfigurasi ${current.label}`} onCopied={announce} />
        </div>
        <pre
          tabIndex={0}
          aria-label={`Konfigurasi ${current.label}`}
          className={`whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed text-neutral-200 [overflow-wrap:anywhere] ${focusRing}`}
        >
          {current.code}
        </pre>
      </div>
    </div>
  )
}

// ─── Create key dialog ────────────────────────────────────────────────────────

type FormErrors = { name?: string; scopes?: string; expiresAt?: string; form?: string }

function tomorrow(): string {
  const d = new Date(Date.now() + 86_400_000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function CreateKeyDialog({
  open,
  onClose,
  onCreated,
  announce,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  announce: (m: string) => void
}) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<McpScope[]>([...DEFAULT_MCP_SCOPES])
  const [expiry, setExpiry] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [pending, setPending] = useState(false)
  const [plaintext, setPlaintext] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const firstScopeRef = useRef<HTMLInputElement>(null)
  const expiryRef = useRef<HTMLInputElement>(null)
  const keyRef = useRef<HTMLInputElement>(null)
  const ids = { name: useId(), scopes: useId(), expiry: useId() }

  useEffect(() => {
    if (open) return
    // Forget everything (especially the plaintext key) when the dialog closes.
    setName('')
    setScopes([...DEFAULT_MCP_SCOPES])
    setExpiry('')
    setErrors({})
    setPlaintext(null)
  }, [open])

  useEffect(() => {
    if (plaintext) keyRef.current?.focus()
  }, [plaintext])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pending) return
    const next: FormErrors = {}
    const trimmed = name.trim()
    if (trimmed.length < 2) next.name = 'Isi nama klien, minimal 2 karakter (mis. "Claude Code – Laptop Adib").'
    if (scopes.length === 0) next.scopes = 'Pilih minimal satu izin.'
    let expiresAt: string | null = null
    if (expiry) {
      const end = new Date(`${expiry}T23:59:59`)
      if (Number.isNaN(end.getTime()) || end.getTime() <= Date.now()) next.expiresAt = 'Pilih tanggal setelah hari ini, atau kosongkan.'
      else expiresAt = end.toISOString()
    }
    setErrors(next)
    if (next.name) return nameRef.current?.focus()
    if (next.scopes) return firstScopeRef.current?.focus()
    if (next.expiresAt) return expiryRef.current?.focus()

    setPending(true)
    try {
      const res = await fetch('/api/mcp-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, scopes, expiresAt }),
      })
      if (!res.ok) {
        const body: unknown = await res.clone().json().catch((err: unknown) => {
          console.warn('[StudioMcpManager] create error body unreadable:', err)
          return null
        })
        const fieldErrors = body && typeof body === 'object' && 'fieldErrors' in body ? (body as { fieldErrors: Record<string, string> }).fieldErrors : null
        if (fieldErrors?.name) {
          setErrors({ name: fieldErrors.name })
          nameRef.current?.focus()
        } else {
          setErrors({ form: await readError(res, 'Kunci gagal dibuat. Coba lagi.') })
        }
        return
      }
      const body = (await res.json()) as { plaintext: string }
      setPlaintext(body.plaintext)
      announce(`Kunci "${trimmed}" dibuat. Salin sekarang, kunci hanya ditampilkan sekali.`)
      onCreated()
    } catch (err) {
      console.error('[StudioMcpManager] create failed:', err)
      setErrors({ form: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.' })
    } finally {
      setPending(false)
    }
  }

  if (plaintext) {
    return (
      <Dialog open={open} onClose={onClose} title="Salin kunci API Anda sekarang" initialFocusRef={keyRef}>
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-semibold">Kunci ini hanya ditampilkan sekali.</strong> SPATIUM hanya menyimpan hash-nya. Simpan di
            pengelola kata sandi atau konfigurasi klien. Jika hilang, cabut kunci ini dan buat yang baru.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor={ids.name + '-key'} className="block text-sm font-medium text-neutral-200">
            Kunci API
          </label>
          <input
            ref={keyRef}
            id={ids.name + '-key'}
            readOnly
            value={plaintext}
            onFocus={(e) => e.currentTarget.select()}
            spellCheck={false}
            className={`${fieldCls} font-mono text-xs ${focusRing}`}
          />
          <CopyButton text={plaintext} label="Kunci API" onCopied={announce} />
        </div>
        <div className="flex justify-end border-t border-white/[0.06] pt-4">
          <button type="button" onClick={onClose} className={btnPrimary}>
            Sudah saya simpan
          </button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Buat kunci MCP"
      description="Buat satu kunci per klien atau perangkat, supaya akses bisa dicabut satu per satu."
      initialFocusRef={nameRef}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor={ids.name} className="block text-sm font-medium text-neutral-200">
            Nama klien
          </label>
          <input
            ref={nameRef}
            id={ids.name}
            name="name"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={`${ids.name}-hint${errors.name ? ` ${ids.name}-err` : ''}`}
            className={`${fieldCls} ${focusRing}`}
          />
          <p id={`${ids.name}-hint`} className="text-xs text-neutral-400">
            Muncul di log audit sebagai <code className="font-mono">mcp:&lt;nama&gt;</code>.
          </p>
          {errors.name && (
            <p id={`${ids.name}-err`} className="flex items-center gap-1.5 text-xs text-red-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {errors.name}
            </p>
          )}
        </div>

        <fieldset className="space-y-2" aria-describedby={errors.scopes ? `${ids.scopes}-err` : undefined}>
          <legend className="mb-1 text-sm font-medium text-neutral-200">Izin</legend>
          {MCP_SCOPES.map((scope, i) => (
            <label
              key={scope}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/[0.03] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-400"
            >
              <input
                ref={i === 0 ? firstScopeRef : undefined}
                type="checkbox"
                name="scopes"
                value={scope}
                checked={scopes.includes(scope)}
                onChange={(e) => setScopes((prev) => (e.target.checked ? [...prev, scope] : prev.filter((s) => s !== scope)))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent-500"
              />
              <span className="min-w-0">
                <span className="block text-sm text-white">
                  {MCP_SCOPE_INFO[scope].label} <code className="font-mono text-xs text-neutral-400">{scope}</code>
                </span>
                <span className="block text-xs text-neutral-400">{MCP_SCOPE_INFO[scope].description}</span>
              </span>
            </label>
          ))}
          {errors.scopes && (
            <p id={`${ids.scopes}-err`} className="flex items-center gap-1.5 text-xs text-red-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {errors.scopes}
            </p>
          )}
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor={ids.expiry} className="block text-sm font-medium text-neutral-200">
            Kedaluwarsa <span className="font-normal text-neutral-400">(opsional)</span>
          </label>
          <input
            ref={expiryRef}
            id={ids.expiry}
            type="date"
            name="expiresAt"
            min={tomorrow()}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            aria-invalid={errors.expiresAt ? true : undefined}
            aria-describedby={`${ids.expiry}-hint${errors.expiresAt ? ` ${ids.expiry}-err` : ''}`}
            className={`${fieldCls} ${focusRing} [color-scheme:dark]`}
          />
          <p id={`${ids.expiry}-hint`} className="text-xs text-neutral-400">
            Berlaku sampai akhir hari yang dipilih. Kosongkan agar berlaku sampai dicabut.
          </p>
          {errors.expiresAt && (
            <p id={`${ids.expiry}-err`} className="flex items-center gap-1.5 text-xs text-red-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {errors.expiresAt}
            </p>
          )}
        </div>

        {errors.form && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {errors.form}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/[0.06] pt-4">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Batal
          </button>
          <button type="submit" aria-disabled={pending || undefined} className={`${btnPrimary} aria-disabled:opacity-60`}>
            {pending && <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            Buat kunci
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StudioMcpManager() {
  const [keys, setKeys] = useState<McpKey[] | null>(null)
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [revoking, setRevoking] = useState<McpKey | null>(null)
  const [revokePending, setRevokePending] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const cancelRevokeRef = useRef<HTMLButtonElement>(null)
  const keysHeadingRef = useRef<HTMLHeadingElement>(null)
  const headingId = useId()

  const announce = useCallback((message: string) => {
    // Clear first so repeating the same message is announced again.
    setStatus('')
    window.setTimeout(() => setStatus(message), 50)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mcp-keys', { cache: 'no-store' })
      if (!res.ok) {
        setLoadError(await readError(res, 'Daftar kunci gagal dimuat.'))
        return
      }
      const body = (await res.json()) as { keys: McpKey[]; endpoint: string }
      setKeys(body.keys)
      setEndpoint(body.endpoint)
      setLoadError(null)
    } catch (err) {
      console.error('[StudioMcpManager] load failed:', err)
      setLoadError('Tidak dapat terhubung ke server. Periksa koneksi lalu muat ulang.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const confirmRevoke = async () => {
    if (!revoking || revokePending) return
    setRevokePending(true)
    setRevokeError(null)
    try {
      const res = await fetch(`/api/mcp-keys/${revoking.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setRevokeError(await readError(res, 'Kunci gagal dicabut. Coba lagi.'))
        return
      }
      announce(`Kunci "${revoking.name}" dicabut. Klien yang memakainya langsung ditolak.`)
      setRevoking(null)
      await load()
      // The revoke button is gone now; move focus to the list instead of <body>.
      keysHeadingRef.current?.focus()
    } catch (err) {
      console.error('[StudioMcpManager] revoke failed:', err)
      setRevokeError('Tidak dapat terhubung ke server. Coba lagi.')
    } finally {
      setRevokePending(false)
    }
  }

  const activeCount = keys?.filter((k) => k.status === 'active').length ?? 0

  return (
    <section aria-labelledby={headingId} className="space-y-6">
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl flex-1 basis-72 space-y-2">
          <h2 id={headingId} className="flex items-center gap-2 font-heading text-lg font-semibold text-white">
            <Plug className="h-5 w-5 text-accent-400" aria-hidden="true" />
            Akses MCP
          </h2>
          <p className="text-sm leading-relaxed text-neutral-300">
            MCP (Model Context Protocol) memungkinkan asisten AI seperti Claude, Cursor, atau Windsurf menyusun halaman dari blok katalog
            SPATIUM. Klien hanya dapat <strong className="font-semibold text-white">membuat dan mengubah draf</strong>: menerbitkan,
            mengarsipkan, dan menghapus tetap dilakukan editor di Studio. Setiap perubahan tercatat di log audit atas nama kunci yang dipakai.
          </p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className={btnPrimary}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Buat kunci
        </button>
      </header>

      <Panel className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 ref={keysHeadingRef} tabIndex={-1} className="flex items-center gap-2 text-sm font-semibold text-white focus:outline-none">
            <KeyRound className="h-4 w-4 text-accent-400" aria-hidden="true" />
            Kunci API
            {keys && <span className="font-normal text-neutral-400">({activeCount} aktif dari {keys.length})</span>}
          </h2>
          <button type="button" onClick={() => void load()} aria-disabled={loading || undefined} className={`${btnSecondary} min-h-9 px-3 text-xs`}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
            Muat ulang
          </button>
        </div>

        {loadError ? (
          <div role="alert" className="flex flex-wrap items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1">{loadError}</p>
          </div>
        ) : keys === null ? (
          <p className="text-sm text-neutral-400">Memuat kunci…</p>
        ) : keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm text-neutral-200">Belum ada kunci MCP.</p>
            <p className="mt-1 text-sm text-neutral-400">Buat kunci untuk menghubungkan klien AI pertama Anda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {keys.map((key) => (
              <li key={key.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 basis-72 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-sm font-semibold text-white">{key.name}</h3>
                    <StatusBadge status={key.status} />
                  </div>
                  <p className="font-mono text-xs text-neutral-400">
                    <span className="sr-only">Awalan kunci: </span>
                    {key.keyPrefix}…
                  </p>
                  <ul aria-label="Izin" className="flex flex-wrap gap-1.5">
                    {key.scopes.map((s) => (
                      <li key={s} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-neutral-200">
                        {s}
                      </li>
                    ))}
                  </ul>
                  <dl className="space-y-1 text-xs">
                    {[
                      ['Dibuat', `${formatDate(key.createdAt)}${key.createdBy ? ` oleh ${key.createdBy.replace(/^(user|token):/, '')}` : ''}`],
                      ['Terakhir dipakai', key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Belum pernah'],
                      ...(key.expiresAt ? [['Kedaluwarsa', formatDate(key.expiresAt)]] : []),
                      ...(key.revokedAt ? [['Dicabut', formatDate(key.revokedAt)]] : []),
                    ].map(([term, value]) => (
                      <div key={term} className="flex flex-wrap gap-x-2">
                        <dt className="text-neutral-400 sm:w-32 sm:shrink-0">{term}</dt>
                        <dd className="min-w-0 text-neutral-300">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {key.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRevokeError(null)
                      setRevoking(key)
                    }}
                    aria-label={`Cabut kunci ${key.name}`}
                    className={`${btnBase} min-h-9 border border-red-500/40 px-3 text-xs text-red-300 hover:bg-red-500/15`}
                  >
                    <Ban className="h-4 w-4" aria-hidden="true" />
                    Cabut
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="space-y-4 p-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-white">Hubungkan klien</h2>
          <p className="text-sm text-neutral-300">
            Endpoint (Streamable HTTP):{' '}
            <code className="break-all font-mono text-xs text-accent-300">{endpoint ?? 'memuat…'}</code>. Ganti{' '}
            <code className="font-mono text-xs">{KEY_PLACEHOLDER}</code> dengan kunci yang Anda buat.
          </p>
        </div>
        {endpoint && <SnippetTabs endpoint={endpoint} announce={announce} />}
      </Panel>

      <CreateKeyDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void load()} announce={announce} />

      <Dialog
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        title={revoking ? `Cabut kunci "${revoking.name}"?` : 'Cabut kunci?'}
        description="Klien yang memakai kunci ini langsung ditolak dan tidak bisa diaktifkan lagi. Draf yang sudah dibuat tetap ada."
        initialFocusRef={cancelRevokeRef}
      >
        {revokeError && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {revokeError}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-white/[0.06] pt-4">
          <button ref={cancelRevokeRef} type="button" onClick={() => setRevoking(null)} className={btnSecondary}>
            Batal
          </button>
          <button type="button" onClick={() => void confirmRevoke()} aria-disabled={revokePending || undefined} className={`${btnDanger} aria-disabled:opacity-60`}>
            {revokePending && <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            Cabut kunci
          </button>
        </div>
      </Dialog>
    </section>
  )
}
