'use client'

import './admin.css'
import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext'
import { Tooltip } from '@/components/ui/Tooltip'
import { siteConfig } from '@/config/site'
import { Modal, TextButton } from '@/components/admin/AdminUi'
import { UserProfileModal } from '@/components/admin/UserProfileModal'
import {
  NAV_GROUPS,
  TAB_META,
  WRITE_ARTICLE_META,
  canSeeTab,
  resolveAdminTab,
  roleMetaFor,
  tabHref,
  type AdminTab,
  type NavGroup,
} from '@/lib/admin/tabs'
import type { Role } from '@/lib/auth/types'
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  Menu,
  PenSquare,
  User,
  X,
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const SIDEBAR_PREF_KEY = 'spatium_sidebar_collapsed'

const initials = (name: string) =>
  (name || 'SPATIUM')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SP'

function Avatar({ name, size }: { name: string; size: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-accent-950`}
    >
      {initials(name)}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Nav list (shared by the desktop rail and the mobile drawer)         */
/* ------------------------------------------------------------------ */

function NavGroups({
  groups,
  collapsed,
  isActive,
  onNavigate,
}: {
  groups: NavGroup[]
  collapsed: boolean
  isActive: (tab: AdminTab) => boolean
  onNavigate?: () => void
}) {
  return (
    <>
      {groups.map((group, gi) => {
        const headingId = `nav-group-${group.id}${collapsed ? '-c' : ''}`
        return (
          <div key={group.id} className={gi > 0 ? 'mt-3 border-t border-white/[0.08] pt-3' : ''}>
            <h2
              id={headingId}
              className={
                collapsed
                  ? 'sr-only'
                  : 'mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400'
              }
            >
              {group.label}
            </h2>
            <ul aria-labelledby={headingId} className="space-y-1">
              {group.tabs.map((tab) => {
                const m = TAB_META[tab]
                const Icon = m.icon
                const active = isActive(tab)
                const link = (
                  <Link
                    href={tabHref(tab)}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex min-h-10 w-full items-center rounded-xl transition-colors ${
                      collapsed ? 'justify-center' : 'gap-3 px-3 py-2'
                    } ${active ? 'bg-accent-400/15 text-white' : 'text-neutral-300 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className={`absolute h-5 w-1 rounded-r-full bg-accent-400 ${collapsed ? '-left-3' : '-left-3'}`}
                      />
                    )}
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-accent-300' : ''}`} aria-hidden="true" />
                    <span className={collapsed ? 'sr-only' : 'min-w-0 text-[13px] font-medium'}>{m.label}</span>
                  </Link>
                )
                return (
                  <li key={tab}>
                    {collapsed ? (
                      <Tooltip side="right" label={m.label} hint={m.description} className="w-full">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function AdminNavContent({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { role, actorName, email, logout, isAuthenticated, permissions } = useAuth()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDialogElement>(null)

  const currentTab = resolveAdminTab(searchParams?.get('tab'))
  const prevTabRef = useRef<AdminTab>(currentTab)
  const meta = TAB_META[currentTab]
  const HeaderIcon = meta.icon
  const userRole: Role | null = isAuthenticated ? role : null

  const roleMeta = roleMetaFor(role)
  const roleLabel = isAuthenticated ? roleMeta.label : 'Memeriksa akun'

  const visibleGroups = NAV_GROUPS.map((g) => ({ ...g, tabs: g.tabs.filter((t) => canSeeTab(t, userRole)) })).filter(
    (g) => g.tabs.length > 0
  )

  const isActive = useCallback((tab: AdminTab) => pathname === '/admin' && currentTab === tab, [pathname, currentTab])

  // Sidebar preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_PREF_KEY)
      if (saved !== null) setCollapsed(saved === 'true')
    } catch (err) {
      console.warn('[admin-shell] Could not read sidebar preference:', err)
    }
  }, [])

  const toggleSidebar = () =>
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_PREF_KEY, String(next))
      } catch (err) {
        console.warn('[admin-shell] Could not store sidebar preference:', err)
      }
      return next
    })

  // Document title per tab. Next's root metadata rewrites <title> after client
  // navigation, so re-assert ours whenever the head changes while mounted.
  useEffect(() => {
    const wanted = `${meta.label} · ${siteConfig.name} Studio`
    const apply = () => {
      if (document.title !== wanted) document.title = wanted
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [meta.label])

  // Route change: move focus to the view heading.
  useEffect(() => {
    // Only on an in-app tab change (not on first load; StrictMode-safe).
    if (prevTabRef.current === currentTab) return
    prevTabRef.current = currentTab
    titleRef.current?.focus()
  }, [currentTab])

  // User menu: Escape closes and returns focus to the trigger; outside press closes.
  useEffect(() => {
    if (!userMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        userMenuTriggerRef.current?.focus()
      }
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (userMenuRef.current?.contains(target) || userMenuTriggerRef.current?.contains(target)) return
      setUserMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [userMenuOpen])

  // Mobile drawer: native modal dialog (focus trap, Escape, inert background).
  useEffect(() => {
    const d = drawerRef.current
    if (!d) return
    if (mobileMenuOpen && !d.open) d.showModal()
    if (!mobileMenuOpen && d.open) d.close()
  }, [mobileMenuOpen])

  const openProfile = () => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    setProfileModalOpen(true)
  }
  const openLogout = () => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    setLogoutOpen(true)
  }

  return (
    <div className="studio-admin flex h-[100dvh] w-full overflow-hidden bg-[var(--studio-bg)] font-sans text-sm text-white antialiased selection:bg-accent-400/40">
      <a href="#studio-main" className="studio-skip-link">
        Lewati ke konten utama
      </a>

      {/* ----------------------- Desktop rail ----------------------- */}
      <aside
        aria-label="Studio"
        className={`z-30 hidden h-full shrink-0 flex-col border-r border-white/[0.08] bg-[var(--studio-sidebar-bg)] md:flex ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center' : 'px-4'}`}>
          <Link href="/admin" className="flex items-center gap-3 rounded-xl" aria-label={`${siteConfig.name} Studio, ringkasan`}>
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
              <Image src="/favicon.svg" alt="" width={26} height={26} className="object-contain p-0.5" />
            </span>
            {!collapsed && <span className="text-sm font-semibold tracking-tight">{siteConfig.name} Studio</span>}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Navigasi admin">
          <NavGroups groups={visibleGroups} collapsed={collapsed} isActive={isActive} />
        </nav>

        <div className="relative shrink-0 space-y-1.5 border-t border-white/[0.08] p-2.5">
          <button
            ref={userMenuTriggerRef}
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-expanded={userMenuOpen}
            aria-controls="studio-user-menu"
            aria-label={collapsed ? `Menu akun: ${actorName || 'Admin'}, ${roleLabel}` : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors ${
              collapsed ? 'justify-center' : ''
            } ${userMenuOpen ? 'bg-white/10' : 'hover:bg-white/[0.06]'}`}
          >
            <Avatar name={actorName || ''} size="h-8 w-8" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-xs font-semibold leading-tight text-white">{actorName || 'Admin'}</span>
                  <span className="mt-0.5 block text-[11px] text-neutral-300">{roleLabel}</span>
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            className={`flex min-h-9 w-full items-center gap-2 rounded-xl px-2 text-[12px] text-neutral-300 hover:bg-white/[0.06] hover:text-white ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            )}
            <span className={collapsed ? 'sr-only' : ''}>{collapsed ? 'Tampilkan label menu' : 'Sembunyikan label menu'}</span>
          </button>

          {userMenuOpen && (
            <div
              ref={userMenuRef}
              id="studio-user-menu"
              className={`absolute bottom-2 z-[95] w-64 rounded-2xl border border-white/15 bg-surface-overlay p-1.5 text-xs text-white shadow-2xl ${
                collapsed ? 'left-[76px]' : 'left-[244px]'
              }`}
            >
              <div className="border-b border-white/[0.08] p-2.5">
                <p className="break-words font-semibold text-white">{actorName || 'Admin'}</p>
                <p className="mt-0.5 break-all text-[11px] text-neutral-300">{email || '—'}</p>
                <p className="mt-1 text-[11px] text-neutral-300">Peran: {roleLabel}</p>
              </div>
              <ul className="space-y-0.5 p-1">
                <li>
                  <button
                    type="button"
                    onClick={openProfile}
                    className="flex min-h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-neutral-100 hover:bg-white/10"
                  >
                    <User className="h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
                    Profil &amp; kata sandi
                  </button>
                </li>
                <li>
                  <a
                    href={siteConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex min-h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-neutral-100 hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
                    Lihat situs publik
                    <span className="sr-only">(tab baru)</span>
                  </a>
                </li>
                <li className="border-t border-white/[0.08] pt-1">
                  <button
                    type="button"
                    onClick={openLogout}
                    className="flex min-h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Keluar dari Studio
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </aside>

      {/* ----------------------- Mobile drawer ----------------------- */}
      <dialog
        ref={drawerRef}
        aria-label="Menu Studio"
        onCancel={(e) => {
          e.preventDefault()
          setMobileMenuOpen(false)
        }}
        onClose={() => setMobileMenuOpen(false)}
        onMouseDown={(e) => e.target === e.currentTarget && setMobileMenuOpen(false)}
        className="studio-admin m-0 ml-0 h-[100dvh] max-h-[100dvh] w-[min(20rem,88vw)] border-r border-white/10 bg-[var(--studio-sidebar-bg)] p-0 text-white backdrop:bg-black/70 md:hidden"
      >
        {mobileMenuOpen && (
          <div className="flex h-full flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
              <span className="text-sm font-semibold">{siteConfig.name} Studio</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto px-3 py-3">
              <NavGroups
                groups={visibleGroups}
                collapsed={false}
                isActive={isActive}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </nav>
            <div className="shrink-0 space-y-1 border-t border-white/[0.08] p-3">
              <p className="px-2 pb-1 text-xs">
                <span className="block break-words font-semibold">{actorName || 'Admin'}</span>
                <span className="block text-neutral-300">{roleLabel}</span>
              </p>
              <button
                type="button"
                onClick={openProfile}
                className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-neutral-100 hover:bg-white/10"
              >
                <User className="h-4 w-4 text-accent-300" aria-hidden="true" />
                Profil &amp; kata sandi
              </button>
              <button
                type="button"
                onClick={openLogout}
                className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar dari Studio
              </button>
            </div>
          </div>
        )}
      </dialog>

      {/* ----------------------- Main column ----------------------- */}
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex min-h-14 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-[var(--studio-topbar-bg)] px-3 py-2 sm:px-6 md:min-h-16 lg:px-10">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Buka menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-100 hover:bg-white/10 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <HeaderIcon className="hidden h-5 w-5 shrink-0 text-accent-300 sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h1
              ref={titleRef}
              tabIndex={-1}
              id="studio-page-title"
              className="break-words font-heading text-base font-semibold leading-tight tracking-tight focus:outline-none"
            >
              {meta.label}
            </h1>
            <p className="mt-0.5 hidden text-xs text-neutral-300 lg:block">{meta.description}</p>
          </div>
          <Link
            href="/admin/buat-artikel"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-accent-500 px-3.5 text-xs font-semibold text-accent-950 transition-colors hover:bg-accent-300"
          >
            <PenSquare className="h-4 w-4" aria-hidden="true" />
            <span>
              Tulis<span className="hidden sm:inline"> artikel</span>
            </span>
          </Link>
        </header>

        <main
          id="studio-main"
          tabIndex={-1}
          aria-labelledby="studio-page-title"
          className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 focus:outline-none sm:p-6 lg:p-10"
        >
          <div className="mx-auto w-full max-w-[1760px]">{children}</div>
        </main>
      </div>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Keluar dari Studio?"
        description="Perubahan yang belum disimpan di tab lain akan hilang."
        icon={LogOut}
        tone="danger"
        footer={
          <>
            <TextButton onClick={() => setLogoutOpen(false)}>Batal</TextButton>
            <TextButton
              tone="danger"
              onClick={() => {
                setLogoutOpen(false)
                logout()
              }}
            >
              Keluar
            </TextButton>
          </>
        }
      />

      <UserProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userRole={role}
        userName={actorName || ''}
        userEmail={email || ''}
        permissions={permissions}
      />
    </div>
  )
}

function AdminLayoutShell({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const isExcluded = pathname === '/admin/login' || Boolean(pathname?.startsWith('/admin/preview'))

  useEffect(() => {
    if (!isExcluded && !isAuthenticated) {
      const timer = setTimeout(() => {
        router.replace(`/admin/login?callbackUrl=${encodeURIComponent(pathname || '/admin')}`)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isExcluded, isAuthenticated, pathname, router])

  if (!isExcluded && !isAuthenticated) {
    return (
      <div className="studio-admin flex h-[100dvh] w-full items-center justify-center bg-[var(--studio-bg)] font-sans text-xs text-neutral-300">
        <div role="status" className="flex flex-col items-center gap-3">
          <div aria-hidden="true" className="h-6 w-6 rounded-full border-2 border-accent-400 border-t-transparent motion-safe:animate-spin" />
          <span>Memeriksa sesi login…</span>
        </div>
      </div>
    )
  }

  if (isExcluded || pathname?.startsWith('/admin/buat-artikel')) return <>{children}</>
  return <AdminNavContent>{children}</AdminNavContent>
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-surface-elevated font-mono text-xs text-neutral-300">
          Memuat Studio…
        </div>
      }
    >
      <AuthProvider>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </AuthProvider>
    </Suspense>
  )
}
