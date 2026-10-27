'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Edit3,
  ExternalLink,
  Trash2,
  PlusCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'

interface PostSummary {
  id: number
  slug: string
  title: string
  status: string
  category_name: string
  author_name: string
  featured_image_url: string | null
  published_at: string
  updated_at: string
}

interface StatsData {
  total: number
  published: number
  drafts: number
  categories: string[]
}

export default function AdminPostsPage() {
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    published: 0,
    drafts: 0,
    categories: [],
  })

  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'publish' | 'draft'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats/')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // ignore
    }
  }, [])

  // Load posts
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '15',
        status: statusFilter,
        category: categoryFilter,
        search: debouncedSearch,
      })

      const res = await fetch(`/api/admin/posts/?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.totalCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, categoryFilter, debouncedSearch])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  async function handleDelete(id: number, title: string) {
    if (!window.confirm(`Are you sure you want to permanently delete:\n"${title}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/posts/${id}/`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
        fetchStats()
      } else {
        const err = await res.json()
        alert(`Error deleting post: ${err.error}`)
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  function formatDate(iso: string) {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Header Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--adm-text-primary)', marginBottom: '0.2rem' }}>
            Articles Overview
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--adm-text-muted)' }}>
            Manage, edit, publish, and optimize your studio articles and tutorials.
          </p>
        </div>

        <Link href="/admin/posts/new/" className="adm-btn adm-btn--primary">
          <PlusCircle size={16} />
          <span>Write New Article</span>
        </Link>
      </div>

      {/* Metrics Row (Supabase Studio style) */}
      <div className="adm-metrics-grid">
        <div className="adm-metric-card">
          <div className="adm-metric-card__label">
            <span>Total Articles</span>
            <FileText size={16} style={{ color: 'var(--adm-text-muted)' }} />
          </div>
          <div className="adm-metric-card__value">
            {stats.total.toLocaleString()}
          </div>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-card__label">
            <span>Published</span>
            <CheckCircle2 size={16} style={{ color: 'var(--adm-emerald)' }} />
          </div>
          <div className="adm-metric-card__value" style={{ color: 'var(--adm-emerald)' }}>
            {stats.published.toLocaleString()}
          </div>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-card__label">
            <span>Drafts</span>
            <Clock size={16} style={{ color: 'var(--adm-amber)' }} />
          </div>
          <div className="adm-metric-card__value" style={{ color: 'var(--adm-amber)' }}>
            {stats.drafts.toLocaleString()}
          </div>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-card__label">
            <span>Categories</span>
            <Layers size={16} style={{ color: 'var(--adm-text-muted)' }} />
          </div>
          <div className="adm-metric-card__value">
            {stats.categories.length.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="adm-table-wrap">
        {/* Toolbar */}
        <div className="adm-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--adm-text-muted)',
                }}
              />
              <input
                type="text"
                className="adm-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Search articles by title or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            {stats.categories.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Filter size={14} style={{ color: 'var(--adm-text-muted)' }} />
                <select
                  className="adm-select"
                  style={{ width: 'auto', minWidth: '150px' }}
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All Categories</option>
                  {stats.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Status Filter Tabs (shadcn style) */}
          <div className="adm-table-filters">
            <button
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
              className={`adm-btn adm-btn--sm ${statusFilter === 'all' ? 'adm-btn--secondary' : 'adm-btn--ghost'}`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => {
                setStatusFilter('publish')
                setPage(1)
              }}
              className={`adm-btn adm-btn--sm ${statusFilter === 'publish' ? 'adm-btn--secondary' : 'adm-btn--ghost'}`}
              style={statusFilter === 'publish' ? { borderColor: 'var(--adm-emerald-border)', color: 'var(--adm-emerald)' } : {}}
            >
              Published ({stats.published})
            </button>
            <button
              onClick={() => {
                setStatusFilter('draft')
                setPage(1)
              }}
              className={`adm-btn adm-btn--sm ${statusFilter === 'draft' ? 'adm-btn--secondary' : 'adm-btn--ghost'}`}
              style={statusFilter === 'draft' ? { borderColor: 'var(--adm-amber-border)', color: 'var(--adm-amber)' } : {}}
            >
              Drafts ({stats.drafts})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', gap: '0.75rem', color: 'var(--adm-text-muted)' }}>
            <Loader2 className="animate-spin" size={20} style={{ color: 'var(--adm-emerald)' }} />
            <span>Loading articles...</span>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--adm-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              No articles found matching your criteria.
            </p>
            <Link href="/admin/posts/new/" className="adm-btn adm-btn--primary adm-btn--sm">
              <PlusCircle size={14} />
              <span>Create First Article</span>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Cover</th>
                  <th>Title & Slug</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Published Date</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      {post.featured_image_url ? (
                        <img
                          src={post.featured_image_url}
                          alt=""
                          className="adm-table-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="adm-table-thumb"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--adm-text-muted)',
                          }}
                        >
                          <FileText size={16} />
                        </div>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/posts/${post.id}/`}
                        className="adm-table-title"
                        style={{ textDecoration: 'none' }}
                      >
                        {post.title}
                      </Link>
                      <div className="adm-table-slug">/{post.slug}/</div>
                    </td>
                    <td>
                      <span className="adm-badge adm-badge--category">
                        {post.category_name || 'Articles'}
                      </span>
                    </td>
                    <td>
                      {post.status === 'publish' ? (
                        <span className="adm-badge adm-badge--published">Published</span>
                      ) : (
                        <span className="adm-badge adm-badge--draft">Draft</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--adm-text-secondary)', fontSize: '0.78rem' }}>
                      {formatDate(post.published_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <Link
                          href={`/admin/posts/${post.id}/`}
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          title="Edit Article"
                          style={{ padding: '0.35rem' }}
                        >
                          <Edit3 size={15} />
                        </Link>

                        <a
                          href={`/${post.slug}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          title="View Live Article"
                          style={{ padding: '0.35rem' }}
                        >
                          <ExternalLink size={15} />
                        </a>

                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deletingId === post.id}
                          className="adm-btn adm-btn--danger adm-btn--sm"
                          title="Delete Article"
                          style={{ padding: '0.35rem' }}
                        >
                          {deletingId === post.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--adm-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--adm-text-muted)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            Showing <strong style={{ color: 'var(--adm-text-primary)' }}>{posts.length}</strong> of{' '}
            <strong style={{ color: 'var(--adm-text-primary)' }}>{totalCount.toLocaleString()}</strong> articles
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ marginRight: '0.5rem' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="adm-btn adm-btn--secondary adm-btn--sm"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="adm-btn adm-btn--secondary adm-btn--sm"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
