'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import {
  FileText,
  PlusCircle,
  ExternalLink,
  LogOut,
  Layers,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import '@/styles/admin.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [postCount, setPostCount] = useState<number | null>(null)

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/'

  useEffect(() => {
    // If login page, don't block
    if (isLoginPage) {
      setLoading(false)
      return
    }

    // Check active session
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/admin/login/')
      } else {
        setUser(session.user)
        setLoading(false)
        fetchMetrics()
      }
    })

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        router.replace('/admin/login/')
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, isLoginPage, router])

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/admin/stats/')
      if (res.ok) {
        const data = await res.json()
        setPostCount(data.total)
      }
    } catch {
      // ignore
    }
  }

  async function handleLogout() {
    await supabaseBrowser.auth.signOut()
    router.replace('/admin/login/')
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="admin-scope" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--adm-emerald)' }} />
      </div>
    )
  }

  const currentPath = pathname || ''

  // Derive breadcrumb text
  let pageTitle = 'Articles'
  if (currentPath.includes('/admin/posts/new')) {
    pageTitle = 'New Article'
  } else if (currentPath.includes('/admin/posts/')) {
    pageTitle = 'Edit Article'
  }

  return (
    <div className="admin-scope adm-shell">
      {/* Sidebar */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar__header">
          <div className="adm-sidebar__logo-badge">
            <Layers size={16} />
          </div>
          <span className="adm-sidebar__brand">UNIMASI</span>
          <span className="adm-sidebar__cms-pill">Studio</span>
        </div>

        <nav className="adm-sidebar__nav">
          <Link
            href="/admin/"
            className={`adm-nav-item ${currentPath === '/admin' || currentPath === '/admin/' ? 'active' : ''}`}
          >
            <FileText size={16} />
            <span>Articles</span>
            {postCount !== null && (
              <span className="adm-nav-badge">{postCount.toLocaleString()}</span>
            )}
          </Link>

          <Link
            href="/admin/posts/new/"
            className={`adm-nav-item ${currentPath.includes('/admin/posts/new') ? 'active' : ''}`}
          >
            <PlusCircle size={16} />
            <span>New Article</span>
          </Link>

          <div style={{ height: '1px', background: 'var(--adm-border-subtle)', margin: '0.75rem 0' }} />

          <a
            href="/journal/"
            target="_blank"
            rel="noopener noreferrer"
            className="adm-nav-item"
          >
            <ExternalLink size={16} />
            <span>Live Articles</span>
          </a>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="adm-nav-item"
          >
            <ExternalLink size={16} />
            <span>Live Website</span>
          </a>
        </nav>

        <div className="adm-sidebar__footer">
          <div className="adm-user-profile">
            <div className="adm-user-avatar">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="adm-user-info">
              <span className="adm-user-name">{user?.email || 'Administrator'}</span>
              <span className="adm-user-role">Super Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="adm-btn adm-btn--ghost adm-btn--sm"
              title="Sign Out"
              style={{ padding: '0.35rem', marginLeft: 'auto' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="adm-main">
        {/* Topbar */}
        <header className="adm-topbar">
          <div className="adm-breadcrumbs">
            <span>Admin</span>
            <ChevronRight size={14} />
            <span>{pageTitle}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/admin/posts/new/" className="adm-btn adm-btn--primary adm-btn--sm">
              <PlusCircle size={14} />
              <span>New Article</span>
            </Link>
          </div>
        </header>

        {/* Content Page */}
        <main className="adm-content">{children}</main>
      </div>
    </div>
  )
}
