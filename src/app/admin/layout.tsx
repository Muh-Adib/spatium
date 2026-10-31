'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext'
import { StudioAiSidebar } from '@/components/studio/StudioAiSidebar'
import { StudioAiKeyPromptModal } from '@/components/studio/StudioAiKeyPromptModal'
import { Tooltip } from '@/components/ui/Tooltip'
import { siteConfig } from '@/config/site'
import { IconButton, Modal, TextButton } from '@/components/admin/AdminUi'
import { UserProfileModal } from '@/components/admin/UserProfileModal'
import {
  NAV_GROUPS,
  TAB_META,
  WRITE_ARTICLE_META,
  ROLE_META,
  isAdminTab,
  tabHref,
  type AdminTab,
} from '@/lib/admin/tabs'
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  Info,
  LogOut,
  Menu,
  PenSquare,
  User,
  Users,
  X,
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

/**
 * Mode AI Copilot:
 * - idle     : tertutup
 * - widget   : chat mini melayang
 * - docked   : panel di sisi kanan (bisa digeser)
 * - expanded : panel besar
 */
type AiMode = 'idle' | 'widget' | 'docked' | 'expanded'

const initials = (name: string) =>
  (name || 'UNIMASI')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UN'

function AdminNavContent({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { role, actorName, email, logout, isAuthenticated, permissions } = useAuth()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true) // rail ikon sebagai default
  const [aiMode, setAiMode] = useState<AiMode>('idle')
  const [aiWidth, setAiWidth] = useState(440)
  const [isResizing, setIsResizing] = useState(false)

  const isWritePage = pathname === '/admin/buat-artikel'
  const tabParam = searchParams?.get('tab') ?? null
  const currentTab: AdminTab = isAdminTab(tabParam) ? tabParam : 'overview'
  const meta = isWritePage ? WRITE_ARTICLE_META : TAB_META[currentTab]
  const HeaderIcon = meta.icon

  const roleMeta = ROLE_META[role as string] || ROLE_META.AUTHOR
  const roleLabel = isAuthenticated ? roleMeta.label : 'Memeriksa akun'
  const RoleIcon = roleMeta.icon

  // Simpan preferensi sidebar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('segia_sidebar_collapsed')
      if (saved !== null) setCollapsed(saved === 'true')
    } catch {}
  }, [])

  // Tutup user menu saat klik di luar atau tekan Esc
  useEffect(() => {
    if (!userMenuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setUserMenuOpen(false)
    const onClick = (e: MouseEvent) => {
      const el = document.getElementById('segia-user-menu-popover')
      const trigger = document.getElementById('segia-user-menu-trigger')
      if (el && !el.contains(e.target as Node) && trigger && !trigger.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [userMenuOpen])

  const toggleSidebar = () =>
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('segia_sidebar_collapsed', String(next))
      } catch {}
      return next
    })

  const isAiOpen = aiMode !== 'idle'
  const toggleAi = () => setAiMode((prev) => (prev === 'idle' ? 'docked' : 'idle'))

  // Esc menutup mode expanded / widget
  useEffect(() => {
    if (aiMode !== 'expanded' && aiMode !== 'widget') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setAiMode((prev) => (prev === 'expanded' ? 'docked' : 'idle'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiMode])

  // Drag resizer panel AI
  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: MouseEvent) => {
      const max = Math.floor(window.innerWidth * 0.65)
      setAiWidth(Math.min(Math.max(window.innerWidth - e.clientX, 320), max))
    }
    const onUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const isActive = (tab: AdminTab) =>
    (pathname === '/admin' && currentTab === tab) || (isWritePage && tab === 'articles')

  const avatar = (size: string) => (
    <span className="relative inline-flex shrink-0">
      <span className={`${size} flex items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-accent-950 ring-1 ring-white/15`}>
        {initials(actorName || '')}
      </span>
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[var(--studio-sidebar-bg)]" />
    </span>
  )

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--studio-bg)] font-sans text-sm text-white antialiased selection:bg-accent-500 selection:text-white md:flex-row">
      {/* ----------------------- 1. ICON RAIL (desktop) ----------------------- */}
      <aside
        className={`z-30 hidden h-full shrink-0 flex-col border-r border-white/[0.06] bg-[var(--studio-sidebar-bg)] transition-[width] duration-200 md:flex ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center' : 'px-4'}`}>
          <Tooltip side="right" label={`${siteConfig.name} Studio`} disabled={!collapsed}>
            <Link href="/admin" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
                <Image src="/logo/unimasi-yellow.webp" alt="UNIMASI" width={26} height={26} className="object-contain p-0.5" />
              </span>
              {!collapsed && <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>}
            </Link>
          </Tooltip>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-none" aria-label="Navigasi admin">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id} className={gi > 0 ? 'mt-3 border-t border-white/[0.06] pt-3' : ''}>
              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const m = TAB_META[tab]
                  const Icon = m.icon
                  const active = isActive(tab)
                  return (
                    <Tooltip key={tab} side="right" label={m.label} hint={m.description} disabled={!collapsed} className="w-full">
                      <Link
                        href={tabHref(tab)}
                        aria-label={m.label}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex h-10 w-full items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${
                          collapsed ? 'justify-center' : 'gap-3 px-3'
                        } ${active ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/[0.05] hover:text-white'}`}
                      >
                        {active && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-accent-400" />}
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-accent-400' : ''}`} aria-hidden="true" />
                        {!collapsed && <span className="truncate text-[13px] font-medium">{m.label}</span>}
                      </Link>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: akun & menu profil minimalis */}
        <div className="shrink-0 border-t border-white/[0.06] p-2.5">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Tooltip side="right" label={actorName || 'Admin'} hint={`${roleLabel} · Menu Akun`}>
                <button
                  id="segia-user-menu-trigger"
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className={`relative rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                    userMenuOpen ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-[var(--studio-sidebar-bg)]' : 'hover:opacity-90'
                  }`}
                >
                  {avatar('h-9 w-9')}
                </button>
              </Tooltip>
              <IconButton
                icon={ChevronRight}
                label="Perluas sidebar"
                size="sm"
                side="right"
                onClick={toggleSidebar}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                id="segia-user-menu-trigger"
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className={`flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                  userMenuOpen
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/15'
                    : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {avatar('h-8 w-8')}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold leading-tight text-white">{actorName || 'Admin'}</p>
                  <span className="truncate text-[10px] text-neutral-400 block mt-0.5">{roleLabel}</span>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden="true" />
              </button>
              <div className="flex items-center justify-between px-1.5 pt-0.5 text-xs text-neutral-500">
                <span className="font-mono text-[10px]">UNIMASI Studio</span>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Perkecil</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ----------------------- USER MENU POPOVER ----------------------- */}
      {userMenuOpen && (
        <div
          id="segia-user-menu-popover"
          style={{
            left: collapsed ? '80px' : '10px',
            bottom: collapsed ? '16px' : '76px',
            width: collapsed ? '260px' : '220px',
          }}
          className="fixed z-[95] overflow-hidden rounded-2xl border border-white/10 bg-[#161616]/95 p-1.5 text-xs text-white shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header Info */}
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] p-2.5">
            {avatar('h-8 w-8')}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white leading-tight">{actorName || 'Admin'}</p>
              <p className="truncate text-[10px] text-neutral-400 mt-0.5">{email || 'admin@unimasi.com'}</p>
              <span className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium border ${roleMeta.badge}`}>
                <RoleIcon className="h-2.5 w-2.5" />
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5 p-1">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false)
                setProfileModalOpen(true)
              }}
              className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <User className="h-4 w-4 text-sky-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block font-medium">Profil &amp; Keamanan</span>
                <span className="block text-[10px] text-neutral-500 group-hover:text-neutral-400">Nama, email &amp; kata sandi</span>
              </div>
            </button>

            {(role === 'SUPER_ADMIN' || role === 'CONTENT_ADMIN') && (
              <Link
                href="/admin?tab=users"
                onClick={() => setUserMenuOpen(false)}
                className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Users className="h-4 w-4 text-purple-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block font-medium">Manajemen Pengguna</span>
                  <span className="block text-[10px] text-neutral-500 group-hover:text-neutral-400">Tambah &amp; kelola tim</span>
                </div>
              </Link>
            )}

            <a
              href={siteConfig.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setUserMenuOpen(false)}
              className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 text-neutral-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block font-medium">Lihat Situs Publik</span>
                <span className="block text-[10px] text-neutral-500 group-hover:text-neutral-400">Buka beranda di tab baru</span>
              </div>
            </a>
          </div>

          {/* Logout Action */}
          <div className="border-t border-white/[0.06] p-1">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false)
                setLogoutOpen(true)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="font-medium">Keluar dari Studio</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------------- 2. MOBILE TOPBAR & DRAWER ----------------------- */}
      <div className="md:hidden">
        {(aiMode === 'docked' || aiMode === 'expanded' || aiMode === 'widget') && (
          <StudioAiSidebar
            isOpen
            variant="drawer"
            pageContext={{
              title: meta.label,
              slug: currentTab,
              locale: 'id',
              status: 'active',
              category: meta.label,
              locationName: `Admin Workspace: ${meta.label} (/admin?tab=${currentTab})`,
            }}
            onClose={() => setAiMode('idle')}
            onOpenWidget={() => setAiMode('widget')}
          />
        )}
      </div>

      <div className="z-40 flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[var(--studio-sidebar-bg)] px-4 py-2.5 md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-white/10">
            <Image src="/logo/unimasi-yellow.webp" alt="UNIMASI" width={24} height={24} className="object-contain p-0.5" />
          </span>
          <span className="text-xs font-semibold">{meta.label}</span>
        </Link>
        <div className="flex items-center gap-1">
          <IconButton icon={Bot} label="AI Copilot" active={isAiOpen} onClick={toggleAi} side="bottom" />
          <IconButton
            icon={mobileMenuOpen ? X : Menu}
            label="Menu"
            active={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            side="bottom"
          />
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="z-30 shrink-0 space-y-3 border-b border-white/[0.06] bg-[var(--studio-sidebar-bg)] p-4 md:hidden">
          <div className="grid grid-cols-4 gap-2">
            {NAV_GROUPS.flatMap((g) => g.tabs).map((tab) => {
              const m = TAB_META[tab]
              const Icon = m.icon
              const active = isActive(tab)
              return (
                <Link
                  key={tab}
                  href={tabHref(tab)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] ${
                    active ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-accent-400' : ''}`} aria-hidden="true" />
                  <span className="max-w-full truncate">{m.label}</span>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                setProfileModalOpen(true)
              }}
              className="flex items-center gap-2 text-left text-xs text-neutral-300 hover:text-white"
            >
              {avatar('h-7 w-7')}
              <div className="min-w-0">
                <span className="block font-medium text-white truncate max-w-[140px]">{actorName || 'Admin'}</span>
                <span className="block text-[10px] text-neutral-400">{roleLabel}</span>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <IconButton icon={ExternalLink} label="Situs publik" href="/" external />
              <IconButton
                icon={LogOut}
                label="Keluar"
                tone="danger"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setLogoutOpen(true)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ----------------------- 3. KONTEN UTAMA ----------------------- */}
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 hidden h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[var(--studio-topbar-bg)] px-6 backdrop-blur-xl md:flex lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <HeaderIcon className="h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
            <h1 className="truncate text-base font-semibold tracking-tight">{meta.label}</h1>
            <Tooltip side="bottom" label={meta.label} hint={meta.description}>
              <span tabIndex={0} aria-label="Keterangan halaman" className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/10 hover:text-white">
                <Info className="h-4 w-4" aria-hidden="true" />
              </span>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <IconButton icon={Bot} label="AI Copilot" hint="Buka atau tutup asisten AI" active={isAiOpen} onClick={toggleAi} side="bottom" />
            {!isWritePage && (
              <Tooltip side="bottom" label="Tulis artikel baru" hint={WRITE_ARTICLE_META.description}>
                <Link
                  href="/admin/buat-artikel"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-sky-400 hover:to-blue-500"
                >
                  <PenSquare className="h-4 w-4" aria-hidden="true" />
                  <span>Tulis</span>
                </Link>
              </Tooltip>
            )}
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-[1760px]">{children}</div>
        </main>
      </div>

      {/* ----------------------- 4. AI COPILOT ----------------------- */}
      {aiMode === 'docked' && (
        <>
          <div
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
            className={`group z-20 hidden w-1.5 shrink-0 cursor-col-resize select-none items-center justify-center bg-white/5 transition-all hover:w-2 hover:bg-accent-500/60 md:flex ${
              isResizing ? 'w-2 bg-accent-500' : ''
            }`}
            title="Geser untuk mengatur lebar"
          >
            <div className="h-10 w-0.5 rounded-full bg-white/20 group-hover:bg-accent-300" />
          </div>
          <div
            style={{ width: `${aiWidth}px` }}
            className="relative z-20 hidden h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.06] bg-[#1E1E1E] md:flex"
          >
            <StudioAiSidebar
              isOpen
              variant="panel"
              pageContext={{
                title: meta.label,
                slug: currentTab,
                locale: 'id',
                status: 'active',
                category: meta.label,
                locationName: `Admin Workspace: ${meta.label} (/admin?tab=${currentTab})`,
              }}
              onClose={() => setAiMode('idle')}
              onExpand={() => setAiMode('expanded')}
              onOpenWidget={() => setAiMode('widget')}
            />
          </div>
        </>
      )}

      {aiMode === 'expanded' && (
        <>
          <div className="fixed inset-0 z-40 hidden bg-black/60 backdrop-blur-sm md:block" onClick={() => setAiMode('docked')} aria-hidden="true" />
          <div className="fixed inset-y-0 right-0 z-50 hidden w-[min(780px,calc(100vw-6rem))] flex-col border-l border-white/10 bg-[#1E1E1E] shadow-2xl shadow-black/80 md:flex">
            <StudioAiSidebar
              isOpen
              variant="panel"
              isExpanded
              pageContext={{
                title: meta.label,
                slug: currentTab,
                locale: 'id',
                status: 'active',
                category: meta.label,
                locationName: `Admin Workspace: ${meta.label} (/admin?tab=${currentTab})`,
              }}
              onClose={() => setAiMode('idle')}
              onCollapse={() => setAiMode('docked')}
              onOpenWidget={() => setAiMode('widget')}
            />
          </div>
        </>
      )}

      {aiMode === 'widget' && (
        <div className="fixed bottom-4 right-4 z-50 hidden h-[min(560px,calc(100vh-6rem))] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/80 md:block">
          <StudioAiSidebar
            isOpen
            variant="widget"
            pageContext={{
              title: meta.label,
              slug: currentTab,
              locale: 'id',
              status: 'active',
              category: meta.label,
              locationName: `Admin Workspace: ${meta.label} (/admin?tab=${currentTab})`,
            }}
            onClose={() => setAiMode('idle')}
            onOpenPanel={() => setAiMode('docked')}
          />
        </div>
      )}

      {/* ----------------------- 4b. ADAPTIVE FLOATING AI COPILOT PILL ----------------------- */}
      {aiMode === 'idle' && (
        <div className="fixed bottom-5 right-5 z-30 hidden md:block">
          <Tooltip label="Buka AI Copilot Adaptif" hint={`Bantu analisa kontekstual seputar ${meta.label}`} side="left">
            <button
              type="button"
              onClick={toggleAi}
              className="group flex items-center gap-2.5 rounded-full border border-accent-400/30 bg-[#1A1A1A]/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl shadow-black/80 backdrop-blur transition-all hover:border-accent-400 hover:bg-[#242424] hover:shadow-accent-500/20 active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <Bot className="h-4 w-4 text-accent-400 transition-transform group-hover:scale-110" />
              <span>Tanya AI</span>
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                {meta.label}
              </span>
            </button>
          </Tooltip>
        </div>
      )}

      {/* ----------------------- 5. KONFIRMASI KELUAR ----------------------- */}
      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Akhiri sesi admin?"
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

      {/* ----------------------- 6. MODAL PROFIL & PENGATURAN USER ----------------------- */}
      <UserProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userRole={role as string}
        userName={actorName || ''}
        userEmail={email || ''}
        permissions={{
          canPublish: permissions.canPublish,
          canDeleteArticle: permissions.canDeleteArticle,
          canApprove: permissions.canApprove,
          canReview: permissions.canReview,
          canManageRedirects: permissions.canManageRedirects,
          canManageSeo: permissions.canManageSeo,
        }}
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
        if (!isAuthenticated && typeof window !== 'undefined') {
          router.replace(`/admin/login?callbackUrl=${encodeURIComponent(pathname || '/admin')}`)
        }
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isExcluded, isAuthenticated, pathname, router])

  if (!isExcluded && !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#030611] font-sans text-xs text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow border-t-transparent" />
          <span>Memverifikasi autentikasi UNIMASI Studio...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {isExcluded ? (
        children
      ) : pathname?.startsWith('/admin/buat-artikel') ? (
        children
      ) : (
        <AdminNavContent>{children}</AdminNavContent>
      )}
      {!isExcluded && <StudioAiKeyPromptModal />}
    </>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#222222] font-mono text-xs text-neutral-400">
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
